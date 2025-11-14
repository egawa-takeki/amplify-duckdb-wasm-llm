import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fetchAuthSession } from "aws-amplify/auth";
import amplifyConfig from "@/amplify_outputs.json";

const BUCKET_NAME = amplifyConfig.storage.bucket_name;
const REGION = amplifyConfig.storage.aws_region;

/**
 * S3 Signed URLを生成（クライアントサイド実行）
 *
 * ブラウザから直接S3にアクセスするためのSigned URLを生成
 */
export async function generateSignedUrls(
  teamId: string,
  dateRange: { startDate: string; endDate: string }
): Promise<string[]> {
  // AWS認証情報の取得
  const session = await fetchAuthSession({ forceRefresh: true });
  if (!session.credentials) {
    throw new Error("AWS認証情報が取得できません");
  }

  console.log("AWS Credentials check:", {
    hasAccessKeyId: !!session.credentials.accessKeyId,
    hasSecretAccessKey: !!session.credentials.secretAccessKey,
    hasSessionToken: !!session.credentials.sessionToken,
    region: REGION,
    bucket: BUCKET_NAME,
  });

  // S3クライアントの作成
  const s3Client = new S3Client({
    region: REGION,
    credentials: session.credentials,
  });

  // 日付範囲からS3キーのプレフィックスを生成
  const startDate = new Date(dateRange.startDate);
  const endDate = new Date(dateRange.endDate);

  console.log("S3 Signed URL generation:", {
    teamId,
    startDate: startDate.toISOString(),
    endDate: endDate.toISOString(),
  });

  // 日付・時間ごとのファイルパスを生成
  const filePaths: string[] = [];
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    const year = currentDate.getFullYear();
    const month = String(currentDate.getMonth() + 1).padStart(2, "0");
    const day = String(currentDate.getDate()).padStart(2, "0");

    // 24時間分のパスを生成
    for (let hour = 0; hour < 24; hour++) {
      const hourStr = String(hour).padStart(2, "0");

      // Hiveパーティション構造: logs/team_id=xxx/year=YYYY/month=MM/day=DD/hour=HH/
      const prefix = `logs/team_id=${teamId}/year=${year}/month=${month}/day=${day}/hour=${hourStr}/`;
      filePaths.push(prefix);
    }

    currentDate.setDate(currentDate.getDate() + 1);
  }

  console.log(`Generated ${filePaths.length} file paths to check`);
  console.log("Sample paths:", filePaths.slice(0, 3));

  // 各パスに対してSigned URLを生成
  const signedUrls: string[] = [];

  for (const prefix of filePaths) {
    // 例: logs/team_id=team-alpha/year=2025/month=01/day=01/hour=10/logs-10.jsonl.gz
    const hourMatch = prefix.match(/hour=(\d{2})/);
    const hour = hourMatch ? hourMatch[1] : "00";
    const key = `${prefix}logs-${hour}.jsonl.gz`;

    try {
      const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
      });

      // Signed URL生成（30分有効）
      const signedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 1800, // 30分
      });

      signedUrls.push(signedUrl);
      console.log(`✓ Found: ${key}`);
    } catch (error) {
      // デバッグ用：最初の5つのエラーを詳細ログ出力
      const errorCount = filePaths.indexOf(prefix);
      if (errorCount < 5) {
        console.error(`❌ Failed for ${key}:`, {
          error: error instanceof Error ? error.message : String(error),
          errorType: error?.constructor?.name,
          fullError: error,
        });
      }
      // 5つ以上のエラーは簡易ログ
      if (errorCount === 5) {
        console.log("（以降のエラーは省略...）");
      }
    }
  }

  if (signedUrls.length === 0) {
    throw new Error("指定された期間にログファイルが見つかりません");
  }

  console.log(`Generated ${signedUrls.length} signed URLs for team ${teamId}`);

  return signedUrls;
}
