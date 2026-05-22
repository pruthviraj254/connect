# Cross-compile Windows print service from macOS/Linux CI or dev machine.
BINARY=rxconnect-print-service.exe
OUT=../../apps/desktop/resources/print-service/$(BINARY)

.PHONY: build clean

build:
	GOOS=windows GOARCH=amd64 CGO_ENABLED=0 go build -ldflags="-s -w" -o $(OUT) .

clean:
	rm -f $(OUT)
