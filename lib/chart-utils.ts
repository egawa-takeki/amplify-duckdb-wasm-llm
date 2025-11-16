/**
 * グラフユーティリティ関数
 *
 * クエリ結果から最適なグラフタイプを推薦
 */

export type ChartType = "line" | "bar" | "pie" | "table";

export interface ChartRecommendation {
  type: ChartType;
  reason: string;
  confidence: "high" | "medium" | "low";
}

/**
 * クエリ結果から最適なグラフタイプを推薦
 */
export function recommendChartType(
  columns: string[],
  rows: any[][],
): ChartRecommendation[] {
  const recommendations: ChartRecommendation[] = [];

  // データが空の場合はテーブルのみ
  if (rows.length === 0 || columns.length === 0) {
    return [
      {
        type: "table",
        reason: "データが空です",
        confidence: "high",
      },
    ];
  }

  // カラム数と行数を取得
  const columnCount = columns.length;
  const rowCount = rows.length;

  // カラム名の小文字化
  const lowerColumns = columns.map((c) => c.toLowerCase());

  // 1. 時系列データの検出（timestamp, date, time などのカラム）
  const hasTimeColumn = lowerColumns.some(
    (col) =>
      col.includes("timestamp") ||
      col.includes("date") ||
      col.includes("time") ||
      col.includes("hour") ||
      col.includes("day") ||
      col.includes("month") ||
      col.includes("year"),
  );

  // 2. 数値カラムの検出
  const numericColumns = columns.filter((_, idx) => {
    return rows.every((row) => {
      const value = row[idx];
      return (
        value === null ||
        value === undefined ||
        typeof value === "number" ||
        !isNaN(Number(value))
      );
    });
  });

  const hasNumericColumn = numericColumns.length > 0;

  // 3. カテゴリカラムの検出
  const categoricalColumns = columns.filter((_, idx) => {
    const uniqueValues = new Set(rows.map((row) => row[idx]));
    return uniqueValues.size <= 20 && uniqueValues.size > 1;
  });

  // 推薦ロジック

  // 時系列 + 数値 → 折れ線グラフ
  if (hasTimeColumn && hasNumericColumn && rowCount >= 2) {
    recommendations.push({
      type: "line",
      reason: "時系列データと数値データが含まれています",
      confidence: "high",
    });
  }

  // カテゴリ + 数値（少数の行） → 円グラフ
  if (
    categoricalColumns.length > 0 &&
    hasNumericColumn &&
    rowCount <= 10 &&
    rowCount >= 2
  ) {
    recommendations.push({
      type: "pie",
      reason: "カテゴリ別の割合を表示するのに適しています",
      confidence: "high",
    });
  }

  // カテゴリ + 数値 → 棒グラフ
  if (categoricalColumns.length > 0 && hasNumericColumn && rowCount >= 2) {
    recommendations.push({
      type: "bar",
      reason: "カテゴリ別の比較に適しています",
      confidence: "high",
    });
  }

  // どんな場合でもテーブルは表示可能
  recommendations.push({
    type: "table",
    reason: "すべてのデータを詳細に確認できます",
    confidence: "high",
  });

  return recommendations;
}

/**
 * 時系列カラムを検出
 */
export function detectTimeColumn(columns: string[]): string | null {
  const lowerColumns = columns.map((c) => c.toLowerCase());
  const timeKeywords = [
    "timestamp",
    "datetime",
    "date",
    "time",
    "created_at",
    "updated_at",
  ];

  for (let i = 0; i < lowerColumns.length; i++) {
    for (const keyword of timeKeywords) {
      if (lowerColumns[i].includes(keyword)) {
        return columns[i];
      }
    }
  }

  return null;
}

/**
 * 数値カラムを検出（時系列カラムを除外）
 */
export function detectNumericColumns(
  columns: string[],
  rows: any[][],
): string[] {
  // 時系列カラムを特定
  const timeColumn = detectTimeColumn(columns);

  return columns.filter((col, idx) => {
    if (rows.length === 0) return false;

    // 時系列カラムは除外（X軸専用）
    if (timeColumn && col === timeColumn) {
      return false;
    }

    return rows.every((row) => {
      const value = row[idx];
      if (value === null || value === undefined) return true;
      return typeof value === "number" || !isNaN(Number(value));
    });
  });
}

/**
 * カテゴリカラムを検出（ユニーク値が20以下）
 */
export function detectCategoryColumn(
  columns: string[],
  rows: any[][],
): string | null {
  for (let i = 0; i < columns.length; i++) {
    const uniqueValues = new Set(rows.map((row) => row[i]));
    if (uniqueValues.size <= 20 && uniqueValues.size > 1) {
      return columns[i];
    }
  }

  return null;
}
