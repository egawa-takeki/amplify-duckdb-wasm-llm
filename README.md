# ログ解析システム

DuckDB WASMを使用したブラウザベースのログ解析システム

## 概要

自然言語入力により、アプリケーションログを解析し、インタラクティブなグラフで可視化するWebアプリケーションです。

### 主な機能

- 🔐 **Amazon Cognito認証** - チームベースのアクセス制御
- 💬 **自然言語クエリ** - Amazon Bedrockを使用してSQLに自動変換
- 🗄️ **DuckDB WASM** - ブラウザ内でのSQL実行（Parquetネイティブサポート）
- 📊 **インタラクティブな可視化** - Rechartsによる4種類のグラフ
- 💾 **S3ストレージ** - Parquet形式でログを保存（カラムナー形式）
- 🔒 **セキュリティ** - 多層防御によるデータ保護

## 技術スタック

### フロントエンド
- **Next.js 14** (App Router)
- **TypeScript**
- **React**
- **Tailwind CSS**
- **DuckDB WASM**
- **Recharts**

### バックエンド（完全サーバーレス）
- **AWS Amplify Gen 2** (インフラ管理)
- **Amazon Cognito** (認証・認可)
- **Amazon Bedrock** (Amazon Nova Pro - SQL生成AI)
- **Amazon S3** (Parquetログストレージ)
- **Amazon CloudFront** (CDN配信)

### アーキテクチャの特徴
- ✅ **完全クライアントサイド** - API Server不要（Lambda/AppSync/API Gateway不使用）
- ✅ **ブラウザ直接アクセス** - Cognito一時認証情報でAWSサービスを直接呼び出し
- ✅ **Parquetネイティブ** - DuckDB WASMによる高速カラムナー処理

## 開発環境セットアップ

### 必要な環境

- Node.js 18.x以上
- npm 9.x以上
- Python 3.8以上（テストデータ生成用）
- AWS Account
- AWS CLI v2
- Git

### クイックスタート

```bash
# 1. リポジトリのクローン
git clone <repository-url>
cd llm-log

# 2. 依存パッケージのインストール
npm install

# 3. Amplifyバックエンドのデプロイ
npx ampx sandbox

# 4. テストデータの生成とアップロード
./scripts/upload-test-logs.sh

# 5. 開発サーバーの起動
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開きます。

### 詳細なセットアップ手順

詳しいセットアップ方法は [SETUP.md](SETUP.md) を参照してください。

**重要**: このプロジェクトは環境変数ファイル（`.env`）を使用しません。すべての設定は `amplify_outputs.json` から自動的に読み込まれます。

## プロジェクト構造

```
llm-log/
├── app/                    # Next.js App Router
│   ├── dashboard/         # ダッシュボードページ
│   ├── layout.tsx         # ルートレイアウト
│   ├── page.tsx           # ホームページ（リダイレクト）
│   └── globals.css        # グローバルCSS
├── amplify/               # AWS Amplify Gen 2設定
│   ├── auth/              # Cognito認証設定
│   ├── storage/           # S3ストレージ設定
│   └── backend.ts         # バックエンド定義
├── components/            # Reactコンポーネント
│   ├── charts/            # グラフコンポーネント
│   ├── ui/                # UI基本コンポーネント
│   └── ...                # 各種機能コンポーネント
├── lib/                   # ユーティリティ関数
│   ├── bedrock.ts         # Bedrock API連携
│   ├── duckdb.ts          # DuckDB WASM操作
│   ├── s3-utils.ts        # S3操作（Signed URL生成）
│   ├── chart-utils.ts     # グラフ推薦ロジック
│   └── ...                # その他ユーティリティ
├── scripts/               # 運用スクリプト
│   ├── generate-test-logs-parquet.py  # テストデータ生成
│   └── upload-test-logs.sh            # S3アップロード
├── docs/                  # ドキュメント
│   ├── architecture.md    # アーキテクチャ図
│   ├── document.md        # 要件定義書
│   ├── interface.md       # インターフェース仕様
│   └── ...                # その他ドキュメント
├── test-data/             # テストデータ（.gitignore）
│   └── logs-parquet/      # Parquet形式ログ
├── amplify_outputs.json   # Amplify設定（.gitignore）
└── package.json
```

## スクリプト

### 開発・ビルド

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

### Amplify関連

```bash
# Amplifyサンドボックス起動（ローカル開発用）
npx ampx sandbox

# Amplifyバックエンドのデプロイ（本番）
npx ampx pipeline-deploy --branch main
```

### テストデータ生成

```bash
# Parquetテストログ生成 + S3アップロード
./scripts/upload-test-logs.sh

# テストログ生成のみ（アップロードなし）
python3 scripts/generate-test-logs-parquet.py
```

## 実装済み機能

本アプリケーションは以下の機能を実装済みです：

### コア機能

- **認証システム** - Amazon Cognito によるセキュアな認証とチームベースのアクセス制御
- **自然言語クエリ** - Amazon Bedrock (Amazon Nova Pro) による SQL 自動生成
- **DuckDB WASM** - ブラウザ内でのSQL実行とデータ処理（Parquetネイティブサポート）
- **Parquetフォーマット** - カラムナー形式による高速クエリと型保持
- **データロード最適化** - 一度のロードで複数クエリを実行可能
- **データ可視化** - Recharts による時系列、棒、円グラフの自動生成
- **CSVエクスポート** - クエリ結果を Excel 対応形式でダウンロード
- **会話履歴** - 過去のクエリと結果を保存・復元（最大50件）

### UI/UX

- レスポンシブデザイン（デスクトップ・タブレット対応）
- ダークモード対応のカラーシステム
- リアルタイムトースト通知
- SQL編集・実行機能
- グラフタイプ自動選択と切替

## ドキュメント

- **[アーキテクチャ構成図](docs/architecture.md)** - システム全体構成、データフロー、Amplifyリソース分類
- [要件定義書](docs/document.md) - 機能要件、技術要件
- [インターフェース仕様](docs/interface.md) - 画面設計、UI/UX仕様
- [セットアップガイド](SETUP.md) - 環境構築の詳細手順
- [エラーハンドリング仕様](docs/error_docs.md) - エラーコード、エラー表示
- [実装計画書](docs/implementation_plan.md) - フェーズ別実装計画

## 技術的な特徴

### データフォーマット

- **Parquet形式** - Apache Parquetカラムナー形式、Snappy圧縮
- **Hiveパーティション** - `team_id=xxx/year=YYYY/month=MM/day=DD/hour=HH/`
- **スキーマレス** - 辞書エンコーディング無効で柔軟なスキーマ対応

### セキュリティ

- **IAMロールベース制御** - Cognitoグループごとに異なるIAMロール
- **チーム別アクセス制御** - team-alpha/beta/gamma/admin
- **S3 Signed URL** - 30分有効の署名付きURL
- **HTTPS強制** - CloudFront経由のみアクセス可能

### パフォーマンス

- **ブラウザ内SQL実行** - サーバーレスで低レイテンシ
- **並列ダウンロード** - 複数Parquetファイルの同時取得
- **データキャッシュ** - 一度のロードで複数クエリ実行可能

## コントリビューション

1. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
2. 変更をコミット (`git commit -m 'Add amazing feature'`)
3. ブランチにプッシュ (`git push origin feature/amazing-feature`)
4. プルリクエストを作成

## ライセンス

社内専用プロジェクト

## サポート

質問や問題がある場合は、開発チームに連絡してください。
