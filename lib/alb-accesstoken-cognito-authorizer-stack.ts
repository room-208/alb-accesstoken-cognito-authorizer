import * as cdk from "aws-cdk-lib";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as route53 from "aws-cdk-lib/aws-route53";
import { Construct } from "constructs";

export class AlbAccesstokenCognitoAuthorizerStack extends cdk.Stack {
  private readonly domainName: string;
  private readonly albDomainName: string;
  private readonly userPoolDomainPrefix: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.domainName = process.env.DOMAIN_NAME || "";
    this.albDomainName = this.domainName;
    this.userPoolDomainPrefix = process.env.USER_POOL_DOMAIN_PREFIX || "";

    const vpc = new ec2.Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 1,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: "public",
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: "egress",
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    const hostedZone = new route53.HostedZone(this, "HostedZone", {
      zoneName: this.domainName,
    });

    const certificate = new acm.Certificate(this, "Certificate", {
      domainName: this.domainName,
      validation: acm.CertificateValidation.fromDns(hostedZone),
    });

    const userPool = new cognito.UserPool(this, "UserPool", {
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
      passwordPolicy: {
        minLength: 8,
        requireLowercase: true,
        requireUppercase: true,
        requireDigits: true,
        requireSymbols: true,
      },
      mfa: cognito.Mfa.REQUIRED,
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    const userPoolClient = new cognito.UserPoolClient(this, "UserPoolClient", {
      userPool,
      generateSecret: true,
      authFlows: {
        userPassword: true,
        userSrp: true,
      },
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.OPENID],
        callbackUrls: [`https://${this.albDomainName}/oauth2/idpresponse`],
      },
    });

    const userPoolDomain = new cognito.UserPoolDomain(this, "UserPoolDomain", {
      userPool,
      cognitoDomain: {
        domainPrefix: this.userPoolDomainPrefix,
      },
    });
  }
}
