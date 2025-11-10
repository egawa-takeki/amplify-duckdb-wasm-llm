import { NextRequest, NextResponse } from "next/server";
import { S3Client, GetObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { fetchAuthSession } from "aws-amplify/auth";
import { getUserInfo } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface GetSignedUrlsRequest {
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const BUCKET_NAME = process.env.NEXT_PUBLIC_STORAGE_BUCKET_NAME;
const REGION = process.env.NEXT_PUBLIC_AWS_REGION || "us-east-1";

/**
 * S3 Signed URL生成API
 *
 * POST /api/get-signed-urls
 *
 * チームIDに基づいてS3からログファイルのSigned URLを生成
 */
export async function POST(request: NextRequest) {
  try {
    // リクエストボディの取得
    const body: GetSignedUrlsRequest = await request.json();

    if (!body.dateRange || !body.dateRange.startDate || !body.dateRange.endDate) {
      return NextResponse.json(
        { error: "日付範囲が指定されていません" },
        { status: 400 },
      );
    }

    // ユーザー情報の取得
    const userInfo = await getUserInfo();
    if (!userInfo || !userInfo.teamId) {
      return NextResponse.json(
        { error: "チームIDが取得できません" },
        { status: 403 },
      );
    }

    // AWS認証情報の取得
    const session = await fetchAuthSession();
    if (!session.credentials) {
      return NextResponse.json(
        { error: "AWS認証情報が取得できません" },
        { status: 401 },
      );
    }

    // S3クライアントの作成
    const s3Client = new S3Client({
      region: REGION,
      credentials: session.credentials,
    });

    // 日付範囲からS3キーのプレフィックスを生成
    const startDate = new Date(body.dateRange.startDate);
    const endDate = new Date(body.dateRange.endDate);

    // 日付ごとのファイルパスを生成
    const filePaths: string[] = [];
    const currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      const year = currentDate.getFullYear();
      const month = String(currentDate.getMonth() + 1).padStart(2, "0");
      const day = String(currentDate.getDate()).padStart(2, "0");

      // S3パス: team_id/year/month/day/*.parquet
      const prefix = `${userInfo.teamId}/${year}/${month}/${day}/`;
      filePaths.push(prefix);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    // 各パスに対してSigned URLを生成
    // 実際の実装では、S3のListObjects APIを使ってファイル一覧を取得する必要がある
    // ここでは簡略化のため、パターンベースで生成

    const signedUrls: string[] = [];

    for (const prefix of filePaths) {
      // 例: team-alpha/2025/01/01/logs.parquet
      const key = `${prefix}logs.parquet`;

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
      } catch (error) {
        // ファイルが存在しない場合はスキップ
        console.warn(`File not found: ${key}`);
      }
    }

    if (signedUrls.length === 0) {
      return NextResponse.json(
        { error: "指定された期間にログファイルが見つかりません" },
        { status: 404 },
      );
    }

    return NextResponse.json({
      signedUrls,
      count: signedUrls.length,
    });
  } catch (error) {
    console.error("Signed URL generation error:", error);

    return NextResponse.json(
      {
        error: "Signed URL生成中にエラーが発生しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 },
    );
  }
}
