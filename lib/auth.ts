import { fetchAuthSession, getCurrentUser, signOut } from "aws-amplify/auth";

/**
 * 認証関連のユーティリティ関数
 */

export interface UserInfo {
  username: string;
  email?: string;
  groups: string[];
  teamId: string | null; // 後方互換性のため残す（非推奨）
  availableTeams: string[]; // ユーザーがアクセス可能なチーム一覧
}

/**
 * 現在のユーザー情報を取得
 */
export async function getUserInfo(): Promise<UserInfo | null> {
  try {
    const user = await getCurrentUser();
    const session = await fetchAuthSession();

    // Cognitoグループから取得
    const groups =
      (session.tokens?.accessToken?.payload["cognito:groups"] as string[]) ||
      [];

    // デバッグ用ログ
    console.log("User info debug:", {
      username: user.username,
      groups,
      accessTokenPayload: session.tokens?.accessToken?.payload,
    });

    // アクセス可能なチーム一覧を取得（team-adminは除外）
    const availableTeams = groups.filter(
      (g) => g.startsWith("team-") && g !== "team-admin"
    );

    // team-adminの場合は全チームにアクセス可能
    if (groups.includes("team-admin")) {
      availableTeams.push("team-alpha", "team-beta", "team-gamma");
      // 重複を削除
      const uniqueTeams = Array.from(new Set(availableTeams));
      availableTeams.length = 0;
      availableTeams.push(...uniqueTeams);
    }

    // 後方互換性のためteamIdも返す（最初のチームまたはローカルストレージ）
    let teamId: string | null = null;
    if (typeof window !== "undefined") {
      teamId = localStorage.getItem("selectedTeamId");
    }
    if (!teamId && availableTeams.length > 0) {
      teamId = availableTeams[0];
    }

    return {
      username: user.username,
      email: user.signInDetails?.loginId,
      groups,
      teamId,
      availableTeams,
    };
  } catch (error) {
    console.error("Failed to get user info:", error);
    return null;
  }
}

/**
 * ユーザーが認証済みかチェック
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    await getCurrentUser();
    return true;
  } catch {
    return false;
  }
}

/**
 * ユーザーがチームに所属しているかチェック
 */
export async function hasTeamAccess(teamId: string): Promise<boolean> {
  const userInfo = await getUserInfo();
  if (!userInfo) return false;

  // team-adminは全チームアクセス可
  if (userInfo.groups.includes("team-admin")) return true;

  // 指定されたチームに所属しているかチェック
  return userInfo.groups.includes(teamId);
}

/**
 * ログアウト
 */
export async function handleSignOut() {
  try {
    await signOut();
  } catch (error) {
    console.error("Error signing out:", error);
    throw error;
  }
}
