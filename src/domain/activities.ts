import { LunarUtil } from "lunar-javascript";
import type { ActivityDefinition } from "./types";

export const QUICK_ACTIVITIES: ActivityDefinition[] = [
  { label: "结婚", terms: ["嫁娶"], aliases: ["结婚", "婚礼", "嫁娶"] },
  { label: "搬家", terms: ["入宅", "移徙"], aliases: ["搬家", "乔迁", "入宅", "移徙"] },
  { label: "开业", terms: ["开市"], aliases: ["开业", "开张", "开市"] },
  { label: "装修", terms: ["修造"], aliases: ["装修", "修造"] },
  { label: "出行", terms: ["出行"], aliases: ["出行", "旅行", "旅游"] },
];

export const DEFAULT_QUICK_ACTIVITY_LABELS = ["理发", "沐浴", "打扫", "求医", "出行"] as const;

const EVERYDAY_ACTIVITIES: ActivityDefinition[] = [
  { label: "理发", terms: ["理发"], aliases: ["理发", "剪头发", "剪发", "做头发"] },
  { label: "沐浴", terms: ["沐浴"], aliases: ["沐浴", "洗澡"] },
  { label: "求医", terms: ["求医", "治病"], aliases: ["看病", "就医", "求医", "治病"] },
  { label: "打扫", terms: ["扫舍"], aliases: ["打扫", "大扫除", "扫舍"] },
  { label: "买衣服", terms: ["裁衣"], aliases: ["买衣服", "做衣服", "裁衣"] },
  { label: "签合同", terms: ["立券", "交易"], aliases: ["签合同", "签约", "立券"] },
];

const STANDARD_ACTIVITIES: ActivityDefinition[] = LunarUtil.YI_JI
  .filter((term, index, terms) => term && terms.indexOf(term) === index)
  .map((term) => ({ label: term, terms: [term], aliases: [term] }));

const SEARCHABLE_ACTIVITIES = [...QUICK_ACTIVITIES, ...EVERYDAY_ACTIVITIES, ...STANDARD_ACTIVITIES];

function normalize(value: string): string {
  return value.replace(/\s+/g, "").trim();
}

export function resolveActivity(input: string): ActivityDefinition | null {
  const normalized = normalize(input);
  if (!normalized) return null;
  return SEARCHABLE_ACTIVITIES.find((item) => item.aliases.includes(normalized) || item.terms.includes(normalized)) ?? null;
}

export function suggestActivities(input: string): ActivityDefinition[] {
  const normalized = normalize(input);
  if (!normalized) return QUICK_ACTIVITIES;
  const matches = SEARCHABLE_ACTIVITIES.filter((item) =>
    item.label.includes(normalized) || item.aliases.some((alias) => alias.includes(normalized)),
  );
  return matches.filter((item, index) => matches.findIndex((candidate) => candidate.label === item.label) === index).slice(0, 8);
}

export function getActivityOptions(): ActivityDefinition[] {
  return SEARCHABLE_ACTIVITIES.filter(
    (item, index) => SEARCHABLE_ACTIVITIES.findIndex((candidate) => candidate.label === item.label) === index,
  );
}

export function getActivitiesByLabels(labels: readonly string[]): ActivityDefinition[] {
  return labels.map((label) => resolveActivity(label)).filter((item): item is ActivityDefinition => item !== null);
}
