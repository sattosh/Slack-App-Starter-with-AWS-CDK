#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { SlackAppStarterWithAwsCdkStack } from '../lib/slack-app-starter-with-aws-cdk-stack';

const env: cdk.Environment = {
  // お好きなリージョンを指定してください
  region: 'ap-northeast-1',
};

const app = new cdk.App();

// 全部のリソースにTagを付与する
// cdk.Tags.of(app).add('Project', 'SlackAppStarterWithAwsCdk');

new SlackAppStarterWithAwsCdkStack(app, 'SlackAppStarterWithAwsCdkStack', { env });
