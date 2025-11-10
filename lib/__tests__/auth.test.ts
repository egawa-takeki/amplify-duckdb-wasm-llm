import {
  getUserInfo,
  isAuthenticated,
  hasTeamAccess,
  handleSignOut,
} from "../auth";
import { getCurrentUser, fetchAuthSession, signOut } from "aws-amplify/auth";

// AWS Amplifyのモック
jest.mock("aws-amplify/auth", () => ({
  getCurrentUser: jest.fn(),
  fetchAuthSession: jest.fn(),
  signOut: jest.fn(),
}));

const mockGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockFetchAuthSession = fetchAuthSession as jest.MockedFunction<
  typeof fetchAuthSession
>;
const mockSignOut = signOut as jest.MockedFunction<typeof signOut>;

describe("auth utilities", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("getUserInfo", () => {
    it("ユーザー情報を正しく取得できる", async () => {
      mockGetCurrentUser.mockResolvedValue({
        username: "testuser",
        userId: "123",
        signInDetails: {
          loginId: "test@example.com",
        },
      });

      mockFetchAuthSession.mockResolvedValue({
        tokens: {
          accessToken: {
            payload: {
              "cognito:groups": ["team-alpha"],
            },
            toString: () => "token",
          },
        },
        credentials: undefined,
        identityId: undefined,
        userSub: "123",
      });

      const userInfo = await getUserInfo();

      expect(userInfo).toEqual({
        username: "testuser",
        email: "test@example.com",
        groups: ["team-alpha"],
        teamId: "team-alpha",
      });
    });

    it("team-adminユーザーはteamIdがnull", async () => {
      mockGetCurrentUser.mockResolvedValue({
        username: "admin",
        userId: "456",
        signInDetails: {
          loginId: "admin@example.com",
        },
      });

      mockFetchAuthSession.mockResolvedValue({
        tokens: {
          accessToken: {
            payload: {
              "cognito:groups": ["team-admin"],
            },
            toString: () => "token",
          },
        },
        credentials: undefined,
        identityId: undefined,
        userSub: "456",
      });

      const userInfo = await getUserInfo();

      expect(userInfo?.teamId).toBeNull();
    });

    it("複数グループの場合、team-admin以外の最初のチームIDを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        username: "multiuser",
        userId: "789",
        signInDetails: {
          loginId: "multi@example.com",
        },
      });

      mockFetchAuthSession.mockResolvedValue({
        tokens: {
          accessToken: {
            payload: {
              "cognito:groups": ["team-admin", "team-beta"],
            },
            toString: () => "token",
          },
        },
        credentials: undefined,
        identityId: undefined,
        userSub: "789",
      });

      const userInfo = await getUserInfo();

      expect(userInfo?.teamId).toBe("team-beta");
    });

    it("エラー時にnullを返す", async () => {
      mockGetCurrentUser.mockRejectedValue(new Error("Auth error"));

      const userInfo = await getUserInfo();

      expect(userInfo).toBeNull();
    });
  });

  describe("isAuthenticated", () => {
    it("認証済みの場合にtrueを返す", async () => {
      mockGetCurrentUser.mockResolvedValue({
        username: "testuser",
        userId: "123",
      });

      const result = await isAuthenticated();

      expect(result).toBe(true);
    });

    it("未認証の場合にfalseを返す", async () => {
      mockGetCurrentUser.mockRejectedValue(new Error("Not authenticated"));

      const result = await isAuthenticated();

      expect(result).toBe(false);
    });
  });

  describe("hasTeamAccess", () => {
    it("team-adminは全チームアクセス可能", async () => {
      mockGetCurrentUser.mockResolvedValue({
        username: "admin",
        userId: "456",
        signInDetails: {
          loginId: "admin@example.com",
        },
      });

      mockFetchAuthSession.mockResolvedValue({
        tokens: {
          accessToken: {
            payload: {
              "cognito:groups": ["team-admin"],
            },
            toString: () => "token",
          },
        },
        credentials: undefined,
        identityId: undefined,
        userSub: "456",
      });

      const hasAccess = await hasTeamAccess("team-alpha");

      expect(hasAccess).toBe(true);
    });

    it("所属チームにはアクセス可能", async () => {
      mockGetCurrentUser.mockResolvedValue({
        username: "testuser",
        userId: "123",
        signInDetails: {
          loginId: "test@example.com",
        },
      });

      mockFetchAuthSession.mockResolvedValue({
        tokens: {
          accessToken: {
            payload: {
              "cognito:groups": ["team-alpha"],
            },
            toString: () => "token",
          },
        },
        credentials: undefined,
        identityId: undefined,
        userSub: "123",
      });

      const hasAccess = await hasTeamAccess("team-alpha");

      expect(hasAccess).toBe(true);
    });

    it("非所属チームにはアクセス不可", async () => {
      mockGetCurrentUser.mockResolvedValue({
        username: "testuser",
        userId: "123",
        signInDetails: {
          loginId: "test@example.com",
        },
      });

      mockFetchAuthSession.mockResolvedValue({
        tokens: {
          accessToken: {
            payload: {
              "cognito:groups": ["team-alpha"],
            },
            toString: () => "token",
          },
        },
        credentials: undefined,
        identityId: undefined,
        userSub: "123",
      });

      const hasAccess = await hasTeamAccess("team-beta");

      expect(hasAccess).toBe(false);
    });

    it("未認証の場合はアクセス不可", async () => {
      mockGetCurrentUser.mockRejectedValue(new Error("Not authenticated"));

      const hasAccess = await hasTeamAccess("team-alpha");

      expect(hasAccess).toBe(false);
    });
  });

  describe("handleSignOut", () => {
    it("サインアウトを実行する", async () => {
      mockSignOut.mockResolvedValue();

      await handleSignOut();

      expect(mockSignOut).toHaveBeenCalledTimes(1);
    });

    it("エラー時に例外をスローする", async () => {
      mockSignOut.mockRejectedValue(new Error("Sign out error"));

      await expect(handleSignOut()).rejects.toThrow("Sign out error");
    });
  });
});
