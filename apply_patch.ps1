# Fight World update button fix + host setup 2.3.2
# Запускать из корня репозитория FightSimulator:
#   PowerShell -ExecutionPolicy Bypass -File .\apply_patch.ps1

$ErrorActionPreference = "Stop"
$PatchRoot = Split-Path -Parent $MyInvocation.MyCommand.Path

if (-not (Test-Path ".\index.html") -or -not (Test-Path ".\src\data\game-data.js")) {
  throw "Скрипт нужно запускать из корня репозитория FightSimulator."
}

Write-Host "== Fight World patch 2.3.2 ==" -ForegroundColor Cyan

# 1. Copy patch scripts
New-Item -ItemType Directory -Force ".\src\patches" | Out-Null
Copy-Item -Force "$PatchRoot\src\patches\tournament-ui-layout-2.3.2.js" ".\src\patches\tournament-ui-layout-2.3.2.js"
Copy-Item -Force "$PatchRoot\src\patches\update-button-fix-2.3.2.js" ".\src\patches\update-button-fix-2.3.2.js"
Write-Host "JS-патчи добавлены"

# 2. Update real app version in game-data.js so version.json compare works correctly
$DataPath = ".\src\data\game-data.js"
$Data = Get-Content $DataPath -Raw
$Data = [regex]::Replace($Data, 'appVersion:\s*"[^"]+"', 'appVersion: "update-button-fix-2.3.2"')
Set-Content -Path $DataPath -Value $Data -Encoding UTF8
Write-Host "src\data\game-data.js: appVersion обновлён"

# 3. index.html: remove old patch scripts and add 2.3.2 scripts
$IndexPath = ".\index.html"
$Index = Get-Content $IndexPath -Raw
$Index = [regex]::Replace($Index, '\s*<script src="src/patches/tournament-ui-hotfix-2\.3\.0\.js"></script>', '')
$Index = [regex]::Replace($Index, '\s*<script src="src/patches/tournament-ui-layout-2\.3\.1\.js"></script>', '')
$Index = [regex]::Replace($Index, '\s*<script src="src/patches/tournament-ui-layout-2\.3\.2\.js"></script>', '')
$Index = [regex]::Replace($Index, '\s*<script src="src/patches/update-button-fix-2\.3\.2\.js"></script>', '')

$Needle = '  <script src="src/ui/render.js"></script>'
$PatchScripts = '  <script src="src/patches/tournament-ui-layout-2.3.2.js"></script>' + "`r`n" + '  <script src="src/patches/update-button-fix-2.3.2.js"></script>'
if ($Index -notmatch [regex]::Escape($Needle)) {
  throw "Не нашёл строку подключения src/ui/render.js в index.html."
}
$Index = $Index.Replace($Needle, $Needle + "`r`n" + $PatchScripts)
Set-Content -Path $IndexPath -Value $Index -Encoding UTF8
Write-Host "index.html обновлён"

# 4. version.json
$VersionJson = @'
{
  "version": "update-button-fix-2.3.2",
  "mode": "update-button-fix"
}
'@
Set-Content -Path ".\version.json" -Value $VersionJson -Encoding UTF8
Write-Host "version.json обновлён"

# 5. sw.js: cache version + precache patch files
$SwPath = ".\sw.js"
if (Test-Path $SwPath) {
  $Sw = Get-Content $SwPath -Raw
  $Sw = [regex]::Replace($Sw, 'const CACHE_VERSION = "fight-simulator-[^"]+";', 'const CACHE_VERSION = "fight-simulator-update-button-fix-2.3.2";')

  $Sw = [regex]::Replace($Sw, '\s*"\./src/patches/tournament-ui-hotfix-2\.3\.0\.js",', '')
  $Sw = [regex]::Replace($Sw, '\s*"\./src/patches/tournament-ui-layout-2\.3\.1\.js",', '')
  $Sw = [regex]::Replace($Sw, '\s*"\./src/patches/tournament-ui-layout-2\.3\.2\.js",', '')
  $Sw = [regex]::Replace($Sw, '\s*"\./src/patches/update-button-fix-2\.3\.2\.js",', '')

  $PrecacheLines = '  "./src/patches/tournament-ui-layout-2.3.2.js",' + "`r`n" + '  "./src/patches/update-button-fix-2.3.2.js",'
  $Sw = $Sw.Replace('  "./src/ui/render.js",', '  "./src/ui/render.js",' + "`r`n" + $PrecacheLines)

  Set-Content -Path $SwPath -Value $Sw -Encoding UTF8
  Write-Host "sw.js обновлён"
}

# 6. GitHub Pages workflow
New-Item -ItemType Directory -Force ".\.github\workflows" | Out-Null
Copy-Item -Force "$PatchRoot\.github\workflows\pages.yml" ".\.github\workflows\pages.yml"
Copy-Item -Force "$PatchRoot\.nojekyll" ".\.nojekyll"
Write-Host "GitHub Pages workflow обновлён"

Write-Host ""
Write-Host "Готово. Локальная проверка:" -ForegroundColor Green
Write-Host "  PowerShell -ExecutionPolicy Bypass -File .\start_host.ps1"
Write-Host ""
Write-Host "Пуш:" -ForegroundColor Green
Write-Host "  git add ."
Write-Host "  git commit -m ""Fix visible update button and compact tournament UI 2.3.2"""
Write-Host "  git push origin main"
Write-Host ""
Write-Host "Если старая PWA всё ещё не увидит обновление, один раз открой:"
Write-Host "  https://coldqh.github.io/FightSimulator/?v=2.3.2"
