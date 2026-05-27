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
export async function configureUpdateFeed(autoUpdater: AppUpdater): Promise<GitHubReleaseTarget> {
  const target = resolveGitHubReleaseTarget();

  // Staging GitHub releases are prereleases; prod must ignore them on the "latest" channel.
  autoUpdater.allowPrerelease = target.channel === 'staging';

  if (target.channel) {
    autoUpdater.channel = target.channel;
  }

  if (target.channel === 'staging') {
    const genericUrl = await resolveStagingFeedUrl(target);
    if (genericUrl) {
      autoUpdater.setFeedURL({ provider: 'generic', url: genericUrl });
      log.info(`${TAG} staging generic feed configured`, { url: genericUrl });
      return target;
    }
    log.warn(`${TAG} no staging.yml found via GitHub API — falling back to github provider`);
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

function isStagingReleaseTag(tag: string): boolean {
  return tag.endsWith('-staging') || tag.startsWith('staging-v');
}

/** Resolve staging.yml URL from GitHub Releases (supports staging-v* and v*-staging tags). */
async function resolveStagingFeedUrl(target: GitHubReleaseTarget): Promise<string | null> {
  const apiUrl = `https://api.github.com/repos/${target.owner}/${target.repo}/releases?per_page=50`;
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'rx-connect-desktop-updater',
  };
  if (target.token) {
    headers.Authorization = `Bearer ${target.token}`;
  }

  try {
    const response = await fetch(apiUrl, { headers });
    if (!response.ok) {
      log.warn(`${TAG} staging releases API HTTP ${response.status}`);
      return null;
    }

    const releases = (await response.json()) as Array<{
      tag_name: string;
      prerelease: boolean;
      assets?: Array<{ name: string; browser_download_url: string }>;
    }>;

    for (const release of releases) {
      if (!isStagingReleaseTag(release.tag_name) && !release.prerelease) {
        continue;
      }
      const stagingYml = release.assets?.find((asset) => asset.name === 'staging.yml');
      if (stagingYml?.browser_download_url) {
        log.info(`${TAG} resolved staging feed`, {
          tag: release.tag_name,
          url: stagingYml.browser_download_url,
        });
        return stagingYml.browser_download_url;
      }
    }
  } catch (err) {
    log.warn(`${TAG} staging releases API failed`, err);
  }

  return null;
}
