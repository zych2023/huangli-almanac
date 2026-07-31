import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { SettingsDialog } from "../../src/components/settings-dialog";
import { DEFAULT_QUICK_ACTIVITY_LABELS, getActivityOptions } from "../../src/domain/activities";

describe("SettingsDialog", () => {
  it("changes timezone mode and identifies the data source", () => {
    const change = vi.fn();
    render(<SettingsDialog mode="beijing" quickActivityLabels={[...DEFAULT_QUICK_ACTIVITY_LABELS]} activityOptions={getActivityOptions()} onQuickActivitiesChange={() => undefined} onChange={change} onClose={() => undefined} />);
    expect(screen.getByText(/lunar-javascript v1.7.7/)).toBeInTheDocument();
    expect(screen.getByText(/传统民俗信息，仅供参考/)).toBeInTheDocument();
    fireEvent.click(screen.getByLabelText("设备时区"));
    expect(change).toHaveBeenCalledWith("device");
  });

  it("updates one of five shortcuts and prevents duplicate choices", () => {
    const update = vi.fn();
    render(<SettingsDialog mode="beijing" quickActivityLabels={[...DEFAULT_QUICK_ACTIVITY_LABELS]} activityOptions={getActivityOptions()} onQuickActivitiesChange={update} onChange={() => undefined} onClose={() => undefined} />);
    expect(screen.getAllByRole("combobox")).toHaveLength(5);
    const secondSelect = screen.getByRole("combobox", { name: "快捷入口 2" });
    expect(secondSelect.querySelector('option[value="理发"]')).toBeDisabled();
    fireEvent.change(screen.getByRole("combobox", { name: "快捷入口 1" }), { target: { value: "搬家" } });
    expect(update).toHaveBeenCalledWith(["搬家", "沐浴", "打扫", "求医", "出行"]);
  });

  it("restores the five default shortcuts", () => {
    const update = vi.fn();
    render(<SettingsDialog mode="beijing" quickActivityLabels={["搬家", "沐浴", "打扫", "求医", "出行"]} activityOptions={getActivityOptions()} onQuickActivitiesChange={update} onChange={() => undefined} onClose={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "恢复默认快捷入口" }));
    expect(update).toHaveBeenCalledWith([...DEFAULT_QUICK_ACTIVITY_LABELS]);
  });

  it("keeps keyboard focus inside the modal and closes with Escape", () => {
    const close = vi.fn();
    render(<SettingsDialog mode="beijing" quickActivityLabels={[...DEFAULT_QUICK_ACTIVITY_LABELS]} activityOptions={getActivityOptions()} onQuickActivitiesChange={() => undefined} onChange={() => undefined} onClose={close} />);
    const dialog = screen.getByRole("dialog");
    const closeButton = screen.getByRole("button", { name: "关闭设置" });
    expect(closeButton).toHaveFocus();
    const selects = screen.getAllByRole("combobox");
    selects[selects.length - 1].focus();
    fireEvent.keyDown(dialog, { key: "Tab" });
    expect(closeButton).toHaveFocus();
    fireEvent.keyDown(dialog, { key: "Escape" });
    expect(close).toHaveBeenCalledOnce();
  });
});
