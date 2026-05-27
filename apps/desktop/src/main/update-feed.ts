import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import log from 'electron-log';
import type { AppUpdater } from 'electron-updater';
import { getBuildMetadata } from './build-metadata.js';

const TAG = '[update-feed]';

export type GitHubReleaseTarget = {
  owner: string;
  repo: string;
  token?: string;
  channel?: string;
};

function readAppUpdateYml(): {
  owner?: string;
  repo?: string;
  token?: string;
  channel?: string;
} {
  try {
    const ymlPath = path.join(process.resourcesPath, 'app-update.yml');
    const raw = fs.readFileSync(ymlPath, 'utf8');
    const owner = raw.match(/^owner:\s*(.+)$/m)?.[1]?.trim();
    const repo = raw.match(/^repo:\s*(.+)$/m)?.[1]?.trim();
    const token = raw.match(/^token:\s*(.+)$/m)?.[1]?.trim();
    const channel = raw.match(/^channel:\s*(.+)$/m)?.[1]?.trim();
    // CI GITHUB_TOKEN (ghs_*) expires when the workflow ends — do not send to GitHub API.
    if (token?.startsWith('ghs_')) {
      log.warn(`${TAG} ignoring expired CI token in app-update.yml`);
      return { owner, repo, channel };
    }
    return { owner, repo, token, channel };
  } catch {
    return {};
  }
}

function resolveUpdateChannel(fromYml?: string): string | undefined {
  if (fromYml?.trim()) {
    return fromYml.trim();
  }
  const meta = getBuildMetadata();
  return meta.updateChannel === 'latest' ? undefined : meta.updateChannel;
}

/** Resolve GitHub Releases owner/repo for electron-updater. */
export function resolveGitHubReleaseTarget(): GitHubReleaseTarget {
  const fromYml = readAppUpdateYml();
  const channel = resolveUpdateChannel(fromYml.channel);

  if (fromYml.owner && fromYml.repo) {
    return {
      owner: fromYml.owner,
      repo: fromYml.repo,
      token: fromYml.token,
      channel,
    };
  }

  const ownerEnv = process.env.GH_OWNER?.trim();
  const repoEnv = process.env.GH_REPO?.trim();
  if (ownerEnv && repoEnv) {
    return { owner: ownerEnv, repo: repoEnv, token: process.env.GH_TOKEN?.trim(), channel };
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
        channel,
      };
    }
  } catch (err) {
    log.warn(`${TAG} could not read package.json repository`, err);
  }

  return {
    owner: 'pruthviraj254',
    repo: 'connect',
    token: process.env.GH_TOKEN?.trim(),
    channel,
  };
}

/** Configure electron-updater feed (avoids missing resources/app-update.yml with Forge prepackaged builds). */
export function configureUpdateFeed(autoUpdater: AppUpdater): GitHubReleaseTarget {
  const target = resolveGitHubReleaseTarget();

  // Staging GitHub releases are prereleases; prod must ignore them on the "latest" channel.
  autoUpdater.allowPrerelease = target.channel === 'staging';

  if (target.channel) {
    autoUpdater.channel = target.channel;
  }

  autoUpdater.setFeedURL({
    provider: 'github',
    owner: target.owner,
    repo: target.repo,
    ...(target.channel ? { channel: target.channel } : {}),
    ...(target.token ? { token: target.token } : {}),
  });
  log.info(`${TAG} feed configured`, {
    owner: target.owner,
    repo: target.repo,
    channel: target.channel ?? 'latest',
    hasToken: Boolean(target.token),
  });
  return target;
}
