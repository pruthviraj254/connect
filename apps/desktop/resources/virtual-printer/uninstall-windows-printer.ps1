#Requires -RunAsAdministrator
<#
  Removes RxConnectFax printer and TCP port created by install-windows-printer.ps1.
#>
param(
  [string]$PrinterName = "RxConnectFax",
  [int]$Port = 19101
)

$ErrorActionPreference = "Stop"

$portName = "IP_127.0.0.1_$Port"

$printer = Get-Printer -Name $PrinterName -ErrorAction SilentlyContinue
if ($printer) {
  Remove-Printer -Name $PrinterName -Confirm:$false
}

$printerPort = Get-PrinterPort -Name $portName -ErrorAction SilentlyContinue
if ($printerPort) {
  Remove-PrinterPort -Name $portName -Confirm:$false
}

Write-Host "Printer '$PrinterName' and port '$portName' removed."
