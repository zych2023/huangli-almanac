import { fireEvent, render, screen } from "@testing-library/preact";
import { describe, expect, it, vi } from "vitest";
import { DatePage } from "../../src/pages/date-page";

describe("DatePage", () => {
  it("shows details and supports adjacent dates", () => {
    const navigate = vi.fn();
    render(
      <DatePage
        day={{ solarDate: "2026-07-30", lunarDate: "农历六月十七", weekday: "星期四", suitable: ["祭祀"], unsuitable: ["嫁娶"] }}
        onNavigate={navigate}
        onBack={() => undefined}
      />,
    );
    expect(screen.getByRole("heading", { name: "2026年7月30日" })).toBeInTheDocument();
    expect(screen.getByText("祭祀")).toBeInTheDocument();
    expect(screen.getByText("嫁娶")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "后一天" }));
    expect(navigate).toHaveBeenCalledWith("2026-07-31");
  });
});
