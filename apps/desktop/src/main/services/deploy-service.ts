import crypto from 'node:crypto';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import log from 'electron-log';

export type DeployParams = {
  pharmacyId: string;
  subdomain: string;
  customDomain?: string;
  publicFolderPath: string;
};

export type DeployResult = {
  liveUrl: string;
  deploymentUrl?: string;
  customDomainStatus?: string;
  dnsInstructions?: string;
  aliasAssigned?: boolean;
};

export type DeploySettings = {
  configured: boolean;
  usePlatformDomain: boolean;
  platformDomain: string | null;
};

type FileEntry = {
  file: string;
  sha: string;
  size: number;
};

type VercelDeployment = {
  id: string;
  url?: string;
  readyState?: string;
  aliasAssigned?: boolean;
  alias?: string[];
  aliasError?: { code?: string; message?: string } | null;
};

const FETCH_TIMEOUT_MS = 30_000;
const DEPLOY_READY_MAX_MS = 60_000;
const DEPLOY_POLL_MS = 1_500;

function vercelToken(): string | null {
  return process.env.VERCEL_API_TOKEN?.trim() || null;
}

function siteBaseDomain(): string {
  return process.env.SITE_BASE_DOMAIN?.trim() || '';
}

/** True only when you own SITE_BASE_DOMAIN on Vercel (e.g. rxsites.com). */
export function isPlatformDomainEnabled(): boolean {
  const base = siteBaseDomain();
  if (!base || base === 'vercel.app') return false;
  return process.env.SITE_USE_PLATFORM_DOMAIN === 'true';
}

export function getDeploySettings(): DeploySettings {
  const base = siteBaseDomain();
  const platformOn = isPlatformDomainEnabled();
  return {
    configured: Boolean(vercelToken()),
    usePlatformDomain: platformOn,
    platformDomain: platformOn ? base : null,
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeHost(domain: string): string {
  return domain.trim().replace(/^https?:\/\//i, '').replace(/\/+$/, '');
}

export function resolveProjectName(pharmacyId: string, subdomain: string): string {
  const fromEnv = process.env.VERCEL_PROJECT_NAME?.trim();
  if (fromEnv && isPlatformDomainEnabled()) return fromEnv;
  const slug = subdomain.replace(/[^a-z0-9-]/gi, '-').replace(/^-|-$/g, '').slice(0, 48);
  const fallback = pharmacyId.replace(/[^a-z0-9-]/gi, '-').replace(/^-|-$/g, '').slice(0, 12);
  return `rx-${slug || fallback || 'site'}`;
}

export function canonicalLiveUrl(
  subdomain: string,
  customDomain?: string,
  projectName?: string,
): string {
  const custom = customDomain?.trim();
  if (custom) return `https://${normalizeHost(custom)}`;
  if (isPlatformDomainEnabled()) {
    return `https://${subdomain.trim()}.${siteBaseDomain()}`;
  }
  const name = projectName ?? resolveProjectName('', subdomain);
  return `https://${name}.vercel.app`;
}

function productionAlias(subdomain: string): string {
  return `${subdomain.trim()}.${siteBaseDomain()}`;
}

async function fetchVercel(
  url: string,
  token: string,
  init?: RequestInit,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function walkPublicFiles(dir: string, base = dir): Promise<FileEntry[]> {
  const out: FileEntry[] = [];
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkPublicFiles(full, base)));
    } else {
      const buf = await fsPromises.readFile(full);
      const rel = path.relative(base, full).split(path.sep).join('/');
      out.push({
        file: rel,
        sha: crypto.createHash('sha1').update(buf).digest('hex'),
        size: buf.length,
      });
    }
  }
  return out;
}

async function readFileMap(dir: string, base = dir): Promise<Map<string, Buffer>> {
  const map = new Map<string, Buffer>();
  const entries = await fsPromises.readdir(dir, { withFileTypes: true });
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      const nested = await readFileMap(full, base);
      for (const [k, v] of nested) map.set(k, v);
    } else {
      const rel = path.relative(base, full).split(path.sep).join('/');
      map.set(rel, await fsPromises.readFile(full));
    }
  }
  return map;
}

function vercelHeaders(token: string): Record<string, string> {
  const headers: Record<string, string> = {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
  const teamId = process.env.VERCEL_TEAM_ID?.trim();
  if (teamId) {
    headers['x-vercel-team-id'] = teamId;
  }
  return headers;
}

async function ensureApexDomainOnProject(projectName: string, token: string): Promise<void> {
  const apex = siteBaseDomain();
  if (!apex) return;
  try {
    const res = await fetchVercel(
      `https://api.vercel.com/v10/projects/${encodeURIComponent(projectName)}/domains`,
      token,
      {
        method: 'POST',
        headers: vercelHeaders(token),
        body: JSON.stringify({ name: apex }),
      },
    );
    if (res.ok || res.status === 409) return;
    log.warn('[deploy-service] apex domain attach', apex, res.status, await res.text());
  } catch (err) {
    log.warn('[deploy-service] apex domain attach failed', err);
  }
}

async function fetchDeployment(deploymentId: string, token: string): Promise<VercelDeployment> {
  const res = await fetchVercel(`https://api.vercel.com/v13/deployments/${deploymentId}`, token, {
    headers: vercelHeaders(token),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Could not read deployment status: ${res.status} ${text}`);
  }
  return (await res.json()) as VercelDeployment;
}

function isDeploymentReady(deployment: VercelDeployment): boolean {
  const state = (deployment.readyState ?? '').toUpperCase();
  return state === 'READY';
}

function isDeploymentFailed(deployment: VercelDeployment): boolean {
  const state = (deployment.readyState ?? '').toUpperCase();
  return state === 'ERROR' || state === 'CANCELED';
}

async function waitForDeploymentReady(
  deploymentId: string,
  token: string,
): Promise<VercelDeployment> {
  const deadline = Date.now() + DEPLOY_READY_MAX_MS;
  while (Date.now() < deadline) {
    const deployment = await fetchDeployment(deploymentId, token);
    if (isDeploymentReady(deployment)) return deployment;
    if (isDeploymentFailed(deployment)) {
      throw new Error(`Vercel deployment failed (${deployment.readyState ?? 'unknown'})`);
    }
    await sleep(DEPLOY_POLL_MS);
  }
  throw new Error(
    'Publish timed out waiting for Vercel (60s). Your site may still finish deploying — check the Vercel dashboard.',
  );
}

async function assignDeploymentAlias(
  deploymentId: string,
  alias: string,
  token: string,
): Promise<boolean> {
  const aliasRes = await fetchVercel(
    `https://api.vercel.com/v2/deployments/${deploymentId}/aliases`,
    token,
    {
      method: 'POST',
      headers: vercelHeaders(token),
      body: JSON.stringify({ alias }),
    },
  );
  if (aliasRes.ok) return true;
  log.error('[deploy-service] alias assignment failed', alias, aliasRes.status, await aliasRes.text());
  return false;
}

export function isDeployConfigured(): boolean {
  return Boolean(vercelToken());
}

export async function deploySite(params: DeployParams): Promise<DeployResult> {
  const token = vercelToken();
  if (!token) {
    throw new Error('Deployment is not configured. Set VERCEL_API_TOKEN in .env.');
  }

  if (!fs.existsSync(params.publicFolderPath)) {
    throw new Error('Build output not found. Build the site first.');
  }

  const files = await walkPublicFiles(params.publicFolderPath);
  if (files.length === 0) {
    throw new Error('No files in build output.');
  }

  const projectName = resolveProjectName(params.pharmacyId, params.subdomain);
  const platformMode = isPlatformDomainEnabled();
  const alias = platformMode ? productionAlias(params.subdomain) : null;
  const stableUrl = canonicalLiveUrl(params.subdomain, params.customDomain, projectName);

  log.info('[deploy-service] publishing', { projectName, platformMode, stableUrl });

  if (platformMode && alias) {
    await ensureApexDomainOnProject(projectName, token);
  }

  const createBody: Record<string, unknown> = {
    name: projectName,
    files,
    projectSettings: {
      framework: null,
    },
    target: 'production',
  };
  if (platformMode && alias) {
    createBody.alias = [alias];
  }

  const fileMap = await readFileMap(params.publicFolderPath);

  for (const entry of files) {
    const uploadUrl = `https://api.vercel.com/v2/files?digest=${entry.sha}`;
    const checkRes = await fetchVercel(uploadUrl, token, {
      method: 'HEAD',
      headers: vercelHeaders(token),
    });
    if (checkRes.status === 200) continue;

    const buf = fileMap.get(entry.file);
    if (!buf) continue;

    const uploadRes = await fetchVercel(uploadUrl, token, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/octet-stream',
        'x-vercel-digest': entry.sha,
        'Content-Length': String(buf.length),
      },
      body: buf,
    });

    if (!uploadRes.ok && uploadRes.status !== 200) {
      log.warn('[deploy-service] file upload', entry.file, uploadRes.status, await uploadRes.text());
    }
  }

  const createRes = await fetchVercel('https://api.vercel.com/v13/deployments', token, {
    method: 'POST',
    headers: vercelHeaders(token),
    body: JSON.stringify(createBody),
  });

  if (!createRes.ok) {
    const text = await createRes.text();
    log.error('[deploy-service] create deployment failed', text);
    throw new Error(`Vercel deployment failed: ${createRes.status}`);
  }

  const created = (await createRes.json()) as VercelDeployment;
  const deploymentUrl = created.url ? `https://${created.url}` : undefined;

  const ready = isDeploymentReady(created)
    ? created
    : await waitForDeploymentReady(created.id, token);

  let aliasAssigned = !platformMode;
  if (platformMode && alias) {
    aliasAssigned =
      Boolean(ready.aliasAssigned) ||
      ready.alias?.includes(alias) === true ||
      (await assignDeploymentAlias(created.id, alias, token));

    if (!aliasAssigned) {
      const refreshed = await fetchDeployment(created.id, token);
      aliasAssigned = refreshed.alias?.includes(alias) === true;
      if (!aliasAssigned) {
        const hint = refreshed.aliasError?.message;
        throw new Error(
        hint
          ? `Could not use ${alias}. ${hint} Add ${siteBaseDomain()} to Vercel, or leave SITE_USE_PLATFORM_DOMAIN unset to use .vercel.app URLs.`
          : `Could not use ${alias}. Add ${siteBaseDomain()} to your Vercel account, or use .vercel.app mode (default).`,
        );
      }
    }
  }

  let customDomainStatus: string | undefined;
  let dnsInstructions: string | undefined;
  let liveUrl = stableUrl;

  if (params.customDomain?.trim()) {
    const domain = normalizeHost(params.customDomain);
    try {
      const domainRes = await fetchVercel(
        `https://api.vercel.com/v10/projects/${encodeURIComponent(projectName)}/domains`,
        token,
        {
          method: 'POST',
          headers: vercelHeaders(token),
          body: JSON.stringify({ name: domain }),
        },
      );
      if (domainRes.ok) {
        customDomainStatus = 'pending_dns';
        dnsInstructions = `At your domain registrar (where you bought ${domain}), add a CNAME record pointing to cname.vercel-dns.com. SSL will activate after DNS propagates (often 15–60 minutes).`;
        liveUrl = `https://${domain}`;
      } else {
        customDomainStatus = 'failed';
        log.warn('[deploy-service] custom domain attach', await domainRes.text());
      }
    } catch {
      customDomainStatus = 'failed';
    }
  }

  log.info('[deploy-service] published', { liveUrl, deploymentUrl });

  return {
    liveUrl,
    deploymentUrl,
    customDomainStatus,
    dnsInstructions,
    aliasAssigned,
  };
}
