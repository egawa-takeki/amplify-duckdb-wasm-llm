"use client";

import { AuthGuard } from "@/components/AuthGuard";
import { Header } from "@/components/Header";

/**
 * ダッシュボードページ
 *
 * 認証済みユーザーのみアクセス可能
 * メインのログ解析画面
 */
export default function DashboardPage() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />

        <main className="container mx-auto px-6 py-8">
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              ダッシュボード
            </h2>

            <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
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
                    フェイズ2完了: 認証機能実装
                  </p>
                  <p className="text-sm text-green-700">
                    認証ガード、ユーザー情報表示、ログアウト機能が実装されました。
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 次のフェイズ案内 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  次のステップ
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  フェイズ3: 基本UI実装
                </p>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    日付範囲選択UI
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    自然言語入力フォーム
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    サイドバー（会話履歴用）
                  </li>
                  <li className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    メインエリアレイアウト
                  </li>
                </ul>
              </div>

              {/* 実装済み機能 */}
              <div className="border border-gray-200 rounded-lg p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  実装済み機能
                </h3>
                <ul className="text-sm text-gray-600 space-y-2">
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    Amplify認証統合
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    認証ガード（保護ルート）
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    ユーザー情報取得・表示
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    ログアウト機能
                  </li>
                  <li className="flex items-start">
                    <svg
                      className="w-5 h-5 text-green-600 mr-2 flex-shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                    チーム情報の表示
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
