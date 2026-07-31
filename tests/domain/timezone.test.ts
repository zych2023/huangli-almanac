import { describe, expect, it } from "vitest";
import { getTodayIso } from "../../src/domain/timezone";

describe("getTodayIso", () => {
  it("uses the Beijing midnight boundary", () => {
    expect(getTodayIso("beijing", new Date("2026-07-30T15:59:59Z"))).toBe("2026-07-30");
    expect(getTodayIso("beijing", new Date("2026-07-30T16:00:00Z"))).toBe("2026-07-31");
  });

  it("can use an injected device timezone", () => {
    expect(getTodayIso("device", new Date("2026-07-30T23:00:00Z"), "America/Los_Angeles")).toBe("2026-07-30");
  });
});
