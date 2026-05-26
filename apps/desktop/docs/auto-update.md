# Rx-Connect auto-update (GitHub Releases)

Rx-Connect uses [`electron-updater`](https://www.electron.build/auto-update) with GitHub Releases as the update feed. Windows and macOS packaged apps check for updates on launch and from **Settings → Desktop App**.

## Architecture

| Platform              | Install artifact      | Auto-update artifact    | Update metadata  |
| --------------------- | --------------------- | ----------------------- | ---------------- |
| Windows               | NSIS `.exe`           | Same NSIS `.exe`        | `latest.yml`     |
| macOS (first install) | Forge `.pkg` / `.dmg` | electron-builder `.zip` | `latest-mac.yml` |

Build flow:

1. **Electron Forge** packages the app (`out/Rx-Connect-*`).
2. **electron-builder** wraps the prepackaged app into NSIS (Windows) or ZIP (macOS) and generates updater metadata.
3. On `v*` tag push, CI publishes installers + metadata to GitHub Releases.

## Cutting a release

1. Bump `version` in [`package.json`](../package.json) (must match the git tag).
2. Merge to `main`.
3. Create and push a tag:
   ```bash
   git tag v0.0.2
   git push origin v0.0.2
   ```
4. CI workflows publish to GitHub Releases:
   - [`.github/workflows/build-desktop-windows.yml`](../../.github/workflows/build-desktop-windows.yml)
   - [`.github/workflows/build-desktop-macos.yml`](../../.github/workflows/build-desktop-macos.yml)

Both Windows and macOS publish jobs attach artifacts to the **same** GitHub Release for that tag.

## GitHub repository configuration

Publish target is configured via environment variables (not hardcoded):

| Variable   | Purpose            | Default in CI             |
| ---------- | ------------------ | ------------------------- |
| `GH_OWNER` | GitHub org or user | `github.repository_owner` |
| `GH_REPO`  | Repository name    | `connect`                 |

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

## Code signing (required for production updates)

### Windows

Set these GitHub Actions **secrets**:

| Secret                 | Description                                         |
| ---------------------- | --------------------------------------------------- |
| `CSC_LINK`             | Base64-encoded `.pfx` or path to cert               |
| `CSC_KEY_PASSWORD`     | PFX password                                        |
| `WIN_CSC_SUBJECT_NAME` | Optional — cert subject if using Windows cert store |

[`electron-builder.yml`](../electron-builder.yml) sets `verifyUpdateCodeSignature: true`. Unsigned installers can be published, but **installed clients will reject them** when applying an update.

### macOS

Set these secrets for signed + notarized ZIP updates:

| Secret                        | Description                                           |
| ----------------------------- | ----------------------------------------------------- |
| `CSC_LINK`                    | Developer ID Application certificate (`.p12`, base64) |
| `CSC_KEY_PASSWORD`            | Certificate password                                  |
| `APPLE_ID`                    | Apple ID for notarization                             |
| `APPLE_APP_SPECIFIC_PASSWORD` | App-specific password                                 |
| `APPLE_TEAM_ID`               | Apple Developer team ID                               |

Without signing, macOS Gatekeeper may block the updated app.

## Local build (no publish)

```bash
# Windows (run on Windows)
pnpm --filter @rx-connect/desktop run dist:win

# macOS arm64
pnpm --filter @rx-connect/desktop run dist:mac

# macOS x64 (Intel)
pnpm --filter @rx-connect/desktop run dist:mac:x64
```

Verify `apps/desktop/dist/latest.yml` (Windows) or `latest-mac.yml` (macOS) exists after the build.

## In-app behavior

- **Packaged app only** — `electron-forge start` / dev builds do not run the updater.
- **Auto-check on launch** — downloads in the background when an update is available.
- **Settings UI** — version, manual check, download progress, restart button.
- **macOS menu** — App → Check for Updates…
- **Logs** — `electron-log` writes updater output to the platform log file (see [electron-log](https://github.com/megahertz/electron-log) docs for paths).

## Troubleshooting

| Symptom                                    | Likely cause                                                                                                        |
| ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Update check silent in dev                 | Expected — only runs when `app.isPackaged`                                                                          |
| Download succeeds, install fails (Windows) | Installer not Authenticode-signed                                                                                   |
| macOS update blocked                       | App not signed/notarized                                                                                            |
| Wrong release feed                         | `GH_OWNER` / `GH_REPO` mismatch vs build-time publish config                                                        |
| Private releases                           | Requires runtime `GH_TOKEN` in updater — not configured by default; use public releases or extend `auto-updater.ts` |

## Testing without signing

1. Build unsigned installers locally with `dist:win` / `dist:mac`.
2. Confirm Settings shows the current version and “Check for updates” triggers status changes against a test release.
3. Full install/apply cycle requires signed artifacts.

Do **not** disable `verifyUpdateCodeSignature` in production builds.
