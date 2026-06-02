# Rx-Manager — Codebase context (handoff / AI context)

> **Purpose:** Single snapshot of how this monorepo is structured, how Next.js and Electron interact, how builds and dev work, and known behavioral notes. Update this file when architecture changes.

---

## 1. What this repo is

- **Product:** Rx-Manager — OneRx desktop operator app (healthcare / pharmacy tooling). Rx-Connect is a sub-module (fax, VoIP, print).
- **Stack:** **pnpm workspaces** + **Turborepo** + **Electron Forge** (Vite plugin) + **Next.js 14 App Router** (static export) + **TypeScript strict**.
- **Workspace root:** `rx-manager` (root `package.json`). Real app lives in **`apps/desktop`**. Shared types/IPC live in **`packages/shared`** (`@rx-manager/shared`).

---

## 2. Monorepo layout (mental map)

```
rx-manager/                          # workspace root — turbo, husky, eslint, prettier
├── pnpm-workspace.yaml              # packages: apps/*, packages/*
├── turbo.json                       # pipeline: build, dev, lint, typecheck, test
├── .npmrc                           # node-linker=hoisted (needed for Electron Forge + pnpm)
├── context.md                       # this file
├── apps/
│   └── desktop/                     # @rx-manager/desktop — Electron + Next
│       ├── package.json             # main: ".vite/build/main.js"
│       ├── forge.config.ts          # Forge makers + Vite plugin + packageAfterCopy hook
│       ├── vite.main.config.ts
│       ├── vite.preload.config.ts
│       ├── vite.renderer.config.ts  # points at renderer-shell (Forge requirement)
│       ├── src/
│       │   ├── main.ts              # thin entry → imports ./main/bootstrap.js
│       │   ├── main/
│       │   │   ├── bootstrap.ts     # app lifecycle, window, app:// protocol, CSP, IPC register
│       │   │   ├── menu.ts
│       │   │   ├── store.ts         # electron-store
│       │   │   ├── lifecycle.ts     # main window ref
│       │   │   ├── tray.ts          # stub / minimal
│       │   │   └── ipc/             # ipcMain handlers per domain
│       │   ├── preload.ts           # thin entry → imports ./preload/bootstrap.js
│       │   ├── preload/
│       │   │   ├── bootstrap.ts     # contextBridge electronAPI + allowlisted invoke
│       │   │   └── api.d.ts         # Window augmentation (types)
│       │   ├── renderer-shell/      # minimal Vite “renderer” for Forge only — NOT the product UI
│       │   └── renderer/            # Next.js App Router app (the real UI)
│       │       ├── next.config.mjs  # output: 'export', trailingSlash — NO assetPrefix (see §7)
│       │       ├── app/             # routes, layouts, providers
│       │       ├── components/
│       │       ├── lib/             # api client stub, ipc wrapper, utils, mock-data
│       │       ├── store/           # zustand (auth, ui)
│       │       └── out/             # produced by `next build` (static export) — gitignored when built
│       ├── e2e/                     # Playwright (currently placeholder smoke)
│       └── out/                     # Electron Forge output (packaged app, make artifacts)
└── packages/
    └── shared/                      # @rx-manager/shared — IPC enum, ElectronAPI type, utils
        └── src/
            ├── ipc-channels.ts      # IpcChannel const enum (single source of truth)
            ├── types/
            └── index.ts             # public exports; build emits dist/
```

---

## 3. Why two “bundlers”: Vite vs Next

| Tool                                         | What it builds                                                                                                                        |
| -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| **Vite** (via `@electron-forge/plugin-vite`) | **Electron main** (`main.js`) and **preload** (`preload.js`). Optional tiny **renderer-shell** bundle for Forge’s `main_window` slot. |
| **Next** (`next build`)                      | The **operator UI**: React App Router → static **HTML/CSS/JS** under `src/renderer/out/`.                                             |

Next does **not** compile `main` or `preload`. Vite does **not** compile the Next app.

---

## 4. How Electron loads the UI

### Development

1. `pnpm dev` (in `apps/desktop`) runs **concurrently**:
   - **`dev:renderer`:** `next dev -p 3000` from `src/renderer/`.
   - **`dev:electron`:** waits on `http://127.0.0.1:3000`, then `electron-forge start` with **`ELECTRON_RENDERER_URL=http://127.0.0.1:3000`**.
2. **`bootstrap.ts`** sees `ELECTRON_RENDERER_URL` → **`loadURL(devUrl)`** → window shows **Next dev server** (HMR, etc.).

### Production (packaged `.app` / `.dmg`)

1. **`next build`** with `output: 'export'` writes static site to **`apps/desktop/src/renderer/out/`**.
2. **`electron-forge make`** (or `package`) runs Vite production build for main/preload, packages the app.
3. **`forge.config.ts` → `packageAfterCopy`:** copies `src/renderer/out` → **`renderer-out/`** inside the packaged application resources (next to asar content layout Forge uses).
4. **`bootstrap.ts`** with no `ELECTRON_RENDERER_URL` → **`loadURL('app://rxconnect/')`**.
5. **`protocol.registerSchemesAsPrivileged` + `protocol.handle('app', …)`** maps each `app://rxconnect/...` request to a **file under `renderer-out/`**, with explicit **MIME types** (CSS/JS/fonts). This avoids:
   - **`file://`** + Next client routes breaking (`/home` resolving wrong).
   - **`assetPrefix: './'`** + `app://` breaking asset paths (CSS 404 under `home/_next/...`).

**Important:** Do **not** set `assetPrefix: './'` for this Electron + `app://` setup; use default absolute **`/_next/...`** asset URLs.

---

## 5. Electron entrypoints (why thin `main.ts` / `preload.ts`)

Forge/Vite names bundles from the **entry file basename**. Entries are:

- `src/main.ts` → `import './main/bootstrap.js'` → output **`main.js`** (matches `package.json` `"main"`).
- `src/preload.ts` → `import './preload/bootstrap.js'` → output **`preload.js`** (matches `path.join(__dirname, 'preload.js')` in `BrowserWindow`).

Logic lives in **`bootstrap.ts`** files under `main/` and `preload/`.

---

## 6. `renderer-shell/` — why it exists

Electron Forge’s **Vite plugin** declares a **renderer** target (`main_window` in `forge.config.ts`). That target must point at **some** small Vite project (`renderer-shell/`). The **product UI** is entirely **Next** in `src/renderer/`. In dev, the visible UI is **localhost:3000**, not the shell. In prod, the visible UI is **`app://`** → **`renderer-out/`** (Next export), not the shell.

---

## 7. Builds and artifacts (commands)

| Command (where)                               | Effect                                                                                                         |
| --------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| **Root:** `pnpm install`                      | Installs all workspaces; use hoisted linker (`.npmrc`).                                                        |
| **Root:** `pnpm dev`                          | Turbo runs `dev` in packages that define it (e.g. desktop + shared watch).                                     |
| **`apps/desktop`:** `pnpm dev`                | Next on **:3000** + Electron loading that URL.                                                                 |
| **`apps/desktop`:** `pnpm run build:shared`   | Builds `@rx-manager/shared` → `packages/shared/dist/` (main/preload import the built package in packaged app). |
| **`apps/desktop`:** `pnpm run build:renderer` | `next build` → **`src/renderer/out/`**.                                                                        |
| **`apps/desktop`:** `pnpm run build:electron` | `electron-forge package` (Vite build **`.vite/build/main.js`**, `preload.js` + package).                       |
| **`apps/desktop`:** `pnpm make`               | `build:shared` + `build:renderer` + **`electron-forge make`** → installers under **`apps/desktop/out/make/`**. |

**Platform note:** **`pnpm make` on macOS** produces **`.dmg`** (and packaged `.app`). **Windows Squirrel `.exe`** is produced when **`pnpm make` runs on Windows** (or CI `windows-latest`), not from macOS in the default Forge setup.

---

## 8. IPC and shared package

- **`packages/shared`:** `IpcChannel` is a **`const` object + string union type** (not `const enum`) so the Next renderer can import values under **`isolatedModules`**. Also **`IpcResult`**, **`ElectronAPI`**, auth IPC types. Built to **`dist/`**.
- **Preload (`preload/bootstrap.ts`):** **`window.electronAPI.invoke`** allowlist = **`new Set(Object.values(IpcChannel))`**.
- **Main (`main/ipc/`):** handlers per domain. **Auth** uses **`main/auth-temp-db.ts`** (in-memory users + sessions; replace with real API).
- **Renderer (`lib/ipc/index.ts`):** `ipcInvoke` helper — throws if not inside Electron.

Renderer must **not** `require('electron')` directly; only **`window.electronAPI`**.

---

## 9. Renderer app structure (Next)

- **`src/renderer/app/`** — `(auth)/` layout redirects to **`/home/`** if session exists; **`(dashboard)/`** uses **`AuthGuard`** + **`Shell`** (requires token).
- **`app/page.tsx` (client):** after persist hydration → **`/home/`** if token else **`/login/`**.
- **Auth:** IPC **`auth:login`**, **`auth:logout`**, **`auth:request-password-reset`**; **`lib/auth/auth-actions.ts`**. Forgot flow (temp): rotates password, shows temp password in toast. **`useAuthStore`** (`rx-connect-auth-v2`) + **`setApiAuthToken`** in **`lib/api/client.ts`**.
- **TanStack Query** + mock feature data elsewhere until REST is wired.

---

## 10. Security defaults (high level)

- **`contextIsolation: true`**, **`nodeIntegration: false`**, **`sandbox: true`**, **`webSecurity: true`** on `BrowserWindow`.
- **CSP** set in main via `session.webRequest.onHeadersReceived` — includes **`app:`** for the custom scheme.
- **Deep link:** `rxconnect://` registered; **`app://`** is separate (static UI serving).

---

## 11. Testing / quality

- **Vitest:** unit tests under `src/renderer/**/*.test.tsx` (smoke tests on a few components).
- **Playwright:** `e2e/smoke.spec.ts` is largely **placeholder** until real E2E is added.
- **Typecheck:** desktop runs `tsc` for main/preload + renderer tsconfigs. Root **`pnpm typecheck`** uses Turbo (shared build may run first per `turbo.json`).

---

## 12. Env vars

See **`.env.example`** at repo root (`NEXT_PUBLIC_APP_ENV`, `NEXT_PUBLIC_API_BASE_URL`, optional Sentry). `NEXT_PUBLIC_*` are inlined at **Next build** time.

---

## 13. Known gaps / follow-ups (for roadmap)

- Real **HTTP API** for non-auth domains; replace **`auth-temp-db.ts`** with backend (or renderer-only **`apiClient`** if policy allows).
- **Forgot password:** real email / token URL (remove **`devTemporaryPassword`** from IPC).
- **Secrets:** keychain if tokens must not live in renderer.
- **CI:** GitHub Actions for lint/test/build/release (may be deferred).
- **Zustand persist → electron-store** via IPC if you want desktop-only persistence without localStorage reliance in packaged quirks.
- **E2E** against packaged app or at least `next start` + Electron patterns.

---

## 14. Quick “one paragraph” summary

> **pnpm + Turborepo** monorepo. **`apps/desktop`**: Forge + Vite (**`main.js` / `preload.js`**), Next static export (**`src/renderer/out/`** → packaged **`renderer-out/`**), prod UI via **`app://rxconnect/`** + **`protocol.handle`**, dev UI via **localhost:3000**. **`packages/shared`**: **`IpcChannel`** as **`as const` object**. **`renderer-shell`**: Forge Vite slot. **Auth (temp):** **`main/auth-temp-db.ts`**, IPC login/logout/password-reset, **`AuthGuard`**, root routes by session.

---

_Last updated: reflect current repo state when merging significant changes._
