import { fireEvent, render, screen } from "@testing-library/preact";
import { beforeEach, describe, expect, it } from "vitest";
import { App } from "../../src/app";

describe("App navigation", () => {
  beforeEach(() => localStorage.clear());

  it("keeps search results after opening and closing a date", () => {
    render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "理发" }));
    expect(screen.getByRole("heading", { name: "适合的日期" })).toBeInTheDocument();
    const resultButtons = screen.getAllByRole("button", { name: /查看 .*年.*月.*日/ });
    fireEvent.click(resultButtons[0]);
    fireEvent.click(screen.getByRole("button", { name: "返回查询" }));
    expect(screen.getByText("匹配黄历术语：理发")).toBeInTheDocument();
  });

  it("shows the five daily shortcut defaults", () => {
    render(<App />);
    expect(screen.getByLabelText("常用事项")).toHaveTextContent("理发沐浴打扫求医出行");
  });

  it("updates and persists a customized shortcut from settings", () => {
    const view = render(<App />);
    fireEvent.click(screen.getByRole("button", { name: "打开设置" }));
    fireEvent.change(screen.getByRole("combobox", { name: "快捷入口 1" }), { target: { value: "搬家" } });
    expect(screen.getByLabelText("常用事项")).toHaveTextContent("搬家沐浴打扫求医出行");
    expect(JSON.parse(localStorage.getItem("huangli:quick-activities:v1") ?? "null")).toEqual(["搬家", "沐浴", "打扫", "求医", "出行"]);
    view.unmount();
    render(<App />);
    expect(screen.getByLabelText("常用事项")).toHaveTextContent("搬家沐浴打扫求医出行");
  });

  it("toggles unsuitable search from the seal and keeps it through date navigation", () => {
    render(<App />);
    const switchToUnsuitable = screen.getByRole("button", { name: "切换为忌日查询" });
    expect(switchToUnsuitable).toHaveTextContent("宜");
    fireEvent.click(switchToUnsuitable);
    expect(screen.getByRole("button", { name: "切换为宜日查询" })).toHaveTextContent("忌");
    expect(screen.getByRole("heading", { name: "最近哪天不宜？" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "出行" }));
    expect(screen.getByRole("heading", { name: "不宜的日期" })).toBeInTheDocument();
    const resultButtons = screen.getAllByRole("button", { name: /查看 .*年.*月.*日/ });
    fireEvent.click(resultButtons[0]);
    fireEvent.click(screen.getByRole("button", { name: "返回查询" }));
    expect(screen.getByRole("heading", { name: "不宜的日期" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "切换为宜日查询" })).toHaveTextContent("忌");
    fireEvent.click(screen.getByRole("button", { name: "切换为宜日查询" }));
    expect(screen.getByRole("heading", { name: "适合的日期" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "返回首页" })).toBeInTheDocument();
  });
});
