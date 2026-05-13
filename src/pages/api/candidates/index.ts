// POST /api/candidates — crear candidato + generar presentación
import type { APIRoute } from 'astro';
import fs from 'node:fs';
import path from 'node:path';
import { generatePresentation, makeSlug } from '../../../lib/generatePresentation.mjs';

export const prerender = false;

function ensureDir(p: string) { if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true }); }

export const POST: APIRoute = async ({ request }) => {
  try {
    const data: any = await request.json();
    const candidatesDir = path.join(process.cwd(), 'candidates');
    ensureDir(candidatesDir);

    const baseSlug = makeSlug(data);
    let finalSlug = baseSlug, n = 2;
    while (fs.existsSync(path.join(candidatesDir, finalSlug))) finalSlug = `${baseSlug}-${n++}`;

    const dir = path.join(candidatesDir, finalSlug);
    ensureDir(dir);
    ensureDir(path.join(dir, 'research'));
    ensureDir(path.join(dir, 'history'));
    ensureDir(path.join(dir, 'analysis'));

    const now = new Date().toISOString();
    const candidate: any = {
      slug: finalSlug,
      presentacion_id: crypto.randomUUID(),
      created: now,
      updated: now,
      ...data,
      candidato: data.candidato ?? {},
      postulacion: data.postulacion ?? {},
      estrategia: data.estrategia ?? {},
      diagnostico_inicial: data.diagnostico_inicial ?? {},
      propuestas: data.propuestas ?? [],
      branding: data.branding ?? {},
      contexto_territorio: data.contexto_territorio ?? {},
      fase_1: {
        modo_actual: 'rapida',
        rapida: { estado: 'completa', fecha: now.slice(0, 10), completitud_pct: 100 },
        completa: { parte_a_identidad: { estado: 'pendiente' }, parte_b_terreno: { estado: 'pendiente' } },
      },
      fase_2: { estado: 'pendiente' },
      analisis: {},
      research_files: [],
    };

    fs.writeFileSync(path.join(dir, 'candidate.json'), JSON.stringify(candidate, null, 2), 'utf-8');

    const pres = generatePresentation(candidate);
    fs.writeFileSync(path.join(dir, 'presentation.json'), JSON.stringify(pres, null, 2), 'utf-8');

    candidate.fase_2 = {
      estado: 'generada',
      fecha: now.slice(0, 10),
      modo: 'rapida',
      archivo: 'presentation.json',
      slides_count: pres.slides.length,
    };
    fs.writeFileSync(path.join(dir, 'candidate.json'), JSON.stringify(candidate, null, 2), 'utf-8');

    return new Response(JSON.stringify({ ok: true, slug: finalSlug }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[API] POST /api/candidates error:', err);
    return new Response(JSON.stringify({ ok: false, error: String(err?.message ?? err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
