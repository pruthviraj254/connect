import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import fs from 'node:fs/promises';
import { flatAsync } from '@electron/osx-sign';

const execFileAsync = promisify(execFile);

export interface BuildMacOsPkgOptions {
  appPath: string;
  outPkg: string;
  installPath?: string;
  scriptsDir?: string;
  identity?: string;
  platform?: 'darwin' | 'mas';
}

async function readBundleMeta(appPath: string): Promise<{ identifier: string; version: string }> {
  const plist = path.join(appPath, 'Contents', 'Info.plist');
  const { stdout } = await execFileAsync('plutil', ['-convert', 'json', '-o', '-', plist]);
  const info = JSON.parse(stdout) as {
    CFBundleIdentifier?: string;
    CFBundleShortVersionString?: string;
    CFBundleVersion?: string;
  };
  return {
    identifier: info.CFBundleIdentifier ?? 'com.electron.rx-connect',
    version: info.CFBundleShortVersionString ?? info.CFBundleVersion ?? '1.0.0',
  };
}

/**
 * Build an unsigned .pkg using a staged --root payload (not --component).
 * --component marks bundles as relocatable; if the same app exists in out/ from
 * a dev build, macOS relocates the install there instead of /Applications.
 */
async function buildUnsignedPkg(opts: BuildMacOsPkgOptions): Promise<void> {
  const installDir = (opts.installPath ?? '/Applications').replace(/\/$/, '');
  const appName = path.basename(opts.appPath);
  const stageRoot = path.join(path.dirname(opts.appPath), '.pkg-stage');
  const stageAppPath = path.join(stageRoot, installDir.replace(/^\//, ''), appName);
  const componentPkg = path.join(
    path.dirname(opts.appPath),
    `${path.basename(opts.appPath, '.app')}-component.pkg`,
  );

  const { identifier, version } = await readBundleMeta(opts.appPath);

  await fs.rm(stageRoot, { recursive: true, force: true });
  await fs.mkdir(path.dirname(stageAppPath), { recursive: true });
  await fs.cp(opts.appPath, stageAppPath, { recursive: true });

  const pkgbuildArgs = [
    '--root',
    stageRoot,
    '--install-location',
    '/',
    '--identifier',
    identifier,
    '--version',
    version,
    componentPkg,
  ];
  if (opts.scriptsDir) {
    pkgbuildArgs.unshift('--scripts', opts.scriptsDir);
  }

  try {
    await execFileAsync('pkgbuild', pkgbuildArgs);
    await execFileAsync('productbuild', ['--package', componentPkg, opts.outPkg]);
  } finally {
    await fs.rm(stageRoot, { recursive: true, force: true }).catch(() => undefined);
    await fs.unlink(componentPkg).catch(() => undefined);
  }
}

export async function buildMacOsPkg(opts: BuildMacOsPkgOptions): Promise<'signed' | 'unsigned'> {
  if (opts.identity) {
    await flatAsync({
      app: opts.appPath,
      pkg: opts.outPkg,
      install: opts.installPath ?? '/Applications',
      scripts: opts.scriptsDir,
      identity: opts.identity,
      platform: opts.platform ?? 'darwin',
    });
    return 'signed';
  }

  await buildUnsignedPkg(opts);
  return 'unsigned';
}
