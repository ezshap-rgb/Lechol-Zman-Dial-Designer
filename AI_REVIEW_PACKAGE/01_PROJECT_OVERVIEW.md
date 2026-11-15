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
