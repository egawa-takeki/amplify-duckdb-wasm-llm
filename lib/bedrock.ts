import {
  BedrockRuntimeClient,
  InvokeModelCommand,
} from "@aws-sdk/client-bedrock-runtime";
import { fetchAuthSession } from "aws-amplify/auth";
import { getTeamSchemaDescription } from "./team-schemas";

/**
 * Bedrock APIを使用してSQLを生成
 *
 * クライアントサイド（ブラウザ）で実行されるため、
 * Cognito認証済みユーザーの一時認証情報を使用
 */

// Amazon Nova Pro基盤モデルIDを直接使用（SCP制約回避のため）
const MODEL_ID = "amazon.nova-pro-v1:0";
const REGION = "us-east-1";

interface GenerateSqlRequest {
  query: string;
  teamId: string; // チームIDを追加
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

interface GenerateSqlResponse {
  sql: string;
  explanation: string;
}

/**
 * Claude用のシステムプロンプト（チームごとのスキーマを使用）
 */
function getSystemPrompt(teamId: string): string {
  const schema = getTeamSchemaDescription(teamId);

  return `あなたはソーシャルゲームのログ解析用SQLクエリを生成する専門家です。

# データベーススキーマ
${schema}

# 制約事項
- SELECT文またはWITH句のみを使用してください
- CREATE、DROP、INSERT、UPDATE、DELETE、COPY、ATTACH等のDDL/DML文は使用禁止です
- 複数のSQL文を実行することはできません（セミコロンは1つのみ）
- SQLコメント（--や/* */）は使用しないでください

# 日付フィルタの重要な注意事項
- timestamp カラムは VARCHAR 型で、ISO 8601形式 (例: '2025-11-13T00:00:16') で格納されています
- 日付フィルタには以下のいずれかの方法を使用してください：
  1. LIKE演算子: timestamp LIKE '2025-11-13%'
  2. 範囲指定: timestamp BETWEEN '2025-11-13T00:00:00' AND '2025-11-13T23:59:59'
  3. DATE関数: DATE(timestamp) = '2025-11-13'
- スペース区切りの日付時刻形式（'2025-11-13 00:00:00'）は使用しないでください

# ゲーム特有の分析例
- ガチャイベント: event_type = 'gacha'
- 課金イベント: event_type = 'purchase'
- プレイヤーレベル分析: player_level でグループ化
- プラットフォーム別分析: platform (iOS, Android, Web) で集計
- 通貨の収支: currency_type, currency_amount を使用
- エラー分析: level = 'ERROR' and error IS NOT NULL

# 出力形式
JSON形式で以下を返してください：
{
  "sql": "生成されたSQLクエリ",
  "explanation": "クエリの説明（日本語で簡潔に）"
}`;
}

/**
 * ユーザープロンプトを生成
 */
function getUserPrompt(request: GenerateSqlRequest): string {
  return `以下の要件を満たすSQLクエリを生成してください：

# ユーザーの質問
${request.query}

# 対象期間
開始日時: ${request.dateRange.startDate}
終了日時: ${request.dateRange.endDate}

日付フィルタを必ず含めてください。`;
}

/**
 * BedrockクライアントをAWSアカウントに接続
 *
 * Cognito認証済みユーザーの一時認証情報を取得して使用
 */
async function getBedrockClient(): Promise<BedrockRuntimeClient> {
  // forceRefresh: true で最新の認証情報を取得
  const session = await fetchAuthSession({ forceRefresh: true });

  if (!session.credentials) {
    throw new Error("AWS認証情報が取得できません");
  }

  // デバッグ用ログ
  console.log("Bedrock credentials obtained:", {
    accessKeyId: session.credentials.accessKeyId?.substring(0, 10) + "...",
    hasSessionToken: !!session.credentials.sessionToken,
  });

  return new BedrockRuntimeClient({
    region: REGION,
    credentials: session.credentials,
  });
}

/**
 * BedrockでSQL生成
 */
export async function generateSqlWithBedrock(
  request: GenerateSqlRequest,
): Promise<GenerateSqlResponse> {
  try {
    const client = await getBedrockClient();

    // Amazon Nova Pro用のリクエストボディ
    const body = {
      schemaVersion: "messages-v1",
      system: [{ text: getSystemPrompt(request.teamId) }],
      messages: [
        {
          role: "user",
          content: [{ text: getUserPrompt(request) }],
        },
      ],
      inferenceConfig: {
        maxTokens: 2000,
        temperature: 0.0, // 決定的な出力のため
        topP: 0.9,
      },
    };

    const command = new InvokeModelCommand({
      modelId: MODEL_ID,
      contentType: "application/json",
      accept: "application/json",
      body: JSON.stringify(body),
    });

    const response = await client.send(command);

    // レスポンスをパース
    const responseBody = JSON.parse(new TextDecoder().decode(response.body));

    if (!responseBody.output || !responseBody.output.message) {
      throw new Error("Bedrockからのレスポンスが空です");
    }

    // Amazon Nova Proのレスポンス形式
    const textContent = responseBody.output.message.content[0].text;

    // JSON部分を抽出（```json ... ``` でラップされている可能性がある）
    const jsonMatch = textContent.match(/```json\n?([\s\S]*?)\n?```/) || [
      null,
      textContent,
    ];
    const jsonString = jsonMatch[1].trim();

    const result = JSON.parse(jsonString);

    return {
      sql: result.sql,
      explanation: result.explanation,
    };
  } catch (error) {
    console.error("Bedrock API error:", error);
    throw new Error(
      `SQL生成に失敗しました: ${error instanceof Error ? error.message : "不明なエラー"}`,
    );
  }
}
