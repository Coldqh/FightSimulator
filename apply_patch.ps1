# Fight World full patch + host setup 2.3.1
# Запускать из корня репозитория FightSimulator:
#   PowerShell -ExecutionPolicy Bypass -File .\apply_patch.ps1

$ErrorActionPreference = "Stop"

$PatchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Test-Path ".\index.html") -or -not (Test-Path ".\src\ui\render.js")) {
  throw "Скрипт нужно запускать из корня репозитория FightSimulator."
}

Write-Host "== Fight World patch 2.3.1 ==" -ForegroundColor Cyan

# 1. JS patch
New-Item -ItemType Directory -Force ".\src\patches" | Out-Null
Copy-Item -Force "$PatchRoot\src\patches\tournament-ui-layout-2.3.1.js" ".\src\patches\tournament-ui-layout-2.3.1.js"
Write-Host "JS-патч добавлен: src\patches\tournament-ui-layout-2.3.1.js"

# 2. index.html: remove previous hotfix includes and add 2.3.1 after render.js
$IndexPath = ".\index.html"
$Index = Get-Content $IndexPath -Raw
$Index = [regex]::Replace($Index, '\s*<script src="src/patches/tournament-ui-hotfix-2\.3\.0\.js"></script>', '')
$Index = [regex]::Replace($Index, '\s*<script src="src/patches/tournament-ui-layout-2\.3\.1\.js"></script>', '')

$Needle = '  <script src="src/ui/render.js"></script>'
$PatchScript = '  <script src="src/patches/tournament-ui-layout-2.3.1.js"></script>'
if ($Index -notmatch [regex]::Escape($Needle)) {
  throw "Не нашёл строку подключения src/ui/render.js в index.html."
}
$Index = $Index.Replace($Needle, $Needle + "`r`n" + $PatchScript)
Set-Content -Path $IndexPath -Value $Index -Encoding UTF8
Write-Host "index.html обновлён"

# 3. version.json
$VersionJson = @'
{
  "version": "tournament-ui-layout-2.3.1",
  "mode": "tournament-ui-layout"
}
'@
Set-Content -Path ".\version.json" -Value $VersionJson -Encoding UTF8
Write-Host "version.json обновлён"

# 4. sw.js cache version + precache new patch file
$SwPath = ".\sw.js"
if (Test-Path $SwPath) {
  $Sw = Get-Content $SwPath -Raw
  $Sw = [regex]::Replace($Sw, 'const CACHE_VERSION = "fight-simulator-[^"]+";', 'const CACHE_VERSION = "fight-simulator-tournament-ui-layout-2.3.1";')

  $Sw = [regex]::Replace($Sw, '\s*"\./src/patches/tournament-ui-hotfix-2\.3\.0\.js",', '')
  $Sw = [regex]::Replace($Sw, '\s*"\./src/patches/tournament-ui-layout-2\.3\.1\.js",', '')

  $PrecacheLine = '  "./src/patches/tournament-ui-layout-2.3.1.js",'
  if ($Sw -notmatch [regex]::Escape($PrecacheLine)) {
    $Sw = $Sw.Replace('  "./src/ui/render.js",', '  "./src/ui/render.js",' + "`r`n" + $PrecacheLine)
  }

  Set-Content -Path $SwPath -Value $Sw -Encoding UTF8
  Write-Host "sw.js обновлён"
}

# 5. GitHub Pages workflow
New-Item -ItemType Directory -Force ".\.github\workflows" | Out-Null
Copy-Item -Force "$PatchRoot\.github\workflows\pages.yml" ".\.github\workflows\pages.yml"
Copy-Item -Force "$PatchRoot\.nojekyll" ".\.nojekyll"
Write-Host "GitHub Pages workflow добавлен"

Write-Host ""
Write-Host "Готово. Локальная проверка:" -ForegroundColor Green
Write-Host "  PowerShell -ExecutionPolicy Bypass -File .\start_host.ps1"
Write-Host ""
Write-Host "Пуш:" -ForegroundColor Green
Write-Host "  git add ."
Write-Host "  git commit -m ""Fix compact rows news and tournament calendar 2.3.1"""
Write-Host "  git push"
Write-Host ""
Write-Host "Хост:"
Write-Host "  https://coldqh.github.io/FightSimulator/"
