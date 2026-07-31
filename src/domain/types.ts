export interface AlmanacDay {
  solarDate: string;
  lunarDate: string;
  weekday: string;
  suitable: string[];
  unsuitable: string[];
}

export interface ActivityDefinition {
  label: string;
  terms: string[];
  aliases: string[];
}

export interface SuitableDateResult extends AlmanacDay {
  matchedTerms: string[];
}

export type TimezoneMode = "beijing" | "device";

export type SearchMode = "suitable" | "unsuitable";
