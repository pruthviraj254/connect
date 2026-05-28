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
 * Fail fast when a prior PKG install relocated this bundle and left absolute
 * symlinks pointing outside the .app (breaks /Applications after out/ is removed).
 */
export async function assertSelfContainedAppBundle(appPath: string): Promise<void> {
  const electronFramework = path.join(
    appPath,
    'Contents',
    'Frameworks',
    'Electron Framework.framework',
    'Electron Framework',
  );
  try {
    await fs.access(electronFramework);
  } catch {
    throw new Error(
      `Missing Electron Framework in ${appPath}. Rebuild with "pnpm run build:electron" before make:pkg.`,
    );
  }

  const contentsDir = path.join(appPath, 'Contents');
  const { stdout } = await execFileAsync('find', [contentsDir, '-type', 'l'], {
    maxBuffer: 10 * 1024 * 1024,
  });
  const appRoot = path.resolve(appPath);
  for (const linkPath of stdout.trim().split('\n').filter(Boolean)) {
    const linkTarget = await fs.readlink(linkPath);
    const resolved = path.isAbsolute(linkTarget)
      ? path.resolve(linkTarget)
      : path.resolve(path.dirname(linkPath), linkTarget);
    if (resolved !== appRoot && !resolved.startsWith(`${appRoot}${path.sep}`)) {
      throw new Error(
        `App bundle has external symlink: ${linkPath} -> ${linkTarget}. ` +
          'Remove /Applications/Rx-Connect.app and out/Rx-Connect-darwin-arm64/Rx-Connect.app, ' +
          'then rebuild with "pnpm run build:electron && pnpm run make:pkg".',
      );
    }
  }
}

/**
 * pkgbuild embeds <relocate>/<upgrade-bundle> metadata even for --component packages.
 * macOS then upgrades any existing bundle with the same id (including out/ from
 * a local make) instead of installing to /Applications.
 */
async function stripPkgRelocationMetadata(componentPkg: string): Promise<void> {
  const expandDir = path.join(path.dirname(componentPkg), '.pkg-component-expand');
  await fs.rm(expandDir, { recursive: true, force: true });
  await execFileAsync('pkgutil', ['--expand', componentPkg, expandDir]);

  const packageInfoPath = path.join(expandDir, 'PackageInfo');
  let packageInfo = await fs.readFile(packageInfoPath, 'utf8');
  packageInfo = packageInfo
    .replace(/<relocate(?:\/>|>[\s\S]*?<\/relocate>)\s*/g, '')
    .replace(/<upgrade-bundle(?:\/>|>[\s\S]*?<\/upgrade-bundle>)\s*/g, '')
    .replace(/<update-bundle(?:\/>|>[\s\S]*?<\/update-bundle>)\s*/g, '')
    .replace(/<atomic-update-bundle(?:\/>|>[\s\S]*?<\/atomic-update-bundle>)\s*/g, '');
  await fs.writeFile(packageInfoPath, packageInfo);

  await fs.unlink(componentPkg);
  await execFileAsync('pkgutil', ['--flatten', expandDir, componentPkg]);
  await fs.rm(expandDir, { recursive: true, force: true });
}

const COMPONENT_PLIST = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<array>
  <dict>
    <key>BundleHasStrictIdentifier</key>
    <true/>
    <key>BundleIsRelocatable</key>
    <false/>
    <key>BundleIsVersionChecked</key>
    <true/>
    <key>BundleOverwriteAction</key>
    <string>upgrade</string>
    <key>RootRelativeBundlePath</key>
    <string>__APP_NAME__</string>
  </dict>
</array>
</plist>`;

/**
 * Build an unsigned .pkg from a ditto-staged app using --root + component plist
 * (BundleIsRelocatable=false) so macOS always installs to /Applications.
 */
async function buildUnsignedPkg(opts: BuildMacOsPkgOptions): Promise<void> {
  const installDir = (opts.installPath ?? '/Applications').replace(/\/$/, '');
  const appName = path.basename(opts.appPath);
  const stageRoot = path.join(path.dirname(opts.appPath), '.pkg-stage');
  const stageAppPath = path.join(stageRoot, appName);
  const componentPlist = path.join(path.dirname(opts.appPath), '.pkg-component.plist');
  const componentPkg = path.join(
    path.dirname(opts.appPath),
    `${path.basename(opts.appPath, '.app')}-component.pkg`,
  );

  await assertSelfContainedAppBundle(opts.appPath);

  const { identifier, version } = await readBundleMeta(opts.appPath);

  await fs.rm(stageRoot, { recursive: true, force: true });
  await fs.mkdir(stageRoot, { recursive: true });
  // ditto preserves relative symlinks inside the bundle; fs.cp can preserve bad absolute ones.
  await execFileAsync('ditto', [opts.appPath, stageAppPath]);
  await assertSelfContainedAppBundle(stageAppPath);
  await fs.writeFile(componentPlist, COMPONENT_PLIST.replace('__APP_NAME__', appName));

  const pkgbuildArgs = [
    '--root',
    stageRoot,
    '--install-location',
    installDir,
    '--component-plist',
    componentPlist,
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
    await stripPkgRelocationMetadata(componentPkg);
    await execFileAsync('productbuild', ['--package', componentPkg, opts.outPkg]);
  } finally {
    await fs.rm(stageRoot, { recursive: true, force: true }).catch(() => undefined);
    await fs.unlink(componentPlist).catch(() => undefined);
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
