import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUICK_ACTIVITY_LABELS,
  getActivitiesByLabels,
  getActivityOptions,
  resolveActivity,
  suggestActivities,
} from "../../src/domain/activities";

describe("activity dictionary", () => {
  it("maps everyday words to traceable almanac terms", () => {
    expect(resolveActivity("结婚")?.terms).toEqual(["嫁娶"]);
    expect(resolveActivity(" 搬 家 ")?.terms).toEqual(["入宅", "移徙"]);
    expect(resolveActivity("开业")?.terms).toEqual(["开市"]);
    expect(resolveActivity("装修")?.terms).toEqual(["修造"]);
  });

  it("accepts exact almanac terms and rejects unknown terms", () => {
    expect(resolveActivity("嫁娶")?.terms).toEqual(["嫁娶"]);
    expect(resolveActivity("理发")?.terms).toEqual(["理发"]);
    expect(resolveActivity("沐浴")?.terms).toEqual(["沐浴"]);
    expect(resolveActivity("祭祀")?.terms).toEqual(["祭祀"]);
    expect(resolveActivity("未知事项")).toBeNull();
  });

  it("maps more everyday words without making them quick actions", () => {
    expect(resolveActivity("剪头发")?.terms).toEqual(["理发"]);
    expect(resolveActivity("洗澡")?.terms).toEqual(["沐浴"]);
    expect(resolveActivity("看病")?.terms).toEqual(["求医", "治病"]);
    expect(DEFAULT_QUICK_ACTIVITY_LABELS).not.toContain("洗澡");
  });

  it("keeps quick actions stable and suggests known items", () => {
    expect(DEFAULT_QUICK_ACTIVITY_LABELS).toEqual(["理发", "沐浴", "打扫", "求医", "出行"]);
    expect(suggestActivities("搬").map((item) => item.label)).toContain("搬家");
    expect(suggestActivities("理").map((item) => item.label)).toContain("理发");
  });

  it("provides unique resolvable options and resolves saved labels", () => {
    const options = getActivityOptions();
    const labels = options.map((item) => item.label);
    expect(new Set(labels).size).toBe(labels.length);
    expect(options.every((item) => resolveActivity(item.label) !== null)).toBe(true);
    expect(getActivitiesByLabels(DEFAULT_QUICK_ACTIVITY_LABELS).map((item) => item.label)).toEqual(DEFAULT_QUICK_ACTIVITY_LABELS);
  });
});
