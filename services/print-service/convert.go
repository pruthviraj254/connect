package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func convertRawToPdf(rawPath, pdfPath string) bool {
	gs := ghostscriptPath()
	if gs == "" {
		return false
	}
	if _, err := os.Stat(gs); err != nil {
		logWarn("ghostscript not found at " + gs)
		return false
	}
	cmd := exec.Command(gs,
		"-dNOPAUSE", "-dBATCH", "-dSAFER",
		"-sDEVICE=pdfwrite",
		"-sOutputFile="+pdfPath,
		rawPath,
	)
	cmd.Dir = filepath.Dir(gs)
	out, err := cmd.CombinedOutput()
	if err != nil {
		logWarn(fmt.Sprintf("gs failed: %v %s", err, string(out)))
		return false
	}
	st, err := os.Stat(pdfPath)
	return err == nil && st.Size() > 0
}
