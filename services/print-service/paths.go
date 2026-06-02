package main

import (
	"os"
	"path/filepath"
)

const rawPrintPort = 19101

func spoolDir() string {
	return filepath.Join(programDataRoot(), "Rx-Connect", "print-spool")
}

func installRootFromExe() string {
	exe, err := os.Executable()
	if err != nil {
		return ""
	}
	// .../resources/print-service/rxconnect-print-service.exe -> install root
	dir := filepath.Dir(exe)
	if filepath.Base(dir) == "print-service" {
		dir = filepath.Dir(dir)
	}
	if filepath.Base(dir) == "resources" {
		return filepath.Dir(dir)
	}
	return dir
}

func ghostscriptPath() string {
	root := installRootFromExe()
	if root == "" {
		return ""
	}
	return filepath.Join(root, "resources", "ghostscript-win", "bin", "gswin64c.exe")
}

func appExecutablePath() string {
	root := installRootFromExe()
	if root == "" {
		return ""
	}
	return filepath.Join(root, "rx-manager.exe")
}
