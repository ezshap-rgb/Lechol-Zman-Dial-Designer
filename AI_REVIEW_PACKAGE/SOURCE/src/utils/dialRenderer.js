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

