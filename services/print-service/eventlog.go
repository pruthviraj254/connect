//go:build windows

package main

import (
	"golang.org/x/sys/windows/svc/eventlog"
)

func writeEventLog(msg string) {
	elog, err := eventlog.Open(serviceName)
	if err != nil {
		_ = eventlog.InstallAsEventCreate(serviceName, eventlog.Error|eventlog.Warning|eventlog.Info)
		elog, err = eventlog.Open(serviceName)
		if err != nil {
			return
		}
	}
	defer elog.Close()
	_ = elog.Error(1, msg)
}
