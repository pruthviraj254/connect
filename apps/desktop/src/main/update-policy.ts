import { app } from 'electron';
import fs from 'node:fs';
import path from 'node:path';
import log from 'electron-log';
import semver from 'semver';
import type { UpdatePolicy } from '@rx-connect/shared';
import { getBuildMetadata } from './build-metadata.js';
import { resolveGitHubReleaseTarget } from './update-feed.js';

const TAG = '[update-policy]';
const POLICY_TIMEOUT_MS = 10_000;

function policyRemotePath(): string {
  return getBuildMetadata().policyRemotePath;
}

function policyRawUrl(owner: string, repo: string): string {
  const branch = process.env.RX_CONNECT_POLICY_BRANCH?.trim() || 'main';
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${policyRemotePath()}`;
}

function readEmbeddedGitHubToken(): string | undefined {
  try {
    const ymlPath = path.join(process.resourcesPath, 'app-update.yml');
    const raw = fs.readFileSync(ymlPath, 'utf8');
    const match = raw.match(/^token:\s*(.+)$/m);
    const token = match?.[1]?.trim();
    // Ignore CI tokens accidentally baked into older builds (ghs_* expire after the workflow).
    if (token && token.startsWith('ghs_')) {
      log.warn(`${TAG} ignoring expired CI token in app-update.yml`);
      return undefined;
    }
    return token && token.length > 0 ? token : undefined;
  } catch {
    return undefined;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), POLICY_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function fetchPolicyViaContentsApi(
  owner: string,
  repo: string,
  token: string,
): Promise<UpdatePolicy | null> {
  const branch = process.env.RX_CONNECT_POLICY_BRANCH?.trim() || 'main';
  const url = `https://api.github.com/repos/${owner}/${repo}/contents/${policyRemotePath()}?ref=${branch}`;
  const res = await fetchWithTimeout(url, {
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'User-Agent': 'Rx-Connect-Updater',
    },
  });
  if (!res.ok) {
    log.warn(`${TAG} contents API failed`, res.status);
    return null;
  }
  const body = (await res.json()) as { content?: string; encoding?: string };
  if (!body.content || body.encoding !== 'base64') {
    return null;
  }
  const decoded = Buffer.from(body.content.replace(/\n/g, ''), 'base64').toString('utf8');
  return JSON.parse(decoded) as UpdatePolicy;
}

export async function fetchUpdatePolicy(): Promise<UpdatePolicy | null> {
  const { owner, repo } = resolveGitHubReleaseTarget();
  const rawUrl = process.env.RX_CONNECT_UPDATE_POLICY_URL?.trim() || policyRawUrl(owner, repo);

  try {
    const res = await fetchWithTimeout(rawUrl, {
      headers: { 'User-Agent': 'Rx-Connect-Updater' },
    });
    if (res.ok) {
      const policy = (await res.json()) as UpdatePolicy;
      if (policy.minimumVersion) {
        log.info(`${TAG} loaded from raw URL`, { minimumVersion: policy.minimumVersion });
        return policy;
      }
    } else {
      log.warn(`${TAG} raw URL failed`, rawUrl, res.status);
    }
  } catch (err) {
    log.warn(`${TAG} raw URL error`, err);
  }

  const token = readEmbeddedGitHubToken() || process.env.GH_TOKEN?.trim();
  if (token) {
    try {
      const policy = await fetchPolicyViaContentsApi(owner, repo, token);
      if (policy?.minimumVersion) {
        log.info(`${TAG} loaded via GitHub API`, { minimumVersion: policy.minimumVersion });
        return policy;
      }
    } catch (err) {
      log.warn(`${TAG} GitHub API error`, err);
    }
  }

  log.warn(`${TAG} policy unavailable — fail-open to optional updates only`);
  return null;
}

export function isBelowMinimumVersion(current: string, minimum: string): boolean {
  const coercedCurrent = semver.coerce(current);
  const coercedMinimum = semver.coerce(minimum);
  if (!coercedCurrent || !coercedMinimum) {
    return false;
  }
  return semver.lt(coercedCurrent, coercedMinimum);
}

export function defaultForcedMessage(): string {
  return 'A required update is available. Rx-Connect will restart after the update finishes.';
}

export function bundledPolicyFallback(): UpdatePolicy | null {
  try {
    const bundled = path.join(app.getAppPath(), getBuildMetadata().policyFileName);
    if (fs.existsSync(bundled)) {
      return JSON.parse(fs.readFileSync(bundled, 'utf8')) as UpdatePolicy;
    }
  } catch {
    /* ignore */
  }
  return null;
}
