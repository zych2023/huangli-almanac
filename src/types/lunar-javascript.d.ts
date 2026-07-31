declare module "lunar-javascript" {
  interface LunarDate {
    getYearInChinese(): string;
    getMonthInChinese(): string;
    getDayInChinese(): string;
    getDayYi(sect?: number): string[];
    getDayJi(sect?: number): string[];
  }

  interface SolarDate {
    toYmd(): string;
    getWeekInChinese(): string;
    getLunar(): LunarDate;
  }

  export const Solar: {
    fromYmd(year: number, month: number, day: number): SolarDate;
  };

  export const LunarUtil: {
    YI_JI: string[];
  };
}
