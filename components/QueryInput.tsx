"use client";

import { useState, useRef, useEffect } from "react";

interface QueryInputProps {
  onSubmit?: (query: string) => void;
  isLoading?: boolean;
  disabled?: boolean;
}

const suggestions = [
  "過去24時間のエラーログを表示",
  "最も遅いエンドポイントトップ10",
  "今日のログレベル別件数",
  "エラー率の推移をグラフで表示",
  "サービス別のリクエスト数を円グラフで",
];

/**
 * 自然言語クエリ入力コンポーネント
 */
export function QueryInput({ onSubmit, isLoading = false, disabled = false }: QueryInputProps) {
  const [query, setQuery] = useState("");
  const [charCount, setCharCount] = useState(0);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const maxChars = 500;

  // 自動リサイズ
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [query]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxChars) {
      setQuery(value);
      setCharCount(value.length);
    }
  };

  const handleSubmit = () => {
    if (query.trim() && !isLoading && !disabled) {
      onSubmit?.(query.trim());
      // クエリ送信後はクリアしない（会話継続のため）
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter: 送信、Shift+Enter: 改行
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion);
    setCharCount(suggestion.length);
    setShowSuggestions(false);
    textareaRef.current?.focus();
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">
          ログについて質問
        </h3>
        <button
          onClick={() => setShowSuggestions(!showSuggestions)}
          className="text-sm text-primary hover:text-primary-hover transition-colors flex items-center"
        >
          <svg
            className="w-4 h-4 mr-1"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          質問例を見る
        </button>
      </div>

      {/* サジェスト */}
      {showSuggestions && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-sm font-medium text-blue-900 mb-2">質問例:</p>
          <div className="space-y-2">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                onClick={() => handleSuggestionClick(suggestion)}
                className="block w-full text-left text-sm text-blue-700 hover:text-blue-900 hover:bg-blue-100 px-2 py-1 rounded transition-colors"
              >
                • {suggestion}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* 入力エリア */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder={disabled ? "データをロードしてから質問してください" : "ログについて質問してください（例：過去24時間のエラーログを表示）"}
          disabled={isLoading || disabled}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none min-h-[80px] max-h-[200px] disabled:bg-gray-50 disabled:text-gray-500"
          rows={3}
        />

        {/* 文字数カウンター */}
        <div
          className={`absolute bottom-3 right-3 text-xs ${
            charCount > maxChars * 0.9
              ? "text-error"
              : charCount > maxChars * 0.7
                ? "text-warning"
                : "text-gray-400"
          }`}
        >
          {charCount} / {maxChars}
        </div>
      </div>

      {/* 送信ボタンとヒント */}
      <div className="mt-3 flex items-center justify-between">
        <p className="text-xs text-gray-500">
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
            Enter
          </kbd>{" "}
          で送信、
          <kbd className="px-2 py-1 bg-gray-100 border border-gray-300 rounded text-xs">
            Shift + Enter
          </kbd>{" "}
          で改行
        </p>

        <button
          onClick={handleSubmit}
          disabled={!query.trim() || isLoading || disabled}
          className="bg-primary text-white px-6 py-2 rounded-lg hover:bg-primary-hover transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center space-x-2"
        >
          {isLoading ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
              <span>処理中...</span>
            </>
          ) : (
            <>
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>送信</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
