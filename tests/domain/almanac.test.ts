import { describe, expect, it } from "vitest";
import { getAlmanacDay, InvalidDateError } from "../../src/domain/almanac";

describe("getAlmanacDay", () => {
  it("returns normalized almanac data", () => {
    const day = getAlmanacDay("2026-07-30");
    expect(day).toMatchObject({
      solarDate: "2026-07-30",
      weekday: expect.any(String),
      lunarDate: expect.any(String),
      suitable: expect.any(Array),
      unsuitable: expect.any(Array),
    });
    expect(day.weekday.length).toBeGreaterThan(0);
    expect(day.lunarDate.length).toBeGreaterThan(0);
    expect(day.suitable).toEqual([...new Set(day.suitable)]);
    expect(day.unsuitable).toEqual([...new Set(day.unsuitable)]);
    expect([...day.suitable, ...day.unsuitable]).not.toContain("");
  });

  it("rejects invalid calendar dates", () => {
    expect(() => getAlmanacDay("2026-02-30")).toThrow(InvalidDateError);
    expect(() => getAlmanacDay("30-07-2026")).toThrow(InvalidDateError);
  });
});
