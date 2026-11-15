import { PAPER_SIZES, MM_TO_INCH, DPI } from '../constants/presets.js';

/**
 * Injects a PNG pHYs chunk into a canvas PNG Blob so viewers/printers recognize
 * true 300 DPI physical resolution instead of defaulting to 96 DPI.
 * 300 DPI = 11,811 pixels per meter (0x00002E23).
 */
export const inject300DpiPng = (canvas) => {
  return new Promise((resolve) => {
    canvas.toBlob(async (blob) => {
      if (!blob) {
        resolve(canvas.toDataURL('image/png'));
        return;
      }
      try {
        const arrayBuffer = await blob.arrayBuffer();
        const bytes = new Uint8Array(arrayBuffer);

        // Validate PNG signature [0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A]
        if (bytes[0] !== 0x89 || bytes[1] !== 0x50 || bytes[2] !== 0x4E || bytes[3] !== 0x47) {
          resolve(URL.createObjectURL(blob));
          return;
        }

        // Check if pHYs chunk already exists
        for (let i = 8; i < bytes.length - 8; i++) {
          if (bytes[i] === 0x70 && bytes[i + 1] === 0x48 && bytes[i + 2] === 0x59 && bytes[i + 3] === 0x73) {
            resolve(URL.createObjectURL(blob));
            return;
          }
        }

        // 300 DPI = 11811 px/m. CRC for 'pHYs' + 9 data bytes = 0x78A53F76
        const physChunk = new Uint8Array([
          0x00, 0x00, 0x00, 0x09, // 9 bytes data length
          0x70, 0x48, 0x59, 0x73, // 'pHYs'
          0x00, 0x00, 0x2E, 0x23, // 11811 px/m X (300 DPI)
          0x00, 0x00, 0x2E, 0x23, // 11811 px/m Y (300 DPI)
          0x01,                   // Unit: meter
          0x78, 0xA5, 0x3F, 0x76  // Precomputed CRC-32
        ]);

        // Insert pHYs immediately after IHDR chunk (offset 33)
        const newBuf = new Uint8Array(bytes.length + physChunk.length);
        newBuf.set(bytes.subarray(0, 33), 0);
        newBuf.set(physChunk, 33);
        newBuf.set(bytes.subarray(33), 33 + physChunk.length);

        const taggedBlob = new Blob([newBuf], { type: 'image/png' });
        resolve(URL.createObjectURL(taggedBlob));
      } catch (err) {
        console.warn('Could not inject 300 DPI metadata:', err);
        resolve(URL.createObjectURL(blob));
      }
    }, 'image/png');
  });
};

/**
 * Draws an exact 50.0 mm calibration test ruler at the bottom of the print sheet.
 * The watchmaker can measure this with digital calipers to verify 100% 1:1 print scaling.
 */
const drawCalibrationBar = (pCtx, paperWidthPx, paperHeightPx) => {
  const barLengthMm = 50.0;
  const barLengthPx = (barLengthMm * MM_TO_INCH) * DPI; // exactly 590.55 px
  const barHeightPx = 28;
  const xStart = Math.round((paperWidthPx - barLengthPx) / 2);
  const yStart = paperHeightPx - 55;

  pCtx.save();

  // Background frame
  pCtx.fillStyle = '#F8FAFC';
  pCtx.fillRect(xStart - 12, yStart - 22, barLengthPx + 24, barHeightPx + 40);
  pCtx.strokeStyle = '#94A3B8';
  pCtx.lineWidth = 1;
  pCtx.strokeRect(xStart - 12, yStart - 22, barLengthPx + 24, barHeightPx + 40);

  // Calibration Title
  pCtx.fillStyle = '#0F172A';
  pCtx.font = 'bold 15px Inter, sans-serif';
  pCtx.textAlign = 'center';
  pCtx.textBaseline = 'bottom';
  pCtx.fillText('CALIBRATION TEST BAR: EXACTLY 50.0 mm — VERIFY AT 100% SCALE (NO "FIT TO PAGE")', paperWidthPx / 2, yStart - 4);

  // Main baseline
  pCtx.strokeStyle = '#0F172A';
  pCtx.lineWidth = 2;
  pCtx.beginPath();
  pCtx.moveTo(xStart, yStart + 15);
  pCtx.lineTo(xStart + barLengthPx, yStart + 15);
  pCtx.stroke();

  // Heavy end stop brackets
  pCtx.lineWidth = 2.5;
  pCtx.beginPath();
  pCtx.moveTo(xStart, yStart + 4);
  pCtx.lineTo(xStart, yStart + 26);
  pCtx.moveTo(xStart + barLengthPx, yStart + 4);
  pCtx.lineTo(xStart + barLengthPx, yStart + 26);
  pCtx.stroke();

  // Millimeter ticks
  pCtx.lineWidth = 1;
  for (let mm = 0; mm <= 50; mm++) {
    const tx = xStart + (mm * MM_TO_INCH * DPI);
    pCtx.beginPath();
    if (mm % 10 === 0) {
      pCtx.moveTo(tx, yStart + 5);
      pCtx.lineTo(tx, yStart + 25);
      pCtx.stroke();

      pCtx.fillStyle = '#0F172A';
      pCtx.font = 'bold 12px monospace';
      pCtx.textAlign = 'center';
      pCtx.textBaseline = 'top';
      pCtx.fillText(`${mm}`, tx, yStart + 28);
    } else if (mm % 5 === 0) {
      pCtx.moveTo(tx, yStart + 8);
      pCtx.lineTo(tx, yStart + 22);
      pCtx.stroke();
    } else {
      pCtx.moveTo(tx, yStart + 11);
      pCtx.lineTo(tx, yStart + 19);
      pCtx.stroke();
    }
  }

  pCtx.restore();
};

export const downloadDialImage = async (drawDialToContext, dialSettings) => {
  const imgCanvas = document.createElement('canvas'); 
  imgCanvas.width = 2000; 
  imgCanvas.height = 2000;
  const iCtx = imgCanvas.getContext('2d'); 

  if (!dialSettings.transparentBg) {
    iCtx.fillStyle = '#FFFFFF';
    iCtx.fillRect(0, 0, 2000, 2000);
  }

  iCtx.save(); 
  iCtx.beginPath(); 
  iCtx.arc(1000, 1000, 880, 0, Math.PI * 2); 
  iCtx.clip();
  
  drawDialToContext(iCtx, 1000, 1000, 880, 4); 
  iCtx.restore();
  
  const link = document.createElement('a'); 
  if (dialSettings.transparentBg) {
    link.download = `dial_${dialSettings.diameterMm}mm_300dpi.png`; 
    link.href = await inject300DpiPng(imgCanvas);
  } else {
    link.download = `dial_${dialSettings.diameterMm}mm.jpg`; 
    link.href = imgCanvas.toDataURL('image/jpeg', 0.98);
  }
  link.click();
};

export const generatePrintSheet = async (drawDialToContext, dialSettings, batchList = []) => {
  const paper = PAPER_SIZES.find(p => p.id === dialSettings.paperSize) || PAPER_SIZES[0];
  const paperWidthPx = Math.round((paper.wMm * MM_TO_INCH) * DPI);
  const paperHeightPx = Math.round((paper.hMm * MM_TO_INCH) * DPI);
  
  // Reserve 70px at bottom for 50mm calibration test ruler
  const usableHeightPx = paperHeightPx - 75;

  const printCanvas = document.createElement('canvas'); 
  printCanvas.width = paperWidthPx; 
  printCanvas.height = paperHeightPx;
  const pCtx = printCanvas.getContext('2d'); 
  pCtx.fillStyle = '#FFFFFF'; 
  pCtx.fillRect(0, 0, paperWidthPx, paperHeightPx);

  let itemsToPrint = [];

  if (batchList.length > 0) {
    // Expand queue items by their explicit quantity count (default 1)
    const expandedQueue = [];
    batchList.forEach(item => {
      const qty = Math.max(1, parseInt(item.quantity, 10) || 1);
      for (let i = 0; i < qty; i++) {
        expandedQueue.push(item);
      }
    });

    let currentX = 0;
    let currentY = 0;
    let currentRowHeight = 0;
    let skippedOversized = 0;

    for (let idx = 0; idx < expandedQueue.length; idx++) {
      const batchItem = expandedQueue[idx];
      const dMm = parseFloat(batchItem.diameterMm) || parseFloat(dialSettings.diameterMm) || 42;
      const neededSizePx = (dMm + 5) * MM_TO_INCH * DPI;

      // Guard: Dial exceeds entire paper width
      if (neededSizePx > paperWidthPx) {
        console.warn(`Dial "${batchItem.name}" (${dMm}mm) exceeds paper width (${paper.wMm}mm) and cannot fit on sheet.`);
        skippedOversized++;
        continue;
      }

      // Wrap row if needed
      if (currentX + neededSizePx > paperWidthPx) {
        currentX = 0;
        currentY += currentRowHeight;
        currentRowHeight = 0;
      }

      // Check vertical sheet capacity
      if (currentY + neededSizePx > usableHeightPx) {
        alert(`Notice: Print sheet capacity reached. ${expandedQueue.length - idx} item(s) could not fit on a single ${paper.name} page.`);
        break;
      }

      itemsToPrint.push({
        type: 'uploaded',
        img: batchItem.img,
        diameterMm: dMm,
        name: batchItem.name,
        x: currentX,
        y: currentY,
        sizePx: neededSizePx
      });

      currentX += neededSizePx;
      currentRowHeight = Math.max(currentRowHeight, neededSizePx);
    }

    if (skippedOversized > 0) {
      alert(`Warning: ${skippedOversized} dial(s) exceeded the ${paper.name} paper width and were skipped.`);
    }
  } else {
    // Queue is empty: tile the single current design safely across the sheet
    const singleSizeMm = parseFloat(dialSettings.diameterMm) || 42;
    const neededSizePx = (singleSizeMm + 5) * MM_TO_INCH * DPI;

    if (neededSizePx > paperWidthPx) {
      alert(`Error: Current dial (${singleSizeMm}mm) exceeds the selected paper width (${paper.wMm}mm). Please select a larger paper size.`);
      return;
    }

    let currentX = 0;
    let currentY = 0;
    let currentRowHeight = 0;
    let safetyCounter = 200;

    while (currentY + neededSizePx <= usableHeightPx && safetyCounter > 0) {
      safetyCounter--;

      if (currentX + neededSizePx > paperWidthPx) {
        currentX = 0;
        currentY += currentRowHeight;
        currentRowHeight = 0;
        if (currentY + neededSizePx > usableHeightPx) break;
      }

      itemsToPrint.push({
        type: 'current',
        diameterMm: singleSizeMm,
        name: 'Current Design',
        x: currentX,
        y: currentY,
        sizePx: neededSizePx
      });

      currentX += neededSizePx;
      currentRowHeight = Math.max(currentRowHeight, neededSizePx);
    }
  }

  // Draw all packed dials
  itemsToPrint.forEach((item) => {
    const dMm = item.diameterMm;
    const dialRadiusPx = (dMm * MM_TO_INCH * DPI) / 2;
    const neededSizePx = item.sizePx;

    const cx = item.x + neededSizePx / 2;
    const cy = item.y + neededSizePx / 2;

    pCtx.save();
    pCtx.translate(cx, cy);
    pCtx.beginPath();
    pCtx.arc(0, 0, dialRadiusPx, 0, Math.PI * 2);
    pCtx.clip();

    if (item.type === 'uploaded' && item.img) {
      let drawSize = dialRadiusPx * 2;
      if (item.img.width === item.img.height) {
        drawSize = (dialRadiusPx * 2) * (2000 / 1760);
      }
      pCtx.drawImage(item.img, -drawSize / 2, -drawSize / 2, drawSize, drawSize);
    } else {
      const scale = (dialRadiusPx * 2) / 440;
      drawDialToContext(pCtx, 0, 0, dialRadiusPx, scale);
    }
    pCtx.restore();

    // High-precision cutting boundary ring (light gray 1px)
    pCtx.beginPath();
    pCtx.arc(cx, cy, dialRadiusPx, 0, Math.PI * 2);
    pCtx.strokeStyle = '#CBD5E1';
    pCtx.lineWidth = 1;
    pCtx.stroke();

    // Diameter label
    pCtx.save();
    pCtx.font = 'bold 20px Inter, sans-serif'; 
    pCtx.fillStyle = '#64748B';
    pCtx.textAlign = 'center';
    pCtx.textBaseline = 'top';
    pCtx.fillText(`${dMm} mm`, cx, cy + dialRadiusPx + 4);
    pCtx.restore();
  });

  // Draw 50.0 mm calibration test ruler at bottom of sheet
  drawCalibrationBar(pCtx, paperWidthPx, paperHeightPx);

  // Export 300 DPI tagged PNG
  const taggedUrl = await inject300DpiPng(printCanvas);
  const link = document.createElement('a'); 
  link.download = `dial_sheet_${paper.wMm}x${paper.hMm}mm_300dpi.png`; 
  link.href = taggedUrl; 
  link.click();
};
