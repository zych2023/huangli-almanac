import { Solar } from "lunar-javascript";
import type { AlmanacDay } from "./types";

export class InvalidDateError extends Error {
  constructor(value: string) {
    super(`无效日期：${value}`);
    this.name = "InvalidDateError";
  }
}

function parseIsoDate(value: string): [number, number, number] {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  if (!match) throw new InvalidDateError(value);

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const check = new Date(Date.UTC(year, month - 1, day));
  if (check.getUTCFullYear() !== year || check.getUTCMonth() !== month - 1 || check.getUTCDate() !== day) {
    throw new InvalidDateError(value);
  }
  return [year, month, day];
}

function normalizeItems(items: string[]): string[] {
  return [...new Set(items.map((item) => item.trim()).filter(Boolean))];
}

export function getAlmanacDay(isoDate: string): AlmanacDay {
  const [year, month, day] = parseIsoDate(isoDate);
  const solar = Solar.fromYmd(year, month, day);
  const lunar = solar.getLunar();
  return {
    solarDate: solar.toYmd(),
    lunarDate: `农历${lunar.getYearInChinese()}年${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    weekday: `星期${solar.getWeekInChinese()}`,
    suitable: normalizeItems(lunar.getDayYi()),
    unsuitable: normalizeItems(lunar.getDayJi()),
  };
}
