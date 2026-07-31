# Custom Quick Activities Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the five low-frequency homepage shortcuts with five daily defaults and let users customize exactly five persisted shortcuts in Settings.

**Architecture:** The activity dictionary owns valid/default shortcut definitions, local preferences persist labels only, and `App` owns the current shortcut state. `HomePage` renders resolved definitions while `SettingsDialog` edits labels from the same validated option list.

**Tech Stack:** Preact, TypeScript, Vitest, Testing Library, localStorage, Vite.

---

### Task 1: Activity dictionary and shortcut persistence

**Files:**
- Modify: `src/domain/activities.ts`
- Modify: `src/state/preferences.ts`
- Test: `tests/domain/activities.test.ts`
- Test: `tests/domain/preferences.test.ts`

- [ ] **Step 1: Write failing dictionary and persistence tests**

Assert that `DEFAULT_QUICK_ACTIVITY_LABELS` equals `['理发', '沐浴', '打扫', '求医', '出行']`, `getActivityOptions()` returns unique resolvable labels, and `loadQuickActivityLabels()` accepts exactly five unique valid labels but rejects malformed, duplicate, and unknown values.

- [ ] **Step 2: Run tests to verify RED**

Run: `npx vitest run tests/domain/activities.test.ts tests/domain/preferences.test.ts --reporter=verbose`

Expected: FAIL because shortcut defaults, option helpers, and persistence functions do not exist.

- [ ] **Step 3: Implement the dictionary API and versioned storage**

Export the following API from `activities.ts`:

```ts
export const DEFAULT_QUICK_ACTIVITY_LABELS = ["理发", "沐浴", "打扫", "求医", "出行"] as const;
export function getActivityOptions(): ActivityDefinition[];
export function getActivitiesByLabels(labels: readonly string[]): ActivityDefinition[];
```

Add `loadQuickActivityLabels` and `saveQuickActivityLabels` in `preferences.ts` using `huangli:quick-activities:v1`. Validate array length, strings, uniqueness, and resolution before accepting saved data.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npx vitest run tests/domain/activities.test.ts tests/domain/preferences.test.ts --reporter=verbose`

Expected: all activity and preference tests pass.

### Task 2: Pass customizable shortcuts through the app

**Files:**
- Modify: `src/pages/home-page.tsx`
- Modify: `src/app.tsx`
- Test: `tests/components/home-page.test.tsx`
- Test: `tests/components/app.test.tsx`

- [ ] **Step 1: Write failing homepage and app tests**

Pass a five-item `quickActivities` prop to `HomePage`, assert those buttons render instead of the old constant, and assert a settings update changes the homepage buttons.

- [ ] **Step 2: Run tests to verify RED**

Run: `npx vitest run tests/components/home-page.test.tsx tests/components/app.test.tsx --reporter=verbose`

Expected: FAIL because `HomePage` does not accept the prop and `App` does not own shortcut state.

- [ ] **Step 3: Implement state flow**

Add `quickActivities: ActivityDefinition[]` to `HomePageProps` and map that prop in the shortcut row. In `App`, initialize labels with `loadQuickActivityLabels()`, resolve them for `HomePage`, and persist replacements with `saveQuickActivityLabels()`.

- [ ] **Step 4: Run tests to verify GREEN**

Run: `npx vitest run tests/components/home-page.test.tsx tests/components/app.test.tsx --reporter=verbose`

Expected: homepage and app tests pass.

### Task 3: Settings editor

**Files:**
- Modify: `src/components/settings-dialog.tsx`
- Modify: `src/styles.css`
- Test: `tests/components/settings-dialog.test.tsx`

- [ ] **Step 1: Write failing settings tests**

Render five labeled comboboxes, change one item, assert the full updated label array is emitted, assert already selected labels are disabled in other selectors, and assert “恢复默认” emits the default array.

- [ ] **Step 2: Run the settings test to verify RED**

Run: `npx vitest run tests/components/settings-dialog.test.tsx --reporter=verbose`

Expected: FAIL because the settings dialog only contains timezone controls.

- [ ] **Step 3: Implement the editor and restrained styles**

Add `quickActivityLabels`, `activityOptions`, and `onQuickActivitiesChange` props. Render five native selects with visible position labels, disable labels selected in other positions, and add a text button for restoring defaults. Keep controls responsive inside the existing dialog.

- [ ] **Step 4: Run the settings test to verify GREEN**

Run: `npx vitest run tests/components/settings-dialog.test.tsx --reporter=verbose`

Expected: settings tests pass.

### Task 4: Full verification

**Files:**
- Verify all modified source and test files.

- [ ] **Step 1: Run static and automated checks**

Run: `npm run typecheck`

Run: `npm run test:run -- --reporter=dot`

Run: `npm run build`

Expected: typecheck exits 0, all tests pass, and Vite production build exits 0.

- [ ] **Step 2: Verify in the local browser**

Reload `http://127.0.0.1:5173/`, verify the five new defaults, replace one from Settings, reload to confirm persistence, restore defaults, and check 375px width for horizontal overflow and console errors.

Expected: all interactions work, state persists, layout does not overflow, and console has no errors.

> Note: commit steps are omitted because `D:\Desktop\hl` is not a Git repository.
