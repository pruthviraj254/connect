//go:build windows

package main

import (
	"fmt"
	"os"
	"path/filepath"
	"unsafe"

	"golang.org/x/sys/windows"
)

func tryLaunchApp() {
	exe := appExecutablePath()
	if exe == "" {
		return
	}
	if _, err := os.Stat(exe); err != nil {
		logWarn("app exe not found: " + exe)
		return
	}
	if err := launchInActiveSession(exe); err != nil {
		logWarn("launch app: " + err.Error())
	} else {
		logInfo("launched " + exe)
	}
}

func launchInActiveSession(exePath string) error {
	sessionID := windows.WTSGetActiveConsoleSessionId()
	if sessionID == 0xFFFFFFFF {
		return fmt.Errorf("no active console session")
	}

	var userToken windows.Token
	if err := windows.WTSQueryUserToken(sessionID, &userToken); err != nil {
		return fmt.Errorf("WTSQueryUserToken: %w", err)
	}
	defer userToken.Close()

	var si windows.StartupInfo
	si.Cb = uint32(unsafe.Sizeof(si))
	si.Flags = windows.STARTF_USESHOWWINDOW
	si.ShowWindow = windows.SW_SHOWMINNOACTIVE
	var pi windows.ProcessInformation

	exe, _ := windows.UTF16PtrFromString(exePath)
	workDir, _ := windows.UTF16PtrFromString(filepath.Dir(exePath))
	cmdLine, _ := windows.UTF16PtrFromString(`"` + exePath + `" --hidden --wake-for-print`)

	// User environment block (APPDATA, LOCALAPPDATA, USERPROFILE, …).
	// Required so Electron can resolve app.getPath('userData').
	var envBlock *uint16
	if err := windows.CreateEnvironmentBlock(&envBlock, userToken, false); err != nil {
		logWarn("CreateEnvironmentBlock: " + err.Error())
	} else {
		defer windows.DestroyEnvironmentBlock(envBlock)
	}

	err := windows.CreateProcessAsUser(
		userToken,
		exe,
		cmdLine,
		nil,
		nil,
		false,
		windows.CREATE_UNICODE_ENVIRONMENT,
		envBlock,
		workDir,
		&si,
		&pi,
	)
	if err != nil {
		return err
	}
	windows.CloseHandle(pi.Process)
	windows.CloseHandle(pi.Thread)
	return nil
}
