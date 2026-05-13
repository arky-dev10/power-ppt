# Power PPT — Workspace de Presentaciones con IA

Entorno local donde **Claude edita `presentation.json`** y Astro recarga el browser en tiempo real. El consultor solo aporta el contenido; el diseño y la estructura los maneja Claude.

---

## Instalación

Necesitas: **Node.js 18+** y **Claude Code** instalado.

```bash
git clone https://github.com/grupogoberna/power-ppt.git
cd power-ppt
npm install
npm run dev
```

Abre `http://localhost:4321` — verás la presentación de ejemplo.

---

## Uso con Claude

Con el servidor corriendo, abre Claude Code en la misma carpeta:

```bash
claude
```

Luego habla en lenguaje natural:

```
"Crea una presentación de 5 slides sobre seguridad ciudadana
 en Lima Norte con los datos del PDF en /research/"
```

Claude leerá los archivos, editará `presentation.json` y el
browser actualizará automáticamente.

---

## Navegar la presentación

| Tecla | Acción |
|-------|--------|
| `→` `↓` `Space` | Siguiente slide |
| `←` `↑` | Slide anterior |
| `Home` / `End` | Primer / último slide |
| `Esc` | Cerrar modal |

---

## Tipos de slide disponibles

| Tipo | Descripción |
|------|-------------|
| `hero` | Portada a pantalla completa con partículas |
| `stats` | Grid de KPIs con tendencias y contadores animados |
| `chart` | Gráfico de barras, línea o pie (ECharts) |
| `map` | Mapa interactivo con marcadores (MapLibre) |
| `text` | Texto, bullets o layout dividido |

Todos los tipos soportan modales de detalle con el campo `"modal"`.

---

## Flujo de investigación

1. Copia tus archivos (PDF, CSV, DOCX, imágenes) a `/research/`
2. Abre Claude Code y pide lo que necesitas en español
3. Revisa en el browser y ajusta conversacionalmente
4. Exporta cuando esté listo:

```bash
npm run build
# Resultado en /dist — carpeta HTML autocontenida, sin servidor
```

---

## Estructura del proyecto

```
power-ppt/
├── presentation.json   ← Claude edita este archivo
├── research/           ← Tus documentos fuente
├── public/             ← Imágenes y assets estáticos
├── history/            ← Snapshots de versiones anteriores
├── src/
│   ├── layouts/        ← Layout global (chrome, animaciones, modal)
│   ├── components/     ← Componentes por tipo de slide
│   └── pages/          ← index.astro (lee presentation.json)
└── CLAUDE.md           ← Schemas completos para Claude
```

---

## Guardar una versión

```bash
cp presentation.json history/presentation-$(date +%Y%m%d-%H%M).json
```

---

Hecho con Claude + Astro + ECharts + MapLibre · Goberna Consultoría Política
