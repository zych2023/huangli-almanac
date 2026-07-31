# Suitable and Unsuitable Search Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a top-left 宜/忌 toggle that switches future-date search between strict suitable and strict unsuitable rules.

**Architecture:** A `SearchMode` state lives in `App`, the domain search service applies a symmetric mode-specific rule, and `HomePage` derives all search copy and result labels from the mode. The brand seal toggles mode while the adjacent brand text retains return-home behavior.

**Tech Stack:** Preact, TypeScript, Vitest, Testing Library, Vite.

---

### Task 1: Symmetric domain search

**Files:**
- Modify: `src/domain/types.ts`
- Modify: `src/domain/search.ts`
- Test: `tests/domain/search.test.ts`

- [ ] **Step 1: Write a failing strict-unsuitable test**

Add a day with a term only in `unsuitable` and assert `searchDates(..., "unsuitable", readDay)` includes it while excluding a day that contains the term in both lists.

- [ ] **Step 2: Run the domain test and verify RED**

Run: `npx vitest run tests/domain/search.test.ts --reporter=verbose`

Expected: FAIL because `SearchMode` and `searchDates` do not exist.

- [ ] **Step 3: Implement mode-aware matching**

Add `export type SearchMode = "suitable" | "unsuitable"` and replace `searchSuitableDates` with:

```ts
export function searchDates(
  terms: string[],
  startDate: string,
  endDate: string,
  mode: SearchMode,
  readDay: (date: string) => AlmanacDay = getAlmanacDay,
): SuitableDateResult[]
```

For suitable mode require `suitable.includes(term) && !unsuitable.includes(term)`; for unsuitable mode require the inverse.

- [ ] **Step 4: Run the domain test and verify GREEN**

Run: `npx vitest run tests/domain/search.test.ts --reporter=verbose`

Expected: all domain search tests pass.

### Task 2: Mode-aware homepage and automatic recomputation

**Files:**
- Modify: `src/pages/home-page.tsx`
- Test: `tests/components/home-page.test.tsx`

- [ ] **Step 1: Write failing copy and recomputation tests**

Render `HomePage` with `searchMode="unsuitable"`, assert “最近哪天不宜？” / “不宜的日期” / “忌 入宅”, then rerender an already-searched page from suitable to unsuitable and assert the search callback is invoked again with the same terms, dates, and new mode.

- [ ] **Step 2: Run the homepage test and verify RED**

Run: `npx vitest run tests/components/home-page.test.tsx --reporter=verbose`

Expected: FAIL because `HomePage` does not accept or render a mode.

- [ ] **Step 3: Implement mode-derived UI and rerun behavior**

Add `searchMode: SearchMode` to props, pass it into every search callback, retain the last successfully resolved query, and use an effect keyed by `searchMode` to rerun that query. Derive titles, description, empty copy, and result prefix from mode without changing `TodaySummary`.

- [ ] **Step 4: Run the homepage test and verify GREEN**

Run: `npx vitest run tests/components/home-page.test.tsx --reporter=verbose`

Expected: all homepage tests pass.

### Task 3: Split brand controls and wire app state

**Files:**
- Modify: `src/app.tsx`
- Modify: `src/styles.css`
- Test: `tests/components/app.test.tsx`

- [ ] **Step 1: Write failing toggle and navigation tests**

Assert the default seal button is named “切换为忌日查询”, clicking it shows 忌 and the unsuitable heading, clicking again restores 宜, and opening a date then returning preserves the selected search mode.

- [ ] **Step 2: Run the app test and verify RED**

Run: `npx vitest run tests/components/app.test.tsx --reporter=verbose`

Expected: FAIL because the seal is not an independent toggle.

- [ ] **Step 3: Implement the topbar controls**

Hold `SearchMode` in `App`, pass it and `searchDates` to `HomePage`, render a `.mode-toggle` button containing the seal, and keep the brand text in a separate `.brand` return-home button. Add stable dimensions and focus/hover styles that fit the existing desktop and mobile topbar.

- [ ] **Step 4: Run the app test and verify GREEN**

Run: `npx vitest run tests/components/app.test.tsx --reporter=verbose`

Expected: all app tests pass.

### Task 4: Full verification

**Files:**
- Verify all modified source and test files.

- [ ] **Step 1: Run final automated checks**

Run: `npm run typecheck`

Run: `npm run test:run -- --reporter=dot`

Run: `npm run build`

Expected: all commands exit 0 with no failed tests.

- [ ] **Step 2: Verify in the local browser**

Reload `http://127.0.0.1:5173/`, query an item, toggle to 忌 and verify automatic result/copy changes, open and return from a date, toggle back to 宜, and inspect 375px width plus console errors.

Expected: both modes work, current mode survives detail navigation, no horizontal overflow occurs, and a clean page has no console errors.

> Note: commit steps are omitted because `D:\Desktop\hl` is not a Git repository.
