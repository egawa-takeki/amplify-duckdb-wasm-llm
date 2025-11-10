"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Authenticator, useAuthenticator } from "@aws-amplify/ui-react";
import { configureAmplify } from "@/lib/amplify-config";
import "@aws-amplify/ui-react/styles.css";

// Amplify設定を初期化
configureAmplify();

/**
 * ログイン成功時のリダイレクト処理
 */
function LoginRedirect() {
  const router = useRouter();
  const { user } = useAuthenticator((context) => [context.user]);

  useEffect(() => {
    if (user) {
      router.push("/dashboard");
    }
  }, [user, router]);

  return null;
}

/**
 * ログインページ
 *
 * Amplify Authenticatorを使用したログイン画面
 */
export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full">
        <div className="text-center mb-4">
          {/* タイトル */}
          <h1 className="text-lg font-bold text-gray-900 mb-1">
            ログ解析システム
          </h1>
          <p className="text-xs text-gray-500">DuckDB WASM ログ解析</p>
        </div>

        <Authenticator loginMechanisms={["email"]} signUpAttributes={["email"]}>
          <LoginRedirect />
        </Authenticator>
      </div>
    </div>
  );
}
