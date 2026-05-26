# Rx-Connect auto-update (GitHub Releases)

Rx-Connect uses [`electron-updater`](https://www.electron.build/auto-update) with GitHub Releases as the update feed. Windows and macOS packaged apps check for updates on launch (before the main window opens) and from **Settings → Desktop App**.

## Architecture

| Platform              | Install artifact      | Auto-update artifact    | Update metadata  |
| --------------------- | --------------------- | ----------------------- | ---------------- |
| Windows               | NSIS `.exe`           | Same NSIS `.exe`        | `latest.yml`     |
| macOS (first install) | Forge `.pkg` / `.dmg` | electron-builder `.zip` | `latest-mac.yml` |

Build flow:

1. **Electron Forge** packages the app (`out/Rx-Connect-*`).
2. **`write-app-update-yml.cjs`** writes `resources/app-update.yml` into the prepackaged app (Forge + `--prepackaged` does not always generate this). When `GH_TOKEN` is set at pack time, the token is embedded for private-repo updates.
3. **electron-builder** wraps the prepackaged app into NSIS (Windows) or ZIP (macOS) and generates updater metadata.
4. At runtime, **`configureUpdateFeed()`** also calls `autoUpdater.setFeedURL()` so updates work even if the yml file is missing.
5. On `v*` tag push, CI publishes installers + metadata to GitHub Releases.

## Update UX (two layers)

| Layer            | When                                        | Behavior                                                          |
| ---------------- | ------------------------------------------- | ----------------------------------------------------------------- |
| **UpdateGate**   | Forced update or check/download in progress | Full-screen block above auth; auto-restarts after forced download |
| **UpdateBanner** | Optional update ready (`status: ok`)        | Slim strip with **Restart now**; installs on quit if dismissed    |

### Forced updates (`update-policy.json`)

Remote policy file: `apps/desktop/update-policy.json` on `main` (raw GitHub URL).

```json
{
  "minimumVersion": "0.0.4",
  "message": "A required update is available. Rx-Connect will restart after the update finishes."
}
```

When `semver(current) < semver(minimumVersion)`:

1. Full-screen gate: `required` → `downloading` → `ready`
2. Auto `quitAndInstall` 800ms after download completes
3. On error: **Retry update** button

To force all users onto a new build, bump `minimumVersion` on `main` **before** publishing the installer tag.

Policy fetch fails (timeout, 404, private repo without token) → **fail-open** to optional updates only.

### Optional updates

- Gate stays `status: ok` during background check/download
- When ready: banner + OS notification; `autoInstallOnAppQuit: true`
- User can **Restart now** or close the app completely

### Startup order

`initializeUpdateService()` runs **before** `createWindow()` so forced updates block the UI before login.

## Cutting a release

1. Bump `version` in [`package.json`](../package.json) (must match the git tag).
2. Merge to `main` (including any `minimumVersion` policy bump).
3. Create and push a tag:
   ```bash
   git tag v0.0.5
   git push origin v0.0.5
   ```
4. CI [`.github/workflows/release-desktop.yml`](../../.github/workflows/release-desktop.yml) publishes Windows first, then macOS.

## GitHub repository configuration

| Variable   | Purpose                      | Default in CI             |
| ---------- | ---------------------------- | ------------------------- |
| `GH_OWNER` | GitHub org or user           | `github.repository_owner` |
| `GH_REPO`  | Repository name              | `connect`                 |
| `GH_TOKEN` | Pack-time + CI publish token | `secrets.GITHUB_TOKEN`    |

When the repo moves to the OneRx org, set GitHub repository variables:

- **Settings → Secrets and variables → Actions → Variables**
- `GH_OWNER` = `onerx` (example)
- `GH_REPO` = your repo name

Local publish:

```bash
export GH_OWNER=onerx
export GH_REPO=rx-connect
export GH_TOKEN=<token with repo scope>
pnpm --filter @rx-connect/desktop run dist:win:publish
pnpm --filter @rx-connect/desktop run dist:mac:publish
```

### Private repositories

- `electron-builder.yml` sets `publish.private: true`
- `write-app-update-yml.cjs` embeds `GH_TOKEN` into `resources/app-update.yml` at pack time (never commit the token)
- Runtime `configureUpdateFeed()` and policy fetch use the embedded token for GitHub API access

## Code signing (required for production updates)

### Windows

| Secret                 | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `CSC_LINK`             | Base64-encoded `.pfx` or path to cert               |
| `CSC_KEY_PASSWORD`     | PFX password                                        |
| `WIN_CSC_SUBJECT_NAME` | Optional — cert subject if using Windows cert store |

[`electron-builder.yml`](../electron-builder.yml) sets `verifyUpdateCodeSignature: true`. Unsigned installers can be published, but **installed clients will reject them** when applying an update.

### macOS

| Secret                        | Description                                           |
| ----------------------------- | ----------------------------------------------------- |
| `CSC_LINK`                    | Developer ID Application certificate (`.p12`, base64) |
| `CSC_KEY_PASSWORD`            | Certificate password                                  |
| `APPLE_ID`                    | Apple ID for notarization                             |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password                                 |
| `APPLE_TEAM_ID`               | Apple Developer team ID                               |

## Local build (no publish)

```bash
# Windows (run on Windows)
pnpm --filter @rx-connect/desktop run dist:win

# macOS arm64
pnpm --filter @rx-connect/desktop run dist:mac
```

Verify `apps/desktop/dist/latest.yml` (Windows) or `latest-mac.yml` (macOS) exists after the build.

## In-app behavior

- **Packaged app only** — dev builds skip the updater (`status: ok`, `supported: false`).
- **Auto-check on launch** — before main window; optional flow does not block startup.
- **Settings UI** — manual check, download progress, restart button (secondary to gate + banner).
- **macOS menu** — App → Check for Updates…
- **Skip updater** — set `RX_CONNECT_SKIP_UPDATER=1` for local testing.

## Test matrix

| Scenario                                             | Expected                             |
| ---------------------------------------------------- | ------------------------------------ |
| v0.0.3 installed, policy min 0.0.4                   | Full-screen gate, auto-restart       |
| v0.0.4 installed, policy min 0.0.4, v0.0.5 available | Banner only, defer until quit        |
| Policy URL down                                      | App opens normally, optional updates |
| Dev / unpackaged                                     | Gate skipped, `status: ok`           |

## Troubleshooting

| Symptom                                    | Likely cause                                                          |
| ------------------------------------------ | --------------------------------------------------------------------- |
| Update check silent in dev                 | Expected — only runs when `app.isPackaged`                            |
| `ENOENT` for `app-update.yml`              | Fixed via runtime `setFeedURL` + `write-app-update-yml.cjs`           |
| Download succeeds, install fails (Windows) | Installer not Authenticode-signed                                     |
| macOS update blocked                       | App not signed/notarized                                              |
| Wrong release feed                         | `GH_OWNER` / `GH_REPO` mismatch vs build-time publish config          |
| Private releases 401/404                   | Rebuild with `GH_TOKEN` so `app-update.yml` includes token            |
| Forced update not triggering               | Policy not on `main`, or `minimumVersion` not above installed version |

Do **not** disable `verifyUpdateCodeSignature` in production builds.
