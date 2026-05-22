# RxConnectPrintService (Windows)

Background Windows service that listens on `127.0.0.1:19101` for RxConnect virtual printer RAW jobs, writes PDFs to `C:\ProgramData\Rx-Connect\print-spool\`, and launches `rx-connect.exe` in the active user session.

## Build

```bash
cd services/print-service
make build
# or
GOOS=windows GOARCH=amd64 go build -o ../../apps/desktop/resources/print-service/rxconnect-print-service.exe .
```

From repo root (used by desktop `dist:win`):

```bash
node apps/desktop/scripts/build-print-service.cjs
```

## Install (elevated)

```powershell
.\rxconnect-print-service.exe --install
sc query RxConnectPrintService
```

## Uninstall

```powershell
.\rxconnect-print-service.exe --uninstall
```

## Debug (foreground)

```powershell
.\rxconnect-print-service.exe --run
```

Logs: `C:\ProgramData\Rx-Connect\logs\service.log`
