$ErrorActionPreference = "Stop"

$repo = "C:\FightSimulator_GitHub"
$script = Join-Path $PSScriptRoot "cleanup-and-merge-2.4.1.cjs"

if (!(Test-Path $repo)) {
  Write-Host "Не найден репозиторий: $repo"
  exit 1
}

if (!(Test-Path $script)) {
  Write-Host "Не найден скрипт: $script"
  exit 1
}

Copy-Item $script (Join-Path $repo "cleanup-and-merge-2.4.1.cjs") -Force

Push-Location $repo
node cleanup-and-merge-2.4.1.cjs
Remove-Item ".\cleanup-and-merge-2.4.1.cjs" -Force -ErrorAction SilentlyContinue
Pop-Location

Write-Host ""
Write-Host "Готово. Теперь проверь:"
Write-Host "cd $repo"
Write-Host "git status"
Write-Host "node --check src/app.js"
Write-Host "node --check src/ui/render.js"
Write-Host "py -m http.server 5189"
