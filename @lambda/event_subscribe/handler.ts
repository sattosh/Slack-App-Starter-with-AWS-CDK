import { SQSClient, SendMessageCommand } from '@aws-sdk/client-sqs';
import { App, AwsLambdaReceiver, LogLevel, Middleware, SlackEventMiddlewareArgs } from '@slack/bolt';
import { Blocks, HomeTab } from 'slack-block-builder';

const sqs = new SQSClient({});

// レシーバーを初期化
const awsLambdaReceiver = new AwsLambdaReceiver({ signingSecret: process.env.SLACK_SIGNING_SECRET || '' });

// ボットトークンと、AWS Lambda に対応させたレシーバーを使ってアプリを初期化
const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  receiver: awsLambdaReceiver,
  processBeforeResponse: true,
  logLevel: LogLevel.DEBUG,
});

/// 以下イベントの設定
// ミドルウェアを使って、処理の共通化も可能(複数入れることも可)
/** ユーザーのみの　メッセージのみ処理するミドルウェア */
const onlyUserMessage: Middleware<SlackEventMiddlewareArgs<'message'>> = async ({ next, body }) => {
  // なぜか型にはないがbodyからbotのメッセセージかどうかを判定できるようになっている
  // @ts-ignore
  if (!body.event?.bot_id && !body.event?.bot_profile) await next();
};

// メッセージが送信されたとkの処理
// SQSにメッセージを送信する
app.message(/.+/, onlyUserMessage, async ({ message, event }) => {
  // subtypeの種類は https://api.slack.com/events/message　を参照　（何もない場合は通常メッセージ)
  if (message.subtype !== undefined) return;
  const params = {
    QueueUrl: process.env.REPLY_QUEUE_URL as string,
    MessageDeduplicationId: `${event.event_ts}-${event.channel}`,
    MessageBody: JSON.stringify({
      channel: message.channel,
      text: message.text || '',
    }),
  };
  await sqs.send(new SendMessageCommand(params));
});

// ボットユーザがメンションが来たときの処理
app.event('app_mention', async ({ say }) => {
  await say({
    text: 'Hello world!',
  });
});

// Hometabを開いた時に表示するたの処理
app.event('app_home_opened', async ({ event, client, context }) => {
  await client.views.publish({
    user_id: event.user,
    token: context.botToken,
    view: HomeTab({ callbackId: 'home_tab' })
      .blocks(Blocks.Header({ text: 'HomeTab' }), Blocks.Section({ text: 'HomeTabを開いた時の処理' }))
      .buildToObject(),
  });
});

module.exports.handler = awsLambdaReceiver.toHandler();
