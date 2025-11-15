"use client";

import { useState, useEffect } from "react";
import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";
import { Sidebar } from "@/components/Sidebar";
import { TeamSelector } from "@/components/TeamSelector";
import { DateRangeSelector } from "@/components/DateRangeSelector";
import { QueryInput } from "@/components/QueryInput";
import { SqlDisplay } from "@/components/SqlDisplay";
import { QueryResultTable } from "@/components/QueryResultTable";
import { ChartViewer } from "@/components/charts/ChartViewer";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Toast } from "@/components/ui/Toast";
import { generateSqlWithBedrock } from "@/lib/bedrock";
import { generateSignedUrls } from "@/lib/s3-utils";
import { exportQueryResultAsCSV } from "@/lib/csv-export";
import {
  saveConversationHistory,
  generateResultSummary,
  type ConversationHistory,
} from "@/lib/conversation-history";

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

interface LoadedDataInfo {
  teamId: string;
  dateRange: DateRange;
  recordCount: number;
}

export default function DashboardPage() {
  const [selectedTeamId, setSelectedTeamId] = useState<string>("");
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

  // データロード管理用のstate
  const [isDataLoaded, setIsDataLoaded] = useState(false);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [loadedDataInfo, setLoadedDataInfo] = useState<LoadedDataInfo | null>(null);

  // 会話履歴管理用のstate
  const [currentHistoryId, setCurrentHistoryId] = useState<string | undefined>(
    undefined,
  );
  const [currentQuestion, setCurrentQuestion] = useState<string>("");

  // チームIDまたは日付範囲が変更された場合、ロード済みデータをクリア
  useEffect(() => {
    if (loadedDataInfo) {
      const teamChanged = selectedTeamId !== loadedDataInfo.teamId;
      const dateChanged =
        dateRange.startDate !== loadedDataInfo.dateRange.startDate ||
        dateRange.endDate !== loadedDataInfo.dateRange.endDate;

      if (teamChanged || dateChanged) {
        setIsDataLoaded(false);
        setLoadedDataInfo(null);
        setQueryResult(null);
        setToast({
          type: "info",
          message: "チームまたは日付範囲が変更されました。データを再ロードしてください。",
        });
      }
    }
  }, [selectedTeamId, dateRange, loadedDataInfo]);

  const handleQuerySubmit = async (query: string) => {
    if (!selectedTeamId) {
      setToast({
        type: "error",
        message: "チームを選択してください",
      });
      return;
    }

    // 質問を保存
    setCurrentQuestion(query);

    setIsQueryLoading(true);
    setGeneratedSql(null);
    setQueryResult(null);

    try {
      // クライアントサイドで直接Bedrockを呼び出す
      const data = await generateSqlWithBedrock({
        query,
        teamId: selectedTeamId,
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

  const handleLoadData = async () => {
    if (!selectedTeamId) {
      setToast({
        type: "error",
        message: "チームを選択してください",
      });
      return;
    }

    setIsLoadingData(true);
    setQueryResult(null);

    try {
      // 1. S3 Signed URLsを生成
      const signedUrls = await generateSignedUrls(selectedTeamId, dateRange);

      // 2. DuckDB WASMを初期化
      const { initializeDuckDB, loadParquetFromS3, executeQuery } = await import("@/lib/duckdb");
      await initializeDuckDB();

      // 3. S3からデータを読み込み
      await loadParquetFromS3("logs", signedUrls);

      // 4. レコード数を取得
      const countResult = await executeQuery("SELECT COUNT(*) as count FROM logs");
      const countRows = countResult.toArray();
      const recordCount = countRows[0]?.count || 0;

      // 5. ロード情報を保存
      setLoadedDataInfo({
        teamId: selectedTeamId,
        dateRange: { ...dateRange },
        recordCount: typeof recordCount === 'bigint' ? Number(recordCount) : recordCount,
      });
      setIsDataLoaded(true);

      setToast({
        type: "success",
        message: `データをロードしました（${recordCount}件）`,
      });
    } catch (error) {
      console.error("Data load error:", error);
      setToast({
        type: "error",
        message:
          error instanceof Error ? error.message : "データロードに失敗しました",
      });
      setIsDataLoaded(false);
      setLoadedDataInfo(null);
    } finally {
      setIsLoadingData(false);
    }
  };

  const handleSelectHistory = (history: ConversationHistory) => {
    setCurrentHistoryId(history.id);
    setCurrentQuestion(history.question);
    setSelectedTeamId(history.teamId);
    setDateRange(history.dateRange);
    setGeneratedSql({
      sql: history.sql,
      explanation: history.explanation,
    });
    // クエリ結果も復元
    if (history.queryResult) {
      setQueryResult(history.queryResult);
      setToast({
        type: "success",
        message: "過去の会話を読み込みました",
      });
    } else {
      setQueryResult(null);
      setToast({
        type: "info",
        message: "過去の会話を読み込みました（結果データなし）",
      });
    }
  };

  const handleNewConversation = () => {
    setCurrentHistoryId(undefined);
    setCurrentQuestion("");
    setGeneratedSql(null);
    setQueryResult(null);
    setToast({
      type: "info",
      message: "新しい会話を開始しました",
    });
  };

  const handleExecuteSql = async (editedSql?: string) => {
    if (!generatedSql) return;

    // データがロードされていない場合はエラー
    if (!isDataLoaded) {
      setToast({
        type: "error",
        message: "先にデータをロードしてください",
      });
      return;
    }

    // 編集されたSQLがあればそれを使用、なければ元のSQLを使用
    const sqlToExecute = editedSql || generatedSql.sql;
    console.log('Executing SQL:', sqlToExecute);

    setIsExecuting(true);
    setQueryResult(null);

    try {
      // DuckDB executeQuery関数をインポート（データは既にロード済み）
      const { executeQuery } = await import("@/lib/duckdb");

      // クエリを実行（編集されたSQLまたは元のSQL）
      const result = await executeQuery(sqlToExecute);

      // 結果を配列形式に変換（toArray()を使用）
      const resultRows = result.toArray();
      console.log('Query result rows:', resultRows.length, resultRows.slice(0, 2));

      let columns: string[] = [];
      let rows: any[][] = [];

      if (resultRows.length === 0) {
        setQueryResult({
          columns: [],
          rows: [],
          totalRows: 0,
        });
      } else {
        // カラム名を取得
        columns = Object.keys(resultRows[0]);

        // 各行を配列形式に変換
        rows = resultRows.map((row: any) => {
          return columns.map(col => row[col]);
        });

        console.log('Formatted result:', { columns, rowCount: rows.length, sampleRow: rows[0] });

        setQueryResult({
          columns,
          rows,
          totalRows: rows.length,
        });
      }

      // 会話履歴に保存（結果も含める）
      if (currentQuestion && generatedSql) {
        const saved = saveConversationHistory({
          question: currentQuestion,
          sql: editedSql || generatedSql.sql,
          explanation: generatedSql.explanation,
          resultSummary: generateResultSummary(columns, rows.length),
          teamId: selectedTeamId,
          dateRange: { ...dateRange },
          queryResult: {
            columns,
            rows,
            totalRows: rows.length,
          },
        });
        setCurrentHistoryId(saved.id);
      }

      setToast({
        type: "success",
        message: `クエリを実行しました（${rows.length}件）`,
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
          <Sidebar
            onSelectHistory={handleSelectHistory}
            onNewConversation={handleNewConversation}
            currentHistoryId={currentHistoryId}
          />

          {/* メインコンテンツ */}
          <main className="flex-1 overflow-y-auto">
            <div className="container mx-auto px-6 py-8 max-w-7xl">
              {/* チーム選択 */}
              <TeamSelector
                onTeamSelect={setSelectedTeamId}
                currentTeamId={selectedTeamId}
              />

              {/* 日付範囲選択 */}
              <div className="mb-6">
                <DateRangeSelector
                  onDateRangeChange={(newDateRange) => setDateRange(newDateRange)}
                />
              </div>

              {/* データロードセクション */}
              <Card className="mb-6">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                      データロード
                    </h3>
                    <p className="text-xs text-gray-600">
                      分析を開始する前に、選択したチームと期間のデータをロードしてください
                    </p>
                  </div>
                  <Button
                    onClick={handleLoadData}
                    isLoading={isLoadingData}
                    disabled={isLoadingData || !selectedTeamId}
                    className="ml-4"
                  >
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"
                      />
                    </svg>
                    {isLoadingData ? "ロード中..." : "データをロード"}
                  </Button>
                </div>

                {/* ロード済みデータ情報パネル */}
                {isDataLoaded && loadedDataInfo && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="flex items-start">
                      <svg
                        className="w-5 h-5 text-green-600 mt-0.5 mr-2 flex-shrink-0"
                        fill="currentColor"
                        viewBox="0 0 20 20"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-green-800 mb-1">
                          データロード完了
                        </p>
                        <div className="text-xs text-gray-600 space-y-1">
                          <p>
                            <span className="font-medium">チーム:</span>{" "}
                            {loadedDataInfo.teamId}
                          </p>
                          <p>
                            <span className="font-medium">期間:</span>{" "}
                            {loadedDataInfo.dateRange.startDate} 〜{" "}
                            {loadedDataInfo.dateRange.endDate}
                          </p>
                          <p>
                            <span className="font-medium">レコード数:</span>{" "}
                            {loadedDataInfo.recordCount.toLocaleString()}件
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </Card>

              {/* 自然言語入力 */}
              <div className="mb-6">
                <QueryInput
                  onSubmit={handleQuerySubmit}
                  isLoading={isQueryLoading}
                  disabled={!isDataLoaded}
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
                  <div className="flex justify-end mb-3">
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() =>
                        exportQueryResultAsCSV(
                          queryResult.columns,
                          queryResult.rows,
                        )
                      }
                    >
                      <svg
                        className="w-4 h-4 mr-2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      CSVエクスポート
                    </Button>
                  </div>

                  <ChartViewer
                    columns={queryResult.columns}
                    rows={queryResult.rows}
                    totalRows={queryResult.totalRows}
                  />
                </div>
              )}

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
