# Installs RxConnect (Standard TCP/IP raw -> 127.0.0.1:19101). Caller must elevate (RunAs).
# Queue name must NOT contain "Fax" — Windows routes those to Windows Fax and Scan.
param(
  [string]$PrinterName = "RxConnect",
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

function Set-RawPortConfiguration {
  param(
    [string]$PortName,
    [int]$PortNumber
  )

  try {
    $wmi = Get-WmiObject Win32_TCPIPPrinterPort -Filter "Name='$PortName'" -ErrorAction SilentlyContinue
    if ($wmi) {
      $wmi.Protocol = 1
      $wmi.SNMPEnabled = $false
      $wmi.PortNumber = $PortNumber
      $wmi.Put() | Out-Null
      Write-Log "WMI port $PortName set Protocol=RAW SNMP=off"
    }
  } catch {
    Write-Log "WMI port config: $($_.Exception.Message)"
  }
}

function Ensure-SpoolDirectory {
  $spoolDir = Join-Path $env:ProgramData 'Rx-Connect\print-spool'
  New-Item -ItemType Directory -Path $spoolDir -Force | Out-Null
  try {
    & icacls $spoolDir /grant 'Authenticated Users:(OI)(CI)M' /T 2>&1 | Out-Null
    Write-Log "Spool directory ready: $spoolDir"
  } catch {
    Write-Log "Spool directory created (icacls skipped): $spoolDir"
  }
}

function Ensure-TcpPrinterPort {
  param(
    [string]$PortName,
    [string]$HostAddress,
    [int]$PortNumber
  )

  $existingPort = Get-PrinterPort -Name $PortName -ErrorAction SilentlyContinue
  if ($existingPort) {
    Write-Log "Removing existing port $PortName (recreate as RAW)"
    Remove-PrinterPort -Name $PortName -Confirm:$false -ErrorAction SilentlyContinue
  }

  $lastError = $null
  $prnport = Get-PrnportScript

  if ($prnport) {
    Write-Log "Creating RAW port via prnport.vbs: $prnport"
    $psi = New-Object System.Diagnostics.ProcessStartInfo
    $psi.FileName = "$env:windir\System32\cscript.exe"
    $psi.Arguments = "//NoLogo `"$prnport`" -a -r $PortName -h $HostAddress -o raw -n $PortNumber"
    $psi.UseShellExecute = $false
    $psi.CreateNoWindow = $true
    $proc = [System.Diagnostics.Process]::Start($psi)
    $proc.WaitForExit()
    Write-Log "prnport.vbs exit code: $($proc.ExitCode)"
    if ($proc.ExitCode -eq 0 -and (Get-PrinterPort -Name $PortName -ErrorAction SilentlyContinue)) {
      Set-RawPortConfiguration -PortName $PortName -PortNumber $PortNumber
      return
    }
    if ($proc.ExitCode -ne 0) {
      $lastError = "prnport.vbs exit $($proc.ExitCode)"
    }
  } else {
    Write-Log "prnport.vbs not found under Printing_Admin_Scripts"
  }

  try {
    Write-Log "Add-PrinterPort $PortName -> ${HostAddress}:$PortNumber"
    Add-PrinterPort -Name $PortName -PrinterHostAddress $HostAddress -PortNumber $PortNumber
    if (Get-PrinterPort -Name $PortName -ErrorAction SilentlyContinue) {
      Set-RawPortConfiguration -PortName $PortName -PortNumber $PortNumber
      return
    }
  } catch {
    $lastError = $_.Exception.Message
    Write-Log "Add-PrinterPort failed: $lastError"
  }

  if ($HostAddress -eq '127.0.0.1') {
    Write-Log "Retrying port with host localhost"
    try {
      Add-PrinterPort -Name $PortName -PrinterHostAddress 'localhost' -PortNumber $PortNumber
      if (Get-PrinterPort -Name $PortName -ErrorAction SilentlyContinue) {
        Set-RawPortConfiguration -PortName $PortName -PortNumber $PortNumber
        return
      }
    } catch {
      $lastError = $_.Exception.Message
      Write-Log "Add-PrinterPort localhost failed: $lastError"
    }
  }

  throw "Could not create TCP printer port ${PortName}: $lastError"
}

function Ensure-PrintDriver {
  # IMPORTANT: ONLY real PostScript drivers — Ghostscript needs PostScript input to produce a PDF.
  # "Generic / Text Only" produces plain text + form feeds (NOT PostScript) and yields BLANK PDFs.
  # MS Publisher drivers ship with every Windows 10/11 and output proper PostScript Level 2.
  $candidates = @(
    'Microsoft PS Class Driver',
    'MS Publisher Color Printer',
    'MS Publisher Imagesetter',
    'Generic / PostScript',
    'Generic PostScript'
  )

  foreach ($name in $candidates) {
    if (Get-PrinterDriver -Name $name -ErrorAction SilentlyContinue) {
      Write-Log "Found PostScript driver: $name"
      return $name
    }
  }

  # Try to install MS Publisher drivers from ntprint.inf (always present on Windows)
  $inf = Join-Path $env:windir 'inf\ntprint.inf'
  if (Test-Path $inf) {
    foreach ($driverModel in @('MS Publisher Color Printer', 'MS Publisher Imagesetter', 'Microsoft PS Class Driver')) {
      Write-Log "Installing PostScript driver '$driverModel' from $inf"
      try {
        Add-PrinterDriver -Name $driverModel -InfPath $inf -ErrorAction Stop
        if (Get-PrinterDriver -Name $driverModel -ErrorAction SilentlyContinue) {
          Write-Log "Installed driver: $driverModel"
          return $driverModel
        }
      } catch {
        Write-Log "Add-PrinterDriver '$driverModel' failed: $($_.Exception.Message)"
      }

      $uiArgs = "/ia /f `"$inf`" /m `"$driverModel`""
      Write-Log "Trying printui driver install: $uiArgs"
      $p = Start-Process -FilePath 'rundll32.exe' `
        -ArgumentList "printui.dll,PrintUIEntry $uiArgs" `
        -Wait -PassThru -NoNewWindow
      Write-Log "printui driver install exit: $($p.ExitCode)"
      if (Get-PrinterDriver -Name $driverModel -ErrorAction SilentlyContinue) {
        Write-Log "Installed driver: $driverModel"
        return $driverModel
      }
    }
  }

  # Last resort: scan for ANY PostScript-capable driver
  $ps = Get-PrinterDriver -ErrorAction SilentlyContinue |
    Where-Object { $_.Name -match 'PostScript|PS\s' -or $_.Name -match 'Publisher' } |
    Select-Object -First 1
  if ($ps) {
    Write-Log "Found PostScript driver (scan): $($ps.Name)"
    return $ps.Name
  }

  $names = @(Get-PrinterDriver -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Name)
  Write-Log "Available drivers: $($names -join '; ')"
  throw 'No PostScript printer driver found. Install Microsoft PS Class Driver via Windows Settings > Printers.'
}

function Configure-PrinterQueue {
  param([string]$Name)

  try {
    $escaped = $Name.Replace("'", "''")
    $printer = Get-WmiObject Win32_Printer -Filter "Name='$escaped'" -ErrorAction SilentlyContinue
    if ($printer) {
      $printer.Direct = $true
      $printer.Put() | Out-Null
      Write-Log "Printer $Name set Direct=true"
    }
  } catch {
    Write-Log "Configure-PrinterQueue: $($_.Exception.Message)"
  }
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

  Ensure-SpoolDirectory

  foreach ($legacyName in @('RxConnectFax')) {
    if ($legacyName -ne $PrinterName) {
      $legacy = Get-Printer -Name $legacyName -ErrorAction SilentlyContinue
      if ($legacy) {
        Write-Log "Removing legacy printer $legacyName (Fax in name triggers Windows Fax UI)"
        Remove-Printer -Name $legacyName -Confirm:$false
      }
    }
  }

  $portName = "IP_127.0.0.1_$Port"
  Ensure-TcpPrinterPort -PortName $portName -HostAddress '127.0.0.1' -PortNumber $Port

  $driver = Ensure-PrintDriver
  Add-PrinterSafe -Name $PrinterName -DriverName $driver -PortName $portName
  Configure-PrinterQueue -Name $PrinterName

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
