import { describe, expect, it } from "vitest";
import {
  loadQuickActivityLabels,
  loadTimezoneMode,
  saveQuickActivityLabels,
  saveTimezoneMode,
} from "../../src/state/preferences";
import { DEFAULT_QUICK_ACTIVITY_LABELS } from "../../src/domain/activities";

describe("timezone preferences", () => {
  it("defaults to Beijing and persists valid values", () => {
    localStorage.clear();
    expect(loadTimezoneMode()).toBe("beijing");
    saveTimezoneMode("device");
    expect(loadTimezoneMode()).toBe("device");
  });

  it("ignores damaged values", () => {
    localStorage.setItem("huangli:timezone-mode:v1", "mars");
    expect(loadTimezoneMode()).toBe("beijing");
  });
});

describe("quick activity preferences", () => {
  it("persists exactly five unique valid labels", () => {
    localStorage.clear();
    const labels = ["理发", "沐浴", "打扫", "求医", "出行"];
    expect(loadQuickActivityLabels()).toEqual(DEFAULT_QUICK_ACTIVITY_LABELS);
    saveQuickActivityLabels(labels);
    expect(loadQuickActivityLabels()).toEqual(labels);
  });

  it.each([
    ["not json"],
    [JSON.stringify(["理发"])],
    [JSON.stringify(["理发", "理发", "打扫", "求医", "出行"])],
    [JSON.stringify(["理发", "沐浴", "打扫", "求医", "登月"])],
    [JSON.stringify(["理发", "剪发", "打扫", "求医", "出行"])],
    [JSON.stringify(["理发", "沐浴", "打扫", "求医", "出行", "搬家"])],
  ])("restores defaults for invalid stored value %s", (stored) => {
    localStorage.setItem("huangli:quick-activities:v1", stored);
    expect(loadQuickActivityLabels()).toEqual(DEFAULT_QUICK_ACTIVITY_LABELS);
  });

  it("falls back when browser storage access itself is blocked", () => {
    const descriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
    Object.defineProperty(globalThis, "localStorage", { configurable: true, get: () => { throw new DOMException("blocked", "SecurityError"); } });
    try {
      expect(loadQuickActivityLabels()).toEqual(DEFAULT_QUICK_ACTIVITY_LABELS);
      expect(loadTimezoneMode()).toBe("beijing");
      expect(() => saveQuickActivityLabels(DEFAULT_QUICK_ACTIVITY_LABELS)).not.toThrow();
      expect(() => saveTimezoneMode("device")).not.toThrow();
    } finally {
      if (descriptor) Object.defineProperty(globalThis, "localStorage", descriptor);
    }
  });
});
