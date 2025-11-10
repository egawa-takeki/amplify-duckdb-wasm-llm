import * as duckdb from "@duckdb/duckdb-wasm";

/**
 * DuckDB WASM ユーティリティ
 *
 * ブラウザ上でDuckDBを実行するための初期化とクエリ実行
 */

let db: duckdb.AsyncDuckDB | null = null;
let conn: duckdb.AsyncDuckDBConnection | null = null;

/**
 * DuckDBを初期化
 */
export async function initializeDuckDB(): Promise<void> {
  if (db) {
    return; // 既に初期化済み
  }

  try {
    // DuckDB WASMバンドルの選択
    const JSDELIVR_BUNDLES = duckdb.getJsDelivrBundles();

    // ワーカーとWASMファイルのURLを設定
    const bundle = await duckdb.selectBundle(JSDELIVR_BUNDLES);

    const worker_url = URL.createObjectURL(
      new Blob([`importScripts("${bundle.mainWorker}");`], {
        type: "text/javascript",
      }),
    );

    const worker = new Worker(worker_url);
    const logger = new duckdb.ConsoleLogger();

    db = new duckdb.AsyncDuckDB(logger, worker);
    await db.instantiate(bundle.mainModule, bundle.pthreadWorker);

    // 接続を作成
    conn = await db.connect();

    URL.revokeObjectURL(worker_url);

    console.log("DuckDB initialized successfully");
  } catch (error) {
    console.error("Failed to initialize DuckDB:", error);
    throw new Error(
      `DuckDB初期化に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
    );
  }
}

/**
 * DuckDB接続を取得
 */
export async function getConnection(): Promise<duckdb.AsyncDuckDBConnection> {
  if (!conn) {
    await initializeDuckDB();
  }

  if (!conn) {
    throw new Error("DuckDB接続の取得に失敗しました");
  }

  return conn;
}

/**
 * S3からParquetファイルを読み込んでテーブルを作成
 */
export async function loadParquetFromS3(
  tableName: string,
  s3Urls: string[],
): Promise<void> {
  const connection = await getConnection();

  try {
    // HTTPFSエクステンションをインストール・ロード
    await connection.query("INSTALL httpfs;");
    await connection.query("LOAD httpfs;");

    // S3設定（Signed URLを使うため認証情報は不要）
    await connection.query("SET s3_url_style='path';");

    // 複数ファイルの場合はUNION ALLで結合
    if (s3Urls.length === 1) {
      const createTableQuery = `
        CREATE OR REPLACE TABLE ${tableName} AS
        SELECT * FROM read_parquet('${s3Urls[0]}');
      `;
      await connection.query(createTableQuery);
    } else {
      // 複数ファイルをパターンで読み込み（DuckDBは自動的に複数ファイルを処理）
      const filePattern = s3Urls.length > 1 ? `[${s3Urls.map((url) => `'${url}'`).join(",")}]` : `'${s3Urls[0]}'`;
      const createTableQuery = `
        CREATE OR REPLACE TABLE ${tableName} AS
        SELECT * FROM read_parquet(${filePattern});
      `;
      await connection.query(createTableQuery);
    }

    console.log(`Table '${tableName}' created from ${s3Urls.length} file(s)`);
  } catch (error) {
    console.error("Failed to load parquet from S3:", error);
    throw new Error(
      `Parquetファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
    );
  }
}

/**
 * SQLクエリを実行
 */
export async function executeQuery(sql: string): Promise<duckdb.Table> {
  const connection = await getConnection();

  try {
    const result = await connection.query(sql);
    return result;
  } catch (error) {
    console.error("Query execution failed:", error);
    throw new Error(
      `クエリ実行に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
    );
  }
}

/**
 * クエリ結果をJSON配列に変換
 */
export function tableToJson(table: duckdb.Table): Record<string, any>[] {
  const rows: Record<string, any>[] = [];
  const numRows = table.numRows;

  for (let i = 0; i < numRows; i++) {
    const row: Record<string, any> = {};
    for (const column of table.schema.fields) {
      const columnData = table.getChildAt(table.schema.fields.indexOf(column));
      row[column.name] = columnData?.get(i);
    }
    rows.push(row);
  }

  return rows;
}

/**
 * DuckDBをクリーンアップ
 */
export async function cleanup(): Promise<void> {
  try {
    if (conn) {
      await conn.close();
      conn = null;
    }
    if (db) {
      await db.terminate();
      db = null;
    }
    console.log("DuckDB cleaned up successfully");
  } catch (error) {
    console.error("Failed to cleanup DuckDB:", error);
  }
}
