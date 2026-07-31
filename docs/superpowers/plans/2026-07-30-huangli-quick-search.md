# 黄历宜忌速查工具 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个公开可用、电脑和手机均可安装、离线运行的黄历宜忌及未来适宜日期速查 PWA。

**Architecture:** 使用 Vite 构建 Preact 单页应用，所有黄历计算均通过锁定版本的 `lunar-javascript` 在本地完成。领域逻辑由黄历适配器、事项词典、严格日期搜索和时区服务组成，UI 只消费稳定的领域模型；`vite-plugin-pwa` 负责应用清单、预缓存和更新提示。

**Tech Stack:** TypeScript、Preact、Vite、`lunar-javascript@1.7.7`、Vitest、Testing Library、Playwright、`vite-plugin-pwa`

---

## 文件结构

- `package.json`：锁定命令、运行依赖和开发依赖。
- `vite.config.ts`：Vite、Preact、PWA 清单与缓存策略。
- `index.html`：最小应用壳和基础元信息。
- `src/domain/types.ts`：应用内部黄历、事项和搜索结果类型。
- `src/domain/almanac.ts`：封装 `lunar-javascript`，隔离第三方 API。
- `src/domain/activities.ts`：输入规范化、同义词和快捷事项。
- `src/domain/search.ts`：日期范围验证和严格宜忌判定。
- `src/domain/timezone.ts`：北京时间或设备时区下的“今天”。
- `src/state/preferences.ts`：本地时区偏好读写。
- `src/app.tsx`：路由状态、页面组合和更新提示。
- `src/pages/home-page.tsx`：搜索优先首页、结果和今日摘要。
- `src/pages/date-page.tsx`：日期详情及前后切换。
- `src/components/settings-dialog.tsx`：时区、数据源和民俗说明。
- `src/styles.css`：响应式设计与视觉状态。
- `src/main.tsx`：挂载应用和注册 PWA 更新入口。
- `public/icons/`：192、512 和 maskable PWA 图标。
- `tests/domain/*.test.ts`：领域逻辑和数据契约测试。
- `tests/components/*.test.tsx`：关键交互测试。
- `e2e/app.spec.ts`：桌面、手机、导航和离线端到端测试。

### Task 1: 建立最小 Preact/PWA 工程

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vite.config.ts`
- Create: `index.html`
- Create: `src/main.tsx`
- Create: `src/app.tsx`
- Create: `src/styles.css`
- Create: `src/vite-env.d.ts`

- [ ] **Step 1: 写入精确依赖和命令**

`package.json` 使用 `"lunar-javascript": "1.7.7"`，不得使用 `^` 或 `~`；脚本至少包含 `dev`、`build`、`test`、`test:run`、`test:e2e`、`typecheck`。

- [ ] **Step 2: 安装依赖并验证锁定版本**

Run: `npm install`

Run: `npm ls lunar-javascript`

Expected: 输出只包含 `lunar-javascript@1.7.7`，且无 invalid 或 unmet dependency。

- [ ] **Step 3: 创建最小应用壳**

`src/app.tsx` 初始只渲染语义化页面标题：

```tsx
export function App() {
  return <main><h1>黄历速查</h1></main>;
}
```

- [ ] **Step 4: 配置 PWA 基础清单**

在 `vite.config.ts` 中配置 `registerType: "prompt"`、名称“黄历速查”、`display: "standalone"`、`start_url: "/"`、主题色和 192/512/maskable 图标；Workbox 预缓存构建资源，不配置运行时网络 API。

- [ ] **Step 5: 验证工程基础**

Run: `npm run typecheck`

Expected: exit code 0。

Run: `npm run build`

Expected: 生成 `dist/manifest.webmanifest` 和 Service Worker，构建无警告。

### Task 2: 定义黄历领域模型和第三方库适配层

**Files:**
- Create: `src/domain/types.ts`
- Create: `src/domain/almanac.ts`
- Create: `tests/domain/almanac.test.ts`

- [ ] **Step 1: 写适配层失败测试**

固定使用 `2026-07-30`，断言返回对象包含：

```ts
expect(getAlmanacDay("2026-07-30")).toMatchObject({
  solarDate: "2026-07-30",
  weekday: expect.any(String),
  lunarDate: expect.any(String),
  suitable: expect.any(Array),
  unsuitable: expect.any(Array),
});
```

另断言宜忌数组已去空白、去重且不包含空字符串；无效日期 `2026-02-30` 抛出 `InvalidDateError`。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- tests/domain/almanac.test.ts`

Expected: FAIL，原因是 `getAlmanacDay` 尚未定义。

- [ ] **Step 3: 实现稳定领域接口**

在 `types.ts` 定义：

```ts
export interface AlmanacDay {
  solarDate: string;
  lunarDate: string;
  weekday: string;
  suitable: string[];
  unsuitable: string[];
}
```

`getAlmanacDay(isoDate)` 必须手工解析 ISO 年月日并用 `Solar.fromYmd` 创建对象，不使用浏览器 `Date` 解析指定日期；只从第三方对象提取上述字段并标准化数组。

- [ ] **Step 4: 增加版本契约测试**

为 2024 闰年日期、春节附近日期、2025 版本变更附近日期建立固定快照，快照只覆盖 `solarDate/lunarDate/weekday/suitable/unsuitable`，用于发现上游口径变化。

- [ ] **Step 5: 验证适配层**

Run: `npm run test:run -- tests/domain/almanac.test.ts`

Expected: PASS。

### Task 3: 实现事项词典和可解释映射

**Files:**
- Create: `src/domain/activities.ts`
- Create: `tests/domain/activities.test.ts`

- [ ] **Step 1: 写映射失败测试**

覆盖以下行为：

```ts
expect(resolveActivity("结婚")?.terms).toEqual(["嫁娶"]);
expect(resolveActivity(" 搬 家 ")?.terms).toEqual(["入宅", "移徙"]);
expect(resolveActivity("开业")?.terms).toEqual(["开市"]);
expect(resolveActivity("装修")?.terms).toEqual(["修造"]);
expect(resolveActivity("未知事项")).toBeNull();
```

同时断言常用快捷项顺序稳定，避免首页顺序随对象遍历变化。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- tests/domain/activities.test.ts`

Expected: FAIL，模块不存在。

- [ ] **Step 3: 实现词典**

导出 `resolveActivity(input)`、`suggestActivities(input)` 和 `QUICK_ACTIVITIES`。规范化只处理首尾/词内空白和常见同义词，不做模糊猜测；直接输入黄历术语时也应返回自身。

- [ ] **Step 4: 验证词典**

Run: `npm run test:run -- tests/domain/activities.test.ts`

Expected: PASS。

### Task 4: 实现严格日期搜索

**Files:**
- Create: `src/domain/search.ts`
- Create: `tests/domain/search.test.ts`

- [ ] **Step 1: 写严格判定失败测试**

将日期读取器作为参数注入，构造三天假数据并断言：

- “宜”包含且“忌”不包含目标术语时入选。
- “宜”“忌”同时包含时排除。
- 两边都未提及时排除。
- 多个目标术语中任一满足时入选并记录 `matchedTerms`。
- 结果按日期升序。

- [ ] **Step 2: 写范围校验失败测试**

断言结束日期早于开始日期、超过 366 天、ISO 日期无效时分别抛出可识别错误；起止日期均包含在遍历范围内。

- [ ] **Step 3: 运行测试确认失败**

Run: `npm run test:run -- tests/domain/search.test.ts`

Expected: FAIL，搜索函数尚未定义。

- [ ] **Step 4: 实现搜索服务**

导出：

```ts
export function searchSuitableDates(
  terms: string[],
  startDate: string,
  endDate: string,
  readDay?: (date: string) => AlmanacDay,
): SuitableDateResult[];
```

默认 `readDay` 为 `getAlmanacDay`；最大范围 366 天。日期递增使用明确的 UTC 年月日算法，防止设备夏令时造成漏天或重复。

- [ ] **Step 5: 验证搜索服务**

Run: `npm run test:run -- tests/domain/search.test.ts`

Expected: PASS。

### Task 5: 实现时区和本地偏好

**Files:**
- Create: `src/domain/timezone.ts`
- Create: `src/state/preferences.ts`
- Create: `tests/domain/timezone.test.ts`
- Create: `tests/domain/preferences.test.ts`

- [ ] **Step 1: 写北京时间边界失败测试**

注入时间 `2026-07-30T15:59:59Z` 和 `2026-07-30T16:00:00Z`，断言北京时间日期分别为 `2026-07-30` 和 `2026-07-31`。设备时区模式通过注入时区名验证，不依赖测试机本地设置。

- [ ] **Step 2: 写偏好读写失败测试**

断言无存储值或损坏值时默认 `beijing`；合法的 `device` 值可保存并读回；存储不可用时不抛异常。

- [ ] **Step 3: 运行测试确认失败**

Run: `npm run test:run -- tests/domain/timezone.test.ts tests/domain/preferences.test.ts`

Expected: FAIL，目标模块不存在。

- [ ] **Step 4: 实现时区和偏好**

使用 `Intl.DateTimeFormat(..., { timeZone, year, month, day })` 计算 ISO 日期。偏好键固定为 `huangli:timezone-mode:v1`，类型为 `"beijing" | "device"`。

- [ ] **Step 5: 验证时区模块**

Run: `npm run test:run -- tests/domain/timezone.test.ts tests/domain/preferences.test.ts`

Expected: PASS。

### Task 6: 构建搜索优先首页

**Files:**
- Create: `src/pages/home-page.tsx`
- Create: `src/components/activity-search.tsx`
- Create: `src/components/result-list.tsx`
- Create: `src/components/today-summary.tsx`
- Create: `tests/components/home-page.test.tsx`
- Modify: `src/app.tsx`

- [ ] **Step 1: 写首页交互失败测试**

使用注入的领域服务验证：首屏有“最近哪天适合？”搜索框、快捷事项和今日摘要；点击“搬家”后展示“匹配：入宅、移徙”、未来 90 天范围和严格结果；未知词显示建议；无结果显示固定空状态文案。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- tests/components/home-page.test.tsx`

Expected: FAIL，页面组件不存在。

- [ ] **Step 3: 实现搜索状态和默认范围**

默认开始日期为当前模式下的今天，结束日期为开始后 89 天，共 90 天。搜索提交后调用词典与搜索服务；日期输入使用原生 `input[type=date]`，并在 UI 层限制最大 366 天。

- [ ] **Step 4: 实现结果和状态**

结果项显示公历、星期、农历和命中术语。加载计算期间保持布局尺寸稳定；错误、未知词、无结果均使用 `role="status"` 或 `role="alert"`，不使用弹窗。

- [ ] **Step 5: 验证首页**

Run: `npm run test:run -- tests/components/home-page.test.tsx`

Expected: PASS。

### Task 7: 构建日期详情和轻量导航

**Files:**
- Create: `src/pages/date-page.tsx`
- Create: `tests/components/date-page.test.tsx`
- Modify: `src/app.tsx`

- [ ] **Step 1: 写日期详情失败测试**

断言详情显示公历、农历、星期、宜、忌；前一天/后一天按钮更新日期；返回按钮回到首页并保留刚才的搜索结果；无效 URL 日期回退首页并显示错误状态。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- tests/components/date-page.test.tsx`

Expected: FAIL，详情页面不存在。

- [ ] **Step 3: 实现 History API 导航**

使用 `/date/YYYY-MM-DD` 路径和 `history.pushState`，监听 `popstate`；不引入路由库。应用状态保留首页输入、范围和结果，浏览器刷新详情页时可仅凭路径重建详情。

- [ ] **Step 4: 实现详情页面**

宜、忌使用语义化列表；前后日期按钮使用图标并带可访问名称和 tooltip；保证空宜或空忌也有明确文案。

- [ ] **Step 5: 验证详情与导航**

Run: `npm run test:run -- tests/components/date-page.test.tsx`

Expected: PASS。

### Task 8: 设置、数据来源和更新提示

**Files:**
- Create: `src/components/settings-dialog.tsx`
- Create: `src/components/update-toast.tsx`
- Create: `tests/components/settings-dialog.test.tsx`
- Modify: `src/app.tsx`
- Modify: `src/main.tsx`

- [ ] **Step 1: 写设置失败测试**

断言默认选中北京时间；选择设备时区后保存偏好、关闭对话框并刷新今日日期；对话框显示 `lunar-javascript v1.7.7` 和“传统民俗信息，仅供参考”。

- [ ] **Step 2: 运行测试确认失败**

Run: `npm run test:run -- tests/components/settings-dialog.test.tsx`

Expected: FAIL，设置组件不存在。

- [ ] **Step 3: 实现设置对话框**

使用原生 `<dialog>` 或等价的可访问 modal；二选一设置使用 radio，关闭后焦点返回设置按钮。页面顶栏始终显示“北京时间”或“设备时区”。

- [ ] **Step 4: 接入 PWA 更新提示**

通过 `virtual:pwa-register/preact` 使用 prompt 更新模式；新版本准备好时显示非阻塞提示，用户主动点击才刷新；离线准备完成不显示打扰性通知。

- [ ] **Step 5: 验证设置**

Run: `npm run test:run -- tests/components/settings-dialog.test.tsx`

Expected: PASS。

### Task 9: 完成响应式视觉和 PWA 图标

**Files:**
- Modify: `src/styles.css`
- Create: `public/icons/icon-192.png`
- Create: `public/icons/icon-512.png`
- Create: `public/icons/icon-maskable-512.png`

- [ ] **Step 1: 建立视觉令牌和稳定布局**

采用中性纸白背景、墨色正文、绿色“宜”和朱红“忌”，避免整页单一色系。卡片圆角不超过 8px；搜索框、按钮、结果行和日期区使用固定最小高度，动态文案不得推动工具栏跳动。

- [ ] **Step 2: 完成手机和桌面布局**

手机单列，桌面将结果和今日摘要排为主次两栏；不使用随视口缩放字体。所有操作目标至少 44×44 CSS px，长事项词允许换行且不遮挡相邻内容。

- [ ] **Step 3: 生成并检查位图图标**

图标使用简洁的日历页与“宜”字视觉，在 192、512 和 maskable 安全区均可识别；PNG 文件真实尺寸必须与文件名一致。

- [ ] **Step 4: 构建并检查资源体积**

Run: `npm run build`

Expected: 构建成功；首屏 JS gzip 目标不超过 80 KB，首屏 CSS gzip 目标不超过 15 KB。如超出，先移除非必要依赖或拆分详情/设置代码。

### Task 10: 端到端、离线与性能验收

**Files:**
- Create: `playwright.config.ts`
- Create: `e2e/app.spec.ts`
- Modify: `package.json`

- [ ] **Step 1: 写关键流程端到端测试**

覆盖桌面和手机视口：打开首页、快捷搜索“搬家”、核对匹配术语、打开首个结果、切换日期、返回且结果仍存在、切换时区。

- [ ] **Step 2: 写离线测试**

首次在线加载并等待 Service Worker 控制页面，随后切换 context 为 offline 并重载；断言首页、今日宜忌和搜索仍可用。

- [ ] **Step 3: 运行全部自动化验证**

Run: `npm run typecheck`

Expected: PASS。

Run: `npm run test:run`

Expected: 所有单元和组件测试 PASS。

Run: `npm run build`

Expected: PASS 并生成可部署的 `dist/`。

Run: `npm run test:e2e`

Expected: 桌面、手机和离线流程全部 PASS。

- [ ] **Step 4: 浏览器视觉 QA**

在 390×844、768×1024、1440×900 三个视口截图检查：文字不溢出、按钮不重叠、日期行不跳动、详情宜忌清晰、设置可关闭。检查浏览器控制台无错误，清单图标和 Service Worker 请求成功。

- [ ] **Step 5: 性能验收并记录环境**

使用生产构建，在常见 4G 模拟下测量首次可交互目标不超过 2 秒；热缓存并离线重载目标不超过 0.5 秒。若本机或工具无法稳定模拟 4G，在交付说明中记录实测环境、结果和未能验证的目标，不虚报达标。

- [ ] **Step 6: 最终完整回归**

Run: `npm run typecheck && npm run test:run && npm run build && npm run test:e2e`

Expected: 所有命令 exit code 0，且无未处理的控制台错误。
