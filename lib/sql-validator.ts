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
 * ログスキーマの定義
 */
export const LOG_SCHEMA = {
  tableName: "logs",
  columns: [
    { name: "timestamp", type: "TIMESTAMP", description: "ログ発生時刻" },
    { name: "level", type: "VARCHAR", description: "ログレベル (INFO, WARN, ERROR等)" },
    { name: "service", type: "VARCHAR", description: "サービス名" },
    { name: "message", type: "TEXT", description: "ログメッセージ" },
    { name: "user_id", type: "VARCHAR", description: "ユーザーID" },
    { name: "request_id", type: "VARCHAR", description: "リクエストID" },
    { name: "endpoint", type: "VARCHAR", description: "APIエンドポイント" },
    { name: "status_code", type: "INTEGER", description: "HTTPステータスコード" },
    { name: "response_time", type: "INTEGER", description: "レスポンス時間(ms)" },
    { name: "error_type", type: "VARCHAR", description: "エラータイプ" },
    { name: "stack_trace", type: "TEXT", description: "スタックトレース" },
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
