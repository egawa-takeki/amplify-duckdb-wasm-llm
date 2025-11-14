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
 * S3からJSONLファイル（gzip圧縮）を読み込んでテーブルを作成
 *
 * DuckDB WASMのHTTPFS経由での読み込みに問題があるため、
 * ブラウザのfetch APIでデータを取得してから挿入する
 */
export async function loadParquetFromS3(
  tableName: string,
  s3Urls: string[],
): Promise<void> {
  const connection = await getConnection();

  try {
    console.log(`Loading ${s3Urls.length} files into ${tableName}...`);

    // 全ファイルのデータを集約
    let allData: any[] = [];
    let loadedFiles = 0;

    for (let i = 0; i < s3Urls.length; i++) {
      const url = s3Urls[i];

      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Skipping ${url}: ${response.statusText}`);
          continue;
        }

        // gzip展開
        const blob = await response.blob();
        const decompressedStream = blob.stream().pipeThrough(new DecompressionStream('gzip'));
        const decompressedBlob = await new Response(decompressedStream).blob();
        const text = await decompressedBlob.text();

        // 改行で分割してJSON配列に変換
        const lines = text.trim().split('\n').filter(line => line.trim());
        const jsonData = lines.map(line => JSON.parse(line));

        allData = allData.concat(jsonData);
        loadedFiles++;

        if ((loadedFiles) % 10 === 0) {
          console.log(`Loaded ${loadedFiles}/${s3Urls.length} files (${allData.length} records so far)`);
        }
      } catch (err) {
        console.warn(`Failed to load file ${i}: ${err}`);
        // エラーがあってもスキップして続行
      }
    }

    if (allData.length === 0) {
      throw new Error("No data loaded from any files");
    }

    console.log(`Total loaded: ${loadedFiles} files, ${allData.length} records`);

    // サンプルデータをログ出力（デバッグ用）
    if (allData.length > 0) {
      console.log('Sample record:', allData[0]);
    }

    // DuckDBでJSON配列をテーブルとして読み込む
    // JSONLの各行をJSON配列の要素として扱う
    const jsonContent = JSON.stringify(allData, null, 0);
    await db?.registerFileText('temp_data.json', jsonContent);

    // JSONからテーブルを作成（read_json_autoを使用してスキーマ自動検出）
    await connection.query(`
      CREATE OR REPLACE TABLE ${tableName} AS
      SELECT * FROM read_json_auto('temp_data.json')
    `);

    // テーブル構造を確認
    const schemaResult = await connection.query(`DESCRIBE ${tableName}`);
    const schemaRows = schemaResult.toArray();
    console.log('Table schema - Column count:', schemaRows.length);

    // 各カラムの名前と型を表示
    for (let i = 0; i < Math.min(10, schemaRows.length); i++) {
      const row = schemaRows[i];
      console.log(`  Column ${i}:`, {
        column_name: row.column_name,
        column_type: row.column_type,
        null: row.null,
      });
    }

    // テーブルの最初の行を確認
    const sampleQuery = await connection.query(`SELECT timestamp, level, team_id, event_type FROM ${tableName} LIMIT 1`);
    const sampleRows = sampleQuery.toArray();
    if (sampleRows.length > 0) {
      const firstRow = sampleRows[0];
      console.log('Sample row data:', {
        timestamp: firstRow.timestamp,
        level: firstRow.level,
        team_id: firstRow.team_id,
        event_type: firstRow.event_type,
      });
    }

    // テーブルの行数を確認
    const countResult = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const countRow = countResult.toArray()[0];
    console.log('Row count in table:', countRow.count);

    console.log(`Table '${tableName}' created with ${allData.length} records`);
  } catch (error) {
    console.error("Failed to load JSONL from S3:", error);
    throw new Error(
      `JSONLファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
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
