import { app, Notification } from 'electron';
import log from 'electron-log';
import { autoUpdater } from 'electron-updater';
import type { UpdateGateState, UpdatePolicy } from '@rx-manager/shared';
import { broadcastUpdateGate, registerUpdateGateForwarder } from './update-gate-forwarder.js';
import {
  defaultForcedMessage,
  fetchUpdatePolicy,
  isBelowMinimumVersion,
} from './update-policy.js';
import { configureUpdateFeed } from './update-feed.js';

const TAG = '[update-service]';
const FORCED_INSTALL_DELAY_MS = 800;

const SUPPORTED_PLATFORMS = new Set(['win32', 'darwin']);

let gateState: UpdateGateState = createInitialGateState();
let forceUpdateActive = false;
let policy: UpdatePolicy | null = null;
let listenersBound = false;
let forcedInstallTimer: ReturnType<typeof setTimeout> | null = null;

function isUpdaterSupported(): boolean {
  if (process.env.RX_CONNECT_SKIP_UPDATER === '1') {
    return false;
  }
  return SUPPORTED_PLATFORMS.has(process.platform) && app.isPackaged;
}

function isBenignOptionalUpdateError(message: string): boolean {
  return /no published versions/i.test(message) || /could not find.*release/i.test(message);
}

function optionalUpdateError(message: string): string | null {
  return isBenignOptionalUpdateError(message) ? null : message;
}

function createInitialGateState(): UpdateGateState {
  return {
    status: 'idle',
    currentVersion: app.getVersion(),
    minimumVersion: null,
    requiredVersion: null,
    message: null,
    progress: null,
    error: null,
    pendingVersion: null,
    updateReady: false,
    lastUpdateError: null,
    supported: isUpdaterSupported(),
  };
}

function publishGate(partial: Partial<UpdateGateState>): void {
  gateState = { ...gateState, ...partial };
  broadcastUpdateGate(gateState);
}

function clearForcedInstallTimer(): void {
  if (forcedInstallTimer) {
    clearTimeout(forcedInstallTimer);
    forcedInstallTimer = null;
  }
}

function scheduleForcedInstall(): void {
  clearForcedInstallTimer();
  forcedInstallTimer = setTimeout(() => {
    log.info(`${TAG} forced quitAndInstall`);
    autoUpdater.quitAndInstall(false, true);
  }, FORCED_INSTALL_DELAY_MS);
}

function bindUpdaterListeners(): void {
  if (listenersBound) {
    return;
  }
  listenersBound = true;

  autoUpdater.on('checking-for-update', () => {
    log.info(`${TAG} checking-for-update`);
    if (forceUpdateActive) {
      publishGate({ status: 'checking', error: null, progress: null });
    } else {
      publishGate({ status: 'ok', progress: null, lastUpdateError: null });
    }
  });

  autoUpdater.on('update-available', (info) => {
    log.info(`${TAG} update-available`, info.version);
    if (forceUpdateActive) {
      publishGate({
        status: 'downloading',
        requiredVersion: info.version,
        progress: 0,
        error: null,
      });
    } else {
      publishGate({
        status: 'ok',
        pendingVersion: info.version,
        progress: 0,
        updateReady: false,
        lastUpdateError: null,
      });
    }
  });

  autoUpdater.on('update-not-available', () => {
    log.info(`${TAG} update-not-available`);
    if (forceUpdateActive) {
      publishGate({
        status: 'error',
        error: 'Required update could not be found. Please check your connection and retry.',
      });
    } else {
      publishGate({
        status: 'ok',
        pendingVersion: null,
        progress: null,
        updateReady: false,
      });
    }
  });

  autoUpdater.on('download-progress', (progress) => {
    const percent = Math.round(progress.percent);
    log.info(`${TAG} download-progress`, percent);
    if (forceUpdateActive) {
      publishGate({ status: 'downloading', progress: percent });
    } else {
      publishGate({
        status: 'ok',
        progress: percent,
        pendingVersion: gateState.pendingVersion,
        updateReady: false,
      });
    }
  });

  autoUpdater.on('error', (err) => {
    log.error(`${TAG} error`, err);
    if (forceUpdateActive) {
      publishGate({ status: 'error', error: err.message });
    } else {
      publishGate({
        status: 'ok',
        lastUpdateError: optionalUpdateError(err.message),
        updateReady: false,
      });
    }
  });

  autoUpdater.on('update-downloaded', (info) => {
    log.info(`${TAG} update-downloaded`, info.version);
    if (forceUpdateActive) {
      publishGate({
        status: 'ready',
        requiredVersion: info.version,
        progress: 100,
        error: null,
      });
      scheduleForcedInstall();
    } else {
      publishGate({
        status: 'ok',
        pendingVersion: info.version,
        progress: 100,
        updateReady: true,
        lastUpdateError: null,
      });
      showOptionalUpdateNotification(info.version);
    }
  });
}

function showOptionalUpdateNotification(version: string): void {
  try {
    if (Notification.isSupported()) {
      const n = new Notification({
        title: 'Rx-Manager update ready',
        body: `Version ${version} will install when you close the app, or click Restart now in the app banner.`,
      });
      n.show();
    }
  } catch (err) {
    log.warn(`${TAG} notification failed`, err);
  }
}

async function startForcedUpdateFlow(): Promise<void> {
  forceUpdateActive = true;
  autoUpdater.autoInstallOnAppQuit = false;
  autoUpdater.autoDownload = true;

  publishGate({
    status: 'required',
    minimumVersion: policy?.minimumVersion ?? null,
    message: policy?.message ?? defaultForcedMessage(),
    error: null,
    progress: null,
    requiredVersion: null,
    pendingVersion: null,
    updateReady: false,
    lastUpdateError: null,
  });

  try {
    await autoUpdater.checkForUpdates();
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Update check failed';
    publishGate({ status: 'error', error: message });
  }
}

async function startOptionalUpdateFlow(): Promise<void> {
  forceUpdateActive = false;
  autoUpdater.autoInstallOnAppQuit = true;
  autoUpdater.autoDownload = true;

  publishGate({
    status: 'ok',
    minimumVersion: policy?.minimumVersion ?? null,
    message: null,
    error: null,
    progress: null,
    requiredVersion: null,
    pendingVersion: null,
    updateReady: false,
    lastUpdateError: null,
  });

  void autoUpdater.checkForUpdates().catch((err) => {
    const message = err instanceof Error ? err.message : 'Update check failed';
    publishGate({
      status: 'ok',
      lastUpdateError: optionalUpdateError(message),
    });
  });
}

export function getUpdateGate(): UpdateGateState {
  return gateState;
}

export async function initializeUpdateService(): Promise<void> {
  gateState = createInitialGateState();
  registerUpdateGateForwarder(getUpdateGate);

  if (!isUpdaterSupported()) {
    publishGate({ status: 'ok', supported: false });
    return;
  }

  autoUpdater.logger = log;
  autoUpdater.allowDowngrade = false;
  autoUpdater.disableDifferentialDownload = true;

  await configureUpdateFeed(autoUpdater);
  bindUpdaterListeners();

  policy = await fetchUpdatePolicy();
  const current = app.getVersion();
  const minimum = policy?.minimumVersion;

  if (minimum && isBelowMinimumVersion(current, minimum)) {
    log.info(`${TAG} forced update`, { current, minimum });
    await startForcedUpdateFlow();
    return;
  }

  await startOptionalUpdateFlow();
}

export function checkForUpdates(): void {
  if (!isUpdaterSupported()) {
    return;
  }
  void autoUpdater.checkForUpdates().catch((err) => {
    log.error(`${TAG} manual check failed`, err);
    if (!forceUpdateActive) {
      const message = err instanceof Error ? err.message : 'Update check failed';
      publishGate({
        status: 'ok',
        lastUpdateError: optionalUpdateError(message),
      });
    }
  });
}

export function installPendingUpdateNow(): void {
  if (!isUpdaterSupported() || !gateState.updateReady) {
    return;
  }
  autoUpdater.quitAndInstall(false, true);
}

export async function retryForcedUpdate(): Promise<void> {
  if (!isUpdaterSupported()) {
    return;
  }
  clearForcedInstallTimer();
  policy = await fetchUpdatePolicy();
  const current = app.getVersion();
  const minimum = policy?.minimumVersion;

  if (minimum && isBelowMinimumVersion(current, minimum)) {
    await startForcedUpdateFlow();
    return;
  }

  await startOptionalUpdateFlow();
}
