import type { AlmanacDay } from "../domain/types";

export function TodaySummary({ day }: { day: AlmanacDay }) {
  return (
    <section class="today-section" aria-labelledby="today-title">
      <div class="section-heading">
        <div>
          <span class="eyebrow">今日</span>
          <h2 id="today-title">今日宜忌</h2>
        </div>
        <div class="date-meta"><strong>{formatChineseDate(day.solarDate)}</strong><span>{day.weekday} · {day.lunarDate}</span></div>
      </div>
      <div class="yi-ji-grid">
        <ActivityBlock kind="suitable" label="宜" items={day.suitable} />
        <ActivityBlock kind="unsuitable" label="忌" items={day.unsuitable} />
      </div>
    </section>
  );
}

export function ActivityBlock({ kind, label, items }: { kind: "suitable" | "unsuitable"; label: string; items: string[] }) {
  return (
    <div class={`activity-block ${kind}`}>
      <span class="activity-mark">{label}</span>
      <div class="activity-list">{items.length ? items.map((item) => <span key={item}>{item}</span>) : <span>无特别记载</span>}</div>
    </div>
  );
}

export function formatChineseDate(isoDate: string): string {
  const [year, month, day] = isoDate.split("-").map(Number);
  return `${year}年${month}月${day}日`;
}
