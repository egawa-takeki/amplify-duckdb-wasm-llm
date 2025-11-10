import { render, screen } from "@testing-library/react";
import { Card } from "../Card";

describe("Card", () => {
  it("子要素が正しく表示される", () => {
    render(
      <Card>
        <p>カードの内容</p>
      </Card>,
    );
    expect(screen.getByText("カードの内容")).toBeInTheDocument();
  });

  it("デフォルトでmdパディングが適用される", () => {
    const { container } = render(<Card>コンテンツ</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("p-6");
  });

  it("noneパディングが適用される", () => {
    const { container } = render(<Card padding="none">コンテンツ</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveClass("p-4");
    expect(card).not.toHaveClass("p-6");
    expect(card).not.toHaveClass("p-8");
  });

  it("smパディングが適用される", () => {
    const { container } = render(<Card padding="sm">コンテンツ</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("p-4");
  });

  it("lgパディングが適用される", () => {
    const { container } = render(<Card padding="lg">コンテンツ</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("p-8");
  });

  it("hover有効時にホバースタイルが適用される", () => {
    const { container } = render(<Card hover>コンテンツ</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("hover:shadow-md");
    expect(card).toHaveClass("cursor-pointer");
  });

  it("hover無効時にホバースタイルが適用されない", () => {
    const { container } = render(<Card>コンテンツ</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveClass("hover:shadow-md");
    expect(card).not.toHaveClass("cursor-pointer");
  });

  it("カスタムclassNameが適用される", () => {
    const { container } = render(
      <Card className="custom-class">コンテンツ</Card>,
    );
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("custom-class");
  });

  it("基本スタイルが常に適用される", () => {
    const { container } = render(<Card>コンテンツ</Card>);
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass("bg-white");
    expect(card).toHaveClass("rounded-lg");
    expect(card).toHaveClass("border");
    expect(card).toHaveClass("border-gray-200");
  });
});
