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
import { registerPrinterHandlers } from './handlers/printer.js';
import { registerWebsiteBuilderHandlers } from './handlers/website-builder.js';
import { registerUpdaterHandlers } from './handlers/updater.js';
import { registerContactsHandlers } from './handlers/contacts.js';
import { registerFaxPopupHandlers } from './handlers/fax-popup.js';
import { registerCdrHandlers } from './handlers/cdr.js';

export function registerIpcHandlers(): void {
  registerAppHandlers();
  registerAuthHandlers();
  registerUserHandlers();
  registerRxHandlers();
  registerTenantsHandlers();
  registerFaxHandlers();
  registerPrintJobHandlers();
  registerPrinterHandlers();
  registerBlacklistHandlers();
  registerApiLogsHandlers();
  registerSettingsHandlers();
  registerStoreHandlers();
  registerSecretsHandlers();
  registerWebsiteBuilderHandlers();
  registerUpdaterHandlers();
  registerContactsHandlers();
  registerFaxPopupHandlers();
  registerCdrHandlers();
}
