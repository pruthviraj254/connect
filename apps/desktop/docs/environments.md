# Rx-Connect desktop environments (staging vs production)

Rx-Connect ships as **two separate installers** that can run side-by-side on the same PC:

|                     | Production               | Staging                          |
| ------------------- | ------------------------ | -------------------------------- |
| App name            | Rx-Connect               | Rx-Connect Staging               |
| `appId`             | `health.onerx.rxconnect` | `health.onerx.rxconnect.staging` |
| API (default)       | `https://api.onerx.com`  | `https://api.staging.onerx.com`  |
| Auto-update channel | `latest`                 | `staging`                        |
| Git tag             | `v0.0.8`                 | `staging-v0.0.8`                 |
| Updater metadata    | `latest.yml`             | `staging.yml`                    |
| Branch convention   | `main`                   | `dev`                            |

Build switch: `RX_CONNECT_CHANNEL=production` (default) or `staging`.

---

## Local development

**Production-like (default):**

```bash
pnpm --filter @rx-connect/desktop run dev
```

**Staging-like:**

```bash
RX_CONNECT_CHANNEL=staging pnpm --filter @rx-connect/desktop run dev
```

Or set in repo-root `.env`:

```env
NEXT_PUBLIC_APP_ENV=staging
NEXT_PUBLIC_API_BASE_URL=https://api.staging.onerx.com
```

---

## CI workflows

| Workflow                        | Trigger                    | Publishes?                        |
| ------------------------------- | -------------------------- | --------------------------------- |
| Build desktop (Windows / macOS) | Push/PR to `dev` or `main` | No — compile check only           |
| **Release desktop (staging)**   | Tag `staging-v*`           | Yes — staging EXE + `staging.yml` |
| **Release desktop**             | Tag `v*.*.*` (semver)      | Yes — prod EXE + `latest.yml`     |

**No tag → no GitHub Release.** Pushing to `dev` or `main` only runs build workflows.

---

## Cutting a staging release (internal QA)

```bash
git checkout dev
# merge features, bump version in apps/desktop/package.json if needed
git tag staging-v0.0.8
git push origin staging-v0.0.8
```

Install `Rx-Connect-Staging-Setup-0.0.8-x64.exe` from GitHub Releases. Staging clients auto-update only within the staging channel.

---

## Cutting a production release (pharmacies)

```bash
git checkout main
git merge dev   # after QA sign-off
git tag v0.0.8
git push origin v0.0.8
```

Production clients auto-update via `latest.yml` only.

---

## GitHub Actions variables

Set under **Settings → Secrets and variables → Actions → Variables**:

| Variable                  | Example                         | Used by                     |
| ------------------------- | ------------------------------- | --------------------------- |
| `PRODUCTION_API_BASE_URL` | `https://api.onerx.com`         | Production release workflow |
| `STAGING_API_BASE_URL`    | `https://api.staging.onerx.com` | Staging release workflow    |
| `GH_OWNER`, `GH_REPO`     | org + repo name                 | Both                        |

API URLs are **baked into the renderer at build time** from these variables (not read from `.env` in CI).

When the repo goes private, add secret `UPDATER_GH_TOKEN` (long-lived read PAT) — see [auto-update.md](./auto-update.md).

---

## Package scripts

| Script                                                  | Channel    |
| ------------------------------------------------------- | ---------- |
| `dist:win:publish` / `dist:mac:publish`                 | Production |
| `dist:win:staging:publish` / `dist:mac:staging:publish` | Staging    |

---

## Forced update policy

| File                                      | Channel    |
| ----------------------------------------- | ---------- |
| `apps/desktop/update-policy.json`         | Production |
| `apps/desktop/update-policy.staging.json` | Staging    |

Bump `minimumVersion` on the appropriate file before tagging when a forced update is required.

---

## Side-by-side install notes

- Different `appId` → separate install paths, Start Menu entries, and updater caches.
- Staging shows an amber **Staging** badge in the header.
- Deep links: `rxconnect://` (prod) vs `rxconnect-staging://` (staging).
