// PUT /api/candidates/:slug/slides/:slideId — actualizar un slide
import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';

export const prerender = false;

export const PUT: APIRoute = async ({ params, request }) => {
  try {
    const { slug, slideId } = params as { slug: string; slideId: string };
    const dir = path.join(process.cwd(), 'candidates', slug);
    const presPath = path.join(dir, 'presentation.json');
    if (!fs.existsSync(presPath)) {
      return new Response(JSON.stringify({ ok: false, error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    const pres = JSON.parse(fs.readFileSync(presPath, 'utf-8'));
    const updates = await request.json() as any;
    const idx = pres.slides.findIndex((s: any) => s.id === slideId);
    if (idx === -1) {
      return new Response(JSON.stringify({ ok: false, error: 'Slide not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }

    pres.slides[idx] = { ...pres.slides[idx], ...updates };
    fs.writeFileSync(presPath, JSON.stringify(pres, null, 2), 'utf-8');

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
