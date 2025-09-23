#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AwsSolutionsChecks, NagSuppressions } from "cdk-nag";
import "dotenv/config";
import { AlbAccesstokenCognitoAuthorizerStack } from "../lib/alb-accesstoken-cognito-authorizer-stack";

const app = new cdk.App();

cdk.Aspects.of(app).add(new AwsSolutionsChecks());

const stack = new AlbAccesstokenCognitoAuthorizerStack(
  app,
  "AlbAccesstokenCognitoAuthorizerStack"
);

NagSuppressions.addStackSuppressions(stack, [
  {
    id: "AwsSolutions-VPC7",
    reason: "テスト用なので必要ない",
  },
  {
    id: "AwsSolutions-IAM5",
    reason: "テスト用なので必要ない",
  },
  {
    id: "AwsSolutions-COG3",
    reason: "テスト用なので必要ない",
  },
  {
    id: "AwsSolutions-ELB2",
    reason: "テスト用なので必要ない",
  },
  {
    id: "AwsSolutions-EC23",
    reason: "テスト用なので必要ない",
  },
  {
    id: "AwsSolutions-ECS4",
    reason: "テスト用なので必要ない",
  },
  {
    id: "AwsSolutions-ECS7",
    reason: "テスト用なので必要ない",
  },
  {
    id: "AwsSolutions-IAM4",
    reason: "テスト用なので必要ない",
  },
  {
    id: "AwsSolutions-APIG2",
    reason: "テスト用なので必要ない",
  },
  {
    id: "AwsSolutions-APIG1",
    reason: "テスト用なので必要ない",
  },
  {
    id: "AwsSolutions-APIG6",
    reason: "テスト用なので必要ない",
  },
  {
    id: "AwsSolutions-APIG3",
    reason: "テスト用なので必要ない",
  },
]);
