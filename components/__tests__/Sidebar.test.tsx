import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Sidebar } from "../Sidebar";

describe("Sidebar", () => {
  it("デフォルトで開いた状態で表示される", () => {
    render(<Sidebar />);

    expect(screen.getByText("会話履歴")).toBeInTheDocument();
    expect(screen.getByText("新規会話")).toBeInTheDocument();
  });

  it("折りたたみボタンをクリックすると閉じる", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    const toggleButton = screen.getByLabelText("サイドバーを閉じる");
    await user.click(toggleButton);

    expect(screen.queryByText("会話履歴")).not.toBeInTheDocument();
    expect(screen.queryByText("新規会話")).not.toBeInTheDocument();
  });

  it("閉じた状態から開くことができる", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    // 閉じる
    const closeButton = screen.getByLabelText("サイドバーを閉じる");
    await user.click(closeButton);

    // 開く
    const openButton = screen.getByLabelText("サイドバーを開く");
    await user.click(openButton);

    expect(screen.getByText("会話履歴")).toBeInTheDocument();
    expect(screen.getByText("新規会話")).toBeInTheDocument();
  });

  it("開いた状態で空の履歴メッセージが表示される", () => {
    render(<Sidebar />);

    expect(screen.getByText("会話履歴はありません")).toBeInTheDocument();
    expect(
      screen.getByText("質問を送信すると履歴が表示されます"),
    ).toBeInTheDocument();
  });

  it("閉じた状態でアイコンのみの新規会話ボタンが表示される", async () => {
    const user = userEvent.setup();
    render(<Sidebar />);

    const toggleButton = screen.getByLabelText("サイドバーを閉じる");
    await user.click(toggleButton);

    const iconButton = screen.getByLabelText("新規会話");
    expect(iconButton).toBeInTheDocument();
  });
});
