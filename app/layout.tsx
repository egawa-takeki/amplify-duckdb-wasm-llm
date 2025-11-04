"use client";

import "./globals.css";
import { useEffect } from "react";
import { configureAmplify } from "@/lib/amplify-config";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  useEffect(() => {
    configureAmplify();
  }, []);

  return (
    <html lang="ja">
      <head>
        <title>ログ解析システム</title>
        <meta name="description" content="DuckDB WASMログ解析システム" />
      </head>
      <body className="antialiased">{children}</body>
    </html>
  );
}
