"use client";

import { useState, useEffect } from "react";
import {
  type ConversationHistory,
  getConversationHistory,
  deleteConversationHistory,
  clearAllConversationHistory,
} from "@/lib/conversation-history";

interface ConversationHistoryProps {
  onSelectHistory: (history: ConversationHistory) => void;
  onNewConversation: () => void;
  currentHistoryId?: string;
}

/**
 * 会話履歴コンポーネント
 */
export function ConversationHistoryList({
  onSelectHistory,
  onNewConversation,
  currentHistoryId,
}: ConversationHistoryProps) {
  const [history, setHistory] = useState<ConversationHistory[]>([]);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // 履歴を読み込み
  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = () => {
    const loaded = getConversationHistory();
    setHistory(loaded);
  };

  const handleDelete = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();

    if (confirm("この履歴を削除しますか？")) {
      deleteConversationHistory(id);
      loadHistory();
    }
  };

  const handleClearAll = () => {
    clearAllConversationHistory();
    loadHistory();
    setShowClearConfirm(false);
    onNewConversation();
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "たった今";
    if (diffMins < 60) return `${diffMins}分前`;
    if (diffHours < 24) return `${diffHours}時間前`;
    if (diffDays < 7) return `${diffDays}日前`;

    return date.toLocaleDateString("ja-JP", {
      month: "short",
      day: "numeric",
    });
  };

  const truncateText = (text: string, maxLength: number = 50) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + "...";
  };

  return (
    <div className="flex flex-col h-full">
      {/* ヘッダー */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-semibold text-gray-900">会話履歴</h2>
          {history.length > 0 && (
            <button
              onClick={() => setShowClearConfirm(true)}
              className="text-xs text-gray-500 hover:text-error transition-colors"
            >
              全削除
            </button>
          )}
        </div>

        <button
          onClick={onNewConversation}
          className="w-full bg-primary text-white px-4 py-2 rounded-lg hover:bg-primary-hover transition-colors flex items-center justify-center space-x-2 text-sm"
        >
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
          <span>新規会話</span>
        </button>
      </div>

      {/* 履歴リスト */}
      <div className="flex-1 overflow-y-auto">
        {history.length === 0 ? (
          <div className="p-4 text-center text-sm text-gray-500">
            会話履歴がありません
          </div>
        ) : (
          <div className="p-2 space-y-1">
            {history.map((item) => (
              <button
                key={item.id}
                onClick={() => onSelectHistory(item)}
                className={`w-full text-left p-3 rounded-lg transition-colors group ${
                  currentHistoryId === item.id
                    ? "bg-primary-50 border border-primary-200"
                    : "hover:bg-gray-50 border border-transparent"
                }`}
              >
                <div className="flex items-start justify-between mb-1">
                  <p className="text-sm font-medium text-gray-900 flex-1 pr-2">
                    {truncateText(item.question)}
                  </p>
                  <button
                    onClick={(e) => handleDelete(item.id, e)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-error"
                  >
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                      />
                    </svg>
                  </button>
                </div>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <span>{formatDate(item.timestamp)}</span>
                  <span>{item.resultSummary}</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 全削除確認モーダル */}
      {showClearConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              全ての履歴を削除
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              全ての会話履歴を削除します。この操作は取り消せません。
            </p>
            <div className="flex space-x-3">
              <button
                onClick={() => setShowClearConfirm(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                キャンセル
              </button>
              <button
                onClick={handleClearAll}
                className="flex-1 px-4 py-2 bg-error text-white rounded-lg hover:bg-red-600 transition-colors text-sm"
              >
                削除する
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
