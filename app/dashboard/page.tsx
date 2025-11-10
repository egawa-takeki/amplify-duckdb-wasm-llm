"use client";

import { useState } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { DateRangeSelector } from "@/components/DateRangeSelector";
import { QueryInput } from "@/components/QueryInput";
import { SqlDisplay } from "@/components/SqlDisplay";
import { QueryResultTable } from "@/components/QueryResultTable";
import { Card } from "@/components/ui/Card";
import { Toast } from "@/components/ui/Toast";
import { generateSqlWithBedrock } from "@/lib/bedrock";

/**
 * ダッシュボードページ
 *
 * 認証済みユーザーのみアクセス可能
 * メインのログ解析画面
 */
interface DateRange {
  startDate: string;
  endDate: string;
}

interface GeneratedSql {
  sql: string;
  explanation: string;
}

interface QueryResult {
  columns: string[];
  rows: any[][];
  totalRows: number;
}

export default function DashboardPage() {
  const [isQueryLoading, setIsQueryLoading] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);
  const [generatedSql, setGeneratedSql] = useState<GeneratedSql | null>(null);
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    startDate: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    endDate: new Date().toISOString().split("T")[0],
  });
  const [toast, setToast] = useState<{
    type: "success" | "error" | "warning" | "info";
    message: string;
  } | null>(null);

  const handleQuerySubmit = async (query: string) => {
    setIsQueryLoading(true);
    setGeneratedSql(null);
    setQueryResult(null);

    try {
      // クライアントサイドで直接Bedrockを呼び出す
      const data = await generateSqlWithBedrock({
        query,
        dateRange,
      });

      setGeneratedSql({
        sql: data.sql,
        explanation: data.explanation,
      });

      setToast({
        type: "success",
        message: "SQLを生成しました",
      });
    } catch (error) {
      console.error("SQL generation error:", error);
      setToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "SQL生成に失敗しました",
      });
    } finally {
      setIsQueryLoading(false);
    }
  };

  const handleExecuteSql = async () => {
    if (!generatedSql) return;

    setIsExecuting(true);
    setQueryResult(null);

    try {
      // 1. S3 Signed URLsを取得
      const signedUrlsResponse = await fetch("/api/get-signed-urls", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ dateRange }),
      });

      if (!signedUrlsResponse.ok) {
        const error = await signedUrlsResponse.json();
        throw new Error(error.error || "Signed URLs取得に失敗しました");
      }

      const { signedUrls } = await signedUrlsResponse.json();

      if (!signedUrls || signedUrls.length === 0) {
        throw new Error("指定された期間にログファイルが見つかりません");
      }

      // 2. DuckDBでクエリを実行
      const executeResponse = await fetch("/api/execute-query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          sql: generatedSql.sql,
          signedUrls,
        }),
      });

      if (!executeResponse.ok) {
        const error = await executeResponse.json();
        throw new Error(error.error || "クエリ実行に失敗しました");
      }

      const result = await executeResponse.json();

      setQueryResult({
        columns: result.columns,
        rows: result.rows,
        totalRows: result.totalRows,
      });

      setToast({
        type: "success",
        message: `クエリを実行しました（${result.totalRows}件）`,
      });
    } catch (error) {
      console.error("Query execution error:", error);
      setToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "クエリ実行に失敗しました",
      });
    } finally {
      setIsExecuting(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50 flex flex-col">
        <Header />

        <div className="flex flex-1 overflow-hidden">
          {/* サイドバー */}
          <Sidebar />

          {/* メインコンテンツ */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-6 py-8 max-w-7xl">
              {/* フェイズ完了バナー */}
              <Card className="mb-6 bg-green-50 border-green-200">
                <div className="flex items-start">
                  <svg
                    className="w-6 h-6 text-green-600 mt-0.5 mr-3 flex-shrink-0"
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <div>
                    <p className="text-sm font-medium text-green-800 mb-1">
                      フェイズ3完了: 基本UI実装
                    </p>
                    <p className="text-sm text-green-700">
                      サイドバー、日付範囲選択、自然言語入力フォーム、デザインシステムが実装されました。
                    </p>
                  </div>
                </div>
              </Card>

              {/* 日付範囲選択 */}
              <div className="mb-6">
                <DateRangeSelector
                  onDateRangeChange={(newDateRange) => setDateRange(newDateRange)}
                />
              </div>

              {/* 自然言語入力 */}
              <div className="mb-6">
                <QueryInput
                  onSubmit={handleQuerySubmit}
                  isLoading={isQueryLoading}
                />
              </div>

              {/* SQL表示エリア */}
              {generatedSql && (
                <div className="mb-6">
                  <SqlDisplay
                    sql={generatedSql.sql}
                    explanation={generatedSql.explanation}
                    onExecute={handleExecuteSql}
                    isExecuting={isExecuting}
                  />
                </div>
              )}

              {/* クエリ結果表示エリア */}
              {queryResult && (
                <div className="mb-6">
                  <QueryResultTable
                    columns={queryResult.columns}
                    rows={queryResult.rows}
                    totalRows={queryResult.totalRows}
                  />
                </div>
              )}

              {/* プレースホルダーエリア */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📊 グラフ表示エリア
                  </h3>
                  <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
                    <p className="text-gray-500">
                      Phase 6で実装: Rechartsグラフ
                    </p>
                  </div>
                </Card>

                <Card>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    💡 使い方
                  </h3>
                  <div className="space-y-3 text-sm text-gray-700">
                    <div className="flex items-start">
                      <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 flex-shrink-0 mt-0.5">
                        1
                      </span>
                      <p>日付範囲を選択してください</p>
                    </div>
                    <div className="flex items-start">
                      <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 flex-shrink-0 mt-0.5">
                        2
                      </span>
                      <p>
                        自然言語でログについて質問してください
                        <br />
                        例: 「過去24時間のエラーログを表示」
                      </p>
                    </div>
                    <div className="flex items-start">
                      <span className="bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-semibold mr-3 flex-shrink-0 mt-0.5">
                        3
                      </span>
                      <p>
                        生成されたSQLを確認して実行ボタンをクリック
                        <br />
                        (Phase 5で実装予定)
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* 結果テーブルプレースホルダー */}
              <Card className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  📋 結果テーブル
                </h3>
                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-lg h-64 flex items-center justify-center">
                  <p className="text-gray-500">
                    Phase 6で実装: クエリ結果表示
                  </p>
                </div>
              </Card>

              {/* 次のフェイズ案内 */}
              <Card className="mt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  次のステップ: フェイズ4
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Bedrock統合・SQL生成
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        Route Handler作成
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        Claude 3.5 Sonnet統合
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        SQL検証機能
                      </li>
                      <li className="flex items-start">
                        <span className="text-primary mr-2">•</span>
                        SQL表示・コピー機能
                      </li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      実装済み機能
                    </h4>
                    <ul className="text-sm text-gray-600 space-y-1">
                      <li className="flex items-start">
                        <svg
                          className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        認証機能（Phase 2）
                      </li>
                      <li className="flex items-start">
                        <svg
                          className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        基本UIレイアウト（Phase 3）
                      </li>
                      <li className="flex items-start">
                        <svg
                          className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        日付範囲選択UI（Phase 3）
                      </li>
                      <li className="flex items-start">
                        <svg
                          className="w-4 h-4 text-green-600 mr-2 mt-0.5 flex-shrink-0"
                          fill="currentColor"
                          viewBox="0 0 20 20"
                        >
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        自然言語入力（Phase 3）
                      </li>
                    </ul>
                  </div>
                </div>
              </Card>
            </div>
          </main>
        </div>

        {/* Toast通知 */}
        {toast && (
          <Toast
            type={toast.type}
            message={toast.message}
            onClose={() => setToast(null)}
          />
        )}
      </div>
    </AuthGuard>
  );
}
