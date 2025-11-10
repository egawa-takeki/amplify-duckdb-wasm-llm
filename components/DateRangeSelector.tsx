"use client";

import { useState } from "react";

interface DateRange {
  startDate: string;
  endDate: string;
}

type Preset = "1h" | "24h" | "7d" | "30d" | "custom";

const presetLabels: Record<Preset, string> = {
  "1h": "過去1時間",
  "24h": "過去24時間",
  "7d": "過去7日間",
  "30d": "過去30日間",
  custom: "カスタム範囲",
};

interface DateRangeSelectorProps {
  onDateRangeChange?: (dateRange: DateRange) => void;
}

/**
 * 日付範囲選択コンポーネント
 *
 * プリセット選択とカスタム日付範囲の選択が可能
 */
export function DateRangeSelector({ onDateRangeChange }: DateRangeSelectorProps = {}) {
  const [preset, setPreset] = useState<Preset>("24h");
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: "",
    endDate: "",
  });
  const [estimatedSize, setEstimatedSize] = useState("約 450 MB");
  const [showWarning, setShowWarning] = useState(false);

  // プリセット選択時の処理
  const handlePresetChange = (newPreset: Preset) => {
    setPreset(newPreset);

    if (newPreset !== "custom") {
      const now = new Date();
      const endDate = now.toISOString().split("T")[0];
      let startDate = "";

      switch (newPreset) {
        case "1h":
          startDate = new Date(now.getTime() - 3600000)
            .toISOString()
            .split("T")[0];
          setEstimatedSize("約 20 MB");
          setShowWarning(false);
          break;
        case "24h":
          startDate = new Date(now.getTime() - 86400000)
            .toISOString()
            .split("T")[0];
          setEstimatedSize("約 450 MB");
          setShowWarning(false);
          break;
        case "7d":
          startDate = new Date(now.getTime() - 604800000)
            .toISOString()
            .split("T")[0];
          setEstimatedSize("約 2.8 GB");
          setShowWarning(true);
          break;
        case "30d":
          startDate = new Date(now.getTime() - 2592000000)
            .toISOString()
            .split("T")[0];
          setEstimatedSize("約 12 GB");
          setShowWarning(true);
          break;
      }

      const newRange = { startDate, endDate };
      setDateRange(newRange);
      onDateRangeChange?.(newRange);
    }
  };

  // カスタム日付変更時の処理
  const handleDateChange = (field: "startDate" | "endDate", value: string) => {
    const newRange = { ...dateRange, [field]: value };
    setDateRange(newRange);
    onDateRangeChange?.(newRange);

    // 簡易的なサイズ推定（実際はバックエンドで計算）
    if (newRange.startDate && newRange.endDate) {
      const days = Math.ceil(
        (new Date(newRange.endDate).getTime() -
          new Date(newRange.startDate).getTime()) /
          86400000
      );
      const estimatedMB = days * 150; // 1日あたり150MB想定
      setEstimatedSize(
        estimatedMB >= 1000
          ? `約 ${(estimatedMB / 1000).toFixed(1)} GB`
          : `約 ${estimatedMB} MB`
      );
      setShowWarning(estimatedMB > 400);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        日付範囲選択
      </h3>

      {/* プリセット選択 */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          プリセット
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
          {(["1h", "24h", "7d", "30d", "custom"] as Preset[]).map((p) => (
            <button
              key={p}
              onClick={() => handlePresetChange(p)}
              className={`py-2 px-3 rounded-lg text-sm font-medium transition-colors ${
                preset === p
                  ? "bg-primary text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-gray-200"
              }`}
            >
              {presetLabels[p]}
            </button>
          ))}
        </div>
      </div>

      {/* カスタム日付範囲 */}
      {preset === "custom" && (
        <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              開始日
            </label>
            <input
              type="date"
              value={dateRange.startDate}
              onChange={(e) => handleDateChange("startDate", e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              終了日
            </label>
            <input
              type="date"
              value={dateRange.endDate}
              onChange={(e) => handleDateChange("endDate", e.target.value)}
              max={new Date().toISOString().split("T")[0]}
              min={dateRange.startDate}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>
      )}

      {/* データサイズ表示 */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          推定データサイズ:{" "}
          <span className="font-medium">{estimatedSize}</span>
        </div>
        {showWarning && (
          <div className="flex items-center text-sm text-warning">
            <svg
              className="w-4 h-4 mr-1"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            処理に時間がかかる可能性があります
          </div>
        )}
      </div>

      {/* バリデーションエラー */}
      {preset === "custom" &&
        dateRange.startDate &&
        dateRange.endDate &&
        new Date(dateRange.startDate) > new Date(dateRange.endDate) && (
          <div className="mt-2 text-sm text-error">
            開始日は終了日より前に設定してください
          </div>
        )}
    </div>
  );
}
