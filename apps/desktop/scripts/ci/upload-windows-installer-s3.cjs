/**
 * CI: upload Windows NSIS Setup.exe + latest.json to S3 for new-user email onboarding.
 *
 * Env:
 *   RX_CONNECT_S3_CHANNEL — prod | staging
 *   RX_CONNECT_S3_BUCKET — bucket name (never hardcode in this repo)
 *   AWS_REGION — e.g. ca-west-1
 *   AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *
 * S3 layout:
 *   staging → connect_app/dev/windows/
 *   prod    → connect_app/prod/windows/
 *
 * After upload, update rx_connect.app_release.version to the installer basename (no .exe).
 */
const fs = require('node:fs');
const path = require('node:path');
const { createReadStream } = require('node:fs');
const {
  HeadObjectCommand,
  PutObjectCommand,
  S3Client,
} = require('@aws-sdk/client-s3');

const desktopRoot = path.join(__dirname, '../..');
const distDir = path.join(desktopRoot, 'dist');
const PREFIX = '[upload-windows-installer-s3]';

function fail(message) {
  console.error(`${PREFIX} ${message}`);
  process.exit(1);
}

function requireEnv(name) {
  const value = process.env[name]?.trim();
  if (!value) {
    fail(`Missing required environment variable: ${name}`);
  }
  if (/[\r\n]/.test(value)) {
    fail(
      `Invalid ${name}: contains newline characters. Re-save the secret/env var without any line breaks.`,
    );
  }
  return value;
}

const channel = requireEnv('RX_CONNECT_S3_CHANNEL');
if (channel !== 'prod' && channel !== 'staging') {
  fail(`RX_CONNECT_S3_CHANNEL must be "prod" or "staging", got: ${channel}`);
}

const bucket = requireEnv('RX_CONNECT_S3_BUCKET');
const region = requireEnv('AWS_REGION');
requireEnv('AWS_ACCESS_KEY_ID');
requireEnv('AWS_SECRET_ACCESS_KEY');

const s3Folder = channel === 'prod' ? 'prod' : 'dev';

const pkg = JSON.parse(
  fs.readFileSync(path.join(desktopRoot, 'package.json'), 'utf8'),
);
const version = pkg.version?.trim();
if (!version) {
  fail('apps/desktop/package.json has no version field');
}

function findInstallerExe() {
  if (!fs.existsSync(distDir)) {
    fail(`dist/ not found at ${distDir}`);
  }

  const entries = fs.readdirSync(distDir, { withFileTypes: true });
  const exes = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith('.exe'))
    .map((e) => e.name);

  let matches;
  if (channel === 'prod') {
    matches = exes.filter((name) => /^Rx-Connect-Setup-.+\.exe$/i.test(name));
  } else {
    matches = exes.filter((name) =>
      /^Rx-Connect-Staging-Setup-.+\.exe$/i.test(name),
    );
  }

  if (matches.length === 0) {
    fail(
      `No matching Setup.exe in dist/ for channel "${channel}". Found: ${exes.join(', ') || '(none)'}`,
    );
  }
  if (matches.length > 1) {
    fail(
      `Expected exactly one Setup.exe in dist/ for channel "${channel}", found ${matches.length}: ${matches.join(', ')}`,
    );
  }

  return {
    filename: matches[0],
    localPath: path.join(distDir, matches[0]),
  };
}

async function verifyHead(s3, key, label) {
  let head;
  try {
    head = await s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
  } catch (err) {
    fail(`HeadObject failed for ${label} (${key}): ${err.message ?? err}`);
  }

  const size = head.ContentLength ?? 0;
  if (size === 0) {
    fail(`HeadObject: ${label} (${key}) has zero size`);
  }

  return size;
}

async function main() {
  const { filename, localPath } = findInstallerExe();
  const exeKey = `connect_app/${s3Folder}/windows/${filename}`;
  const manifestKey = `connect_app/${s3Folder}/windows/latest.json`;
  const releaseBasename = filename.replace(/\.exe$/i, '');

  const stat = fs.statSync(localPath);
  if (stat.size === 0) {
    fail(`Local installer is empty: ${localPath}`);
  }

  const manifest = {
    channel,
    version,
    filename,
    key: exeKey,
    releaseBasename,
    uploadedAt: new Date().toISOString(),
  };

  const s3 = new S3Client({ region });

  console.log(
    `${PREFIX} Uploading ${filename} (${stat.size} bytes) → s3://${bucket}/${exeKey}`,
  );

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: exeKey,
      Body: createReadStream(localPath),
      ContentType: 'application/octet-stream',
    }),
  );

  const manifestBody = JSON.stringify(manifest, null, 2);

  console.log(
    `${PREFIX} Uploading latest.json → s3://${bucket}/${manifestKey}`,
  );

  await s3.send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: manifestKey,
      Body: manifestBody,
      ContentType: 'application/json',
    }),
  );

  const exeSize = await verifyHead(s3, exeKey, 'installer');
  const manifestSize = await verifyHead(s3, manifestKey, 'latest.json');

  console.log(
    `${PREFIX} Verified installer: s3://${bucket}/${exeKey} (${exeSize} bytes)`,
  );
  console.log(
    `${PREFIX} Verified manifest: s3://${bucket}/${manifestKey} (${manifestSize} bytes)`,
  );
  console.log(
    `${PREFIX} Update rx_connect.app_release.version to "${releaseBasename}" and set is_latest = true for os = windows.`,
  );
  console.log(`${PREFIX} Success.`);
}

main().catch((err) => {
  fail(err.message ?? String(err));
});
