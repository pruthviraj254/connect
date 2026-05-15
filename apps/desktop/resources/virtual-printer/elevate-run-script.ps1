# Launches TargetScript elevated (UAC). Args: -TargetScript <path> [-LogPath <path>]
param(
  [Parameter(Mandatory = $true)]
  [string]$TargetScript,
  [string]$LogPath = "$env:ProgramData\Rx-Connect\logs\printer-install.log"
)

$ErrorActionPreference = "Stop"

if (-not (Test-Path -LiteralPath $TargetScript)) {
  Write-Error "Target script not found: $TargetScript"
  exit 3
}

# Single ArgumentList string — array form breaks paths with spaces (AppData\Local\RxConnect\...).
$argLine = "-NoProfile -ExecutionPolicy Bypass -File `"$TargetScript`" -LogPath `"$LogPath`""

$p = Start-Process -FilePath 'powershell.exe' `
  -Verb RunAs `
  -Wait `
  -PassThru `
  -ArgumentList $argLine

if ($null -eq $p) {
  exit 5
}

exit $p.ExitCode
