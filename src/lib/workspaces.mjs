// Workspace data model + helpers.
// A workspace replaces the old per-tool folders (candidates/, vetting/, diagnostics/, projects/).
// Layout:
//   workspaces/[id]/
//     meta.json         ← { id, title, type, created, updated, tags? }
//     chat.json         ← [{ role, content, ts, attachments? }, …]
//     research/         ← uploaded source files
//     outputs/          ← presentation.json, profile.json, territorial.json, vetting-report.json, …

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
export const WORKSPACES_DIR = path.join(ROOT, 'workspaces');

// Types (slug → label) — used to decorate cards and tabs
export const WORKSPACE_TYPES = {
  presentation: 'Presentación',
  candidate:    'Candidato',
  vetting:      'Perfil 5N',
  diagnostic:   'Diagnóstico territorial',
  general:      'General',
};

export function ensureWorkspacesDir() {
  if (!fs.existsSync(WORKSPACES_DIR)) fs.mkdirSync(WORKSPACES_DIR, { recursive: true });
}

export function workspaceDir(id) {
  return path.join(WORKSPACES_DIR, id);
}

export function listWorkspaces() {
  if (!fs.existsSync(WORKSPACES_DIR)) return [];
  const items = [];
  for (const d of fs.readdirSync(WORKSPACES_DIR, { withFileTypes: true })) {
    if (!d.isDirectory() || d.name.startsWith('.') || d.name.startsWith('_')) continue;
    const meta = readMeta(d.name);
    if (!meta) continue;
    items.push(meta);
  }
  return items.sort((a, b) => (b.updated ?? '').localeCompare(a.updated ?? ''));
}

export function readMeta(id) {
  const p = path.join(WORKSPACES_DIR, id, 'meta.json');
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  } catch { return null; }
}

export function writeMeta(id, meta) {
  ensureWorkspaceLayout(id);
  meta.updated = new Date().toISOString();
  fs.writeFileSync(path.join(WORKSPACES_DIR, id, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
  return meta;
}

export function ensureWorkspaceLayout(id) {
  const d = workspaceDir(id);
  for (const sub of ['', 'research', 'outputs']) {
    const p = path.join(d, sub);
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
}

export function slugify(input) {
  return String(input ?? '')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'workspace';
}

export function uniqueId(baseSlug) {
  ensureWorkspacesDir();
  let id = baseSlug, n = 2;
  while (fs.existsSync(path.join(WORKSPACES_DIR, id))) id = `${baseSlug}-${n++}`;
  return id;
}

export function createWorkspace({ title, type = 'general', ...rest }) {
  const id = uniqueId(slugify(title));
  ensureWorkspaceLayout(id);
  const now = new Date().toISOString();
  const meta = {
    id,
    title: title ?? id,
    type,
    created: now,
    updated: now,
    ...rest,
  };
  fs.writeFileSync(path.join(WORKSPACES_DIR, id, 'meta.json'), JSON.stringify(meta, null, 2), 'utf-8');
  fs.writeFileSync(path.join(WORKSPACES_DIR, id, 'chat.json'), JSON.stringify([], null, 2), 'utf-8');
  return meta;
}

// ── Files (research/) ──────────────────────────────────────────────────

export function listResearchFiles(id) {
  const d = path.join(WORKSPACES_DIR, id, 'research');
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d, { withFileTypes: true })
    .filter(e => e.isFile() && !e.name.startsWith('.'))
    .map(e => {
      const stat = fs.statSync(path.join(d, e.name));
      return {
        name: e.name,
        size: stat.size,
        mtime: stat.mtime.toISOString(),
        ext: path.extname(e.name).toLowerCase().slice(1) || 'file',
      };
    })
    .sort((a, b) => b.mtime.localeCompare(a.mtime));
}

// ── Outputs (outputs/) ─────────────────────────────────────────────────

export function listOutputs(id) {
  const d = path.join(WORKSPACES_DIR, id, 'outputs');
  if (!fs.existsSync(d)) return [];
  return fs.readdirSync(d)
    .filter(n => n.endsWith('.json'))
    .map(n => ({
      name: n,
      path: path.join(d, n),
    }));
}

export function readOutput(id, name) {
  const p = path.join(WORKSPACES_DIR, id, 'outputs', name);
  if (!fs.existsSync(p)) return null;
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  catch { return null; }
}

// ── Chat (chat.json) ───────────────────────────────────────────────────

export function readChat(id) {
  const p = path.join(WORKSPACES_DIR, id, 'chat.json');
  if (!fs.existsSync(p)) return [];
  try { return JSON.parse(fs.readFileSync(p, 'utf-8')); }
  catch { return []; }
}

export function appendChat(id, msg) {
  const log = readChat(id);
  log.push({ ts: new Date().toISOString(), ...msg });
  fs.writeFileSync(path.join(WORKSPACES_DIR, id, 'chat.json'), JSON.stringify(log, null, 2), 'utf-8');
  // Update workspace updated timestamp
  const meta = readMeta(id);
  if (meta) writeMeta(id, meta);
  return log;
}

export function clearChat(id) {
  fs.writeFileSync(path.join(WORKSPACES_DIR, id, 'chat.json'), '[]', 'utf-8');
}
