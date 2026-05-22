package main

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"os"
	"path/filepath"
	"time"
)

func pdfByteOffset(body []byte) int {
	marker := []byte("%PDF-")
	return bytesIndex(body, marker)
}

func bytesIndex(haystack, needle []byte) int {
	if len(needle) == 0 || len(haystack) < len(needle) {
		return -1
	}
	for i := 0; i <= len(haystack)-len(needle); i++ {
		match := true
		for j := range needle {
			if haystack[i+j] != needle[j] {
				match = false
				break
			}
		}
		if match {
			return i
		}
	}
	return -1
}

type persistResult struct {
	PDFPath  string
	FileName string
}

func persistRawJob(body []byte) (*persistResult, error) {
	if len(body) == 0 {
		return nil, fmt.Errorf("empty payload")
	}
	dir := spoolDir()
	if err := os.MkdirAll(dir, 0o755); err != nil {
		return nil, err
	}
	stamp := time.Now().UnixMilli()
	var idBuf [4]byte
	_, _ = rand.Read(idBuf[:])
	id := hex.EncodeToString(idBuf[:])
	base := filepath.Join(dir, fmt.Sprintf("raw_%d_%s", stamp, id))

	offset := pdfByteOffset(body)
	payload := body
	if offset > 0 {
		payload = body[offset:]
	}

	if len(payload) >= 5 && string(payload[:5]) == "%PDF-" {
		pdfPath := base + ".pdf"
		if err := os.WriteFile(pdfPath, payload, 0o644); err != nil {
			return nil, err
		}
		logInfo(fmt.Sprintf("saved pdf %s (%d bytes)", pdfPath, len(payload)))
		return &persistResult{PDFPath: pdfPath, FileName: filepath.Base(pdfPath)}, nil
	}

	rawPath := base + ".bin"
	if err := os.WriteFile(rawPath, body, 0o644); err != nil {
		return nil, err
	}
	logInfo(fmt.Sprintf("saved raw %s (%d bytes)", rawPath, len(body)))

	pdfPath := base + ".pdf"
	if convertRawToPdf(rawPath, pdfPath) {
		logInfo(fmt.Sprintf("converted to %s", pdfPath))
		return &persistResult{PDFPath: pdfPath, FileName: filepath.Base(pdfPath)}, nil
	}

	logWarn("ghostscript conversion failed; keeping .bin only")
	return &persistResult{PDFPath: rawPath, FileName: filepath.Base(rawPath)}, nil
}
