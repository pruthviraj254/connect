!macro customInstall
  ; Elevated NSIS context — install virtual printer without a separate UAC prompt.
  ; LogPath omitted: install-windows-printer.ps1 defaults to $env:ProgramData\Rx-Connect\logs\printer-install.log
  nsExec::ExecToLog 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\virtual-printer\install-windows-printer.ps1"'

  ; Placeholder for future driver / additional setup steps:
  ; nsExec::ExecToLog 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\virtual-printer\install-extra.ps1"'
!macroend

!macro customUnInstall
  nsExec::ExecToLog 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\virtual-printer\uninstall-windows-printer.ps1"'
!macroend
