/**
 * Single source of truth for IPC channel names (invoke/handle).
 * Plain `as const` object (not `const enum`) so renderer + isolatedModules can import values.
 */
export const IpcChannel = {
  AppGetVersion: 'app:get-version',
  AppGetPath: 'app:get-path',
  AppSetBadgeCount: 'app:set-badge-count',
  AppShowNotification: 'app:show-notification',
  AppSetLoginItemOpenAtLogin: 'app:set-login-item-open-at-login',
  AppGetOnlineStatus: 'app:get-online-status',

  AuthLogin: 'auth:login',
  AuthRegister: 'auth:register',
  AuthLogout: 'auth:logout',
  AuthRefresh: 'auth:refresh',
  AuthRequestPasswordReset: 'auth:request-password-reset',

  UserGetProfile: 'user:get-profile',

  RxList: 'rx:list',
  RxGet: 'rx:get',

  TenantsList: 'tenants:list',
  TenantsGet: 'tenants:get',

  FaxSend: 'fax:send',
  FaxList: 'fax:list',

  BlacklistList: 'blacklist:list',
  BlacklistAdd: 'blacklist:add',

  ApiLogsList: 'api-logs:list',

  SettingsGet: 'settings:get',
  SettingsSet: 'settings:set',

  StoreGet: 'store:get',
  StoreSet: 'store:set',
  StoreDelete: 'store:delete',

  SecretsGet: 'secrets:get',
  SecretsSet: 'secrets:set',
  SecretsDelete: 'secrets:delete',

  DialogOpenFile: 'dialog:open-file',
  DialogSaveFile: 'dialog:save-file',
} as const;

export type IpcChannel = (typeof IpcChannel)[keyof typeof IpcChannel];
