/**
 * チームごとのログスキーマ定義
 */

export interface SchemaColumn {
  name: string;
  type: string;
  description: string;
}

export interface TeamSchema {
  teamId: string;
  teamName: string;
  gameType: string;
  description: string;
  schema: {
    tableName: string;
    columns: SchemaColumn[];
  };
}

// 共通の基本カラム（全チーム共通）
const BASE_COLUMNS: SchemaColumn[] = [
  { name: "timestamp", type: "TIMESTAMP", description: "イベント発生時刻" },
  { name: "team_id", type: "VARCHAR", description: "チームID" },
  { name: "event_type", type: "VARCHAR", description: "イベントタイプ" },
  { name: "level", type: "VARCHAR", description: "ログレベル (INFO, WARN, ERROR, DEBUG)" },
  { name: "player_id", type: "VARCHAR", description: "プレイヤーID" },
  { name: "player_level", type: "INTEGER", description: "プレイヤーレベル" },
  { name: "session_id", type: "VARCHAR", description: "セッションID" },
];

// 共通のゲームカラム
const COMMON_GAME_COLUMNS: SchemaColumn[] = [
  { name: "event_name", type: "VARCHAR", description: "イベント名" },
  { name: "event_data", type: "TEXT", description: "イベント詳細データ (JSON形式)" },
  { name: "item_id", type: "VARCHAR", description: "アイテムID" },
  { name: "item_quantity", type: "INTEGER", description: "アイテム数量" },
  { name: "currency_type", type: "VARCHAR", description: "通貨タイプ" },
  { name: "currency_amount", type: "INTEGER", description: "通貨量" },
  { name: "transaction_id", type: "VARCHAR", description: "トランザクションID" },
  { name: "purchase_amount", type: "DECIMAL", description: "購入金額" },
  { name: "currency_code", type: "VARCHAR", description: "通貨コード (JPY, USD, EUR等)" },
  { name: "duration_ms", type: "INTEGER", description: "処理時間(ミリ秒)" },
  { name: "status_code", type: "INTEGER", description: "ステータスコード" },
  { name: "error", type: "TEXT", description: "エラーメッセージ" },
  { name: "trace_id", type: "VARCHAR", description: "トレースID" },
  { name: "platform", type: "VARCHAR", description: "プラットフォーム (iOS, Android, Web)" },
  { name: "app_version", type: "VARCHAR", description: "アプリバージョン" },
  { name: "device_id", type: "VARCHAR", description: "デバイスID" },
];

// Team Alpha: RPGゲーム（RPG特有のカラムを追加）
const TEAM_ALPHA_SCHEMA: TeamSchema = {
  teamId: "team-alpha",
  teamName: "RPGゲーム開発チーム",
  gameType: "RPG",
  description: "RPGゲーム向けログスキーマ",
  schema: {
    tableName: "logs",
    columns: [
      ...BASE_COLUMNS,
      { name: "character_class", type: "VARCHAR", description: "キャラクタークラス (warrior, mage, archer等)" },
      { name: "quest_id", type: "VARCHAR", description: "クエストID" },
      { name: "dungeon_id", type: "VARCHAR", description: "ダンジョンID" },
      { name: "boss_id", type: "VARCHAR", description: "ボスID" },
      ...COMMON_GAME_COLUMNS,
    ],
  },
};

// Team Beta: パズルゲーム（パズル特有のカラムを追加）
const TEAM_BETA_SCHEMA: TeamSchema = {
  teamId: "team-beta",
  teamName: "パズルゲーム開発チーム",
  gameType: "Puzzle",
  description: "パズルゲーム向けログスキーマ",
  schema: {
    tableName: "logs",
    columns: [
      ...BASE_COLUMNS,
      { name: "stage_id", type: "VARCHAR", description: "ステージID" },
      { name: "moves_count", type: "INTEGER", description: "移動回数" },
      { name: "score", type: "INTEGER", description: "スコア" },
      { name: "combo_max", type: "INTEGER", description: "最大コンボ数" },
      { name: "puzzle_type", type: "VARCHAR", description: "パズルタイプ (match3, slide, etc)" },
      ...COMMON_GAME_COLUMNS,
    ],
  },
};

// Team Gamma: カードゲーム（カード特有のカラムを追加）
const TEAM_GAMMA_SCHEMA: TeamSchema = {
  teamId: "team-gamma",
  teamName: "カードゲーム開発チーム",
  gameType: "Card",
  description: "カードゲーム向けログスキーマ",
  schema: {
    tableName: "logs",
    columns: [
      ...BASE_COLUMNS,
      { name: "deck_id", type: "VARCHAR", description: "デッキID" },
      { name: "card_id", type: "VARCHAR", description: "カードID" },
      { name: "rarity", type: "VARCHAR", description: "レアリティ (common, rare, epic, legendary)" },
      { name: "battle_id", type: "VARCHAR", description: "バトルID" },
      { name: "turn_count", type: "INTEGER", description: "ターン数" },
      ...COMMON_GAME_COLUMNS,
    ],
  },
};

// デフォルトスキーマ（汎用）
const DEFAULT_SCHEMA: TeamSchema = {
  teamId: "default",
  teamName: "汎用ゲーム",
  gameType: "General",
  description: "汎用的なソーシャルゲームログスキーマ",
  schema: {
    tableName: "logs",
    columns: [...BASE_COLUMNS, ...COMMON_GAME_COLUMNS],
  },
};

// スキーママッピング
export const TEAM_SCHEMAS: Record<string, TeamSchema> = {
  "team-alpha": TEAM_ALPHA_SCHEMA,
  "team-beta": TEAM_BETA_SCHEMA,
  "team-gamma": TEAM_GAMMA_SCHEMA,
  default: DEFAULT_SCHEMA,
};

/**
 * チームIDからスキーマを取得
 */
export function getTeamSchema(teamId: string): TeamSchema {
  return TEAM_SCHEMAS[teamId] || TEAM_SCHEMAS.default;
}

/**
 * チームのスキーマ情報を文字列として取得（Bedrock用）
 */
export function getTeamSchemaDescription(teamId: string): string {
  const teamSchema = getTeamSchema(teamId);
  const columns = teamSchema.schema.columns
    .map((col) => `  ${col.name} (${col.type}): ${col.description}`)
    .join("\n");

  return `ゲームタイプ: ${teamSchema.gameType}
テーブル名: ${teamSchema.schema.tableName}
カラム:
${columns}`;
}

/**
 * 全チームの情報を取得
 */
export function getAllTeamSchemas(): TeamSchema[] {
  return Object.values(TEAM_SCHEMAS).filter((schema) => schema.teamId !== "default");
}
