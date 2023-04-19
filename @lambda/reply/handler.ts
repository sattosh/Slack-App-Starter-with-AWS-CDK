import { SQSHandler } from 'aws-lambda';
import { WebClient } from '@slack/web-api';

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN as string);

export const handler: SQSHandler = async ({ Records }) => {
  // SQSからのメッセージを取得
  const messages = Records.map((record) => JSON.parse(record.body));

  // メッセージをSlackに投稿
  await Promise.all(
    messages.map(async (message) => {
      await slackClient.chat.postMessage({
        channel: message.channel,
        text: message.text,
      });
    })
  );
};
