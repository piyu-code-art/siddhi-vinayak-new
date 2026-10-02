/* Runs every site check in sequence and reports a combined result.
   Usage: npm run check   (or `node tools/check-all.mjs --strict` before launch) */
import { spawnSync } from 'node:child_process';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)));
const strict = process.argv.includes('--strict');

const checks = [
  ['check:html', 'check-html.mjs'],
  ['check:links', 'check-links.mjs'],
  ['check:contrast', 'check-contrast.mjs'],
  ['check:config', 'check-config.mjs']
];

let failed = 0;
for (const [label, script] of checks) {
  const args = [resolve(root, script)];
  if (label === 'check:config' && strict) args.push('--strict');
  const result = spawnSync(process.execPath, args, { stdio: 'inherit' });
  if (result.status !== 0) {
    failed += 1;
    console.error(`--- ${label} FAILED ---`);
  }
  console.log('');
}

if (failed) {
  console.error(`check: ${failed} of ${checks.length} checks failed.`);
  process.exit(1);
}
console.log(`check: all ${checks.length} checks passed.`);
