#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import "dotenv/config";
import { AlbAccesstokenCognitoAuthorizerStack } from "../lib/alb-accesstoken-cognito-authorizer-stack";

const app = new cdk.App();

const stack = new AlbAccesstokenCognitoAuthorizerStack(
  app,
  "AlbAccesstokenCognitoAuthorizerStack",
  {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  }
);
