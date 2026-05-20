# Verify Fight World HARD FIX 2.3.3
# Запускать из корня репозитория:
#   cd C:\FightSimulator_GitHub
#   PowerShell -ExecutionPolicy Bypass -File .\verify_patch.ps1

$ErrorActionPreference = "Stop"
$Bad = $false

function Fail($Message) {
  Write-Host "FAIL: $Message" -ForegroundColor Red
  $script:Bad = $true
}

function Ok($Message) {
  Write-Host "OK: $Message" -ForegroundColor Green
}

if (-not (Test-Path ".\src\patches\hard-fix-2.3.3.js")) { Fail "нет src\patches\hard-fix-2.3.3.js" } else { Ok "hard-fix-2.3.3.js есть" }

$Index = Get-Content ".\index.html" -Raw
if ($Index -notmatch 'hard-fix-2\.3\.3\.js') { Fail "index.html не подключает hard-fix-2.3.3.js" } else { Ok "index.html подключает hard-fix-2.3.3.js" }
if ($Index -match 'tournament-ui-hotfix-2\.3\.0|tournament-ui-layout-2\.3\.1|tournament-ui-layout-2\.3\.2|update-button-fix-2\.3\.2') { Fail "index.html всё ещё содержит старый 2.3.x patch script" } else { Ok "index.html очищен от старых patch scripts" }

$Data = Get-Content ".\src\data\game-data.js" -Raw
if ($Data -notmatch 'appVersion:\s*"hard-version-fix-2\.3\.3"') { Fail "game-data.js не содержит appVersion hard-version-fix-2.3.3" } else { Ok "game-data.js appVersion = hard-version-fix-2.3.3" }
if ($Data -notmatch 'saveSchemaVersion:\s*233') { Fail "game-data.js saveSchemaVersion не 233" } else { Ok "game-data.js schema = 233" }

$Version = Get-Content ".\version.json" -Raw
if ($Version -notmatch 'hard-version-fix-2\.3\.3') { Fail "version.json не 2.3.3" } else { Ok "version.json = 2.3.3" }

$Sw = Get-Content ".\sw.js" -Raw
if ($Sw -notmatch 'fight-simulator-hard-version-fix-2\.3\.3') { Fail "sw.js CACHE_VERSION не 2.3.3" } else { Ok "sw.js CACHE_VERSION = 2.3.3" }
if ($Sw -notmatch 'hard-fix-2\.3\.3\.js') { Fail "sw.js не precache hard-fix-2.3.3.js" } else { Ok "sw.js precache hard-fix-2.3.3.js" }
if ($Sw -match 'tournament-ui-hotfix-2\.3\.0|tournament-ui-layout-2\.3\.1|tournament-ui-layout-2\.3\.2|update-button-fix-2\.3\.2') { Fail "sw.js всё ещё содержит старые patch scripts" } else { Ok "sw.js очищен от старых patch scripts" }

$OldFiles = @(
  ".\src\patches\tournament-ui-hotfix-2.3.0.js",
  ".\src\patches\tournament-ui-layout-2.3.1.js",
  ".\src\patches\tournament-ui-layout-2.3.2.js",
  ".\src\patches\update-button-fix-2.3.2.js"
)
foreach ($file in $OldFiles) {
  if (Test-Path $file) { Fail "старый файл всё ещё существует: $file" }
}
if (-not $Bad) { Ok "старых patch-файлов нет" }

if ($Bad) {
  throw "Проверка провалена. Старые 2.3.x хвосты ещё остались."
}

Write-Host ""
Write-Host "ПРОВЕРКА ПРОЙДЕНА: локально должна показываться версия hard-version-fix-2.3.3" -ForegroundColor Cyan
