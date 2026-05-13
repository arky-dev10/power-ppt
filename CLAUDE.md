# Power PPT — Claude Workspace

AI-first presentation workspace. Claude edits `presentation.json`; the Astro dev server renders changes in real time.

## Start

```bash
npm install
npm run dev     # → http://localhost:4321
```

Keyboard: `→` / `↓` / `Space` next slide · `←` / `↑` previous · `Home` / `End` first/last · `Esc` close modal.

---

## Cómo actuar cuando el consultor abre este proyecto

Al iniciar una conversación en este proyecto, Claude debe:

1. **Saludar brevemente** e identificar el contexto: "Estás en el workspace de presentaciones de Goberna. Puedo crear o editar slides directamente desde aquí."

2. **Hacer estas preguntas** si el consultor no ha dado instrucciones claras:
   - ¿Cuál es el tema o cliente de la presentación?
   - ¿Tienes archivos de investigación en `/research/`? (PDFs, CSVs, DOCX, datos)
   - ¿Cuántos slides aproximadamente necesitas?
   - ¿Para qué audiencia es? (cliente político, equipo interno, presentación pública)

3. **Si hay archivos en `/research/`**, leerlos antes de proponer la estructura de slides.

4. **Proponer una estructura** con los tipos de slide más apropiados y pedir aprobación antes de generar el JSON completo.

5. **Editar `presentation.json`** directamente — nunca pedirle al consultor que lo haga manualmente.

6. **Avisar cuando termina** cada cambio para que el consultor refresque el browser y dé feedback.

### Comandos de voz útiles que el consultor puede usar

- "Crea una presentación sobre [tema] con los archivos en /research/"
- "Agrega un slide de KPIs con [datos]"
- "Cambia el título del tercer slide a [texto]"
- "El gráfico debería mostrar [datos] en vez de esos"
- "Mueve el slide de mapa al inicio"
- "Genera una versión en inglés"
- "Guarda una copia en /history/ antes de cambiar todo"

---

## How to edit a presentation

Edit `presentation.json`. The browser reloads automatically on save.

To add a slide: append an object to the `slides` array with a unique `id` and a `type`.

To reorder slides: change the order in the `slides` array.

To delete a slide: remove it from the array.

---

## Slide schemas

### hero — full-screen title

```json
{
  "id": "slide-hero",
  "type": "hero",
  "kicker": "Optional tag above the title",
  "title": "Main Title\nSecond line in accent color",
  "subtitle": "Optional subtitle paragraph",
  "modal": {
    "title": "Optional detail overlay",
    "body": "Paragraph text",
    "bullets": ["Point 1", "Point 2"]
  }
}
```

### stats — KPI grid (2, 3 or 4 items)

```json
{
  "id": "slide-stats",
  "type": "stats",
  "kicker": "Optional",
  "title": "Section Title",
  "items": [
    {
      "label": "Metric name",
      "value": "42%",
      "trend": "up",
      "delta": "optional context",
      "modal": {
        "title": "Detail title",
        "body": "Explanation",
        "bullets": ["Detail 1", "Detail 2"]
      }
    },
    { "label": "Another", "value": "1.2M", "trend": "down", "delta": "vs last year" }
  ]
}
```

`trend` values: `"up"` (green), `"down"` (red), `"neutral"` (gray).

Each item can optionally have a `"modal"` field to show a detail popup.

Numeric values like `"92 min"`, `"8.4M"`, `"34%"` animate from zero on slide entry.

### chart — data visualization

```json
{
  "id": "slide-chart",
  "type": "chart",
  "kicker": "Optional",
  "title": "Chart Title",
  "chartType": "bar",
  "description": "Optional source / footnote",
  "modal": {
    "title": "Fuente de datos",
    "body": "Descripción metodológica",
    "bullets": ["Detalle 1", "Detalle 2"]
  },
  "data": {
    "categories": ["Jan", "Feb", "Mar"],
    "series": [
      { "name": "Revenue", "data": [120, 200, 150] }
    ]
  }
}
```

`chartType` values: `"bar"`, `"line"`, `"pie"`.

For pie charts, `categories` becomes the slice labels and `series[0].data` the values.

### map — geographic view (MapLibre)

```json
{
  "id": "slide-map",
  "type": "map",
  "kicker": "Optional",
  "title": "Map Title",
  "center": [-77.042, -12.046],
  "zoom": 11,
  "markers": [
    { "lat": -12.046, "lng": -77.042, "label": "Location name", "color": "#00b4d8" }
  ],
  "modal": {
    "title": "Leyenda",
    "bullets": ["Punto A — descripción", "Punto B — descripción"]
  }
}
```

`center` is `[longitude, latitude]`. Map tiles are dark (CartoCDN Dark Matter, free, no API key needed).

### text — narrative / bullet points

```json
{
  "id": "slide-text",
  "type": "text",
  "kicker": "Optional",
  "title": "Slide Title",
  "layout": "bullets",
  "bullets": [
    "First key point",
    "Second key point"
  ]
}
```

`layout` values: `"bullets"` (list), `"full"` (single paragraph — use `"content"` field instead of `"bullets"`), `"split"` (paragraph + image — add `"image"` and `"imageAlt"` fields).

---

## Presentation metadata

```json
{
  "meta": {
    "title": "Presentation title (browser tab)",
    "subtitle": "Optional",
    "author": "Optional",
    "accent": "#00b4d8"
  }
}
```

`accent` controls the progress bar, dot indicators, and decorative elements.

---

## Modal (info overlay)

Any slide or stats item can include a `"modal"` field. When clicked, it opens a dark overlay with detailed info.

```json
"modal": {
  "label": "Button label (optional, default: 'Ver más')",
  "kicker": "Optional small tag",
  "title": "Modal heading",
  "body": "Optional paragraph",
  "bullets": [
    "First detail point",
    "Second detail point"
  ]
}
```

Add `"modal"` at the top level of any slide to show a button in the header. Add it inside a stats `item` to show a link under the value.

---

## Entrance animations

Elements with `data-anim` attribute animate in when a slide becomes active. Handled automatically — no config needed. Stagger delay increases per element.

---

## Research workflow

1. Drop files (PDF, CSV, DOCX, images, JSON) into `/research/`
2. Ask Claude to analyze them:
   - "Resume este PDF y crea 3 slides con los puntos clave"
   - "Extrae los datos de este CSV y crea un bar chart"
   - "Encuentra los insights más relevantes y genera una narrativa"
3. Claude updates `presentation.json` accordingly

---

## Versioning

Before major changes, save a snapshot:

```bash
cp presentation.json history/presentation-$(date +%Y%m%d-%H%M).json
```

---

## Export

```bash
npm run build   # outputs static site to /dist
cp -r dist exports/$(date +%Y%m%d)
```

The export is a fully self-contained HTML folder — shareable without any server.

---

## Workspace folders

| Folder | Purpose |
|--------|---------|
| `/research` | Source documents for Claude to analyze |
| `/assets` | Images, logos, data files |
| `/exports` | Built static presentations |
| `/sessions` | Session notes and context |
| `/history` | Versioned JSON snapshots |

---

## Slide types to add later

- `timeline` — horizontal or vertical timeline
- `quote` — large pull quote with attribution
- `image` — full-bleed image with caption
- `table` — formatted data table
- `comparison` — side-by-side columns
