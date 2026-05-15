import type { ElectronAPI } from '@rx-connect/shared';

declare global {
  interface Window {
    electronAPI: ElectronAPI;
  }
}

export {};
