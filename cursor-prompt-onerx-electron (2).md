## Project Mission

You are building a **production-grade Electron desktop application** for a healthcare/pharmacy company called **OneRx**. The app is named **Rx-Connect**. It must port every feature from the existing web app at `/Users/prithvi/Developer/OneRx/Rx-connect` into a native desktop experience.

The stack is **Electron Forge + Next.js (React)** with TypeScript throughout. The codebase must be immediately team-handoffable: clean architecture, enforced linting, consistent patterns, zero shortcuts.

---

## Tech Stack — Non-Negotiable


| Layer              | Choice                                                                                 |
| ------------------ | -------------------------------------------------------------------------------------- |
| Desktop shell      | Electron (latest stable) via **Electron Forge**                                        |
| Frontend framework | **Next.js 14+ (App Router)** — exported as static (`output: 'export'`)                 |
| Language           | **TypeScript strict mode** everywhere (main + renderer + shared)                       |
| Styling            | **Tailwind CSS** + CSS Modules for component-level scoping                             |
| State management   | **Zustand** (global) + React Query / TanStack Query (server/async state)               |
| Forms              | **React Hook Form** + **Zod** for validation                                           |
| Component library  | **shadcn/ui** (Radix primitives) — do not use MUI or Chakra                            |
| IPC layer          | Type-safe IPC bridge with `ipcMain` / `ipcRenderer` via a shared `preload.ts` contract |
| Packaging          | **Electron Forge** makers: `@electron-forge/maker-dmg`, `maker-squirrel`, `maker-deb`  |
| Linting            | ESLint (Airbnb-TS config) + Prettier                                                   |
| Git hooks          | Husky + lint-staged                                                                    |
| Testing            | Vitest (unit) + Playwright (e2e)                                                       |
| Logging            | **electron-log** (main) + Sentry (renderer, optional env toggle)                       |
| CI/CD              | GitHub Actions — build, sign, publish on tag push                                      |


---

## Monorepo Folder Structure

Create this exact structure. Do not deviate.

```
rx-connect/
├── .github/
│   └── workflows/
│       ├── ci.yml                  # lint + test on PR
│       └── release.yml             # build + sign + publish on tag
├── apps/
│   └── desktop/                    # Electron Forge project root
│       ├── forge.config.ts         # Electron Forge config (makers, plugins, publishers)
│       ├── electron-builder.yml    # electron-builder config (auto-update, signing)
│       ├── package.json
│       ├── tsconfig.json
│       ├── src/
│       │   ├── main/               # Electron main process
│       │   │   ├── index.ts        # Entry — createWindow, app lifecycle
│       │   │   ├── ipc/
│       │   │   │   ├── handlers/   # One file per IPC domain (auth, rx, user…)
│       │   │   │   └── index.ts    # Registers all handlers
│       │   │   ├── menu.ts         # Native app menu
│       │   │   ├── tray.ts         # System tray (if needed)
│       │   │   └── store.ts        # electron-store for persistent local config
│       │   ├── preload/
│       │   │   ├── index.ts        # contextBridge exposure — typed API
│       │   │   └── api.d.ts        # Global Window interface augmentation
│       │   └── renderer/           # Next.js app lives here
│       │       ├── next.config.ts
│       │       ├── tailwind.config.ts
│       │       ├── postcss.config.ts
│       │       ├── public/
│       │       ├── app/            # Next.js App Router
│       │       │   ├── layout.tsx
│       │       │   ├── page.tsx
│       │       │   ├── (auth)/
│       │       │   │   ├── login/
│       │       │   │   └── forgot-password/
│       │       │   ├── (dashboard)/
│       │       │   │   ├── layout.tsx
│       │       │   │   ├── home/
│       │       │   │   ├── prescriptions/
│       │       │   │   ├── patients/
│       │       │   │   └── settings/
│       │       │   └── providers.tsx   # All React context providers
│       │       ├── components/
│       │       │   ├── ui/             # shadcn/ui generated components (do not edit manually)
│       │       │   ├── common/         # Shared app components (Button, Modal, Table…)
│       │       │   ├── layout/         # Sidebar, Header, PageWrapper
│       │       │   └── features/       # Feature-specific components (one folder per domain)
│       │       │       ├── prescriptions/
│       │       │       ├── patients/
│       │       │       └── auth/
│       │       ├── hooks/              # Custom React hooks
│       │       ├── lib/
│       │       │   ├── api/            # API client (axios instance + typed endpoints)
│       │       │   ├── ipc/            # Renderer-side IPC wrappers (calls window.electronAPI)
│       │       │   ├── utils/          # Pure utility functions
│       │       │   └── constants/
│       │       ├── store/              # Zustand slices
│       │       │   ├── auth.store.ts
│       │       │   ├── ui.store.ts
│       │       │   └── index.ts
│       │       ├── types/              # Shared TypeScript types/interfaces
│       │       │   ├── api.types.ts
│       │       │   ├── models.types.ts
│       │       │   └── electron.types.ts
│       │       └── styles/
│       │           └── globals.css
├── packages/
│   └── shared/                     # Types + utils shared between main and renderer
│       ├── package.json
│       ├── tsconfig.json
│       └── src/
│           ├── ipc-channels.ts     # Enum of all IPC channel names (single source of truth)
│           ├── types/
│           └── utils/
├── scripts/
│   └── generate-icons.js          # Icon generation for all platforms
├── .eslintrc.cjs
├── .prettierrc
├── .husky/
├── package.json                    # Root workspace package.json (pnpm workspaces)
├── pnpm-workspace.yaml
└── turbo.json                      # Turborepo for task orchestration
```

---

## Implementation Rules — Follow These Strictly

### TypeScript

- `strict: true` in all tsconfigs. No `any` anywhere. Use `unknown` + type narrowing instead.
- All IPC channels defined as a const enum in `packages/shared/src/ipc-channels.ts`.
- Preload API must be fully typed — augment `Window` interface in `electron.types.ts`.

### IPC Architecture

- Main process NEVER directly imports renderer code.
- Renderer NEVER calls `require('electron')` directly — only through `window.electronAPI`.
- Every IPC handler lives in `src/main/ipc/handlers/[domain].ts` and is registered centrally.
- All IPC calls must be async (invoke/handle pattern), never fire-and-forget for data calls.

### Security

- `contextIsolation: true`, `nodeIntegration: false` — always, no exceptions.
- `webSecurity: true` in production. Disable only in dev if absolutely required with a comment explaining why.
- No remote module. No `eval`. CSP headers set on every BrowserWindow.
- Secrets (API keys etc.) stored in OS keychain via `keytar`, never in `electron-store` plaintext.

### Next.js Config for Electron

```typescript
// next.config.ts
const nextConfig = {
  output: 'export',              // static export — required for Electron file:// protocol
  images: { unoptimized: true }, // no server for image optimization in desktop
  trailingSlash: true,
  assetPrefix: process.env.NODE_ENV === 'production' ? './' : '',
};
```

### State Management Pattern

- Zustand store per domain: `auth.store.ts`, `ui.store.ts`, etc.
- **TanStack Query for all async/API data** — never store server data in Zustand. It handles loading states, error states, caching, and background refetching out of the box — far less boilerplate than manual fetch logic.
- Zustand persists only UI preferences (sidebar collapsed, theme) via `zustand/middleware` + `electron-store` as the adapter (write a custom storage adapter that pipes Zustand persist to electron-store).
- Rule of thumb: if it came from the server → TanStack Query. If it's client-only UI state → Zustand.

### Code Style Rules

- Components: PascalCase, one per file, named export + default export both.
- Hooks: `use` prefix, live in `/hooks`, return object (not array) unless it's a classic useState-like pair.
- No inline styles. No magic numbers — extract to `constants/`.
- No relative imports beyond 2 levels deep — use `@/` alias for renderer code, `@shared/` for shared package.
- Every component file has a co-located `[Component].test.tsx` (even if just a smoke test).

---

## Feature Parity Checklist

Before writing any new UI, first **read every file in the existing web app** at `[PATH_TO_EXISTING_APP]`. Then re-implement each screen and feature with these rules:

1. Map every existing route → a Next.js App Router page.
2. Map every existing API call → a typed function in `lib/api/`.
3. Map every existing form → React Hook Form + Zod schema.
4. For any feature that needs OS-level capability (file system, notifications, deep links), implement it in main process and expose via IPC — do NOT use browser APIs.
5. Preserve all business logic exactly. Do not refactor logic while porting — do a clean port first, refactor second.

---

## Native Electron Features to Add (beyond web parity)


| Feature              | Implementation                                                             |
| -------------------- | -------------------------------------------------------------------------- |
| Deep links           | Register `rxconnect://` protocol in `forge.config.ts`, handle in main      |
| OS Notifications     | `new Notification(...)` from main process (not browser API)                |
| File open/save       | `dialog.showOpenDialog` / `dialog.showSaveDialog` exposed via IPC          |
| App badge (macOS)    | `app.setBadgeCount(n)` via IPC when there are pending items                |
| Offline detection    | Listen to `online`/`offline` events in main, relay to renderer             |
| Single instance lock | `app.requestSingleInstanceLock()` in main index.ts                         |
| Startup at login     | `app.setLoginItemSettings` behind a user toggle in Settings                |
| Crash reporting      | `process.on('uncaughtException')` in main → electron-log + optional Sentry |


---

## GitHub Actions — release.yml Pattern

```yaml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        os: [macos-latest, windows-latest, ubuntu-latest]
    runs-on: ${{ matrix.os }}
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm build
      - name: Package & upload artifacts
        run: pnpm make
      - uses: actions/upload-artifact@v4
        with:
          name: release-${{ matrix.os }}
          path: apps/desktop/out/make/
```

---

## Step-by-Step Scaffold Order

Cursor must execute these steps **in order**. Do not skip ahead.

1. **Workspace init**: Create `pnpm-workspace.yaml`, root `package.json`, `turbo.json`.
2. **Shared package**: Scaffold `packages/shared` with `ipc-channels.ts` and base types.
3. **Electron Forge init**: `pnpm create electron-app apps/desktop --template=webpack-typescript` then immediately replace webpack with the Vite plugin (`@electron-forge/plugin-vite`).
4. **Next.js init**: Inside `apps/desktop/src/renderer`, run `pnpm create next-app . --ts --tailwind --eslint --app --src-dir=false --import-alias="@/*"`.
5. **Wire Vite ↔ Next.js**: Configure Electron Forge's Vite plugin to point `renderer` entry at the Next.js static export output directory.
6. **Preload bridge**: Write `preload/index.ts` with a typed `electronAPI` object. Augment `Window` in types.
7. **IPC skeleton**: Create handler files for every domain found in the existing app. Leave handlers stubbed but typed.
8. **Port all screens** from the existing web app one route at a time, starting with Auth → Dashboard → each feature screen.
9. **Linting + hooks**: Add ESLint, Prettier, Husky, lint-staged.
10. **Tests**: Add Vitest config + one smoke test per component. Add Playwright config for e2e.
11. **CI/CD**: Add `.github/workflows/ci.yml` and `release.yml`.
12. **Icons**: Add `build/` folder with all platform icons (`.icns`, `.ico`, `.png` set).
13. **README.md**: Document setup, dev, build, release, env vars required.

---

## Env Vars Required

Create `.env.example` at repo root with these (never commit actual values):

```
# App
NEXT_PUBLIC_APP_ENV=development
NEXT_PUBLIC_API_BASE_URL=https://api.onerx.com

# Optional: Sentry
NEXT_PUBLIC_SENTRY_DSN=
```

---

## What "Done" Looks Like

The scaffold is complete when:

- `pnpm dev` starts Electron with hot-reload in < 10 seconds
- `pnpm make` produces a `.dmg` (mac), `.exe` installer (win), `.deb` (linux)
- All screens from the existing web app render correctly in the Electron shell
- ESLint + Prettier pass with zero warnings
- `pnpm test` runs Vitest and all tests pass
- No TypeScript errors (`pnpm typecheck`)
- GitHub Actions release workflow builds on all three platforms on tag push

