import { render, screen, waitFor } from "@testing-library/react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "../AuthGuard";
import { isAuthenticated } from "@/lib/auth";

// Next.jsのuseRouterをモック
jest.mock("next/navigation", () => ({
  useRouter: jest.fn(),
}));

// auth.tsをモック
jest.mock("@/lib/auth", () => ({
  isAuthenticated: jest.fn(),
}));

const mockUseRouter = useRouter as jest.MockedFunction<typeof useRouter>;
const mockIsAuthenticated = isAuthenticated as jest.MockedFunction<
  typeof isAuthenticated
>;

describe("AuthGuard", () => {
  const mockPush = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseRouter.mockReturnValue({
      push: mockPush,
      back: jest.fn(),
      forward: jest.fn(),
      refresh: jest.fn(),
      replace: jest.fn(),
      prefetch: jest.fn(),
    });
  });

  it("認証チェック中にローディング表示", async () => {
    mockIsAuthenticated.mockImplementation(
      () => new Promise(() => {}), // 解決しないPromise
    );

    render(
      <AuthGuard>
        <div>プロテクトされたコンテンツ</div>
      </AuthGuard>,
    );

    expect(screen.getByText("認証を確認中...")).toBeInTheDocument();
    expect(
      screen.queryByText("プロテクトされたコンテンツ"),
    ).not.toBeInTheDocument();
  });

  it("認証済みの場合に子要素を表示", async () => {
    mockIsAuthenticated.mockResolvedValue(true);

    render(
      <AuthGuard>
        <div>プロテクトされたコンテンツ</div>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(screen.getByText("プロテクトされたコンテンツ")).toBeInTheDocument();
    });

    expect(mockPush).not.toHaveBeenCalled();
  });

  it("未認証の場合にログインページへリダイレクト", async () => {
    mockIsAuthenticated.mockResolvedValue(false);

    render(
      <AuthGuard>
        <div>プロテクトされたコンテンツ</div>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });

    expect(
      screen.queryByText("プロテクトされたコンテンツ"),
    ).not.toBeInTheDocument();
  });

  it("認証チェックエラー時にログインページへリダイレクト", async () => {
    mockIsAuthenticated.mockRejectedValue(new Error("Auth check failed"));

    render(
      <AuthGuard>
        <div>プロテクトされたコンテンツ</div>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/login");
    });

    expect(
      screen.queryByText("プロテクトされたコンテンツ"),
    ).not.toBeInTheDocument();
  });

  it("認証チェック完了後はローディング表示されない", async () => {
    mockIsAuthenticated.mockResolvedValue(true);

    render(
      <AuthGuard>
        <div>プロテクトされたコンテンツ</div>
      </AuthGuard>,
    );

    await waitFor(() => {
      expect(screen.getByText("プロテクトされたコンテンツ")).toBeInTheDocument();
    });

    expect(screen.queryByText("認証を確認中...")).not.toBeInTheDocument();
  });
});
