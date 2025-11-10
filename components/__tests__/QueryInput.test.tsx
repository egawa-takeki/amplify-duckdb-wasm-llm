import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { QueryInput } from "../QueryInput";

describe("QueryInput", () => {
  it("プレースホルダーテキストが表示される", () => {
    render(<QueryInput />);

    expect(
      screen.getByPlaceholderText(
        /ログについて質問してください（例：過去24時間のエラーログを表示）/,
      ),
    ).toBeInTheDocument();
  });

  it("テキストを入力できる", async () => {
    const user = userEvent.setup();
    render(<QueryInput />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "過去24時間のエラーログを表示");

    expect(textarea).toHaveValue("過去24時間のエラーログを表示");
  });

  it("文字数カウンターが正しく表示される", async () => {
    const user = userEvent.setup();
    const { container } = render(<QueryInput />);

    const textarea = screen.getByRole("textbox");
    await user.type(textarea, "test");

    // カウンターは絶対位置で表示されているため、containerから検索
    const counter = container.querySelector(".text-gray-400");
    expect(counter).toBeInTheDocument();
    expect(counter).toHaveTextContent(/\/ 500/);
  });

  it("500文字を超える入力ができない", async () => {
    const user = userEvent.setup();
    render(<QueryInput />);

    const textarea = screen.getByRole("textbox");
    const longText = "あ".repeat(501);
    await user.type(textarea, longText);

    expect(textarea).toHaveValue("あ".repeat(500));
  });

  it("空の入力では送信ボタンが無効になる", () => {
    render(<QueryInput />);

    const submitButton = screen.getByRole("button", { name: /送信/ });
    expect(submitButton).toBeDisabled();
  });

  it("テキスト入力後は送信ボタンが有効になる", async () => {
    const user = userEvent.setup();
    render(<QueryInput />);

    const textarea = screen.getByRole("textbox");
    const submitButton = screen.getByRole("button", { name: /送信/ });

    await user.type(textarea, "テスト質問");

    expect(submitButton).not.toBeDisabled();
  });

  it("送信ボタンをクリックするとonSubmitが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<QueryInput onSubmit={handleSubmit} />);

    const textarea = screen.getByRole("textbox");
    const submitButton = screen.getByRole("button", { name: /送信/ });

    await user.type(textarea, "過去24時間のエラーログ");
    await user.click(submitButton);

    expect(handleSubmit).toHaveBeenCalledWith("過去24時間のエラーログ");
    expect(handleSubmit).toHaveBeenCalledTimes(1);
  });

  it("Enterキーを押すとonSubmitが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<QueryInput onSubmit={handleSubmit} />);

    const textarea = screen.getByRole("textbox");

    await user.type(textarea, "テスト質問{Enter}");

    expect(handleSubmit).toHaveBeenCalledWith("テスト質問");
  });

  it("質問例ボタンをクリックするとサジェストが表示される", async () => {
    const user = userEvent.setup();
    render(<QueryInput />);

    const suggestButton = screen.getByRole("button", { name: "質問例を見る" });
    await user.click(suggestButton);

    expect(screen.getByText("質問例:")).toBeInTheDocument();
    expect(
      screen.getByText(/過去24時間のエラーログを表示/),
    ).toBeInTheDocument();
  });

  it("サジェストをクリックするとテキストエリアに入力される", async () => {
    const user = userEvent.setup();
    render(<QueryInput />);

    const suggestButton = screen.getByRole("button", { name: "質問例を見る" });
    await user.click(suggestButton);

    const suggestion = screen.getByText(/最も遅いエンドポイントトップ10/);
    await user.click(suggestion);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toHaveValue("最も遅いエンドポイントトップ10");
  });

  it("ローディング中は入力が無効になる", () => {
    render(<QueryInput isLoading={true} />);

    const textarea = screen.getByRole("textbox");
    expect(textarea).toBeDisabled();
  });

  it("ローディング中は送信ボタンに「処理中...」と表示される", () => {
    render(<QueryInput isLoading={true} />);

    expect(screen.getByText("処理中...")).toBeInTheDocument();
  });

  it("ローディング中は送信ボタンが無効になる", async () => {
    const user = userEvent.setup();
    const handleSubmit = jest.fn();
    render(<QueryInput onSubmit={handleSubmit} isLoading={true} />);

    const submitButton = screen.getByRole("button", { name: /処理中/ });
    expect(submitButton).toBeDisabled();
  });

  it("文字数が350文字を超えると文字数が警告色になる", async () => {
    const user = userEvent.setup();
    const { container } = render(<QueryInput />);

    const textarea = screen.getByRole("textbox");
    const longText = "あ".repeat(351);
    await user.type(textarea, longText);

    const counter = container.querySelector(".text-warning");
    expect(counter).toBeInTheDocument();
    expect(counter).toHaveTextContent(/351 \/ 500/);
  });

  it("文字数が450文字を超えると文字数がエラー色になる", async () => {
    const user = userEvent.setup();
    const { container } = render(<QueryInput />);

    const textarea = screen.getByRole("textbox");
    const longText = "あ".repeat(451);
    await user.type(textarea, longText);

    const counter = container.querySelector(".text-error");
    expect(counter).toBeInTheDocument();
    expect(counter).toHaveTextContent(/451 \/ 500/);
  });
});
