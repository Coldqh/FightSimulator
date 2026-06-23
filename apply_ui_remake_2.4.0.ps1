$ErrorActionPreference = "Stop"

$source = Split-Path -Parent $MyInvocation.MyCommand.Path
$target = "C:\FightSimulator_GitHub"

if (!(Test-Path $target)) {
  Write-Host "Не найден путь: $target"
  exit 1
}

Copy-Item "$source\index.html" "$target\index.html" -Force
Copy-Item "$source\sw.js" "$target\sw.js" -Force
Copy-Item "$source\version.json" "$target\version.json" -Force
Copy-Item "$source\manifest.webmanifest" "$target\manifest.webmanifest" -Force
Copy-Item "$source\src\ui-remake-2.4.0.css" "$target\src\ui-remake-2.4.0.css" -Force
New-Item -ItemType Directory -Force "$target\src\patches" | Out-Null
Copy-Item "$source\src\patches\ui-remake-2.4.0.js" "$target\src\patches\ui-remake-2.4.0.js" -Force

Write-Host "UI Remake 2.4.0 copied to $target"
