/* WCAG 2.2 AA contrast checker for the colour tokens in styles.css.
   Reads the :root custom properties, then verifies the text pairs the site
   actually uses: body/heading text on each ground, muted text, brass accents,
   status colours, and button faces. 4.5:1 for body text, 3:1 for large text
   and non-text UI (WCAG 1.4.3 / 1.4.11). */
import { readFileSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const css = readFileSync(join(root, 'assets/css/styles.css'), 'utf8');

/* Collect custom properties from the first :root block. */
const tokens = {};
const rootBlock = css.match(/:root\s*\{([\s\S]*?)\n\}/);
if (!rootBlock) {
  console.error('check-contrast: could not find :root block');
  process.exit(1);
}
for (const m of rootBlock[1].matchAll(/(--[\w-]+):\s*([^;]+);/g)) {
  tokens[m[1]] = m[2].trim();
}

const resolveVar = (name, depth = 0) => {
  if (depth > 8) return null;
  if (name.startsWith('#')) return name;
  const value = tokens[name];
  if (!value) return null;
  const varRef = value.match(/^var\((--[\w-]+)\)$/);
  if (varRef) return resolveVar(varRef[1], depth + 1);
  return value;
};

const toRgb = (hex) => {
  const m = hex.match(/^#([0-9a-f]{6})$/i);
  if (!m) return null;
  const n = parseInt(m[1], 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
};

const luminance = ([r, g, b]) => {
  const f = (c) => {
    c /= 255;
    return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};

const ratio = (a, b) => {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
};

/* [foreground token, background token, minimum, description] */
const pairs = [
  ['--ink', '--paper', 4.5, 'body text on paper'],
  ['--ink', '--paper-2', 4.5, 'body text on paper-2'],
  ['--ink', '--green-050', 4.5, 'body text on green tint'],
  ['--ink-soft', '--paper', 4.5, 'soft text on paper'],
  ['--ink-muted', '--paper', 4.5, 'muted text on paper'],
  ['--ink-muted', '--paper-2', 4.5, 'muted text on paper-2'],
  ['--green-700', '--paper', 4.5, 'brand green text on paper'],
  ['--green-900', '--paper', 4.5, 'header ground text'],
  ['--gold-700', '--paper', 4.5, 'brass text on paper'],
  ['--gold-700', '--paper-2', 4.5, 'brass text on paper-2'],
  ['--gold-400', '--green-900', 4.5, 'brass on dark green'],
  ['--paper', '--green-900', 4.5, 'paper text on dark green'],
  ['--paper', '--green-800', 4.5, 'paper text on green-800'],
  ['--paper', '--green-700', 4.5, 'button face (primary)'],
  ['--danger', '--paper', 4.5, 'error text on paper'],
  ['--danger', '--danger-bg', 4.5, 'error text on error ground'],
  ['--success', '--success-bg', 4.5, 'success text on success ground'],
  ['--gold-600', '--green-900', 3, 'focus ring on dark ground (UI)'],
  ['--line-control', '--paper', 3, 'control border on paper (UI)'],
  ['--line-control', '#ffffff', 3, 'control border on input face (UI)']
];

const problems = [];
for (const [fgName, bgName, min, label] of pairs) {
  const fg = toRgb(resolveVar(fgName) || '');
  const bg = toRgb(resolveVar(bgName) || '');
  if (!fg || !bg) {
    problems.push(`unknown token in pair: ${fgName} on ${bgName}`);
    continue;
  }
  const r = ratio(fg, bg);
  if (r < min) {
    problems.push(`${label}: ${fgName} on ${bgName} = ${r.toFixed(2)}:1 (needs ${min}:1)`);
  } else {
    console.log(`  ok  ${r.toFixed(2)}:1  ${label}`);
  }
}

if (problems.length) {
  console.error(`check-contrast: ${problems.length} failure(s)`);
  for (const p of problems) console.error('  FAIL ' + p);
  process.exit(1);
}
console.log(`check-contrast: OK (${pairs.length} pairs, WCAG 2.2 AA)`);
