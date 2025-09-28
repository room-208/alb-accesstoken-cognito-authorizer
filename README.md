# alb accesstoken cognito authorizer

ALBのトークンでCognito オーソライザーの認可をテストするリポジトリです。[ALB の x-amzn-oidc-accesstoken で API Gateway Cognito オーソライザーの認可を通す](https://zenn.dev/room_208/articles/7efd7af2a14faa)を確認してください。

## AWS CDKの立ち上げ

### 1. 事前準備
1. 以下のリソースを手動で立ち上げてください。
    - AWS Route53のパブリックホストゾーン
    - 東京リージョンのAWS Certificate Managerの証明書（ALBとAPI用の証明書）
    - バージニアリージョンのAWS Certificate Managerの証明書（Cognitoのカスタムドメイン用の証明書）

2. [.env.example](.env.example)をコピーして`.env`を作成し、そこへ先ほど作成したドメインと証明書のARNを記入してください。ここでドメインが`DOMAIN_NAME="example.com"`の場合、`example.com, api.example.com, auth.example.com`を使用するため、既に使用している場合は空けてください。

### 2. デプロイの実行
以下を実行してください。
```sh
cdk bootstrap
cdk deploy
```

## トークンのテスト

### 1. トークンの払い出し
1. Cognitoユーザープールへユーザー登録を行ってください。

2. `example.com`へアクセスし、phpinfoの画面から`x-amzn-oidc-accesstoken, x-amzn-oidc-data`が取得できることを確認してください。

3. [python/.env.example](python/.env.example)をコピーして`python/.env`を作成し、そこへ環境変数を記入してください。

### 2. Pythonの環境構築
以下を実行してください。
```sh
python3 -m venv .venv
source .venv/bin/activate
pip install -r python/requirements.txt
```

### 2. トークンの検証とアクセス確認
以下を実行してください。
```sh
cd python
python 01_test_token.py
python 02_test_user_info.py
python 03_test_api_auth.py
```