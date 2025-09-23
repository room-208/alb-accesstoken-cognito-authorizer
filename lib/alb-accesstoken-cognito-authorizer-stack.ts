import * as cdk from "aws-cdk-lib";
import * as apigateway from "aws-cdk-lib/aws-apigateway";
import * as acm from "aws-cdk-lib/aws-certificatemanager";
import * as cognito from "aws-cdk-lib/aws-cognito";
import * as ec2 from "aws-cdk-lib/aws-ec2";
import * as ecs from "aws-cdk-lib/aws-ecs";
import * as elbv2 from "aws-cdk-lib/aws-elasticloadbalancingv2";
import * as actions from "aws-cdk-lib/aws-elasticloadbalancingv2-actions";
import * as lambda from "aws-cdk-lib/aws-lambda";
import * as route53 from "aws-cdk-lib/aws-route53";
import * as route53Targets from "aws-cdk-lib/aws-route53-targets";
import { Construct } from "constructs";

export class AlbAccesstokenCognitoAuthorizerStack extends cdk.Stack {
  private readonly domainName: string;
  private readonly userPoolDomainPrefix: string;

  private readonly albDomainName: string;
  private readonly apiDomainName: string;
  private readonly resourceServerId: string;
  private readonly resourceServerScope: cognito.ResourceServerScope;
  private readonly resourceServerScopeId: string;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.domainName = process.env.DOMAIN_NAME || "";
    this.userPoolDomainPrefix = process.env.USER_POOL_DOMAIN_PREFIX || "";

    this.albDomainName = this.domainName;
    this.apiDomainName = `api.${this.domainName}`;
    this.resourceServerId = this.apiDomainName;
    this.resourceServerScope = {
      scopeName: "api:all",
      scopeDescription: "Full access to API",
    };
    this.resourceServerScopeId = `${this.resourceServerId}/${this.resourceServerScope.scopeName}`;

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
      subjectAlternativeNames: [`*.${this.domainName}`],
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
      mfaSecondFactor: { sms: false, otp: true, email: false },
      accountRecovery: cognito.AccountRecovery.EMAIL_ONLY,
    });

    const resourceServer = new cognito.UserPoolResourceServer(
      this,
      "ResourceServer",
      {
        userPool,
        identifier: this.resourceServerId,
        scopes: [this.resourceServerScope],
      }
    );

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
        scopes: [
          cognito.OAuthScope.OPENID,
          cognito.OAuthScope.resourceServer(
            resourceServer,
            this.resourceServerScope
          ),
        ],
        callbackUrls: [`https://${this.albDomainName}/oauth2/idpresponse`],
      },
    });

    const userPoolDomain = new cognito.UserPoolDomain(this, "UserPoolDomain", {
      userPool,
      cognitoDomain: {
        domainPrefix: this.userPoolDomainPrefix,
      },
    });

    const cluster = new ecs.Cluster(this, "Cluster", {
      vpc,
    });

    const fargatetaskDefinition = new ecs.FargateTaskDefinition(
      this,
      "FargateTaskDefinition",
      {
        cpu: 256,
        memoryLimitMiB: 512,
      }
    );

    fargatetaskDefinition.addContainer("AppContainer", {
      image: ecs.ContainerImage.fromAsset("docker/web-server"),
      portMappings: [
        { hostPort: 80, containerPort: 80, protocol: ecs.Protocol.TCP },
      ],
    });

    const fargateSecurityGroup = new ec2.SecurityGroup(
      this,
      "FargateSecurityGroup",
      {
        vpc,
        allowAllOutbound: true,
      }
    );
    fargateSecurityGroup.addIngressRule(
      ec2.Peer.ipv4(vpc.vpcCidrBlock),
      ec2.Port.tcp(80)
    );

    const fargateService = new ecs.FargateService(this, "FargateService", {
      cluster,
      taskDefinition: fargatetaskDefinition,
      desiredCount: 1,
      assignPublicIp: false,
      securityGroups: [fargateSecurityGroup],
      vpcSubnets: vpc.selectSubnets({
        subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
      }),
    });

    const fargateTargetGroup = new elbv2.ApplicationTargetGroup(
      this,
      "FargateTargetGroup",
      {
        vpc,
        port: 80,
        protocol: elbv2.ApplicationProtocol.HTTP,
        targetType: elbv2.TargetType.IP,
      }
    );
    fargateService.attachToApplicationTargetGroup(fargateTargetGroup);

    const albSecurityGroup = new ec2.SecurityGroup(this, "AlbSecurityGroup", {
      vpc,
      allowAllOutbound: true,
    });
    albSecurityGroup.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443));

    const alb = new elbv2.ApplicationLoadBalancer(this, "ALB", {
      vpc,
      internetFacing: true,
      securityGroup: albSecurityGroup,
    });

    const httpsListener = alb.addListener("HttpsListener", {
      port: 443,
      certificates: [certificate],
      defaultAction: new actions.AuthenticateCognitoAction({
        userPool: userPool,
        userPoolClient: userPoolClient,
        userPoolDomain: userPoolDomain,
        scope: `openid ${this.resourceServerScopeId}`,
        next: elbv2.ListenerAction.forward([fargateTargetGroup]),
      }),
    });

    const albRecord = new route53.ARecord(this, "AlbRecord", {
      zone: hostedZone,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.LoadBalancerTarget(alb)
      ),
    });

    const lambdaFunction = new lambda.DockerImageFunction(
      this,
      "LambdaFunction",
      {
        code: lambda.DockerImageCode.fromImageAsset("docker/api-server"),
        timeout: cdk.Duration.seconds(10),
        environment: {
          ISSUER: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}`,
          JWKS_URL: `https://cognito-idp.${this.region}.amazonaws.com/${userPool.userPoolId}/.well-known/jwks.json`,
          USERINFO_URL: `https://${userPoolDomain.domainName}.auth.${this.region}.amazoncognito.com/oauth2/userInfo`,
        },
      }
    );

    const restApi = new apigateway.RestApi(this, "RestApi");

    const cognitoAuthorizer = new apigateway.CognitoUserPoolsAuthorizer(
      this,
      "CognitoAuthorizer",
      {
        cognitoUserPools: [userPool],
      }
    );

    const proxyResource = restApi.root.addResource("{proxy+}");
    restApi.root.addMethod(
      "ANY",
      new apigateway.LambdaIntegration(lambdaFunction),
      {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer: cognitoAuthorizer,
        authorizationScopes: [this.resourceServerScopeId],
      }
    );
    proxyResource.addMethod(
      "ANY",
      new apigateway.LambdaIntegration(lambdaFunction),
      {
        authorizationType: apigateway.AuthorizationType.COGNITO,
        authorizer: cognitoAuthorizer,
        authorizationScopes: [this.resourceServerScopeId],
      }
    );

    const apiDomain = new apigateway.DomainName(this, "ApiDomain", {
      domainName: this.apiDomainName,
      certificate,
    });
    apiDomain.addBasePathMapping(restApi);

    const apiRecord = new route53.ARecord(this, "ApiRecord", {
      zone: hostedZone,
      recordName: this.apiDomainName,
      target: route53.RecordTarget.fromAlias(
        new route53Targets.ApiGatewayDomain(apiDomain)
      ),
    });
  }
}
