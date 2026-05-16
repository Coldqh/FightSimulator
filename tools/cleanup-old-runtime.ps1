cd C:\FightSimulator_GitHub

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

Write-Host "Cleanup done. Modular runtime remains in index.html + src."
