# Локальный хост Fight World
# Запускать из корня репозитория после apply_patch.ps1:
#   PowerShell -ExecutionPolicy Bypass -File .\start_host.ps1

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\index.html")) {
  throw "Запусти скрипт из корня репозитория FightSimulator."
}

$url = "http://localhost:5173"
Write-Host "Fight World local host: $url" -ForegroundColor Cyan
Start-Process $url

if (Get-Command py -ErrorAction SilentlyContinue) {
  py -m http.server 5173
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  python -m http.server 5173
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
  python3 -m http.server 5173
} else {
  throw "Python не найден. Поставь Python или открой проект через любой статический сервер."
}
