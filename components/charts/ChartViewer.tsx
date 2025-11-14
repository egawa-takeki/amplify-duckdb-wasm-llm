"use client";

import { useState, useEffect } from "react";
import { LineChartView } from "./LineChartView";
import { BarChartView } from "./BarChartView";
import { PieChartView } from "./PieChartView";
import { QueryResultTable } from "../QueryResultTable";
import {
  recommendChartType,
  type ChartType,
  type ChartRecommendation,
} from "@/lib/chart-utils";

interface ChartViewerProps {
  columns: string[];
  rows: any[][];
  totalRows: number;
}

/**
 * グラフビューアーコンポーネント
 *
 * クエリ結果を様々な形式で可視化
 */
export function ChartViewer({ columns, rows, totalRows }: ChartViewerProps) {
  const [selectedChart, setSelectedChart] = useState<ChartType>("table");
  const [recommendations, setRecommendations] = useState<
    ChartRecommendation[]
  >([]);

  // データが変更されたら推薦を再計算
  useEffect(() => {
    const recs = recommendChartType(columns, rows);
    setRecommendations(recs);

    // 最初の推薦（最も信頼度の高いもの）を自動選択
    if (recs.length > 0 && recs[0].confidence === "high") {
      setSelectedChart(recs[0].type);
    } else {
      setSelectedChart("table");
    }
  }, [columns, rows]);

  // アイコンの取得
  const getChartIcon = (type: ChartType) => {
    switch (type) {
      case "line":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"
            />
          </svg>
        );
      case "bar":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            />
          </svg>
        );
      case "pie":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z"
            />
          </svg>
        );
      case "table":
        return (
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
            />
          </svg>
        );
    }
  };

  // ラベルの取得
  const getChartLabel = (type: ChartType) => {
    switch (type) {
      case "line":
        return "時系列";
      case "bar":
        return "棒グラフ";
      case "pie":
        return "円グラフ";
      case "table":
        return "テーブル";
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-gray-900">
              クエリ結果（{totalRows}件）
            </h3>
            {recommendations.length > 0 && recommendations[0].type !== "table" && (
              <p className="text-xs text-gray-600 mt-1">
                推薦: {recommendations[0].reason}
              </p>
            )}
          </div>

          {/* グラフタイプ切替タブ */}
          <div className="flex items-center space-x-1 bg-white rounded-lg border border-gray-200 p-1">
            {recommendations.map((rec) => (
              <button
                key={rec.type}
                onClick={() => setSelectedChart(rec.type)}
                className={`flex items-center space-x-2 px-3 py-1.5 rounded transition-colors ${
                  selectedChart === rec.type
                    ? "bg-primary text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                title={rec.reason}
              >
                {getChartIcon(rec.type)}
                <span className="text-xs font-medium">
                  {getChartLabel(rec.type)}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* グラフ表示エリア */}
      <div className="p-4">
        {selectedChart === "line" && (
          <LineChartView columns={columns} rows={rows} />
        )}
        {selectedChart === "bar" && (
          <BarChartView columns={columns} rows={rows} />
        )}
        {selectedChart === "pie" && (
          <PieChartView columns={columns} rows={rows} />
        )}
        {selectedChart === "table" && (
          <QueryResultTable
            columns={columns}
            rows={rows}
            totalRows={totalRows}
          />
        )}
      </div>
    </div>
  );
}
