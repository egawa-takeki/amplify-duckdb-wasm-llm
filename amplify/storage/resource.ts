import { defineStorage } from "@aws-amplify/backend";

/**
 * S3ストレージ設定
 *
 * ログファイル保存用のS3バケット
 * パーティション構造: team_id/year/month/day/hour/
 */
export const storage = defineStorage({
  name: "log-analyzer-logs",
  access: (allow) => ({
    // チームごとのアクセス制御
    "logs/team-alpha/*": [
      allow.groups(["team-alpha", "team-admin"]).to(["read"]),
    ],
    "logs/team-beta/*": [
      allow.groups(["team-beta", "team-admin"]).to(["read"]),
    ],
    "logs/team-gamma/*": [
      allow.groups(["team-gamma", "team-admin"]).to(["read"]),
    ],
    // Firehose用の書き込み権限は別途IAMで設定
  }),
});
