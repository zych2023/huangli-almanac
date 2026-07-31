$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path -Parent $PSScriptRoot
$env:JAVA_HOME = 'C:\Program Files\Microsoft\jdk-21.0.11.10-hotspot'
$env:ANDROID_HOME = Join-Path $projectRoot 'android-sdk-local'
$cachedGradle = Join-Path $env:USERPROFILE '.gradle\wrapper\dists\gradle-8.11.1-all\2qik7nd48slq1ooc2496ixf4i\gradle-8.11.1\bin\gradle.bat'
$gradle = if (Test-Path $cachedGradle) { $cachedGradle } else { Join-Path $projectRoot 'android\gradlew.bat' }
$projectCache = Join-Path $projectRoot '.gradle-project-local'

Push-Location $projectRoot
try {
    npm run build
    npx cap sync android
    Push-Location (Join-Path $projectRoot 'android')
    try {
        & $gradle --project-cache-dir $projectCache assembleRelease
        if ($LASTEXITCODE -ne 0) { throw "Gradle failed with exit code $LASTEXITCODE" }
    } finally {
        Pop-Location
    }
} finally {
    Pop-Location
}
