#!/usr/bin/env bash
# Run as root (e.g. pkg postinstall). Installs CUPS backend + queue for Rx-Connect.
set -euo pipefail

PRINTER_NAME="${RX_CONNECT_PRINTER_NAME:-RxConnectFax}"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_SRC="${SCRIPT_DIR}/rxconnect-backend"
PPD_SRC="${SCRIPT_DIR}/rxconnect.ppd"

if [[ "$(uname -s)" != Darwin ]]; then
  echo "install-macos.sh: not macOS" >&2
  exit 1
fi

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "install-macos.sh: must run as root" >&2
  exit 1
fi

BACKEND_DIR="/usr/libexec/cups/backend"
mkdir -p "/Library/Application Support/Rx-Connect/print-spool"
chmod 1777 "/Library/Application Support/Rx-Connect/print-spool" 2>/dev/null || chmod 777 "/Library/Application Support/Rx-Connect/print-spool"

install -m 755 -o root -g wheel "$BACKEND_SRC" "${BACKEND_DIR}/rxconnect"
install -m 644 -o root -g wheel "$PPD_SRC" "/Library/Application Support/Rx-Connect/rxconnect.ppd"

if lpstat -p "$PRINTER_NAME" >/dev/null 2>&1; then
  lpadmin -x "$PRINTER_NAME" || true
fi

lpadmin -p "$PRINTER_NAME" -E \
  -v "rxconnect:/" \
  -P "/Library/Application Support/Rx-Connect/rxconnect.ppd" \
  -D "Rx-Connect Fax Inbox" \
  -L "Rx-Connect" \
  -o printer-is-shared=false

cupsenable "$PRINTER_NAME" 2>/dev/null || true

echo "Rx-Connect CUPS printer '$PRINTER_NAME' installed."
