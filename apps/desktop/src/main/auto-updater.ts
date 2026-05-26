/** @deprecated Import from update-service.js instead. Kept for backward-compatible imports. */
export {
  checkForUpdates,
  getUpdateGate,
  getUpdateGate as getUpdateCapabilities,
  initializeUpdateService,
  initializeUpdateService as initAutoUpdater,
  installPendingUpdateNow,
  installPendingUpdateNow as quitAndInstallUpdate,
  retryForcedUpdate,
} from './update-service.js';
