"use client";

import { useState } from "react";
import { ConversationHistoryList } from "./ConversationHistory";
import type { ConversationHistory } from "@/lib/conversation-history";

interface SidebarProps {
  onSelectHistory: (history: ConversationHistory) => void;
  onNewConversation: () => void;
  currentHistoryId?: string;
}

/**
 * サイドバーコンポーネント
 */
export function Sidebar({
  onSelectHistory,
  onNewConversation,
  currentHistoryId,
}: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`bg-white border-r border-gray-200 transition-all duration-300 flex flex-col ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* 折りたたみボタン */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center flex-shrink-0">
        {!isCollapsed && (
          <h2 className="font-semibold text-gray-900">会話履歴</h2>
        )}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          aria-label={isCollapsed ? "サイドバーを開く" : "サイドバーを閉じる"}
        >
          <svg
            className={`w-5 h-5 text-gray-600 transition-transform ${
              isCollapsed ? "rotate-180" : ""
            }`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
      </div>

      {/* コンテンツエリア */}
      <div className="flex-1 overflow-hidden">
        {!isCollapsed ? (
          <ConversationHistoryList
            onSelectHistory={onSelectHistory}
            onNewConversation={onNewConversation}
            currentHistoryId={currentHistoryId}
          />
        ) : (
          <div className="flex flex-col items-center p-4 space-y-4">
            {/* 折りたたみ時の新規会話ボタン */}
            <button
              onClick={onNewConversation}
              className="p-2 bg-primary text-white rounded-lg hover:bg-primary-hover transition-colors"
              aria-label="新規会話"
            >
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </aside>
  );
}
