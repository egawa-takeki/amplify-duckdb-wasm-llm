# Cognito認証セットアップガイド

このガイドでは、ログ解析システムのCognito認証をセットアップする手順を説明します。

## 前提条件

- ✅ AWS アカウント
- ✅ AWS CLI v2 インストール済み
- ✅ AWS CLI設定済み (`aws configure`)
- ✅ jq インストール済み
  - Ubuntu: `sudo apt install jq`
  - Mac: `brew install jq`
  - Windows: https://jqlang.github.io/jq/download/

## セットアップ手順

### ステップ 0: 依存パッケージのインストール

```bash
# Amplify Gen 2 CLIツールを含む全パッケージをインストール
npm install
```

### ステップ 1: Amplify Sandboxの起動

```bash
# プロジェクトディレクトリで実行
npm run sandbox

# または直接実行
npx ampx sandbox
```

**初回実行時の注意:**
- AWSリージョンの選択を求められます（推奨: us-east-1）
- プロファイル名を入力します（デフォルト: `default`でOK）
- セットアップには5-10分程度かかります

**成功すると以下が作成されます:**
- ✅ Cognito User Pool
- ✅ 4つのグループ（team-alpha, team-beta, team-gamma, team-admin）
- ✅ 認証済みユーザー用のIAMロール
- ✅ S3バケット
- ✅ `amplify_outputs.json` ファイル

### ステップ 2: テストユーザーの作成

```bash
# スクリプトを実行
./scripts/setup-cognito-users.sh
```

このスクリプトは以下の4ユーザーを作成します:

| メールアドレス | 初期パスワード | グループ | 権限 |
|----------------|----------------|----------|------|
| team-alpha-user@example.com | TempPass123! | team-alpha | team-alphaのログのみ |
| team-beta-user@example.com | TempPass123! | team-beta | team-betaのログのみ |
| team-gamma-user@example.com | TempPass123! | team-gamma | team-gammaのログのみ |
| admin@example.com | AdminPass123! | team-admin | 全チームのログ |

⚠️ **初回ログイン時にパスワード変更が必要です**

### ステップ 3: 環境変数の設定（オプション）

`.env.local`ファイルを作成する必要はありません。
`amplify_outputs.json`が自動的に読み込まれます。

ただし、リージョンをカスタマイズしたい場合:

```bash
# .env.local を作成
echo "NEXT_PUBLIC_AWS_REGION=us-east-1" > .env.local
```

### ステップ 4: アプリケーションの起動

```bash
# 開発サーバーを起動
npm run dev
```

ブラウザで http://localhost:3000 にアクセスします。

### ステップ 5: ログイン

1. `/login` ページにアクセス
2. Cognito Hosted UIが表示されます
3. 上記のテストユーザーでログイン
4. 初回ログイン時に新しいパスワードを設定
5. ログイン成功後、ダッシュボードにリダイレクトされます

## トラブルシューティング

### `amplify_outputs.json` が見つからない

```bash
# Amplify Sandboxを再起動
npx ampx sandbox
```

### ユーザー作成エラー

```bash
# User Pool IDを確認
cat amplify_outputs.json | jq -r '.auth.user_pool_id'

# グループが存在するか確認
aws cognito-idp list-groups --user-pool-id <USER_POOL_ID>
```

### ログインできない

1. **パスワードを忘れた場合:**
   ```bash
   USER_POOL_ID=$(cat amplify_outputs.json | jq -r '.auth.user_pool_id')

   aws cognito-idp admin-set-user-password \
     --user-pool-id $USER_POOL_ID \
     --username team-alpha-user@example.com \
     --password NewPassword123! \
     --permanent
   ```

2. **ユーザーが無効化されている場合:**
   ```bash
   aws cognito-idp admin-enable-user \
     --user-pool-id $USER_POOL_ID \
     --username team-alpha-user@example.com
   ```

### Amplify Sandboxを停止したい

```bash
# Ctrl+C でSandboxを停止
# リソースは保持されます

# 完全にクリーンアップしたい場合:
npx ampx sandbox delete
```

## 本番環境へのデプロイ

```bash
# GitHub リポジトリにpush後
npx ampx pipeline-deploy --branch main --app-id <your-app-id>
```

## セキュリティベストプラクティス

1. **本番環境では:**
   - 強力なパスワードポリシーを設定
   - MFAを有効化
   - パスワードリセットフローを設定

2. **テスト用認証情報の管理:**
   - テスト用の認証情報を本番に使用しない
   - 定期的にパスワードをローテーション

3. **IAM権限:**
   - 最小権限の原則に従う
   - チームごとに適切なアクセス制御

## 参考リンク

- [AWS Amplify Gen 2 ドキュメント](https://docs.amplify.aws/gen2/)
- [Cognito User Pools](https://docs.aws.amazon.com/cognito/latest/developerguide/cognito-user-identity-pools.html)
- [プロジェクトドキュメント](docs/)
