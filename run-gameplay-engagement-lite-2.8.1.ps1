$ErrorActionPreference = "Stop"

$env:FIGHTSIM_REPO = "C:\FightSimulator_GitHub"
$script = Join-Path $PSScriptRoot "apply-gameplay-engagement-lite-2.8.1.cjs"

if (!(Test-Path $env:FIGHTSIM_REPO)) {
  Write-Host "Repo not found: $env:FIGHTSIM_REPO"
  exit 1
}

if (!(Test-Path $script)) {
  Write-Host "Script not found: $script"
  exit 1
}

node $script

Write-Host ""
Write-Host "Done. Check:"
Write-Host "cd $env:FIGHTSIM_REPO"
Write-Host "node --check src/data/game-data.js"
Write-Host "node --check src/core/world.js"
Write-Host "node --check src/core/clubs.js"
Write-Host "node --check src/core/fight.js"
Write-Host "node --check src/core/matchmaking.js"
Write-Host "node --check src/app.js"
Write-Host "py -m http.server 5189"
