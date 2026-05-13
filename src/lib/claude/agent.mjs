// Wraps Claude Agent SDK with our custom tools and project-scoped defaults.
// No API key — uses Claude Code OAuth credentials from ~/.claude (Max plan).

import { query, tool, createSdkMcpServer } from '@anthropic-ai/claude-agent-sdk';
import { z } from 'zod';
import fs from 'node:fs';
import path from 'node:path';
import { generatePresentation, makeSlug } from '../generatePresentation.mjs';

const ROOT = process.cwd();
const CANDIDATES_DIR = path.join(ROOT, 'candidates');

// ──────────────────────────────────────────────────────────────────────
// Custom tools
// ──────────────────────────────────────────────────────────────────────

const listCandidates = tool(
  'list_candidates',
  'Lista todos los candidatos en el sistema con metadata básica (slug, nombre, cargo, territorio, fase status). Úsalo al inicio cuando el usuario pregunte por candidatos existentes o quieras orientarte.',
  {},
  async () => {
    if (!fs.existsSync(CANDIDATES_DIR)) {
      return { content: [{ type: 'text', text: 'Sin candidatos aún. Pídeme crear uno.' }] };
    }
    const dirs = fs.readdirSync(CANDIDATES_DIR, { withFileTypes: true })
      .filter(d => d.isDirectory() && !d.name.startsWith('_') && !d.name.startsWith('.'));
    const items = [];
    for (const d of dirs) {
      const p = path.join(CANDIDATES_DIR, d.name, 'candidate.json');
      if (!fs.existsSync(p)) continue;
      try {
        const c = JSON.parse(fs.readFileSync(p, 'utf-8'));
        items.push({
          slug: d.name,
          nombre: c.candidato?.nombre_completo,
          cargo: c.postulacion?.cargo_codigo,
          territorio: c.postulacion?.nombre_territorio,
          fase_1: c.fase_1?.modo_actual,
          fase_2: c.fase_2?.estado,
          updated: c.updated,
        });
      } catch {}
    }
    return { content: [{ type: 'text', text: JSON.stringify(items, null, 2) }] };
  }
);

const regeneratePresentation = tool(
  'regenerate_presentation',
  'Regenera el archivo presentation.json de un candidato a partir de su candidate.json actual. Úsalo después de modificar cualquier sección (estrategia, propuestas, branding, diagnóstico, etc).',
  { slug: z.string().describe('Slug del candidato, ej: "pedro-perez-sjl-2026"') },
  async ({ slug }) => {
    const dir = path.join(CANDIDATES_DIR, slug);
    const cPath = path.join(dir, 'candidate.json');
    if (!fs.existsSync(cPath)) {
      return { content: [{ type: 'text', text: `Error: candidato "${slug}" no existe` }], isError: true };
    }
    const candidate = JSON.parse(fs.readFileSync(cPath, 'utf-8'));
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
    fs.writeFileSync(cPath, JSON.stringify(candidate, null, 2), 'utf-8');

    return { content: [{ type: 'text', text: `Presentación regenerada: ${pres.slides.length} slides en candidates/${slug}/presentation.json` }] };
  }
);

const createCandidateQuick = tool(
  'create_candidate_quick',
  'Crea un nuevo candidato con datos mínimos de Fase 1 Rápida. Genera el slug, crea la estructura de carpetas y escribe candidate.json + presentation.json inicial. Devuelve el slug.',
  {
    nombre_completo: z.string(),
    cargo_codigo: z.enum(['alcalde_distrital','alcalde_provincial','regidor','consejero_regional','gobernador_regional','congresista','presidente']),
    nombre_territorio: z.string(),
    nivel_territorio: z.enum(['distrital','provincial','regional','nacional']),
    fecha_eleccion: z.string().describe('ISO date, ej: "2026-10-04"'),
    organizacion_politica: z.string().optional(),
    tipo: z.enum(['candidato-propio','rival','aliado']).default('candidato-propio'),
  },
  async (data) => {
    if (!fs.existsSync(CANDIDATES_DIR)) fs.mkdirSync(CANDIDATES_DIR, { recursive: true });

    const seed = {
      candidato: { nombre_completo: data.nombre_completo, tipo: data.tipo },
      postulacion: {
        cargo_codigo: data.cargo_codigo,
        nombre_territorio: data.nombre_territorio,
        nivel_territorio: data.nivel_territorio,
        fecha_eleccion: data.fecha_eleccion,
        organizacion_politica: data.organizacion_politica ?? 'Por definir',
      },
    };

    let slug = makeSlug(seed);
    let finalSlug = slug, n = 2;
    while (fs.existsSync(path.join(CANDIDATES_DIR, finalSlug))) finalSlug = `${slug}-${n++}`;

    const dir = path.join(CANDIDATES_DIR, finalSlug);
    fs.mkdirSync(dir, { recursive: true });
    fs.mkdirSync(path.join(dir, 'research'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'history'), { recursive: true });
    fs.mkdirSync(path.join(dir, 'analysis'), { recursive: true });

    const now = new Date().toISOString();
    const candidate = {
      slug: finalSlug,
      presentacion_id: crypto.randomUUID(),
      created: now,
      updated: now,
      meta: { fecha_sesion: now.slice(0, 10) },
      ...seed,
      estrategia: {},
      diagnostico_inicial: { fortalezas: [], debilidades: [], oportunidades: [], amenazas: [], principales_competidores: [] },
      propuestas: [],
      branding: { slogan: '', color_primario: '#fbc02d' },
      contexto_territorio: {},
      fase_1: { modo_actual: 'rapida', rapida: { estado: 'parcial', fecha: now.slice(0, 10), completitud_pct: 30 } },
      fase_2: { estado: 'pendiente' },
      analisis: {},
      research_files: [],
    };

    fs.writeFileSync(path.join(dir, 'candidate.json'), JSON.stringify(candidate, null, 2), 'utf-8');

    const pres = generatePresentation(candidate);
    fs.writeFileSync(path.join(dir, 'presentation.json'), JSON.stringify(pres, null, 2), 'utf-8');

    return { content: [{ type: 'text', text: `Candidato creado: slug="${finalSlug}". Carpeta en candidates/${finalSlug}/. Datos básicos guardados; ahora pregunta al usuario por estrategia, diagnóstico, propuestas y branding para completar la Fase 1 Rápida.` }] };
  }
);

// ──────────────────────────────────────────────────────────────────────
// MCP server bundling our tools
// ──────────────────────────────────────────────────────────────────────

const powerPptServer = createSdkMcpServer({
  name: 'power-ppt',
  version: '0.1.0',
  tools: [listCandidates, regeneratePresentation, createCandidateQuick],
});

// ──────────────────────────────────────────────────────────────────────
// System prompt — orienta a Claude sobre el dominio
// ──────────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `Eres un asistente de Goberna Consultoría Política. Ayudas a consultores a crear y mantener candidatos en el sistema power-ppt.

Estructura de archivos (todo bajo el directorio actual):
- candidates/[slug]/candidate.json — datos del candidato (Fase 1 Rápida)
- candidates/[slug]/presentation.json — slides generadas
- candidates/[slug]/research/ — documentos fuente
- candidates/[slug]/analysis/ — análisis estratégicos
- FLUJO.md — documento maestro de la metodología ECD + 5N + Cruces
- CLAUDE.md — protocolo operativo detallado

Tools disponibles:
- list_candidates → lista candidatos existentes
- create_candidate_quick → crea uno nuevo con datos mínimos
- regenerate_presentation → regenera presentation.json después de cambios
- Read / Write / Edit / Glob / Grep → para tocar archivos directamente

Reglas:
1. Cuando el usuario menciona un candidato sin slug, llama list_candidates primero para identificarlo.
2. Al modificar candidate.json, después llama regenerate_presentation.
3. Sé conciso. El consultor está apurado.
4. Si necesitas info que no tienes, pregunta — NO inventes datos.
5. Después de crear o modificar, confirma con el slug y qué cambió.`;

// ──────────────────────────────────────────────────────────────────────
// Public API
// ──────────────────────────────────────────────────────────────────────

/**
 * Ejecuta un prompt en Claude y devuelve un async iterator de mensajes SDK.
 * Auth: usa credenciales de Claude Code (~/.claude) — Max plan, sin API key.
 *
 * @param {string} prompt
 * @param {object} [opts]
 * @param {string} [opts.candidateSlug] - slug del candidato actual (para contexto)
 * @param {AbortController} [opts.abortController]
 */
export function runChat(prompt, opts = {}) {
  const contextPrefix = opts.candidateSlug
    ? `[Candidato actual: ${opts.candidateSlug}]\n\n`
    : '';

  return query({
    prompt: contextPrefix + prompt,
    options: {
      cwd: ROOT,
      // En el contenedor, claude está instalado globalmente como CLI.
      // En dev local, el SDK lo encuentra solo.
      pathToClaudeCodeExecutable: process.env.CLAUDE_CODE_BIN || undefined,
      systemPrompt: SYSTEM_PROMPT,
      mcpServers: { 'power-ppt': powerPptServer },
      allowedTools: [
        'Read', 'Write', 'Edit', 'Glob', 'Grep',
        'mcp__power-ppt__list_candidates',
        'mcp__power-ppt__regenerate_presentation',
        'mcp__power-ppt__create_candidate_quick',
      ],
      permissionMode: 'bypassPermissions',
      abortController: opts.abortController,
    },
  });
}
