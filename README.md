# 黄历速查 (Huangli Almanac)

> 快速查询每日宜忌和未来适宜日期 — Chinese almanac for daily auspicious guidance and future date planning.

## 功能

- 📅 查询每日黄历宜忌
- 🔍 查找未来适宜做某事的日期
- 🌙 农历日期显示
- 📱 支持 Web / Android / 桌面端

## 技术栈

Preact + TypeScript + Vite + Tauri + Capacitor + PWA

## 数据来源

本项目农历及黄历数据基于 **[lunar-javascript](https://github.com/6tail/lunar-javascript)**（作者：6tail），遵循其 MIT 协议。

## 开发

```bash
npm install
npm run dev          # Web 开发模式
npm run desktop:dev  # Tauri 桌面端
npm run android:sync # Android 同步
```

## 构建

```bash
npm run build        # Web 构建
npm run package:all  # 打包所有平台
```

## 协议

MIT License — 详见 [LICENSE](./LICENSE)
