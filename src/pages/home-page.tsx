import { useLayoutEffect, useState } from "preact/hooks";
import { CalendarDays, Search } from "lucide-preact";
import { resolveActivity, suggestActivities } from "../domain/activities";
import { addDays } from "../domain/search";
import type { ActivityDefinition, AlmanacDay, SearchMode, SuitableDateResult } from "../domain/types";
import { formatChineseDate, TodaySummary } from "../components/today-summary";

interface HomePageProps {
  today: AlmanacDay;
  startDate: string;
  searchMode: SearchMode;
  quickActivities: ActivityDefinition[];
  searchDates: (terms: string[], start: string, end: string, mode: SearchMode) => SuitableDateResult[];
  onOpenDate: (date: string) => void;
}

interface SearchSnapshot {
  value: string;
  terms: string[];
  start: string;
  end: string;
}

interface ModeResults {
  mode: SearchMode;
  items: SuitableDateResult[];
}

export function HomePage({ today, startDate, searchMode, quickActivities, searchDates, onOpenDate }: HomePageProps) {
  const [query, setQuery] = useState("");
  const [rangeStart, setRangeStart] = useState(startDate);
  const [rangeEnd, setRangeEnd] = useState(addDays(startDate, 89));
  const [resultState, setResultState] = useState<ModeResults | null>(null);
  const [matchedLabel, setMatchedLabel] = useState("");
  const [lastSearch, setLastSearch] = useState<SearchSnapshot | null>(null);
  const [error, setError] = useState("");
  const suggestions = query.trim() ? suggestActivities(query) : [];
  const isSuitableMode = searchMode === "suitable";
  const results = resultState?.mode === searchMode ? resultState.items : null;

  useLayoutEffect(() => {
    if (!lastSearch) return;
    try {
      const items = searchDates(lastSearch.terms, lastSearch.start, lastSearch.end, searchMode);
      setResultState({ mode: searchMode, items });
      setQuery(lastSearch.value);
      setMatchedLabel(lastSearch.terms.join("、"));
      setError("");
    } catch (reason) {
      setResultState(null);
      setLastSearch(null);
      setError(reason instanceof Error ? reason.message : "查询失败，请检查日期范围。");
    }
  }, [searchMode]);

  function runSearch(value = query) {
    const activity = resolveActivity(value);
    setQuery(value);
    if (!activity) {
      const suggestions = suggestActivities(value).map((item) => item.label).join("、");
      setError(suggestions ? `没有找到对应的黄历术语。你可以试试：${suggestions}` : "没有找到对应的黄历术语，请从常用事项中选择。");
      setResultState(null);
      setLastSearch(null);
      return;
    }
    try {
      const items = searchDates(activity.terms, rangeStart, rangeEnd, searchMode);
      setResultState({ mode: searchMode, items });
      setLastSearch({ value, terms: activity.terms, start: rangeStart, end: rangeEnd });
      setMatchedLabel(activity.terms.join("、"));
      setError("");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "查询失败，请检查日期范围。");
      setResultState(null);
      setLastSearch(null);
    }
  }

  return (
    <>
      <section class="search-hero" aria-labelledby="search-title">
        <span class="eyebrow">择日速查</span>
        <h2 id="search-title">{isSuitableMode ? "最近哪天适合？" : "最近哪天不宜？"}</h2>
        <p>输入想做的事，查找明确记为“{isSuitableMode ? "宜" : "忌"}”的日期。</p>
        <form role="search" class="search-form" onSubmit={(event) => { event.preventDefault(); runSearch(); }}>
          <Search class="search-icon" size={22} aria-hidden="true" />
          <input type="search" value={query} onInput={(event) => setQuery(event.currentTarget.value)} placeholder="例如：理发、沐浴、出行" aria-label="输入要查询的事项" />
          <button type="submit">查询</button>
        </form>
        {suggestions.length > 0 && (
          <div class="search-suggestions" aria-label="搜索建议">
            {suggestions.map((item) => (
              <button
                type="button"
                key={item.label}
                aria-label={`建议：${item.label}`}
                onClick={() => runSearch(item.label)}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
        <div class="quick-actions" aria-label="常用事项">
          {quickActivities.map((item) => <button type="button" key={item.label} onClick={() => runSearch(item.label)}>{item.label}</button>)}
        </div>
        <details class="range-settings">
          <summary><CalendarDays size={16} /> 查询范围：{formatChineseDate(rangeStart)} 至 {formatChineseDate(rangeEnd)}</summary>
          <div class="date-inputs">
            <label>开始日期<input type="date" value={rangeStart} onInput={(event) => setRangeStart(event.currentTarget.value)} /></label>
            <label>结束日期<input type="date" value={rangeEnd} onInput={(event) => setRangeEnd(event.currentTarget.value)} /></label>
          </div>
        </details>
        {error && <p class="message error" role="alert">{error}</p>}
      </section>

      {results && (
        <section class={`results-section ${isSuitableMode ? "suitable-mode" : "unsuitable-mode"}`} aria-labelledby="results-title">
          <div class="section-heading"><div><span class="eyebrow">查询结果</span><h2 id="results-title">{isSuitableMode ? "适合的日期" : "不宜的日期"}</h2></div><span class="match-note">匹配黄历术语：{matchedLabel}</span></div>
          {results.length ? <div class="result-list">{results.map((result) => (
            <button class="result-row" type="button" key={result.solarDate} aria-label={`查看 ${formatChineseDate(result.solarDate)}`} onClick={() => onOpenDate(result.solarDate)}>
              <span class="result-date"><strong>{formatChineseDate(result.solarDate)}</strong><small>{result.weekday} · {result.lunarDate}</small></span>
              <span class="matched-terms">{isSuitableMode ? "宜" : "忌"} {result.matchedTerms.join(" · ")}</span>
              <span aria-hidden="true">›</span>
            </button>
          ))}</div> : <div class="empty-state" role="status"><strong>所选范围内没有严格符合的{isSuitableMode ? "宜日" : "忌日"}</strong><p>可以扩大日期范围，判定标准不会自动降低。</p></div>}
        </section>
      )}
      <TodaySummary day={today} />
    </>
  );
}
