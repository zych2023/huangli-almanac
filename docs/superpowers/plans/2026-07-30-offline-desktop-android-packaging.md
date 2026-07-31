# 黄历速查 Windows 与安卓离线封装 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 生成无需公网服务即可安装和离线使用的 Windows x64 安装程序与安卓通用 APK。

**Architecture:** 现有 Preact/Vite 项目继续作为唯一业务代码来源。Tauri 2 在 Windows 上加载 `dist`，Capacitor 7 在安卓 WebView 中加载同一份 `dist`；两个壳使用固定应用标识，本地设置继续由现有 `localStorage` 代码管理。

**Tech Stack:** Preact 10、Vite 6、Tauri 2、Rust stable、Capacitor 7、JDK 21、Android SDK、PowerShell 7、Vitest 2

---

当前目录不是 Git 仓库，因此本计划不包含无法执行的 commit 步骤。每个任务以测试、构建或产物哈希作为可验证检查点。

## 文件结构

- Modify: `package.json` — 固定桌面、安卓依赖和构建命令。
- Modify: `package-lock.json` — 锁定实际安装的依赖版本。
- Create: `.gitignore` — 排除原生构建产物和安卓签名秘密。
- Create: `tests/packaging/config.test.ts` — 验证两端标识、资源目录、安装模式和权限约束。
- Create: `src-tauri/Cargo.toml` — Windows 壳 Rust 依赖。
- Create: `src-tauri/build.rs` — Tauri 构建入口。
- Create: `src-tauri/src/main.rs` — Windows 可执行入口。
- Create: `src-tauri/src/lib.rs` — Tauri 应用启动函数。
- Create: `src-tauri/tauri.conf.json` — Windows 窗口、安装器、WebView2 和应用标识配置。
- Create: `src-tauri/capabilities/default.json` — Tauri 最小权限集。
- Create: `src-tauri/icons/*` — 从现有 512 图标生成的 Windows 图标。
- Create: `capacitor.config.json` — 安卓包名、名称和 Web 资源目录。
- Create: `android/` — Capacitor 生成并纳入项目的安卓工程。
- Modify: `android/app/src/main/AndroidManifest.xml` — 移除不需要的网络及敏感权限。
- Modify: `android/app/build.gradle` — 从私有属性文件读取固定 release 签名。
- Create: `scripts/create-android-signing.ps1` — 一次性生成长期签名和本地恢复资料。
- Create: `scripts/build-packages.ps1` — 统一测试、构建、复制产物并生成 SHA-256。
- Create: `release/README-安装说明.md` — 面向家人的安装、升级和卸载说明。
- Generated: `release/huangli-windows-x64-0.1.0-setup.exe` — Windows 公开安装包。
- Generated: `release/huangli-android-0.1.0.apk` — 安卓公开安装包。
- Generated: `release/SHA256SUMS.txt` — 两个公开安装包的校验值。
- Generated private: `release-private/huangli-release.jks`、`release-private/android-signing.properties`、`release-private/SIGNING-RECOVERY.txt` — 不得公开的升级签名资料。

### Task 1: 建立基线与原生构建环境

**Files:**
- Read: `package.json`
- Read: `vite.config.ts`
- Read: `docs/superpowers/specs/2026-07-30-offline-desktop-android-packaging-design.md`

- [ ] **Step 1: 记录当前 Web 基线**

Run:

```powershell
npm run typecheck
npm run test:run -- --reporter=dot
npm run build
```

Expected: 类型检查通过，现有 41 个测试通过，`dist/manifest.webmanifest` 与 `dist/sw.js` 存在。

- [ ] **Step 2: 安装 Windows 构建依赖**

Run in an elevated Windows terminal after approval:

```powershell
winget install --id Rustlang.Rustup -e
winget install --id Microsoft.VisualStudio.2022.BuildTools -e --override "--wait --passive --add Microsoft.VisualStudio.Workload.VCTools --includeRecommended"
```

Expected: 新终端中 `rustc --version`、`cargo --version` 可用，MSVC C++ Build Tools 已安装。

- [ ] **Step 3: 安装安卓构建依赖**

Run after approval:

```powershell
winget install --id Microsoft.OpenJDK.21 -e
winget install --id Google.AndroidStudio -e
```

在 Android Studio 首次启动向导中安装 Android SDK Platform、Build-Tools、Platform-Tools 与 Command-line Tools，然后设置用户环境变量 `ANDROID_HOME` 为 `%LOCALAPPDATA%\Android\Sdk`。

Expected: 新终端中 `java -version` 显示 JDK 21，`adb version` 可用，`$env:ANDROID_HOME` 指向实际 SDK 目录。

- [ ] **Step 4: 复跑 Web 基线**

Run:

```powershell
npm run typecheck
npm run test:run -- --reporter=dot
```

Expected: 工具链安装没有改变 Web 行为，全部测试仍通过。

### Task 2: 用测试锁定封装契约

**Files:**
- Create: `tests/packaging/config.test.ts`
- Modify: `package.json`
- Modify: `package-lock.json`
- Create: `.gitignore`

- [ ] **Step 1: 写入失败的封装配置测试**

Create `tests/packaging/config.test.ts`:

```ts
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

const root = resolve(import.meta.dirname, "../..");
const readJson = (path: string) => JSON.parse(readFileSync(resolve(root, path), "utf8"));

describe("native packaging contract", () => {
  it("uses one stable identity and the current production build", () => {
    const tauri = readJson("src-tauri/tauri.conf.json");
    const capacitor = readJson("capacitor.config.json");
    expect(tauri.identifier).toBe("cn.huangli.quicksearch");
    expect(capacitor.appId).toBe("cn.huangli.quicksearch");
    expect(tauri.build.frontendDist).toBe("../dist");
    expect(capacitor.webDir).toBe("dist");
  });

  it("builds a current-user NSIS installer with explicit WebView2 recovery", () => {
    const tauri = readJson("src-tauri/tauri.conf.json");
    expect(tauri.bundle.targets).toEqual(["nsis"]);
    expect(tauri.bundle.windows.nsis.installMode).toBe("currentUser");
    expect(tauri.bundle.windows.webviewInstallMode.type).toBe("downloadBootstrapper");
  });

  it("keeps native web origins stable for local storage", () => {
    const capacitor = readJson("capacitor.config.json");
    expect(capacitor.server.androidScheme).toBe("https");
    expect(capacitor.android.allowMixedContent).toBe(false);
  });
});
```

- [ ] **Step 2: 确认测试因配置尚不存在而失败**

Run:

```powershell
npm run test:run -- tests/packaging/config.test.ts
```

Expected: FAIL，错误指出 `src-tauri/tauri.conf.json` 不存在。

- [ ] **Step 3: 安装并锁定封装依赖**

Run after network approval:

```powershell
npm install @tauri-apps/api@2 @capacitor/core@7 @capacitor/android@7
npm install --save-dev @tauri-apps/cli@2 @capacitor/cli@7
```

Add these scripts to `package.json`:

```json
"desktop:dev": "tauri dev",
"desktop:build": "tauri build",
"android:sync": "npm run build && cap sync android",
"android:build": "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-android.ps1",
"package:all": "powershell -NoProfile -ExecutionPolicy Bypass -File scripts/build-packages.ps1"
```

Expected: `package-lock.json` pins resolved versions and `npm ls @tauri-apps/cli @capacitor/cli` has no invalid dependency.

- [ ] **Step 4: 隔离生成文件和签名秘密**

Create `.gitignore`:

```gitignore
node_modules/
dist/
src-tauri/target/
android/.gradle/
android/build/
android/app/build/
release/*.exe
release/*.apk
release/SHA256SUMS.txt
release-private/
```

Expected: `release-private` 明确不会进入未来的版本控制或公开产物。

### Task 3: 实现轻量 Windows Tauri 壳

**Files:**
- Create: `src-tauri/Cargo.toml`
- Create: `src-tauri/build.rs`
- Create: `src-tauri/src/main.rs`
- Create: `src-tauri/src/lib.rs`
- Create: `src-tauri/tauri.conf.json`
- Create: `src-tauri/capabilities/default.json`
- Create: `src-tauri/icons/*`

- [ ] **Step 1: 创建最小 Rust 工程**

Create `src-tauri/Cargo.toml`:

```toml
[package]
name = "huangli-quick-search"
version = "0.1.0"
description = "黄历宜忌速查"
edition = "2021"

[lib]
name = "huangli_quick_search_lib"
crate-type = ["staticlib", "cdylib", "rlib"]

[build-dependencies]
tauri-build = { version = "2", features = [] }

[dependencies]
tauri = { version = "2", features = [] }
```

Create `src-tauri/build.rs`:

```rust
fn main() {
    tauri_build::build()
}
```

Create `src-tauri/src/lib.rs`:

```rust
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .run(tauri::generate_context!())
        .expect("failed to run Huangli Quick Search");
}
```

Create `src-tauri/src/main.rs`:

```rust
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    huangli_quick_search_lib::run();
}
```

- [ ] **Step 2: 配置窗口与用户级安装器**

Create `src-tauri/tauri.conf.json` with:

```json
{
  "$schema": "https://schema.tauri.app/config/2",
  "productName": "黄历速查",
  "version": "0.1.0",
  "identifier": "cn.huangli.quicksearch",
  "build": {
    "beforeDevCommand": "npm run dev",
    "devUrl": "http://localhost:5173",
    "beforeBuildCommand": "npm run build",
    "frontendDist": "../dist"
  },
  "app": {
    "windows": [{
      "title": "黄历速查",
      "width": 1180,
      "height": 800,
      "minWidth": 360,
      "minHeight": 640,
      "resizable": true
    }],
    "security": { "csp": null }
  },
  "bundle": {
    "active": true,
    "targets": ["nsis"],
    "icon": ["icons/icon.ico"],
    "windows": {
      "webviewInstallMode": { "type": "downloadBootstrapper", "silent": false },
      "nsis": { "installMode": "currentUser", "languages": ["SimpChinese"] }
    }
  }
}
```

Create `src-tauri/capabilities/default.json`:

```json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Base capability for the Huangli window",
  "windows": ["main"],
  "permissions": ["core:default"]
}
```

- [ ] **Step 3: 生成原生图标**

Run:

```powershell
npx tauri icon public/icons/icon-512.png
```

Expected: `src-tauri/icons/icon.ico` 存在且 Tauri 图标命令无错误。

- [ ] **Step 4: 让封装契约测试首次通过**

暂时创建 `capacitor.config.json`：

```json
{
  "appId": "cn.huangli.quicksearch",
  "appName": "黄历速查",
  "webDir": "dist",
  "server": { "androidScheme": "https" },
  "android": { "allowMixedContent": false }
}
```

Run:

```powershell
npm run test:run -- tests/packaging/config.test.ts
```

Expected: 3 tests PASS。

- [ ] **Step 5: 构建并启动 Windows 壳**

Run:

```powershell
npm run desktop:build
```

Expected: `src-tauri/target/release/bundle/nsis/` 下生成 `.exe`，构建日志没有 Rust 或 Tauri 错误。

### Task 4: 实现安卓 Capacitor 壳与最小权限

**Files:**
- Create: `capacitor.config.json`
- Create: `android/`
- Modify: `android/app/src/main/AndroidManifest.xml`
- Modify: `android/app/build.gradle`
- Create: `scripts/build-android.ps1`

- [ ] **Step 1: 生成安卓工程并同步最新 Web 资源**

Run:

```powershell
npm run build
npx cap add android
npx cap sync android
```

Expected: `android/gradlew.bat`、`android/app/src/main/AndroidManifest.xml` 与 `android/app/src/main/assets/public/index.html` 存在。

- [ ] **Step 2: 移除不需要的联网权限**

From `android/app/src/main/AndroidManifest.xml`, remove:

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

Do not add location, contacts, camera, microphone, storage, notification, phone, SMS or Bluetooth permissions.

Run:

```powershell
rg -n "uses-permission" android/app/src/main/AndroidManifest.xml
```

Expected: no matches。若本地资源无法在实体机加载，恢复仅 `INTERNET` 这一普通权限并记录原因；不得增加敏感权限。

- [ ] **Step 3: 添加固定 release 签名读取逻辑**

Add before the `android` block in `android/app/build.gradle`:

```groovy
def signingPropertiesFile = rootProject.file('../release-private/android-signing.properties')
def signingProperties = new Properties()
if (signingPropertiesFile.exists()) {
    signingPropertiesFile.withInputStream { signingProperties.load(it) }
}
```

Inside `android {}` add:

```groovy
signingConfigs {
    release {
        if (!signingProperties.isEmpty()) {
            storeFile rootProject.file("../release-private/${signingProperties['storeFile']}")
            storePassword signingProperties['storePassword']
            keyAlias signingProperties['keyAlias']
            keyPassword signingProperties['keyPassword']
        }
    }
}
```

Inside the existing `buildTypes.release` add:

```groovy
if (!signingPropertiesFile.exists()) {
    throw new GradleException('Missing release-private/android-signing.properties')
}
signingConfig signingConfigs.release
```

- [ ] **Step 4: 创建可重复的安卓构建脚本**

Create `scripts/build-android.ps1`:

```powershell
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot

Push-Location $projectRoot
try {
    npm run build
    npx cap sync android
    Push-Location (Join-Path $projectRoot 'android')
    try {
        .\gradlew.bat assembleRelease
    } finally {
        Pop-Location
    }
} finally {
    Pop-Location
}
```

- [ ] **Step 5: 确认缺少签名时构建会明确失败**

Run before creating signing materials:

```powershell
npm run android:build
```

Expected: FAIL with `Missing release-private/android-signing.properties`，而不是生成未签名交付包。

### Task 5: 生成并保护安卓长期签名

**Files:**
- Create: `scripts/create-android-signing.ps1`
- Generate private: `release-private/huangli-release.jks`
- Generate private: `release-private/android-signing.properties`
- Generate private: `release-private/SIGNING-RECOVERY.txt`

- [ ] **Step 1: 编写一次性签名生成脚本**

Create `scripts/create-android-signing.ps1`:

```powershell
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$privateDir = Join-Path $projectRoot 'release-private'
$keystorePath = Join-Path $privateDir 'huangli-release.jks'
$propertiesPath = Join-Path $privateDir 'android-signing.properties'
$recoveryPath = Join-Path $privateDir 'SIGNING-RECOVERY.txt'

if (Test-Path $keystorePath) {
    throw "Signing key already exists: $keystorePath"
}

New-Item -ItemType Directory -Force -Path $privateDir | Out-Null
$bytes = [byte[]]::new(24)
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
$password = [Convert]::ToBase64String($bytes).Replace('+', 'A').Replace('/', 'B').TrimEnd('=')

& keytool -genkeypair -v `
    -keystore $keystorePath `
    -alias huangli `
    -keyalg RSA `
    -keysize 2048 `
    -validity 10000 `
    -storepass $password `
    -keypass $password `
    -dname 'CN=Huangli Quick Search, OU=Family, O=Local, L=Shanghai, ST=Shanghai, C=CN'
if ($LASTEXITCODE -ne 0) { throw 'keytool failed' }

@(
    'storeFile=huangli-release.jks'
    "storePassword=$password"
    'keyAlias=huangli'
    "keyPassword=$password"
) | Set-Content -Encoding utf8 $propertiesPath

@(
    '黄历速查安卓升级签名恢复资料'
    '请离线备份整个 release-private 文件夹。不要发送给安装用户。'
    '签名别名: huangli'
    "签名密码: $password"
) | Set-Content -Encoding utf8 $recoveryPath
```

- [ ] **Step 2: 生成一次签名并验证证书**

Run exactly once:

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File scripts/create-android-signing.ps1
keytool -list -keystore release-private/huangli-release.jks -alias huangli
```

When `keytool -list` prompts, use the password stored in `release-private/SIGNING-RECOVERY.txt`。

Expected: 三个私有文件存在，证书别名为 `huangli`，有效期约 10000 天。

- [ ] **Step 3: 构建已签名 APK**

Run:

```powershell
npm run android:build
```

Expected: `android/app/build/outputs/apk/release/app-release.apk` exists and Gradle reports `BUILD SUCCESSFUL`。

- [ ] **Step 4: 验证 APK 签名和权限**

Run with the Android SDK build-tools directory on PATH:

```powershell
apksigner verify --verbose --print-certs android/app/build/outputs/apk/release/app-release.apk
aapt dump permissions android/app/build/outputs/apk/release/app-release.apk
```

Expected: signature verification succeeds；权限输出不含位置、通讯录、相机、麦克风、存储、通知、电话、短信或蓝牙权限。

### Task 6: 统一产物与安装说明

**Files:**
- Create: `scripts/build-packages.ps1`
- Create: `release/README-安装说明.md`
- Generate: `release/*.exe`
- Generate: `release/*.apk`
- Generate: `release/SHA256SUMS.txt`

- [ ] **Step 1: 编写双端产物脚本**

Create `scripts/build-packages.ps1`:

```powershell
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseDir = Join-Path $projectRoot 'release'

Push-Location $projectRoot
try {
    npm run typecheck
    npm run test:run -- --reporter=dot
    npm run desktop:build
    npm run android:build

    New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
    $windowsSource = Get-ChildItem 'src-tauri/target/release/bundle/nsis' -Filter '*.exe' |
        Sort-Object LastWriteTime -Descending |
        Select-Object -First 1
    if (-not $windowsSource) { throw 'Windows installer not found' }

    $apkSource = Get-Item 'android/app/build/outputs/apk/release/app-release.apk'
    $windowsTarget = Join-Path $releaseDir 'huangli-windows-x64-0.1.0-setup.exe'
    $androidTarget = Join-Path $releaseDir 'huangli-android-0.1.0.apk'
    Copy-Item -Force $windowsSource.FullName $windowsTarget
    Copy-Item -Force $apkSource.FullName $androidTarget

    Get-FileHash -Algorithm SHA256 $windowsTarget, $androidTarget |
        ForEach-Object { "{0}  {1}" -f $_.Hash.ToLowerInvariant(), (Split-Path -Leaf $_.Path) } |
        Set-Content -Encoding ascii (Join-Path $releaseDir 'SHA256SUMS.txt')
} finally {
    Pop-Location
}
```

- [ ] **Step 2: 写入面向最终用户的安装说明**

Create `release/README-安装说明.md` with these exact sections and facts:

```markdown
# 黄历速查安装说明

## Windows 10/11 64 位

运行 `huangli-windows-x64-0.1.0-setup.exe`，按提示完成安装。应用安装到当前用户，不需要管理员权限。若系统提示缺少 WebView2，请按安装程序提示安装后重新运行。

## 安卓手机

把 `huangli-android-0.1.0.apk` 传到手机，打开文件，并仅对当前文件管理器临时允许“安装未知应用”。安装完成后可关闭该权限。

## 离线与升级

两端安装后均可断网查询。以后收到相同来源的新版安装包时直接覆盖安装，本地快捷入口和时区设置会保留。不要先卸载旧版；卸载可能清除本地设置。

## 文件校验

`SHA256SUMS.txt` 记录安装包校验值。安卓升级签名只由制作者保存，不随 APK 分发。
```

- [ ] **Step 3: 生成公开产物与校验值**

Run:

```powershell
npm run package:all
Get-ChildItem release | Select-Object Name, Length
Get-Content release/SHA256SUMS.txt
```

Expected: Windows `.exe`、Android `.apk`、说明文档和 SHA-256 文件全部存在；不包含 `.jks` 或密码文件。

### Task 7: 双端离线与升级验收

**Files:**
- Read: `release/README-安装说明.md`
- Read: `release/SHA256SUMS.txt`

- [ ] **Step 1: Windows 安装与离线冷启动**

断开网络，运行 Windows 安装程序并启动应用。依次验证今日宜忌、日期详情、前后日期、理发搜索、宜/忌切换和五个快捷入口设置。

Expected: 没有空白窗口；所有操作均可用；任务管理器中没有依赖本地 Vite/Node 进程。

- [ ] **Step 2: Windows 覆盖升级数据保留**

将一个快捷入口改为非默认事项，关闭应用，再次运行同版本安装程序并启动。

Expected: 安装成功，修改后的快捷入口仍存在。

- [ ] **Step 3: 实体安卓手机离线安装与查询**

将 APK 传到安卓手机，临时允许未知来源并安装。首次打开后启用飞行模式，依次验证与 Windows 相同的核心流程。

Expected: 首次及后续启动均不需要网络；没有权限申请弹窗；查询结果与网页基线一致。

- [ ] **Step 4: 安卓覆盖升级数据保留**

修改一个快捷入口，关闭应用，重新安装同一签名的 APK，不卸载旧版。

Expected: Android 允许覆盖安装，修改后的快捷入口仍存在。

- [ ] **Step 5: 最终自动验证与体积记录**

Run:

```powershell
npm run typecheck
npm run test:run -- --reporter=dot
npm run build
Get-FileHash -Algorithm SHA256 release/huangli-windows-x64-0.1.0-setup.exe, release/huangli-android-0.1.0.apk
Get-Item release/huangli-windows-x64-0.1.0-setup.exe, release/huangli-android-0.1.0.apk | Select-Object Name, Length
```

Expected: 类型检查、全部测试和 Web 构建通过；哈希与 `release/SHA256SUMS.txt` 一致；实际大小记录在交付报告中。
