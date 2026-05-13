# Power PPT — Claude Workspace

Entorno local donde Claude conduce la conversación y edita `projects/[nombre]/presentation.json`.
El browser en `http://localhost:4321` recarga automáticamente.

```bash
npm install && npm run dev   # primera vez
```

---

## PROTOCOLO DE SESIÓN — leer siempre al iniciar

### Al abrir este proyecto Claude debe hacer esto, en orden:

---

### PASO 0 — Orientarse

Leer, si existen:
- `projects/[proyecto]/context.md` — estado operativo (qué se hizo, qué falta)
- `projects/[proyecto]/brief.md` — estrategia narrativa del proyecto

Si hay archivos en `projects/[proyecto]/research/`, listarlos al consultor antes de continuar.

Abrir siempre con:
> "Estoy en [nombre del proyecto]. [Resumen de 2 líneas del estado actual si hay context.md].
> ¿Continuamos donde quedamos o hay algo nuevo?"

Si no hay proyecto activo, preguntar cuál abrir o si es uno nuevo.

---

### FASE 1 — INVESTIGACIÓN (cuando hay archivos en /research/)

**Objetivo**: extraer hallazgos clave antes de hablar de slides.

1. Leer todos los archivos en `/research/` del proyecto
2. Crear o actualizar `brief.md` con esta estructura:

```markdown
# Brief — [Nombre del Proyecto]

## Cliente y audiencia
[Quién recibirá esta presentación y qué necesita sentir/creer al terminar]

## Pregunta central
[La pregunta que esta presentación responde]

## Hallazgos clave (de la investigación)
- [Hallazgo 1 — con dato concreto si existe]
- [Hallazgo 2]
- [Hallazgo 3]
- ...

## Datos disponibles
| Dato | Fuente | Archivo |
|------|--------|---------|
| ... | ... | ... |

## Vacíos de información
[Qué falta y cómo manejarlo]

## Sensibilidades / mensajes a evitar
[Contexto político o estratégico que el consultor debe confirmar]

## Narrativa propuesta
[Arco narrativo en 1 párrafo: de qué situación partimos, qué mostramos, a dónde llegamos]
```

3. Presentar el brief al consultor y preguntar:
   - "¿Este es el enfoque correcto para este cliente?"
   - "¿Hay sensibilidades que deba considerar?"
   - "¿Falta algún dato importante que tengas pero no está en los archivos?"

**No proponer slides hasta tener aprobación del brief.**

---

### FASE 2 — NARRATIVA

**Objetivo**: acordar la secuencia antes de construir.

Proponer una secuencia de slides con rationale:

```
Slide 1 — HERO: [título propuesto]
  → Por qué: establece el problema/oportunidad desde el primer segundo

Slide 2 — STATS: [4 KPIs propuestos con sus valores]
  → Por qué: ancla con datos concretos antes de entrar al análisis

Slide 3 — CHART: [tipo y datos]
  → Por qué: muestra la tendencia que justifica la propuesta

...
```

Preguntar:
- "¿Este orden cuenta la historia correcta para esta audiencia?"
- "¿Hay un slide que sobre o que falte?"
- "¿El slide de cierre debería terminar en propuesta, en acción concreta, o en pregunta?"

**No generar el JSON hasta que el consultor apruebe la secuencia.**

---

### FASE 3 — CONSTRUCCIÓN SLIDE POR SLIDE

**Objetivo**: construir con criterio, no por volumen.

Para cada slide, antes de escribir el JSON:

1. Mostrar el contenido propuesto en texto plano:
   ```
   SLIDE: Stats — "Indicadores Clave"
   KPI 1: "Tiempo de viaje — 92 min — ↑ +12% vs 2023"
   KPI 2: ...
   ```

2. Preguntar: "¿Este énfasis es el correcto, o quieres ajustar algún dato o mensaje?"

3. Recibir feedback → ajustar → entonces escribir el JSON

4. Confirmar: "Slide [N] listo. ¿Continuamos con el siguiente?"

**Nunca generar más de 1 slide sin que el consultor lo vea primero.**

---

### CIERRE DE SESIÓN

Cuando el consultor diga "por hoy es todo", "listo" o "guarda":

1. Actualizar `context.md` con:
   - Fecha de la sesión
   - Qué slides se crearon/modificaron
   - Qué decisiones se tomaron
   - Qué queda pendiente para la próxima sesión

2. Hacer un snapshot:
   ```bash
   cp projects/[proyecto]/presentation.json \
      projects/[proyecto]/history/presentation-$(date +%Y%m%d-%H%M).json
   ```

3. Confirmar: "Contexto guardado. La próxima sesión retomamos desde [estado]."

---

## COMANDOS QUE EL CONSULTOR PUEDE USAR

Frases naturales que Claude debe reconocer y ejecutar:

| Consultor dice | Claude hace |
|----------------|-------------|
| "Analiza los archivos de /research/" | Fase 1 completa |
| "Muéstrame qué tenemos" | Resume el brief.md y los slides actuales |
| "Propón la estructura" | Fase 2: secuencia con rationale |
| "Construye slide por slide" | Fase 3 con checkpoints |
| "Cambia el slide [N] para que..." | Modifica solo ese slide, muestra cambio en texto antes de aplicar |
| "Vuelve al estado anterior" | `git checkout projects/[proyecto]/history/[último snapshot]` |
| "Guarda el contexto" | Actualiza context.md + snapshot |
| "Exporta la presentación" | `npm run build` |
| "Agrega un slide de [tipo] sobre [tema]" | Fase 3 para ese slide específico |

---

## PRINCIPIOS DE CALIDAD PARA CADA SLIDE

Antes de escribir el JSON de cualquier slide, verificar:

- **Un mensaje por slide** — si hay más de una idea principal, dividir en dos slides
- **Datos específicos, no genéricos** — "92 min" no "mucho tiempo"; "34%" no "porcentaje bajo"
- **El título afirma, no describe** — "Lima pierde 3 horas al día en tráfico" > "Tiempo de desplazamiento"
- **El kicker contextualiza** — dice de dónde viene el dato o para qué sirve
- **Modales para el detalle** — si hay más info valiosa, va al modal, no al slide

---

## ESQUEMAS DE SLIDE

### hero — portada

```json
{
  "id": "slide-hero",
  "type": "hero",
  "kicker": "Etiqueta corta — contexto o tipo de informe",
  "title": "Afirmación principal\nSegunda línea en dorado (opcional)",
  "subtitle": "Una oración que amplía sin repetir el título",
  "layout": "center",
  "modal": { "title": "...", "kicker": "...", "body": "...", "bullets": [] }
}
```

`layout`: `"center"` (default) · `"left"` (título alineado izquierda, más periodístico)

### stats — KPIs

```json
{
  "id": "slide-stats",
  "type": "stats",
  "kicker": "...",
  "title": "...",
  "layout": "grid",
  "items": [
    {
      "label": "Nombre del indicador",
      "value": "42%",
      "trend": "up",
      "delta": "vs año anterior",
      "modal": { "title": "...", "body": "...", "bullets": [] }
    }
  ]
}
```

`layout`: `"grid"` (2–4 items iguales) · `"spotlight"` (1 KPI grande + hasta 3 secundarios)

### chart — gráfico

```json
{
  "id": "slide-chart",
  "type": "chart",
  "kicker": "...",
  "title": "...",
  "chartType": "bar",
  "description": "Fuente: ...",
  "modal": { "title": "Metodología", "body": "...", "bullets": [] },
  "data": {
    "categories": ["A", "B", "C"],
    "series": [{ "name": "Serie", "data": [10, 20, 30] }]
  }
}
```

`chartType`: `"bar"` · `"line"` · `"pie"`

### map — mapa

```json
{
  "id": "slide-map",
  "type": "map",
  "kicker": "...",
  "title": "...",
  "center": [-77.042, -12.046],
  "zoom": 11,
  "markers": [
    { "lat": -12.046, "lng": -77.042, "label": "Nombre", "color": "#00b4d8" }
  ],
  "modal": { "title": "Leyenda", "bullets": [] }
}
```

### text — texto y bullets

```json
{
  "id": "slide-text",
  "type": "text",
  "kicker": "...",
  "title": "...",
  "layout": "bullets",
  "bullets": ["Punto 1", "Punto 2"],
  "modal": { "title": "...", "body": "..." }
}
```

`layout`: `"bullets"` · `"full"` (campo `"content"`) · `"split"` (añadir `"image"` e `"imageAlt"`)

### quote — cita de impacto

```json
{
  "id": "slide-quote",
  "type": "quote",
  "quote": "El texto de la cita textual o afirmación de alto impacto.",
  "attribution": "Nombre o fuente",
  "context": "Contexto opcional debajo de la atribución"
}
```

### image — imagen a pantalla completa

```json
{
  "id": "slide-image",
  "type": "image",
  "src": "/assets/foto.jpg",
  "alt": "Descripción",
  "kicker": "...",
  "title": "Título sobre la imagen",
  "overlay": "dark"
}
```

`overlay`: `"dark"` (texto blanco) · `"none"` (solo imagen)

---

## CREAR UN PROYECTO NUEVO

```bash
# Crear estructura
mkdir -p projects/nombre-proyecto/research projects/nombre-proyecto/history

# Elegir template base
cp templates/diagnostico.json projects/nombre-proyecto/presentation.json
# o: campana.json, propuesta.json

# Claude creará brief.md y context.md durante la sesión
```

Nombre de carpeta: `cliente-tema-año` en minúsculas con guiones. Ej: `lima-movilidad-2026`

---

## TEMPLATES

| Archivo | Cuándo usar |
|---------|-------------|
| `templates/diagnostico.json` | Situación actual + datos + propuestas |
| `templates/campana.json` | Estrategia electoral |
| `templates/propuesta.json` | Propuesta de servicios a cliente |

---

## VERSIONADO

```bash
# Snapshot manual
cp projects/[p]/presentation.json projects/[p]/history/presentation-$(date +%Y%m%d-%H%M).json

# Ver versiones disponibles
ls projects/[p]/history/

# Volver a una versión
cp projects/[p]/history/presentation-20260513-1430.json projects/[p]/presentation.json
```

---

## EXPORTAR

```bash
npm run build
# Resultado en /dist — HTML autocontenido, sin servidor, listo para compartir
```

---

## NAVEGACIÓN

| Tecla | Acción |
|-------|--------|
| `→` `↓` `Space` | Siguiente slide |
| `←` `↑` | Slide anterior |
| `Home` / `End` | Primer / último slide |
| `Esc` | Cerrar modal |

---

## HERRAMIENTA: PERFIL 5N (standalone)

Uso: vetting político y due diligence reputacional de cualquier candidato (propio, rival o aliado).
Browser: `http://localhost:4321/vetting`

### Activación

Cuando el consultor diga alguna de estas frases:
- "Nuevo perfil 5N de [nombre]"
- "Analiza el perfil de [nombre]"
- "Quiero hacer vetting de [nombre]"
- "Perfil 5N para [nombre]"

### PROTOCOLO 5N — paso a paso

**PASO 1 — Datos iniciales**

Preguntar:
1. Nombre completo del candidato
2. ¿Es candidato propio, rival o aliado?
3. Cargo al que postula y elección
4. ¿Hay documentos en `vetting/[slug]/research/`?

Crear inmediatamente `vetting/[slug]/profile.json` con los datos meta.

**PASO 2 — Recolección por niveles**

Guiar nivel por nivel. Para cada uno mostrar las preguntas clave y registrar lo que el consultor sabe:

```
N1 — IDENTIDAD
¿Nombre según DNI? ¿Fecha y lugar de nacimiento? ¿DNI? ¿Tiene otras nacionalidades?
Fuentes a verificar: RENIEC, InfoGob, Migraciones

N2 — TRAYECTORIA Y VIDA PERSONAL
¿Estado civil, hijos? ¿Estudios (título, institución, año)? ¿Historial laboral últimos 10 años?
¿Trayectoria política: cargos, militancias, candidaturas previas?
Fuentes: SUNEDU (títulos), ROP/InfoGob JNE (militancias), SUNAT/MTPE (laboral)

N3 — RIESGO LEGAL Y REPUTACIONAL
¿Antecedentes penales, policiales, fiscales conocidos?
¿Deudas alimentarias (REDAM)? ¿Procesos por violencia familiar?
¿Escándalos mediáticos pasados o vigentes?
¿Huella digital problemática (tuits borrados, videos, fotos)?
Fuentes: Poder Judicial (CEJ), INPE, Ministerio Público, REDAM, medios

N4 — SOLVENCIA Y PATRIMONIO
¿Ingresos declarados vs. patrimonio visible?
¿Empresas propias o participación accionaria?
¿Inmuebles, vehículos? ¿Viajes frecuentes al exterior?
¿Contratos con el Estado? ¿Estructuras offshore?
Fuentes: SUNAT, SUNARP, Infocorp, Contraloría, Migraciones

N5 — SALUD Y CAPACIDAD FUNCIONAL
¿Condiciones médicas relevantes conocidas públicamente?
¿Autodeclaración disponible? ¿Señales de alerta en agenda pública?
(Tratar con discreción — solo información voluntaria o pública)

ENTORNO
¿Cónyuge con actividad empresarial o política?
¿Socios comerciales activos? ¿Financistas de campaña conocidos?
¿Asesores, operadores, mentores con historia problemática?
Fuente: Registro de Aportantes JNE

COHERENCIA
¿Discurso actual vs. posiciones históricas documentadas?
¿Promesas de campañas anteriores vs. cumplimiento real?
¿Hoja de vida declarada vs. registros verificables?
¿Tuits, columnas, entrevistas que contradicen posición actual?
```

**PASO 3 — Generar el reporte**

Cuando el consultor diga "genera el reporte" o "analiza lo que tenemos":

1. Evaluar semáforo por nivel (verde / amarillo / rojo) según criterios:

| Nivel | Verde | Amarillo | Rojo |
|-------|-------|----------|------|
| N1 | Identidad consistente | Inconsistencias menores | Documentación cuestionable |
| N2 | Trayectoria verificada al 100% | Algún título sin verificar | Títulos falsos o vacíos |
| N3 | Sin antecedentes ni escándalos | Procesos resueltos / escándalo antiguo | Proceso activo / escándalo vigente |
| N4 | Patrimonio coherente con ingresos | Inconsistencias menores | Offshore opacos / conflicto grave |
| N5 | Apto, sin señales de riesgo | Condición declarada y controlada | Condición que compromete capacidad |
| Entorno | Sin vínculos problemáticos | Vínculos con riesgo menor | Vínculos con personas o grupos vetados |
| Coherencia | Discurso consistente | Contradicciones menores | Contradicción central entre discurso y hechos |

2. Identificar los top 3 riesgos con:
   - Probabilidad de que salga (alta / media / baja)
   - Impacto si sale (alto / medio / bajo)
   - Acción recomendada: mitigacion-inmediata / preparar-respuesta / monitorear / archivar
   - Mensaje preparado + Vocero + Material de respaldo

3. Escribir conclusión ejecutiva (3–5 líneas, enfocada en el riesgo principal y la recomendación accionable)

4. Asignar riesgo global: alto / medio-alto / medio / medio-bajo / bajo

5. Guardar en `vetting/[slug]/report.json`

**PASO 4 — Revisión y ajuste**

El browser en `/vetting/[slug]/` se actualiza automáticamente.
El consultor puede pedir:
- "Agrega este hallazgo al N3: ..."
- "Reanaliza con esta nueva información"
- "Cambia el riesgo de Coherencia a rojo porque..."

### Archivos

```
vetting/
  [slug]/
    profile.json    ← datos del candidato (Claude edita)
    report.json     ← análisis generado (Claude genera)
    research/       ← documentos fuente (PDF, capturas, notas)
    history/        ← snapshots opcionales
```

### Comandos naturales reconocidos

| El consultor dice | Claude hace |
|-------------------|-------------|
| "Nuevo perfil 5N de [nombre]" | PASO 1 + crea profile.json |
| "Muéstrame el estado de [nombre]" | Resume los datos ingresados por nivel |
| "Genera el reporte de [nombre]" | PASO 3 completo → report.json |
| "Agrega al perfil de [nombre]: ..." | Actualiza profile.json en el nivel correspondiente |
| "Reanaliza [nombre] con este nuevo dato" | Actualiza report.json |
| "¿Qué falta verificar de [nombre]?" | Lista fuentes con status "pendiente" |
| "Snapshot del perfil de [nombre]" | Copia a `history/profile-YYYYMMDD-HHMM.json` |

---

## HERRAMIENTA: DIAGNÓSTICO TERRITORIAL (ECD)

Uso: instrumento de diagnóstico territorial estructurado en tres dimensiones: Estructura (Bourdieu), Conciencia (Michigan School), Decisión (Rational Choice).
Browser: `http://localhost:4321/diagnostics`

### Activación

Cuando el consultor diga:
- "Nuevo diagnóstico territorial de [territorio]"
- "Diagnóstico de [territorio] para [cargo] [año]"
- "Analiza el territorio de [nombre]"

### PROTOCOLO ECD — guía de recolección

Crear `diagnostics/[slug]/territorial.json` con meta inicial. Luego guiar sección por sección.

**META**
nombre_territorio, nivel (distrital/provincial/regional/nacional), fecha, eleccion_cargo, eleccion_año

---

**E — ESTRUCTURA**

```
E1 DEMOGRAFÍA
población total, % urbana/rural, pirámide etaria {0-17,18-29,30-49,50-64,65+},
tasa crecimiento, migración/remesas, km², densidad, división política,
características físicas, infraestructura vial

E2 CAPITAL ECONÓMICO
IDH, índice pobreza %, PEA, desempleo %, % informalidad,
actividad dominante, sectores estructurantes [],
presupuesto anual, % ejecución, rubros de gasto, obras pendientes

E3 CAPITAL CULTURAL Y SOCIAL
etnias/lenguas, tradiciones, nivel educativo,
religión predominante, iglesias influyentes [],
organizaciones de base [], gremios [], ONGs []

E4 CAMPO POLÍTICO — tabla dinámica
figuras[]: { nombre, rol, capital_dominante, influencia 1-5 }
ex_autoridades, líderes_informales, nombres_quemados [], conflictos_activos []

E5 CLEAVAGES — checkboxes (true/false)
centro_periferia, urbano_rural, capital_trabajo,
tradicional_moderno, etnico_linguistico, religioso, otro
```

**C — CONCIENCIA**

```
C1 IDENTIDADES Y PERCEPCIONES
% id_partidaria, partidos_base_local [], ideología_predominante,
identidad_regional, identidad_etnica, identidad_generacional

C2 ★ SEGMENTOS PSICOGRÁFICOS (hasta 6) — SE REUTILIZAN EN D5
segmentos[]: { nombre, pct_aprox, valores, aspiraciones, temores }

C3 CLIMA EMOCIONAL
checkboxes: miedo, esperanza, indignacion, resignacion, orgullo, nostalgia
confianza_institucional {1-5}:
  gobierno_nacional, gobierno_local, congreso, poder_judicial, policia, iglesia, medios

C4 MEMORIA POLÍTICA
hitos_positivos [], hitos_traumaticos [], heroes_locales [], villanos []

C5 ISSUES PRIORITARIOS — tabla con ranking
issues[]: { tema, urgencia 1-5, visible_medios bool }
(8 predefinidos + libres)

C6 ECOSISTEMA DE MEDIOS Y OPINIÓN
medios[]: { nombre, tipo, alcance, linea_editorial }
lideres_opinion: { pastores [], dirigentes [], influencers [], whatsapp [] }
encuestas[]: { encuestadora, fecha, muestra, hallazgos }
```

**D — DECISIÓN**

```
D1 UNIVERSO ELECTORAL
total_electores, pct_sobre_poblacion, electores_nuevos,
participacion_anterior %, voto_blanco_nulo %, ausentismo %

D2 HISTORIA ELECTORAL — últimas 3 elecciones
elecciones[]: { año, ganador, pct, segundo, pct2, margen }
volatilidad, numero_efectivo_partidos, bastiones

D3 COMPETIDORES — tabla dinámica
competidores[]: { candidato, partido, capital_dominante, issues [], techo_estimado }

D4 LÓGICA DEL CÁLCULO DEL VOTANTE
aprobacion_saliente %, clima_continuidad_castigo (continuidad/castigo),
expectativas, promesa_resonante, issue_decisivo,
distancia_local_votacion, factores_desincentivo

D5 ★ MATRIZ DE DECISIÓN — vinculada a C2
matriz[]: { segmento (nombre exacto de C2), candidato_preferido,
            razon_principal, voto_util bool, prob_cambio (alta/media/baja) }
```

### Archivo

```
diagnostics/[slug]/
  territorial.json    ← Claude edita directamente
  research/           ← documentos fuente
  history/            ← snapshots opcionales
```

### Comandos naturales reconocidos

| El consultor dice | Claude hace |
|-------------------|-------------|
| "Nuevo diagnóstico de [territorio]" | Crea territorial.json con meta |
| "Completa E2 con estos datos: ..." | Actualiza la sección E2 |
| "¿Qué falta completar?" | Lista campos vacíos por sección |
| "Propón los segmentos C2" | Sugiere 4-5 segmentos basados en E1/E2/E3 |
| "Genera los cruces ECD" | Analiza E×C, C×D, E×D y síntesis (guarda en analysis.json) |
| "Snapshot del diagnóstico de [territorio]" | Copia a history/ |

### Nota crítica: C2 → D5
Los nombres de segmentos en D5.matriz deben coincidir exactamente con los nombres en C2.segmentos.
Cuando el consultor complete D5, preguntar: "¿Usamos los segmentos de C2 que definimos, o quieres otros?"
