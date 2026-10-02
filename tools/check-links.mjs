/* Internal link and asset checker.
   Verifies that every local href/src in the HTML files resolves to a real
   file, and that in-page anchors (#id) point at an existing element id. */
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const htmlFiles = readdirSync(root).filter((f) => f.endsWith('.html'));

const problems = [];
const idsByFile = new Map();

for (const file of htmlFiles) {
  const html = readFileSync(join(root, file), 'utf8');
  const ids = new Set();
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) ids.add(m[1]);
  idsByFile.set(file, ids);
}

for (const file of htmlFiles) {
  const html = readFileSync(join(root, file), 'utf8');
  for (const m of html.matchAll(/\b(?:href|src)="([^"]+)"/g)) {
    const ref = m[1];
    if (/^(https?:|mailto:|tel:|data:|javascript:)/.test(ref)) continue;

    const [path, hash] = ref.split('#');
    const target = path === '' ? file : path;

    if (target && !existsSync(join(root, target))) {
      problems.push(`${file}: missing file -> ${ref}`);
      continue;
    }
    if (hash && target.endsWith('.html')) {
      const ids = idsByFile.get(target);
      if (ids && !ids.has(hash)) problems.push(`${file}: missing anchor -> ${ref}`);
    } else if (hash && target === file && !idsByFile.get(file).has(hash)) {
      problems.push(`${file}: missing anchor -> ${ref}`);
    }
  }
}

if (problems.length) {
  console.error(`check-links: ${problems.length} problem(s)`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(`check-links: OK (${htmlFiles.length} pages, all local links resolve)`);
