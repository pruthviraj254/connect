import { registerAppHandlers } from './handlers/app.js';
import { registerAuthHandlers } from './handlers/auth.js';
import { registerUserHandlers } from './handlers/user.js';
import { registerRxHandlers } from './handlers/rx.js';
import { registerTenantsHandlers } from './handlers/tenants.js';
import { registerFaxHandlers } from './handlers/fax.js';
import { registerBlacklistHandlers } from './handlers/blacklist.js';
import { registerApiLogsHandlers } from './handlers/api-logs.js';
import { registerSettingsHandlers } from './handlers/settings.js';
import { registerStoreHandlers } from './handlers/store.js';
import { registerSecretsHandlers } from './handlers/secrets.js';
import { registerPrintJobHandlers } from './handlers/print-job.js';

export function registerIpcHandlers(): void {
  registerAppHandlers();
  registerAuthHandlers();
  registerUserHandlers();
  registerRxHandlers();
  registerTenantsHandlers();
  registerFaxHandlers();
  registerPrintJobHandlers();
  registerBlacklistHandlers();
  registerApiLogsHandlers();
  registerSettingsHandlers();
  registerStoreHandlers();
  registerSecretsHandlers();
}
