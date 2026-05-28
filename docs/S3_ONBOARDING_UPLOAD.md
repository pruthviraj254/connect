# Rx Connect — S3 installer upload (approval email onboarding)

After each **Windows** release tag, CI uploads the NSIS installer to S3 for first-time pharmacy onboarding downloads (separate from GitHub Releases auto-update).

## GitHub Actions secrets

Configure in **Settings → Secrets and variables → Actions → Secrets**:

| Secret                  | Value                                                                   |
| ----------------------- | ----------------------------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | IAM access key with `s3:PutObject` + `s3:HeadObject` on `connect_app/*` |
| `AWS_SECRET_ACCESS_KEY` | Paired secret                                                           |
| `RX_CONNECT_S3_BUCKET`  | e.g. `rx-fax-resource-785157631259-ca-west-1-an`                        |

Region is set in workflow env as `ca-west-1`.

## S3 layout

| CI channel (`RX_CONNECT_S3_CHANNEL`) | S3 prefix                   | Installer pattern                    |
| ------------------------------------ | --------------------------- | ------------------------------------ |
| `staging`                            | `connect_app/dev/windows/`  | `Rx-Connect-Staging-Setup-*-x64.exe` |
| `prod`                               | `connect_app/prod/windows/` | `Rx-Connect-Setup-*-x64.exe`         |

Also uploads `latest.json` manifest per channel folder.

## Post-release ops (RXAdmin_BE / rx_connect DB)

After CI uploads a new installer:

1. Update `rx_connect.app_release` so `version` matches the **exe basename without `.exe`** (e.g. `Rx-Connect-Staging-Setup-0.0.15-x64`).
2. Set `is_latest = true` for `os = 'windows'`.
3. Enable downloads in junction DB when ready:

```sql
UPDATE platform_app_download_config
SET is_enabled = TRUE, updated_at = NOW()
WHERE platform = 'rx-connect';
```

## Script

`apps/desktop/scripts/ci/upload-windows-installer-s3.cjs` — invoked from `release-desktop.yml` and `release-desktop-staging.yml` after Windows build validation.
