import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import log from 'electron-log';
import type { AppUpdater } from 'electron-updater';

const TAG = '[update-feed]';

export type GitHubReleaseTarget = {
  owner: string;
  repo: string;
};

/** Resolve GitHub Releases owner/repo for electron-updater. */
export function resolveGitHubReleaseTarget(): GitHubReleaseTarget {
  const ownerEnv = process.env.GH_OWNER?.trim();
  const repoEnv = process.env.GH_REPO?.trim();
  if (ownerEnv && repoEnv) {
    return { owner: ownerEnv, repo: repoEnv };
  }

  try {
    const pkgPath = path.join(app.getAppPath(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
      repository?: { url?: string };
    };
    const url = pkg.repository?.url ?? '';
    const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (match) {
      return { owner: match[1]!, repo: match[2]!.replace(/\.git$/, '') };
    }
  } catch (err) {
    log.warn(`${TAG} could not read package.json repository`, err);
  }

  return { owner: 'pruthviraj254', repo: 'connect' };
}

/** Configure electron-updater feed (avoids missing resources/app-update.yml with Forge prepackaged builds). */
export function configureUpdateFeed(autoUpdater: AppUpdater): GitHubReleaseTarget {
  const target = resolveGitHubReleaseTarget();
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: target.owner,
    repo: target.repo,
  });
  log.info(`${TAG} feed configured`, target);
  return target;
}
