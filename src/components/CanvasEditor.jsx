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
