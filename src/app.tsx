import { useMemo, useState } from "preact/hooks";
import { Settings } from "lucide-preact";
import { SettingsDialog } from "./components/settings-dialog";
import { getActivitiesByLabels, getActivityOptions } from "./domain/activities";
import { getAlmanacDay } from "./domain/almanac";
import { searchDates } from "./domain/search";
import { getTodayIso } from "./domain/timezone";
import type { SearchMode, TimezoneMode } from "./domain/types";
import { DatePage } from "./pages/date-page";
import { HomePage } from "./pages/home-page";
import { loadQuickActivityLabels, loadTimezoneMode, saveQuickActivityLabels, saveTimezoneMode } from "./state/preferences";

export function App() {
  const [mode, setMode] = useState<TimezoneMode>(() => loadTimezoneMode());
  const [searchMode, setSearchMode] = useState<SearchMode>("suitable");
  const [quickActivityLabels, setQuickActivityLabels] = useState<string[]>(() => loadQuickActivityLabels());
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const todayIso = getTodayIso(mode);
  const today = useMemo(() => getAlmanacDay(todayIso), [todayIso]);
  const quickActivities = useMemo(() => getActivitiesByLabels(quickActivityLabels), [quickActivityLabels]);
  const activityOptions = useMemo(() => getActivityOptions(), []);

  function changeMode(next: TimezoneMode) {
    saveTimezoneMode(next);
    setMode(next);
  }

  function changeQuickActivities(labels: string[]) {
    saveQuickActivityLabels(labels);
    setQuickActivityLabels(labels);
  }

  return (
    <div class="app-shell">
      <header class="topbar">
        <div class="brand-group">
          <button class="mode-toggle" type="button" aria-label={searchMode === "suitable" ? "切换为忌日查询" : "切换为宜日查询"} title={searchMode === "suitable" ? "查询忌日" : "查询宜日"} onClick={() => setSearchMode((current) => current === "suitable" ? "unsuitable" : "suitable")}><span class="brand-seal">{searchMode === "suitable" ? "宜" : "忌"}</span></button>
          <button class="brand" type="button" onClick={() => setSelectedDate(null)} aria-label="返回首页"><span><strong>黄历速查</strong><small>宜忌 · 择日</small></span></button>
        </div>
        <div class="topbar-actions"><span class="timezone-label">{mode === "beijing" ? "北京时间" : "设备时区"}</span><button class="icon-button" type="button" aria-label="打开设置" title="设置" onClick={() => setSettingsOpen(true)}><Settings size={20} /></button></div>
      </header>
      <main class="main-content">
        <div hidden={selectedDate !== null}>
          <HomePage today={today} startDate={todayIso} searchMode={searchMode} quickActivities={quickActivities} searchDates={searchDates} onOpenDate={setSelectedDate} />
        </div>
        {selectedDate && <DatePage day={getAlmanacDay(selectedDate)} onNavigate={setSelectedDate} onBack={() => setSelectedDate(null)} />}
      </main>
      <footer>
        <a class="footer-project-link" href="https://github.com/zych2023/huangli-almanac" target="_blank" rel="noopener noreferrer">github.com/zych2023/huangli-almanac</a>
        <span class="footer-author">zych2023</span>
        <span>传统民俗信息，仅供参考</span>
      </footer>
      {settingsOpen && <SettingsDialog mode={mode} quickActivityLabels={quickActivityLabels} activityOptions={activityOptions} onQuickActivitiesChange={changeQuickActivities} onChange={changeMode} onClose={() => setSettingsOpen(false)} />}
    </div>
  );
}
