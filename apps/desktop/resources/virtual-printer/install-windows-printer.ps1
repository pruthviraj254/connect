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

function Get-PrnportScript {
  $root = Join-Path $env:windir 'System32\Printing_Admin_Scripts'
  if (-not (Test-Path $root)) {
    return $null
  }
  $localized = Get-ChildItem -Path $root -Directory -ErrorAction SilentlyContinue |
    ForEach-Object { Join-Path $_.FullName 'prnport.vbs' } |
    Where-Object { Test-Path $_ } |
    Select-Object -First 1
  if ($localized) {
    return $localized
  }
  $fallback = Join-Path $root 'en-US\prnport.vbs'
  if (Test-Path $fallback) {
    return $fallback
  }
  return $null
}

function Ensure-TcpPrinterPort {
  param(
    [string]$PortName,
    [string]$HostAddress,
    [int]$PortNumber
  )

  if (Get-PrinterPort -Name $PortName -ErrorAction SilentlyContinue) {
    Write-Log "Port $PortName already exists"
    return
  }

  $lastError = $null

  try {
    Write-Log "Add-PrinterPort $PortName -> ${HostAddress}:$PortNumber"
    Add-PrinterPort -Name $PortName -PrinterHostAddress $HostAddress -PortNumber $PortNumber
    if (Get-PrinterPort -Name $PortName -ErrorAction SilentlyContinue) {
      return
    }
  } catch {
    $lastError = $_.Exception.Message
    Write-Log "Add-PrinterPort failed: $lastError"
  }

  $prnport = Get-PrnportScript
  if ($prnport) {
    Write-Log "Trying prnport.vbs: $prnport"
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "$env:windir\System32\cscript.exe"
    $psi.Arguments = "//NoLogo `"$prnport`" -a -r $PortName -h $HostAddress -o raw -n $PortNumber"
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $proc = [System.Diagnostics.Process]::Start($psi)
    $proc.WaitForExit()
    Write-Log "prnport.vbs exit code: $($proc.ExitCode)"
    if ($proc.ExitCode -eq 0 -and (Get-PrinterPort -Name $PortName -ErrorAction SilentlyContinue)) {
      return
    }
    if ($proc.ExitCode -ne 0) {
      $lastError = "prnport.vbs exit $($proc.ExitCode)"
    }
  } else {
    Write-Log "prnport.vbs not found under Printing_Admin_Scripts"
  }

  if ($HostAddress -eq '127.0.0.1') {
    Write-Log "Retrying port with host localhost"
    try {
      Add-PrinterPort -Name $PortName -PrinterHostAddress 'localhost' -PortNumber $PortNumber
      if (Get-PrinterPort -Name $PortName -ErrorAction SilentlyContinue) {
        return
      }
    } catch {
      $lastError = $_.Exception.Message
      Write-Log "Add-PrinterPort localhost failed: $lastError"
    }
  }

  throw "Could not create TCP printer port ${PortName}: $lastError"
}

function Ensure-GenericTextDriver {
  $candidates = @(
    'Generic / Text Only',
    'Generic Text Only',
    'Generic / Text Only (MS)'
  )

  foreach ($name in $candidates) {
    if (Get-PrinterDriver -Name $name -ErrorAction SilentlyContinue) {
      Write-Log "Found driver: $name"
      return $name
    }
  }

  $generic = Get-PrinterDriver -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match 'Generic' -and $_.Name -match 'Text' } |
    Select-Object -First 1
  if ($generic) {
    Write-Log "Found driver (scan): $($generic.Name)"
    return $generic.Name
  }

  $inf = Join-Path $env:windir 'inf\ntprint.inf'
  if (Test-Path $inf) {
    Write-Log "Installing Generic / Text Only from $inf"
    try {
      Add-PrinterDriver -Name 'Generic / Text Only' -InfPath $inf -ErrorAction Stop
      if (Get-PrinterDriver -Name 'Generic / Text Only' -ErrorAction SilentlyContinue) {
        return 'Generic / Text Only'
      }
    } catch {
      Write-Log "Add-PrinterDriver failed: $($_.Exception.Message)"
    }

    $uiArgs = "/ia /f `"$inf`" /m `"Generic / Text Only`""
    Write-Log "Trying printui driver install: $uiArgs"
    $p = Start-Process -FilePath 'rundll32.exe' `
      -ArgumentList "printui.dll,PrintUIEntry $uiArgs" `
      -Wait -PassThru -NoNewWindow
    Write-Log "printui driver install exit: $($p.ExitCode)"
    if (Get-PrinterDriver -Name 'Generic / Text Only' -ErrorAction SilentlyContinue) {
      return 'Generic / Text Only'
    }
  }

  $names = @(Get-PrinterDriver -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)
  Write-Log "Available drivers: $($names -join '; ')"
  throw 'No suitable Generic Text printer driver found on this system.'
}

function Add-PrinterSafe {
  param(
    [string]$Name,
    [string]$DriverName,
    [string]$PortName
  )

  $existing = Get-Printer -Name $Name -ErrorAction SilentlyContinue
  if ($existing) {
    Write-Log "Removing existing printer $Name"
    Remove-Printer -Name $Name -Confirm:$false
  }

  try {
    Write-Log "Add-Printer -Name $Name -DriverName $DriverName -PortName $PortName"
    Add-Printer -Name $Name -DriverName $DriverName -PortName $PortName
    return
  } catch {
    Write-Log "Add-Printer failed: $($_.Exception.Message)"
  }

  $inf = Join-Path $env:windir 'inf\ntprint.inf'
  if (-not (Test-Path $inf)) {
    throw "Add-Printer failed and ntprint.inf missing"
  }

  $uiArgs = "/if /b `"$Name`" /f `"$inf`" /r `"$PortName`" /m `"$DriverName`""
  Write-Log "Trying printui printer install: $uiArgs"
  $p = Start-Process -FilePath 'rundll32.exe' `
    -ArgumentList "printui.dll,PrintUIEntry $uiArgs" `
    -Wait -PassThru -NoNewWindow
  Write-Log "printui printer install exit: $($p.ExitCode)"
  if (-not (Get-Printer -Name $Name -ErrorAction SilentlyContinue)) {
    throw "printui could not register printer $Name (exit $($p.ExitCode))"
  }
}

try {
  Write-Log "install-windows-printer.ps1 starting (admin=$([bool](Test-IsAdmin))) PS=$($PSVersionTable.PSVersion)"

  if (-not (Test-IsAdmin)) {
    Write-Log 'ERROR: not running as Administrator'
    exit 2
  }

  $portName = "IP_127.0.0.1_$Port"
  Ensure-TcpPrinterPort -PortName $portName -HostAddress '127.0.0.1' -PortNumber $Port

  $driver = Ensure-GenericTextDriver
  Add-PrinterSafe -Name $PrinterName -DriverName $driver -PortName $portName

  $verify = Get-Printer -Name $PrinterName -ErrorAction SilentlyContinue
  if (-not $verify) {
    throw "Printer '$PrinterName' not visible after install"
  }

  Write-Log "SUCCESS: Printer '$PrinterName' on $portName (127.0.0.1:$Port) driver=$driver"
  exit 0
} catch {
  Write-Log "FAILED: $($_.Exception.Message)"
  if ($_.ScriptStackTrace) {
    Write-Log "STACK: $($_.ScriptStackTrace)"
  }
  exit 1
}
