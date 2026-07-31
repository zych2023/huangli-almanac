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
$rng = [Security.Cryptography.RNGCryptoServiceProvider]::Create(); try { $rng.GetBytes($bytes) } finally { $rng.Dispose() }
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
) | Set-Content -Encoding ascii $propertiesPath

@(
    'Huangli Quick Search Android signing recovery'
    'Backup the whole release-private folder offline. Never send it to installers.'
    'Alias: huangli'
    "Password: $password"
) | Set-Content -Encoding ascii $recoveryPath

Write-Host "Signing key created at $keystorePath"
Write-Host "Recovery notes at $recoveryPath"

