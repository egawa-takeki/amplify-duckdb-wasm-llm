import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button } from "../Button";

describe("Button", () => {
  it("子要素が正しく表示される", () => {
    render(<Button>クリック</Button>);
    expect(screen.getByRole("button", { name: "クリック" })).toBeInTheDocument();
  });

  it("クリックイベントが発火する", async () => {
    const user = userEvent.setup();
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>クリック</Button>);

    await user.click(screen.getByRole("button"));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it("primaryバリアントのスタイルが適用される", () => {
    render(<Button variant="primary">Primary</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-primary");
  });

  it("secondaryバリアントのスタイルが適用される", () => {
    render(<Button variant="secondary">Secondary</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-gray-100");
  });

  it("dangerバリアントのスタイルが適用される", () => {
    render(<Button variant="danger">Danger</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-error");
  });

  it("ghostバリアントのスタイルが適用される", () => {
    render(<Button variant="ghost">Ghost</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("bg-transparent");
  });

  it("smサイズのスタイルが適用される", () => {
    render(<Button size="sm">Small</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("px-3");
    expect(button).toHaveClass("py-1.5");
  });

  it("mdサイズのスタイルが適用される", () => {
    render(<Button size="md">Medium</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("px-4");
    expect(button).toHaveClass("py-2");
  });

  it("lgサイズのスタイルが適用される", () => {
    render(<Button size="lg">Large</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("px-6");
    expect(button).toHaveClass("py-3");
  });

  it("disabled状態が正しく動作する", () => {
    render(<Button disabled>無効</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
  });

  it("ローディング状態でスピナーが表示される", () => {
    render(<Button isLoading>読み込み中</Button>);
    const button = screen.getByRole("button");
    expect(button).toBeDisabled();
    expect(button.querySelector("svg.animate-spin")).toBeInTheDocument();
  });

  it("カスタムclassNameが適用される", () => {
    render(<Button className="custom-class">カスタム</Button>);
    const button = screen.getByRole("button");
    expect(button).toHaveClass("custom-class");
  });
});
