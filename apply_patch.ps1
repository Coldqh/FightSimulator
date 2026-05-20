# Fight World HARD FIX 2.3.3
# Запускать из корня репозитория FightSimulator:
#   cd C:\FightSimulator_GitHub
#   PowerShell -ExecutionPolicy Bypass -File .\apply_patch.ps1

$ErrorActionPreference = "Stop"
$PatchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Version = "hard-version-fix-2.3.3"
$CacheVersion = "fight-simulator-hard-version-fix-2.3.3"

if (-not (Test-Path ".\index.html") -or -not (Test-Path ".\src\data\game-data.js")) {
  throw "Скрипт нужно запускать из корня репозитория FightSimulator."
}

Write-Host "== Fight World HARD FIX 2.3.3 ==" -ForegroundColor Cyan

# 1. Remove old runtime patch files that were overriding appVersion/UI.
New-Item -ItemType Directory -Force ".\src\patches" | Out-Null
$OldPatchFiles = @(
  ".\src\patches\tournament-ui-hotfix-2.3.0.js",
  ".\src\patches\tournament-ui-layout-2.3.1.js",
  ".\src\patches\tournament-ui-layout-2.3.2.js",
  ".\src\patches\update-button-fix-2.3.2.js"
)
foreach ($file in $OldPatchFiles) {
  Remove-Item -LiteralPath $file -Force -ErrorAction SilentlyContinue
}

Copy-Item -Force "$PatchRoot\src\patches\hard-fix-2.3.3.js" ".\src\patches\hard-fix-2.3.3.js"
Write-Host "src\patches очищен от старых 2.3.0/2.3.1/2.3.2 и добавлен hard-fix-2.3.3.js"

# 2. index.html: remove ALL patch scripts and add only hard-fix 2.3.3.
$IndexPath = ".\index.html"
$Index = Get-Content $IndexPath -Raw
$Index = [regex]::Replace($Index, '\r?\n\s*<script src="src/patches/[^"]+\.js(?:\?[^"]*)?"></script>', '')
$Needle = '  <script src="src/ui/render.js"></script>'
$PatchScript = '  <script src="src/patches/hard-fix-2.3.3.js?v=2.3.3"></script>'
if ($Index -notmatch [regex]::Escape($Needle)) {
  throw "Не нашёл строку подключения src/ui/render.js в index.html."
}
$Index = $Index.Replace($Needle, $Needle + "`r`n" + $PatchScript)
Set-Content -Path $IndexPath -Value $Index -Encoding UTF8
Write-Host "index.html теперь подключает только hard-fix-2.3.3"

# 3. Update real appVersion and saveSchemaVersion.
$DataPath = ".\src\data\game-data.js"
$Data = Get-Content $DataPath -Raw
$Data = [regex]::Replace($Data, 'appVersion:\s*"[^"]+"', 'appVersion: "hard-version-fix-2.3.3"')
$Data = [regex]::Replace($Data, 'saveSchemaVersion:\s*\d+', 'saveSchemaVersion: 233')
Set-Content -Path $DataPath -Value $Data -Encoding UTF8
Write-Host "src\data\game-data.js обновлён: appVersion=hard-version-fix-2.3.3, schema=233"

# 4. version.json
$VersionJson = @'
{
  "version": "hard-version-fix-2.3.3",
  "mode": "hard-version-fix"
}
'@
Set-Content -Path ".\version.json" -Value $VersionJson -Encoding UTF8
Write-Host "version.json обновлён"

# 5. sw.js: hard cache reset, remove all old patch precache lines, add only hard-fix.
$SwPath = ".\sw.js"
if (Test-Path $SwPath) {
  $Sw = Get-Content $SwPath -Raw
  $Sw = [regex]::Replace($Sw, 'const CACHE_VERSION = "fight-simulator-[^"]+";', 'const CACHE_VERSION = "fight-simulator-hard-version-fix-2.3.3";')
  $Sw = [regex]::Replace($Sw, '\r?\n\s*"\./src/patches/[^"]+\.js(?:\?[^"]*)?",', '')
  $PrecacheLine = '  "./src/patches/hard-fix-2.3.3.js",'
  $Sw = $Sw.Replace('  "./src/ui/render.js",', '  "./src/ui/render.js",' + "`r`n" + $PrecacheLine)
  Set-Content -Path $SwPath -Value $Sw -Encoding UTF8
  Write-Host "sw.js обновлён: CACHE_VERSION=fight-simulator-hard-version-fix-2.3.3"
}

# 6. GitHub Pages workflow
New-Item -ItemType Directory -Force ".\.github\workflows" | Out-Null
Copy-Item -Force "$PatchRoot\.github\workflows\pages.yml" ".\.github\workflows\pages.yml"
Copy-Item -Force "$PatchRoot\.nojekyll" ".\.nojekyll"
Write-Host "GitHub Pages workflow обновлён"

Write-Host ""
Write-Host "HARD FIX применён. Теперь запусти проверку:" -ForegroundColor Green
Write-Host "  cd C:\FightSimulator_GitHub"
Write-Host "  PowerShell -ExecutionPolicy Bypass -File .\verify_patch.ps1"
Write-Host ""
Write-Host "Локальный хост:"
Write-Host "  cd C:\FightSimulator_GitHub"
Write-Host "  PowerShell -ExecutionPolicy Bypass -File .\start_host.ps1"
