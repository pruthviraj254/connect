#!/usr/bin/env bash
# Bundled in .pkg scripts; same as ../uninstall-macos.sh
set -euo pipefail

PRINTER_NAME="${RX_CONNECT_PRINTER_NAME:-RxConnectFax}"
BACKEND_PATH="/usr/libexec/cups/backend/rxconnect"
PPD_PATH="/Library/Application Support/Rx-Connect/rxconnect.ppd"

if lpstat -p "$PRINTER_NAME" >/dev/null 2>&1; then
  lpadmin -x "$PRINTER_NAME" || true
fi

rm -f "$BACKEND_PATH"
rm -f "$PPD_PATH"

if [[ "${RX_CONNECT_PURGE_SPOOL:-0}" == "1" ]]; then
  rm -rf "/Library/Application Support/Rx-Connect/print-spool"/* 2>/dev/null || true
fi

echo "Rx-Connect CUPS printer '$PRINTER_NAME' removed."
