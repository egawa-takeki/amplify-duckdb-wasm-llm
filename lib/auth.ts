import { fetchAuthSession, getCurrentUser, signOut } from "aws-amplify/auth";

/**
 * 認証関連のユーティリティ関数
 */

export interface UserInfo {
  username: string;
  email?: string;
  groups: string[];
  teamId: string | null;
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

    // team_idの特定（team-admin以外の最初のグループ）
    const teamId =
      groups.find(
        (g) => g.startsWith("team-") && g !== "team-admin"
      ) || null;

    return {
      username: user.username,
      email: user.signInDetails?.loginId,
      groups,
      teamId,
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
