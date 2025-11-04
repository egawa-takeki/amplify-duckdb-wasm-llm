"use client";

/**
 * ログインページ
 *
 * Cognito Hosted UIへのリダイレクトを案内
 * 実際の本番環境ではCognito Hosted UIに自動リダイレクト
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8">
        <div className="text-center">
          {/* ロゴ */}
          <div className="w-16 h-16 bg-primary rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-10 h-10 text-white"
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
          </div>

          {/* タイトル */}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            ログ解析システム
          </h1>
          <p className="text-gray-600 mb-8">
            DuckDB WASMログ解析システム
          </p>

          {/* 説明 */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              認証にはAmazon Cognitoを使用します。
              <br />
              本番環境では自動的にCognito Hosted UIへリダイレクトされます。
            </p>
          </div>

          {/* 開発環境メッセージ */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <svg
                className="w-5 h-5 text-yellow-600 mt-0.5 mr-2 flex-shrink-0"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
              <div className="text-left">
                <p className="text-sm font-medium text-yellow-800 mb-1">
                  開発環境
                </p>
                <p className="text-xs text-yellow-700">
                  AWS Amplifyをデプロイ後、Cognito Hosted
                  UIが有効化されます。
                  <br />
                  詳細は{" "}
                  <a
                    href="/docs/aws_setup_guide.md"
                    className="underline"
                    target="_blank"
                  >
                    AWS設定ガイド
                  </a>{" "}
                  を参照してください。
                </p>
              </div>
            </div>
          </div>

          {/* ログインボタン（プレースホルダー） */}
          <button
            disabled
            className="w-full bg-gray-300 text-gray-500 py-3 rounded-lg font-medium cursor-not-allowed"
          >
            Cognito Hosted UIへログイン
          </button>

          <p className="text-xs text-gray-500 mt-4">
            ※ 本番環境では自動的にリダイレクトされます
          </p>
        </div>
      </div>
    </div>
  );
}
