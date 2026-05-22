# Print background + tray — manual test matrix

## Tray / close behavior (Windows)

| Step                      | Expected                     |
| ------------------------- | ---------------------------- |
| Close main window with X  | App hides; tray icon remains |
| Double-click tray icon    | Main window restores         |
| Tray → Quit Rx-Connect    | App fully exits              |
| First close after install | One notification about tray  |

## Print with app in tray

| Step                     | Expected                                             |
| ------------------------ | ---------------------------------------------------- |
| Minimize/hide Rx-Connect | Tray icon visible                                    |
| Print to RxConnect       | One fax popup; main window not focused               |
| Send fax                 | Success; log in `%APPDATA%\Rx-Connect\logs\main.log` |

## Print with app fully quit (Windows + service installed)

| Step                 | Expected                                                          |
| -------------------- | ----------------------------------------------------------------- |
| Tray → Quit          | Process gone from Task Manager                                    |
| Print to RxConnect   | Service writes PDF under `C:\ProgramData\Rx-Connect\print-spool\` |
| Within a few seconds | Rx-Connect launches (hidden/tray); fax popup opens                |
| Locked screen        | PDF still in spool; popup after unlock when app runs              |

## Service diagnostics

- Service log: `C:\ProgramData\Rx-Connect\logs\service.log`
- Tray → Open service log
- `sc query RxConnectPrintService` → RUNNING after install

## Mac (unchanged)

- CUPS backend captures print when app quit; popup when app next runs / watcher fires
- Close window → app stays in Dock (no tray)
