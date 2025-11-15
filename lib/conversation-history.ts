/**
 * 会話履歴管理ユーティリティ
 */

export interface ConversationHistory {
  id: string;
  timestamp: string;
  question: string;
  sql: string;
  explanation: string;
  resultSummary: string;
  teamId: string;
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

const STORAGE_KEY = "llm-log-conversation-history";
const MAX_HISTORY_ITEMS = 50;

/**
 * 会話履歴を取得
 */
export function getConversationHistory(): ConversationHistory[] {
  if (typeof window === "undefined") return [];

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return [];

    const history = JSON.parse(stored) as ConversationHistory[];
    return history.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );
  } catch (error) {
    console.error("Failed to load conversation history:", error);
    return [];
  }
}

/**
 * 会話履歴を保存
 */
export function saveConversationHistory(
  item: Omit<ConversationHistory, "id" | "timestamp">,
): ConversationHistory {
  if (typeof window === "undefined") {
    throw new Error("localStorage is not available");
  }

  const newItem: ConversationHistory = {
    ...item,
    id: generateId(),
    timestamp: new Date().toISOString(),
  };

  try {
    const history = getConversationHistory();
    const updatedHistory = [newItem, ...history].slice(0, MAX_HISTORY_ITEMS);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));

    return newItem;
  } catch (error) {
    console.error("Failed to save conversation history:", error);
    throw error;
  }
}

/**
 * 特定の履歴を削除
 */
export function deleteConversationHistory(id: string): void {
  if (typeof window === "undefined") return;

  try {
    const history = getConversationHistory();
    const updatedHistory = history.filter((item) => item.id !== id);

    localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedHistory));
  } catch (error) {
    console.error("Failed to delete conversation history:", error);
    throw error;
  }
}

/**
 * 全ての履歴をクリア
 */
export function clearAllConversationHistory(): void {
  if (typeof window === "undefined") return;

  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error("Failed to clear conversation history:", error);
    throw error;
  }
}

/**
 * 特定の履歴を取得
 */
export function getConversationHistoryById(
  id: string,
): ConversationHistory | null {
  const history = getConversationHistory();
  return history.find((item) => item.id === id) || null;
}

/**
 * ユニークIDを生成
 */
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 結果サマリーを生成
 */
export function generateResultSummary(
  columns: string[],
  totalRows: number,
): string {
  if (totalRows === 0) {
    return "結果なし";
  }

  const columnCount = columns.length;
  return `${totalRows}件 (${columnCount}カラム)`;
}
