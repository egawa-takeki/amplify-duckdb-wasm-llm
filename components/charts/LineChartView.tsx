"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { detectTimeColumn, detectNumericColumns } from "@/lib/chart-utils";

interface LineChartViewProps {
  columns: string[];
  rows: any[][];
}

/**
 * 時系列折れ線グラフコンポーネント
 */
export function LineChartView({ columns, rows }: LineChartViewProps) {
  // 時系列カラムを検出
  const timeColumn = detectTimeColumn(columns);
  const numericColumns = detectNumericColumns(columns, rows);

  if (!timeColumn || numericColumns.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 bg-gray-50 rounded-lg">
        <p className="text-gray-500">
          時系列データまたは数値データが見つかりません
        </p>
      </div>
    );
  }

  // データを Recharts 形式に変換
  const timeColumnIndex = columns.indexOf(timeColumn);
  const chartData = rows.map((row) => {
    const dataPoint: any = {
      [timeColumn]: formatTimeValue(row[timeColumnIndex]),
    };

    // 数値カラムを追加
    numericColumns.forEach((col) => {
      const colIndex = columns.indexOf(col);
      dataPoint[col] = Number(row[colIndex]) || 0;
    });

    return dataPoint;
  });

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
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
          <XAxis
            dataKey={timeColumn}
            stroke="#6B7280"
            style={{ fontSize: "12px" }}
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
            <Line
              key={col}
              type="monotone"
              dataKey={col}
              stroke={colors[idx % colors.length]}
              strokeWidth={2}
              dot={{ fill: colors[idx % colors.length], r: 4 }}
              activeDot={{ r: 6 }}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

/**
 * 時刻値をフォーマット
 */
function formatTimeValue(value: any): string {
  if (!value) return "";

  // ISO 8601 形式の場合
  if (typeof value === "string" && value.includes("T")) {
    try {
      const date = new Date(value);
      return `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, "0")}`;
    } catch {
      return value;
    }
  }

  return String(value);
}
