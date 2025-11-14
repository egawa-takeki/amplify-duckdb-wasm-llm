/**
 * CSVエクスポートユーティリティ
 */

/**
 * クエリ結果をCSV形式に変換
 */
export function convertToCSV(columns: string[], rows: any[][]): string {
  // ヘッダー行
  const header = columns.map((col) => escapeCSVValue(col)).join(",");

  // データ行
  const dataRows = rows.map((row) =>
    row.map((value) => escapeCSVValue(value)).join(","),
  );

  return [header, ...dataRows].join("\n");
}

/**
 * CSV値のエスケープ
 */
function escapeCSVValue(value: any): string {
  if (value === null || value === undefined) {
    return "";
  }

  const stringValue = String(value);

  // カンマ、改行、ダブルクォートを含む場合はダブルクォートで囲む
  if (
    stringValue.includes(",") ||
    stringValue.includes("\n") ||
    stringValue.includes('"')
  ) {
    // ダブルクォートを2つにエスケープ
    return `"${stringValue.replace(/"/g, '""')}"`;
  }

  return stringValue;
}

/**
 * CSVファイルをダウンロード
 */
export function downloadCSV(
  csv: string,
  filename: string = "query_result.csv",
): void {
  // BOMを追加（Excel対応）
  const BOM = "\uFEFF";
  const blob = new Blob([BOM + csv], { type: "text/csv;charset=utf-8;" });

  // ダウンロードリンクを作成
  const link = document.createElement("a");
  const url = URL.createObjectURL(blob);

  link.setAttribute("href", url);
  link.setAttribute("download", filename);
  link.style.visibility = "hidden";

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  // メモリ解放
  URL.revokeObjectURL(url);
}

/**
 * クエリ結果をCSVとしてエクスポート
 */
export function exportQueryResultAsCSV(
  columns: string[],
  rows: any[][],
  filename?: string,
): void {
  const csv = convertToCSV(columns, rows);
  const timestamp = new Date().toISOString().split("T")[0];
  const defaultFilename = `query_result_${timestamp}.csv`;

  downloadCSV(csv, filename || defaultFilename);
}
