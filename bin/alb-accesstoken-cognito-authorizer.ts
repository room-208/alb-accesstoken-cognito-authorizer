#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { AlbAccesstokenCognitoAuthorizerStack } from "../lib/alb-accesstoken-cognito-authorizer-stack";
import { AwsSolutionsChecks } from "cdk-nag";

const app = new cdk.App();

cdk.Aspects.of(app).add(new AwsSolutionsChecks());

const stack = new AlbAccesstokenCognitoAuthorizerStack(
  app,
  "AlbAccesstokenCognitoAuthorizerStack"
);
