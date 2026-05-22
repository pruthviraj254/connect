package main

import (
	"bytes"
	"fmt"
	"net"
	"sync"
	"time"
)

const jobIdleMs = 400

func startPrintListener(stop <-chan struct{}, wg *sync.WaitGroup) {
	wg.Add(1)
	go func() {
		defer wg.Done()
		ln, err := net.Listen("tcp", fmt.Sprintf("127.0.0.1:%d", rawPrintPort))
		if err != nil {
			logError("listen failed: " + err.Error())
			return
		}
		logInfo(fmt.Sprintf("listening on 127.0.0.1:%d spool=%s", rawPrintPort, spoolDir()))
		defer ln.Close()

		go func() {
			<-stop
			_ = ln.Close()
		}()

		for {
			conn, err := ln.Accept()
			if err != nil {
				select {
				case <-stop:
					return
				default:
					logWarn("accept: " + err.Error())
					continue
				}
			}
			go handlePrintConn(conn)
		}
	}()
}

func handlePrintConn(conn net.Conn) {
	defer conn.Close()
	remote := conn.RemoteAddr().String()
	logInfo("connection from " + remote)

	var chunks [][]byte
	var mu sync.Mutex
	finished := false
	var idleTimer *time.Timer

	finish := func() {
		mu.Lock()
		if finished {
			mu.Unlock()
			return
		}
		finished = true
		if idleTimer != nil {
			idleTimer.Stop()
		}
		mu.Unlock()

		body := bytes.Join(chunks, nil)
		logInfo(fmt.Sprintf("job complete from %s, %d bytes", remote, len(body)))
		result, err := persistRawJob(body)
		if err != nil {
			logError("persist failed: " + err.Error())
			return
		}
		logInfo("print job captured: " + result.PDFPath)
		tryLaunchApp()
	}

	scheduleIdle := func() {
		mu.Lock()
		defer mu.Unlock()
		if finished {
			return
		}
		if idleTimer != nil {
			idleTimer.Stop()
		}
		idleTimer = time.AfterFunc(jobIdleMs*time.Millisecond, finish)
	}

	buf := make([]byte, 64*1024)
	for {
		n, err := conn.Read(buf)
		if n > 0 {
			chunk := make([]byte, n)
			copy(chunk, buf[:n])
			mu.Lock()
			chunks = append(chunks, chunk)
			mu.Unlock()
			scheduleIdle()
		}
		if err != nil {
			if len(chunks) > 0 {
				scheduleIdle()
			}
			return
		}
	}
}
