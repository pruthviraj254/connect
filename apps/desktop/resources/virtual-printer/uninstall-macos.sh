#!/usr/bin/env bash
# Run as root (pkg postuninstall). Removes CUPS queue + backend; keeps spool data by default.
set -euo pipefail

PRINTER_NAME="${RX_CONNECT_PRINTER_NAME:-RxConnectFax}"
BACKEND_PATH="/usr/libexec/cups/backend/rxconnect"
PPD_PATH="/Library/Application Support/Rx-Connect/rxconnect.ppd"

if [[ "$(uname -s)" != Darwin ]]; then
  echo "uninstall-macos.sh: not macOS" >&2
  exit 1
fi

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "uninstall-macos.sh: must run as root" >&2
  exit 1
fi

if lpstat -p "$PRINTER_NAME" >/dev/null 2>&1; then
  lpadmin -x "$PRINTER_NAME" || true
fi

if [[ -f "$BACKEND_PATH" ]]; then
  rm -f "$BACKEND_PATH"
fi

if [[ -f "$PPD_PATH" ]]; then
  rm -f "$PPD_PATH"
fi

# Spool jobs are left in /Library/Application Support/Rx-Connect/print-spool unless IT opts in:
if [[ "${RX_CONNECT_PURGE_SPOOL:-0}" == "1" ]]; then
  rm -rf "/Library/Application Support/Rx-Connect/print-spool"/* 2>/dev/null || true
fi

echo "Rx-Connect CUPS printer '$PRINTER_NAME' removed."
