"use client";

import { useEffect, useState } from "react";
import { getUserInfo, handleSignOut, UserInfo } from "@/lib/auth";
import { useRouter } from "next/navigation";

/**
 * ヘッダーコンポーネント
 *
 * ロゴ、アプリ名、ユーザー情報、ログアウトボタンを表示
 */
export function Header() {
  const router = useRouter();
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    loadUserInfo();
  }, []);

  async function loadUserInfo() {
    const info = await getUserInfo();
    setUserInfo(info);
  }

  async function onSignOut() {
    try {
      await handleSignOut();
      router.push("/login");
    } catch (error) {
      console.error("Sign out failed:", error);
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 px-6 py-4">
      <div className="flex items-center justify-between">
        {/* ロゴ + アプリ名 */}
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <svg
              className="w-5 h-5 text-white"
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
          <h1 className="text-xl font-bold text-gray-900">
            ログ解析システム
          </h1>
        </div>

        {/* ユーザー情報 + ログアウト */}
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
              <svg
                className="w-5 h-5 text-gray-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium text-gray-900">
                {userInfo?.username || "ユーザー"}
              </div>
              {userInfo?.teamId && (
                <div className="text-xs text-gray-500">{userInfo.teamId}</div>
              )}
            </div>
            <svg
              className={`w-4 h-4 text-gray-600 transition-transform ${
                isDropdownOpen ? "rotate-180" : ""
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>

          {/* ドロップダウンメニュー */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-10">
              <div className="px-4 py-2 border-b border-gray-200">
                <div className="text-sm font-medium text-gray-900">
                  {userInfo?.email || userInfo?.username}
                </div>
                {userInfo?.groups && userInfo.groups.length > 0 && (
                  <div className="text-xs text-gray-500 mt-1">
                    グループ: {userInfo.groups.join(", ")}
                  </div>
                )}
              </div>
              <button
                onClick={onSignOut}
                className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
              >
                ログアウト
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
