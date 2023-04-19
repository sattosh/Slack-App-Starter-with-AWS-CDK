import * as cdk from 'aws-cdk-lib';
import * as dotenv from 'dotenv';
import { Construct } from 'constructs';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as sqs from 'aws-cdk-lib/aws-sqs';
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs';
import { SqsEventSource } from 'aws-cdk-lib/aws-lambda-event-sources';

export class SlackAppStarterWithAwsCdkStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    dotenv.config({});
    if (!process.env.SLACK_BOT_TOKEN || !process.env.SLACK_SIGNING_SECRET) throw new Error('Secretが設定されてません.');

    // SQS
    // SLACKから同時に複数のリクエストが来るのでSQSを使って重複を削除
    // もしくはSlackからのイベントに対する処理を返すのに時間がかかる場合はSQSを使って非同期にする(Slackには3000msで返さないといけないため)
    const queue = new sqs.Queue(this, 'Queue', {
      queueName: 'SlackAppStarterWithAwsCdkQueue.fifo',
      fifoThroughputLimit: sqs.FifoThroughputLimit.PER_MESSAGE_GROUP_ID,
      deduplicationScope: sqs.DeduplicationScope.MESSAGE_GROUP,
      contentBasedDeduplication: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // EventSubscribe側のLambda
    const eventSubscribeLambda = new NodejsFunction(this, 'EventSubscribeLambda', {
      entry: '@lambda/event_subscribe/handler.ts',
      environment: {
        SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
        SLACK_SIGNING_SECRET: process.env.SLACK_SIGNING_SECRET,
        REPLY_QUEUE_URL: queue.queueUrl,
      },
      functionName: 'EventSubscribeLambda',
      memorySize: 1024,
    });

    // Reply側のLambda
    new NodejsFunction(this, 'ReplyLambda', {
      entry: '@lambda/reply/handler.ts',
      environment: {
        SLACK_BOT_TOKEN: process.env.SLACK_BOT_TOKEN,
      },
      functionName: 'ReplyLambda',
      memorySize: 1024,
      events: [new SqsEventSource(queue)],
    });

    // API Gateway(Lambda Proxy)
    const api = new apigateway.LambdaRestApi(this, 'Api', {
      handler: eventSubscribeLambda,
      proxy: true,
    });

    // 確認用のCfnOutput
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
    });
  }
}
