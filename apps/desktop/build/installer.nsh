!macro customInstall
  ; Elevated NSIS context — install virtual printer without a separate UAC prompt.
  nsExec::ExecToLog 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\virtual-printer\install-windows-printer.ps1" -LogPath "$COMMONAPPDATA\Rx-Connect\logs\printer-install.log"'

  ; Placeholder for future driver / additional setup steps:
  ; nsExec::ExecToLog 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\virtual-printer\install-extra.ps1"'
!macroend

!macro customUnInstall
  nsExec::ExecToLog 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\virtual-printer\uninstall-windows-printer.ps1"'
!macroend
