#!/usr/bin/env node
// Migra candidates/ vetting/ diagnostics/ projects/ → workspaces/[id]/
// Idempotente: si el workspace ya existe (mismo id), se salta.
//
// Uso:
//   node scripts/migrate-to-workspaces.mjs                  # dry-run
//   node scripts/migrate-to-workspaces.mjs --apply          # ejecuta
//   node scripts/migrate-to-workspaces.mjs --apply --delete # borra los originales después

import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const WORKSPACES_DIR = path.join(ROOT, 'workspaces');

const APPLY = process.argv.includes('--apply');
const DELETE = process.argv.includes('--delete');

const CARGO_LABEL = {
  alcalde_distrital:    'Alcalde Distrital',
  alcalde_provincial:   'Alcalde Provincial',
  regidor:              'Regidor',
  consejero_regional:   'Consejero Regional',
  gobernador_regional:  'Gobernador Regional',
  congresista:          'Congresista',
  presidente:           'Presidente',
};

function ensure(dir) { if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true }); }
function exists(p) { return fs.existsSync(p); }
function readJson(p) { try { return JSON.parse(fs.readFileSync(p, 'utf-8')); } catch { return null; } }
function copyFile(src, dest) {
  ensure(path.dirname(dest));
  fs.copyFileSync(src, dest);
}
function copyDirContents(srcDir, destDir) {
  if (!exists(srcDir)) return 0;
  ensure(destDir);
  let count = 0;
  for (const e of fs.readdirSync(srcDir, { withFileTypes: true })) {
    if (e.name.startsWith('.')) continue;
    const s = path.join(srcDir, e.name);
    const d = path.join(destDir, e.name);
    if (e.isDirectory()) count += copyDirContents(s, d);
    else { copyFile(s, d); count++; }
  }
  return count;
}

const log = [];
function record(action, src, dest, meta) { log.push({ action, src, dest, meta }); }

// ── 1. candidates/[slug] → workspace tipo 'candidate' ──────────────────
function migrateCandidate(slug) {
  const srcDir = path.join(ROOT, 'candidates', slug);
  const candPath = path.join(srcDir, 'candidate.json');
  if (!exists(candPath)) return;
  const c = readJson(candPath);
  const title = c?.candidato?.nombre_completo
    ? `${c.candidato.nombre_completo} · ${c.postulacion?.nombre_territorio ?? ''} ${c.postulacion?.fecha_eleccion ? new Date(c.postulacion.fecha_eleccion).getFullYear() : ''}`.trim()
    : slug;

  const destId = slug; // mantener slug = id
  const destDir = path.join(WORKSPACES_DIR, destId);
  if (exists(destDir)) return record('SKIP_EXISTS', srcDir, destDir);

  const meta = {
    id: destId,
    title,
    type: 'candidate',
    created: c?.created ?? new Date().toISOString(),
    updated: c?.updated ?? c?.created ?? new Date().toISOString(),
    tags: [c?.postulacion?.cargo_codigo, c?.postulacion?.nombre_territorio].filter(Boolean),
    source: { kind: 'candidate', slug },
  };

  if (APPLY) {
    ensure(destDir);
    ensure(path.join(destDir, 'research'));
    ensure(path.join(destDir, 'outputs'));
    fs.writeFileSync(path.join(destDir, 'meta.json'), JSON.stringify(meta, null, 2));
    fs.writeFileSync(path.join(destDir, 'chat.json'), '[]');
    // Outputs
    if (exists(path.join(srcDir, 'candidate.json'))) copyFile(path.join(srcDir, 'candidate.json'), path.join(destDir, 'outputs', 'candidate.json'));
    if (exists(path.join(srcDir, 'profile.json'))) copyFile(path.join(srcDir, 'profile.json'), path.join(destDir, 'outputs', 'profile.json'));
    if (exists(path.join(srcDir, 'territorial.json'))) copyFile(path.join(srcDir, 'territorial.json'), path.join(destDir, 'outputs', 'territorial.json'));
    if (exists(path.join(srcDir, 'presentation.json'))) copyFile(path.join(srcDir, 'presentation.json'), path.join(destDir, 'outputs', 'presentation.json'));
    if (exists(path.join(srcDir, 'analysis'))) copyDirContents(path.join(srcDir, 'analysis'), path.join(destDir, 'outputs', 'analysis'));
    if (exists(path.join(srcDir, 'research'))) copyDirContents(path.join(srcDir, 'research'), path.join(destDir, 'research'));
  }
  record('MIGRATE_CANDIDATE', srcDir, destDir, { title, type: meta.type });
}

// ── 2. vetting/[slug] → workspace tipo 'vetting' ───────────────────────
function migrateVetting(slug) {
  const srcDir = path.join(ROOT, 'vetting', slug);
  const profilePath = path.join(srcDir, 'profile.json');
  if (!exists(profilePath)) return;
  const p = readJson(profilePath);
  const title = p?.meta?.nombre ? `${p.meta.nombre} · 5N` : `Vetting ${slug}`;

  const destId = `vetting-${slug}`;
  const destDir = path.join(WORKSPACES_DIR, destId);
  if (exists(destDir)) return record('SKIP_EXISTS', srcDir, destDir);

  const meta = {
    id: destId,
    title,
    type: 'vetting',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    tags: [p?.meta?.cargo, p?.meta?.tipo].filter(Boolean),
    source: { kind: 'vetting', slug },
  };

  if (APPLY) {
    ensure(destDir);
    ensure(path.join(destDir, 'research'));
    ensure(path.join(destDir, 'outputs'));
    fs.writeFileSync(path.join(destDir, 'meta.json'), JSON.stringify(meta, null, 2));
    fs.writeFileSync(path.join(destDir, 'chat.json'), '[]');
    if (exists(profilePath)) copyFile(profilePath, path.join(destDir, 'outputs', 'profile.json'));
    if (exists(path.join(srcDir, 'report.json'))) copyFile(path.join(srcDir, 'report.json'), path.join(destDir, 'outputs', 'vetting-report.json'));
    if (exists(path.join(srcDir, 'research'))) copyDirContents(path.join(srcDir, 'research'), path.join(destDir, 'research'));
  }
  record('MIGRATE_VETTING', srcDir, destDir, { title });
}

// ── 3. diagnostics/[slug] → workspace tipo 'diagnostic' ────────────────
function migrateDiagnostic(slug) {
  const srcDir = path.join(ROOT, 'diagnostics', slug);
  const tPath = path.join(srcDir, 'territorial.json');
  if (!exists(tPath)) return;
  const t = readJson(tPath);
  const title = t?.meta?.nombre_territorio ? `${t.meta.nombre_territorio} · Diagnóstico` : `Diagnóstico ${slug}`;

  const destId = `diagnostic-${slug}`;
  const destDir = path.join(WORKSPACES_DIR, destId);
  if (exists(destDir)) return record('SKIP_EXISTS', srcDir, destDir);

  const meta = {
    id: destId,
    title,
    type: 'diagnostic',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    tags: [t?.meta?.nivel, t?.meta?.eleccion_cargo].filter(Boolean),
    source: { kind: 'diagnostic', slug },
  };

  if (APPLY) {
    ensure(destDir);
    ensure(path.join(destDir, 'research'));
    ensure(path.join(destDir, 'outputs'));
    fs.writeFileSync(path.join(destDir, 'meta.json'), JSON.stringify(meta, null, 2));
    fs.writeFileSync(path.join(destDir, 'chat.json'), '[]');
    if (exists(tPath)) copyFile(tPath, path.join(destDir, 'outputs', 'territorial.json'));
    if (exists(path.join(srcDir, 'research'))) copyDirContents(path.join(srcDir, 'research'), path.join(destDir, 'research'));
  }
  record('MIGRATE_DIAGNOSTIC', srcDir, destDir, { title });
}

// ── 4. projects/[slug] → workspace tipo 'presentation' ─────────────────
function migrateProject(slug) {
  const srcDir = path.join(ROOT, 'projects', slug);
  const presPath = path.join(srcDir, 'presentation.json');
  if (!exists(presPath)) return;
  const p = readJson(presPath);
  const title = p?.meta?.title ?? slug;

  const destId = `pres-${slug}`;
  const destDir = path.join(WORKSPACES_DIR, destId);
  if (exists(destDir)) return record('SKIP_EXISTS', srcDir, destDir);

  const meta = {
    id: destId,
    title,
    type: 'presentation',
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
    tags: [p?.meta?.subtitle].filter(Boolean),
    source: { kind: 'presentation', slug },
  };

  if (APPLY) {
    ensure(destDir);
    ensure(path.join(destDir, 'research'));
    ensure(path.join(destDir, 'outputs'));
    fs.writeFileSync(path.join(destDir, 'meta.json'), JSON.stringify(meta, null, 2));
    fs.writeFileSync(path.join(destDir, 'chat.json'), '[]');
    copyFile(presPath, path.join(destDir, 'outputs', 'presentation.json'));
    if (exists(path.join(srcDir, 'research'))) copyDirContents(path.join(srcDir, 'research'), path.join(destDir, 'research'));
    if (exists(path.join(srcDir, 'brief.md'))) copyFile(path.join(srcDir, 'brief.md'), path.join(destDir, 'research', 'brief.md'));
    if (exists(path.join(srcDir, 'context.md'))) copyFile(path.join(srcDir, 'context.md'), path.join(destDir, 'research', 'context.md'));
  }
  record('MIGRATE_PROJECT', srcDir, destDir, { title });
}

// ── Run ────────────────────────────────────────────────────────────────
console.log(`Migration ${APPLY ? '(APPLY)' : '(DRY RUN)'}\n`);

if (APPLY) ensure(WORKSPACES_DIR);

for (const slug of (exists(path.join(ROOT, 'candidates')) ? fs.readdirSync(path.join(ROOT, 'candidates')) : [])) {
  if (slug.startsWith('.') || slug.startsWith('_')) continue;
  migrateCandidate(slug);
}
for (const slug of (exists(path.join(ROOT, 'vetting')) ? fs.readdirSync(path.join(ROOT, 'vetting')) : [])) {
  if (slug.startsWith('.') || slug.startsWith('_')) continue;
  migrateVetting(slug);
}
for (const slug of (exists(path.join(ROOT, 'diagnostics')) ? fs.readdirSync(path.join(ROOT, 'diagnostics')) : [])) {
  if (slug.startsWith('.') || slug.startsWith('_')) continue;
  migrateDiagnostic(slug);
}
for (const slug of (exists(path.join(ROOT, 'projects')) ? fs.readdirSync(path.join(ROOT, 'projects')) : [])) {
  if (slug.startsWith('.') || slug.startsWith('_')) continue;
  migrateProject(slug);
}

console.log(`\n${log.length} acciones:`);
for (const l of log) {
  const rel = (p) => p.replace(ROOT + '/', '');
  console.log(`  ${l.action.padEnd(20)} ${rel(l.src)} → ${rel(l.dest)} ${l.meta?.title ? `(${l.meta.title})` : ''}`);
}

if (!APPLY) {
  console.log('\nDry-run. Para ejecutar: node scripts/migrate-to-workspaces.mjs --apply');
} else if (DELETE) {
  console.log('\nBorrando originales...');
  // No implementado en este sprint — el usuario decide cuándo borrar después de verificar.
  console.log('  (delete flag será implementado después de validar migración)');
}
