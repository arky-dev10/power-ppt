# Power PPT — Claude Workspace

AI-first presentation workspace. Claude edits `projects/[nombre]/presentation.json`;
el Astro dev server recarga el browser en tiempo real.

## Inicio rápido

```bash
npm install
npm run dev   # → http://localhost:4321
```

---

## PROTOCOLO DE SESIÓN (leer siempre al iniciar)

### Al abrir este proyecto Claude debe:

**1. Preguntar por el proyecto activo** si el consultor no lo indicó:
> "¿Con qué proyecto trabajamos hoy? Puedo ver los proyectos existentes en /projects/ o crear uno nuevo."

**2. Leer el context.md del proyecto** antes de hacer cualquier cosa:
```
/projects/[nombre-proyecto]/context.md
```
Resumir al consultor en 2-3 líneas: qué existe, qué estaba pendiente.

**3. Si es proyecto nuevo**, hacer estas preguntas antes de crear nada:
- ¿Cuál es el tema y el cliente?
- ¿Qué tipo de presentación? (diagnóstico / campaña / propuesta / otro)
- ¿Tienes archivos en /research/? ¿Quieres que los analice?
- ¿Cuántos slides aproximadamente?
- ¿Hay alguna fecha límite o urgencia?

**4. Proponer la estructura** de slides y pedir aprobación antes de generar el JSON.

**5. Al terminar la sesión** (cuando el consultor diga "listo", "por hoy es todo", "guarda el contexto"):
- Actualizar `context.md` con el estado actual, decisiones tomadas y pendientes
- Avisar qué se actualizó

---

## Cómo crear un proyecto nuevo

```
1. Crear carpeta: /projects/nombre-cliente-año/
2. Copiar template base desde /templates/ (diagnostico.json, campana.json o propuesta.json)
3. Renombrar a presentation.json y adaptarlo con los datos reales
4. Crear context.md con la información inicial del proyecto
5. Crear subcarpetas: /research/ y /history/
```

Comandos bash equivalentes:
```bash
mkdir -p projects/nombre-proyecto/research projects/nombre-proyecto/history
cp templates/diagnostico.json projects/nombre-proyecto/presentation.json
```

El proyecto aparecerá automáticamente en el selector de http://localhost:4321

---

## Formato de context.md

Cada proyecto debe tener un `context.md` con esta estructura:

```markdown
# [Título del Proyecto]

## Cliente
[Nombre del cliente o uso interno]

## Última sesión
[Fecha — resumen de qué se hizo]

## Estado actual
[Qué slides existen, qué datos tienen, estado del diseño]

## Pendientes
[Lista de tareas para la próxima sesión]

## Archivos en /research/
[Lista de archivos disponibles y para qué sirven]

## Decisiones tomadas
[Decisiones de diseño, datos, enfoque que no deben revertirse]

## Notas
[Cualquier contexto adicional útil]
```

---

## Cómo editar una presentación

Editar `projects/[proyecto]/presentation.json`. El browser recarga automáticamente.

Para agregar un slide: añadir objeto al array `slides` con `id` único y `type`.
Para reordenar: cambiar el orden en el array.
Para eliminar: quitar el objeto del array.

---

## Tipos de slide

### hero — portada a pantalla completa

```json
{
  "id": "slide-hero",
  "type": "hero",
  "kicker": "Tag opcional sobre el título",
  "title": "Título Principal\nSegunda línea en dorado",
  "subtitle": "Párrafo opcional debajo del título",
  "modal": { "title": "Título modal", "body": "...", "bullets": [] }
}
```

### stats — grid de KPIs (2, 3 o 4 items)

```json
{
  "id": "slide-stats",
  "type": "stats",
  "kicker": "Opcional",
  "title": "Título de la sección",
  "items": [
    {
      "label": "Nombre del indicador",
      "value": "42%",
      "trend": "up",
      "delta": "contexto opcional",
      "modal": { "title": "Detalle", "bullets": ["Punto 1", "Punto 2"] }
    }
  ]
}
```

`trend`: `"up"` (verde) · `"down"` (rojo) · `"neutral"` (gris)

Los valores numéricos como `"92 min"`, `"8.4M"`, `"34%"` se animan desde cero.

### chart — visualización de datos

```json
{
  "id": "slide-chart",
  "type": "chart",
  "kicker": "Opcional",
  "title": "Título del Gráfico",
  "chartType": "bar",
  "description": "Fuente: [FUENTE] [AÑO]",
  "modal": { "title": "Metodología", "body": "...", "bullets": [] },
  "data": {
    "categories": ["Ene", "Feb", "Mar"],
    "series": [{ "name": "Serie", "data": [120, 200, 150] }]
  }
}
```

`chartType`: `"bar"` · `"line"` · `"pie"`

### map — mapa interactivo (MapLibre)

```json
{
  "id": "slide-map",
  "type": "map",
  "kicker": "Opcional",
  "title": "Título del Mapa",
  "center": [-77.042, -12.046],
  "zoom": 11,
  "markers": [
    { "lat": -12.046, "lng": -77.042, "label": "Nombre", "color": "#00b4d8" }
  ],
  "modal": { "title": "Leyenda", "bullets": ["Punto A", "Punto B"] }
}
```

`center` es `[longitud, latitud]`.

### text — texto narrativo o bullets

```json
{
  "id": "slide-text",
  "type": "text",
  "kicker": "Opcional",
  "title": "Título del Slide",
  "layout": "bullets",
  "bullets": ["Punto 1", "Punto 2"],
  "modal": { "title": "Más info", "body": "..." }
}
```

`layout`: `"bullets"` · `"full"` (usar campo `"content"`) · `"split"` (añadir `"image"` e `"imageAlt"`)

---

## Modal (overlay de detalle)

Cualquier slide o item de stats puede tener un campo `"modal"`:

```json
"modal": {
  "label": "Texto del botón (default: 'Ver más')",
  "kicker": "Tag pequeño opcional",
  "title": "Título del modal",
  "body": "Párrafo opcional",
  "bullets": ["Detalle 1", "Detalle 2"]
}
```

---

## Metadatos de la presentación

```json
{
  "meta": {
    "title": "Título (pestaña del browser)",
    "subtitle": "Opcional",
    "author": "Opcional",
    "accent": "#fbc02d"
  }
}
```

---

## Templates disponibles

| Archivo | Uso |
|---------|-----|
| `templates/diagnostico.json` | Diagnóstico de situación (5 slides base) |
| `templates/campana.json` | Campaña electoral (5 slides base) |
| `templates/propuesta.json` | Propuesta de servicios (5 slides base) |

Copiar el template al proyecto y completar los campos marcados con `[MAYÚSCULAS]`.

---

## Flujo de investigación

1. Copiar archivos (PDF, CSV, DOCX, imágenes) a `/projects/[proyecto]/research/`
2. Pedirle a Claude que los analice:
   - "Resume este PDF y crea 3 slides con los puntos clave"
   - "Extrae los datos de este CSV y genera un bar chart"
   - "Analiza los archivos en /research/ y propón la estructura de slides"
3. Claude actualiza `presentation.json` y el browser recarga

---

## Versionado

Guardar snapshot antes de cambios grandes:
```bash
cp projects/[proyecto]/presentation.json projects/[proyecto]/history/presentation-$(date +%Y%m%d-%H%M).json
```

---

## Exportar

```bash
npm run build
# Resultado en /dist — HTML autocontenido, sin servidor
```

---

## Navegación en el browser

| Tecla | Acción |
|-------|--------|
| `→` `↓` `Space` | Siguiente slide |
| `←` `↑` | Slide anterior |
| `Home` / `End` | Primer / último slide |
| `Esc` | Cerrar modal |
