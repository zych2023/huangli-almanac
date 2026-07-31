import type { TimezoneMode } from "../domain/types";
import { DEFAULT_QUICK_ACTIVITY_LABELS, getActivityOptions } from "../domain/activities";

const STORAGE_KEY = "huangli:timezone-mode:v1";
const QUICK_ACTIVITIES_STORAGE_KEY = "huangli:quick-activities:v1";

export function loadTimezoneMode(storage?: Storage): TimezoneMode {
  try {
    return (storage ?? globalThis.localStorage).getItem(STORAGE_KEY) === "device" ? "device" : "beijing";
  } catch {
    return "beijing";
  }
}

export function saveTimezoneMode(mode: TimezoneMode, storage?: Storage): void {
  try {
    (storage ?? globalThis.localStorage).setItem(STORAGE_KEY, mode);
  } catch {
    // The app remains usable when storage is unavailable.
  }
}

export function loadQuickActivityLabels(storage?: Storage): string[] {
  try {
    const value: unknown = JSON.parse((storage ?? globalThis.localStorage).getItem(QUICK_ACTIVITIES_STORAGE_KEY) ?? "null");
    const validLabels = new Set(getActivityOptions().map((item) => item.label));
    if (
      Array.isArray(value)
      && value.length === 5
      && value.every((label): label is string => typeof label === "string" && validLabels.has(label))
      && new Set(value).size === value.length
    ) {
      return [...value];
    }
  } catch {
    // Invalid or unavailable storage falls back to stable defaults.
  }
  return [...DEFAULT_QUICK_ACTIVITY_LABELS];
}

export function saveQuickActivityLabels(labels: readonly string[], storage?: Storage): void {
  try {
    (storage ?? globalThis.localStorage).setItem(QUICK_ACTIVITIES_STORAGE_KEY, JSON.stringify(labels));
  } catch {
    // The current session remains usable when storage is unavailable.
  }
}
