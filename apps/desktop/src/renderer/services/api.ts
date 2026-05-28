/**
 * Renderer API facades — NEVER call fetch/axios directly for production Electron paths.
 * Delegate to window.api.* IPC bridges; main process owns HTTP and secrets.
 */

export {};
