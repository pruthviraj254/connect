# Installs RxConnectFax (Standard TCP/IP raw -> 127.0.0.1:19101). Caller must elevate (RunAs).
param(
  [string]$PrinterName = "RxConnectFax",
  [int]$Port = 19101,
  [string]$LogPath = "$env:ProgramData\Rx-Connect\logs\printer-install.log"
)

$ErrorActionPreference = "Stop"

function Write-Log {
  param([string]$Message)
  $line = "$(Get-Date -Format o) $Message"
  try {
    $dir = Split-Path -Parent $LogPath
    if (-not (Test-Path $dir)) {
      New-Item -ItemType Directory -Path $dir -Force | Out-Null
    }
    Add-Content -Path $LogPath -Value $line -Encoding UTF8
  } catch {
    Write-Host $line
  }
}

function Test-IsAdmin {
  $identity = [Security.Principal.WindowsIdentity]::GetCurrent()
  $principal = New-Object Security.Principal.WindowsPrincipal($identity)
  return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Resolve-PrinterDriver {
  $candidates = @(
    "Generic / Text Only",
    "Generic Text Only",
    "Generic / Text Only (MS)"
  )
  foreach ($name in $candidates) {
    if (Get-PrinterDriver -Name $name -ErrorAction SilentlyContinue) {
      return $name
    }
  }
  $generic = Get-PrinterDriver -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match 'Generic' -and $_.Name -match 'Text' } |
    Select-Object -First 1
  if ($generic) {
    return $generic.Name
  }
  throw "No suitable Generic Text printer driver found on this system."
}

try {
  Write-Log "install-windows-printer.ps1 starting (admin=$([bool](Test-IsAdmin)))"

  if (-not (Test-IsAdmin)) {
    Write-Log "ERROR: not running as Administrator"
    exit 2
  }

  $portName = "IP_127.0.0.1_$Port"

  if (-not (Get-PrinterPort -Name $portName -ErrorAction SilentlyContinue)) {
    Write-Log "Adding port $portName -> 127.0.0.1:$Port"
    Add-PrinterPort -Name $portName -PrinterHostAddress "127.0.0.1" -PortNumber $Port
  } else {
    Write-Log "Port $portName already exists"
  }

  $existing = Get-Printer -Name $PrinterName -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Log "Removing existing printer $PrinterName"
    Remove-Printer -Name $PrinterName -Confirm:$false
  }

  $driver = Resolve-PrinterDriver
  Write-Log "Using driver: $driver"
  Add-Printer -Name $PrinterName -DriverName $driver -PortName $portName

  Write-Log "SUCCESS: Printer '$PrinterName' on $portName (127.0.0.1:$Port)"
  exit 0
} catch {
  Write-Log "FAILED: $($_.Exception.Message)"
  exit 1
}
