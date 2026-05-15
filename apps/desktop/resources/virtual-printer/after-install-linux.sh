#!/usr/bin/env bash
# Debian postinst — run as root after package install.
set -euo pipefail

PRINTER_NAME="${RX_CONNECT_PRINTER_NAME:-RxConnectFax}"

SCRIPT_DIR=""
for base in /opt/rx-connect /opt/Rx-Connect /usr/lib/rx-connect; do
  if [[ -d "$base/resources/virtual-printer" ]]; then
    SCRIPT_DIR="$base/resources/virtual-printer"
    break
  fi
done

if [[ -z "$SCRIPT_DIR" ]]; then
  echo "after-install-linux: could not find resources/virtual-printer under /opt or /usr/lib" >&2
  exit 0
fi

BACKEND_SRC="${SCRIPT_DIR}/rxconnect-backend"
PPD_SRC="${SCRIPT_DIR}/rxconnect.ppd"

if [[ "${EUID:-0}" -ne 0 ]]; then
  echo "after-install-linux: not root, skipping CUPS install" >&2
  exit 0
fi

BACKEND_DIR="/usr/lib/cups/backend"
if command -v cups-config >/dev/null 2>&1; then
  BACKEND_DIR="$(cups-config --serverbin)/backend"
fi

mkdir -p /var/spool/rx-connect
chmod 1777 /var/spool/rx-connect 2>/dev/null || chmod 777 /var/spool/rx-connect

install -m 755 -o root -g root "$BACKEND_SRC" "${BACKEND_DIR}/rxconnect"
install -m 644 -o root -g root "$PPD_SRC" "/var/spool/rx-connect/rxconnect.ppd"

if lpstat -p "$PRINTER_NAME" >/dev/null 2>&1; then
  lpadmin -x "$PRINTER_NAME" || true
fi

lpadmin -p "$PRINTER_NAME" -E \
  -v "rxconnect:/" \
  -P "/var/spool/rx-connect/rxconnect.ppd" \
  -D "Rx-Connect Fax Inbox" \
  -L "Rx-Connect" \
  -o printer-is-shared=false

cupsenable "$PRINTER_NAME" 2>/dev/null || true

echo "Rx-Connect CUPS printer '$PRINTER_NAME' installed."
