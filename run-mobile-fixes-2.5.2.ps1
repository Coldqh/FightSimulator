$ErrorActionPreference = "Stop"

$repo = "C:\FightSimulator_GitHub"
$script = Join-Path $PSScriptRoot "apply-mobile-fixes-2.5.2.cjs"

if (!(Test-Path $repo)) {
  Write-Host "Repo not found: $repo"
  exit 1
}

if (!(Test-Path $script)) {
  Write-Host "Script not found: $script"
  exit 1
}

Copy-Item $script (Join-Path $repo "apply-mobile-fixes-2.5.2.cjs") -Force

Push-Location $repo
node apply-mobile-fixes-2.5.2.cjs
Remove-Item ".\apply-mobile-fixes-2.5.2.cjs" -Force -ErrorAction SilentlyContinue
Pop-Location

Write-Host ""
Write-Host "Done. Check:"
Write-Host "cd $repo"
Write-Host "node --check src/app.js"
Write-Host "node --check src/ui/render.js"
Write-Host "py -m http.server 5189"
