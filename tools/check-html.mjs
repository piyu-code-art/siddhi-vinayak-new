/* Static HTML structure checker (no dependencies).
   Checks each page for: doctype, lang, title, meta description, single h1,
   skip link, fonts + stylesheets, both scripts, closing tags, and the
   presence of header/nav/footer hooks main.js relies on. */
import { readFileSync, readdirSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const htmlFiles = readdirSync(root).filter((f) => f.endsWith('.html'));

const problems = [];
const fail = (file, msg) => problems.push(`${file}: ${msg}`);

for (const file of htmlFiles) {
  const html = readFileSync(join(root, file), 'utf8');

  if (!/^<!doctype html>/i.test(html)) fail(file, 'missing doctype');
  if (!/<html[^>]*\blang="/.test(html)) fail(file, 'missing lang attribute');
  if (!/<title>[^<]+<\/title>/.test(html)) fail(file, 'missing title');
  if (!/<meta name="description" content="[^"]+">/.test(html)) fail(file, 'missing meta description');
  if ((html.match(/<h1[\s>]/g) || []).length !== 1) fail(file, 'expected exactly one <h1>');
  if (!/class="skip-link"/.test(html)) fail(file, 'missing skip link');
  if (!/assets\/fonts\/fonts\.css/.test(html)) fail(file, 'missing fonts.css link');
  if (!/assets\/css\/styles\.css/.test(html)) fail(file, 'missing styles.css link');
  if (!/assets\/js\/site-config\.js/.test(html)) fail(file, 'missing site-config.js');
  if (!/assets\/js\/main\.js/.test(html)) fail(file, 'missing main.js');
  if (!/data-nav-toggle/.test(html)) fail(file, 'missing data-nav-toggle');
  if (!/data-consent-banner/.test(html)) fail(file, 'missing consent banner');
  if (!/<footer class="site-footer">/.test(html)) fail(file, 'missing footer');
  if (!/<\/body>\s*<\/html>\s*$/.test(html)) fail(file, 'does not end with </body></html>');

  // Balanced major containers (rough check - counts opening vs closing tags).
  for (const tag of ['html', 'head', 'body', 'header', 'main', 'footer', 'section', 'form']) {
    const open = (html.match(new RegExp(`<${tag}[\\s>]`, 'g')) || []).length;
    const close = (html.match(new RegExp(`</${tag}>`, 'g')) || []).length;
    if (open !== close) fail(file, `<${tag}> mismatch: ${open} open / ${close} close`);
  }

  // Duplicate id attributes break label/aria references and anchor links.
  const seen = new Set();
  for (const m of html.matchAll(/\bid="([^"]+)"/g)) {
    if (seen.has(m[1])) fail(file, `duplicate id="${m[1]}"`);
    seen.add(m[1]);
  }
}

if (problems.length) {
  console.error(`check-html: ${problems.length} problem(s)`);
  for (const p of problems) console.error('  ' + p);
  process.exit(1);
}
console.log(`check-html: OK (${htmlFiles.length} pages)`);
