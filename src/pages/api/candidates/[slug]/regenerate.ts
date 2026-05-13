// POST /api/candidates/:slug/regenerate — rebuild presentation.json desde candidate.json
import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { generatePresentation } from '../../../../lib/generatePresentation.mjs';

export const prerender = false;

export const POST: APIRoute = async ({ params }) => {
  try {
    const slug = params.slug as string;
    const dir = path.join(process.cwd(), 'candidates', slug);
    const candPath = path.join(dir, 'candidate.json');
    if (!fs.existsSync(candPath)) {
      return new Response(JSON.stringify({ ok: false, error: 'Not found' }), { status: 404, headers: { 'Content-Type': 'application/json' } });
    }
    const candidate = JSON.parse(fs.readFileSync(candPath, 'utf-8'));
    const pres = generatePresentation(candidate);
    fs.writeFileSync(path.join(dir, 'presentation.json'), JSON.stringify(pres, null, 2), 'utf-8');

    candidate.updated = new Date().toISOString();
    candidate.fase_2 = {
      estado: 'generada',
      fecha: candidate.updated.slice(0, 10),
      modo: 'rapida',
      archivo: 'presentation.json',
      slides_count: pres.slides.length,
    };
    fs.writeFileSync(candPath, JSON.stringify(candidate, null, 2), 'utf-8');

    return new Response(JSON.stringify({ ok: true, slides_count: pres.slides.length }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500, headers: { 'Content-Type': 'application/json' },
    });
  }
};
