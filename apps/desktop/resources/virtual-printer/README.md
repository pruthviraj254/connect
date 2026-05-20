# Virtual printer (Rx-Connect)

## macOS / Linux (CUPS)

- **Ghostscript (`gs`)** is recommended so PostScript jobs become PDFs in the spool folder. Install via Homebrew (`brew install ghostscript`) or your distro package manager.
- **Installer**: `.pkg` postinstall runs [`install-macos.sh`](./install-macos.sh) as root. **DMG drag-install** does not run it — use the `.pkg`, or run the script manually with sudo after copying `rxconnect-backend` + `rxconnect.ppd` next to the script.
- **Uninstall**: Dragging the app to Trash **does not** remove the CUPS printer. Removing the app via **Installer** (`.pkg` uninstall) runs `postuninstall` → [`uninstall-macos.sh`](./uninstall-macos.sh) (`lpadmin -x`, backend file). **Reinstalling** a newer `.pkg` runs postinstall again: it removes any existing `RxConnectFax` queue and recreates it. Spool PDFs under `/Library/Application Support/Rx-Connect/print-spool` are kept unless `RX_CONNECT_PURGE_SPOOL=1` is set during uninstall.
- **Debian**: `after-install-linux.sh` is wired from Electron Forge `MakerDeb` `afterInstall`.
- Spool directories:
  - macOS: `/Library/Application Support/Rx-Connect/print-spool`
  - Linux: `/var/spool/rx-connect`
- **Code signing / notarization**: the CUPS backend must be owned by root and live outside the app bundle once installed; the app bundle in `/Applications` should still be signed and notarized for distribution.

## Windows

- A **raw TCP** listener runs in Electron main on `127.0.0.1:19101` (override with `RX_CONNECT_RAW_PRINT_PORT`).
- **NSIS installer** (`customInstall` in `apps/desktop/build/installer.nsh`): runs [`install-windows-printer.ps1`](./install-windows-printer.ps1) silently during setup (elevated). On uninstall, [`uninstall-windows-printer.ps1`](./uninstall-windows-printer.ps1) runs from `customUnInstall`.
- **Runtime fallback**: if the printer is missing or uses a bad driver, the app prompts and runs the same scripts via UAC (`windows-runtime.ts`).
- If the user **denies UAC** during install, the next normal app launch retries printer registration once.
- Uses driver **Generic / Text Only** + raw port — some apps send PCL/PostScript; install Ghostscript on Windows for conversion when jobs are not already PDF.

## Development

- Set `RX_CONNECT_PRINT_SPOOL` to force a spool directory.
- Without installing CUPS, you can drop `.pdf` files into the userData `print-spool` folder to simulate jobs.
