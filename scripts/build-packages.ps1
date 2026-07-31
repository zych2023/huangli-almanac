$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$releaseDir = Join-Path $projectRoot 'release'
New-Item -ItemType Directory -Force -Path $releaseDir | Out-Null
$nsisDir = Join-Path $projectRoot 'src-tauri\target\release\bundle\nsis'
$exe = Get-ChildItem -LiteralPath $nsisDir -Filter '*x64-setup.exe' | Select-Object -First 1
if (-not $exe) { throw "Windows installer not found under $nsisDir" }
$apk = Join-Path $projectRoot 'android\app\build\outputs\apk\release\app-release.apk'
if (-not (Test-Path -LiteralPath $apk)) { throw "APK not found: $apk" }
$exeOut = Join-Path $releaseDir 'huangli-windows-x64-0.1.0-setup.exe'
$apkOut = Join-Path $releaseDir 'huangli-android-0.1.0.apk'
Copy-Item -LiteralPath $exe.FullName -Destination $exeOut -Force
Copy-Item -LiteralPath $apk -Destination $apkOut -Force
$exeHash = (Get-FileHash -LiteralPath $exeOut -Algorithm SHA256).Hash.ToLower()
$apkHash = (Get-FileHash -LiteralPath $apkOut -Algorithm SHA256).Hash.ToLower()
@(
    "$exeHash  huangli-windows-x64-0.1.0-setup.exe"
    "$apkHash  huangli-android-0.1.0.apk"
) | Set-Content -Encoding ascii (Join-Path $releaseDir 'SHA256SUMS.txt')
Write-Host "OK: packages written to $releaseDir"
