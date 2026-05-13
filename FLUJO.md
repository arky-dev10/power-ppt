# Power PPT — Flujo del Modo Candidato

> **Documento de referencia técnico-metodológico.**
> Sesión 13/05/2026. Captura el flujo end-to-end del sistema: formularios de ingreso, motor de análisis con cruces estratégicos, marco teórico y arquitectura de datos.

---

## Índice

1. [Resumen ejecutivo](#1-resumen-ejecutivo)
2. [Marco metodológico](#2-marco-metodológico)
3. [Arquitectura del sistema](#3-arquitectura-del-sistema)
4. [Formulario Fase 1 — Onboarding](#4-formulario-fase-1--onboarding)
5. [Motor de análisis — 8 pasos en serie](#5-motor-de-análisis--8-pasos-en-serie)
6. [Cross-reference logic](#6-cross-reference-logic)
7. [Fase 2 — Generación de presentación](#7-fase-2--generación-de-presentación)
8. [Enums permitidos](#8-enums-permitidos)
9. [Workflow del consultor](#9-workflow-del-consultor--escenarios)
10. [Comandos naturales reconocidos](#10-comandos-naturales-reconocidos)
11. [Estado del proyecto](#11-estado-del-proyecto)
12. [Anexo — Archivos de referencia](#12-anexo--archivos-de-referencia)

---

## 1. Resumen ejecutivo

Power PPT es un **workspace local impulsado por Claude** que opera como herramienta de consultoría política con IA. El consultor trabaja desde la terminal con Claude; los resultados se ven en `http://localhost:4321` con hot-reload en tiempo real.

### Tres herramientas standalone

| Herramienta | Propósito | URL |
|-------------|-----------|-----|
| **Presentaciones** | Slides interactivos a partir de investigación | `/[slug]/` |
| **Perfil 5N** | Vetting político y due diligence reputacional | `/vetting/[slug]/` |
| **Diagnóstico Territorial** | Análisis ECD del terreno electoral | `/diagnostics/[slug]/` |

### Modo Candidato (master tool)

Integra 5N + ECD + estrategia + presentación auto-generada en un flujo único de dos fases:

- **Fase 1**: Onboarding — el consultor llena un formulario (rápido o completo) con datos del candidato y del terreno
- **Fase 2**: Claude genera 8 análisis en serie y construye una presentación estratégica derivada

Los datos en `candidates/[slug]/`. Todo en archivos JSON locales, sin base de datos.

---

## 2. Marco metodológico

### 2.1 Modelo ECD — Diagnóstico territorial

Tres dimensiones complementarias derivadas de tres tradiciones teóricas:

| Dimensión | Tradición | Pregunta central |
|-----------|-----------|------------------|
| **E — Estructura** | Bourdieu | ¿Cuál es la posición material y social del electorado? |
| **C — Conciencia** | Michigan School | ¿Cómo piensa, siente y percibe el electorado? |
| **D — Decisión** | Rational Choice Theory | ¿Cómo calcula el voto el electorado? |

#### Dimensión E — Estructura (Bourdieu)

| Sub | Foco | Contenido |
|-----|------|-----------|
| E1 | Demografía | Población, pirámide etaria, urbano/rural, extensión, densidad, división política, infraestructura vial |
| E2 | Capital Económico | IDH, pobreza, PEA, desempleo, informalidad, actividad dominante, presupuesto, ejecución, obras pendientes |
| E3 | Capital Cultural y Social | Etnias, lenguas, tradiciones, educación, religión, iglesias influyentes, organizaciones de base, gremios, ONGs |
| E4 | Campo Político | Figuras `{nombre, rol, capital_dominante, influencia 1-5}`, ex autoridades, líderes informales, nombres quemados, conflictos activos |
| E5 | Cleavages activos | centro/periferia, urbano/rural, capital/trabajo, tradicional/moderno, étnico-lingüístico, religioso |

#### Dimensión C — Conciencia (Michigan School)

| Sub | Foco | Contenido |
|-----|------|-----------|
| C1 | Identidades | % identificación partidaria, partidos base, ideología, identidad regional/étnica/generacional |
| **C2** ★ | **Segmentos psicográficos** | **Hasta 6 segmentos: `{nombre, pct_aprox, valores, aspiraciones, temores}` — se reutilizan en D5** |
| C3 | Clima emocional | Miedo/esperanza/indignación/resignación/orgullo/nostalgia + confianza institucional 1-5 (gobierno nacional/local, congreso, PJ, policía, iglesia, medios) |
| C4 | Memoria política | Hitos positivos, hitos traumáticos, héroes locales, villanos |
| C5 | Issues prioritarios | `{tema, urgencia 1-5, visible_medios}` |
| C6 | Ecosistema de medios | Medios (mín 10), líderes de opinión (pastores, dirigentes, influencers, WhatsApp), encuestas |

#### Dimensión D — Decisión (Rational Choice)

| Sub | Foco | Contenido |
|-----|------|-----------|
| D1 | Universo electoral | Total electores, %, electores nuevos, participación, blanco/nulo, ausentismo |
| D2 | Historia electoral | Últimas 3 elecciones `{año, ganador, %, segundo, %, margen}`, volatilidad, NEP, bastiones |
| D3 | Competidores | `{candidato, partido, capital_dominante, issues, techo_estimado}` |
| D4 | Lógica del cálculo | Aprobación saliente, continuidad/castigo, expectativas, promesa resonante, issue decisivo, distancia local, desincentivos |
| **D5** ★ | **Matriz de decisión** | **Por cada segmento de C2: `{candidato_preferido, razon_principal, voto_util, prob_cambio}`** |

### 2.2 Modelo 5N + Capas Transversales — Análisis del candidato

Marco de vetting político / due diligence con 5 niveles escalando en profundidad:

| Nivel | Foco | Riesgo crítico | Fuentes Perú |
|-------|------|----------------|--------------|
| N1 | Identidad | Suplantación, inconsistencias | RENIEC, InfoGob, Migraciones |
| N2 | Trayectoria y vida personal | Títulos falsos, vacíos | SUNEDU, ROP/InfoGob, SUNAT, MTPE |
| N3 | Riesgo legal y reputacional | Procesos activos, escándalos vigentes | PJ (CEJ), INPE, MP, REDAM, SUCAMEC |
| N4 | Solvencia y patrimonio | Offshore opacos, conflicto de interés | SUNAT, SUNARP, Infocorp, Contraloría, ICIJ |
| N5 | Salud y capacidad funcional | Condición que compromete capacidad | Autodeclaración + examen voluntario |

**Capas transversales** (se aplican a los 5 niveles):

- **Entorno**: cónyuge, hijos mayores, padres/hermanos, socios, financistas, asesores, mentores (cada uno con mini-perfil 5N)
- **Coherencia**: discurso actual vs histórico, posiciones en cargos previos, promesas vs cumplimiento, hoja de vida vs registros

**Scorecard semáforo** por nivel:

| 🟢 Verde | 🟡 Amarillo | 🔴 Rojo |
|---------|-----------|--------|
| Sin riesgo | Riesgo medio (preparar respuesta) | Riesgo crítico (mitigación inmediata) |

**Matriz de riesgo reputacional** — Probabilidad × Impacto:

| | Impacto alto | Impacto bajo |
|---|---|---|
| **Prob. alta** | Mitigación inmediata | Preparar respuesta |
| **Prob. baja** | Monitorear | Archivar |

### 2.3 Cruces estratégicos — Núcleo Goberna

La inteligencia del modelo no está en las dimensiones aisladas sino en **cruzarlas**.

```
        ECD (territorio)              5N (candidato)
              │                              │
       ┌──────┼──────┐                  ┌────┴─────┐
       │      │      │                  │          │
      E×C    C×D    E×D             Entorno   Coherencia
       │      │      │                  │          │
       └──────┴──────┘                  └────┬─────┘
              │                              │
       E × C × D                             │
       ┌──────┴──────┐                       │
       │ NÚCLEO       │                      │
       │ GOBERNA      │                      │
       │ (3 segmentos │                      │
       │  prioritarios)│                     │
       └──────┬──────┘                       │
              │                              │
              └──────────┬───────────────────┘
                         │
                  5N × ECD = FIT
                  candidato ↔ territorio
                         │
                STRATEGIC OUTPUT
                ├─ Despliegue territorial
                ├─ Alianzas a construir
                ├─ Riesgos identificados
                ├─ Indicadores de seguimiento
                └─ Líneas de gestión post-elección
```

**Preguntas guía de cada cruce:**

| Cruce | Pregunta |
|-------|----------|
| E × C | ¿Cómo la posición estructural explica las actitudes detectadas? |
| C × D | ¿Cómo las actitudes filtran el cálculo de voto? |
| E × D | ¿Cómo el campo de poder limita las opciones viables? |
| **E × C × D** | **Síntesis triple — Núcleo Goberna** |
| 5N × ECD | ¿Cómo calza el candidato con el terreno? |

**Output del Núcleo Goberna (E × C × D):**

Por cada uno de los 3 segmentos prioritarios:
- Mensaje núcleo + mensaje secundario
- Canal recomendado (lista de medios/espacios específicos del territorio)
- Vocero ideal (perfil + nombre si aplica)
- Riesgos del segmento + indicador de seguimiento

Más: cobertura total priorizada (% del electorado capturable).

### 2.4 Marco de estrategia de campaña

Tres ejes que clasifican la campaña desde la Fase 1 Rápida:

**Tipo de campaña:**

| Tipo | Lógica |
|------|--------|
| `RACIONAL` | Data y plan de gobierno |
| `EMOTIVA` | Emoción y conexión humana |
| `INSTINTIVA` | Imagen, carisma y presencia |
| `MIXTA` | Combinación (declarar 2 en `combinacion_mixta[]`) |

**Eje emocional** — qué emoción dominante moviliza:

`PLAN_DE_GOBIERNO` · `EQUIPO_DE_CAMPAÑA` · `SIMPATIA` · `ESPERANZA` · `ODIO` · `MIEDO`

**Frentes de campaña — marco Goberna:**

| Frente | Dónde se libra |
|--------|----------------|
| 🏘️ **TIERRA** | Territorial — puerta a puerta, mercados, mítines, presencia física |
| 📺 **MAR** | Medios masivos — TV, radio, prensa escrita |
| 📱 **AIRE** | Digital — redes sociales, ads digitales, influencers |

Toda campaña define `frente_principal` y opcionalmente `frentes_secundarios[]`.

---

## 3. Arquitectura del sistema

### 3.1 Tres herramientas standalone

| Herramienta | URL | Archivo principal |
|-------------|-----|------------------|
| Presentaciones | `/[slug]/` | `projects/[slug]/presentation.json` |
| Perfil 5N | `/vetting/[slug]/` | `vetting/[slug]/profile.json` + `report.json` |
| Diagnóstico Territorial | `/diagnostics/[slug]/` | `diagnostics/[slug]/territorial.json` |

### 3.2 Modo Candidato — estructura integrada

```
candidates/[slug]/
├── candidate.json              ← master + Fase 1 Rápida + tracking
├── profile.json                ← Fase 1 Completa Parte A — 5N completo
├── territorial.json            ← Fase 1 Completa Parte B — ECD completo
├── research/                   ← documentos fuente (PDF, encuestas, etc.)
├── analysis/                   ← 8 análisis generados por Claude
│   ├── vetting-report.json
│   ├── territorial-analysis.json
│   ├── crosses-ec.json
│   ├── crosses-cd.json
│   ├── crosses-ed.json
│   ├── nucleo-goberna.json
│   ├── fit-candidate-territory.json
│   └── strategic-output.json
├── presentation.json           ← Fase 2 generada
└── history/                    ← snapshots versionados
```

### 3.3 Flujo de datos

```
                    ┌──────────────────┐
                    │  CONSULTOR       │
                    │  (terminal       │
                    │   con Claude)    │
                    └────────┬─────────┘
                             │
                             ▼
        ┌───────────────────────────────────┐
        │   FASE 1 — Onboarding             │
        │   ├─ Rápida: candidate.json       │
        │   └─ Completa: + profile + terr.  │
        └────────────────┬──────────────────┘
                         │
                         ▼
        ┌───────────────────────────────────┐
        │   MOTOR DE ANÁLISIS (8 pasos)     │
        │   Cada uno consume los anteriores │
        └────────────────┬──────────────────┘
                         │
                         ▼
        ┌───────────────────────────────────┐
        │   FASE 2 — Presentación           │
        │   ├─ Rápida (~8 slides)           │
        │   └─ Completa (~14 slides)        │
        └────────────────┬──────────────────┘
                         │
                         ▼
                ┌────────────────┐
                │  Browser       │
                │  localhost:4321│
                │  (hot-reload)  │
                └────────────────┘
```

---

## 4. Formulario Fase 1 — Onboarding

Dos modos de entrada según profundidad disponible.

### 4.1 Fase 1 Rápida — mínimo viable

**Cuándo usar**: el consultor tiene datos básicos pero no sesión profunda de investigación.
**Salida**: presentación de ~8 slides con SWOT, propuestas y branding. Sin segmentación psicográfica ni cruces.

#### Schema (vive completo en `candidate.json`)

```json
{
  "meta": {
    "consultor_nombre": "string",
    "consultor_email": "string",
    "fecha_sesion": "ISO date",
    "presentacion_id": "UUID v4"
  },
  "candidato": {
    "tipo": "candidato-propio | rival | aliado",
    "nombre_completo": "string",
    "foto_url": "string | null",
    "documento_tipo": "DNI | CE | PASAPORTE",
    "documento_numero": "string | null",
    "fecha_nacimiento": "ISO date | null",
    "sexo": "M | F | null",
    "telefono_e164": "string",
    "email": "string | null",
    "ocupacion_actual": "string | null",
    "redes_sociales": {
      "facebook": "string | null",
      "instagram": "string | null",
      "tiktok": "string | null",
      "youtube": "string | null"
    }
  },
  "postulacion": {
    "cargo_codigo": "alcalde_distrital | alcalde_provincial | regidor | consejero_regional | gobernador_regional | congresista | presidente",
    "organizacion_politica": "string",
    "numero_lista": "number | null",
    "fecha_eleccion": "ISO date",
    "id_departamento": "number | null",
    "id_provincia": "number | null",
    "id_distrito": "number | null",
    "nombre_territorio": "string",
    "nivel_territorio": "distrital | provincial | regional | nacional"
  },
  "estrategia": {
    "tipo_eleccion": "GOBIERNO_LOCAL | PARLAMENTARIA | PRESIDENCIAL",
    "tipo_campana": "RACIONAL | EMOTIVA | INSTINTIVA | MIXTA",
    "combinacion_mixta": ["RACIONAL", "EMOTIVA"],
    "eje_emocional": "PLAN_DE_GOBIERNO | EQUIPO_DE_CAMPAÑA | SIMPATIA | ESPERANZA | ODIO | MIEDO",
    "frente_principal": "TIERRA | MAR | AIRE",
    "frentes_secundarios": ["MAR"]
  },
  "diagnostico_inicial": {
    "fortalezas": ["string"],
    "debilidades": ["string"],
    "oportunidades": ["string"],
    "amenazas": ["string"],
    "principales_competidores": [
      { "nombre": "string", "partido": "string", "nivel_amenaza": "bajo | medio | alto" }
    ]
  },
  "propuestas": [
    { "orden": 1, "titulo": "string", "descripcion_corta": "string ≤140", "icono": "string | null" }
  ],
  "branding": {
    "slogan": "string",
    "color_primario": "#hex",
    "color_secundario": "#hex | null",
    "logo_url": "string | null",
    "foto_perfil_url": "string | null"
  },
  "contexto_territorio": {
    "poblacion_aproximada": "number | null",
    "principales_problemas": ["string"],
    "zonas_fuertes": ["string"],
    "zonas_debiles": ["string"]
  }
}
```

#### Reglas de validación

| # | Regla |
|---|-------|
| 1 | Cualquier valor fuera de enum se rechaza — Claude pregunta hasta obtener uno válido |
| 2 | `MIXTA` requiere exactamente 2 valores en `combinacion_mixta[]` |
| 3 | `frente_principal` no puede aparecer en `frentes_secundarios[]` |
| 4 | Propuestas: mín 3 / máx 6, `descripcion_corta` ≤ 140 chars, `orden` continuo |
| 5 | SWOT: mínimo 3 items por cuadrante |
| 6 | Competidores: mín 1 / máx 5 |
| 7 | Branding obligatorio: `slogan` + `color_primario`. El resto opcional |
| 8 | `presentacion_id`: UUID v4 inmutable. `slug` derivado y legible |

### 4.2 Fase 1 Completa — diagnóstico profundo

**Cuándo usar**: el consultor tiene tiempo y datos para análisis estratégico completo.
**Salida**: presentación de 14 slides con cruces ECD, Núcleo Goberna, fit candidato-territorio, despliegue, alianzas, riesgos e indicadores.

**Estructura:**

- **Parte A — Identidad del candidato** → schema completo `profile.json` (5N + Capas transversales). Ver sección 2.2
- **Parte B — Terreno de postulación** → schema completo `territorial.json` (ECD). Ver sección 2.1

### 4.3 Seed desde Fase Rápida hacia Fase Completa

Al subir de modo rápido a completo, los campos básicos se copian automáticamente como punto de partida:

| Quick (`candidate.json`) | Full destino |
|--------------------------|--------------|
| `candidato.nombre_completo` | `profile.n1.nombres` + `apellidos` |
| `candidato.documento_numero` | `profile.n1.dni` |
| `candidato.fecha_nacimiento` | `profile.n1.fecha_nacimiento` |
| `candidato.ocupacion_actual` | `profile.n1.profesion_declarada` |
| `candidato.redes_sociales` | `profile.n3.huella_digital` (semilla para auditoría) |
| `postulacion.nombre_territorio` | `territorial.meta.nombre_territorio` |
| `postulacion.nivel_territorio` | `territorial.meta.nivel` |
| `postulacion.fecha_eleccion` | `territorial.meta.eleccion_año` |
| `postulacion.cargo_codigo` | `territorial.meta.eleccion_cargo` |
| `contexto_territorio.poblacion_aproximada` | `territorial.e.e1.poblacion_total` |
| `contexto_territorio.principales_problemas` | `territorial.c.c5.issues` (semilla urgencia 4-5) |
| `contexto_territorio.zonas_fuertes/debiles` | `territorial.d.d2.bastiones` |
| `diagnostico_inicial.principales_competidores` | `territorial.d.d3.competidores` |
| `diagnostico_inicial.fortalezas/debilidades` | Insumo para `analysis/fit-candidate-territory.json` |
| `diagnostico_inicial.oportunidades/amenazas` | Insumo para `analysis/territorial-analysis.json` |

`estrategia`, `propuestas`, `branding` permanecen **autoritativos** en `candidate.json` — no tienen equivalente en 5N/ECD.

---

## 5. Motor de análisis — 8 pasos en serie

Cuando el consultor dice **"genera el análisis completo"**, Claude ejecuta 8 análisis en orden estricto. Cada uno consume los anteriores.

### Resumen de inputs/outputs

| # | Análisis | Inputs | Output principal |
|---|----------|--------|-----------------|
| 1 | `vetting-report.json` | `profile.json` | Scorecard 5N + Top 3 riesgos + Plan mitigación |
| 2 | `territorial-analysis.json` | `territorial.json` | Lectura interpretativa + insights clave |
| 3 | `crosses-ec.json` | `territorial.json` | 4-6 hallazgos E × C |
| 4 | `crosses-cd.json` | `territorial.json` + paso 3 | 4-6 hallazgos C × D |
| 5 | `crosses-ed.json` | `territorial.json` + paso 3 | 4-6 hallazgos E × D |
| 6 | `nucleo-goberna.json` | territorial + pasos 3,4,5 | Top 3 segmentos + mensaje + canal + vocero |
| 7 | `fit-candidate-territory.json` | profile + territorial + pasos 1,2,6 | Fortalezas, vulnerabilidades, resonancia, voceros |
| 8 | `strategic-output.json` | TODOS los anteriores | Despliegue, alianzas, riesgos, indicadores, post-elección |

### 5.1 Vetting Report (5N)

**Input**: `profile.json`
**Output**: `analysis/vetting-report.json`

Genera:
1. Scorecard 🟢🟡🔴 por nivel (N1-N5 + Entorno + Coherencia) con nota explicativa por nivel
2. Top 3 riesgos críticos con `{probabilidad, impacto, accion, mensaje_preparado, vocero, material_respaldo}`
3. Conclusión ejecutiva + riesgo global (alto / medio-alto / medio / medio-bajo / bajo)

**Criterios para el semáforo:**

| Nivel | 🟢 Verde | 🟡 Amarillo | 🔴 Rojo |
|-------|---------|-----------|--------|
| N1 | Identidad consistente | Inconsistencias menores | Documentación cuestionable |
| N2 | Trayectoria verificada al 100% | Algún título sin verificar | Títulos falsos o vacíos |
| N3 | Sin antecedentes | Procesos resueltos | Proceso activo / escándalo vigente |
| N4 | Patrimonio coherente | Inconsistencias menores | Offshore opacos / conflicto grave |
| N5 | Apto sin condiciones | Condición declarada y controlada | Condición que compromete capacidad |
| Entorno | Sin vínculos problemáticos | Vínculos con riesgo menor | Vínculos con personas/grupos vetados |
| Coherencia | Discurso consistente | Contradicciones menores | Contradicción central entre discurso y hechos |

### 5.2 Territorial Analysis

**Input**: `territorial.json`
**Output**: `analysis/territorial-analysis.json`

Genera:
- Lectura interpretativa por sección (E1-E5, C1-C6, D1-D5) — **una oración por sección capturando lo estructural, no lo descriptivo**
- 4-6 insights clave priorizados (crítica / alta / media)
- Sin recomendaciones — solo lectura

### 5.3 Crosses E × C

**Pregunta**: ¿Cómo la posición estructural explica las actitudes detectadas?

Genera 4-6 hallazgos, cada uno con:
```
- estructura_ref (path en territorial.json, ej. "e2.pct_informalidad")
- estructura (texto descriptivo)
- conciencia_ref
- conciencia
- explicacion (causal — POR QUÉ X produce Y)
- implicancia_estrategica
```

### 5.4 Crosses C × D

**Pregunta**: ¿Cómo las actitudes filtran el cálculo de voto?
Mismo formato que E × C. **Foco**: cómo C2 (segmentos) → D5 (matriz) — *link directo*.

### 5.5 Crosses E × D

**Pregunta**: ¿Cómo el campo de poder limita las opciones viables?
Mismo formato. **Foco**: cómo E4 (nombres quemados, conflictos) limita D3 (competidores viables).

### 5.6 Núcleo Goberna (E × C × D)

**Inputs**: territorial + crosses E×C + C×D + E×D
**Output**: `analysis/nucleo-goberna.json`

Genera:

```
segmentos_prioritarios[] (TOP 3 de C2)
  cada uno con:
    - ranking
    - rationale (cita IDs de cruces anteriores)
    - mensaje_nucleo (afirmación, no descripción)
    - mensaje_secundario
    - canal_recomendado[] (nombres específicos del C6 del territorio)
    - vocero_ideal (perfil + nombre si aplica)
    - riesgos_segmento[]
    - indicador_seguimiento

segmentos_no_prioritarios[] (con razón de exclusión + estrategia mínima)

cobertura_total_priorizada (% del electorado capturable + comentario)
```

**Fórmula de priorización**: tamaño × prob_cambio × factibilidad de captura.

### 5.7 Fit Candidato × Territorio (5N × ECD)

**Inputs**: profile + territorial + vetting-report + territorial-analysis + nucleo-goberna
**Output**: `analysis/fit-candidate-territory.json`

Genera:

```
fit_global (alto / medio-alto / medio / medio-bajo / bajo)
fit_score (1-10)

fortalezas[] (convergencias 5N ↔ ECD)
  - candidate_aspect (path en profile.json)
  - territory_aspect (path en territorial.json)
  - type (convergencia / convergencia parcial / compatibilidad funcional)
  - insight
  - valor_estrategico (crítico / alto / medio)
  - como_usar

vulnerabilidades[] (fricciones)
  - mismo formato + accion_requerida + deadline

segmentos_resonancia[] (por cada C2: compatibilidad + razón + cómo potenciar)
issues_resonancia[]
competidor_threat[] (cómo neutralizar cada D3)
vocero_strategy[] (qué voceros cubren los vacíos del candidato)
```

### 5.8 Strategic Output

**Inputs**: TODOS los anteriores
**Output**: `analysis/strategic-output.json`

Genera 6 secciones:

```
despliegue_territorial[]
  - zona, rationale, prioridad, acciones[], presupuesto_relativo %, responsable

alianzas_construir[]
  - actor, tipo, prioridad, razon, que_ofrecemos, que_pedimos, deadline, responsable

riesgos_identificados[] (consolidados de vetting + fit)
  - probabilidad × impacto, mitigacion, responsable, deadline, estado

indicadores_seguimiento[]
  - metrica, frecuencia, meta por mes/trimestre/final

gestion_post_eleccion[]
  - compromiso, rationale, primer_100_dias, año_1, año_completo

fase_2_inputs
  - presentacion_recomendada[] (slides sugeridos con su fuente)
  - total_slides_sugerido
```

---

## 6. Cross-reference logic

Mapa de cruces productivos entre archivos. Claude debe explicitar referencias usando paths (ej. `e2.pct_informalidad`, `c2.segmentos[Emprendedor Migrante]`).

### E × C — productivo cuando:

- E1/E2/E3 explican C1/C2/C3 → estructura material genera actitudes
- E4 explica C4 → campo político genera memoria
- E3 (religión, ONGs) explica C3 (confianza institucional)

### C × D — productivo cuando:

- **C2 (segmentos) ↔ D5 (matriz por segmento) — LINK DIRECTO**
- C3 (clima emocional) ↔ D4 (clima continuidad/castigo)
- C5 (issues) ↔ D4 (issue decisivo)

### E × D — productivo cuando:

- E4 (nombres quemados, conflictos) limita D3 (competidores)
- E1 (extensión, conectividad) condiciona D4 (distancia votación)
- E2 (presupuesto, ejecución) condiciona D2 (historia electoral)

### 5N × ECD (fit) — buscar:

| Cruce 5N × ECD | Insight que produce |
|----------------|---------------------|
| N2 trayectoria × C2 segmentos | Compatibilidad de origen/clase |
| N3 riesgo × C4 memoria | Choque entre vulnerabilidades del candidato y traumas del territorio |
| N3 riesgo × C6 medios | Cuáles riesgos se amplificarían en el ecosistema local |
| N4 solvencia × C5 issues | Coherencia entre patrimonio y demandas |
| Coherencia × C3 indignación | Si el candidato es incoherente, el clima emocional lo castigará |
| Entorno × E4 campo político | Conflictos con actores locales por vínculos del candidato |

### Trazabilidad — `*_ref` paths

Cada hallazgo en cualquier análisis lleva referencias al path exacto:

```
estructura_ref:  "e2.pct_informalidad"
conciencia_ref:  "c2.segmentos[Emprendedor Migrante]"
decision_ref:    "d5.matriz[Joven Conectado].prob_cambio"
```

Esto permite **auditoría completa**: cualquier conclusión puede rastrearse hasta el dato original.

### Reglas críticas

1. **Idempotencia**: regenerar un análisis no debe romper los downstream
2. **Versionado**: cada análisis incrementa `version` cuando se regenera, registrado en `candidate.json`
3. **No inventar datos**: si el campo está vacío en el archivo fuente, marcar "data insuficiente" en el análisis
4. **Coherencia C2 ↔ D5**: los nombres de segmentos en `d5.matriz[].segmento` deben coincidir EXACTAMENTE con `c2.segmentos[].nombre`
5. **Snapshots antes de regenerar**: copiar análisis anterior a `history/[fecha-hora]/analysis/`

---

## 7. Fase 2 — Generación de presentación

### 7.1 Modo Rápido (~8 slides)

Genera solo desde `candidate.json` (sin profile/territorial/análisis).

| # | Tipo | Fuente |
|---|------|--------|
| 1 | hero | `meta` + `postulacion` + `branding.slogan` |
| 2 | stats | KPIs básicos `contexto_territorio` + `postulacion` |
| 3 | text bullets | `diagnostico_inicial.fortalezas/debilidades` |
| 4 | text bullets | `diagnostico_inicial.oportunidades/amenazas` |
| 5 | text | `diagnostico_inicial.principales_competidores` |
| 6 | text | `propuestas` |
| 7 | stats | `estrategia` (tipo + frentes + eje) |
| 8 | quote | `branding.slogan` + cierre |

### 7.2 Modo Completo (~14 slides)

Genera consumiendo los 8 análisis de `analysis/`.

| # | Tipo | Fuente |
|---|------|--------|
| 1 | hero | `candidate.json` + `territorial.meta` |
| 2 | quote | `territorial-analysis.insights_clave[0]` (el más crítico) |
| 3 | stats | `territorial.d.d1` (universo electoral) |
| 4 | chart bar | `territorial.d.d2.elecciones` |
| 5 | stats spotlight | `territorial.c.c2.segmentos` |
| 6 | chart radar | `territorial.d.d5.matriz` |
| 7 | text bullets | `nucleo-goberna.segmentos_prioritarios` |
| 8 | text bullets | `nucleo-goberna` mensaje + canal + vocero |
| 9 | map | `strategic-output.despliegue_territorial` |
| 10 | text bullets | `strategic-output.alianzas_construir` |
| 11 | stats | `vetting-report.scorecard` |
| 12 | chart | `fit-candidate-territory` fortalezas vs vulnerabilidades |
| 13 | text bullets | `strategic-output.riesgos_identificados` |
| 14 | stats | `strategic-output.indicadores_seguimiento` |

Cada slide puede llevar `modal` con detalle del análisis fuente (para profundizar en vivo durante la presentación).

---

## 8. Enums permitidos

```
documento_tipo:
  DNI | CE | PASAPORTE

sexo:
  M | F

cargo_codigo:
  alcalde_distrital | alcalde_provincial | regidor |
  consejero_regional | gobernador_regional | congresista | presidente

tipo_eleccion:
  GOBIERNO_LOCAL | PARLAMENTARIA | PRESIDENCIAL

tipo_campana:
  RACIONAL    (data + plan de gobierno)
  EMOTIVA     (emoción + conexión humana)
  INSTINTIVA  (imagen + carisma + presencia)
  MIXTA       (combinación — requiere combinacion_mixta[])

eje_emocional:
  PLAN_DE_GOBIERNO | EQUIPO_DE_CAMPAÑA | SIMPATIA |
  ESPERANZA | ODIO | MIEDO

frente_principal / frentes_secundarios:
  TIERRA  (campaña territorial)
  MAR     (medios masivos)
  AIRE    (digital)

nivel_amenaza (competidores):
  bajo | medio | alto

tipo_candidato:
  candidato-propio | rival | aliado

nivel_territorio:
  distrital | provincial | regional | nacional

modo_actual (fase_1):
  rapida | completa

semaforo (scorecard):
  verde | amarillo | rojo

riesgo_global:
  alto | medio-alto | medio | medio-bajo | bajo

probabilidad / impacto:
  alta | media | baja  /  alto | medio | bajo

accion_riesgo:
  mitigacion-inmediata | preparar-respuesta | monitorear | archivar

prob_cambio (D5):
  alta | media | baja

clima_continuidad_castigo (D4):
  continuidad | castigo

capital_dominante (E4 figuras, D3 competidores):
  político | económico | social | cultural | militar | clientelar | identitario-andino | etc.
```

---

## 9. Workflow del consultor — escenarios

### Escenario A: Onboarding rápido (15 minutos)

```
1. Consultor: "Onboarding rápido para Carlos Mendoza"
2. Claude: crea candidates/carlos-mendoza-lima-norte-2026/candidate.json
3. Claude: guía 8 secciones del form rápido (meta → branding)
4. Consultor responde campo por campo
5. Consultor: "Genera presentación rápida"
6. Claude: presentation.json con 8 slides desde candidate.json
7. Browser localhost:4321/candidates/carlos-mendoza-... muestra resultado
```

### Escenario B: Diagnóstico completo (2-3 sesiones)

```
SESIÓN 1 — Identidad del candidato (5N)
1. Consultor: "Modo candidato — Carlos Mendoza, alcalde Lima Norte 2026"
2. Claude: crea estructura + guía Parte A (5N por nivel)
3. Consultor responde + sube documentos a research/
4. Claude: profile.json se llena progresivamente

SESIÓN 2 — Terreno (ECD)
5. Consultor: "Empezar Parte B — terreno Lima Norte"
6. Claude: guía Parte B (ECD por dimensión y subsección)
7. Consultor responde + sube research adicional
8. Claude: territorial.json se llena progresivamente

SESIÓN 3 — Análisis y presentación
9. Consultor: "Genera el análisis completo"
10. Claude: corre los 8 pasos en serie (15-30 min)
11. Consultor revisa cada análisis, pide ajustes
12. Consultor: "Genera la presentación"
13. Claude: presentation.json con 14 slides estratégicos
14. Consultor revisa en browser y ajusta conversacionalmente
```

### Escenario C: Subir de rápido a completo

```
1. Consultor (ya completó modo rápido): "Subir a modo completo"
2. Claude: crea profile.json y territorial.json con seeds desde candidate.json
3. Claude: "Te faltan estos campos para Parte A: [lista]. ¿Empezamos?"
4. Continúa como Escenario B desde paso 2
```

---

## 10. Comandos naturales reconocidos

### Modo Candidato

| Frase del consultor | Acción de Claude |
|--------------------|------------------|
| "Nuevo candidato [N] para [T] [año]" | Crea `candidates/[slug]/` + `candidate.json` |
| "Onboarding rápido [nombre]" | Inicia recolección Fase 1 Rápida |
| "Empieza onboarding fase 1" / "Modo completo" | Inicia Parte A (identidad) |
| "Pasa a la parte B" | Inicia Parte B (terreno) |
| "Subir a modo completo" | Genera seeds en profile/territorial desde candidate.json |
| "Genera el análisis completo" | Corre los 8 pasos en serie |
| "Genera solo [análisis específico]" | Corre uno con sus dependencias |
| "Reanaliza con esta nueva info: ..." | Actualiza fuente + regenera análisis afectados |
| "Genera la presentación" / "Fase 2" | Construye `presentation.json` |
| "Genera presentación rápida" | Modo rápido (8 slides desde candidate.json) |
| "¿Qué falta?" | Lista campos vacíos + análisis no generados |
| "Muéstrame el fit" | Resume `fit-candidate-territory.json` en lenguaje natural |
| "Snapshot del estado" | Copia todo a `history/[fecha]/` |

### Herramientas standalone

| Frase | Tool | Acción |
|-------|------|--------|
| "Nueva presentación sobre [tema]" | Presentaciones | Crea `projects/[slug]/` |
| "Nuevo perfil 5N de [nombre]" | Perfil 5N | Crea `vetting/[slug]/` |
| "Nuevo diagnóstico territorial de [T]" | Diagnóstico Territorial | Crea `diagnostics/[slug]/` |

---

## 11. Estado del proyecto

### ✅ Implementado

**Backend completo:**
- Schemas JSON para los 3 archivos fuente (profile, territorial, candidate)
- 8 schemas de análisis con ejemplo end-to-end poblado en `candidates/_ejemplo/`
- Protocolo Claude completo documentado en `CLAUDE.md` (828 líneas)
- Cross-reference logic con paths trazables
- Enums y reglas de validación

**Frontend de las 3 herramientas standalone:**
- `/` selector con cards de proyectos + perfiles 5N + diagnósticos
- `/[slug]/` presentación interactiva con todos los tipos de slide
- `/vetting/` lista + `/vetting/[slug]/` reporte 5N visual
- `/diagnostics/` lista + `/diagnostics/[slug]/` reporte territorial visual
- Hot-reload en todos los `.json` de las 4 carpetas (projects/vetting/diagnostics/candidates)

### ❌ Pendiente

| Pieza | Tipo |
|-------|------|
| Form Fase 1 (Rápida + Completa) | Frontend |
| Página `/candidates/[slug]/` con vista de candidato | Frontend |
| Página `/candidates/` lista de candidatos | Frontend |
| Generación efectiva de `presentation.json` desde análisis | Backend (Claude debe escribir el código del generador) |
| Sub-páginas de análisis (`/candidates/[slug]/analysis/[type]`) | Frontend (opcional) |

---

## 12. Anexo — Archivos de referencia

### Schemas con ejemplo poblado

| Archivo | Líneas | Contenido |
|---------|--------|-----------|
| `candidates/_ejemplo/candidate.json` | ~150 | Master + Fase 1 Rápida completo + tracking de fases |
| `candidates/_ejemplo/profile.json` | ~85 | 5N completo del candidato |
| `candidates/_ejemplo/territorial.json` | ~205 | ECD completo del territorio |
| `candidates/_ejemplo/analysis/vetting-report.json` | 99 | Scorecard 5N + Top 3 riesgos |
| `candidates/_ejemplo/analysis/territorial-analysis.json` | 59 | Lectura interpretativa por sección + insights |
| `candidates/_ejemplo/analysis/crosses-ec.json` | 55 | 5 hallazgos E × C |
| `candidates/_ejemplo/analysis/crosses-cd.json` | 55 | 5 hallazgos C × D |
| `candidates/_ejemplo/analysis/crosses-ed.json` | 55 | 5 hallazgos E × D |
| `candidates/_ejemplo/analysis/nucleo-goberna.json` | 89 | 3 segmentos prioritarios + estrategia |
| `candidates/_ejemplo/analysis/fit-candidate-territory.json` | 209 | Fortalezas, vulnerabilidades, resonancia, voceros |
| `candidates/_ejemplo/analysis/strategic-output.json` | 309 | Despliegue + alianzas + riesgos + indicadores + post |

### Documentación

| Archivo | Propósito |
|---------|-----------|
| `CLAUDE.md` | Protocolo operativo completo para Claude (señor de los anillos del sistema) |
| `FLUJO.md` | Este documento — visión panorámica para humanos |
| `README.md` | Instalación + uso básico |

### Repo

**GitHub**: https://github.com/arky-dev10/power-ppt

---

> **Fin del documento**
> Generado en sesión del 13/05/2026 · Power PPT v3 · Goberna Consultoría Política
