import { defineStorage } from "@aws-amplify/backend";

/**
 * S3ストレージ設定
 *
 * ログファイル保存用のS3バケット
 * パーティション構造: team_id/year/month/day/hour/
 *
 * アクセス制御はbackend.tsでIAMポリシーとして定義
 * （循環依存を避けるため、ここではaccessプロパティを使用しない）
 */
export const storage = defineStorage({
  name: "log-analyzer-logs",
});
