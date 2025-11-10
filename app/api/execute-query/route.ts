import { NextRequest, NextResponse } from "next/server";
import { initializeDuckDB, loadParquetFromS3, executeQuery } from "@/lib/duckdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface ExecuteQueryRequest {
  sql: string;
  signedUrls: string[];
}

/**
 * DuckDBクエリ実行API
 *
 * POST /api/execute-query
 *
 * S3 Signed URLsからParquetファイルを読み込み、SQLクエリを実行
 */
export async function POST(request: NextRequest) {
  try {
    const body: ExecuteQueryRequest = await request.json();

    if (!body.sql) {
      return NextResponse.json(
        { error: "SQLクエリが指定されていません" },
        { status: 400 }
      );
    }

    if (!body.signedUrls || body.signedUrls.length === 0) {
      return NextResponse.json(
        { error: "Signed URLsが指定されていません" },
        { status: 400 }
      );
    }

    // DuckDBを初期化
    await initializeDuckDB();

    // S3からParquetファイルを読み込み
    await loadParquetFromS3("logs", body.signedUrls);

    // クエリを実行
    const result = await executeQuery(body.sql);

    // 結果を配列形式に変換
    const columns = result.schema.fields.map((field) => field.name);
    const rows: any[][] = [];

    for await (const batch of result) {
      for (let i = 0; i < batch.numRows; i++) {
        const row: any[] = [];
        for (let j = 0; j < columns.length; j++) {
          row.push(batch.getChildAt(j)?.get(i));
        }
        rows.push(row);
      }
    }

    return NextResponse.json({
      columns,
      rows,
      totalRows: rows.length,
      executionTime: Date.now(),
    });
  } catch (error) {
    console.error("Query execution error:", error);

    return NextResponse.json(
      {
        error: "クエリ実行中にエラーが発生しました",
        details: error instanceof Error ? error.message : "不明なエラー",
      },
      { status: 500 }
    );
  }
}
