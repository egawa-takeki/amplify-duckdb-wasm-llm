#!/bin/bash
set -e

# テスト用ログをS3にアップロードするスクリプト

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
TEST_DATA_DIR="$PROJECT_ROOT/test-data/logs"

# amplify_outputs.jsonからS3バケット名を取得
OUTPUTS_FILE="$PROJECT_ROOT/amplify_outputs.json"

if [ ! -f "$OUTPUTS_FILE" ]; then
  echo "Error: amplify_outputs.json not found at $OUTPUTS_FILE"
  echo "Please run 'npx amplify sandbox' first to deploy the backend"
  exit 1
fi

# jqを使ってバケット名を取得
BUCKET_NAME=$(jq -r '.storage.bucket_name' "$OUTPUTS_FILE" 2>/dev/null || echo "")

if [ -z "$BUCKET_NAME" ] || [ "$BUCKET_NAME" = "null" ]; then
  echo "Error: Could not find bucket_name in amplify_outputs.json"
  echo "Please check the file format or deploy the backend first"
  exit 1
fi

echo "====================================="
echo "S3 Upload Configuration"
echo "====================================="
echo "S3 Bucket: $BUCKET_NAME"
echo "Test data directory: $TEST_DATA_DIR"
echo "AWS Profile: ${AWS_PROFILE:-default}"
echo ""

# テストデータが存在しない場合は生成
if [ ! -d "$TEST_DATA_DIR" ]; then
  echo "Test logs not found. Generating..."
  python3 "$SCRIPT_DIR/generate-test-logs.py"
  echo ""
fi

# ファイル数をカウント
FILE_COUNT=$(find "$TEST_DATA_DIR" -name "*.jsonl.gz" | wc -l)
echo "Found $FILE_COUNT log files to upload"
echo ""

# S3にアップロード（Hiveパーティション構造を維持）
echo "Uploading logs to S3..."
echo "This may take a few minutes..."
echo ""

aws s3 sync "$TEST_DATA_DIR/" "s3://$BUCKET_NAME/logs/" \
  --exclude "*" \
  --include "*.jsonl.gz"

echo ""
echo "====================================="
echo "Upload Complete!"
echo "====================================="
echo ""
echo "Uploaded structure (Hive partitioning):"
echo "  s3://$BUCKET_NAME/logs/team_id=team-alpha/year=YYYY/month=MM/day=DD/hour=HH/logs-HH.jsonl.gz"
echo "  s3://$BUCKET_NAME/logs/team_id=team-beta/year=YYYY/month=MM/day=DD/hour=HH/logs-HH.jsonl.gz"
echo "  s3://$BUCKET_NAME/logs/team_id=team-gamma/year=YYYY/month=MM/day=DD/hour=HH/logs-HH.jsonl.gz"
echo ""
echo "Total files uploaded: $FILE_COUNT"
echo ""
echo "Next steps:"
echo "1. Access the application at the Amplify Hosting URL"
echo "2. Sign in with a test user"
echo "3. Select a team and date range"
echo "4. Start querying logs!"
