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
    expect(tauri.bundle.useLocalToolsDir).toBe(true);
    expect(tauri.bundle.windows.nsis.installMode).toBe("currentUser");
    expect(tauri.bundle.windows.webviewInstallMode.type).toBe("downloadBootstrapper");
  });

  it("keeps native web origins stable for local storage", () => {
    const capacitor = readJson("capacitor.config.json");

    expect(capacitor.server.androidScheme).toBe("https");
    expect(capacitor.android.allowMixedContent).toBe(false);
  });

  it("keeps signing secrets outside public release artifacts", () => {
    const ignore = readFileSync(resolve(root, ".gitignore"), "utf8");
    expect(ignore).toContain("release-private/");
  });

  it("declares no Android permissions for the offline-only app", () => {
    const manifest = readFileSync(resolve(root, "android/app/src/main/AndroidManifest.xml"), "utf8");
    expect(manifest).not.toContain("uses-permission");
  });

  it("requires the long-lived private key for Android release builds", () => {
    const gradle = readFileSync(resolve(root, "android/app/build.gradle"), "utf8");
    expect(gradle).toContain("release-private/android-signing.properties");
    expect(gradle).toContain("Missing release-private/android-signing.properties");
    expect(gradle).toContain("signingConfig signingConfigs.release");
  });

  it("uses reachable Android mirrors with official repositories as fallback", () => {
    const gradle = readFileSync(resolve(root, "android/build.gradle"), "utf8");
    expect(gradle).toContain("https://maven.aliyun.com/repository/google");
    expect(gradle).toContain("https://maven.aliyun.com/repository/public");
    expect(gradle).toContain("google()");
    expect(gradle).toContain("mavenCentral()");
  });
});
