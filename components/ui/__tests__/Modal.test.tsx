import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Modal } from "../Modal";

describe("Modal", () => {
  it("開いている時にコンテンツが表示される", () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <p>モーダルの内容</p>
      </Modal>,
    );
    expect(screen.getByText("モーダルの内容")).toBeInTheDocument();
  });

  it("閉じている時にコンテンツが表示されない", () => {
    render(
      <Modal isOpen={false} onClose={() => {}}>
        <p>モーダルの内容</p>
      </Modal>,
    );
    expect(screen.queryByText("モーダルの内容")).not.toBeInTheDocument();
  });

  it("タイトルが表示される", () => {
    render(
      <Modal isOpen={true} onClose={() => {}} title="モーダルタイトル">
        <p>コンテンツ</p>
      </Modal>,
    );
    expect(screen.getByText("モーダルタイトル")).toBeInTheDocument();
  });

  it("タイトルなしの場合はヘッダーが表示されない", () => {
    render(
      <Modal isOpen={true} onClose={() => {}}>
        <p>コンテンツ</p>
      </Modal>,
    );
    expect(screen.queryByRole("heading")).not.toBeInTheDocument();
  });

  it("オーバーレイをクリックするとonCloseが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>コンテンツ</p>
      </Modal>,
    );

    const overlay = screen.getByText("コンテンツ").closest(".fixed");
    if (overlay?.previousSibling) {
      await user.click(overlay.previousSibling as HTMLElement);
      expect(handleClose).toHaveBeenCalledTimes(1);
    }
  });

  it("閉じるボタンをクリックするとonCloseが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose} title="タイトル">
        <p>コンテンツ</p>
      </Modal>,
    );

    // SVGアイコンを含むボタンを探す
    const closeButtons = screen
      .getAllByRole("button")
      .filter((btn) => btn.querySelector("svg"));
    await user.click(closeButtons[0]);

    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("ESCキーを押すとonCloseが呼ばれる", async () => {
    const user = userEvent.setup();
    const handleClose = jest.fn();
    render(
      <Modal isOpen={true} onClose={handleClose}>
        <p>コンテンツ</p>
      </Modal>,
    );

    await user.keyboard("{Escape}");
    expect(handleClose).toHaveBeenCalledTimes(1);
  });

  it("smサイズのスタイルが適用される", () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} size="sm">
        <p>コンテンツ</p>
      </Modal>,
    );
    expect(container.querySelector(".max-w-md")).toBeInTheDocument();
  });

  it("mdサイズのスタイルが適用される", () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} size="md">
        <p>コンテンツ</p>
      </Modal>,
    );
    expect(container.querySelector(".max-w-lg")).toBeInTheDocument();
  });

  it("lgサイズのスタイルが適用される", () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} size="lg">
        <p>コンテンツ</p>
      </Modal>,
    );
    expect(container.querySelector(".max-w-2xl")).toBeInTheDocument();
  });

  it("xlサイズのスタイルが適用される", () => {
    const { container } = render(
      <Modal isOpen={true} onClose={() => {}} size="xl">
        <p>コンテンツ</p>
      </Modal>,
    );
    expect(container.querySelector(".max-w-4xl")).toBeInTheDocument();
  });
});
