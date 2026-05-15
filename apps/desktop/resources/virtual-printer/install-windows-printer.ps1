#Requires -RunAsAdministrator
<#
  Registers a Standard TCP/IP raw printer pointing at Rx-Connect's local raw listener.
  Default port: 19101 (override with env RX_CONNECT_RAW_PRINT_PORT before packaging).
#>
param(
  [string]$PrinterName = "RxConnectFax",
  [int]$Port = 19101
)

$ErrorActionPreference = "Stop"

$portName = "IP_127.0.0.1_$Port"

if (-not (Get-PrinterPort -Name $portName -ErrorAction SilentlyContinue)) {
  Add-PrinterPort -Name $portName -PrinterHostAddress "127.0.0.1" -PortNumber $Port
}

$existing = Get-Printer -Name $PrinterName -ErrorAction SilentlyContinue
if ($existing) {
  Remove-Printer -Name $PrinterName -Confirm:$false
}

Add-Printer -Name $PrinterName -DriverName "Generic / Text Only" -PortName $portName

Write-Host "Printer '$PrinterName' installed on port $portName (127.0.0.1:$Port)."
