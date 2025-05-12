import * as cdk from "aws-cdk-lib";
import { aws_s3 as s3 } from "aws-cdk-lib";
import { aws_iam as iam } from "aws-cdk-lib";
import { aws_s3_deployment as s3deploy } from "aws-cdk-lib";
import { aws_cloudfront as cloudfront } from "aws-cdk-lib";
import { aws_cloudfront_origins as origins } from "aws-cdk-lib";
import { aws_cognito as cognito } from "aws-cdk-lib";
import { Construct } from "constructs";
import { Duration } from "aws-cdk-lib";

export class InfrastructureStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create Cognito User Pool
    const userPool = new cognito.UserPool(this, "WaylessUserPool", {
      userPoolName: "wayless-user-pool",
      selfSignUpEnabled: false,
      signInAliases: {
        email: true,
      },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
      },
    });

    // Create app client
    const client = userPool.addClient("WaylessWebClient", {
      oAuth: {
        flows: {
          authorizationCodeGrant: true,
        },
        scopes: [cognito.OAuthScope.OPENID],
        callbackUrls: ["http://localhost:5173"],
        logoutUrls: ["http://localhost:5173"],
      },
    });

    // Create Identity Pool
    const identityPool = new cognito.CfnIdentityPool(
      this,
      "WaylessIdentityPool",
      {
        allowUnauthenticatedIdentities: false,
        cognitoIdentityProviders: [
          {
            clientId: client.userPoolClientId,
            providerName: userPool.userPoolProviderName,
          },
        ],
      }
    );

    // Create S3 bucket with restricted access
    const bucket = new s3.Bucket(this, "StaticWebsiteBucket", {
      bucketName: "wayless-frontend-bucket",
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
      versioned: true,
    });

    // Create Origin Access Identity
    const originAccessIdentity = new cloudfront.OriginAccessIdentity(
      this,
      "OAI"
    );

    // Grant read permissions to CloudFront
    bucket.addToResourcePolicy(
      new iam.PolicyStatement({
        actions: ["s3:GetObject"],
        resources: [bucket.arnForObjects("*")],
        principals: [
          new iam.CanonicalUserPrincipal(
            originAccessIdentity.cloudFrontOriginAccessIdentityS3CanonicalUserId
          ),
        ],
      })
    );

    // Create CloudFront distribution
    const cdn = new cloudfront.Distribution(this, "StaticSiteCDN", {
      defaultRootObject: "index.html",
      errorResponses: [
        {
          httpStatus: 404,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
        {
          httpStatus: 403,
          responseHttpStatus: 200,
          responsePagePath: "/index.html",
        },
      ],
      defaultBehavior: {
        origin: new origins.S3Origin(bucket, {
          originAccessIdentity,
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        compress: true,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: new cloudfront.ResponseHeadersPolicy(
          this,
          "SecurityHeadersPolicy",
          {
            securityHeadersBehavior: {
              contentSecurityPolicy: {
                contentSecurityPolicy:
                  "default-src 'self'; frame-src https://wayless-user-pdf-storage.s3.eu-north-1.amazonaws.com; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; connect-src 'self' https://*.amazonaws.com https://*.amazoncognito.com",
                override: true,
              },
              strictTransportSecurity: {
                accessControlMaxAge: Duration.days(365),
                includeSubdomains: true,
                override: true,
              },
              contentTypeOptions: {
                override: true,
              },
              referrerPolicy: {
                referrerPolicy:
                  cloudfront.HeadersReferrerPolicy
                    .STRICT_ORIGIN_WHEN_CROSS_ORIGIN,
                override: true,
              },
              xssProtection: {
                protection: true,
                modeBlock: true,
                override: true,
              },
              frameOptions: {
                frameOption: cloudfront.HeadersFrameOption.DENY,
                override: true,
              },
            },
          }
        ),
      },
    });

    // Deploy website files
    new s3deploy.BucketDeployment(this, "DeployWebsite", {
      sources: [s3deploy.Source.asset("../dist")],
      destinationBucket: bucket,
      distribution: cdn,
      distributionPaths: ["/*"],
    });

    // Update the callback URLs with the CloudFront URL
    const cfnClient = client.node.defaultChild as cognito.CfnUserPoolClient;
    cfnClient.addPropertyOverride("CallbackURLs", [
      "http://localhost:5173",
      `https://${cdn.domainName}`,
    ]);
    cfnClient.addPropertyOverride("LogoutURLs", [
      "http://localhost:5173",
      `https://${cdn.domainName}`,
    ]);

    // Outputs
    new cdk.CfnOutput(this, "StaticSiteCDNDomain", {
      value: cdn.domainName,
    });

    new cdk.CfnOutput(this, "UserPoolId", {
      value: userPool.userPoolId,
    });

    new cdk.CfnOutput(this, "UserPoolClientId", {
      value: client.userPoolClientId,
    });

    new cdk.CfnOutput(this, "IdentityPoolId", {
      value: identityPool.ref,
    });
  }
}
