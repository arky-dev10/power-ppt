import { defineConfig } from 'astro/config';
import tailwind from '@astrojs/tailwind';
import node from '@astrojs/node';
import fs from 'node:fs';
import path from 'node:path';
import { generatePresentation, makeSlug } from './src/lib/generatePresentation.mjs';

// ─── helpers ────────────────────────────────────────────────────────────────

function readBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => { raw += chunk; });
    req.on('end', () => {
      try { resolve(JSON.parse(raw)); }
      catch (e) { reject(e); }
    });
    req.on('error', reject);
  });
}

function json(res, status, data) {
  const body = JSON.stringify(data);
  res.writeHead(status, { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) });
  res.end(body);
}

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

// ─── config ─────────────────────────────────────────────────────────────────

export default defineConfig({
  output: 'server',
  adapter: node({ mode: 'standalone' }),
  integrations: [tailwind()],
  vite: {
    plugins: [
      // ── File watcher (hot-reload) ────────────────────────────────────────
      {
        name: 'watch-projects',
        configureServer(server) {
          const watched = [
            './projects/**/presentation.json', './projects',
            './vetting/**/profile.json', './vetting/**/report.json', './vetting',
            './diagnostics/**/territorial.json', './diagnostics',
            './candidates/**/candidate.json', './candidates/**/presentation.json', './candidates',
          ];
          watched.forEach(p => server.watcher.add(p));

          server.watcher.on('change', (filePath) => {
            const triggers = ['presentation.json', 'context.md', 'profile.json', 'report.json', 'territorial.json', 'candidate.json'];
            if (triggers.some(t => filePath.endsWith(t))) {
              server.ws.send({ type: 'full-reload' });
            }
          });
          server.watcher.on('addDir', (filePath) => {
            if (['/projects/', '/vetting/', '/diagnostics/', '/candidates/'].some(d => filePath.includes(d))) {
              server.ws.send({ type: 'full-reload' });
            }
          });
        }
      },

      // ── API middleware ───────────────────────────────────────────────────
      {
        name: 'candidates-api',
        configureServer(server) {
          server.middlewares.use(async (req, res, next) => {
            const url = req.url ?? '';

            // POST /api/candidates — crear candidato + generar presentación
            if (req.method === 'POST' && url === '/api/candidates') {
              try {
                const data = await readBody(req);

                // Generar slug único
                let slug = makeSlug(data);
                const candidatesDir = path.join(process.cwd(), 'candidates');
                ensureDir(candidatesDir);

                // Resolver colisión de slug
                let finalSlug = slug;
                let counter = 2;
                while (fs.existsSync(path.join(candidatesDir, finalSlug))) {
                  finalSlug = `${slug}-${counter++}`;
                }

                const candidateDir = path.join(candidatesDir, finalSlug);
                ensureDir(candidateDir);
                ensureDir(path.join(candidateDir, 'research'));
                ensureDir(path.join(candidateDir, 'history'));
                ensureDir(path.join(candidateDir, 'analysis'));

                // Completar candidate.json
                const now = new Date().toISOString();
                const candidate = {
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

                fs.writeFileSync(
                  path.join(candidateDir, 'candidate.json'),
                  JSON.stringify(candidate, null, 2),
                  'utf-8'
                );

                // Generar presentation.json automáticamente
                const presentation = generatePresentation(candidate);
                fs.writeFileSync(
                  path.join(candidateDir, 'presentation.json'),
                  JSON.stringify(presentation, null, 2),
                  'utf-8'
                );

                // Actualizar fase_2 en candidate.json
                candidate.fase_2 = {
                  estado: 'generada',
                  fecha: now.slice(0, 10),
                  modo: 'rapida',
                  archivo: 'presentation.json',
                  slides_count: presentation.slides.length,
                };
                fs.writeFileSync(
                  path.join(candidateDir, 'candidate.json'),
                  JSON.stringify(candidate, null, 2),
                  'utf-8'
                );

                return json(res, 201, { ok: true, slug: finalSlug });
              } catch (err) {
                console.error('[API] POST /api/candidates error:', err);
                return json(res, 500, { ok: false, error: String(err) });
              }
            }

            // PUT /api/candidates/:slug — actualizar slide en presentation.json
            const slideMatch = url.match(/^\/api\/candidates\/([^/]+)\/slides\/([^/?]+)$/);
            if (req.method === 'PUT' && slideMatch) {
              try {
                const [, slug, slideId] = slideMatch;
                const candidateDir = path.join(process.cwd(), 'candidates', slug);
                const presPath = path.join(candidateDir, 'presentation.json');
                if (!fs.existsSync(presPath)) return json(res, 404, { ok: false, error: 'Not found' });

                const pres = JSON.parse(fs.readFileSync(presPath, 'utf-8'));
                const updatedSlide = await readBody(req);
                const idx = pres.slides.findIndex(s => s.id === slideId);
                if (idx === -1) return json(res, 404, { ok: false, error: 'Slide not found' });

                pres.slides[idx] = { ...pres.slides[idx], ...updatedSlide };
                fs.writeFileSync(presPath, JSON.stringify(pres, null, 2), 'utf-8');

                return json(res, 200, { ok: true });
              } catch (err) {
                return json(res, 500, { ok: false, error: String(err) });
              }
            }

            // POST /api/candidates/:slug/regenerate — regenerar presentation.json desde candidate.json
            const regenMatch = url.match(/^\/api\/candidates\/([^/]+)\/regenerate$/);
            if (req.method === 'POST' && regenMatch) {
              try {
                const [, slug] = regenMatch;
                const candidateDir = path.join(process.cwd(), 'candidates', slug);
                const candPath = path.join(candidateDir, 'candidate.json');
                if (!fs.existsSync(candPath)) return json(res, 404, { ok: false, error: 'Not found' });

                const candidate = JSON.parse(fs.readFileSync(candPath, 'utf-8'));
                const presentation = generatePresentation(candidate);
                fs.writeFileSync(
                  path.join(candidateDir, 'presentation.json'),
                  JSON.stringify(presentation, null, 2),
                  'utf-8'
                );

                return json(res, 200, { ok: true, slides_count: presentation.slides.length });
              } catch (err) {
                return json(res, 500, { ok: false, error: String(err) });
              }
            }

            next();
          });
        }
      }
    ]
  }
});
