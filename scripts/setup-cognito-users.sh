#!/bin/bash

# Cognito ユーザーセットアップスクリプト
#
# 使い方: ./scripts/setup-cognito-users.sh

set -e

echo "🚀 Cognito ユーザーセットアップを開始します"

# amplify_outputs.jsonの存在確認
if [ ! -f "amplify_outputs.json" ]; then
  echo "❌ amplify_outputs.json が見つかりません"
  echo "まず 'npx ampx sandbox' を実行してください"
  exit 1
fi

# jqのインストール確認
if ! command -v jq &> /dev/null; then
  echo "❌ jq がインストールされていません"
  echo "インストール: sudo apt install jq (Ubuntu) or brew install jq (Mac)"
  exit 1
fi

# User Pool IDを取得
USER_POOL_ID=$(cat amplify_outputs.json | jq -r '.auth.user_pool_id')

if [ -z "$USER_POOL_ID" ] || [ "$USER_POOL_ID" = "null" ]; then
  echo "❌ User Pool IDの取得に失敗しました"
  exit 1
fi

echo "✓ User Pool ID: $USER_POOL_ID"

# テストユーザーの作成
echo ""
echo "📝 テストユーザーを作成します..."

# Team Alpha ユーザー
echo "  → team-alpha-user@example.com (team-alpha)"
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username team-alpha-user@example.com \
  --user-attributes Name=email,Value=team-alpha-user@example.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS 2>/dev/null || echo "    (既に存在する可能性があります)"

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username team-alpha-user@example.com \
  --group-name team-alpha 2>/dev/null || true

# Team Beta ユーザー
echo "  → team-beta-user@example.com (team-beta)"
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username team-beta-user@example.com \
  --user-attributes Name=email,Value=team-beta-user@example.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS 2>/dev/null || echo "    (既に存在する可能性があります)"

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username team-beta-user@example.com \
  --group-name team-beta 2>/dev/null || true

# Team Gamma ユーザー
echo "  → team-gamma-user@example.com (team-gamma)"
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username team-gamma-user@example.com \
  --user-attributes Name=email,Value=team-gamma-user@example.com \
  --temporary-password TempPass123! \
  --message-action SUPPRESS 2>/dev/null || echo "    (既に存在する可能性があります)"

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username team-gamma-user@example.com \
  --group-name team-gamma 2>/dev/null || true

# Admin ユーザー
echo "  → admin@example.com (team-admin)"
aws cognito-idp admin-create-user \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --user-attributes Name=email,Value=admin@example.com \
  --temporary-password AdminPass123! \
  --message-action SUPPRESS 2>/dev/null || echo "    (既に存在する可能性があります)"

aws cognito-idp admin-add-user-to-group \
  --user-pool-id $USER_POOL_ID \
  --username admin@example.com \
  --group-name team-admin 2>/dev/null || true

echo ""
echo "✅ セットアップ完了！"
echo ""
echo "📋 作成されたテストユーザー:"
echo "  1. team-alpha-user@example.com / TempPass123! (team-alpha)"
echo "  2. team-beta-user@example.com  / TempPass123! (team-beta)"
echo "  3. team-gamma-user@example.com / TempPass123! (team-gamma)"
echo "  4. admin@example.com           / AdminPass123! (team-admin)"
echo ""
echo "⚠️  初回ログイン時にパスワード変更が必要です"
echo ""
echo "次のステップ:"
echo "  1. npm run dev でアプリを起動"
echo "  2. http://localhost:3000 にアクセス"
echo "  3. 上記のユーザーでログイン"
