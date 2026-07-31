import { ArrowLeft, ChevronLeft, ChevronRight } from "lucide-preact";
import { addDays } from "../domain/search";
import type { AlmanacDay } from "../domain/types";
import { ActivityBlock, formatChineseDate } from "../components/today-summary";

export function DatePage({ day, onNavigate, onBack }: { day: AlmanacDay; onNavigate: (date: string) => void; onBack: () => void }) {
  return (
    <article class="date-page">
      <button class="back-button" type="button" onClick={onBack}><ArrowLeft size={18} /> 返回查询</button>
      <header class="date-header"><span class="eyebrow">日期详情</span><h1>{formatChineseDate(day.solarDate)}</h1><p>{day.weekday} · {day.lunarDate}</p></header>
      <div class="yi-ji-grid detail-grid">
        <ActivityBlock kind="suitable" label="宜" items={day.suitable} />
        <ActivityBlock kind="unsuitable" label="忌" items={day.unsuitable} />
      </div>
      <nav class="date-nav" aria-label="相邻日期">
        <button type="button" aria-label="前一天" title="前一天" onClick={() => onNavigate(addDays(day.solarDate, -1))}><ChevronLeft size={20} /><span>前一天</span></button>
        <button type="button" aria-label="后一天" title="后一天" onClick={() => onNavigate(addDays(day.solarDate, 1))}><span>后一天</span><ChevronRight size={20} /></button>
      </nav>
    </article>
  );
}
