/* Configuration checker: loads assets/js/site-config.js in a sandbox and
   reports which owner-confirmed fields are still empty. Exits non-zero only
   when run with --strict (used before launch), so day-to-day `npm run check`
   stays green while placeholders remain. */
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const source = readFileSync(join(root, 'assets/js/site-config.js'), 'utf8');

const window = {};
new Function('window', source)(window);
const cfg = window.SV_CONFIG;

if (!cfg) {
  console.error('check-config: window.SV_CONFIG was not set by site-config.js');
  process.exit(1);
}

const missing = [];
const has = (v) => typeof v === 'string' && v.trim() !== '';

if (!has(cfg.legalName)) missing.push('legalName (statutory entity name)');
if (!has(cfg.contact.email)) missing.push('contact.email (enquiries mailbox)');
if (!has(cfg.dpo.name)) missing.push('dpo.name (grievance officer)');
if (!has(cfg.dpo.email)) missing.push('dpo.email (grievance contact)');
for (const reg of cfg.registrations || []) {
  if (!has(reg.value)) missing.push(`registrations["${reg.label}"]`);
}

console.log(`check-config: ${cfg.brandName} | consent v${cfg.consent.version} | last reviewed ${cfg.lastReviewed}`);
if (missing.length === 0) {
  console.log('check-config: all owner fields are filled in.');
} else {
  console.log(`check-config: ${missing.length} field(s) still awaiting the owner (site renders fallbacks):`);
  for (const m of missing) console.log('  - ' + m);
}

if (process.argv.includes('--strict') && missing.length) process.exit(1);
