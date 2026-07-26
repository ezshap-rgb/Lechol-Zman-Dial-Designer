import React, { useRef, useEffect, useCallback, useState } from 'react';
import { Maximize, Image as ImageIcon, Clock } from 'lucide-react';
import { PRESET_WATCH_MODELS, WATCH_HAND_FINISHES } from '../constants/presets.js';
import { drawText } from '../utils/textArc.js';
import { applyDomeWarp } from '../utils/domeRefraction.js';

export const WatchPreview = ({ 
  showPreview, 
  previewPhoto, 
  setPreviewPhoto, 
  previewConfig, 
  setPreviewConfig, 
  layers, 
  dialSettings, 
  customMarkerImg,
  loadedAssetImages
}) => {
  const previewCanvasRef = useRef(null);
  const isDraggingFaceRef = useRef(false);
  const previewDragRef = useRef({ startMouseX: 0, startMouseY: 0, startFaceX: 0, startFaceY: 0 });

  // Custom Watch Hands State
  const [selectedModelId, setSelectedModelId] = useState('rolex-silver');
  const [handFinishId, setHandFinishId] = useState('silver');
  const [timeMinutes, setTimeMinutes] = useState(610); // 10:10 default
  const [secondHandColor, setSecondHandColor] = useState('#D32F2F');
  const [showHands, setShowHands] = useState(true);

  // Auto load default watch model image on mount
  useEffect(() => {
    const selectedModel = PRESET_WATCH_MODELS.find(m => m.id === selectedModelId);
    if (selectedModel) {
      const img = new Image();
      img.onload = () => setPreviewPhoto(img);
      img.src = selectedModel.src;
    }
  }, [selectedModelId, setPreviewPhoto]);

  const handleModelChange = (modelId) => {
    setSelectedModelId(modelId);
    if (modelId === 'custom') return;
    const selectedModel = PRESET_WATCH_MODELS.find(m => m.id === modelId);
    if (selectedModel) {
      const img = new Image();
      img.onload = () => setPreviewPhoto(img);
      img.src = selectedModel.src;
    }
  };

  const handleModelPhotoUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setPreviewPhoto(img);
        setSelectedModelId('custom');
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const drawWatchPreview = useCallback(() => {
    if (!showPreview || !previewCanvasRef.current) return;
    const canvas = previewCanvasRef.current;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    if (previewPhoto) {
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.scale(previewConfig.scale, previewConfig.scale);
      const imgRatio = previewPhoto.width / previewPhoto.height;
      const dWidth = canvas.width;
      const dHeight = canvas.width / imgRatio;
      ctx.drawImage(previewPhoto, -dWidth / 2, -dHeight / 2, dWidth, dHeight);
      ctx.restore();
    } else {
      ctx.fillStyle = '#f8fafc';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = '#94a3b8';
      ctx.textAlign = 'center';
      ctx.font = 'bold 11px Inter';
      ctx.fillText(`Select or upload watch model photo`, canvas.width / 2, canvas.height / 2);
    }

    // Render Dial on top of Watch Preview Case
    const size = Math.ceil(previewConfig.r * 2);
    const tempCanvas = document.createElement('canvas');
    tempCanvas.width = size;
    tempCanvas.height = size;
    const tempCtx = tempCanvas.getContext('2d');
    const scale = previewConfig.r / 220;

    tempCtx.save();
    tempCtx.beginPath();
    tempCtx.arc(size / 2, size / 2, previewConfig.r, 0, Math.PI * 2);
    if (!dialSettings.transparentBg) {
      tempCtx.fillStyle = '#fff';
      tempCtx.fill();
    }
    tempCtx.clip();

    layers.forEach((layer) => {
      if (layer.type === 'image' && layer.img) {
        const dw = layer.img.width * layer.scale * scale;
        const dh = layer.img.height * layer.scale * scale;
        tempCtx.save();
        tempCtx.translate(size / 2 + (layer.x - 250) * scale, size / 2 + (layer.y - 250) * scale);
        tempCtx.rotate((layer.rotation || 0) * Math.PI / 180);
        tempCtx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1.0;
        tempCtx.drawImage(layer.img, -dw / 2, -dh / 2, dw, dh);
        tempCtx.restore();
      } else if (layer.type === 'text') {
        drawText(tempCtx, layer, size / 2, size / 2, scale);
      }
    });
    tempCtx.restore();

    ctx.drawImage(tempCanvas, previewConfig.x - size / 2, previewConfig.y - size / 2);

    // Watch Hands Custom Rendering Engine
    if (showHands) {
      const handFinish = WATCH_HAND_FINISHES.find(h => h.id === handFinishId) || WATCH_HAND_FINISHES[0];
      const hourAngle = ((timeMinutes % 720) / 720) * Math.PI * 2 - Math.PI / 2;
      const minuteAngle = ((timeMinutes % 60) / 60) * Math.PI * 2 - Math.PI / 2;

      // Hour Hand
      ctx.save();
      ctx.translate(previewConfig.x, previewConfig.y);
      ctx.rotate(hourAngle + Math.PI / 2);
      ctx.fillStyle = handFinish.fill;
      ctx.strokeStyle = handFinish.stroke;
      ctx.lineWidth = 1.5;
      const hLen = previewConfig.r * 0.5;
      const hWid = 10;
      ctx.beginPath();
      ctx.moveTo(-hWid / 2, 0);
      ctx.lineTo(0, -hLen);
      ctx.lineTo(hWid / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Minute Hand
      ctx.save();
      ctx.translate(previewConfig.x, previewConfig.y);
      ctx.rotate(minuteAngle + Math.PI / 2);
      ctx.fillStyle = handFinish.fill;
      ctx.strokeStyle = handFinish.stroke;
      ctx.lineWidth = 1.5;
      const mLen = previewConfig.r * 0.8;
      const mWid = 6;
      ctx.beginPath();
      ctx.moveTo(-mWid / 2, 0);
      ctx.lineTo(0, -mLen);
      ctx.lineTo(mWid / 2, 0);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      ctx.restore();

      // Second Hand
      if (secondHandColor !== 'none') {
        ctx.save();
        ctx.translate(previewConfig.x, previewConfig.y);
        ctx.rotate(Math.PI * 0.85);
        ctx.strokeStyle = secondHandColor;
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(0, 15);
        ctx.lineTo(0, -previewConfig.r * 0.9);
        ctx.stroke();
        
        // Center Pin Cap
        ctx.fillStyle = secondHandColor;
        ctx.beginPath();
        ctx.arc(0, 0, 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
    }
  }, [showPreview, previewPhoto, previewConfig, layers, dialSettings, showHands, handFinishId, timeMinutes, secondHandColor]);

  useEffect(() => {
    drawWatchPreview();
  }, [drawWatchPreview]);

  const getCoords = (e) => {
    const rect = e.target.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const handleInputStart = (e) => {
    isDraggingFaceRef.current = true;
    const coords = getCoords(e);
    const factorX = 500 / e.target.clientWidth;
    const factorY = 650 / e.target.clientHeight;
    previewDragRef.current = {
      startMouseX: coords.x * factorX,
      startMouseY: coords.y * factorY,
      startFaceX: previewConfig.x,
      startFaceY: previewConfig.y
    };
  };

  const handleInputMove = (e) => {
    if (!isDraggingFaceRef.current) return;
    const coords = getCoords(e);
    const factorX = 500 / e.target.clientWidth;
    const factorY = 650 / e.target.clientHeight;
    const dx = (coords.x * factorX) - previewDragRef.current.startMouseX;
    const dy = (coords.y * factorY) - previewDragRef.current.startMouseY;
    setPreviewConfig(prev => ({
      ...prev,
      x: previewDragRef.current.startFaceX + dx,
      y: previewDragRef.current.startFaceY + dy
    }));
  };

  const handleInputEnd = () => {
    isDraggingFaceRef.current = false;
  };

  if (!showPreview) return null;

  return (
    <div className="w-full lg:w-[340px] wood-grain border-t lg:border-t-0 lg:border-l flex flex-col items-center p-3 shadow-2xl z-20 overflow-y-auto shrink-0">
      {/* Watch Model Selector Panel */}
      <div className="w-full bg-white/95 backdrop-blur-md rounded-lg border border-white p-2 mb-3 shadow-sm space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Maximize size={12} className="text-slate-500" />
            <span className="text-[9px] font-black text-slate-700 uppercase tracking-tighter">Preview Studio</span>
          </div>
          <label className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white px-2 py-0.5 rounded cursor-pointer transition-colors shadow-md">
            <ImageIcon size={10} />
            <span className="text-[8px] font-bold uppercase">Upload Custom</span>
            <input type="file" onChange={handleModelPhotoUpload} className="hidden" accept="image/*" />
          </label>
        </div>

        {/* Watch Model Presets Dropdown */}
        <div className="space-y-0.5">
          <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Watch Case Model</div>
          <select 
            value={selectedModelId} 
            onChange={(e) => handleModelChange(e.target.value)} 
            className="w-full text-[9px] p-1 border rounded bg-white font-bold outline-none"
          >
            {PRESET_WATCH_MODELS.map(m => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
            <option value="custom">Custom Uploaded Photo</option>
          </select>
        </div>

        {/* Scale & Positioning Sliders */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-1 pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Zoom</span>
            <input type="range" min="0.1" max="3.0" step="0.01" value={previewConfig.scale} onChange={(e) => setPreviewConfig({...previewConfig, scale: parseFloat(e.target.value)})} className="flex-1 h-0.5 mx-2 accent-slate-400"/>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Size</span>
            <input type="range" min="10" max="300" value={previewConfig.r} onChange={(e) => setPreviewConfig({...previewConfig, r: parseInt(e.target.value)})} className="flex-1 h-0.5 mx-2 accent-slate-400"/>
          </div>
        </div>

        {/* Customizable Watch Hands Controls */}
        <div className="pt-2 border-t border-slate-100 space-y-1.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Clock size={11} className="text-orange-600" />
              <span className="text-[8px] font-black text-slate-600 uppercase tracking-tighter">Watch Hands</span>
            </div>
            <div className="flex items-center gap-1">
              <input 
                type="checkbox" 
                id="showHandsToggle" 
                checked={showHands} 
                onChange={(e) => setShowHands(e.target.checked)} 
                className="w-3 h-3 accent-orange-600 cursor-pointer"
              />
              <label htmlFor="showHandsToggle" className="text-[8px] font-bold text-slate-500 uppercase cursor-pointer">Visible</label>
            </div>
          </div>

          {showHands && (
            <div className="space-y-1 bg-slate-50 p-1.5 rounded border">
              <div className="grid grid-cols-2 gap-1">
                <div>
                  <div className="text-[7px] font-bold text-slate-400 uppercase">Finish</div>
                  <select 
                    value={handFinishId} 
                    onChange={(e) => setHandFinishId(e.target.value)} 
                    className="w-full text-[8px] p-0.5 border rounded bg-white font-bold"
                  >
                    {WATCH_HAND_FINISHES.map(h => (
                      <option key={h.id} value={h.id}>{h.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <div className="text-[7px] font-bold text-slate-400 uppercase">Second Hand</div>
                  <select 
                    value={secondHandColor} 
                    onChange={(e) => setSecondHandColor(e.target.value)} 
                    className="w-full text-[8px] p-0.5 border rounded bg-white font-bold"
                  >
                    <option value="#D32F2F">Red</option>
                    <option value="#1E40AF">Blue</option>
                    <option value="#D4AF37">Gold</option>
                    <option value="#000000">Black</option>
                    <option value="none">None</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-[7px] font-bold text-slate-400 uppercase">
                  <span>Time Setting</span>
                  <span>{Math.floor((timeMinutes / 60) % 12 || 12)}:{String(Math.floor(timeMinutes % 60)).padStart(2, '0')}</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="720" 
                  value={timeMinutes} 
                  onChange={(e) => setTimeMinutes(parseInt(e.target.value))} 
                  className="w-full h-0.5 accent-orange-600"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Watch Canvas Preview */}
      <div className="watch-preview-shadow rounded-[40px] overflow-hidden bg-white/95 p-1.5 shrink-0 border-4 border-white/20 mb-4 lg:mb-0">
        <canvas 
          ref={previewCanvasRef} 
          width={500} 
          height={650} 
          onPointerDown={handleInputStart} 
          onPointerMove={handleInputMove} 
          onPointerUp={handleInputEnd} 
          onPointerLeave={handleInputEnd}
          className="w-[280px] h-[364px] lg:w-[300px] lg:h-[390px] bg-white cursor-move rounded-[25px] touch-none" 
        />
      </div>
    </div>
  );
};
