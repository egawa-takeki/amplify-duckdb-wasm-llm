# AWS基盤セットアップガイド

このドキュメントでは、ログ解析システムのAWSインフラストラクチャをセットアップする手順を説明します。

## 前提条件

- AWS アカウント
- AWS CLI v2 インストール済み
- Node.js 18.x以上
- 適切なIAM権限
  - Amplify
  - Cognito
  - S3
  - Bedrock
  - CloudFront
  - IAM

## 1. AWS CLI設定

```bash
# AWS CLIの設定
aws configure

# プロファイルの確認
aws sts get-caller-identity
```

## 2. Amplify CLIのインストール

```bash
# Amplify CLIをグローバルインストール
npm install -g @aws-amplify/cli

# Amplifyの初期化
npx ampx sandbox
```

## 3. Cognito設定

### 3.1 自動デプロイ

Amplify Gen 2を使用して自動的にCognitoがデプロイされます。

```bash
# サンドボックス環境でテスト
npx ampx sandbox

# 本番環境へデプロイ
npx ampx pipeline-deploy --branch main --app-id <your-app-id>
```

### 3.2 ユーザーとグループの作成

デプロイ後、AWS Consoleまたはaws-cliでユーザーを作成します。

```bash
# ユーザープールIDを取得
USER_POOL_ID=$(cat amplify_outputs.json | jq -r '.auth.user_pool_id')

# テストユーザーの作成
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username test-user@example.com \
  --user-attributes Name=email,Value=test-user@example.com \
  --temporary-password TempPassword123! \
  --message-action SUPPRESS

# グループへの追加
aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username test-user@example.com \
  --group-name team-alpha
```

### 3.3 グループの確認

```bash
# グループ一覧の確認
aws cognito-idp list-groups --user-pool-id $USER_POOL_ID

# 期待されるグループ:
# - team-alpha
# - team-beta
# - team-gamma
# - team-admin
```

## 4. S3バケット設定

### 4.1 自動作成されたバケットの確認

```bash
# バケット名を取得
BUCKET_NAME=$(cat amplify_outputs.json | jq -r '.storage.bucket_name')

# バケットの確認
aws s3 ls s3://$BUCKET_NAME
```

### 4.2 パーティション構造の作成

```bash
# テスト用のパーティション構造を作成
aws s3api put-object --bucket $BUCKET_NAME --key logs/team_id=team-alpha/
aws s3api put-object --bucket $BUCKET_NAME --key logs/team_id=team-beta/
aws s3api put-object --bucket $BUCKET_NAME --key logs/team_id=team-gamma/
```

### 4.3 ライフサイクルポリシーの設定

```bash
# ライフサイクルポリシーの作成（90日間保持）
cat > lifecycle-policy.json << 'EOF'
{
  "Rules": [
    {
      "Id": "DeleteOldLogs",
      "Status": "Enabled",
      "Prefix": "logs/",
      "Expiration": {
        "Days": 90
      }
    }
  ]
}
EOF

aws s3api put-bucket-lifecycle-configuration \
  --bucket $BUCKET_NAME \
  --lifecycle-configuration file://lifecycle-policy.json

rm lifecycle-policy.json
```

## 5. Kinesis Firehose設定

### 5.1 配信ストリームの作成

```bash
# Firehoseロールの作成
cat > firehose-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "firehose.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

aws iam create-role \
  --role-name LogAnalyzerFirehoseRole \
  --assume-role-policy-document file://firehose-trust-policy.json

# S3書き込み権限の付与
cat > firehose-s3-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:PutObjectAcl"
      ],
      "Resource": "arn:aws:s3:::$BUCKET_NAME/logs/*"
    }
  ]
}
EOF

aws iam put-role-policy \
  --role-name LogAnalyzerFirehoseRole \
  --policy-name S3WritePolicy \
  --policy-document file://firehose-s3-policy.json

rm firehose-trust-policy.json firehose-s3-policy.json
```

### 5.2 配信ストリームの作成（Dynamic Partitioning）

AWS Consoleから以下の設定で作成:

- **名前**: log-analyzer-stream
- **ソース**: Direct PUT
- **送信先**: S3
- **バケット**: 自動作成されたバケット
- **プレフィックス**: `logs/team_id=!{partitionKeyFromQuery:team_id}/year=!{timestamp:yyyy}/month=!{timestamp:MM}/day=!{timestamp:dd}/hour=!{timestamp:HH}/`
- **エラープレフィックス**: `errors/!{firehose:error-output-type}/`
- **バッファサイズ**: 128 MB
- **バッファ間隔**: 300秒
- **圧縮**: GZIP
- **Dynamic Partitioning**: 有効
  - JQ式: `.team_id`
  - キー: `team_id`

## 6. Amazon Bedrock設定

### 6.1 モデルアクセスの有効化

AWS Console > Bedrock > Model access

1. **us-east-1** リージョンに切り替え
2. **Anthropic Claude 3.5 Sonnet** のアクセスをリクエスト
3. 承認を待つ（通常数分）

### 6.2 動作確認

```bash
# Bedrockへのアクセス確認
aws bedrock list-foundation-models --region us-east-1 | grep claude-3-5-sonnet

# テストリクエスト
aws bedrock-runtime invoke-model \
  --region us-east-1 \
  --model-id anthropic.claude-3-5-sonnet-20241022-v2:0 \
  --body '{"anthropic_version":"bedrock-2023-05-31","max_tokens":100,"messages":[{"role":"user","content":"Hello"}]}' \
  --cli-binary-format raw-in-base64-out \
  output.json

cat output.json
rm output.json
```

## 7. CloudFront設定

### 7.1 ディストリビューションの作成

AWS Console > CloudFront > Create Distribution

- **Origin domain**: S3バケット名を選択
- **Origin access**: Origin access control settings (recommended)
  - OAC を新規作成
- **Viewer protocol policy**: Redirect HTTP to HTTPS
- **Allowed HTTP methods**: GET, HEAD, OPTIONS
- **Cache policy**: CachingOptimized
- **Compress objects automatically**: Yes

### 7.2 S3バケットポリシーの更新

CloudFrontからのアクセスを許可:

```bash
# CloudFront OAI用のバケットポリシーを追加
# （CloudFrontコンソールに表示されるポリシーをコピー）
```

## 8. 環境変数の設定

### 8.1 amplify_outputs.json の確認

```bash
# デプロイ後に自動生成されるファイルを確認
cat amplify_outputs.json
```

### 8.2 .env.local の作成

```bash
# .env.example をコピー
cp .env.example .env.local

# 値を設定
# NEXT_PUBLIC_USER_POOL_ID, NEXT_PUBLIC_USER_POOL_CLIENT_ID などを
# amplify_outputs.json から取得して設定
```

## 9. テスト

### 9.1 Cognito認証テスト

```bash
# 開発サーバーを起動
npm run dev

# ブラウザで http://localhost:3000 にアクセス
# ログイン画面が表示されることを確認
```

### 9.2 S3アクセステスト

```bash
# テストログファイルをアップロード
cat > test-log.jsonl << 'EOF'
{"timestamp":"2024-01-15T10:23:45Z","level":"INFO","service":"api","message":"Test log","team_id":"team-alpha"}
{"timestamp":"2024-01-15T10:23:46Z","level":"ERROR","service":"api","message":"Test error","team_id":"team-alpha"}
EOF

gzip test-log.jsonl

aws s3 cp test-log.jsonl.gz \
  s3://$BUCKET_NAME/logs/team_id=team-alpha/year=2024/month=01/day=15/hour=10/test-log.jsonl.gz

# アップロード確認
aws s3 ls s3://$BUCKET_NAME/logs/team_id=team-alpha/year=2024/month=01/day=15/hour=10/

rm test-log.jsonl.gz
```

## 10. セキュリティ確認

### 10.1 IAMポリシーの確認

```bash
# 認証済みユーザーロールの確認
aws iam list-attached-role-policies \
  --role-name amplify-<app-id>-<env>-authRole

# ポリシーの内容確認
aws iam get-role-policy \
  --role-name amplify-<app-id>-<env>-authRole \
  --policy-name bedrock-access
```

### 10.2 S3バケットポリシーの確認

```bash
# バケットポリシーの確認
aws s3api get-bucket-policy --bucket $BUCKET_NAME

# 期待される内容:
# - CloudFrontからのアクセス許可
# - Firehoseからの書き込み許可
# - 直接アクセスの拒否
```

## トラブルシューティング

### Cognitoグループが作成されていない

```bash
# 手動でグループを作成
for group in team-alpha team-beta team-gamma team-admin; do
  aws cognito-idp create-group \
    --user-pool-id $USER_POOL_ID \
    --group-name $group \
    --description "Group for $group"
done
```

### Bedrockアクセスエラー

- リージョンが **us-east-1** であることを確認
- モデルアクセスが承認されているか確認
- IAMロールにBedrockポリシーが付与されているか確認

### S3アクセスエラー

- バケットポリシーが正しく設定されているか確認
- Signed URLの有効期限が切れていないか確認
- team_id フィルタが正しく適用されているか確認

## 次のステップ

フェイズ1が完了したら、[フェイズ2: 認証機能実装](../implementation_plan.md#フェイズ2-認証機能実装2-3日) に進みます。
