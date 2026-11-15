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
