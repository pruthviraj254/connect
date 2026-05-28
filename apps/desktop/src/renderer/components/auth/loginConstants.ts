export const FORGOT_PASSWORD_URL =
  process.env.NEXT_PUBLIC_FORGOT_PASSWORD_URL ?? "https://portal.myonerx.com";

/** Caption under the login hero animation (left panel). */
export const LOGIN_HERO_CAPTION =
  "Your pharmacy fax desk — virtual printer, inbox, outbound send & call activity in one app.";

/**
 * In-app privacy statement route. Trailing slash matches the rest of the
 * Next.js static export (next.config.ts: `trailingSlash: true`).
 */
export const PRIVACY_URL = "/privacy/";
