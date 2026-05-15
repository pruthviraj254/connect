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

/** Build a .pkg with pkgbuild + productbuild (no code signing). */
async function buildUnsignedPkg(opts: BuildMacOsPkgOptions): Promise<void> {
  const install = opts.installPath ?? '/Applications';
  const componentPkg = path.join(
    path.dirname(opts.appPath),
    `${path.basename(opts.appPath, '.app')}-component.pkg`,
  );

  const pkgbuildArgs = [
    '--install-location',
    install,
    '--component',
    opts.appPath,
    componentPkg,
  ];
  if (opts.scriptsDir) {
    pkgbuildArgs.unshift('--scripts', opts.scriptsDir);
  }

  await execFileAsync('pkgbuild', pkgbuildArgs);
  try {
    await execFileAsync('productbuild', [
      '--package',
      componentPkg,
      install,
      opts.outPkg,
    ]);
  } finally {
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
