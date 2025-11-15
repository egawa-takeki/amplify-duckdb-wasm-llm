# ログ解析システム

DuckDB WASMを使用したブラウザベースのログ解析システム

## 概要

自然言語入力により、アプリケーションログを解析し、インタラクティブなグラフで可視化するWebアプリケーションです。

### 主な機能

- 🔐 **Amazon Cognito認証** - チームベースのアクセス制御
- 💬 **自然言語クエリ** - Amazon Bedrockを使用してSQLに自動変換
- 🗄️ **DuckDB WASM** - ブラウザ内でのSQL実行
- 📊 **インタラクティブな可視化** - Rechartsによる4種類のグラフ
- 💾 **S3ストレージ** - Kinesis Firehose経由でログを保存
- 🔒 **セキュリティ** - 多層防御によるデータ保護

## 技術スタック

### フロントエンド
- **Next.js 14** (App Router)
- **TypeScript**
- **React**
- **Tailwind CSS**
- **DuckDB WASM**
- **Recharts**

### バックエンド
- **AWS Amplify Gen 2**
- **Amazon Cognito** (認証)
- **Amazon Bedrock** (Claude 3.5 Sonnet)
- **Amazon S3** (ログストレージ)
- **Amazon CloudFront** (CDN)
- **AWS Kinesis Firehose** (ログ取り込み)

## 開発環境セットアップ

### 必要な環境

- Node.js 18.x以上
- npm 9.x以上
- AWS Account
- Git

### インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd llm-log

# 依存パッケージのインストール
npm install

# 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 環境変数

`.env.local` ファイルを作成し、以下の環境変数を設定してください：

```bash
# AWS Amplify
NEXT_PUBLIC_AWS_REGION=us-east-1
NEXT_PUBLIC_USER_POOL_ID=<your-cognito-user-pool-id>
NEXT_PUBLIC_USER_POOL_CLIENT_ID=<your-cognito-client-id>

# Amazon Bedrock
AWS_BEDROCK_REGION=us-east-1
AWS_BEDROCK_MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0

# Amazon S3
S3_BUCKET_NAME=<your-s3-bucket-name>
S3_REGION=us-east-1

# CloudFront
CLOUDFRONT_DOMAIN=<your-cloudfront-domain>
```

## プロジェクト構造

```
llm-log/
├── app/                    # Next.js App Router
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # ホームページ
│   └── globals.css        # グローバルCSS
├── docs/                   # ドキュメント
│   ├── document.md        # 要件定義書
│   ├── interface.md       # インターフェース仕様
│   ├── error_docs.md      # エラーハンドリング仕様
│   └── implementation_plan.md  # 実装計画書
├── public/                 # 静的ファイル
├── .gitignore
├── .prettierrc
├── eslint.config.mjs
├── next.config.ts
├── package.json
├── postcss.config.mjs
├── tailwind.config.ts
└── tsconfig.json
```

## スクリプト

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm start

# リンター実行
npm run lint

# コードフォーマット
npm run format
```

## 実装済み機能

本アプリケーションは以下の機能を実装済みです：

### コア機能

- **認証システム** - Amazon Cognito によるセキュアな認証とチームベースのアクセス制御
- **自然言語クエリ** - Amazon Bedrock (Claude 3.5 Sonnet) による SQL 自動生成
- **DuckDB WASM** - ブラウザ内でのSQL実行とデータ処理
- **データロード最適化** - 一度のロードで複数クエリを実行可能
- **データ可視化** - Recharts による時系列、棒、円グラフの自動生成
- **CSVエクスポート** - クエリ結果を Excel 対応形式でダウンロード

### UI/UX

- レスポンシブデザイン（デスクトップ・タブレット対応）
- ダークモード対応のカラーシステム
- リアルタイムトースト通知
- SQL編集・実行機能
- グラフタイプ自動選択と切替

## ドキュメント

- [要件定義書](docs/document.md) - 機能要件、技術要件、アーキテクチャ
- [インターフェース仕様](docs/interface.md) - 画面設計、UI/UX仕様
- [エラーハンドリング仕様](docs/error_docs.md) - エラーコード、エラー表示
- [実装計画書](docs/implementation_plan.md) - フェイズ別実装計画
- [AWS設定ガイド](docs/aws_setup_guide.md) - AWSインフラのセットアップ手順

## カスタムカラー

Tailwind CSSで以下のカスタムカラーが利用可能です：

```typescript
colors: {
  primary: "#3B82F6",      // 青
  secondary: "#8B5CF6",    // 紫
  accent: "#10B981",       // 緑
  error: "#EF4444",        // 赤
  warning: "#F59E0B",      // オレンジ
  success: "#10B981",      // 緑
  info: "#3B82F6",         // 青
}
```

## コーディング規約

### TypeScript

- `strict` モード有効
- `any` 型の使用を最小限に
- 型定義ファイル（`types/`）に共通型を定義

### コンポーネント

- Functional Component + Hooks
- Server Components優先、必要に応じてClient Components
- ファイル名: PascalCase（例: `Button.tsx`）

### スタイリング

- Tailwind CSS utility-first
- 複雑なスタイルは `@apply` でコンポーネント化
- レスポンシブデザイン: md以上のブレークポイント対応

## コントリビューション

1. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
2. 変更をコミット (`git commit -m 'Add amazing feature'`)
3. ブランチにプッシュ (`git push origin feature/amazing-feature`)
4. プルリクエストを作成

## ライセンス

社内専用プロジェクト

## サポート

質問や問題がある場合は、開発チームに連絡してください。
