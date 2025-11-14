"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  detectCategoryColumn,
  detectNumericColumns,
} from "@/lib/chart-utils";

interface PieChartViewProps {
  columns: string[];
  rows: any[][];
}

/**
 * 円グラフコンポーネント
 */
export function PieChartView({ columns, rows }: PieChartViewProps) {
  // カテゴリカラムと数値カラムを検出
  const categoryColumn = detectCategoryColumn(columns, rows);
  const numericColumns = detectNumericColumns(columns, rows);

  if (!categoryColumn || numericColumns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">
          カテゴリデータまたは数値データが見つかりません
        </p>
      </div>
    );
  }

  // 最初の数値カラムを使用
  const valueColumn = numericColumns[0];
  const categoryColumnIndex = columns.indexOf(categoryColumn);
  const valueColumnIndex = columns.indexOf(valueColumn);

  // データを Recharts 形式に変換
  const chartData = rows.slice(0, 10).map((row) => ({
    // 最大10項目まで
    name: String(row[categoryColumnIndex] || "N/A"),
    value: Number(row[valueColumnIndex]) || 0,
  }));

  // 値で降順ソート
  chartData.sort((a, b) => b.value - a.value);

  // 色のパレット
  const COLORS = [
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // amber
    "#EF4444", // red
    "#8B5CF6", // purple
    "#EC4899", // pink
    "#06B6D4", // cyan
    "#F97316", // orange
    "#84CC16", // lime
    "#A855F7", // violet
  ];

  // カスタムラベル（パーセンテージ表示）
  const renderLabel = (entry: any) => {
    const percent = ((entry.value / entry.payload.total) * 100).toFixed(1);
    return `${percent}%`;
  };

  // 合計値を計算
  const total = chartData.reduce((sum, entry) => sum + entry.value, 0);
  const dataWithTotal = chartData.map((entry) => ({ ...entry, total }));

  return (
    <div className="w-full h-96 p-4 bg-white rounded-lg border border-gray-200">
      <div className="mb-2 text-center">
        <p className="text-sm font-medium text-gray-700">
          {categoryColumn} 別の {valueColumn}
        </p>
      </div>

      <ResponsiveContainer width="100%" height="90%">
        <PieChart>
          <Pie
            data={dataWithTotal}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={renderLabel}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {dataWithTotal.map((_, index) => (
              <Cell
                key={`cell-${index}`}
                fill={COLORS[index % COLORS.length]}
              />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFF",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
            }}
            formatter={(value: any) => value.toLocaleString()}
          />
          <Legend
            wrapperStyle={{ fontSize: "12px" }}
            formatter={(value, entry: any) => {
              const percent = ((entry.payload.value / total) * 100).toFixed(1);
              return `${value} (${percent}%)`;
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
