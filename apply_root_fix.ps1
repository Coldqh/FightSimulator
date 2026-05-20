# Fight World ROOT CACHE FIX 2.3.4
# Запускать из корня репозитория FightSimulator:
#   cd C:\FightSimulator_GitHub
#   PowerShell -ExecutionPolicy Bypass -File .\apply_root_fix.ps1

$ErrorActionPreference = "Stop"

$PatchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
$Version = "root-cache-fix-2.3.4"
$CacheVersion = "fight-simulator-root-cache-fix-2.3.4"

function Write-Step($Text) {
  Write-Host "== $Text ==" -ForegroundColor Cyan
}

if (-not (Test-Path ".\index.html") -or -not (Test-Path ".\src")) {
  throw "Скрипт нужно запускать из корня репозитория FightSimulator."
}

Write-Step "Fight World ROOT CACHE FIX 2.3.4"

# 1. Remove old runtime patch files.
Write-Step "Удаляю старые patch-файлы"
New-Item -ItemType Directory -Force ".\src\patches" | Out-Null

$OldPatchFiles = @(
  ".\src\patches\tournament-ui-hotfix-2.3.0.js",
  ".\src\patches\tournament-ui-layout-2.3.1.js",
  ".\src\patches\tournament-ui-layout-2.3.2.js",
  ".\src\patches\update-button-fix-2.3.2.js",
  ".\src\patches\hard-fix-2.3.3.js"
)

foreach ($file in $OldPatchFiles) {
  if (Test-Path $file) {
    Remove-Item -LiteralPath $file -Force
    Write-Host "removed $file"
  }
}

Copy-Item -Force "$PatchRoot\src\patches\root-cache-fix-2.3.4.js" ".\src\patches\root-cache-fix-2.3.4.js"

# 2. index.html: remove all patch scripts, add only root-cache-fix before app.js.
Write-Step "Правлю index.html"
$IndexPath = ".\index.html"
$Index = Get-Content $IndexPath -Raw

# Remove any old patch scripts.
$Index = [regex]::Replace($Index, '\r?\n\s*<script\s+src="src/patches/[^"]+\.js(?:\?[^"]*)?"></script>', '')

# Add no-store hints. Browser may ignore them for SW-controlled pages, but reset-cache.html handles the real kill.
if ($Index -notmatch 'http-equiv="Cache-Control"') {
  $Index = $Index -replace '(<meta charset="utf-8">\s*)', '$1' + "`r`n  <meta http-equiv=`"Cache-Control`" content=`"no-store, no-cache, must-revalidate, max-age=0`">`r`n  <meta http-equiv=`"Pragma`" content=`"no-cache`">`r`n  <meta http-equiv=`"Expires`" content=`"0`">"
}

$PatchScript = '  <script src="src/patches/root-cache-fix-2.3.4.js?v=2.3.4"></script>'
if ($Index -notmatch [regex]::Escape($PatchScript)) {
  if ($Index -match '<script src="src/app\.js"></script>') {
    $Index = [regex]::Replace($Index, '\s*<script src="src/app\.js"></script>', "`r`n$PatchScript`r`n  <script src=`"src/app.js`"></script>", 1)
  } else {
    throw "Не нашёл строку подключения src/app.js в index.html."
  }
}

Set-Content -Path $IndexPath -Value $Index -Encoding UTF8

# 3. game-data.js: real version, not only visual.
Write-Step "Правлю src\data\game-data.js"
$DataPath = ".\src\data\game-data.js"
if (-not (Test-Path $DataPath)) {
  throw "Не найден src\data\game-data.js"
}

$Data = Get-Content $DataPath -Raw

if ($Data -notmatch 'appVersion\s*:') {
  throw "В game-data.js не найдено поле appVersion. Это значит, что структура файла отличается от ожидаемой."
}
if ($Data -notmatch 'saveSchemaVersion\s*:') {
  throw "В game-data.js не найдено поле saveSchemaVersion. Это значит, что структура файла отличается от ожидаемой."
}

$Data = [regex]::Replace($Data, 'appVersion\s*:\s*"[^"]+"', 'appVersion: "root-cache-fix-2.3.4"', 1)
$Data = [regex]::Replace($Data, 'saveSchemaVersion\s*:\s*\d+', 'saveSchemaVersion: 234', 1)

Set-Content -Path $DataPath -Value $Data -Encoding UTF8

# 4. Replace service worker with network-first cleaner.
Write-Step "Ставлю новый sw.js"
Copy-Item -Force "$PatchRoot\sw.js" ".\sw.js"

# 5. Version/reset files.
Write-Step "Ставлю version.json и reset-cache.html"
Copy-Item -Force "$PatchRoot\version.json" ".\version.json"
Copy-Item -Force "$PatchRoot\reset-cache.html" ".\reset-cache.html"

# 6. Scripts and GitHub Pages.
Write-Step "Ставлю служебные скрипты"
Copy-Item -Force "$PatchRoot\verify_root_fix.ps1" ".\verify_root_fix.ps1"
Copy-Item -Force "$PatchRoot\start_clean_local.ps1" ".\start_clean_local.ps1"

New-Item -ItemType Directory -Force ".\.github\workflows" | Out-Null
Copy-Item -Force "$PatchRoot\.github\workflows\pages.yml" ".\.github\workflows\pages.yml"
Copy-Item -Force "$PatchRoot\.nojekyll" ".\.nojekyll"

Write-Host ""
Write-Host "ROOT FIX применён." -ForegroundColor Green
Write-Host ""
Write-Host "Теперь обязательно:"
Write-Host "  PowerShell -ExecutionPolicy Bypass -File .\verify_root_fix.ps1"
Write-Host "  PowerShell -ExecutionPolicy Bypass -File .\start_clean_local.ps1"
Write-Host ""
Write-Host "Если старый localhost:5173 уже был открыт, один раз открой:"
Write-Host "  http://localhost:5173/reset-cache.html"
Write-Host ""
Write-Host "Чистый локальный запуск будет на новом origin:"
Write-Host "  http://127.0.0.1:5184/reset-cache.html"
