# Clean local host Fight World 2.3.4
# Запускать из корня репозитория:
#   cd C:\FightSimulator_GitHub
#   PowerShell -ExecutionPolicy Bypass -File .\start_clean_local.ps1

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\index.html") -or -not (Test-Path ".\reset-cache.html")) {
  throw "Запусти скрипт из корня репозитория FightSimulator после apply_root_fix.ps1."
}

$Port = 5184
$Url = "http://127.0.0.1:$Port/reset-cache.html?start=clean&t=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"

Write-Host "Чистый локальный запуск Fight World 2.3.4:" -ForegroundColor Cyan
Write-Host "  $Url"
Write-Host ""
Write-Host "Важно: это НОВЫЙ origin 127.0.0.1:$Port, старый service worker с localhost:5173 сюда не достанет."
Write-Host "Если старый localhost:5173 уже держит 2.3.0, отдельно открой:"
Write-Host "  http://localhost:5173/reset-cache.html"
Write-Host ""

Start-Process $Url

if (Get-Command py -ErrorAction SilentlyContinue) {
  py -m http.server $Port --bind 127.0.0.1
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  python -m http.server $Port --bind 127.0.0.1
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
  python3 -m http.server $Port --bind 127.0.0.1
} else {
  throw "Python не найден. Поставь Python или запусти папку любым статическим сервером на 127.0.0.1:$Port."
}
