import type { ElectronAPI } from '@rx-manager/shared';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
