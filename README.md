# alb accesstoken cognito authorizer

ALBのトークンでCognito オーソライザーの認証認可をテストするリポジトリです。[ALB の x-amzn-oidc-accesstoken で API Gateway Cognito オーソライザーの認証認可をする](https://zenn.dev/room_208/articles/7efd7af2a14faa)を確認してください。

## AWS CDKの立ち上げ

### 1. 事前準備
1. 以下のリソースを手動で立ち上げてください。
    - AWS Route53のパブリックドメイン
    - 東京リージョンのAWS Certificate Managerの証明書（ALB用の証明書）
    - バージニアリージョンのAWS Certificate Managerの証明書（Cognitoのカスタムドメイン用の証明書）

2. [.env.example](.env.example)をコピーして`.env`を作成し、そこへ先ほど作成したドメインと証明書のARNを記入してください。ここでドメインは`DOMAIN_NAME="example.com"`の場合、`example.com, api.example.com, auth.example.com`を使用するので、既に使用している場合は空けてください。

### 2. デプロイの実行
以下を実行してください。
```sh
cdk bootstrap
cdk deploy
```