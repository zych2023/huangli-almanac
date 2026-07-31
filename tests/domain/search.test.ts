import { describe, expect, it } from "vitest";
import type { AlmanacDay } from "../../src/domain/types";
import { DateRangeError, searchDates } from "../../src/domain/search";

const days: Record<string, AlmanacDay> = {
  "2026-01-01": { solarDate: "2026-01-01", lunarDate: "冬月十三", weekday: "星期四", suitable: ["入宅"], unsuitable: [] },
  "2026-01-02": { solarDate: "2026-01-02", lunarDate: "冬月十四", weekday: "星期五", suitable: ["移徙"], unsuitable: ["移徙"] },
  "2026-01-03": { solarDate: "2026-01-03", lunarDate: "冬月十五", weekday: "星期六", suitable: ["祭祀"], unsuitable: ["入宅"] },
};

describe("searchDates", () => {
  it("only includes explicitly suitable and not unsuitable dates", () => {
    const result = searchDates(["入宅", "移徙"], "2026-01-01", "2026-01-03", "suitable", (date) => days[date]);
    expect(result).toEqual([{ ...days["2026-01-01"], matchedTerms: ["入宅"] }]);
  });

  it("only includes explicitly unsuitable and not suitable dates", () => {
    const result = searchDates(["入宅", "移徙"], "2026-01-01", "2026-01-03", "unsuitable", (date) => days[date]);
    expect(result).toEqual([{ ...days["2026-01-03"], matchedTerms: ["入宅"] }]);
  });

  it("validates inclusive ranges", () => {
    expect(searchDates(["入宅"], "2026-01-01", "2026-01-01", "suitable", (date) => days[date])).toHaveLength(1);
    expect(() => searchDates(["入宅"], "2026-01-02", "2026-01-01", "suitable")).toThrow(DateRangeError);
    expect(() => searchDates(["入宅"], "2026-01-01", "2027-01-02", "suitable")).toThrow(DateRangeError);
    expect(() => searchDates(["入宅"], "bad", "2026-01-01", "suitable")).toThrow(DateRangeError);
  });
});
