import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, relative, resolve } from 'node:path';

export async function buildSingleFileHtml({ rootDir, outFile }) {
  const absoluteRoot = resolve(rootDir);
  const manifestPath = resolve(absoluteRoot, 'assets/generated/asset_manifest.json');
  const indexPath = resolve(absoluteRoot, 'index.html');
  const mainPath = resolve(absoluteRoot, 'src/main.js');

  const [indexHtml, manifest] = await Promise.all([
    readFile(indexPath, 'utf8'),
    readJson(manifestPath)
  ]);

  const packedManifest = await embedManifestPngs(absoluteRoot, manifest);
  const bundledCode = await bundleModules(mainPath, absoluteRoot);
  const inlinedIndexHtml = await embedHtmlPngReferences(indexHtml, absoluteRoot);
  const html = inlinedIndexHtml
    .replace(/<script\s+type="module"\s+src="\.\/src\/main\.js[^"]*"><\/script>/, '')
    .replace(
      '</body>',
      [
        `<script>window.__PACKED_GAME_MANIFEST__ = ${JSON.stringify(packedManifest)};</script>`,
        '<script>',
        bundledCode,
        '</script>',
        '</body>'
      ].join('\n')
    );

  await mkdir(dirname(outFile), { recursive: true });
  await writeFile(outFile, html, 'utf8');
  return outFile;
}

async function embedHtmlPngReferences(html, rootDir) {
  const refs = new Set();
  for (const match of html.matchAll(/\b(?:src|href)=["']([^"']+\.png)["']/gi)) {
    refs.add(match[1]);
  }
  for (const match of html.matchAll(/url\((['"]?)([^'")]+\.png)\1\)/gi)) {
    refs.add(match[2]);
  }

  let inlined = html;
  for (const ref of refs) {
    if (/^(?:data:|https?:|\/\/)/i.test(ref)) continue;
    const imagePath = resolve(rootDir, ref);
    const buffer = await readFile(imagePath);
    const dataUri = `data:image/png;base64,${buffer.toString('base64')}`;
    inlined = inlined.replaceAll(ref, dataUri);
  }
  return inlined;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

async function embedManifestPngs(rootDir, manifest) {
  const copy = JSON.parse(JSON.stringify(manifest));
  const assetRoot = copy.assetRoot ?? 'assets/generated/';
  copy.assetRoot = '';

  async function embed(value) {
    if (typeof value === 'string' && value.toLowerCase().endsWith('.png')) {
      const imagePath = resolve(rootDir, assetRoot, value);
      const buffer = await readFile(imagePath);
      return `data:image/png;base64,${buffer.toString('base64')}`;
    }
    if (Array.isArray(value)) {
      return Promise.all(value.map((item) => embed(item)));
    }
    if (value && typeof value === 'object') {
      const entries = await Promise.all(
        Object.entries(value).map(async ([key, item]) => [key, await embed(item)])
      );
      return Object.fromEntries(entries);
    }
    return value;
  }

  return embed(copy);
}

async function bundleModules(entryPath, rootDir, seen = new Set()) {
  const absolutePath = resolve(entryPath);
  if (seen.has(absolutePath)) return '';
  seen.add(absolutePath);

  let source = await readFile(absolutePath, 'utf8');
  const imports = [];
  source = source.replace(/^\s*import\s+[\s\S]*?\s+from\s+['"](.+?)['"];?\s*$/gm, (_match, specifier) => {
    imports.push(resolve(dirname(absolutePath), specifier));
    return '';
  });

  let bundled = '';
  for (const importPath of imports) {
    bundled += await bundleModules(importPath, rootDir, seen);
  }

  source = stripEsmExports(source);
  const label = relative(rootDir, absolutePath).replaceAll('\\', '/');
  return `${bundled}\n/* ${label} */\n${source}\n`;
}

function stripEsmExports(source) {
  return source
    .replace(/^\s*export\s+\{[^}]+\};?\s*$/gm, '')
    .replace(/\bexport\s+(async\s+function|function|class|const|let|var)\s+/g, '$1 ');
}
