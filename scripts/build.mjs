import { cp, mkdir, readFile, readdir, rm, stat } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { buildSingleFileHtml } from './single-file-builder.mjs';

const root = process.cwd();
const dist = resolve(root, 'dist');
const requiredFiles = [
  'index.html',
  'src/main.js',
  'assets/generated/asset_manifest.json',
  'README.md'
];

for (const file of requiredFiles) {
  if (!existsSync(join(root, file))) {
    throw new Error(`Missing required file: ${file}`);
  }
}

await assertNoSvg(root);
await assertNoRemoteReferences(['index.html', 'src', 'assets/generated/asset_manifest.json']);
await assertManifest();

if (!dist.startsWith(root)) {
  throw new Error('Refusing to write dist outside project root');
}
await rm(dist, { recursive: true, force: true });
await mkdir(dist, { recursive: true });
await cp(join(root, 'index.html'), join(dist, 'index.html'));
await cp(join(root, 'src'), join(dist, 'src'), { recursive: true });
await cp(join(root, 'assets'), join(dist, 'assets'), { recursive: true });
await buildSingleFileHtml({
  rootDir: root,
  outFile: join(root, 'PLAY.html')
});
await cp(join(root, 'PLAY.html'), join(dist, 'PLAY.html'));
console.log('Build verified and copied to dist/. Single-file PLAY.html generated.');

async function assertNoSvg(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const fullPath = join(directory, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'node_modules' || entry.name === 'dist' || entry.name === '.git') continue;
      await assertNoSvg(fullPath);
    } else if (entry.name.toLowerCase().endsWith('.svg')) {
      throw new Error(`SVG is forbidden by GAMESPEC: ${fullPath}`);
    }
  }
}

async function assertNoRemoteReferences(paths) {
  for (const item of paths) {
    const fullPath = join(root, item);
    const info = await stat(fullPath);
    if (info.isDirectory()) {
      const entries = await readdir(fullPath);
      await assertNoRemoteReferences(entries.map((entry) => join(item, entry)));
      continue;
    }
    if (!/\.(html|js|json|css)$/i.test(item)) continue;
    const text = await readFile(fullPath, 'utf8');
    if (/https?:\/\//i.test(text) || /<link\s/i.test(text)) {
      throw new Error(`Remote URL or external link reference found in ${item}`);
    }
  }
}

async function assertManifest() {
  const manifestPath = join(root, 'assets/generated/asset_manifest.json');
  const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
  const rootDir = join(root, manifest.assetRoot);
  const spriteFiles = [];
  const jumpscareFiles = [];

  for (const file of Object.values(manifest.backgrounds)) assertExists(rootDir, file);
  for (const file of Object.values(manifest.cameras)) assertExists(rootDir, file);
  for (const variants of Object.values(manifest.cameraOccupants ?? {})) {
    for (const file of Object.values(variants)) assertExists(rootDir, file);
  }
  for (const file of Object.values(manifest.effects)) assertExists(rootDir, file);
  for (const character of Object.values(manifest.characters)) {
    if (character.pivotX !== 256 || character.pivotY !== 450) {
      throw new Error(`Invalid sprite pivot for ${character.displayName}`);
    }
    for (const [pose, file] of Object.entries(character.poses)) {
      assertExists(rootDir, file);
      if (pose === 'jumpscare') {
        jumpscareFiles.push(join(rootDir, file));
      } else {
        spriteFiles.push(join(rootDir, file));
      }
    }
  }

  for (const file of spriteFiles) {
    const buffer = await readFile(file);
    const { width, height } = readPngSize(buffer);
    if (width !== 512 || height !== 512) {
      throw new Error(`Sprite must be 512x512: ${file} is ${width}x${height}`);
    }
  }

  for (const file of jumpscareFiles) {
    const buffer = await readFile(file);
    const { width, height } = readPngSize(buffer);
    if (width / height < 1.6 || width / height > 1.9) {
      throw new Error(`Jumpscare must be widescreen: ${file} is ${width}x${height}`);
    }
  }
}

function assertExists(rootDir, file) {
  if (!existsSync(join(rootDir, file))) {
    throw new Error(`Manifest references missing file: ${file}`);
  }
}

function readPngSize(buffer) {
  const signature = buffer.subarray(0, 8).toString('hex');
  if (signature !== '89504e470d0a1a0a') {
    throw new Error('Expected PNG file');
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20)
  };
}
