package main

import (
	"fmt"
	"os"
	"path/filepath"
	"sync"
	"time"
)

const serviceLogName = "service.log"

var (
	logMu   sync.Mutex
	logFile *os.File
)

func initLogging() {
	logMu.Lock()
	defer logMu.Unlock()
	if logFile != nil {
		return
	}
	dir := filepath.Join(programDataRoot(), "Rx-Connect", "logs")
	_ = os.MkdirAll(dir, 0o755)
	path := filepath.Join(dir, serviceLogName)
	f, err := os.OpenFile(path, os.O_APPEND|os.O_CREATE|os.O_WRONLY, 0o644)
	if err != nil {
		return
	}
	logFile = f
}

func logLine(level, msg string) {
	line := fmt.Sprintf("%s [%s] %s\n", time.Now().UTC().Format(time.RFC3339), level, msg)
	logMu.Lock()
	defer logMu.Unlock()
	if logFile != nil {
		_, _ = logFile.WriteString(line)
	}
	if level == "ERROR" {
		writeEventLog(msg)
	}
}

func logInfo(msg string)  { logLine("INFO", msg) }
func logWarn(msg string)  { logLine("WARN", msg) }
func logError(msg string) { logLine("ERROR", msg) }

func programDataRoot() string {
	if v := os.Getenv("ProgramData"); v != "" {
		return v
	}
	return `C:\ProgramData`
}
