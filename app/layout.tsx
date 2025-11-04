import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ログ解析システム",
  description: "DuckDB WASMログ解析システム",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body className="antialiased">
        {children}
      </body>
    </html>
  );
}
