import type { JSX } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { RotateCcw, X } from "lucide-preact";
import { DEFAULT_QUICK_ACTIVITY_LABELS } from "../domain/activities";
import type { ActivityDefinition, TimezoneMode } from "../domain/types";

interface SettingsDialogProps {
  mode: TimezoneMode;
  quickActivityLabels: string[];
  activityOptions: ActivityDefinition[];
  onQuickActivitiesChange: (labels: string[]) => void;
  onChange: (mode: TimezoneMode) => void;
  onClose: () => void;
}

export function SettingsDialog({ mode, quickActivityLabels, activityOptions, onQuickActivitiesChange, onChange, onClose }: SettingsDialogProps) {
  const dialogRef = useRef<HTMLElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    closeButtonRef.current?.focus();
    return () => previouslyFocused?.focus();
  }, []);

  function changeQuickActivity(index: number, label: string) {
    const next = [...quickActivityLabels];
    next[index] = label;
    onQuickActivitiesChange(next);
  }

  function handleKeyDown(event: JSX.TargetedKeyboardEvent<HTMLElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      onClose();
      return;
    }
    if (event.key !== "Tab" || !dialogRef.current) return;
    const focusable = Array.from(dialogRef.current.querySelectorAll<HTMLElement>("button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex='-1'])"));
    const first = focusable[0];
    const last = focusable[focusable.length - 1];
    if (event.shiftKey && document.activeElement === first) {
      event.preventDefault();
      last?.focus();
    } else if (!event.shiftKey && document.activeElement === last) {
      event.preventDefault();
      first?.focus();
    }
  }

  return (
    <div class="modal-backdrop" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section ref={dialogRef} class="settings-dialog" role="dialog" aria-modal="true" aria-labelledby="settings-title" onKeyDown={handleKeyDown}>
        <div class="dialog-header">
          <h2 id="settings-title">设置</h2>
          <button ref={closeButtonRef} class="icon-button" type="button" aria-label="关闭设置" title="关闭" onClick={onClose}><X size={20} /></button>
        </div>
        <fieldset>
          <legend>“今天”所用时区</legend>
          <label class="radio-row"><input aria-label="北京时间" type="radio" name="timezone" checked={mode === "beijing"} onChange={() => onChange("beijing")} /><span><strong>北京时间</strong><small>固定 Asia/Shanghai，推荐</small></span></label>
          <label class="radio-row"><input aria-label="设备时区" type="radio" name="timezone" checked={mode === "device"} onChange={() => onChange("device")} /><span><strong>设备时区</strong><small>跟随当前电脑或手机</small></span></label>
        </fieldset>
        <section class="quick-settings" aria-labelledby="quick-settings-title">
          <div class="settings-section-heading">
            <h3 id="quick-settings-title">快捷入口</h3>
            <button class="reset-button" type="button" aria-label="恢复默认快捷入口" onClick={() => onQuickActivitiesChange([...DEFAULT_QUICK_ACTIVITY_LABELS])}><RotateCcw size={15} />恢复默认</button>
          </div>
          <div class="quick-select-grid">
            {quickActivityLabels.map((currentLabel, index) => (
              <label class="quick-select-row" key={index}>
                <span>第 {index + 1} 个</span>
                <select aria-label={`快捷入口 ${index + 1}`} value={currentLabel} onChange={(event) => changeQuickActivity(index, event.currentTarget.value)}>
                  {activityOptions.map((option) => (
                    <option key={option.label} value={option.label} disabled={option.label !== currentLabel && quickActivityLabels.includes(option.label)}>{option.label}</option>
                  ))}
                </select>
              </label>
            ))}
          </div>
        </section>
        <div class="source-note"><strong>数据口径</strong><p>lunar-javascript v1.7.7</p><small>传统民俗信息，仅供参考。版本固定，结果可复现。</small></div>
      </section>
    </div>
  );
}
