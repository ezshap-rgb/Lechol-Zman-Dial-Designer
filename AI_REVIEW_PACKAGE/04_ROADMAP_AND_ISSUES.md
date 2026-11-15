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
