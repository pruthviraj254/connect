# Rx-Connect — Portal auth & device binding

## Platform string

Portal login must send:

```json
{ "platform": "rx-connect" }
```

## Device binding

Rx-Connect sends a stable **Workstation ID** as `deviceId` on every login (same algorithm as RXScribe_FE: Windows MachineGuid hash, or persisted `device-id.txt` under Electron `userData`).

- Resolved in **main** only (`apps/desktop/src/main/services/machineId.ts`).
- Login body: `deviceId: getMachineId()` inside `authService.login()` — renderer sends only `email`, `password`, `rememberSession`.
- UI label: **Workstation ID** via `window.api.app.getMachineId()`.

Confirm with backend that `rx-connect` accepts `deviceId` without breaking login.

## Architecture

| Layer    | Responsibility                                                              |
| -------- | --------------------------------------------------------------------------- |
| Main     | Portal + product HTTP (`httpClient.ts`), tokens in keytar (`tokenStore.ts`) |
| Preload  | `window.api.auth.*`, `window.api.app.getMachineId()`                        |
| Renderer | Session profile in Zustand only — **no JWT in localStorage**                |

## Environment (main)

| Variable                               | Purpose                                                                                              |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| `RX_CONNECT_PORTAL_API_BASE_URL`       | `POST /api/auth/login`, refresh, logout                                                              |
| `RX_CONNECT_API_BASE_URL`              | Product API (CDR, etc.)                                                                              |
| `RX_CONNECT_HTTP_TIMEOUT_MS`           | Request timeout                                                                                      |
| `RX_CONNECT_INGEST_SECRET`             | CDR ingest header (main only)                                                                        |
| `NEXT_PUBLIC_RX_CONNECT_INGEST_SECRET` | Same ingest key baked into renderer at build (CI sets this from `RX_CONNECT_INGEST_SECRET` secret)   |
| `RX_CONNECT_DEV_SKIP_AUTH`             | Skip login: local unpackaged dev, or **staging CI builds** (baked at compile time; never production) |

## Renderer (non-secret)

| Variable                               | Purpose                            |
| -------------------------------------- | ---------------------------------- |
| `NEXT_PUBLIC_FORGOT_PASSWORD_URL`      | External forgot-password link      |
| `NEXT_PUBLIC_RX_CONNECT_DEV_SKIP_AUTH` | Show dev skip button on login form |

## Dev skip (temporary)

Until portal login for `rx-connect` is live:

**Local dev:** set in repo-root `.env`:

1. `RX_CONNECT_DEV_SKIP_AUTH=true`
2. `NEXT_PUBLIC_RX_CONNECT_DEV_SKIP_AUTH=true`

**Staging installer (CI):** staging workflows set both vars to `'true'`. Main bakes `__RX_DEV_SKIP_AUTH__` only when `RX_CONNECT_CHANNEL=staging` — production builds ignore skip even if env is mis-set.

Use **Developer: Continue without sign-in** on `/login/`.

**Never enable skip on production** (`main` workflows / `v*` tags without `-staging`).

## Session expiry

Main surfaces `[SESSION_EXPIRED]` over IPC. Renderer calls `useAuthStore.getState().expireSession()` and redirects to `/login/`.
