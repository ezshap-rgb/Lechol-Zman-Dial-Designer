# Independent AI Architecture & Code Review Package

> **INSTRUCTIONS FOR REVIEWER AI (Claude / ChatGPT):**
> Act as a Principal Software Architect, Staff Engineer, and Product Design Consultant.
> Read this entire self-contained package carefully—especially **Section 3 (Confirmed vs. Inferred Decisions & Constraints)** so you do not recommend approaches that were already intentionally rejected.
>
> Organize your critique into these four actionable sections so I can bring your feedback directly back into my coding agent (Antigravity):
> 1. **Critical Architectural & Structural Risks** (bottlenecks, state bugs, scaling limits, security gaps)
> 2. **High-Leverage Quick Wins & Bug Fixes** (specific file/function improvements with clear reasoning)
> 3. **Product & UX Alignment Gaps** (where the current implementation falls short of the stated user workflows)
> 4. **Ready-to-Run Antigravity Implementation Prompts** (2–4 self-contained prompts I can paste directly into Antigravity to execute your highest-priority recommendations safely)

---

## Part 1 — Project Overview & Product Vision

# Project Overview — Studio Lechol Zman Dial Designer

## Executive Summary
**Studio Lechol Zman Dial Designer** is an in-browser horological design and layout application for watchmakers, custom dial artists, and modders. It enables designing watch dials across arbitrary millimeter diameters, configuring 12-hour index arrays, composing graphic/text layers (with curved circular text and Hebrew/RTL support), simulating 3D dome crystal refraction, previewing designs on real-world watch cases, and generating calibrated 300 DPI batch print sheets for physical fabrication. **[Implemented]**

*"Lechol Zman"* (Hebrew: *"For Every Time"* / Ecclesiastes 3:1) reflects the studio's focus on bespoke timekeeping aesthetics. **[Inferred]**

---

## Core Problem Solved
1. **Millimetric Physical Accuracy:** Standard vector software lacks automatic scaling to exact physical diameters (e.g. 28.5mm for Seiko NH35 to 44mm pocket watches) calibrated to 300 DPI print media. **[Documented]**
2. **Radial Index Geometry:** Automates 12-hour marker generation with 3D bevels, numerals, asset graphics, and per-hour mask toggles. **[Implemented]**
3. **Color Matching:** Provides live palette extraction and pixel-level loupe sampling from reference images or brand logos. **[Implemented]**
4. **Crystal Refraction Preview:** Simulates optical perimeter distortion and specular glare caused by domed acrylic/sapphire crystals. **[Implemented]**
5. **Batch Print Production:** Dynamically tiles multiple dials onto standard photo paper (10x15cm, 13x18cm) with cutting rings and diameter labels. **[Implemented]**

---

## Target Audience & Product Philosophy
- **Audience:** Independent watchmakers, Seiko modders, dial customizers, commemorative gift creators, and print technicians. **[Inferred]**
- **Zero-Backend, Local-First:** 100% client-side execution in HTML5 Canvas 2D. Zero telemetry, zero cloud dependencies. **[Implemented]**
- **Single-File Distribution:** Bundles into one autonomous `index.html` (~3.3MB) via `vite-plugin-singlefile` with all assets inlined, running offline via `file://`. **[Implemented]**
- **Tactile Horological Workbench:** Dark slate trims, mahogany wood-grain canvas backdrop, and instant slider feedback. **[Implemented]**

---

## Primary Workflows
1. **Dial Setup:** Set millimeter diameter, dial canvas color (presets, hex, spectrum picker), or toggle transparent base.
2. **Composition:** Add text/image layers. Configure curved arc radius, start angle, letter spacing, fonts, opacity, scale, and rotation. Moving layers snap magnetically to central axes.
3. **Indices:** Select style (3D gold/silver batons, Arabic numerals, custom image markers), adjust radius/size/width, and toggle 12-hour masks.
4. **Color Matching:** Use native EyeDropper API or open Color Extractor modal to sample image pixels with a 7x loupe and auto-detected palette.
5. **Watch Case Preview:** Overlay dial onto luxury watch cases (Rolex Oyster, steel, leather, wood) with movable, customizable hands.
6. **Optical Dome Simulation:** Preview raymarched crystal curvature, edge refraction, and specular highlight.
7. **Export & Print:** Download 2000x2000 px PNG/JPG or generate 300 DPI multi-dial print sheets on standard photo paper.

---

## Current Status & Roadmap
- **Stage:** Production-ready client-side single-page app. **[Implemented]**
- **Limitations:** Raster-only output (no vector SVG/DXF for CNC/laser); monolithic state in `App.jsx`; CPU-bound dome refraction. **[Documented]**
- **Vision:** Vector SVG/DXF toolpath export, WebGL PBR dial shaders, and movement footprint overlays (NH35/ETA 2824 date windows). **[Inferred]**

---

## Part 2 — Architecture & Technical Implementation

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

---

## Part 3 — Architectural Decisions & Constraints

# Architectural Decisions & Constraints

## Major Decisions Log

### 1. Single-File HTML Distribution (`vite-plugin-singlefile`)
- **Category:** **Confirmed**
- **Decision:** Bundle the entire application (JS, CSS, fonts, image assets) into a single standalone `index.html` file (~3.3MB).
- **Rationale:** Watchmakers and print technicians frequently operate offline studio machines without Node.js or web servers. Single-file HTML can be opened directly via `file://` without CORS errors on asset loading.
- **Alternatives Rejected:** Multi-asset build (fails on `file://` protocol); Electron (excessive 150MB+ footprint).

---

### 2. Pure HTML5 Canvas 2D over SVG / WebGL
- **Category:** **Confirmed**
- **Decision:** Implement all dial rendering, layer compositing, and dome refraction in Canvas 2D.
- **Rationale:**
  - Pixel manipulation: 3D crystal dome refraction requires per-pixel mathematical warping and normal-map specular calculations via `getImageData`/`putImageData`.
  - Print export: Canvas natively renders offscreen at arbitrary print resolutions (2000x2000 to 4000x6000 px) for instant PNG/JPG export.
- **Alternatives Rejected:** SVG DOM (optical distortion and print packing are difficult and slow); WebGL (excessive shader complexity and dependency weight for 2D radial layout).

---

### 3. Centralized Rendering Pipeline (`dialRenderer.js`)
- **Category:** **Confirmed**
- **Decision:** Route all dial drawing through a single deterministic `drawDialToContext()` function.
- **Rationale:** Eliminates visual divergence between the editor canvas, the 3D watch preview studio, downloaded images, and batch print sheets.
- **Alternatives Rejected:** Duplicate render logic across components (historically caused desynchronization bugs).

---

### 4. Debounced JSON Snapshot History Stack
- **Category:** **Confirmed**
- **Decision:** In-memory array of serialized JSON snapshots with a 400ms debounce.
- **Rationale:** Handles mixed state (primitives, arrays, image layers) with guaranteed immutability. 400ms debounce allows continuous dragging while recording clean undo checkpoints once interaction pauses. Image objects are sanitized to data URLs during capture and rehydrated upon undo/redo.
- **Alternatives Rejected:** Action/command pattern (excessive boilerplate for local tool).

---

### 5. Client-Side Color Extraction & Native EyeDropper Hybrid
- **Category:** **Confirmed**
- **Decision:** Combine native Chromium `window.EyeDropper` with a custom canvas-based extractor modal featuring pixel quantization and a 7x zoom loupe.
- **Rationale:** Native EyeDropper works only in Chromium browsers. The fallback modal works cross-browser (Firefox, Safari) and adds automatic dominant palette detection via 4-bit RGB bucket clustering.

---

### 6. Bidirectional RTL Arc Wrapping for Hebrew Text
- **Category:** **Confirmed**
- **Decision:** Auto-detect Hebrew Unicode (`/[\u0590-\u05FF]/`) and reverse character iteration order during clockwise radial arc distribution.
- **Rationale:** Standard canvas arc algorithms assume LTR glyph flow. Reversing Hebrew text ensures clockwise arcs read naturally from right to left.

---

## Non-Negotiable Constraints
1. **Zero External Server Dependency:** All features (rendering, color extraction, printing, saving) must run 100% offline. **[Confirmed]**
2. **True Physical Print Calibration (300 DPI):** Printed dials must measure exactly true to millimeter specifications when checked with digital calipers. **[Confirmed]**
3. **Strict Isolation:** Generated review artifacts must reside exclusively inside `AI_REVIEW_PACKAGE/`. **[Confirmed]**

---

## Open Architectural Questions
1. **Pointer Event Coalescing:** Layer dragging updates state on raw `pointermove` events without `requestAnimationFrame`. Does this cause micro-stutter on high-refresh displays? **[Open Question]**
2. **State Store Migration:** As features expand, should `App.jsx` prop drilling be refactored into a lightweight Zustand store or React Context? **[Open Question]**
3. **Bundle Size Reduction:** Can sample watch photos be re-encoded as WebP to shrink `index.html` below 1.5MB? **[Open Question]**

---

## Part 4 — Development Status, Roadmap & Known Issues

# Development Status, Roadmap & Known Issues

## Completed Milestones
- **Modular React Architecture:** Decomposed legacy monolithic prototype into clean components (`CanvasEditor.jsx`, `WatchPreview.jsx`, modular Sidebar panels).
- **Centralized Render Pipeline:** Unified dial drawing in `src/utils/dialRenderer.js` across workspace, preview, single download, and batch printing.
- **Dial Canvas Customization:** Dedicated `DialCanvasPanel` with spectrum color picker, direct hex input, 12 horological color presets, recent colors history, and base transparency toggle.
- **Color Extractor Tool:** `ColorExtractorModal` with real-time 7x pixel loupe, reticle, RGB/Hex readout, dominant palette auto-detection, and multi-source image support.
- **Curved Text with Hebrew RTL:** Circular arc typography with character-width measurement and automatic reverse mapping for Hebrew Unicode.
- **Physical 300 DPI Batch Printing:** Dynamic shelf-bin packing engine tiling arbitrary dial diameters onto photo paper (10x15cm, 13x18cm) with cutting rings and diameter labels.
- **3D Watch Preview:** Interactive watch mockup with movable hands (Hour, Minute, Second) and swappable case photos.
- **Persistence & History:** Project JSON save/load and debounced Undo/Redo stack with keyboard shortcuts (`Ctrl+Z`, `Ctrl+Y`).

---

## Technical Debt & Performance Considerations
1. **Prop Drilling in `App.jsx`:** ~15 state variables passed through multiple component levels. Refactoring to a lightweight Zustand store or React Context is recommended.
2. **Bundle Size (~3.3MB):** Inlined JPEG watch case photos and PNG index assets inflate single-file HTML size. Re-encoding assets to WebP will reduce bundle size by ~50%.
3. **Main-Thread Dome Refraction:** `applyDomeWarp()` computes per-pixel refraction on the CPU via `getImageData`. Offloading to Web Workers or WebGL would improve performance during rapid slider adjustments.
4. **Pointer Event Throttling:** Canvas dragging updates state on raw `pointermove` events; wrapping updates in `requestAnimationFrame` will eliminate redundant re-renders.

---

## Known Bugs & Edge Cases
1. **Fixed Second Hand in Preview:** Second hand rotation angle is currently static (`Math.PI * 0.85`) rather than driven by a live clock or user slider.
2. **Text Overlap on Tight Radii:** When arc radius is very small (< 60px) and font size is large (> 30px), characters can collide because baseline kerning does not account for trapezoidal bounding boxes.
3. **Undo Debounce Collision:** Pausing for 400ms mid-drag records an intermediate state in the undo history stack.

---

## Prioritized Next Steps
1. **Input Throttling:** Wrap canvas dragging and slider updates in `requestAnimationFrame`.
2. **State Cleanup:** Migrate `App.jsx` prop drilling to a centralized store.
3. **Live Clock Mode:** Add a live-running clock toggle to the watch preview studio.
4. **Vector SVG / DXF Export:** Generate vector paths for dial outlines, hour markers, and text for CNC laser cutting and engraving machines.
5. **Caliber Footprint Guides:** Overlay date-window cutouts and dial-foot positions for popular calibers (Seiko NH35, ETA 2824).

---

## Part 5 — User Experience & Product Design

# User Experience & Product Design

## Interface Layout & Visual Hierarchy

The application interface is styled as a horology studio workbench divided into three zones:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Header: Brand "K" | Undo/Redo | Save/Load | Preview Toggle | Print     │
├──────────────┬──────────────────────────────────────────┬──────────────┤
│ Left Sidebar │ Center Workspace                         │ Right Drawer │
│ (280px)      │ (Mahogany Wood-Grain Workbench)          │ (Overlay)    │
│              │                                          │              │
│ • Dial Canvas│  ┌────────────────────────────────────┐  │ • Watch Case │
│ • Composition│  │                                    │  │   Mockup     │
│ • Indices    │  │        [ Dial Canvas 500x500 ]     │  │ • Moveable   │
│ • Dome Glass │  │        Center Snapping Guides      │  │   Hands      │
│ • Output     │  │                                    │  │ • Hand Finish│
│ • Print Queue│  └────────────────────────────────────┘  │   Picker     │
├──────────────┴──────────────────────────────────────────┴──────────────┤
│ Footer: Engine: Modular React Vite | Resolution: 300 DPI               │
└────────────────────────────────────────────────────────────────────────┘
```

1. **Header Bar:** Brand glyph ("K"), studio title, Undo/Redo buttons (`Ctrl+Z` / `Ctrl+Y`), Save/Load JSON buttons, Preview studio toggle, and direct PNG/JPG / Print buttons.
2. **Left Control Sidebar (280px):** Six collapsible accordion panels:
   - *Dial Canvas:* Dial color picker, hex input, presets, recent history, transparency toggle.
   - *Composition:* Text & graphic layer stack, font upload, arc radius/angle/spacing controls.
   - *Indices:* 12-hour marker style presets (3D faceted gold/silver, batons, Arabic), 12h mask toggles, sizing.
   - *Dome Glass:* Optical crystal curvature, start radius, specular shine, and light angle.
   - *Output:* Millimeter diameter and photo paper selection (`13x18cm`, `10x15cm`).
   - *Print Queue:* Batch queue list, uploaded dial imports, individual diameter overrides.
3. **Center Interactive Workspace:** Mahogany wood-grain backdrop with centered 500x500 circular canvas, floating status badge (current hex + quick color extractor), and magnetic orange crosshair guidelines that latch moving elements to the exact center axis $(250, 250)$.
4. **Right Watch Preview Studio:** Overlaid virtual wrist preview displaying luxury watch cases (Rolex Oyster, steel, leather, wood), movable hands (Hour, Minute, Second), and metal finishes (Silver, Gold, Black, Rose Gold).

---

## Primary User Journeys

### 1. Designing a Custom Dial
1. User sets diameter (e.g. 28.5mm for Seiko NH35).
2. Expands **Dial Canvas**, selects Sunburst Silver (`#E2E8F0`).
3. Expands **Composition**, adds text *"AUTOMATIC"*, chooses font, checks "Curved Arc", and positions along 6 o'clock rim.
4. Uploads brand logo; magnetic center guidelines snap it to the 12 o'clock vertical axis.
5. Clicks "PNG Download" to obtain a print-ready 2000x2000 graphic.

### 2. Matching Colors from a Reference Image
1. User clicks "Extract Color from Image" in the Dial Canvas panel.
2. Modal displays the reference image with auto-detected 8-color dominant palette.
3. Moving the cursor over the image activates a 7x zoom pixel loupe with live RGB/Hex readout.
4. User clicks an accent pixel; live mini-dial preview updates immediately.
5. Clicks "Apply as Dial Color" to update the workbench dial instantly.

### 3. Calibrated Multi-Dial Batch Printing
1. Designer sets diameter to 28.5mm, clicks "Add Current" in Print Queue.
2. Adjusts diameter to 36.0mm for a second model, changes colorway, and clicks "Add Current".
3. Uploads 2 previously designed dials from disk.
4. Selects "13x18 cm" photo paper and clicks "PRINT".
5. Engine exports an auto-tiled 300 DPI sheet with circular cut rings and millimeter labels.

---

## Interaction Patterns & Tactile Feedback
- **Magnetic Snapping:** High-visibility dashed orange crosshairs appear when elements are within 8px of center.
- **Direct Manipulation:** Drag layers directly on the canvas; slider inputs allow precise fine-tuning.
- **Smart Loupe Positioning:** The Color Extractor loupe flips orientation when nearing viewport boundaries so pixels remain visible.
- **Responsive Stacking:** On mobile/tablet (< 1024px), sidebar stacks above the canvas with touch-action optimizations (`touch-action: none`).

---

## Part 6 — Source Manifest (Included vs. Omitted Files)

# Source Code Manifest

Total sanitized source files included: **31**

| Relative Path | Size (Bytes) | Est. Tokens | In Essential Bundle? |
| :--- | ---: | ---: | :---: |
| `.gitattributes` | 66 | ~16 | No |
| `.gitignore` | 60 | ~15 | No |
| `app.html` | 208,218 | ~52,052 | No |
| `entry.html` | 587 | ~146 | No |
| `index.html` | 3,341,801 | ~835,441 | No |
| `index.old.html` | 105,498 | ~26,372 | No |
| `package.json` | 676 | ~169 | Yes |
| `postcss.config.js` | 81 | ~20 | No |
| `README.md` | 187 | ~46 | No |
| `src/App.jsx` | 12,245 | ~3,061 | Yes |
| `src/components/CanvasEditor.jsx` | 6,353 | ~1,588 | Yes |
| `src/components/ColorExtractorModal.jsx` | 20,241 | ~5,059 | No |
| `src/components/Header.jsx` | 4,537 | ~1,134 | No |
| `src/components/Sidebar/CompositionPanel.jsx` | 14,896 | ~3,723 | No |
| `src/components/Sidebar/DialCanvasPanel.jsx` | 9,249 | ~2,312 | No |
| `src/components/Sidebar/DomePanel.jsx` | 4,955 | ~1,237 | No |
| `src/components/Sidebar/IndicesPanel.jsx` | 15,208 | ~3,799 | No |
| `src/components/Sidebar/OutputPanel.jsx` | 1,573 | ~393 | No |
| `src/components/Sidebar/PrintQueuePanel.jsx` | 6,519 | ~1,629 | No |
| `src/components/WatchPreview.jsx` | 14,066 | ~3,515 | No |
| `src/constants/presets.js` | 4,392 | ~1,066 | Yes |
| `src/index.css` | 1,424 | ~356 | No |
| `src/main.jsx` | 243 | ~60 | Yes |
| `src/utils/colorExtractor.js` | 4,165 | ~1,041 | No |
| `src/utils/dialRenderer.js` | 6,581 | ~1,645 | Yes |
| `src/utils/domeRefraction.js` | 4,230 | ~1,057 | No |
| `src/utils/history.js` | 2,501 | ~625 | No |
| `src/utils/printEngine.js` | 10,694 | ~2,673 | No |
| `src/utils/textArc.js` | 2,765 | ~691 | No |
| `tailwind.config.js` | 182 | ~45 | No |
| `vite.config.js` | 442 | ~110 | No |

---

## Part 7 — Architecturally Significant Source Code

### `package.json`
```json
{
  "name": "lechol-zman-dial-designer",
  "private": true,
  "version": "1.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build && node -e \"import('fs').then(fs => fs.copyFileSync('dist/entry.html', 'index.html'))\"",
    "preview": "vite preview"
  },
  "dependencies": {
    "lucide-react": "^0.344.0",
    "react": "^18.3.1",
    "react-dom": "^18.3.1"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "@types/react-dom": "^18.3.0",
    "@vitejs/plugin-react": "^4.3.1",
    "autoprefixer": "^10.4.19",
    "postcss": "^8.4.38",
    "tailwindcss": "^3.4.4",
    "vite": "^5.3.1",
    "vite-plugin-singlefile": "^2.3.3"
  }
}

```

### `src/App.jsx`
```jsx
import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header.jsx';
import { CanvasEditor } from './components/CanvasEditor.jsx';
import { WatchPreview } from './components/WatchPreview.jsx';
import { DialCanvasPanel } from './components/Sidebar/DialCanvasPanel.jsx';
import { CompositionPanel } from './components/Sidebar/CompositionPanel.jsx';
import { IndicesPanel } from './components/Sidebar/IndicesPanel.jsx';
import { DomePanel } from './components/Sidebar/DomePanel.jsx';
import { OutputPanel } from './components/Sidebar/OutputPanel.jsx';
import { PrintQueuePanel } from './components/Sidebar/PrintQueuePanel.jsx';
import { ColorExtractorModal } from './components/ColorExtractorModal.jsx';
import { DEFAULT_FONTS, PRESET_INDEX_STYLES } from './constants/presets.js';
import { downloadDialImage, generatePrintSheet } from './utils/printEngine.js';
import { drawDialToContext } from './utils/dialRenderer.js';
import { hydrateLayersImages } from './utils/history.js';

export function App() {
  const [layers, setLayers] = useState([]);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(null);
  const [customFonts, setCustomFonts] = useState([]);
  const [customMarkerImg, setCustomMarkerImg] = useState(null);
  const [loadedAssetImages, setLoadedAssetImages] = useState({});

  const [dialSettings, setDialSettings] = useState({
    indexStyle: 'ktm-3d-gold',
    indexColor: '#000000',
    dialColor: '#FFFFFF',
    indexSize: 35,
    indexWidth: 10,
    indexRadius: 195,
    showCenterDot: true,
    showShadow: false,
    diameterMm: 42,
    paperSize: '13x18',
    indexMask: Array(12).fill(true),
    rotateMarkers: true,
    transparentBg: false,
    domeEnabled: false,
    domeCurvature: 30,
    domeStartRadius: 0,
    domeGlassShine: 50,
    domeLightAngle: 315
  });

  const [showPreview, setShowPreview] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [previewConfig, setPreviewConfig] = useState({ x: 250, y: 345, r: 125, scale: 1.0 });

  // Sidebar collapse states
  const [canvasExpanded, setCanvasExpanded] = useState(false);
  const [compExpanded, setCompExpanded] = useState(false);
  const [indicesExpanded, setIndicesExpanded] = useState(false);
  const [domeExpanded, setDomeExpanded] = useState(false);

  // Color Extractor Modal state
  const [extractorModalOpen, setExtractorModalOpen] = useState(false);

  // Recent customized colors
  const [recentColors, setRecentColors] = useState(['#FF6600', '#B0B0B0', '#1E40AF', '#D4AF37', '#000000', '#FFFFFF']);

  // Batch print list queue
  const [batchList, setBatchList] = useState([]);

  // Undo / Redo History Stack
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryActionRef = useRef(false);
  const historyIndexRef = useRef(-1);
  historyIndexRef.current = historyIndex;
  const lastSavedSnapshotRef = useRef(null);
  const canvasRef = useRef(null);

  // Pre-load local asset images for image-based index presets
  useEffect(() => {
    const assetPresets = PRESET_INDEX_STYLES.filter(s => s.type === 'asset-image');
    const imagesMap = {};
    let loadedCount = 0;
    const total = assetPresets.length;
    if (total === 0) return;

    const onFinished = (key, img) => {
      if (img) imagesMap[key] = img;
      loadedCount++;
      if (loadedCount === total) setLoadedAssetImages({ ...imagesMap });
    };

    assetPresets.forEach(preset => {
      const img = new Image();
      img.onload  = () => onFinished(preset.src, img);
      img.onerror = () => onFinished(preset.src, null);
      img.src = preset.src;
    });
  }, []);

  // Record History State for Undo / Redo
  const saveStateToHistory = useCallback((currentLayers, currentDialSettings) => {
    if (isHistoryActionRef.current) {
      isHistoryActionRef.current = false;
      return;
    }
    const stateSnapshot = {
      layers: currentLayers.map(l => ({
        ...l,
        img: undefined,
        imgSrc: l.img ? l.img.src : l.imgSrc
      })),
      dialSettings: { ...currentDialSettings }
    };
    const serialized = JSON.stringify(stateSnapshot);
    if (serialized === lastSavedSnapshotRef.current) {
      return; // Identical state, skip duplicate snapshot!
    }
    lastSavedSnapshotRef.current = serialized;

    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndexRef.current + 1);
      const next = [...newHistory, stateSnapshot];
      // Cap at 30 snapshots to prevent memory bloat
      if (next.length > 30) {
        next.shift();
      }
      return next;
    });
    setHistoryIndex(prev => {
      const nextIdx = Math.min(prev + 1, 29);
      return nextIdx;
    });
  }, []);

  // Debounced History Saver
  useEffect(() => {
    if (isHistoryActionRef.current) {
      isHistoryActionRef.current = false;
      return;
    }
    const timer = setTimeout(() => {
      saveStateToHistory(layers, dialSettings);
    }, 400);
    return () => clearTimeout(timer);
  }, [layers, dialSettings, saveStateToHistory]);

  const undo = () => {
    if (historyIndex > 0) {
      isHistoryActionRef.current = true;
      const targetIndex = historyIndex - 1;
      const snapshot = history[targetIndex];
      restoreSnapshot(snapshot);
      setHistoryIndex(targetIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      isHistoryActionRef.current = true;
      const targetIndex = historyIndex + 1;
      const snapshot = history[targetIndex];
      restoreSnapshot(snapshot);
      setHistoryIndex(targetIndex);
    }
  };

  const restoreSnapshot = async (snapshot) => {
    const serialized = JSON.stringify(snapshot);
    lastSavedSnapshotRef.current = serialized;
    isHistoryActionRef.current = true;

    const restoredLayers = await hydrateLayersImages(snapshot.layers);
    setLayers(restoredLayers);
    setDialSettings(snapshot.dialSettings);
  };

  // Keyboard Shortcuts (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  const availableFonts = useMemo(() => [...DEFAULT_FONTS, ...customFonts], [customFonts]);

  // Reusable dial rendering callback for print & export
  const renderDial = useCallback((ctx, cx, cy, r, s) => {
    drawDialToContext(ctx, cx, cy, r, s, {
      layers,
      dialSettings,
      customMarkerImg,
      loadedAssetImages
    });
  }, [layers, dialSettings, customMarkerImg, loadedAssetImages]);

  const handleDownloadImage = () => {
    downloadDialImage(renderDial, dialSettings);
  };

  const handleGeneratePrint = () => {
    generatePrintSheet(renderDial, dialSettings, batchList);
  };

  const handleApplyDialColor = (color) => {
    setDialSettings(prev => ({
      ...prev,
      dialColor: color,
      transparentBg: false
    }));
    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toUpperCase() !== color.toUpperCase());
      return [color, ...filtered].slice(0, 8);
    });
  };

  const handleApplyIndexColor = (color) => {
    setDialSettings(prev => ({
      ...prev,
      indexColor: color
    }));
    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toUpperCase() !== color.toUpperCase());
      return [color, ...filtered].slice(0, 8);
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-800 no-select bg-[#1a0f0d]">
      <Header
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        downloadDialImage={handleDownloadImage}
        generatePrint={handleGeneratePrint}
        layers={layers}
        dialSettings={dialSettings}
        previewConfig={previewConfig}
        setLayers={setLayers}
        setDialSettings={setDialSettings}
        setPreviewConfig={setPreviewConfig}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        undo={undo}
        redo={redo}
      />

      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full lg:w-[280px] bg-white border-b lg:border-b-0 lg:border-r overflow-y-auto p-3 lg:p-4 flex flex-col scrollbar-thin shrink-0 shadow-xl z-10 h-auto lg:h-full">
          <DialCanvasPanel
            canvasExpanded={canvasExpanded}
            setCanvasExpanded={setCanvasExpanded}
            dialSettings={dialSettings}
            setDialSettings={setDialSettings}
            recentColors={recentColors}
            setRecentColors={setRecentColors}
            onOpenColorExtractor={() => setExtractorModalOpen(true)}
          />

          <CompositionPanel
            compExpanded={compExpanded}
            setCompExpanded={setCompExpanded}
            layers={layers}
            setLayers={setLayers}
            selectedLayerIndex={selectedLayerIndex}
            setSelectedLayerIndex={setSelectedLayerIndex}
            availableFonts={availableFonts}
            customFonts={customFonts}
            setCustomFonts={setCustomFonts}
          />

          <IndicesPanel
            indicesExpanded={indicesExpanded}
            setIndicesExpanded={setIndicesExpanded}
            dialSettings={dialSettings}
            setDialSettings={setDialSettings}
            customMarkerImg={customMarkerImg}
            setCustomMarkerImg={setCustomMarkerImg}
            recentColors={recentColors}
            setRecentColors={setRecentColors}
          />

          <DomePanel
            domeExpanded={domeExpanded}
            setDomeExpanded={setDomeExpanded}
            dialSettings={dialSettings}
            setDialSettings={setDialSettings}
          />

          <OutputPanel
            dialSettings={dialSettings}
            setDialSettings={setDialSettings}
          />

          <PrintQueuePanel
            batchList={batchList}
            setBatchList={setBatchList}
            canvasRef={canvasRef}
            dialSettings={dialSettings}
          />
        </aside>

        {/* Canvas Editor Workspace */}
        <CanvasEditor
          canvasRef={canvasRef}
          layers={layers}
          setLayers={setLayers}
          selectedLayerIndex={selectedLayerIndex}
          dialSettings={dialSettings}
          customMarkerImg={customMarkerImg}
          loadedAssetImages={loadedAssetImages}
          onOpenColorExtractor={() => setExtractorModalOpen(true)}
        />

        {/* Watch Model Preview Studio */}
        <WatchPreview
          showPreview={showPreview}
          previewPhoto={previewPhoto}
          setPreviewPhoto={setPreviewPhoto}
          previewConfig={previewConfig}
          setPreviewConfig={setPreviewConfig}
          layers={layers}
          dialSettings={dialSettings}
          customMarkerImg={customMarkerImg}
          loadedAssetImages={loadedAssetImages}
        />
      </main>

      {/* Color Extractor from Image Modal */}
      <ColorExtractorModal
        isOpen={extractorModalOpen}
        onClose={() => setExtractorModalOpen(false)}
        onApplyDialColor={handleApplyDialColor}
        onApplyIndexColor={handleApplyIndexColor}
        layers={layers}
        currentDialColor={dialSettings.dialColor || '#FFFFFF'}
        currentDialSettings={dialSettings}
      />

      <footer className="bg-slate-900 text-white px-6 py-1 lg:py-1.5 flex items-center justify-between text-[8px] lg:text-[9px] font-black tracking-widest uppercase italic shrink-0 h-8">
        <div className="flex items-center gap-6">
          <span className="text-orange-500 font-bold">Engine: Modular React Vite</span>
          <span>Resolution: 300 DPI</span>
        </div>
        <span className="opacity-40 tracking-tighter italic">Studio Precision Tool © 2026</span>
      </footer>
    </div>
  );
}

```

### `src/components/CanvasEditor.jsx`
```jsx
import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Upload, Pipette } from 'lucide-react';
import { drawDialToContext } from '../utils/dialRenderer.js';

export const CanvasEditor = ({ 
  canvasRef, 
  layers, 
  setLayers, 
  selectedLayerIndex, 
  dialSettings, 
  customMarkerImg,
  loadedAssetImages,
  onOpenColorExtractor
}) => {
  const isDraggingRef = useRef(false);
  const mainDragRef = useRef({ startMouseX: 0, startMouseY: 0, initialX: 0, initialY: 0 });
  const [snappedX, setSnappedX] = useState(false);
  const [snappedY, setSnappedY] = useState(false);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 500, 500);

    // Draw checkerboard inside dial circle boundary if transparent
    if (dialSettings.transparentBg) {
      ctx.save();
      ctx.beginPath();
      ctx.arc(250, 250, 220, 0, Math.PI * 2);
      ctx.clip();
      const checkSize = 12;
      for (let y = 30; y < 470; y += checkSize) {
        for (let x = 30; x < 470; x += checkSize) {
          ctx.fillStyle = ((Math.floor(x / checkSize) + Math.floor(y / checkSize)) % 2 === 0) ? '#f3f4f6' : '#e2e8f0';
          ctx.fillRect(x, y, checkSize, checkSize);
        }
      }
      ctx.restore();
    }

    drawDialToContext(ctx, 250, 250, 220, 1, {
      layers,
      dialSettings,
      customMarkerImg,
      loadedAssetImages
    });

    ctx.beginPath();
    ctx.arc(250, 250, 220, 0, Math.PI * 2);
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 2;
    ctx.stroke();

    // Magnet Center Snapping Visual Guidelines
    if (isDraggingRef.current) {
      ctx.save();
      ctx.lineWidth = 1.5;
      ctx.setLineDash([6, 6]);
      if (snappedX) {
        ctx.strokeStyle = '#ea580c';
        ctx.beginPath(); ctx.moveTo(250, 30); ctx.lineTo(250, 470); ctx.stroke();
      }
      if (snappedY) {
        ctx.strokeStyle = '#ea580c';
        ctx.beginPath(); ctx.moveTo(30, 250); ctx.lineTo(470, 250); ctx.stroke();
      }
      ctx.restore();
    }
  }, [layers, dialSettings, customMarkerImg, loadedAssetImages, snappedX, snappedY]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  const getCoords = (e) => {
    const rect = e.target.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const scaleX = 500 / rect.width;
    const scaleY = 500 / rect.height;
    return { x: (clientX - rect.left) * scaleX, y: (clientY - rect.top) * scaleY };
  };

  const handleInputStart = (e) => {
    const coords = getCoords(e);
    if (selectedLayerIndex !== null && layers[selectedLayerIndex]) {
      isDraggingRef.current = true;
      mainDragRef.current = { 
        startMouseX: coords.x, 
        startMouseY: coords.y, 
        initialX: layers[selectedLayerIndex].x, 
        initialY: layers[selectedLayerIndex].y 
      };
    }
  };

  const handleInputMove = (e) => {
    if (!isDraggingRef.current || selectedLayerIndex === null || !layers[selectedLayerIndex]) return;
    const coords = getCoords(e);
    const dx = coords.x - mainDragRef.current.startMouseX;
    const dy = coords.y - mainDragRef.current.startMouseY;
    let newX = mainDragRef.current.initialX + dx;
    let newY = mainDragRef.current.initialY + dy;

    // Magnet Center Snapping Logic (threshold 8px)
    const SNAP_THRESHOLD = 8;
    let isXSnap = false;
    let isYSnap = false;

    if (Math.abs(newX - 250) < SNAP_THRESHOLD) {
      newX = 250;
      isXSnap = true;
    }
    if (Math.abs(newY - 250) < SNAP_THRESHOLD) {
      newY = 250;
      isYSnap = true;
    }

    setSnappedX(isXSnap);
    setSnappedY(isYSnap);

    const newLayers = [...layers];
    newLayers[selectedLayerIndex] = {
      ...newLayers[selectedLayerIndex],
      x: newX,
      y: newY
    };
    setLayers(newLayers);
  };

  const handleInputEnd = () => {
    isDraggingRef.current = false;
    setSnappedX(false);
    setSnappedY(false);
  };

  const activeColor = dialSettings.transparentBg ? 'transparent' : (dialSettings.dialColor || '#ffffff');

  return (
    <div className="flex-1 relative flex items-center justify-center wood-grain p-2 lg:p-4 z-0 overflow-hidden">
      {/* Floating Canvas Dial Color Badge */}
      <div className="absolute top-3 right-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-2.5 py-1 rounded-full border border-white/20 text-white text-[9px] font-bold shadow-lg">
        <span 
          className="w-3.5 h-3.5 rounded-full border border-white/60 shadow-sm shrink-0"
          style={{ backgroundColor: activeColor }}
        />
        <span className="font-mono uppercase tracking-wider">
          {dialSettings.transparentBg ? 'TRANSPARENT' : (dialSettings.dialColor || '#FFFFFF')}
        </span>
        {onOpenColorExtractor && (
          <button
            onClick={onOpenColorExtractor}
            className="ml-1 p-0.5 rounded hover:bg-white/20 text-orange-400 hover:text-orange-300 transition-colors"
            title="Match color from image"
          >
            <Pipette size={11} />
          </button>
        )}
      </div>

      <div className="bg-white/10 backdrop-blur-sm p-4 lg:p-6 rounded-[40px] lg:rounded-[60px] canvas-shadow border-[4px] lg:border-[8px] border-white/20 relative flex-shrink-0 max-w-full">
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={500}
          onPointerDown={handleInputStart} 
          onPointerMove={handleInputMove} 
          onPointerUp={handleInputEnd} 
          onPointerLeave={handleInputEnd}
          className={`rounded-full shadow-2xl cursor-crosshair touch-none ${selectedLayerIndex !== null ? 'cursor-move' : ''} w-[280px] h-[280px] lg:w-[480px] lg:h-[480px]`}
          style={{ backgroundColor: activeColor }}
        />
        {layers.length === 0 && (
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-[0.25]">
            <Upload size={80} className="text-white lg:scale-[2]" />
            <p className="font-black mt-4 lg:mt-8 tracking-[0.5em] lg:tracking-[1em] text-sm lg:text-2xl text-center text-white">DESIGN DIAL</p>
          </div>
        )}
      </div>
    </div>
  );
};

```

### `src/constants/presets.js`
```javascript
// ── Image asset imports ───────────────────────────────────────────────────────
// Importing as ES modules tells Vite to process them.
// With assetsInlineLimit set very high they become base64 data URLs,
// which work correctly when the HTML file is opened directly (file:// protocol).

// Index / marker images
import goldIndiceUrl      from '../../assets/indices/gold_indice.png';
import goldLightIndiceUrl from '../../assets/indices/gold_indice_light.png';
import silverIndiceUrl    from '../../assets/indices/silver_indice.png';

// Watch model photos
import rolexSilverUrl   from '../../assets/models/Rolex_silver.jpg';
import goldBrownUrl     from '../../assets/models/Gold_Brown.jpg';
import silverBlackUrl   from '../../assets/models/silver_black.jpg';
import silverBrownUrl   from '../../assets/models/silver_brown.jpg';
import silverSilverUrl  from '../../assets/models/silver_silver.jpg';
import woodUrl          from '../../assets/models/wood.jpg';

export const DPI = 300;
export const MM_TO_INCH = 1 / 25.4;

export const PAPER_SIZES = [
  { id: '13x18', name: '13x18 cm', wMm: 130, hMm: 180 },
  { id: '10x15', name: '10x15 cm', wMm: 100, hMm: 150 }
];

export const DEFAULT_FONTS = [
  { id: 'Inter', name: 'Sans' },
  { id: 'Playfair Display', name: 'Serif' },
  { id: 'IBM Plex Sans Hebrew', name: 'Hebrew' },
  { id: 'Roboto Mono', name: 'Mono' }
];

export const PRESET_INDEX_STYLES = [
  { id: 'ktm-3d-gold',   name: 'Faceted Gold (3D)',   type: 'indices-3d',   baseColor: '#D4AF37', facetColor: '#FDF1B8', shadowColor: '#5C4410' },
  { id: 'ktm-3d-silver', name: 'Faceted Silver (3D)', type: 'indices-3d',   baseColor: '#B0B0B0', facetColor: '#FFFFFF', shadowColor: '#333333' },
  { id: 'ktm-batons',    name: 'Classic Batons',       type: 'indices',      shape: 'rect' },
  { id: 'small-circles', name: 'Small Circles',        type: 'circles' },
  { id: 'asset-gold-indice',       name: '🔶 Gold Indice (Asset)',       type: 'asset-image', src: goldIndiceUrl },
  { id: 'asset-gold-light-indice', name: '🔸 Gold Light Indice (Asset)', type: 'asset-image', src: goldLightIndiceUrl },
  { id: 'asset-silver-indice',     name: '⚪ Silver Indice (Asset)',      type: 'asset-image', src: silverIndiceUrl },
  { id: 'custom-image',  name: '📎 Custom Marker Image', type: 'custom' },
  { id: 'none',          name: 'None (Clean)',          type: 'none' },
  { id: 'classic-arabic', name: 'Arabic Numbers',      type: 'numbers', values: [12,1,2,3,4,5,6,7,8,9,10,11] }
];

export const PRESET_WATCH_MODELS = [
  { id: 'rolex-silver',  name: 'Rolex Silver',            src: rolexSilverUrl },
  { id: 'gold-brown',    name: 'Gold & Brown Leather',     src: goldBrownUrl },
  { id: 'silver-black',  name: 'Silver & Black Leather',   src: silverBlackUrl },
  { id: 'silver-brown',  name: 'Silver & Brown Leather',   src: silverBrownUrl },
  { id: 'silver-silver', name: 'Silver & Silver Steel',    src: silverSilverUrl },
  { id: 'wood-case',     name: 'Wood Case',                src: woodUrl }
];

export const COLORS = [
  { name: 'White',  value: '#FFFFFF' },
  { name: 'Black',  value: '#000000' },
  { name: 'Gold',   value: '#D4AF37' },
  { name: 'Silver', value: '#C0C0C0' },
  { name: 'Blue',   value: '#1E40AF' }
];

export const WATCH_HAND_FINISHES = [
  { id: 'silver',   name: 'Silver',    fill: '#D1D5DB', stroke: '#374151' },
  { id: 'gold',     name: 'Gold',      fill: '#F59E0B', stroke: '#78350F' },
  { id: 'black',    name: 'Black',     fill: '#1F2937', stroke: '#111827' },
  { id: 'rosegold', name: 'Rose Gold', fill: '#E0A96D', stroke: '#6A3814' }
];

// Classic & Luxury Watch Dial Color Presets
export const DIAL_COLOR_PRESETS = [
  { name: 'Pure White',       value: '#FFFFFF' },
  { name: 'Onyx Black',       value: '#0F172A' },
  { name: 'Sunburst Silver',  value: '#E2E8F0' },
  { name: 'Midnight Navy',    value: '#1E3A8A' },
  { name: 'Royal Blue',       value: '#1D4ED8' },
  { name: 'Racing Green',     value: '#14532D' },
  { name: 'Emerald Green',    value: '#047857' },
  { name: 'Champagne Gold',   value: '#D4AF37' },
  { name: 'Vintage Ivory',    value: '#FEF3C7' },
  { name: 'Salmon Copper',    value: '#E0A96D' },
  { name: 'Burgundy Oxblood', value: '#7F1D1D' },
  { name: 'Slate Graphite',   value: '#475569' }
];

```

### `src/main.jsx`
```jsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App.jsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

```

### `src/utils/dialRenderer.js`
```javascript
import { drawText } from './textArc.js';
import { applyDomeWarp } from './domeRefraction.js';
import { PRESET_INDEX_STYLES } from '../constants/presets.js';

export const drawIndices = (ctx, centerX, centerY, dialSettings, customMarkerImg, loadedAssetImages, scaleFactor = 1) => {
  const style = PRESET_INDEX_STYLES.find(s => s.id === dialSettings.indexStyle);
  if (!style || style.type === 'none') return;
  const drawRadius = dialSettings.indexRadius * scaleFactor;
  const baseLen = dialSettings.indexSize * scaleFactor;
  const baseWid = dialSettings.indexWidth * scaleFactor;

  ctx.save();
  if (dialSettings.showShadow) {
    ctx.shadowBlur = 4 * scaleFactor;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 2 * scaleFactor;
    ctx.shadowOffsetY = 2 * scaleFactor;
  }

  for (let i = 0; i < 12; i++) {
    if (!dialSettings.indexMask || !dialSettings.indexMask[i]) continue;
    const angle = (i * 30 - 90) * (Math.PI / 180);
    const x = centerX + Math.cos(angle) * drawRadius;
    const y = centerY + Math.sin(angle) * drawRadius;

    if (style.type === 'numbers') {
      ctx.fillStyle = dialSettings.indexColor || '#000000';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = `bold ${baseLen}px Inter, sans-serif`;
      ctx.fillText(style.values[i], x, y);
    } else if (style.type === 'indices-3d') {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + Math.PI / 2);
      const w = (i % 3 === 0 ? baseWid * 1.5 : baseWid);
      const h = (i % 3 === 0 ? baseLen : baseLen * 0.8);
      const rx = -w / 2;
      const ry = -drawRadius - h / 2 + 15 * scaleFactor;
      ctx.fillStyle = style.baseColor;
      ctx.fillRect(rx, ry, w, h);
      ctx.strokeStyle = style.facetColor;
      ctx.lineWidth = 1 * scaleFactor;
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx + w, ry); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(rx, ry); ctx.lineTo(rx, ry + h); ctx.stroke();
      ctx.strokeStyle = style.shadowColor; ctx.globalAlpha = 0.4;
      ctx.beginPath(); ctx.moveTo(rx + w * 0.8, ry); ctx.lineTo(rx + w * 0.8, ry + h); ctx.stroke();
      ctx.restore();
    } else if (style.type === 'circles') {
      ctx.beginPath();
      ctx.fillStyle = dialSettings.indexColor || '#000000';
      ctx.arc(x, y, baseWid / 2, 0, Math.PI * 2);
      ctx.fill();
    } else if (style.type === 'asset-image') {
      const assetImg = loadedAssetImages ? loadedAssetImages[style.src] : null;
      if (assetImg) {
        ctx.save();
        ctx.translate(x, y);
        if (dialSettings.rotateMarkers) {
          ctx.rotate(angle + Math.PI / 2);
        }
        const imgScale = (baseLen / 50) * scaleFactor;
        const w = assetImg.width * imgScale;
        const h = assetImg.height * imgScale;
        ctx.drawImage(assetImg, -w / 2, -h / 2, w, h);
        ctx.restore();
      }
    } else if (style.type === 'custom' && customMarkerImg) {
      ctx.save();
      ctx.translate(x, y);
      if (dialSettings.rotateMarkers) {
        ctx.rotate(angle + Math.PI / 2);
      }
      const imgScale = (baseLen / 50) * scaleFactor;
      const w = customMarkerImg.width * imgScale;
      const h = customMarkerImg.height * imgScale;
      ctx.drawImage(customMarkerImg, -w / 2, -h / 2, w, h);
      ctx.restore();
    } else {
      ctx.save();
      ctx.translate(centerX, centerY);
      ctx.rotate(angle + Math.PI / 2);
      const w = (i % 3 === 0 ? baseWid * 1.5 : baseWid);
      const h = (i % 3 === 0 ? baseLen : baseLen * 0.8);
      ctx.fillStyle = dialSettings.indexColor || '#000000';
      ctx.fillRect(-w / 2, -drawRadius - h / 2 + 15 * scaleFactor, w, h);
      ctx.restore();
    }
  }
  ctx.restore();
};

export const drawDialToContext = (ctx, centerX, centerY, radius, scale, {
  layers = [],
  dialSettings = {},
  customMarkerImg = null,
  loadedAssetImages = {}
} = {}) => {
  ctx.save();
  const size = Math.ceil(radius * 2);
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = size;
  tempCanvas.height = size;
  const tempCtx = tempCanvas.getContext('2d');
  
  const flatRadius = radius;
  const flatCenterX = size / 2;
  const flatCenterY = size / 2;
  
  tempCtx.save();
  tempCtx.beginPath();
  tempCtx.arc(flatCenterX, flatCenterY, flatRadius, 0, Math.PI * 2);
  
  // Fill dial base color (unless transparent)
  if (!dialSettings.transparentBg) {
    tempCtx.fillStyle = dialSettings.dialColor || '#ffffff';
    tempCtx.fill();
  }
  tempCtx.clip();
  
  layers.forEach((layer) => {
    if (layer.type === 'image' && layer.img) {
      const dw = layer.img.width * layer.scale * scale;
      const dh = layer.img.height * layer.scale * scale;
      tempCtx.save();
      tempCtx.translate(flatCenterX + (layer.x - 250) * scale, flatCenterY + (layer.y - 250) * scale);
      tempCtx.rotate((layer.rotation || 0) * Math.PI / 180);
      tempCtx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1.0;
      tempCtx.drawImage(layer.img, -dw / 2, -dh / 2, dw, dh);
      tempCtx.restore();
    } else if (layer.type === 'text') {
      drawText(tempCtx, layer, flatCenterX, flatCenterY, scale);
    }
  });
  tempCtx.restore();

  // Draw Indices & Markers
  drawIndices(tempCtx, flatCenterX, flatCenterY, dialSettings, customMarkerImg, loadedAssetImages, scale);
  
  // Center Dot
  if (dialSettings.showCenterDot) {
    const style = PRESET_INDEX_STYLES.find(s => s.id === dialSettings.indexStyle);
    const dotColor = (style && style.baseColor) ? style.baseColor : (dialSettings.indexColor || '#000000');
    tempCtx.save();
    tempCtx.shadowBlur = 3 * scale;
    tempCtx.shadowColor = 'rgba(0,0,0,0.5)';
    tempCtx.shadowOffsetX = 1 * scale;
    tempCtx.shadowOffsetY = 1 * scale;
    tempCtx.beginPath();
    tempCtx.arc(flatCenterX, flatCenterY, 4.5 * scale, 0, Math.PI * 2);
    tempCtx.fillStyle = dotColor;
    tempCtx.fill();
    tempCtx.shadowBlur = 0;
    tempCtx.strokeStyle = '#fff';
    tempCtx.lineWidth = 1 * scale;
    tempCtx.stroke();
    tempCtx.restore();
  }
  
  // 3D Dome Glass Refraction
  if (dialSettings.domeEnabled) {
    const warpedCanvas = document.createElement('canvas');
    warpedCanvas.width = size;
    warpedCanvas.height = size;
    const warpedCtx = warpedCanvas.getContext('2d');
    
    applyDomeWarp(tempCanvas, warpedCtx, flatCenterX, flatCenterY, flatRadius, dialSettings);
    ctx.drawImage(warpedCanvas, centerX - flatCenterX, centerY - flatCenterY);
  } else {
    ctx.drawImage(tempCanvas, centerX - flatCenterX, centerY - flatCenterY);
  }
  ctx.restore();
};


```
