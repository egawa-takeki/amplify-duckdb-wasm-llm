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
 *
 * DuckDB WASMのParquetネイティブサポートを使用
 * ブラウザのfetch APIでデータを取得してから挿入する
 */
export async function loadParquetFromS3(
  tableName: string,
  s3Urls: string[],
): Promise<void> {
  const connection = await getConnection();

  try {
    console.log(`Loading ${s3Urls.length} Parquet files into ${tableName}...`);

    let loadedFiles = 0;
    let totalRecords = 0;

    // 最初のファイルでテーブルを作成
    let firstFile = true;

    for (let i = 0; i < s3Urls.length; i++) {
      const url = s3Urls[i];

      try {
        const response = await fetch(url);
        if (!response.ok) {
          console.warn(`Skipping ${url}: ${response.statusText}`);
          continue;
        }

        // Parquetファイルを取得
        const arrayBuffer = await response.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // DuckDBにファイルを登録
        const fileName = `parquet_file_${i}.parquet`;
        await db?.registerFileBuffer(fileName, uint8Array);

        if (firstFile) {
          // 最初のファイル: テーブルを作成
          await connection.query(`
            CREATE OR REPLACE TABLE ${tableName} AS
            SELECT * FROM read_parquet('${fileName}')
          `);
          firstFile = false;

          // テーブル構造を確認
          const schemaResult = await connection.query(`DESCRIBE ${tableName}`);
          const schemaRows = schemaResult.toArray();
          console.log('Table schema - Column count:', schemaRows.length);

          // 各カラムの名前と型を表示
          for (let j = 0; j < Math.min(10, schemaRows.length); j++) {
            const row = schemaRows[j];
            console.log(`  Column ${j}:`, {
              column_name: row.column_name,
              column_type: row.column_type,
              null: row.null,
            });
          }
        } else {
          // 2つ目以降: データを追加
          await connection.query(`
            INSERT INTO ${tableName}
            SELECT * FROM read_parquet('${fileName}')
          `);
        }

        loadedFiles++;

        if (loadedFiles % 10 === 0) {
          const countResult = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
          const countRow = countResult.toArray()[0];
          totalRecords = Number(countRow.count);
          console.log(`Loaded ${loadedFiles}/${s3Urls.length} files (${totalRecords} records so far)`);
        }
      } catch (err) {
        console.warn(`Failed to load file ${i}: ${err}`);
        // エラーがあってもスキップして続行
      }
    }

    if (loadedFiles === 0) {
      throw new Error("No Parquet files loaded successfully");
    }

    // 最終的な行数を確認
    const countResult = await connection.query(`SELECT COUNT(*) as count FROM ${tableName}`);
    const countRow = countResult.toArray()[0];
    totalRecords = Number(countRow.count);

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

    console.log(`Table '${tableName}' created with ${totalRecords} records from ${loadedFiles} files`);
  } catch (error) {
    console.error("Failed to load Parquet from S3:", error);
    throw new Error(
      `Parquetファイルの読み込みに失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
    );
  }
}

/**
 * SQLクエリを実行
 */
export async function executeQuery(sql: string): Promise<any> {
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
export function tableToJson(table: any): Record<string, any>[] {
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
