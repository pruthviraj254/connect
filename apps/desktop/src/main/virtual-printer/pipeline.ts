import { startSpoolWatchers, stopSpoolWatchers } from './watcher.js';
import { startRawPrintServer, stopRawPrintServer } from './raw-print-server.js';

let pipelineStarted = false;

export async function startPrintPipeline(): Promise<void> {
  if (pipelineStarted) {
    return;
  }
  pipelineStarted = true;
  await startSpoolWatchers();
  // Windows: RxConnectPrintService owns TCP 127.0.0.1:19101; Electron watches spool only.
  if (process.platform !== 'win32') {
    startRawPrintServer();
  }
}

export function stopPrintPipeline(): void {
  if (!pipelineStarted) {
    return;
  }
  pipelineStarted = false;
  stopSpoolWatchers();
  stopRawPrintServer();
}
