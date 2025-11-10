import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Toast } from "../Toast";

describe("Toast", () => {
  beforeEach(() => {
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  it("successタイプのトーストが表示される", () => {
    render(
      <Toast type="success" message="成功しました" onClose={() => {}} />,
    );
    expect(screen.getByText("成功しました")).toBeInTheDocument();
  });

  it("errorタイプのトーストが表示される", () => {
    render(<Toast type="error" message="エラーが発生しました" onClose={() => {}} />);
    expect(screen.getByText("エラーが発生しました")).toBeInTheDocument();
  });

  it("warningタイプのトーストが表示される", () => {
    render(
      <Toast type="warning" message="警告メッセージ" onClose={() => {}} />,
    );
    expect(screen.getByText("警告メッセージ")).toBeInTheDocument();
  });

  it("infoタイプのトーストが表示される", () => {
    render(<Toast type="info" message="情報メッセージ" onClose={() => {}} />);
    expect(screen.getByText("情報メッセージ")).toBeInTheDocument();
  });

  it("指定した時間後に自動的に閉じる", async () => {
    const handleClose = jest.fn();
    render(
      <Toast
        type="success"
        message="テスト"
        duration={1000}
        onClose={handleClose}
      />,
    );

    // 1000ms後に閉じる処理が開始される
    jest.advanceTimersByTime(1000);

    // アニメーション時間（300ms）後にonCloseが呼ばれる
    await waitFor(() => {
      jest.advanceTimersByTime(300);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it("閉じるボタンをクリックするとonCloseが呼ばれる", async () => {
    const user = userEvent.setup({ delay: null });
    const handleClose = jest.fn();
    render(
      <Toast type="success" message="テスト" onClose={handleClose} />,
    );

    const closeButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector("svg"));
    await user.click(closeButtons[0]);

    // アニメーション時間後にonCloseが呼ばれることを確認
    await waitFor(() => {
      jest.advanceTimersByTime(300);
      expect(handleClose).toHaveBeenCalledTimes(1);
    });
  });

  it("successタイプの正しいスタイルが適用される", () => {
    const { container } = render(
      <Toast type="success" message="成功" onClose={() => {}} />,
    );
    expect(container.querySelector(".bg-green-50")).toBeInTheDocument();
    expect(container.querySelector(".text-green-800")).toBeInTheDocument();
  });

  it("errorタイプの正しいスタイルが適用される", () => {
    const { container } = render(
      <Toast type="error" message="エラー" onClose={() => {}} />,
    );
    expect(container.querySelector(".bg-red-50")).toBeInTheDocument();
    expect(container.querySelector(".text-red-800")).toBeInTheDocument();
  });

  it("warningタイプの正しいスタイルが適用される", () => {
    const { container } = render(
      <Toast type="warning" message="警告" onClose={() => {}} />,
    );
    expect(container.querySelector(".bg-yellow-50")).toBeInTheDocument();
    expect(container.querySelector(".text-yellow-800")).toBeInTheDocument();
  });

  it("infoタイプの正しいスタイルが適用される", () => {
    const { container } = render(
      <Toast type="info" message="情報" onClose={() => {}} />,
    );
    expect(container.querySelector(".bg-blue-50")).toBeInTheDocument();
    expect(container.querySelector(".text-blue-800")).toBeInTheDocument();
  });
});
