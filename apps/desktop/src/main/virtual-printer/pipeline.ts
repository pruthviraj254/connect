import { startSpoolWatchers, stopSpoolWatchers } from './watcher.js';
import { startRawPrintServer, stopRawPrintServer } from './raw-print-server.js';

let pipelineStarted = false;

export async function startPrintPipeline(): Promise<void> {
  if (pipelineStarted) {
    return;
  }
  pipelineStarted = true;
  await startSpoolWatchers();
  startRawPrintServer();
}

export function stopPrintPipeline(): void {
  if (!pipelineStarted) {
    return;
  }
  pipelineStarted = false;
  stopSpoolWatchers();
  stopRawPrintServer();
}
