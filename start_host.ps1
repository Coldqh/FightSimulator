# Local host Fight World HARD FIX 2.3.3
# Запускать из корня репозитория:
#   cd C:\FightSimulator_GitHub
#   PowerShell -ExecutionPolicy Bypass -File .\start_host.ps1

$ErrorActionPreference = "Stop"

if (-not (Test-Path ".\index.html")) {
  throw "Запусти скрипт из корня репозитория FightSimulator."
}

$Url = "http://localhost:5173/index.html?v=2.3.3&hard=1&t=$([DateTimeOffset]::UtcNow.ToUnixTimeSeconds())"
Write-Host "Fight World local host: $Url" -ForegroundColor Cyan
Start-Process $Url

if (Get-Command py -ErrorAction SilentlyContinue) {
  py -m http.server 5173
} elseif (Get-Command python -ErrorAction SilentlyContinue) {
  python -m http.server 5173
} elseif (Get-Command python3 -ErrorAction SilentlyContinue) {
  python3 -m http.server 5173
} else {
  throw "Python не найден. Поставь Python или открой проект через любой статический сервер."
}
