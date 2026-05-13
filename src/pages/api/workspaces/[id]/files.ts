// GET    /api/workspaces/:id/files          → lista archivos en research/
// POST   /api/workspaces/:id/files          → sube uno o más (multipart)
// DELETE /api/workspaces/:id/files?name=…   → borra uno
import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { WORKSPACES_DIR, ensureWorkspaceLayout, listResearchFiles, readMeta, writeMeta } from '../../../../lib/workspaces.mjs';

export const prerender = false;

const MAX_SIZE = 25 * 1024 * 1024; // 25 MB
const FORBIDDEN_EXT = new Set(['exe','sh','bat','cmd','dll','so','dylib','msi','ps1','vbs','app']);

function safeName(name: string): string {
  // Strip path separators and weird chars; keep extension
  const base = name.replace(/[/\\]/g, '_').replace(/[^a-zA-Z0-9._ -]/g, '_').slice(0, 200);
  return base || 'file';
}

export const GET: APIRoute = ({ params }) => {
  const id = params.id as string;
  if (!readMeta(id)) return Response.json({ ok: false, error: 'workspace_not_found' }, { status: 404 });
  return Response.json({ ok: true, files: listResearchFiles(id) });
};

export const POST: APIRoute = async ({ params, request }) => {
  const id = params.id as string;
  const meta = readMeta(id);
  if (!meta) return Response.json({ ok: false, error: 'workspace_not_found' }, { status: 404 });

  try {
    const form = await request.formData();
    ensureWorkspaceLayout(id);
    const dir = path.join(WORKSPACES_DIR, id, 'research');

    const saved: any[] = [];
    const skipped: any[] = [];
    for (const [field, val] of form.entries()) {
      if (!(val instanceof File)) continue;
      if (val.size === 0) { skipped.push({ name: val.name, reason: 'empty' }); continue; }
      if (val.size > MAX_SIZE) { skipped.push({ name: val.name, reason: 'too_large' }); continue; }
      const ext = path.extname(val.name).toLowerCase().slice(1);
      if (FORBIDDEN_EXT.has(ext)) { skipped.push({ name: val.name, reason: 'forbidden_extension' }); continue; }

      let target = path.join(dir, safeName(val.name));
      // Avoid overwrite: append (1), (2)…
      let n = 1;
      const parsed = path.parse(target);
      while (fs.existsSync(target)) {
        target = path.join(parsed.dir, `${parsed.name} (${n})${parsed.ext}`);
        n++;
      }
      const buf = Buffer.from(await val.arrayBuffer());
      fs.writeFileSync(target, buf);
      saved.push({ name: path.basename(target), size: val.size, ext });
    }

    // Bump updated
    writeMeta(id, meta);

    return Response.json({ ok: true, saved, skipped }, { status: 201 });
  } catch (err: any) {
    return Response.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
  }
};

export const DELETE: APIRoute = ({ params, url }) => {
  const id = params.id as string;
  const meta = readMeta(id);
  if (!meta) return Response.json({ ok: false, error: 'workspace_not_found' }, { status: 404 });
  const name = url.searchParams.get('name') ?? '';
  if (!name) return Response.json({ ok: false, error: 'name_required' }, { status: 400 });
  const safe = safeName(name);
  const target = path.join(WORKSPACES_DIR, id, 'research', safe);
  if (!target.startsWith(path.join(WORKSPACES_DIR, id, 'research') + path.sep)) {
    return Response.json({ ok: false, error: 'forbidden' }, { status: 403 });
  }
  if (!fs.existsSync(target)) return Response.json({ ok: false, error: 'not_found' }, { status: 404 });
  fs.unlinkSync(target);
  writeMeta(id, meta);
  return Response.json({ ok: true });
};
