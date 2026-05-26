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

  UpdateCheck: 'update:check',
  UpdateQuitAndInstall: 'update:quit-and-install',
  UpdateGetCapabilities: 'update:get-capabilities',

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
  FaxSendLogList: 'fax:send-log:list',
  FaxSendLogClear: 'fax:send-log:clear',

  ContactsList: 'contacts:list',
  ContactsAdd: 'contacts:add',
  ContactsDelete: 'contacts:delete',

  FaxPopupGetJob: 'fax-popup:get-job',
  FaxPopupClose: 'fax-popup:close',
  FaxPopupBrowsePdf: 'fax-popup:browse-pdf',

  PrintJobList: 'print-job:list',
  PrintJobGetPdfBase64: 'print-job:get-pdf-base64',
  PrintJobGetPreviewPath: 'print-job:get-preview-path',
  PrintJobGetPagePngs: 'print-job:get-page-pngs',
  PrintJobDownload: 'print-job:download',
  PrintJobDelete: 'print-job:delete',

  PrinterGetStatus: 'printer:get-status',
  PrinterInstall: 'printer:install',

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

  WebBuilderInit: 'website-builder:init',
  WebBuilderBuild: 'website-builder:build',
  WebBuilderPreview: 'website-builder:preview',
  WebBuilderStopPreview: 'website-builder:stop-preview',
  WebBuilderPublish: 'website-builder:publish',
  WebBuilderSave: 'website-builder:save',
  WebBuilderLoad: 'website-builder:load',
  WebBuilderDeployConfigured: 'website-builder:deploy-configured',
} as const;

export type IpcChannel = (typeof IpcChannel)[keyof typeof IpcChannel];
