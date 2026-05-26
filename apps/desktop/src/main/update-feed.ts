import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import log from 'electron-log';
import type { AppUpdater } from 'electron-updater';

const TAG = '[update-feed]';

export type GitHubReleaseTarget = {
  owner: string;
  repo: string;
  token?: string;
};

function readAppUpdateYml(): { owner?: string; repo?: string; token?: string } {
  try {
    const ymlPath = path.join(process.resourcesPath, 'app-update.yml');
    const raw = fs.readFileSync(ymlPath, 'utf8');
    const owner = raw.match(/^owner:\s*(.+)$/m)?.[1]?.trim();
    const repo = raw.match(/^repo:\s*(.+)$/m)?.[1]?.trim();
    const token = raw.match(/^token:\s*(.+)$/m)?.[1]?.trim();
    return { owner, repo, token };
  } catch {
    return {};
  }
}

/** Resolve GitHub Releases owner/repo for electron-updater. */
export function resolveGitHubReleaseTarget(): GitHubReleaseTarget {
  const fromYml = readAppUpdateYml();
  if (fromYml.owner && fromYml.repo) {
    return {
      owner: fromYml.owner,
      repo: fromYml.repo,
      token: fromYml.token,
    };
  }

  const ownerEnv = process.env.GH_OWNER?.trim();
  const repoEnv = process.env.GH_REPO?.trim();
  if (ownerEnv && repoEnv) {
    return { owner: ownerEnv, repo: repoEnv, token: process.env.GH_TOKEN?.trim() };
  }

  try {
    const pkgPath = path.join(app.getAppPath(), 'package.json');
    const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8')) as {
      repository?: { url?: string };
    };
    const url = pkg.repository?.url ?? '';
    const match = url.match(/github\.com[/:]([^/]+)\/([^/.]+)/);
    if (match) {
      return {
        owner: match[1]!,
        repo: match[2]!.replace(/\.git$/, ''),
        token: process.env.GH_TOKEN?.trim(),
      };
    }
  } catch (err) {
    log.warn(`${TAG} could not read package.json repository`, err);
  }

  return {
    owner: 'pruthviraj254',
    repo: 'connect',
    token: process.env.GH_TOKEN?.trim(),
  };
}

/** Configure electron-updater feed (avoids missing resources/app-update.yml with Forge prepackaged builds). */
export function configureUpdateFeed(autoUpdater: AppUpdater): GitHubReleaseTarget {
  const target = resolveGitHubReleaseTarget();
  autoUpdater.setFeedURL({
    provider: 'github',
    owner: target.owner,
    repo: target.repo,
    ...(target.token ? { token: target.token } : {}),
  });
  log.info(`${TAG} feed configured`, {
    owner: target.owner,
    repo: target.repo,
    hasToken: Boolean(target.token),
  });
  return target;
}
