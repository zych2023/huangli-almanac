import type { TimezoneMode } from "./types";

export function getTodayIso(mode: TimezoneMode, now = new Date(), deviceTimeZone?: string): string {
  const timeZone = mode === "beijing"
    ? "Asia/Shanghai"
    : deviceTimeZone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const read = (type: Intl.DateTimeFormatPartTypes) => parts.find((part) => part.type === type)?.value ?? "";
  return `${read("year")}-${read("month")}-${read("day")}`;
}
