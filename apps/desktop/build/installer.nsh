!macro customInstall
  ; Stop running app so port 19101 / files are not locked during service install.
  nsExec::ExecToLog 'taskkill /IM rx-connect.exe /F /T'
  Sleep 1000

  ; Elevated NSIS context — install virtual printer without a separate UAC prompt.
  nsExec::ExecToLog 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\virtual-printer\install-windows-printer.ps1"'

  ; Windows print capture service (owns TCP 127.0.0.1:19101).
  IfFileExists "$INSTDIR\resources\print-service\rxconnect-print-service.exe" 0 +4
    nsExec::ExecToLog '"$INSTDIR\resources\print-service\rxconnect-print-service.exe" --install'
    Sleep 2000
!macroend

!macro customUnInstall
  IfFileExists "$INSTDIR\resources\print-service\rxconnect-print-service.exe" 0 +2
    nsExec::ExecToLog '"$INSTDIR\resources\print-service\rxconnect-print-service.exe" --uninstall'
  nsExec::ExecToLog 'powershell.exe -NoProfile -ExecutionPolicy Bypass -File "$INSTDIR\resources\virtual-printer\uninstall-windows-printer.ps1"'
!macroend
