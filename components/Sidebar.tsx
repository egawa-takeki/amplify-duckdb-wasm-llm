"use client";

import { useState } from "react";

/**
 * サイドバーコンポーネント
 *
 * 会話履歴の表示用（Phase 7で実装）
 */
export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);

  return (
    <aside
      className={`bg-white border-r border-gray-200 transition-all duration-300 ${
        isCollapsed ? "w-16" : "w-64"
      }`}
    >
      {/* 折りたたみボタン */}
      <div className="p-4 border-b border-gray-200 flex justify-between items-center">
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
      <div className="p-4">
        {!isCollapsed ? (
          <>
            {/* 新規会話ボタン */}
            <button className="w-full bg-primary text-white py-2 px-4 rounded-lg hover:bg-primary-hover transition-colors mb-4">
              <div className="flex items-center justify-center space-x-2">
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
                <span>新規会話</span>
              </div>
            </button>

            {/* 履歴リスト（空の状態） */}
            <div className="text-center text-gray-500 text-sm mt-8">
              <svg
                className="w-8 h-8 mx-auto mb-2 text-gray-300"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                />
              </svg>
              <p>会話履歴はありません</p>
              <p className="text-xs mt-1">
                質問を送信すると履歴が表示されます
              </p>
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            {/* 折りたたみ時の新規会話ボタン */}
            <button
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
