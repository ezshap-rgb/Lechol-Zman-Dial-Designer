import { PAPER_SIZES, MM_TO_INCH, DPI } from '../constants/presets.js';

export const downloadDialImage = (drawDialToContext, dialSettings) => {
  const imgCanvas = document.createElement('canvas'); 
  imgCanvas.width = 2000; 
  imgCanvas.height = 2000;
  const iCtx = imgCanvas.getContext('2d'); 
  iCtx.save(); 
  iCtx.beginPath(); 
  iCtx.arc(1000, 1000, 880, 0, Math.PI * 2); 
  iCtx.clip();
  
  drawDialToContext(iCtx, 1000, 1000, 880, 4); 
  iCtx.restore();
  
  const link = document.createElement('a'); 
  if (dialSettings.transparentBg) {
    link.download = `dial_${dialSettings.diameterMm}mm.png`; 
    link.href = imgCanvas.toDataURL('image/png');
  } else {
    link.download = `dial_${dialSettings.diameterMm}mm.jpg`; 
    link.href = imgCanvas.toDataURL('image/jpeg', 0.95);
  }
  link.click();
};

export const generatePrintSheet = (drawDialToContext, dialSettings, batchList) => {
  const paper = PAPER_SIZES.find(p => p.id === dialSettings.paperSize) || PAPER_SIZES[0];
  const paperWidthPx = Math.round((paper.wMm * MM_TO_INCH) * DPI);
  const paperHeightPx = Math.round((paper.hMm * MM_TO_INCH) * DPI);
  
  const printCanvas = document.createElement('canvas'); 
  printCanvas.width = paperWidthPx; 
  printCanvas.height = paperHeightPx;
  const pCtx = printCanvas.getContext('2d'); 
  pCtx.fillStyle = '#FFFFFF'; 
  pCtx.fillRect(0, 0, paperWidthPx, paperHeightPx);

  let itemsToPrint = [];
  if (batchList.length > 0) {
    let batchIndex = 0;
    let currentX = 0;
    let currentY = 0;
    let currentRowHeight = 0;
    let safetyLimit = 500; 

    while (currentY < paperHeightPx && safetyLimit > 0) {
      safetyLimit--;
      const batchItem = batchList[batchIndex % batchList.length];
      const dMm = parseFloat(batchItem.diameterMm) || parseFloat(dialSettings.diameterMm);
      const neededSizePx = (dMm + 5) * MM_TO_INCH * DPI; 

      if (currentX + neededSizePx > paperWidthPx) {
        currentX = 0;
        currentY += currentRowHeight;
        currentRowHeight = 0;
      }

      if (currentY + neededSizePx > paperHeightPx) {
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
      batchIndex++;
    }
  } else {
    const singleSizeMm = parseFloat(dialSettings.diameterMm);
    const neededSizePx = (singleSizeMm + 5) * MM_TO_INCH * DPI;
    let currentX = 0;
    let currentY = 0;
    let currentRowHeight = 0;
    
    while (currentY < paperHeightPx) {
      if (currentX + neededSizePx > paperWidthPx) {
        currentX = 0;
        currentY += currentRowHeight;
        currentRowHeight = 0;
      }
      if (currentY + neededSizePx > paperHeightPx) {
        break;
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

    if (item.type === 'uploaded') {
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

    // Cutting boundary ring
    pCtx.beginPath();
    pCtx.arc(cx, cy, dialRadiusPx, 0, Math.PI * 2);
    pCtx.strokeStyle = '#CCCCCC';
    pCtx.lineWidth = 1;
    pCtx.stroke();

    // Diameter label
    pCtx.save();
    pCtx.font = 'bold 22px Inter, sans-serif'; 
    pCtx.fillStyle = '#94a3b8';
    pCtx.textAlign = 'center';
    pCtx.textBaseline = 'top';
    pCtx.fillText(`${dMm} mm`, cx, cy + dialRadiusPx + 4);
    pCtx.restore();
  });

  const link = document.createElement('a'); 
  link.download = `dial_sheet_${dialSettings.diameterMm}mm_${paper.wMm}x${paper.hMm}mm.png`; 
  link.href = printCanvas.toDataURL('image/png'); 
  link.click();
};
