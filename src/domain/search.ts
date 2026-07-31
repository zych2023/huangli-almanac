import { getAlmanacDay } from "./almanac";
import type { AlmanacDay, SearchMode, SuitableDateResult } from "./types";

export class DateRangeError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DateRangeError";
  }
}

function parseDate(value: string): Date {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new DateRangeError(`无效日期：${value}`);
  const date = new Date(Date.UTC(Number(match[1]), Number(match[2]) - 1, Number(match[3])));
  if (formatDate(date) !== value) throw new DateRangeError(`无效日期：${value}`);
  return date;
}

export function formatDate(date: Date): string {
  return `${date.getUTCFullYear().toString().padStart(4, "0")}-${(date.getUTCMonth() + 1).toString().padStart(2, "0")}-${date.getUTCDate().toString().padStart(2, "0")}`;
}

export function addDays(isoDate: string, amount: number): string {
  const date = parseDate(isoDate);
  date.setUTCDate(date.getUTCDate() + amount);
  return formatDate(date);
}

export function searchDates(
  terms: string[],
  startDate: string,
  endDate: string,
  mode: SearchMode,
  readDay: (date: string) => AlmanacDay = getAlmanacDay,
): SuitableDateResult[] {
  const start = parseDate(startDate);
  const end = parseDate(endDate);
  const span = Math.round((end.getTime() - start.getTime()) / 86_400_000) + 1;
  if (span < 1) throw new DateRangeError("结束日期不能早于开始日期");
  if (span > 366) throw new DateRangeError("查询范围不能超过 366 天");

  const results: SuitableDateResult[] = [];
  for (let index = 0; index < span; index += 1) {
    const isoDate = addDays(startDate, index);
    const day = readDay(isoDate);
    const matchedTerms = terms.filter((term) => mode === "suitable"
      ? day.suitable.includes(term) && !day.unsuitable.includes(term)
      : day.unsuitable.includes(term) && !day.suitable.includes(term));
    if (matchedTerms.length) results.push({ ...day, matchedTerms });
  }
  return results;
}
