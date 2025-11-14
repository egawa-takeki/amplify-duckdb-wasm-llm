"use client";

import { useState, useEffect } from "react";
import { Button } from "./ui/Button";

interface SqlDisplayProps {
  sql: string;
  explanation?: string;
  onExecute?: (editedSql?: string) => void;
  isExecuting?: boolean;
}

/**
 * SQL表示コンポーネント
 *
 * 生成されたSQLを表示し、編集・コピー・実行機能を提供
 */
export function SqlDisplay({
  sql,
  explanation,
  onExecute,
  isExecuting = false,
}: SqlDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editedSql, setEditedSql] = useState(sql);

  // sqlが変更された時にeditedSqlも更新
  useEffect(() => {
    setEditedSql(sql);
  }, [sql]);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(editedSql);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error("Failed to copy SQL:", error);
    }
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditedSql(sql);
    setIsEditing(false);
  };

  const handleExecute = () => {
    if (onExecute) {
      onExecute(editedSql);
    }
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
      {/* ヘッダー */}
      <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <svg
            className="w-5 h-5 text-primary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
            />
          </svg>
          <h3 className="text-sm font-semibold text-gray-900">生成されたSQL</h3>
        </div>

        <div className="flex items-center space-x-2">
          {!isEditing ? (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleEdit}
                className="text-xs"
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
                    d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                  />
                </svg>
                編集
              </Button>

              <Button
                size="sm"
                variant="secondary"
                onClick={handleCopy}
                className="text-xs"
              >
                {copied ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-1"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                    コピー済み
                  </>
                ) : (
                  <>
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
                        d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                      />
                    </svg>
                    コピー
                  </>
                )}
              </Button>

              {onExecute && (
                <Button
                  size="sm"
                  onClick={handleExecute}
                  isLoading={isExecuting}
                  disabled={isExecuting}
                  className="text-xs"
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
                      d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  実行
                </Button>
              )}
            </>
          ) : (
            <>
              <Button
                size="sm"
                variant="secondary"
                onClick={handleCancel}
                className="text-xs"
              >
                キャンセル
              </Button>

              <Button
                size="sm"
                onClick={handleSave}
                className="text-xs"
              >
                保存
              </Button>
            </>
          )}
        </div>
      </div>

      {/* SQL表示エリア */}
      <div className="p-4 bg-gray-900 overflow-x-auto">
        {isEditing ? (
          <textarea
            value={editedSql}
            onChange={(e) => setEditedSql(e.target.value)}
            className="w-full min-h-[200px] bg-gray-800 text-green-400 font-mono text-sm p-3 rounded border border-gray-700 focus:border-primary focus:outline-none resize-y"
            spellCheck={false}
          />
        ) : (
          <pre className="text-sm text-green-400 font-mono whitespace-pre-wrap break-words">
            {editedSql}
          </pre>
        )}
      </div>

      {/* 説明 */}
      {explanation && (
        <div className="px-4 py-3 bg-blue-50 border-t border-blue-200">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">説明: </span>
            {explanation}
          </p>
        </div>
      )}
    </div>
  );
}
