import path from 'node:path';
import { execSync } from 'node:child_process';
import { MakerBase, type MakerOptions } from '@electron-forge/maker-base';
import type { ForgePlatform } from '@electron-forge/shared-types';
import { buildMacOsPkg } from './build-macos-pkg.js';

export interface MakerRxPkgConfig {
  name?: string;
  install?: string;
  scripts?: string;
  /** Override installer cert; auto-detected when omitted. */
  identity?: string;
}

function resolveInstallerIdentity(explicit?: string): string | undefined {
  const fromEnv = process.env.APPLE_INSTALLER_IDENTITY?.trim();
  if (fromEnv) return fromEnv;
  if (explicit?.trim()) return explicit.trim();
  try {
    const listing = execSync('security find-identity -v', {
      encoding: 'utf8',
      stdio: ['ignore', 'pipe', 'ignore'],
    });
    const match = listing.match(
      /"((?:Developer ID Installer|3rd Party Mac Developer Installer)[^"]+)"/,
    );
    return match?.[1];
  } catch {
    return undefined;
  }
}

export default class MakerRxPKG extends MakerBase<MakerRxPkgConfig> {
  name = 'rx-pkg';

  defaultPlatforms: ForgePlatform[] = ['darwin', 'mas'];

  requiredExternalBinaries = ['pkgbuild', 'productbuild'];

  isSupportedOnCurrentPlatform(): boolean {
    return process.platform === 'darwin';
  }

  async make({
    dir,
    makeDir,
    appName,
    packageJSON,
    targetPlatform,
    targetArch,
  }: MakerOptions): Promise<string[]> {
    if (targetPlatform !== 'darwin' && targetPlatform !== 'mas') {
      throw new Error(`rx-pkg only supports darwin/mas (got ${targetPlatform}).`);
    }

    this.ensureExternalBinariesExist();

    const fileName =
      this.config.name ?? `${appName}-${packageJSON.version}-${targetArch}`;
    const outPath = path.resolve(makeDir, `${fileName}.pkg`);
    const appPath = path.resolve(dir, `${appName}.app`);
    const identity = resolveInstallerIdentity(this.config.identity);

    await this.ensureFile(outPath);

    const mode = await buildMacOsPkg({
      appPath,
      outPkg: outPath,
      installPath: this.config.install ?? '/Applications',
      scriptsDir: this.config.scripts,
      identity,
      platform: targetPlatform === 'mas' ? 'mas' : 'darwin',
    });

    if (mode === 'unsigned') {
      console.warn(
        '[forge:rx-pkg] Built UNSIGNED .pkg (no Developer ID Installer in Keychain). ' +
          'Fine for local printer-flow testing; use a signed .pkg for production distribution.',
      );
      console.warn(
        '[forge:rx-pkg] Before installing locally, remove both copies of the app:\n' +
          '  sudo rm -rf /Applications/Rx-Connect.app\n' +
          '  rm -rf out/Rx-Connect-darwin-arm64/Rx-Connect.app\n' +
          'Otherwise macOS may relocate the install and leave /Applications with broken symlinks.',
      );
    }

    return [outPath];
  }
}

export { MakerRxPKG };
