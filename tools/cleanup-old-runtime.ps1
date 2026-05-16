cd C:\FightSimulator_GitHub

Write-Host "This script only removes old runtime leftovers that are not used by the new MVP."
Write-Host "It does NOT remove .git, docs, README, src, index.html, manifest, version."

$targets = @(
  "data",
  "country_data.js",
  "game_data.js",
  "fight_simulator.hta",
  "launch_ui.bat",
  "MOBILE_DEPLOY.md",
  "ring_top_view.png"
)

foreach ($target in $targets) {
  if (Test-Path $target) {
    Remove-Item $target -Recurse -Force
    Write-Host "Removed $target"
  }
}

Write-Host "Cleanup complete."
