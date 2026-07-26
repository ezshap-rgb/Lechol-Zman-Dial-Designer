import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Upload } from 'lucide-react';
import { drawText } from '../utils/textArc.js';
import { applyDomeWarp } from '../utils/domeRefraction.js';
import { PRESET_INDEX_STYLES } from '../constants/presets.js';

export const CanvasEditor = ({ 
  canvasRef, 
  layers, 
  setLayers, 
  selectedLayerIndex, 
  dialSettings, 
  customMarkerImg,
  loadedAssetImages
}) => {
  const isDraggingRef = useRef(false);
  const mainDragRef = useRef({ startMouseX: 0, startMouseY: 0, initialX: 0, initialY: 0 });
  const [snappedX, setSnappedX] = useState(false);
  const [snappedY, setSnappedY] = useState(false);

  const drawIndices = useCallback((ctx, centerX, centerY, scaleFactor = 1) => {
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
      if (!dialSettings.indexMask[i]) continue;
      const angle = (i * 30 - 90) * (Math.PI / 180);
      const x = centerX + Math.cos(angle) * drawRadius;
      const y = centerY + Math.sin(angle) * drawRadius;

      if (style.type === 'numbers') {
        ctx.fillStyle = dialSettings.indexColor;
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
        ctx.fillStyle = dialSettings.indexColor;
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
        ctx.fillStyle = dialSettings.indexColor;
        ctx.fillRect(-w/2, -drawRadius - h/2 + 15 * scaleFactor, w, h);
        ctx.restore();
      }
    }
    ctx.restore();
  }, [dialSettings, customMarkerImg, loadedAssetImages]);

  const drawDialToContext = useCallback((ctx, centerX, centerY, radius, scale) => {
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
    tempCtx.beginPath(); tempCtx.arc(flatCenterX, flatCenterY, flatRadius, 0, Math.PI * 2);
    
    if (!dialSettings.transparentBg) {
      tempCtx.fillStyle = '#fff'; tempCtx.fill();
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
    drawIndices(tempCtx, flatCenterX, flatCenterY, scale);
    
    if (dialSettings.showCenterDot) {
      const style = PRESET_INDEX_STYLES.find(s => s.id === dialSettings.indexStyle);
      const dotColor = (style && style.baseColor) ? style.baseColor : dialSettings.indexColor;
      tempCtx.save();
      tempCtx.shadowBlur = 3 * scale; tempCtx.shadowColor = 'rgba(0,0,0,0.5)'; tempCtx.shadowOffsetX = 1 * scale; tempCtx.shadowOffsetY = 1 * scale;
      tempCtx.beginPath(); tempCtx.arc(flatCenterX, flatCenterY, 4.5 * scale, 0, Math.PI * 2);
      tempCtx.fillStyle = dotColor; tempCtx.fill();
      tempCtx.shadowBlur = 0; tempCtx.strokeStyle = '#fff'; tempCtx.lineWidth = 1 * scale; tempCtx.stroke();
      tempCtx.restore();
    }
    
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
  }, [layers, dialSettings, drawIndices]);

  const drawCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 500, 500);

    if (dialSettings.transparentBg) {
      ctx.save();
      ctx.beginPath(); ctx.arc(250, 250, 220, 0, Math.PI * 2);
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

    drawDialToContext(ctx, 250, 250, 220, 1);
    ctx.beginPath(); ctx.arc(250, 250, 220, 0, Math.PI * 2);
    ctx.strokeStyle = '#cbd5e1'; ctx.lineWidth = 2; ctx.stroke();

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
  }, [layers, dialSettings, drawDialToContext, snappedX, snappedY]);

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

  return (
    <div className="flex-1 relative flex items-center justify-center wood-grain p-2 lg:p-4 z-0 overflow-hidden">
      <div className="bg-white/10 backdrop-blur-sm p-4 lg:p-6 rounded-[40px] lg:rounded-[60px] canvas-shadow border-[4px] lg:border-[8px] border-white/20 relative flex-shrink-0 max-w-full">
        <canvas 
          ref={canvasRef} 
          width={500} 
          height={500}
          onPointerDown={handleInputStart} 
          onPointerMove={handleInputMove} 
          onPointerUp={handleInputEnd} 
          onPointerLeave={handleInputEnd}
          className={`rounded-full bg-white shadow-2xl cursor-crosshair touch-none ${selectedLayerIndex !== null ? 'cursor-move' : ''} w-[280px] h-[280px] lg:w-[480px] lg:h-[480px]`}
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
