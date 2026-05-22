//go:build windows

package main

import (
	"os"
	"path/filepath"
	"sync"
	"time"

	"golang.org/x/sys/windows/svc"
	"golang.org/x/sys/windows/svc/mgr"
)

const (
	serviceName        = "RxConnectPrintService"
	serviceDisplayName = "Rx-Connect Print Service"
	serviceDescription = "Captures RxConnect virtual printer jobs and spools PDFs for Rx-Connect."
)

type printService struct {
	stop chan struct{}
	wg   sync.WaitGroup
}

func (s *printService) Execute(_ []string, r <-chan svc.ChangeRequest, status chan<- svc.Status) (bool, uint32) {
	status <- svc.Status{State: svc.StartPending}
	s.stop = make(chan struct{})
	initLogging()
	startPrintListener(s.stop, &s.wg)
	status <- svc.Status{State: svc.Running, Accepts: svc.AcceptStop | svc.AcceptShutdown}

loop:
	for {
		select {
		case <-s.stop:
			break loop
		case c := <-r:
			switch c.Cmd {
			case svc.Interrogate:
				status <- c.CurrentStatus
			case svc.Stop, svc.Shutdown:
				break loop
			default:
			}
		}
	}

	status <- svc.Status{State: svc.StopPending}
	close(s.stop)
	s.wg.Wait()
	status <- svc.Status{State: svc.Stopped}
	return false, 0
}

func runService() error {
	return svc.Run(serviceName, &printService{})
}

func runDebug() {
	initLogging()
	stop := make(chan struct{})
	var wg sync.WaitGroup
	startPrintListener(stop, &wg)
	logInfo("debug mode — listening for prints (kill process to exit)")
	select {}
}

func installService() error {
	exePath, err := os.Executable()
	if err != nil {
		return err
	}
	exePath, err = filepath.Abs(exePath)
	if err != nil {
		return err
	}

	m, err := mgr.Connect()
	if err != nil {
		return err
	}
	defer m.Disconnect()

	_ = m.RemoveService(serviceName)

	s, err := m.CreateService(serviceName, exePath, mgr.Config{
		DisplayName: serviceDisplayName,
		Description: serviceDescription,
		StartType:   mgr.StartAutomatic,
	})
	if err != nil {
		return err
	}
	defer s.Close()
	return s.Start()
}

func uninstallService() error {
	m, err := mgr.Connect()
	if err != nil {
		return err
	}
	defer m.Disconnect()

	s, err := m.OpenService(serviceName)
	if err != nil {
		return err
	}
	defer s.Close()

	status, err := s.Control(svc.Stop)
	if err == nil {
		timeout := time.Now().Add(15 * time.Second)
		for time.Now().Before(timeout) {
			st, qerr := s.Query()
			if qerr != nil || st.State == svc.Stopped {
				break
			}
			time.Sleep(400 * time.Millisecond)
			_ = status
		}
	}
	return s.Delete()
}
