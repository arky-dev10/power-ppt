// generatePresentation.mjs
// Maps candidate.json (Fase 1 Rápida) → presentation.json (8 slides)
// Puro JS ESM — importable desde astro.config.mjs y desde páginas Astro.

const CARGO_LABEL = {
  alcalde_distrital:    'Alcalde Distrital',
  alcalde_provincial:   'Alcalde Provincial',
  regidor:              'Regidor',
  consejero_regional:   'Consejero Regional',
  gobernador_regional:  'Gobernador Regional',
  congresista:          'Congresista',
  presidente:           'Presidente',
};

const FRENTE_LABEL = {
  TIERRA: 'Tierra',
  MAR:    'Mar',
  AIRE:   'Aire',
};

const CAMPANA_LABEL = {
  RACIONAL:   'Racional — Data y plan de gobierno',
  EMOTIVA:    'Emotiva — Conexión humana',
  INSTINTIVA: 'Instintiva — Imagen y carisma',
  MIXTA:      'Mixta',
};

const EJE_LABEL = {
  PLAN_DE_GOBIERNO: 'Plan de gobierno',
  'EQUIPO_DE_CAMPAÑA': 'Equipo de campaña',
  SIMPATIA:  'Simpatía',
  ESPERANZA: 'Esperanza',
  ODIO:      'Indignación',
  MIEDO:     'Miedo',
};

const AMENAZA_COLOR = { alto: '🔴', medio: '🟡', bajo: '🟢' };

/**
 * Genera presentation.json (modo rápido, 8 slides) desde candidate.json.
 * @param {object} c - candidate.json completo
 * @returns {object} - presentation.json { meta, slides[] }
 */
export function generatePresentation(c) {
  const cargo   = CARGO_LABEL[c.postulacion?.cargo_codigo] ?? c.postulacion?.cargo_codigo ?? '—';
  const año     = c.postulacion?.fecha_eleccion ? new Date(c.postulacion.fecha_eleccion).getFullYear() : '';
  const nombre  = c.candidato?.nombre_completo ?? '—';
  const slogan  = c.branding?.slogan ?? '';
  const color   = c.branding?.color_primario ?? '#fbc02d';
  const territorio = c.postulacion?.nombre_territorio ?? '—';
  const org     = c.postulacion?.organizacion_politica ?? '';

  const frentePrincipal   = FRENTE_LABEL[c.estrategia?.frente_principal] ?? c.estrategia?.frente_principal ?? '—';
  const frentesSecundarios = (c.estrategia?.frentes_secundarios ?? []).map(f => FRENTE_LABEL[f] ?? f);
  const todosFrente = [frentePrincipal, ...frentesSecundarios].join(' · ');

  const tipoCampana = (() => {
    const t = c.estrategia?.tipo_campana;
    if (t === 'MIXTA') {
      const combo = (c.estrategia?.combinacion_mixta ?? []).join(' + ');
      return `Mixta (${combo})`;
    }
    return CAMPANA_LABEL[t] ?? t ?? '—';
  })();

  const ejeLabel = EJE_LABEL[c.estrategia?.eje_emocional] ?? c.estrategia?.eje_emocional ?? '—';

  const diag    = c.diagnostico_inicial ?? {};
  const forts   = (diag.fortalezas ?? []).slice(0, 4).map(f => `✅  ${f}`);
  const debs    = (diag.debilidades ?? []).slice(0, 4).map(d => `⚠️  ${d}`);
  const opps    = (diag.oportunidades ?? []).slice(0, 4).map(o => `🟢  ${o}`);
  const amebs   = (diag.amenazas ?? []).slice(0, 4).map(a => `🔴  ${a}`);
  const comps   = (diag.principales_competidores ?? []).map(
    comp => `${AMENAZA_COLOR[comp.nivel_amenaza] ?? '—'}  ${comp.nombre}  ·  ${comp.partido}  ·  Amenaza: ${comp.nivel_amenaza}`
  );

  const propBullets = (c.propuestas ?? []).map(
    p => `${p.icono ?? '→'}  ${p.titulo}  —  ${p.descripcion_corta}`
  );

  const poblacion = c.contexto_territorio?.poblacion_aproximada;
  const problemas = c.contexto_territorio?.principales_problemas ?? [];
  const zonasFuertes = c.contexto_territorio?.zonas_fuertes ?? [];
  const zonasDebiles = c.contexto_territorio?.zonas_debiles ?? [];

  const statsTerrItems = [
    poblacion ? { label: 'Población estimada', value: (poblacion >= 1000000 ? (poblacion / 1000000).toFixed(1) + 'M' : Math.round(poblacion / 1000) + 'k') } : null,
    problemas[0] ? { label: 'Problema #1', value: problemas[0] } : null,
    zonasFuertes[0] ? { label: 'Zona fuerte', value: zonasFuertes[0] } : null,
    zonasDebiles[0] ? { label: 'Zona a trabajar', value: zonasDebiles[0] } : null,
  ].filter(Boolean).slice(0, 4);

  const slides = [
    // 1 — Hero
    {
      id: 'slide-hero',
      type: 'hero',
      kicker: `${cargo}  ·  ${territorio}  ${año}`,
      title: `${nombre}\n${slogan}`,
      subtitle: org ? `${org}` : undefined,
      layout: 'center',
    },

    // 2 — Stats territorio
    {
      id: 'slide-territorio',
      type: 'stats',
      kicker: 'Contexto territorial',
      title: `Territorio: ${territorio}`,
      layout: 'grid',
      items: statsTerrItems.length > 0 ? statsTerrItems : [
        { label: 'Territorio', value: territorio },
        { label: 'Elección', value: String(año) },
      ],
    },

    // 3 — Fortalezas + debilidades
    {
      id: 'slide-foda-fd',
      type: 'text',
      kicker: 'Diagnóstico interno',
      title: 'Fortalezas y debilidades',
      layout: 'bullets',
      bullets: [...forts, ...debs],
    },

    // 4 — Oportunidades + amenazas
    {
      id: 'slide-foda-oa',
      type: 'text',
      kicker: 'Diagnóstico del escenario',
      title: 'Oportunidades y amenazas',
      layout: 'bullets',
      bullets: [...opps, ...amebs],
    },

    // 5 — Competidores
    {
      id: 'slide-competidores',
      type: 'text',
      kicker: 'Panorama competitivo',
      title: 'Competidores principales',
      layout: 'bullets',
      bullets: comps.length > 0 ? comps : ['Sin competidores registrados'],
    },

    // 6 — Propuestas
    {
      id: 'slide-propuestas',
      type: 'text',
      kicker: 'Ejes programáticos',
      title: 'Propuestas de campaña',
      layout: 'bullets',
      bullets: propBullets.length > 0 ? propBullets : ['Sin propuestas registradas'],
    },

    // 7 — Estrategia
    {
      id: 'slide-estrategia',
      type: 'stats',
      kicker: 'Marco estratégico',
      title: 'Estrategia de campaña',
      layout: 'grid',
      items: [
        { label: 'Tipo de campaña',   value: tipoCampana },
        { label: 'Eje emocional',     value: ejeLabel },
        { label: 'Frentes',           value: todosFrente },
        { label: 'Año de elección',   value: String(año) },
      ],
    },

    // 8 — Quote / Cierre
    {
      id: 'slide-cierre',
      type: 'quote',
      quote: slogan || nombre,
      attribution: nombre,
      context: `${cargo}  ·  ${territorio}  ${año}`,
    },
  ];

  return {
    meta: {
      title:          nombre,
      subtitle:       `${cargo}  ·  ${territorio}  ${año}`,
      consultor:      c.meta?.consultor_nombre ?? '',
      generated:      new Date().toISOString(),
      mode:           'rapida',
      candidate_slug: c.slug ?? '',
      color_primario: color,
    },
    slides,
  };
}

/**
 * Genera el slug desde los datos del candidato.
 * "Carlos Alberto Mendoza Ríos" + "Lima Norte" + 2026 → "carlos-mendoza-lima-norte-2026"
 */
export function makeSlug(candidate) {
  function normalize(str) {
    return (str ?? '')
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .trim();
  }

  const SHORT = new Set(['de', 'del', 'la', 'el', 'los', 'las', 'y', 'e', 'i', 'a', 'en', 'con', 'por', 'para']);

  const nombreWords = normalize(candidate.candidato?.nombre_completo ?? '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !SHORT.has(w))
    .slice(0, 2);

  const territorioWords = normalize(candidate.postulacion?.nombre_territorio ?? '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !SHORT.has(w))
    .slice(0, 2);

  const year = candidate.postulacion?.fecha_eleccion
    ? new Date(candidate.postulacion.fecha_eleccion).getFullYear()
    : new Date().getFullYear();

  const parts = [...nombreWords, ...territorioWords, String(year)];
  return parts.join('-').replace(/-+/g, '-').replace(/^-|-$/g, '') || 'candidato-' + Date.now();
}
