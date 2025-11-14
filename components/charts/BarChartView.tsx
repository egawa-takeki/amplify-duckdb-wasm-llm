"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  detectCategoryColumn,
  detectNumericColumns,
} from "@/lib/chart-utils";

interface BarChartViewProps {
  columns: string[];
  rows: any[][];
}

/**
 * 棒グラフコンポーネント
 */
export function BarChartView({ columns, rows }: BarChartViewProps) {
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

  // データを Recharts 形式に変換
  const categoryColumnIndex = columns.indexOf(categoryColumn);
  const chartData = rows.slice(0, 20).map((row) => {
    // 最大20項目まで
    const dataPoint: any = {
      [categoryColumn]: String(row[categoryColumnIndex] || "N/A"),
    };

    // 数値カラムを追加
    numericColumns.forEach((col) => {
      const colIndex = columns.indexOf(col);
      dataPoint[col] = Number(row[colIndex]) || 0;
    });

    return dataPoint;
  });

  // データを数値で降順ソート（最初の数値カラムを基準）
  if (numericColumns.length > 0) {
    chartData.sort((a, b) => b[numericColumns[0]] - a[numericColumns[0]]);
  }

  // 色のパレット
  const colors = [
    "#3B82F6", // blue
    "#10B981", // green
    "#F59E0B", // amber
    "#EF4444", // red
    "#8B5CF6", // purple
    "#EC4899", // pink
  ];

  return (
    <div className="w-full h-96 p-4 bg-white rounded-lg border border-gray-200">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey={categoryColumn}
            stroke="#6B7280"
            style={{ fontSize: "12px" }}
            angle={-45}
            textAnchor="end"
            height={80}
          />
          <YAxis stroke="#6B7280" style={{ fontSize: "12px" }} />
          <Tooltip
            contentStyle={{
              backgroundColor: "#FFF",
              border: "1px solid #E5E7EB",
              borderRadius: "8px",
            }}
          />
          <Legend wrapperStyle={{ fontSize: "14px" }} />
          {numericColumns.map((col, idx) => (
            <Bar
              key={col}
              dataKey={col}
              fill={colors[idx % colors.length]}
              radius={[4, 4, 0, 0]}
            />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
