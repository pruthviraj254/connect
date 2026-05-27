/** True when the renderer was built with NEXT_PUBLIC_APP_ENV=staging. */
export function isStagingApp(): boolean {
  return process.env.NEXT_PUBLIC_APP_ENV === 'staging';
}

/** Baked API base URL (production or staging). */
export { getApiBaseUrl } from '@/lib/call-log/constants';
