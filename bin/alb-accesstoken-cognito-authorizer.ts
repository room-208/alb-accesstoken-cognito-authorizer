#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AwsSolutionsChecks } from "cdk-nag";
import "dotenv/config";
import { AlbAccesstokenCognitoAuthorizerStack } from "../lib/alb-accesstoken-cognito-authorizer-stack";

const app = new cdk.App();

cdk.Aspects.of(app).add(new AwsSolutionsChecks());

const stack = new AlbAccesstokenCognitoAuthorizerStack(
  app,
  "AlbAccesstokenCognitoAuthorizerStack"
);
