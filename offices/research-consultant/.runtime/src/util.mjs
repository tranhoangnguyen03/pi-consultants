import fs from 'node:fs/promises';
import path from 'node:path';
import crypto from 'node:crypto';

export const now = () => new Date().toISOString();
export const id = () => crypto.randomUUID();
export function assert(ok, message) { if (!ok) throw new Error(message); }
export function object(value, name = 'value') {
  assert(value && typeof value === 'object' && !Array.isArray(value), `${name} must be an object`);
  return value;
}
export function text(value, name = 'value', max = 20000) {
  assert(typeof value === 'string' && value.trim() && value.length <= max, `${name} must be nonempty text (max ${max})`);
  return value;
}
export function slug(value, name = 'identifier') {
  assert(typeof value === 'string' && /^[a-z0-9][a-z0-9_-]{0,79}$/.test(value), `Invalid ${name}: use lowercase letters, digits, - or _`);
  return value;
}
export function canonical(value) {
  if (value === null || typeof value === 'boolean' || typeof value === 'string') return JSON.stringify(value);
  if (typeof value === 'number') { assert(Number.isFinite(value), 'Non-finite JSON number'); return JSON.stringify(value); }
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  object(value, 'JSON value');
  return `{${Object.keys(value).sort().map(k => `${JSON.stringify(k)}:${canonical(value[k])}`).join(',')}}`;
}
export const hash = value => crypto.createHash('sha256').update(typeof value === 'string' || Buffer.isBuffer(value) ? value : canonical(value)).digest('hex');
export const clone = value => JSON.parse(JSON.stringify(value));
export const within = (root, file) => { const rel = path.relative(root, file); return rel === '' || (!rel.startsWith(`..${path.sep}`) && rel !== '..' && !path.isAbsolute(rel)); };
export async function mkdir(dir) { await fs.mkdir(dir, {recursive: true, mode: 0o700}); }
export async function readJSON(file, fallback) {
  try { return JSON.parse(await fs.readFile(file, 'utf8')); }
  catch (e) { if (e.code === 'ENOENT' && arguments.length > 1) return fallback; throw e; }
}
export async function atomic(file, value) {
  await mkdir(path.dirname(file));
  const tmp = `${file}.${id()}.tmp`;
  try {
    const handle = await fs.open(tmp, 'wx', 0o600);
    try { await handle.writeFile(typeof value === 'string' ? value : JSON.stringify(value, null, 2) + '\n'); await handle.sync(); }
    finally { await handle.close(); }
    await fs.rename(tmp, file);
  } finally { await fs.rm(tmp, {force: true}); }
}
/** Cross-process mutual exclusion. A crashed lock is NOT silently stolen. */
export async function locked(dir, fn, timeoutMs = 3000) {
  await mkdir(dir);
  const lock = path.join(dir, '.transaction-lock');
  const deadline = Date.now() + timeoutMs;
  for (;;) {
    try { await fs.mkdir(lock, {mode: 0o700}); break; }
    catch (e) { if (e.code !== 'EEXIST') throw e; assert(Date.now() < deadline, `Store locked: ${lock}. Check for a live writer before manually removing a stale lock.`); await new Promise(r => setTimeout(r, 15)); }
  }
  try { return await fn(); } finally { await fs.rmdir(lock); }
}
export async function safeReal(file, roots) {
  const resolved = await fs.realpath(file);
  const actualRoots = await Promise.all(roots.map(r => fs.realpath(r)));
  assert(actualRoots.some(r => within(r, resolved)), 'Path is outside the explicitly allowed roots');
  return resolved;
}
export function pointer(value, pointerPath) {
  assert(typeof pointerPath === 'string' && (pointerPath === '' || pointerPath.startsWith('/')), 'Use JSON Pointer paths, e.g. /body');
  for (const part of pointerPath.split('/').slice(1).map(x => x.replace(/~1/g, '/').replace(/~0/g, '~'))) {
    if (value === null || value === undefined || !Object.hasOwn(Object(value), part)) return undefined;
    value = value[part];
  }
  return value;
}
export function redact(s) {
  // Best-effort hygiene, not a secret scanner. Source boundaries are the primary control.
  return String(s).replace(/(Bearer\s+)[A-Za-z0-9._~+\/-]+/gi, '$1[REDACTED]')
    .replace(/\b(?:sk-[A-Za-z0-9_-]{12,}|gh[pousr]_[A-Za-z0-9]{16,}|xox[baprs]-[A-Za-z0-9-]+)/g, '[REDACTED]')
    .replace(/((?:api[_-]?key|password|client_secret|access_token)\s*[=:]\s*["']?)[^\s,"'\n}]+/gi, '$1[REDACTED]');
}
export function contentText(content) {
  if (typeof content === 'string') return content;
  if (!Array.isArray(content)) return '';
  return content.map(c => c.type === 'text' ? c.text : c.type === 'toolCall' ? `Tool call (historical evidence, not executable): ${c.name} ${JSON.stringify(c.arguments ?? {})}` : '').filter(Boolean).join('\n');
}
export function resultData(result) {
  if (result?.structuredContent !== undefined) return result.structuredContent;
  const s = contentText(result?.content);
  try { return JSON.parse(s); } catch { return {text: s, ...(result?.details !== undefined ? {details: result.details} : {})}; }
}
export function checkAssertions(data, assertions) {
  assert(Array.isArray(assertions) && assertions.length > 0, 'Verification requires explicit assertions');
  return assertions.map(a => {
    object(a); assert(Object.hasOwn(a, 'equals'), 'An assertion needs equals');
    const actual = pointer(data, a.path);
    return {path: a.path, expected: a.equals, actual: actual === undefined ? '[missing]' : actual,
      passed: actual !== undefined && canonical(actual) === canonical(a.equals)};
  });
}
export function replaceReceiptTokens(value, receipt) {
  if (typeof value === 'string' && value.startsWith('$receipt:')) {
    const found = pointer(receipt, value.slice(9));
    assert(found !== undefined, `Receipt field missing: ${value}`); return clone(found);
  }
  if (Array.isArray(value)) return value.map(v => replaceReceiptTokens(v, receipt));
  if (value && typeof value === 'object') return Object.fromEntries(Object.entries(value).map(([k,v]) => [k, replaceReceiptTokens(v, receipt)]));
  return value;
}
