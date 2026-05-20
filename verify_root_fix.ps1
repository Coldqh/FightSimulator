# Verify Fight World ROOT CACHE FIX 2.3.4
# Запускать из корня репозитория:
#   cd C:\FightSimulator_GitHub
#   PowerShell -ExecutionPolicy Bypass -File .\verify_root_fix.ps1

$ErrorActionPreference = "Stop"
$Bad = $false

function Fail($Message) {
  Write-Host "FAIL: $Message" -ForegroundColor Red
  $script:Bad = $true
}

function Ok($Message) {
  Write-Host "OK: $Message" -ForegroundColor Green
}

function ReadRaw($Path) {
  if (-not (Test-Path $Path)) {
    Fail "нет файла $Path"
    return ""
  }
  return Get-Content $Path -Raw
}

$Index = ReadRaw ".\index.html"
$Data = ReadRaw ".\src\data\game-data.js"
$Sw = ReadRaw ".\sw.js"
$VersionJson = ReadRaw ".\version.json"

if (-not (Test-Path ".\src\patches\root-cache-fix-2.3.4.js")) { Fail "нет src\patches\root-cache-fix-2.3.4.js" } else { Ok "root-cache-fix-2.3.4.js есть" }
if (-not (Test-Path ".\reset-cache.html")) { Fail "нет reset-cache.html" } else { Ok "reset-cache.html есть" }

if ($Index -notmatch 'src/patches/root-cache-fix-2\.3\.4\.js') { Fail "index.html не подключает root-cache-fix-2.3.4.js" } else { Ok "index.html подключает root-cache-fix-2.3.4.js" }
if ($Index -match 'tournament-ui-hotfix-2\.3\.0|tournament-ui-layout-2\.3\.1|tournament-ui-layout-2\.3\.2|update-button-fix-2\.3\.2|hard-fix-2\.3\.3') { Fail "index.html содержит старый patch script" } else { Ok "index.html без старых patch scripts" }

if ($Data -notmatch 'appVersion\s*:\s*"root-cache-fix-2\.3\.4"') { Fail "game-data.js appVersion не root-cache-fix-2.3.4" } else { Ok "game-data.js appVersion = root-cache-fix-2.3.4" }
if ($Data -notmatch 'saveSchemaVersion\s*:\s*234') { Fail "game-data.js saveSchemaVersion не 234" } else { Ok "game-data.js schema = 234" }

if ($VersionJson -notmatch 'root-cache-fix-2\.3\.4') { Fail "version.json не root-cache-fix-2.3.4" } else { Ok "version.json = root-cache-fix-2.3.4" }

if ($Sw -notmatch 'fight-simulator-root-cache-fix-2\.3\.4') { Fail "sw.js CACHE_VERSION не root-cache-fix-2.3.4" } else { Ok "sw.js CACHE_VERSION = root-cache-fix-2.3.4" }
if ($Sw -notmatch 'root-cache-fix-2\.3\.4\.js') { Fail "sw.js не precache root-cache-fix-2.3.4.js" } else { Ok "sw.js precache root-cache-fix-2.3.4.js" }
if ($Sw -match 'fight-simulator-fatigue-mobile-layout-2\.2\.9') { Fail "sw.js содержит старый cache version" } else { Ok "sw.js без старого cache version" }

$OldFiles = @(
  ".\src\patches\tournament-ui-hotfix-2.3.0.js",
  ".\src\patches\tournament-ui-layout-2.3.1.js",
  ".\src\patches\tournament-ui-layout-2.3.2.js",
  ".\src\patches\update-button-fix-2.3.2.js",
  ".\src\patches\hard-fix-2.3.3.js"
)
foreach ($file in $OldFiles) {
  if (Test-Path $file) { Fail "старый файл всё ещё существует: $file" }
}
if (-not $Bad) { Ok "старых patch-файлов нет" }

# Strict source scan. Do not scan README/scripts, because they intentionally mention old names in checks.
$StrictFiles = @(
  ".\index.html",
  ".\sw.js",
  ".\version.json",
  ".\src\data\game-data.js"
)
$PatchFiles = Get-ChildItem ".\src\patches" -Filter "*.js" -ErrorAction SilentlyContinue | Select-Object -ExpandProperty FullName
$StrictFiles = $StrictFiles + $PatchFiles

foreach ($file in $StrictFiles) {
  if (-not (Test-Path $file)) { continue }
  $text = Get-Content $file -Raw
  if ($text -match 'tournament-ui-hotfix-2\.3\.0|tournament-ui-layout-2\.3\.1|tournament-ui-layout-2\.3\.2|update-button-fix-2\.3\.2|hard-fix-2\.3\.3|fight-simulator-fatigue-mobile-layout-2\.2\.9') {
    Fail "операционный файл содержит старые хвосты: $file"
  }
}

if ($Bad) {
  throw "Проверка провалена. Старый 2.3.x/SW/cache хвост ещё остался."
}

Write-Host ""
Write-Host "ПРОВЕРКА ПРОЙДЕНА: исходники очищены, локально должна идти root-cache-fix-2.3.4" -ForegroundColor Cyan
Write-Host "Для чистого запуска используй:"
Write-Host "  PowerShell -ExecutionPolicy Bypass -File .\start_clean_local.ps1"
