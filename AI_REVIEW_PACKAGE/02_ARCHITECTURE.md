# Architecture & Technical Implementation

## Technology Stack
- **Frontend:** React 18.3.1, ReactDOM 18.3.1, Lucide React 0.344.0.
- **Styling:** Tailwind CSS 3.4.4, PostCSS, Autoprefixer.
- **Graphics:** HTML5 Canvas 2D API (Offscreen canvases for high-DPI export).
- **Bundler:** Vite 5.3.1 + `vite-plugin-singlefile` 2.3.3 (inlines JS, CSS, and image assets into standalone `index.html`).

---

## Directory Organization
```
src/
├── components/
│   ├── Sidebar/             # Collapsible tool accordion
│   │   ├── CompositionPanel.jsx   # Text & image layer management, font upload
│   │   ├── DialCanvasPanel.jsx    # Base color, hex input, presets, transparency
│   │   ├── DomePanel.jsx          # Crystal curvature, start radius, shine, angle
│   │   ├── IndicesPanel.jsx       # Marker presets, 12h mask grid, size/width
│   │   ├── OutputPanel.jsx        # Diameter (mm), paper size selection
│   │   └── PrintQueuePanel.jsx    # Batch print queue manager
│   ├── CanvasEditor.jsx     # Main 2D workspace with magnetic center snapping
│   ├── ColorExtractorModal.jsx # Image color sampler & 7x zoom pixel loupe
│   ├── Header.jsx           # Undo/Redo, Save/Load JSON, Preview/Print triggers
│   └── WatchPreview.jsx     # 3D watch mockup with movable, customizable hands
├── constants/
│   └── presets.js           # Dial colors, paper sizes, fonts, index styles, watch photos
├── utils/
│   ├── colorExtractor.js    # 4-bit color quantization & EyeDropper API helpers
│   ├── dialRenderer.js      # Centralized Canvas 2D drawing pipeline
│   ├── domeRefraction.js    # Per-pixel radial displacement & Phong specular
│   ├── history.js           # JSON project serialization & file loader
│   ├── printEngine.js       # 300 DPI batch print sheet packing & JPEG/PNG export
│   └── textArc.js           # Circular arc typography with Hebrew/RTL reverser
├── App.jsx                  # Root state store, history stack, layout shell
├── index.css                # Tailwind directives & wood-grain styles
└── main.jsx                 # React root mount
```

---

## Data Models

### 1. `dialSettings`
```typescript
{
  diameterMm: number | string;        // Physical dial diameter in mm (e.g. 42)
  dialColor: string;                  // Hex color of dial face (default: "#FFFFFF")
  transparentBg: boolean;             // Transparent vs solid color
  paperSize: '13x18' | '10x15';       // Target photo paper for printing
  indexStyle: string;                 // Preset ID ('ktm-3d-gold', 'classic-arabic', etc.)
  indexColor: string;                 // Marker fill color
  indexSize: number;                  // Marker length (px)
  indexWidth: number;                 // Marker width (px)
  indexRadius: number;                // Distance from center (px)
  indexMask: boolean[];               // 12 booleans for hours 12h to 11h
  rotateMarkers: boolean;             // Align marker rotation to polar angle
  showCenterDot: boolean;             // Pinion cap visibility
  showShadow: boolean;                // Marker drop shadow
  domeEnabled: boolean;               // 3D crystal refraction toggle
  domeCurvature: number;              // Curvature strength (0-100)
  domeStartRadius: number;            // Curvature start threshold (0-100)
  domeGlassShine: number;             // Specular shine intensity (0-100)
  domeLightAngle: number;             // Light source angle (0-360 deg)
}
```

### 2. `Layer`
```typescript
type Layer = 
  | { type: 'text'; name: string; text: string; font: string; size: number; color: string;
      opacity: number; x: number; y: number; rotation: number; scale: number; isBold: boolean;
      shadow: boolean; curved: boolean; radius: number; startAngle: number; spacing: number }
  | { type: 'image'; name: string; img?: HTMLImageElement; imgSrc?: string;
      x: number; y: number; scale: number; opacity: number; rotation: number };
```

---

## Core Pipelines

1. **Central Dial Renderer (`dialRenderer.js`):**
   `drawDialToContext(ctx, cx, cy, radius, scale, state)` allocates a square offscreen canvas, clips a circle of `radius`, fills `dialColor`, iterates layers (images blitted, text rendered), draws indices according to `indexMask`, adds center pinion dot, applies `applyDomeWarp()` if dome is enabled, and paints onto the target context.
2. **Text Arc & RTL Engine (`textArc.js`):**
   Measures glyph widths via `ctx.measureText`. If Hebrew is detected (`/[\u0590-\u05FF]/`), characters are reversed before computing polar angle positions along clockwise arcs so RTL text reads correctly.
3. **Physical Print Engine (`printEngine.js`):**
   Converts mm to pixels at 300 DPI: $\text{px} = \text{mm} \times (1 / 25.4) \times 300$. Dynamically tiles dials onto standard photo paper with millimeter labels and circular cut lines.
4. **State & Undo/Redo (`App.jsx`):**
   React `useState` with an in-memory history stack. Deep clones `layers` and `dialSettings` debounced by 400ms. Converts `HTMLImageElement` instances to serializable `imgSrc` strings for storage and project JSON export.

---

## Architecture Flow Diagram
```
[ User Input (Sliders, Drag, Color Pickers) ]
                     │
                     ▼
          [ App.jsx State Store ] ◄───► [ Undo/Redo History ]
                     │
    ┌────────────────┼────────────────┬──────────────┐
    ▼                ▼                ▼              ▼
[ DialCanvas ] [ Composition ]  [ Indices ]    [ Dome / Print ]
    └────────────────┬────────────────┴──────────────┘
                     ▼ (State Props)
        [ src/utils/dialRenderer.js ]
                     │
     ┌───────────────┼───────────────┐
     ▼               ▼               ▼
[ CanvasEditor ] [ WatchPreview ] [ Print Engine ]
 (Interactive)    (3D Mockup)     (300 DPI Export)
```
