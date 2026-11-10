import React, { useState } from 'react';
import { CircleDot, ChevronDown, Pipette, Palette, Check } from 'lucide-react';
import { DIAL_COLOR_PRESETS } from '../../constants/presets.js';
import { hasNativeEyeDropper, openNativeEyeDropper, isValidHex, formatHex } from '../../utils/colorExtractor.js';

export const DialCanvasPanel = ({
  canvasExpanded,
  setCanvasExpanded,
  dialSettings,
  setDialSettings,
  recentColors,
  setRecentColors,
  onOpenColorExtractor
}) => {
  const currentDialColor = dialSettings.dialColor || '#FFFFFF';
  const isTransparent = dialSettings.transparentBg || false;
  const [hexInput, setHexInput] = useState(currentDialColor);

  const applyColor = (color) => {
    const formatted = formatHex(color);
    setHexInput(formatted);
    setDialSettings(prev => ({
      ...prev,
      dialColor: formatted,
      transparentBg: false // Selecting a color turns off transparent mode
    }));

    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toUpperCase() !== formatted.toUpperCase());
      return [formatted, ...filtered].slice(0, 8);
    });
  };

  const handleNativeEyeDropper = async () => {
    try {
      const picked = await openNativeEyeDropper();
      if (picked) {
        applyColor(picked);
      }
    } catch (err) {
      // User canceled or not supported
      console.log('EyeDropper closed or cancelled', err);
    }
  };

  const handleHexBlur = () => {
    if (isValidHex(hexInput)) {
      applyColor(hexInput);
    } else {
      setHexInput(currentDialColor);
    }
  };

  return (
    <section className="sidebar-section">
      <div 
        className="flex items-center justify-between cursor-pointer py-1 select-none"
        onClick={() => setCanvasExpanded(!canvasExpanded)}
      >
        <h2 className="font-black text-[9px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <CircleDot size={11} className="text-orange-500" /> Dial Canvas
        </h2>
        <ChevronDown size={12} className={`transition-transform duration-200 text-slate-400 ${canvasExpanded ? 'rotate-180' : ''}`} />
      </div>

      {canvasExpanded && (
        <div className="mt-2 space-y-2.5 animate-in fade-in duration-200">
          
          {/* Base transparency option */}
          <div className="flex items-center justify-between bg-slate-50 p-1.5 rounded border border-slate-200/70">
            <label htmlFor="transparentDial" className="text-[8.5px] font-black uppercase text-slate-600 cursor-pointer">
              Transparent Dial Base
            </label>
            <input 
              type="checkbox" 
              id="transparentDial" 
              checked={isTransparent} 
              onChange={(e) => setDialSettings(prev => ({ ...prev, transparentBg: e.target.checked }))} 
              className="w-3.5 h-3.5 accent-orange-600 cursor-pointer"
            />
          </div>

          {/* Color Selection controls */}
          <div className="space-y-2 bg-slate-50/50 p-2 rounded-lg border border-slate-100">
            <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-tighter">
              <span>Canvas Color</span>
              <span className="text-slate-500 font-mono text-[9px]">
                {isTransparent ? 'TRANSPARENT' : currentDialColor}
              </span>
            </div>

            {/* Main Color Picker Bar */}
            <div className="flex items-center gap-1.5">
              {/* Native Color Picker gradient button */}
              <label 
                className="w-7 h-7 rounded-lg border border-slate-300 shadow-sm flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0 relative overflow-hidden" 
                style={{ background: 'conic-gradient(from 0deg, red, yellow 17%, green 33%, cyan 50%, blue 66%, magenta 83%, red 100%)' }}
                title="Full Color Picker Spectrum"
              >
                <input 
                  type="color" 
                  value={currentDialColor} 
                  onChange={(e) => applyColor(e.target.value)} 
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <div className="absolute inset-1 bg-white/20 rounded-full border border-white/40 flex items-center justify-center pointer-events-none">
                  <Palette size={11} className="text-slate-800" />
                </div>
              </label>

              {/* Color swatch & Hex input */}
              <div className="flex-1 flex items-center gap-1.5 bg-white border border-slate-200 rounded-lg px-2 py-1 shadow-sm">
                <span 
                  className="w-4 h-4 rounded-full border border-slate-300 shadow-sm shrink-0" 
                  style={{ backgroundColor: isTransparent ? '#FFFFFF' : currentDialColor }}
                />
                <input
                  type="text"
                  value={hexInput}
                  onChange={(e) => setHexInput(e.target.value)}
                  onBlur={handleHexBlur}
                  onKeyDown={(e) => e.key === 'Enter' && handleHexBlur()}
                  placeholder="#FFFFFF"
                  className="w-full text-[10px] font-mono font-bold uppercase outline-none text-slate-700 bg-transparent"
                />
              </div>

              {/* Native EyeDropper button (Chromium) */}
              {hasNativeEyeDropper() && (
                <button
                  type="button"
                  onClick={handleNativeEyeDropper}
                  className="w-7 h-7 rounded-lg border border-slate-200 bg-white hover:bg-orange-50 hover:border-orange-300 text-slate-700 hover:text-orange-600 flex items-center justify-center shadow-sm transition-all shrink-0"
                  title="Screen Eyedropper (Pick any color on screen)"
                >
                  <Pipette size={13} />
                </button>
              )}
            </div>

            {/* Color Extractor from Image Button */}
            <button
              type="button"
              onClick={onOpenColorExtractor}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 px-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-lg text-[8.5px] font-black uppercase tracking-wider shadow-sm transition-all active:scale-[0.98]"
            >
              <Pipette size={11} /> Extract Color from Image
            </button>

            {/* Classic Watch Dial Presets */}
            <div className="pt-1">
              <span className="text-[7.5px] font-black uppercase text-slate-400 tracking-wider block mb-1">
                Classic Dial Presets
              </span>
              <div className="grid grid-cols-6 gap-1">
                {DIAL_COLOR_PRESETS.map((preset) => {
                  const isSelected = !isTransparent && currentDialColor.toUpperCase() === preset.value.toUpperCase();
                  return (
                    <button
                      key={preset.name}
                      onClick={() => applyColor(preset.value)}
                      title={`${preset.name} (${preset.value})`}
                      className={`h-5 rounded border transition-all relative flex items-center justify-center hover:scale-110 active:scale-95 ${
                        isSelected 
                          ? 'ring-2 ring-orange-500 scale-105 border-transparent shadow-sm' 
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                      style={{ backgroundColor: preset.value }}
                    >
                      {isSelected && (
                        <Check size={9} className={preset.value === '#FFFFFF' || preset.value === '#E2E8F0' || preset.value === '#FEF3C7' ? 'text-black' : 'text-white'} />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Recent Colors */}
            {recentColors && recentColors.length > 0 && (
              <div className="pt-1 border-t border-slate-200/60">
                <div className="flex items-center gap-1 text-[7.5px] font-black uppercase text-slate-400 tracking-wider mb-1">
                  <span>Recent:</span>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {recentColors.map((col, idx) => (
                    <button
                      key={idx}
                      onClick={() => applyColor(col)}
                      className={`w-4 h-4 rounded border transition-all hover:scale-110 ${
                        !isTransparent && currentDialColor.toUpperCase() === col.toUpperCase()
                          ? 'ring-1 ring-orange-500 border-orange-500 scale-105'
                          : 'border-slate-300 hover:border-slate-400'
                      }`}
                      style={{ backgroundColor: col }}
                      title={col}
                    />
                  ))}
                </div>
              </div>
            )}

          </div>

        </div>
      )}
    </section>
  );
};

