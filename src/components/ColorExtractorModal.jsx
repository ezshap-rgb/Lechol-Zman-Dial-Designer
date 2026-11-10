import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Pipette, Upload, X, Check, Image as ImageIcon, Sparkles, ZoomIn } from 'lucide-react';
import { rgbToHex, hexToRgb, isValidHex, formatHex, extractDominantColors } from '../utils/colorExtractor.js';

export const ColorExtractorModal = ({
  isOpen,
  onClose,
  onApplyDialColor,
  onApplyIndexColor,
  layers = [],
  currentDialColor = '#FFFFFF',
  currentDialSettings = {}
}) => {
  const [activeImageSrc, setActiveImageSrc] = useState(null);
  const [activeImageName, setActiveImageName] = useState('');
  const [dominantPalette, setDominantPalette] = useState([]);
  const [selectedColor, setSelectedColor] = useState(currentDialColor);
  const [hoverColor, setHoverColor] = useState(null);
  const [loupePos, setLoupePos] = useState({ x: 0, y: 0, visible: false });
  const [loupePixelData, setLoupePixelData] = useState(null);

  const fileInputRef = useRef(null);
  const canvasRef = useRef(null);
  const offscreenCanvasRef = useRef(null);
  const imageElementRef = useRef(null);

  // Filter image layers from current project
  const imageLayers = layers.filter(l => l.type === 'image' && (l.img || l.imgSrc));

  // Initialize with either the first image layer or reset
  useEffect(() => {
    if (isOpen) {
      setSelectedColor(currentDialColor || '#FFFFFF');
      if (imageLayers.length > 0 && !activeImageSrc) {
        const first = imageLayers[0];
        const src = first.img ? first.img.src : first.imgSrc;
        setActiveImageSrc(src);
        setActiveImageName(first.name || 'Project Image Layer');
      }
    }
  }, [isOpen, imageLayers, currentDialColor, activeImageSrc]);

  // When active image changes, draw to canvas and extract dominant colors
  useEffect(() => {
    if (!activeImageSrc) return;

    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = async () => {
      imageElementRef.current = img;

      // Draw onto offscreen canvas for pixel accurate sampling
      const offCanvas = document.createElement('canvas');
      offCanvas.width = img.naturalWidth || img.width;
      offCanvas.height = img.naturalHeight || img.height;
      const offCtx = offCanvas.getContext('2d', { willReadFrequently: true });
      offCtx.drawImage(img, 0, 0);
      offscreenCanvasRef.current = offCanvas;

      // Draw onto display canvas
      const displayCanvas = canvasRef.current;
      if (displayCanvas) {
        const container = displayCanvas.parentElement;
        const maxW = container ? container.clientWidth - 20 : 460;
        const maxH = 340;

        let scale = Math.min(maxW / img.width, maxH / img.height);
        if (scale > 1) scale = 1;

        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);

        displayCanvas.width = w;
        displayCanvas.height = h;
        const ctx = displayCanvas.getContext('2d');
        ctx.drawImage(img, 0, 0, w, h);
      }

      // Extract dominant color palette
      const palette = await extractDominantColors(img, 8);
      setDominantPalette(palette);
      if (palette.length > 0 && (!selectedColor || selectedColor === '#FFFFFF')) {
        setSelectedColor(palette[0]);
      }
    };
    img.src = activeImageSrc;
  }, [activeImageSrc]);

  // Handle local image file upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      setActiveImageSrc(event.target.result);
      setActiveImageName(file.name);
    };
    reader.readAsDataURL(file);
  };

  // Drag and drop image onto modal
  const handleDrop = (e) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          setActiveImageSrc(event.target.result);
          setActiveImageName(file.name);
        };
        reader.readAsDataURL(file);
      }
    }
  };

  // Sample pixel color from display canvas
  const sampleColorAt = (clientX, clientY) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const x = Math.floor((clientX - rect.left) * (canvas.width / rect.width));
    const y = Math.floor((clientY - rect.top) * (canvas.height / rect.height));

    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
      return null;
    }

    const ctx = canvas.getContext('2d', { willReadFrequently: true });
    const pixel = ctx.getImageData(x, y, 1, 1).data;
    if (pixel[3] < 20) return null; // Ignore transparent pixel

    const hex = rgbToHex(pixel[0], pixel[1], pixel[2]);
    return { hex, r: pixel[0], g: pixel[1], b: pixel[2], x, y };
  };

  const handlePointerMove = (e) => {
    const sampled = sampleColorAt(e.clientX, e.clientY);
    if (sampled) {
      setHoverColor(sampled.hex);
      setLoupePos({
        x: e.clientX,
        y: e.clientY,
        visible: true
      });

      // Sample a small 9x9 grid around pixel for magnifying loupe
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        const startX = Math.max(0, sampled.x - 4);
        const startY = Math.max(0, sampled.y - 4);
        const patch = ctx.getImageData(startX, startY, 9, 9);
        setLoupePixelData(patch);
      }
    } else {
      setLoupePos(prev => ({ ...prev, visible: false }));
    }
  };

  const handlePointerLeave = () => {
    setLoupePos(prev => ({ ...prev, visible: false }));
    setHoverColor(null);
  };

  const handleCanvasClick = (e) => {
    const sampled = sampleColorAt(e.clientX, e.clientY);
    if (sampled) {
      setSelectedColor(sampled.hex);
    }
  };

  const handleApplyDial = () => {
    if (selectedColor && onApplyDialColor) {
      onApplyDialColor(selectedColor);
      onClose();
    }
  };

  const handleApplyIndex = () => {
    if (selectedColor && onApplyIndexColor) {
      onApplyIndexColor(selectedColor);
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-3 lg:p-6 animate-in fade-in duration-150"
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-3xl max-h-[92vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-5 py-3 border-b flex items-center justify-between bg-slate-50/80">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-orange-600 flex items-center justify-center text-white shadow-sm">
              <Pipette size={15} />
            </div>
            <div>
              <h2 className="text-xs lg:text-sm font-black uppercase tracking-wider text-slate-800">
                Dial Color Extractor
              </h2>
              <p className="text-[10px] text-slate-500 font-medium">
                Click any pixel or pick an auto-extracted color to match your dial
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-200 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content body */}
        <div className="p-4 overflow-y-auto flex-1 space-y-4">
          
          {/* Image source bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-slate-100/70 p-2 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-[9px] font-black uppercase text-slate-500 tracking-wider flex items-center gap-1">
                <ImageIcon size={12} /> Source:
              </span>
              
              {imageLayers.length > 0 && imageLayers.map((layer, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    const src = layer.img ? layer.img.src : layer.imgSrc;
                    setActiveImageSrc(src);
                    setActiveImageName(layer.name || `Layer ${idx + 1}`);
                  }}
                  className={`px-2 py-0.5 rounded text-[9px] font-bold transition-all flex items-center gap-1 ${
                    activeImageName === (layer.name || `Layer ${idx + 1}`)
                      ? 'bg-orange-600 text-white shadow-sm'
                      : 'bg-white text-slate-700 hover:bg-slate-200 border border-slate-200'
                  }`}
                >
                  <span className="truncate max-w-[120px]">{layer.name || `Layer ${idx + 1}`}</span>
                </button>
              ))}
            </div>

            <div>
              <button
                onClick={() => fileInputRef.current && fileInputRef.current.click()}
                className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded text-[9px] font-bold shadow-sm transition-all"
              >
                <Upload size={11} className="text-orange-600" />
                <span>Upload Reference Photo</span>
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={handleFileUpload}
              />
            </div>
          </div>

          {/* Main Visual Extractor Area */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Left 2 Cols: Image Canvas & Loupe */}
            <div className="md:col-span-2 flex flex-col items-center justify-center bg-slate-900 rounded-xl p-3 relative min-h-[260px] overflow-hidden border border-slate-800 shadow-inner">
              {activeImageSrc ? (
                <div className="relative inline-block cursor-crosshair">
                  <canvas
                    ref={canvasRef}
                    onPointerMove={handlePointerMove}
                    onPointerLeave={handlePointerLeave}
                    onClick={handleCanvasClick}
                    className="max-w-full rounded shadow-md touch-none block"
                  />
                  {hoverColor && (
                    <div className="absolute bottom-2 left-2 bg-black/80 text-white text-[9px] font-mono px-2 py-0.5 rounded backdrop-blur-md flex items-center gap-1.5 shadow pointer-events-none">
                      <span className="w-3 h-3 rounded-full border border-white/60" style={{ backgroundColor: hoverColor }} />
                      <span>{hoverColor}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div 
                  onClick={() => fileInputRef.current && fileInputRef.current.click()}
                  className="flex flex-col items-center justify-center text-slate-400 p-8 border-2 border-dashed border-slate-700 rounded-xl cursor-pointer hover:border-orange-500 hover:text-slate-300 transition-all text-center"
                >
                  <Upload size={36} className="mb-2 text-slate-500" />
                  <p className="text-xs font-bold uppercase tracking-wider">Upload or drag & drop reference image</p>
                  <p className="text-[10px] text-slate-500 mt-1">Supports PNG, JPG, WEBP — watch photos, car colors, logos</p>
                </div>
              )}
            </div>

            {/* Right Col: Extracted Palette, Selection & Dial Preview */}
            <div className="flex flex-col gap-3">
              
              {/* Dominant Palette */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                <div className="flex items-center gap-1 text-[9px] font-black uppercase text-slate-500 mb-1.5">
                  <Sparkles size={11} className="text-amber-500" /> Auto-Detected Palette:
                </div>
                {dominantPalette.length > 0 ? (
                  <div className="grid grid-cols-4 gap-1.5">
                    {dominantPalette.map((col, idx) => (
                      <button
                        key={idx}
                        onClick={() => setSelectedColor(col)}
                        title={col}
                        className={`h-8 rounded-lg border-2 transition-all flex flex-col items-center justify-center relative hover:scale-105 active:scale-95 ${
                          selectedColor.toLowerCase() === col.toLowerCase()
                            ? 'border-orange-600 ring-2 ring-orange-300'
                            : 'border-white shadow-sm hover:border-slate-300'
                        }`}
                        style={{ backgroundColor: col }}
                      >
                        {selectedColor.toLowerCase() === col.toLowerCase() && (
                          <Check size={13} className="text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]" />
                        )}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-[9px] text-slate-400 italic">Load an image to extract dominant colors</p>
                )}
              </div>

              {/* Selected Color Readout */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 space-y-2">
                <span className="text-[9px] font-black uppercase text-slate-500">Selected Color</span>
                <div className="flex items-center gap-2">
                  <div 
                    className="w-10 h-10 rounded-lg border-2 border-white shadow-md shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: selectedColor }}
                  />
                  <div className="flex-1">
                    <input 
                      type="text"
                      value={selectedColor}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (isValidHex(val)) {
                          setSelectedColor(formatHex(val));
                        } else {
                          setSelectedColor(val);
                        }
                      }}
                      className="w-full text-xs font-mono font-bold uppercase p-1 border rounded bg-white outline-none focus:ring-1 focus:ring-orange-500"
                    />
                    <div className="text-[8px] text-slate-400 font-mono mt-0.5">
                      RGB: {hexToRgb(selectedColor).r}, {hexToRgb(selectedColor).g}, {hexToRgb(selectedColor).b}
                    </div>
                  </div>
                </div>
              </div>

              {/* Live Dial Mini Preview */}
              <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 flex flex-col items-center">
                <span className="text-[8px] font-black uppercase text-slate-400 mb-1 self-start">Dial Live Preview</span>
                <div 
                  className="w-24 h-24 rounded-full border-2 border-slate-300 shadow-md relative flex items-center justify-center overflow-hidden transition-colors"
                  style={{ backgroundColor: selectedColor }}
                >
                  {/* Subtle dial markings */}
                  {[0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330].map(deg => (
                    <div
                      key={deg}
                      className="absolute w-0.5 h-2 bg-slate-700/60 top-1"
                      style={{
                        transformOrigin: '50% 44px',
                        transform: `rotate(${deg}deg)`
                      }}
                    />
                  ))}
                  {/* Center pinion */}
                  <div className="w-2 h-2 rounded-full bg-slate-800 shadow border border-white" />
                </div>
              </div>

            </div>
          </div>

        </div>

        {/* Footer Actions */}
        <div className="px-5 py-3 border-t bg-slate-50 flex items-center justify-between">
          <span className="text-[9px] text-slate-400 italic">
            Tip: Click anywhere on the loaded image to sample that exact pixel color.
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-700 text-xs font-bold hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            {onApplyIndexColor && (
              <button
                onClick={handleApplyIndex}
                className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-100 text-slate-800 text-xs font-bold hover:bg-slate-200 transition-colors"
              >
                Set as Index
              </button>
            )}
            <button
              onClick={handleApplyDial}
              className="px-4 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-md transition-colors flex items-center gap-1"
            >
              <Check size={14} /> Apply as Dial Color
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

