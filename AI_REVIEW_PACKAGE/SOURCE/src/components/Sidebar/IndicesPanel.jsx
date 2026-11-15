import React, { useState } from 'react';
import { Settings, ChevronDown, Check, Upload, Palette } from 'lucide-react';
import { PRESET_INDEX_STYLES, COLORS } from '../../constants/presets.js';

// Swatch color map for non-asset presets
const STYLE_SWATCH = {
  'ktm-3d-gold':    ['#D4AF37','#FDF1B8'],
  'ktm-3d-silver':  ['#B0B0B0','#FFFFFF'],
  'ktm-batons':     ['#374151','#9CA3AF'],
  'small-circles':  ['#1E40AF','#93C5FD'],
  'classic-arabic': ['#1F2937','#E5E7EB'],
  'none':           ['#F3F4F6','#D1D5DB'],
  'custom-image':   ['#F97316','#FED7AA'],
};

export const IndicesPanel = ({ 
  indicesExpanded, 
  setIndicesExpanded, 
  dialSettings, 
  setDialSettings, 
  customMarkerImg, 
  setCustomMarkerImg,
  recentColors,
  setRecentColors
}) => {
  const [showIndiceList, setShowIndiceList] = useState(false);

  const handleCustomMarkerUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        setCustomMarkerImg(img);
        setDialSettings(prev => ({ ...prev, indexStyle: 'custom-image' }));
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const setIndexPreset = (pattern) => {
    let mask = Array(12).fill(false);
    if (pattern === 'all') mask = Array(12).fill(true);
    if (pattern === 'cardinal') [0, 3, 6, 9].forEach(i => mask[i] = true);
    if (pattern === '12only') mask[0] = true;
    setDialSettings({...dialSettings, indexMask: mask});
  };

  const toggleIndice = (i) => {
    const n = [...dialSettings.indexMask]; n[i] = !n[i];
    setDialSettings({...dialSettings, indexMask: n});
  };

  const handleCustomColorPicked = (colorVal) => {
    setDialSettings(prev => ({ ...prev, indexColor: colorVal }));
    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toLowerCase() !== colorVal.toLowerCase());
      return [colorVal, ...filtered].slice(0, 6);
    });
  };

  return (
    <section className="sidebar-section">
      <div 
        className="flex items-center justify-between cursor-pointer py-1 select-none"
        onClick={() => setIndicesExpanded(!indicesExpanded)}
      >
        <h2 className="font-black text-[9px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <Settings size={11}/> Indices
        </h2>
        <ChevronDown size={12} className={`transition-transform duration-200 text-slate-400 ${indicesExpanded ? 'rotate-180' : ''}`} />
      </div>
      
      {indicesExpanded && (
        <div className="mt-2 space-y-2 animate-in fade-in duration-200">
          
          {/* Visual Style Preset Selector */}
          <div className="space-y-1.5">
            <span className="text-[8px] font-black uppercase text-slate-400">Marker Style</span>

            {/* Asset image presets — shown as image thumbnails */}
            <div className="mb-1">
              <span className="text-[7px] font-bold uppercase text-amber-600 tracking-wider">📁 Asset Images</span>
              <div className="grid grid-cols-3 gap-1 mt-1">
                {PRESET_INDEX_STYLES.filter(s => s.type === 'asset-image').map(s => (
                  <button
                    key={s.id}
                    title={s.name}
                    onClick={() => setDialSettings({...dialSettings, indexStyle: s.id})}
                    className={`relative rounded overflow-hidden border-2 transition-all hover:scale-105 active:scale-95 h-12 ${
                      dialSettings.indexStyle === s.id
                        ? 'border-orange-500 ring-2 ring-orange-300'
                        : 'border-slate-200 hover:border-slate-400'
                    }`}
                  >
                    <img src={s.src} alt={s.name} className="w-full h-full object-cover" />
                    {dialSettings.indexStyle === s.id && (
                      <div className="absolute inset-0 bg-orange-500/20 flex items-center justify-center">
                        <Check size={14} className="text-orange-600 drop-shadow" />
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-[6px] font-bold px-0.5 py-px truncate leading-3">
                      {s.name.replace(' (Asset)', '').replace(/^[^ ]+ /, '')}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Programmatic / other presets — shown as a compact list */}
            <div>
              <span className="text-[7px] font-bold uppercase text-slate-400 tracking-wider">⚙ Programmatic Styles</span>
              <div className="grid grid-cols-2 gap-1 mt-1">
                {PRESET_INDEX_STYLES.filter(s => s.type !== 'asset-image').map(s => {
                  const sw = STYLE_SWATCH[s.id] || ['#CBD5E1','#F1F5F9'];
                  return (
                    <button
                      key={s.id}
                      title={s.name}
                      onClick={() => setDialSettings({...dialSettings, indexStyle: s.id})}
                      className={`flex items-center gap-1 px-1.5 py-1 rounded border-2 text-left transition-all hover:scale-105 active:scale-95 ${
                        dialSettings.indexStyle === s.id
                          ? 'border-orange-500 bg-orange-50 ring-1 ring-orange-300'
                          : 'border-slate-200 bg-white hover:border-slate-400'
                      }`}
                    >
                      <span className="w-3.5 h-3.5 rounded-sm shrink-0 border border-white shadow-sm"
                        style={{ background: `linear-gradient(135deg,${sw[0]},${sw[1]})` }}
                      />
                      <span className="text-[7.5px] font-bold uppercase truncate leading-tight text-slate-600">{s.name}</span>
                      {dialSettings.indexStyle === s.id && <Check size={9} className="ml-auto text-orange-500 shrink-0" />}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between mb-1 pt-1">
            <span className="text-[8px] font-black uppercase text-slate-400">Settings</span>
            <div className="flex items-center gap-1.5">
              <div className="flex items-center gap-1">
                <input 
                  type="checkbox" 
                  id="transparentBg" 
                  checked={dialSettings.transparentBg || false} 
                  onChange={(e) => setDialSettings({...dialSettings, transparentBg: e.target.checked})} 
                  className="w-3 h-3 accent-orange-600"
                />
                <label htmlFor="transparentBg" className="text-[8px] font-black uppercase text-orange-600 cursor-pointer" title="Make Dial Base Transparent">Transparent</label>
              </div>
              <div className="flex items-center gap-1">
                <input type="checkbox" id="shIndex" checked={dialSettings.showShadow} onChange={(e) => setDialSettings({...dialSettings, showShadow: e.target.checked})} className="w-3 h-3 accent-slate-600"/>
                <label htmlFor="shIndex" className="text-[8px] font-black uppercase text-slate-400 cursor-pointer">Shadow</label>
              </div>
              <div className="flex items-center gap-1">
                <input type="checkbox" id="shDot" checked={dialSettings.showCenterDot} onChange={(e) => setDialSettings({...dialSettings, showCenterDot: e.target.checked})} className="w-3 h-3 accent-orange-600"/>
                <label htmlFor="shDot" className="text-[8px] font-black uppercase text-orange-600 tracking-tighter cursor-pointer">Dot</label>
              </div>
            </div>
          </div>

          {/* Color Map spectrum picker with Recents */}
          <div className="space-y-1.5 bg-slate-50/50 p-2 rounded border border-slate-100/50">
            <div className="flex items-center justify-between text-[8px] font-black text-slate-400 uppercase tracking-tighter">
              <span>Index Color</span>
              <span className="text-slate-500 font-mono text-[9px]">{dialSettings.indexColor}</span>
            </div>
            <div className="flex items-center gap-2">
              <label 
                className="w-7 h-7 rounded border border-slate-300 shadow-sm flex items-center justify-center cursor-pointer transition-all hover:scale-105 active:scale-95 shrink-0 relative overflow-hidden" 
                style={{ background: 'conic-gradient(from 0deg, red, yellow 17%, green 33%, cyan 50%, blue 66%, magenta 83%, red 100%)' }}
                title="Open Custom Color Palette"
              >
                <input 
                  type="color" 
                  value={dialSettings.indexColor} 
                  onChange={(e) => handleCustomColorPicked(e.target.value)} 
                  className="opacity-0 absolute inset-0 w-full h-full cursor-pointer"
                />
                <div className="absolute inset-1 bg-white/20 rounded-full border border-white/40 flex items-center justify-center pointer-events-none">
                  <Palette size={10} className="text-slate-800" />
                </div>
              </label>

              <div className="flex gap-1 items-center flex-wrap">
                {COLORS.map(c => (
                  <button 
                    key={c.value} 
                    onClick={() => setDialSettings(prev => ({ ...prev, indexColor: c.value }))} 
                    className={`w-4 h-4 rounded border transition-all ${dialSettings.indexColor === c.value ? 'ring-2 ring-orange-500 scale-105 border-transparent' : 'border-slate-300 hover:border-slate-500'}`} 
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
            </div>

            {recentColors.length > 0 && (
              <div className="flex items-center gap-1.5 pt-1.5 border-t border-slate-200/50">
                <span className="text-[7px] font-black uppercase text-slate-400 tracking-tight shrink-0">Recent:</span>
                <div className="flex gap-1 flex-wrap">
                  {recentColors.map((col, idx) => (
                    <button
                      key={idx}
                      onClick={() => setDialSettings(prev => ({ ...prev, indexColor: col }))}
                      className={`w-3.5 h-3.5 rounded border transition-all ${dialSettings.indexColor.toLowerCase() === col.toLowerCase() ? 'ring-1 ring-orange-500 border-orange-500 scale-105' : 'border-slate-300 hover:border-slate-400'}`}
                      style={{ backgroundColor: col }}
                      title={col}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="relative mb-2">
            <button onClick={() => setShowIndiceList(!showIndiceList)} className="w-full flex items-center justify-between p-1 bg-white border rounded text-[9px] font-bold uppercase shadow-sm">
              Individual Toggles
              <ChevronDown size={11} className={`transition-transform duration-300 ${showIndiceList ? 'rotate-180' : ''}`} />
            </button>
            {showIndiceList && (
              <div className="absolute top-full left-0 w-full checklist-dropdown shadow-xl p-2 border grid grid-cols-3 gap-1">
                {[12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11].map((hr) => {
                  const idx = hr === 12 ? 0 : hr;
                  const isActive = dialSettings.indexMask[idx];
                  return (
                    <button key={hr} onClick={() => toggleIndice(idx)} className={`flex items-center justify-center gap-1 p-0.5 rounded text-[8px] font-black border transition-all ${isActive ? 'bg-orange-600 text-white' : 'bg-slate-50 text-slate-400'}`}>
                      {hr}h {isActive && <Check size={8} />}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="grid grid-cols-4 gap-0.5 mb-2">
            {['all', 'cardinal', '12only'].map(p => <button key={p} onClick={() => setIndexPreset(p)} className="text-[8px] font-black bg-white border p-0.5 rounded uppercase hover:bg-orange-50 tracking-tighter transition-colors">{p}</button>)}
            <button onClick={() => setIndexPreset('none')} className="text-[8px] font-black bg-white border p-0.5 rounded uppercase hover:bg-red-50 text-red-400">Clear</button>
          </div>
          <div className="space-y-1">
            <div className="space-y-0.5">
              <div className="text-[8px] font-black uppercase text-slate-400">Marker Length</div>
              <input type="range" min="5" max="100" value={dialSettings.indexSize} onChange={(e) => setDialSettings({...dialSettings, indexSize: parseInt(e.target.value)})} className="w-full h-0.5"/>
            </div>
            <div className="space-y-0.5">
              <div className="text-[8px] font-black uppercase text-slate-400">Marker Width</div>
              <input type="range" min="1" max="40" value={dialSettings.indexWidth} onChange={(e) => setDialSettings({...dialSettings, indexWidth: parseInt(e.target.value)})} className="w-full h-0.5"/>
            </div>
            <div className="space-y-0.5">
              <div className="text-[8px] font-black uppercase text-slate-400">Ring Radius</div>
              <input type="range" min="50" max="215" value={dialSettings.indexRadius} onChange={(e) => setDialSettings({...dialSettings, indexRadius: parseInt(e.target.value)})} className="w-full h-0.5"/>
            </div>
          </div>
          
          {dialSettings.indexStyle === 'custom-image' && (
            <div className="mt-2 p-2 bg-slate-50 rounded border border-dashed border-slate-300 space-y-1.5">
              <label className="flex items-center justify-between cursor-pointer group">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold text-slate-600">Upload Custom Marker</span>
                  <span className="text-[8px] text-slate-400">Repeated 12 times</span>
                </div>
                <Upload size={14} className="text-orange-600 group-hover:scale-110 transition-transform" />
                <input type="file" className="hidden" accept="image/*" onChange={handleCustomMarkerUpload} />
              </label>
              {customMarkerImg && (
                <div className="flex items-center gap-2 pt-1.5 border-t border-slate-200">
                  <input type="checkbox" id="rotateMarkers" checked={dialSettings.rotateMarkers} onChange={(e) => setDialSettings({...dialSettings, rotateMarkers: e.target.checked})} className="w-3 h-3 accent-orange-600" />
                  <label htmlFor="rotateMarkers" className="text-[9px] font-black uppercase text-slate-500">Rotate with dial</label>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
