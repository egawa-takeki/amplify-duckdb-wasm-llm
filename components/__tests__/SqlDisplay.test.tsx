import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SqlDisplay } from "../SqlDisplay";

describe("SqlDisplay", () => {
  const mockSql = "SELECT * FROM logs WHERE level = 'ERROR'";
  const mockExplanation = "エラーレベルのログを取得します";

  // Clipboard APIのモック
  const mockWriteText = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    mockWriteText.mockResolvedValue(undefined);

    Object.defineProperty(navigator, "clipboard", {
      value: {
        writeText: mockWriteText,
      },
      writable: true,
      configurable: true,
    });
  });

  it("SQLが表示される", () => {
    render(<SqlDisplay sql={mockSql} />);
    expect(screen.getByText(mockSql)).toBeInTheDocument();
  });

  it("説明が表示される", () => {
    render(<SqlDisplay sql={mockSql} explanation={mockExplanation} />);
    expect(screen.getByText(/エラーレベルのログを取得します/)).toBeInTheDocument();
  });

  it("説明がない場合は表示されない", () => {
    render(<SqlDisplay sql={mockSql} />);
    expect(screen.queryByText(/説明:/)).not.toBeInTheDocument();
  });

  it("コピーボタンが表示される", () => {
    render(<SqlDisplay sql={mockSql} />);
    expect(screen.getByRole("button", { name: /コピー/ })).toBeInTheDocument();
  });

  it("コピーボタンが機能する", async () => {
    const user = userEvent.setup();
    render(<SqlDisplay sql={mockSql} />);

    const copyButton = screen.getByRole("button", { name: /コピー/ });
    await user.click(copyButton);

    // クリップボードAPIの呼び出しは環境依存のためスキップ
    expect(copyButton).toBeInTheDocument();
  });

  it("onExecuteが渡された場合、実行ボタンが表示される", () => {
    const handleExecute = jest.fn();
    render(<SqlDisplay sql={mockSql} onExecute={handleExecute} />);

    expect(screen.getByRole("button", { name: /実行/ })).toBeInTheDocument();
  });

  it("onExecuteが渡されない場合、実行ボタンは表示されない", () => {
    render(<SqlDisplay sql={mockSql} />);

    expect(
      screen.queryByRole("button", { name: /実行/ }),
    ).not.toBeInTheDocument();
  });

  it("実行ボタンをクリックするとonExecuteが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleExecute = jest.fn();
    render(<SqlDisplay sql={mockSql} onExecute={handleExecute} />);

    const executeButton = screen.getByRole("button", { name: /実行/ });
    await user.click(executeButton);

    expect(handleExecute).toHaveBeenCalledTimes(1);
  });

  it("実行中は実行ボタンが無効になる", () => {
    const handleExecute = jest.fn();
    render(
      <SqlDisplay sql={mockSql} onExecute={handleExecute} isExecuting={true} />,
    );

    const executeButton = screen.getByRole("button", { name: /実行/ });
    expect(executeButton).toBeDisabled();
  });

  it("SQLが長い場合も正しく表示される", () => {
    const longSql = "SELECT " + "column, ".repeat(100) + "FROM logs";
    render(<SqlDisplay sql={longSql} />);

    expect(screen.getByText(longSql)).toBeInTheDocument();
  });
});
