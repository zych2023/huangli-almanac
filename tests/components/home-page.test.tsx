import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import type { AlmanacDay, SuitableDateResult } from "../../src/domain/types";
import { HomePage } from "../../src/pages/home-page";
import { getActivitiesByLabels } from "../../src/domain/activities";

const today: AlmanacDay = {
  solarDate: "2026-07-30",
  lunarDate: "农历二〇二六年六月十七",
  weekday: "星期四",
  suitable: ["祭祀", "出行"],
  unsuitable: ["嫁娶"],
};

const result: SuitableDateResult = {
  ...today,
  solarDate: "2026-08-02",
  matchedTerms: ["入宅"],
};

const quickActivities = getActivitiesByLabels(["结婚", "搬家", "开业", "装修", "出行"]);

describe("HomePage", () => {
  it("searches from an everyday quick action and explains matched terms", () => {
    const openDate = vi.fn();
    render(<HomePage today={today} startDate="2026-07-30" searchMode="suitable" quickActivities={quickActivities} searchDates={() => [result]} onOpenDate={openDate} />);

    expect(screen.getByRole("heading", { name: "最近哪天适合？" })).toBeInTheDocument();
    expect(screen.getByText("今日宜忌")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "搬家" }));
    expect(screen.getByText("匹配黄历术语：入宅、移徙")).toBeInTheDocument();
    expect(screen.getByText("2026年8月2日")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: /查看 2026年8月2日/ }));
    expect(openDate).toHaveBeenCalledWith("2026-08-02");
  });

  it("does not guess unknown activities", () => {
    render(<HomePage today={today} startDate="2026-07-30" searchMode="suitable" quickActivities={quickActivities} searchDates={() => []} onOpenDate={() => undefined} />);
    fireEvent.input(screen.getByRole("searchbox"), { target: { value: "登月" } });
    fireEvent.submit(screen.getByRole("search"));
    expect(screen.getByRole("alert")).toHaveTextContent("没有找到对应的黄历术语");
  });

  it("searches standard terms that are not quick actions", () => {
    const searchDates = vi.fn(() => []);
    render(<HomePage today={today} startDate="2026-07-30" searchMode="suitable" quickActivities={quickActivities} searchDates={searchDates} onOpenDate={() => undefined} />);
    fireEvent.input(screen.getByRole("searchbox"), { target: { value: "理发" } });
    fireEvent.submit(screen.getByRole("search"));
    expect(searchDates).toHaveBeenCalledWith(["理发"], "2026-07-30", "2026-10-27", "suitable");
    expect(screen.getByText("匹配黄历术语：理发")).toBeInTheDocument();
  });

  it("shows suggestions beyond quick actions while typing", () => {
    render(<HomePage today={today} startDate="2026-07-30" searchMode="suitable" quickActivities={quickActivities} searchDates={() => []} onOpenDate={() => undefined} />);
    fireEvent.input(screen.getByRole("searchbox"), { target: { value: "理" } });
    expect(screen.getByRole("button", { name: "建议：理发" })).toBeInTheDocument();
  });

  it("renders the provided five quick activities", () => {
    const dailyActivities = getActivitiesByLabels(["理发", "沐浴", "打扫", "求医", "出行"]);
    render(<HomePage today={today} startDate="2026-07-30" searchMode="suitable" quickActivities={dailyActivities} searchDates={() => []} onOpenDate={() => undefined} />);
    expect(screen.getByLabelText("常用事项")).toHaveTextContent("理发沐浴打扫求医出行");
    expect(screen.queryByRole("button", { name: "开业" })).not.toBeInTheDocument();
  });

  it("maps every daily default shortcut to its almanac terms", () => {
    const dailyActivities = getActivitiesByLabels(["理发", "沐浴", "打扫", "求医", "出行"]);
    const searchDates = vi.fn(() => []);
    render(<HomePage today={today} startDate="2026-07-30" searchMode="suitable" quickActivities={dailyActivities} searchDates={searchDates} onOpenDate={() => undefined} />);
    const expectations: Array<[string, string[]]> = [
      ["理发", ["理发"]],
      ["沐浴", ["沐浴"]],
      ["打扫", ["扫舍"]],
      ["求医", ["求医", "治病"]],
      ["出行", ["出行"]],
    ];
    expectations.forEach(([label, terms]) => {
      fireEvent.click(screen.getByRole("button", { name: label }));
      expect(searchDates).toHaveBeenLastCalledWith(terms, "2026-07-30", "2026-10-27", "suitable");
      expect(screen.getByText(`匹配黄历术语：${terms.join("、")}`)).toBeInTheDocument();
    });
  });

  it("uses unsuitable copy and result labels in unsuitable mode", () => {
    render(<HomePage today={today} startDate="2026-07-30" searchMode="unsuitable" quickActivities={quickActivities} searchDates={() => [result]} onOpenDate={() => undefined} />);
    expect(screen.getByRole("heading", { name: "最近哪天不宜？" })).toBeInTheDocument();
    expect(screen.getByText("输入想做的事，查找明确记为“忌”的日期。")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "搬家" }));
    expect(screen.getByRole("heading", { name: "不宜的日期" })).toBeInTheDocument();
    expect(screen.getByText("忌 入宅")).toBeInTheDocument();
    expect(screen.getByText("今日宜忌")).toBeInTheDocument();
  });

  it("reruns the last successful query when mode changes", () => {
    const searchDates = vi.fn(() => [result]);
    const view = render(<HomePage today={today} startDate="2026-07-30" searchMode="suitable" quickActivities={quickActivities} searchDates={searchDates} onOpenDate={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "搬家" }));
    view.rerender(<HomePage today={today} startDate="2026-07-30" searchMode="unsuitable" quickActivities={quickActivities} searchDates={searchDates} onOpenDate={() => undefined} />);
    expect(searchDates).toHaveBeenLastCalledWith(["入宅", "移徙"], "2026-07-30", "2026-10-27", "unsuitable");
    expect(searchDates).toHaveBeenCalledTimes(2);
  });

  it("reruns with the last submitted range rather than unsubmitted date edits", () => {
    const searchDates = vi.fn(() => [result]);
    const view = render(<HomePage today={today} startDate="2026-07-30" searchMode="suitable" quickActivities={quickActivities} searchDates={searchDates} onOpenDate={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "搬家" }));
    fireEvent.input(screen.getByLabelText("结束日期"), { target: { value: "2026-08-30" } });
    view.rerender(<HomePage today={today} startDate="2026-07-30" searchMode="unsuitable" quickActivities={quickActivities} searchDates={searchDates} onOpenDate={() => undefined} />);
    expect(searchDates).toHaveBeenLastCalledWith(["入宅", "移徙"], "2026-07-30", "2026-10-27", "unsuitable");
  });

  it("does not revive an older valid search after an invalid search", () => {
    const searchDates = vi.fn(() => [result]);
    const view = render(<HomePage today={today} startDate="2026-07-30" searchMode="suitable" quickActivities={quickActivities} searchDates={searchDates} onOpenDate={() => undefined} />);
    fireEvent.click(screen.getByRole("button", { name: "搬家" }));
    fireEvent.input(screen.getByRole("searchbox"), { target: { value: "登月" } });
    fireEvent.submit(screen.getByRole("search"));
    view.rerender(<HomePage today={today} startDate="2026-07-30" searchMode="unsuitable" quickActivities={quickActivities} searchDates={searchDates} onOpenDate={() => undefined} />);
    expect(searchDates).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("alert")).toHaveTextContent("没有找到对应的黄历术语");
    expect(screen.queryByRole("heading", { name: "不宜的日期" })).not.toBeInTheDocument();
  });
});
