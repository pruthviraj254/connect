<#
  Removes RxConnectFax printer and TCP port. Caller must elevate (RunAs).
#>
param(
  [string]$PrinterName = "RxConnect",
  [int]$Port = 19101,
  [string]$LogPath = ""
)

$ErrorActionPreference = "Stop"

if (-not ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)) {
  Write-Error "Administrator rights required."
  exit 2
}

$portName = "IP_127.0.0.1_$Port"

foreach ($name in @($PrinterName, 'RxConnectFax')) {
  $printer = Get-Printer -Name $name -ErrorAction SilentlyContinue
  if ($printer) {
    Remove-Printer -Name $name -Confirm:$false
  }
}

$printerPort = Get-PrinterPort -Name $portName -ErrorAction SilentlyContinue
if ($printerPort) {
  Remove-PrinterPort -Name $portName -Confirm:$false
}

Write-Host "Printer '$PrinterName' and port '$portName' removed."
