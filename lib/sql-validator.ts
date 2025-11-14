/**
 * SQL検証ユーティリティ
 *
 * DuckDB向けのSQL文を検証し、危険なコマンドをブロック
 */

// 禁止されているSQLコマンド（document.mdより）
const FORBIDDEN_COMMANDS = [
  "COPY",
  "ATTACH",
  "DETACH",
  "INSTALL",
  "LOAD",
  "CREATE TABLE",
  "DROP",
  "DELETE",
  "UPDATE",
  "INSERT",
  "ALTER",
  "PRAGMA",
  "EXPORT",
  "IMPORT",
];

// 許可されているSQLコマンド
const ALLOWED_COMMANDS = ["SELECT", "WITH"];

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  sanitizedSql?: string;
}

/**
 * SQLクエリを検証
 */
export function validateSql(sql: string): ValidationResult {
  if (!sql || sql.trim().length === 0) {
    return {
      isValid: false,
      error: "SQLクエリが空です",
    };
  }

  const trimmedSql = sql.trim().toUpperCase();

  // 禁止コマンドのチェック
  for (const forbidden of FORBIDDEN_COMMANDS) {
    if (trimmedSql.includes(forbidden)) {
      return {
        isValid: false,
        error: `禁止されているコマンドが含まれています: ${forbidden}`,
      };
  }
  }

  // 許可されているコマンドで始まるかチェック
  const startsWithAllowed = ALLOWED_COMMANDS.some((cmd) =>
    trimmedSql.startsWith(cmd),
  );

  if (!startsWithAllowed) {
    return {
      isValid: false,
      error: `SQLはSELECTまたはWITHで始まる必要があります`,
    };
  }

  // セミコロンの数をチェック（複数ステートメント防止）
  const semicolonCount = (sql.match(/;/g) || []).length;
  if (semicolonCount > 1) {
    return {
      isValid: false,
      error: "複数のSQL文を実行することはできません",
    };
  }

  // 基本的なSQLインジェクション対策（コメントアウト禁止）
  if (trimmedSql.includes("--") || trimmedSql.includes("/*")) {
    return {
      isValid: false,
      error: "SQLコメントは使用できません",
    };
  }

  return {
    isValid: true,
    sanitizedSql: sql.trim(),
  };
}

/**
 * ログスキーマの定義（ソーシャルゲーム向け）
 */
export const LOG_SCHEMA = {
  tableName: "logs",
  columns: [
    // 基本情報
    { name: "timestamp", type: "TIMESTAMP", description: "イベント発生時刻" },
    { name: "team_id", type: "VARCHAR", description: "チームID" },
    { name: "event_type", type: "VARCHAR", description: "イベントタイプ (login, gacha, purchase, quest, battle等)" },
    { name: "level", type: "VARCHAR", description: "ログレベル (INFO, WARN, ERROR, DEBUG)" },

    // プレイヤー情報
    { name: "player_id", type: "VARCHAR", description: "プレイヤーID" },
    { name: "player_level", type: "INTEGER", description: "プレイヤーレベル" },
    { name: "session_id", type: "VARCHAR", description: "セッションID" },

    // ゲームイベント情報
    { name: "event_name", type: "VARCHAR", description: "イベント名 (daily_login, gacha_pull, quest_clear等)" },
    { name: "event_data", type: "TEXT", description: "イベント詳細データ (JSON形式)" },

    // アイテム/リソース
    { name: "item_id", type: "VARCHAR", description: "アイテムID" },
    { name: "item_quantity", type: "INTEGER", description: "アイテム数量" },
    { name: "currency_type", type: "VARCHAR", description: "通貨タイプ (gem, coin, ticket, energy等)" },
    { name: "currency_amount", type: "INTEGER", description: "通貨量" },

    // 課金情報
    { name: "transaction_id", type: "VARCHAR", description: "トランザクションID" },
    { name: "purchase_amount", type: "DECIMAL", description: "購入金額" },
    { name: "currency_code", type: "VARCHAR", description: "通貨コード (JPY, USD, EUR等)" },

    // パフォーマンス
    { name: "duration_ms", type: "INTEGER", description: "処理時間(ミリ秒)" },
    { name: "status_code", type: "INTEGER", description: "ステータスコード" },

    // エラー/デバッグ
    { name: "error", type: "TEXT", description: "エラーメッセージ" },
    { name: "trace_id", type: "VARCHAR", description: "トレースID" },

    // その他
    { name: "platform", type: "VARCHAR", description: "プラットフォーム (iOS, Android, Web)" },
    { name: "app_version", type: "VARCHAR", description: "アプリバージョン" },
    { name: "device_id", type: "VARCHAR", description: "デバイスID" },
  ],
};

/**
 * スキーマ情報を文字列として取得
 */
export function getSchemaDescription(): string {
  const columns = LOG_SCHEMA.columns
    .map((col) => `  ${col.name} (${col.type}): ${col.description}`)
    .join("\n");

  return `テーブル名: ${LOG_SCHEMA.tableName}
カラム:
${columns}`;
}
