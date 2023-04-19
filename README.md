# Slack App Starter with AWS CDK

This is not Official

## 始め方

1. Slack　Appを作成する→[Slack App](https://api.slack.com/apps)

2. bot tokenとsigning secretを発行し `.env`ファイルを作成

```txt
SLACK_BOT_TOKEN=xoxb-000000000000-000000000000-000000000000000000000000
SLACK_SIGNING_SECRET=aaaaaaaaaaaaaaaaaaaaaaaa
```

3. AWS CDKでAWSのリソースをデプロイする

```console
npm i

# bootstrapを作成してない場合は作成
npx cdk bootstrap

npx cdk deploy SlackAppStarterWithAwsCdkStack
```

4. API GatewayのEndpoint URLをSlack AppのEvent Subscriptionに設定


