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
