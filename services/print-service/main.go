//go:build windows

package main

import (
	"flag"
	"fmt"
	"os"

	"golang.org/x/sys/windows/svc"
)

func main() {
	install := flag.Bool("install", false, "install Windows service")
	uninstall := flag.Bool("uninstall", false, "remove Windows service")
	debug := flag.Bool("run", false, "run listener in foreground (debug)")
	flag.Parse()

	initLogging()

	if *install {
		if err := installService(); err != nil {
			fmt.Fprintf(os.Stderr, "install failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("installed", serviceName)
		return
	}

	if *uninstall {
		if err := uninstallService(); err != nil {
			fmt.Fprintf(os.Stderr, "uninstall failed: %v\n", err)
			os.Exit(1)
		}
		fmt.Println("uninstalled", serviceName)
		return
	}

	if *debug {
		runDebug()
		os.Exit(0)
	}

	isService, err := svc.IsWindowsService()
	if err != nil {
		fmt.Fprintf(os.Stderr, "service check: %v\n", err)
		os.Exit(1)
	}
	if isService {
		if err := runService(); err != nil {
			logError("service run: " + err.Error())
			os.Exit(1)
		}
		return
	}

	// Interactive: run debug listener
	runDebug()
}
