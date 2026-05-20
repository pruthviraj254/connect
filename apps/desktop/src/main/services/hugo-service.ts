import { execFile, spawn, type ChildProcess } from 'node:child_process';
import fs from 'node:fs';
import fsPromises from 'node:fs/promises';
import path from 'node:path';
import { promisify } from 'node:util';
import { app } from 'electron';
import log from 'electron-log';
import net from 'node:net';
import type { PharmacyWebsiteData } from '@rx-connect/shared';
import { canonicalLiveUrl, resolveProjectName } from './deploy-service.js';

const execFileAsync = promisify(execFile);

const PREVIEW_PORTS = [1313, 1314, 1315, 1316, 1317, 1318, 1319, 1320];
const TEMPLATE_VERSION = 6;
const VERSION_FILE = '.template-version';

let previewProcess: ChildProcess | null = null;
let previewPort: number | null = null;

function platformBinDir(): string {
  if (process.platform === 'darwin') {
    return process.arch === 'arm64' ? 'darwin' : 'darwin-x64';
  }
  if (process.platform === 'win32') return 'win32';
  return 'linux';
}

function binaryName(): string {
  return process.platform === 'win32' ? 'hugo.exe' : 'hugo';
}

function templateRoot(): string {
  const bundled = path.join(process.resourcesPath, 'hugo-template');
  if (fs.existsSync(path.join(bundled, 'hugo.toml'))) {
    return bundled;
  }

  const devCandidates = [
    path.join(app.getAppPath(), '..', 'resources', 'hugo-template'),
    path.join(app.getAppPath(), 'resources', 'hugo-template'),
    path.resolve(process.cwd(), 'resources', 'hugo-template'),
    path.resolve(process.cwd(), 'apps', 'desktop', 'resources', 'hugo-template'),
  ];

  for (const candidate of devCandidates) {
    if (fs.existsSync(path.join(candidate, 'hugo.toml'))) {
      return candidate;
    }
  }

  return bundled;
}

function binRoot(): string {
  const bundled = path.join(process.resourcesPath, 'bin');
  if (fs.existsSync(bundled)) return bundled;

  const devCandidates = [
    path.join(app.getAppPath(), '..', 'resources', 'bin'),
    path.resolve(process.cwd(), 'resources', 'bin'),
    path.resolve(process.cwd(), 'apps', 'desktop', 'resources', 'bin'),
  ];

  for (const candidate of devCandidates) {
    if (fs.existsSync(candidate)) return candidate;
  }

  return bundled;
}

export function getHugoBinaryPath(): string | null {
  const bin = path.join(binRoot(), platformBinDir(), binaryName());
  if (fs.existsSync(bin)) return bin;
  return null;
}

export function getPharmacySitePath(pharmacyId: string): string {
  return path.join(app.getPath('userData'), 'pharmacy-sites', pharmacyId);
}

async function copyDir(src: string, dest: string): Promise<void> {
  await fsPromises.mkdir(dest, { recursive: true });
  const entries = await fsPromises.readdir(src, { withFileTypes: true });
  for (const entry of entries) {
    const from = path.join(src, entry.name);
    const to = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      await copyDir(from, to);
    } else {
      await fsPromises.copyFile(from, to);
    }
  }
}

function escToml(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function generateHugoToml(data: PharmacyWebsiteData, baseUrl: string): string {
  return `baseURL = "${escToml(baseUrl)}"
languageCode = "en-us"
title = "${escToml(data.name || 'Pharmacy')}"
theme = "${data.theme || 'trust-blue'}"

[params]
  primaryColor = "${escToml(data.primaryColor)}"
  accentColor = "${escToml(data.accentColor)}"
  pharmacyName = "${escToml(data.name)}"
  tagline = "${escToml(data.tagline)}"
  phone = "${escToml(data.phone)}"
  email = "${escToml(data.email)}"
  address = "${escToml(data.address)}"
  city = "${escToml(data.city)}"
  province = "${escToml(data.province)}"
  postalCode = "${escToml(data.postalCode)}"

[menu]
  [[menu.main]]
    name = "Home"
    url = "/"
    weight = 1
  [[menu.main]]
    name = "About"
    url = "/about/"
    weight = 2
  [[menu.main]]
    name = "License"
    url = "/license/"
    weight = 3
  [[menu.main]]
    name = "Services"
    url = "/services/"
    weight = 4
  [[menu.main]]
    name = "Contact"
    url = "/contact/"
    weight = 5
`;
}

function previewBaseUrl(port: number): string {
  return `http://127.0.0.1:${port}/`;
}

function publishBaseUrl(data: PharmacyWebsiteData): string {
  if (!data.subdomain?.trim()) {
    return previewBaseUrl(PREVIEW_PORTS[0]!);
  }
  const projectName = resolveProjectName(data.pharmacyId, data.subdomain);
  return `${canonicalLiveUrl(data.subdomain, data.customDomain, projectName)}/`;
}

async function syncTemplateToSite(sitePath: string): Promise<void> {
  const template = templateRoot();
  const versionPath = path.join(sitePath, VERSION_FILE);
  let current = 0;
  try {
    current = parseInt(await fsPromises.readFile(versionPath, 'utf8'), 10) || 0;
  } catch {
    current = 0;
  }
  if (current >= TEMPLATE_VERSION) return;

  for (const dir of ['layouts', 'themes', 'content', 'static'] as const) {
    const src = path.join(template, dir);
    if (fs.existsSync(src)) {
      await fsPromises.rm(path.join(sitePath, dir), { recursive: true, force: true });
      await copyDir(src, path.join(sitePath, dir));
    }
  }

  await fsPromises.rm(path.join(sitePath, 'public'), { recursive: true, force: true }).catch(() => undefined);

  await fsPromises.writeFile(versionPath, String(TEMPLATE_VERSION), 'utf8');
  log.info('[hugo-service] synced template v%d to %s', TEMPLATE_VERSION, sitePath);
}

export async function initPharmacySite(pharmacyId: string): Promise<string> {
  const sitePath = getPharmacySitePath(pharmacyId);
  const marker = path.join(sitePath, 'hugo.toml');
  const template = templateRoot();
  if (!fs.existsSync(path.join(template, 'hugo.toml'))) {
    throw new Error(`Hugo template not found at ${template}`);
  }

  await fsPromises.mkdir(path.dirname(sitePath), { recursive: true });

  if (!fs.existsSync(marker)) {
    await copyDir(template, sitePath);
    log.info('[hugo-service] initialized site', sitePath);
  }

  await syncTemplateToSite(sitePath);
  return sitePath;
}

function pharmacyYamlFromData(data: PharmacyWebsiteData): Record<string, unknown> {
  return {
    name: data.name,
    tagline: data.tagline,
    heroHeadline: data.heroHeadline ?? data.tagline,
    heroSubtext: data.heroSubtext ?? data.aboutText ?? data.tagline,
    heroImages: (data.heroImages ?? []).filter(Boolean),
    establishedYear: data.establishedYear ?? '',
    logoUrl: data.logoUrl ?? '',
    footerLogoUrl: data.footerLogoUrl ?? data.logoUrl ?? '',
    locationNote: data.locationNote ?? '',
    metaDescription: data.metaDescription ?? data.aboutText ?? data.tagline,
    galleryImages: (data.galleryImages ?? []).filter(Boolean),
    phone: data.phone,
    fax: data.fax ?? '',
    email: data.email,
    address: data.address,
    city: data.city,
    province: data.province,
    postalCode: data.postalCode,
    aboutText: data.aboutText ?? '',
    googleMapsUrl: data.googleMapsEmbedUrl ?? '',
    bookingUrl: data.bookingEmbedUrl ?? '',
    pharmacyLicense: data.pharmacyLicense ?? '',
    pharmacistLicense: data.pharmacistLicense ?? '',
    pharmacyLicensePdfUrl: data.pharmacyLicensePdfUrl ?? '',
    patientConcernsUrl: data.patientConcernsUrl ?? '',
    hours: data.hours,
    services: data.services,
    team: data.team,
    testimonials: data.testimonials ?? [],
    social: data.social,
  };
}

export async function writePharmacyData(
  sitePath: string,
  data: PharmacyWebsiteData,
  options?: { previewPort?: number },
): Promise<void> {
  const dataDir = path.join(sitePath, 'data');
  await fsPromises.mkdir(dataDir, { recursive: true });
  await fsPromises.writeFile(
    path.join(dataDir, 'pharmacy.json'),
    JSON.stringify(pharmacyYamlFromData(data), null, 2),
    'utf8',
  );
  await fsPromises.rm(path.join(dataDir, 'pharmacy.yaml'), { force: true }).catch(() => undefined);

  const baseUrl = options?.previewPort
    ? previewBaseUrl(options.previewPort)
    : publishBaseUrl(data);

  await fsPromises.writeFile(
    path.join(sitePath, 'hugo.toml'),
    generateHugoToml(data, baseUrl),
    'utf8',
  );
}

export async function buildSite(sitePath: string): Promise<{
  success: boolean;
  outputPath: string;
  buildLog: string;
}> {
  const bin = getHugoBinaryPath();
  const outputPath = path.join(sitePath, 'public');

  if (!bin) {
    return {
      success: false,
      outputPath,
      buildLog: 'Hugo binary not found. Run: node apps/desktop/scripts/download-hugo.cjs',
    };
  }

  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(bin, 0o755);
    } catch {
      /* ignore */
    }
  }

  try {
    const { stdout, stderr } = await execFileAsync(bin, ['--minify'], {
      cwd: sitePath,
      maxBuffer: 10 * 1024 * 1024,
      windowsHide: true,
    });
    const buildLog = [stdout, stderr].filter(Boolean).join('\n');
    return { success: true, outputPath, buildLog };
  } catch (err) {
    const e = err as { stdout?: string; stderr?: string; message?: string };
    const buildLog = [e.stdout, e.stderr, e.message].filter(Boolean).join('\n');
    log.warn('[hugo-service] build failed', buildLog);
    return { success: false, outputPath, buildLog };
  }
}

async function isPortFree(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = net.createServer();
    server.once('error', () => resolve(false));
    server.once('listening', () => {
      server.close(() => resolve(true));
    });
    server.listen(port, '127.0.0.1');
  });
}

async function findPreviewPort(): Promise<number> {
  for (const port of PREVIEW_PORTS) {
    if (await isPortFree(port)) return port;
  }
  return PREVIEW_PORTS[0]!;
}

async function waitForPreviewReady(port: number, timeoutMs = 15000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  const url = `http://127.0.0.1:${port}/`;

  while (Date.now() < deadline) {
    try {
      const res = await fetch(url, { method: 'GET' });
      if (res.ok || res.status === 404) {
        return;
      }
    } catch {
      /* server not up yet */
    }
    await new Promise((r) => setTimeout(r, 200));
  }

  throw new Error(`Hugo preview server did not start on port ${port} within ${timeoutMs / 1000}s`);
}

export async function startPreviewServer(
  sitePath: string,
  data?: PharmacyWebsiteData,
): Promise<{ url: string; port: number }> {
  stopPreviewServer();

  const bin = getHugoBinaryPath();
  if (!bin) {
    throw new Error('Hugo binary not found. Run: pnpm vendor:hugo');
  }

  const port = await findPreviewPort();
  previewPort = port;

  if (data) {
    await writePharmacyData(sitePath, data, { previewPort: port });
  } else {
    const configPath = path.join(sitePath, 'hugo.toml');
    if (fs.existsSync(configPath)) {
      let config = await fsPromises.readFile(configPath, 'utf8');
      if (!config.includes('[menu]') || !config.includes('theme =')) {
        log.warn('[hugo-service] repairing corrupted hugo.toml');
        const pharmacy = JSON.parse(
          await fsPromises.readFile(path.join(sitePath, 'data', 'pharmacy.json'), 'utf8'),
        ) as PharmacyWebsiteData;
        await writePharmacyData(sitePath, { ...pharmacy, pharmacyId: path.basename(sitePath) }, { previewPort: port });
      } else {
        config = config.replace(/^baseURL\s*=.*/m, `baseURL = "${previewBaseUrl(port)}"`);
        await fsPromises.writeFile(configPath, config, 'utf8');
      }
    }
  }

  if (process.platform !== 'win32') {
    try {
      fs.chmodSync(bin, 0o755);
    } catch {
      /* ignore */
    }
  }

  previewProcess = spawn(bin, ['server', '-p', String(port), '--bind', '127.0.0.1', '-D'], {
    cwd: sitePath,
    stdio: ['ignore', 'pipe', 'pipe'],
    windowsHide: true,
  });

  previewProcess.on('error', (err) => {
    log.error('[hugo-service] preview server error', err);
  });

  previewProcess.stderr?.on('data', (chunk: Buffer) => {
    log.info('[hugo-server]', chunk.toString().trim());
  });

  previewProcess.stdout?.on('data', (chunk: Buffer) => {
    log.info('[hugo-server]', chunk.toString().trim());
  });

  await waitForPreviewReady(port);

  return { url: previewBaseUrl(port), port };
}

export function stopPreviewServer(): void {
  if (previewProcess) {
    previewProcess.kill();
    previewProcess = null;
    previewPort = null;
  }
}

export function getPreviewPort(): number | null {
  return previewPort;
}
