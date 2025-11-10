import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { DateRangeSelector } from "../DateRangeSelector";

describe("DateRangeSelector", () => {
  it("デフォルトで24時間プリセットが選択されている", () => {
    render(<DateRangeSelector />);

    const button = screen.getByRole("button", { name: "過去24時間" });
    expect(button).toHaveClass("bg-primary");
  });

  it("プリセットボタンをクリックすると選択が変わる", async () => {
    const user = userEvent.setup();
    render(<DateRangeSelector />);

    const button7d = screen.getByRole("button", { name: "過去7日間" });
    await user.click(button7d);

    expect(button7d).toHaveClass("bg-primary");
  });

  it("1時間プリセット選択時に正しいデータサイズが表示される", async () => {
    const user = userEvent.setup();
    render(<DateRangeSelector />);

    const button1h = screen.getByRole("button", { name: "過去1時間" });
    await user.click(button1h);

    expect(screen.getByText(/約 20 MB/)).toBeInTheDocument();
  });

  it("7日間プリセット選択時に警告が表示される", async () => {
    const user = userEvent.setup();
    render(<DateRangeSelector />);

    const button7d = screen.getByRole("button", { name: "過去7日間" });
    await user.click(button7d);

    expect(screen.getByText(/約 2.8 GB/)).toBeInTheDocument();
    expect(
      screen.getByText("処理に時間がかかる可能性があります"),
    ).toBeInTheDocument();
  });

  it("30日間プリセット選択時に警告が表示される", async () => {
    const user = userEvent.setup();
    render(<DateRangeSelector />);

    const button30d = screen.getByRole("button", { name: "過去30日間" });
    await user.click(button30d);

    expect(screen.getByText(/約 12 GB/)).toBeInTheDocument();
    expect(
      screen.getByText("処理に時間がかかる可能性があります"),
    ).toBeInTheDocument();
  });

  it("カスタム範囲を選択すると日付入力フィールドが表示される", async () => {
    const user = userEvent.setup();
    render(<DateRangeSelector />);

    const customButton = screen.getByRole("button", { name: "カスタム範囲" });
    await user.click(customButton);

    expect(screen.getByText("開始日")).toBeInTheDocument();
    expect(screen.getByText("終了日")).toBeInTheDocument();
  });

  it("カスタム範囲で日付を入力すると推定サイズが計算される", async () => {
    const user = userEvent.setup();
    const { container } = render(<DateRangeSelector />);

    const customButton = screen.getByRole("button", { name: "カスタム範囲" });
    await user.click(customButton);

    const inputs = container.querySelectorAll('input[type="date"]');
    const startInput = inputs[0] as HTMLInputElement;
    const endInput = inputs[1] as HTMLInputElement;

    await user.type(startInput, "2025-01-01");
    await user.type(endInput, "2025-01-03");

    // 2日間 * 150MB = 300MB
    expect(screen.getByText(/約 300 MB/)).toBeInTheDocument();
  });

  it("開始日が終了日より後の場合にエラーメッセージが表示される", async () => {
    const user = userEvent.setup();
    const { container } = render(<DateRangeSelector />);

    const customButton = screen.getByRole("button", { name: "カスタム範囲" });
    await user.click(customButton);

    const inputs = container.querySelectorAll('input[type="date"]');
    const startInput = inputs[0] as HTMLInputElement;
    const endInput = inputs[1] as HTMLInputElement;

    await user.type(startInput, "2025-01-10");
    await user.type(endInput, "2025-01-05");

    expect(
      screen.getByText("開始日は終了日より前に設定してください"),
    ).toBeInTheDocument();
  });

  it("推定サイズが1GB以上の場合にGB単位で表示される", async () => {
    const user = userEvent.setup();
    const { container } = render(<DateRangeSelector />);

    const customButton = screen.getByRole("button", { name: "カスタム範囲" });
    await user.click(customButton);

    const inputs = container.querySelectorAll('input[type="date"]');
    const startInput = inputs[0] as HTMLInputElement;
    const endInput = inputs[1] as HTMLInputElement;

    await user.type(startInput, "2025-01-01");
    await user.type(endInput, "2025-01-10");

    // 9日間 * 150MB = 1350MB = 1.35GB
    expect(screen.getByText(/約 1\.4 GB/)).toBeInTheDocument();
  });
});
