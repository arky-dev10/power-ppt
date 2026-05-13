// POST /api/workspaces  → crea workspace
// GET  /api/workspaces  → lista
import type { APIRoute } from 'astro';
import { createWorkspace, listWorkspaces, WORKSPACE_TYPES } from '../../../lib/workspaces.mjs';

export const prerender = false;

export const GET: APIRoute = () => {
  return Response.json({ ok: true, workspaces: listWorkspaces() });
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const body = await request.json() as any;
    const title = String(body.title ?? '').trim();
    if (!title) return Response.json({ ok: false, error: 'title_required' }, { status: 400 });
    const type = String(body.type ?? 'general');
    if (!(type in WORKSPACE_TYPES)) return Response.json({ ok: false, error: 'invalid_type' }, { status: 400 });
    const meta = createWorkspace({ title, type });
    return Response.json({ ok: true, workspace: meta }, { status: 201 });
  } catch (err: any) {
    return Response.json({ ok: false, error: String(err?.message ?? err) }, { status: 500 });
  }
};
