# 黄历速查 0.1.0 安装说明

本包完全离线：安装后不联网也能正常查询黄历宜忌。只给您和家人使用。

## 文件清单

- huangli-windows-x64-0.1.0-setup.exe — Windows 10/11 64 位安装包（约 1.9 MB）
- huangli-android-0.1.0.apk — 安卓 7.0 及以上安装包（约 3.1 MB）
- SHA256SUMS.txt — 两个文件的 SHA-256 校验值

## Windows 安装

1. 双击 huangli-windows-x64-0.1.0-setup.exe。
2. 按提示选择“仅为当前用户安装”，安装完成后桌面上会出现“黄历速查”快捷方式。
3. 首次启动如提示安装 WebView2（微软官方运行时），按提示继续即可；之后完全离线可用。
4. 升级：直接双击新版安装包覆盖安装，设置数据不会丢失。

## 安卓安装

1. 把 huangli-android-0.1.0.apk 传到手机（微信/QQ 发送后下载，或数据线拷贝）。
2. 点击安装。首次会提示“未知来源/允许安装未知应用”，选择允许（只信任从家人处收到的安装包）。
3. 打开“黄历速查”，无需联网，可加入桌面快捷方式，像普通 App 一样使用。
4. 升级：直接覆盖安装新版 APK 即可，无需卸载，数据不会丢失。

## 校验文件（可选）

Windows PowerShell 里运行：

Get-FileHash .\huangli-windows-x64-0.1.0-setup.exe -Algorithm SHA256
Get-FileHash .\huangli-android-0.1.0.apk -Algorithm SHA256

与 SHA256SUMS.txt 中的值一致即文件完整。

## 开发者注意事项（不要发给安装用户）

- release-private 文件夹保存安卓签名密钥，升级 APK 必须继续使用同一签名，请离线备份，不要外传。
- 重新打包：npm run package:all（Windows 与安卓均需本地工具链）。
