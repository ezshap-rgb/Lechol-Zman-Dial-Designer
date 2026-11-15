import React, { useRef, useMemo, useState } from 'react';
import { Layers, ChevronDown, Type, Upload, GripVertical, ArrowUp, ArrowDown, Trash2 } from 'lucide-react';

export const CompositionPanel = ({ 
  compExpanded, 
  setCompExpanded, 
  layers, 
  setLayers, 
  selectedLayerIndex, 
  setSelectedLayerIndex, 
  availableFonts, 
  customFonts, 
  setCustomFonts 
}) => {
  const fontInputRef = useRef(null);
  const [draggingIndex, setDraggingIndex] = useState(null);

  const addTextLayer = () => {
    const newLayer = {
      type: 'text', text: 'LABEL', font: 'Inter', size: 30, color: '#000000',
      x: 250, y: 250, opacity: 1, curved: false, radius: 150, startAngle: -90,
      isBold: true, spacing: 2, name: 'Text Layer', rotation: 0, scale: 1, shadow: false
    };
    setLayers(prev => {
      const next = [...prev, newLayer];
      setSelectedLayerIndex(next.length - 1);
      return next;
    });
    setCompExpanded(true);
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const newLayer = { type: 'image', img, name: file.name, x: 250, y: 250, scale: 0.5, opacity: 1, rotation: 0 };
        setLayers(prev => {
          const next = [...prev, newLayer];
          setSelectedLayerIndex(next.length - 1);
          return next;
        });
        setCompExpanded(true);
      };
      img.src = event.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleFontUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const fontName = file.name.split('.')[0].replace(/[^a-zA-Z]/g, '');
    const reader = new FileReader();
    reader.onload = async (event) => {
      const fontFace = new FontFace(fontName, event.target.result);
      await fontFace.load();
      document.fonts.add(fontFace);
      setCustomFonts(prev => [...prev, { id: fontName, name: fontName }]);
      if (selectedLayerIndex !== null && layers[selectedLayerIndex]?.type === 'text') {
        updateLayer('font', fontName);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const updateLayer = (key, val) => {
    if (selectedLayerIndex === null) return;
    const n = [...layers];
    n[selectedLayerIndex][key] = val;
    setLayers(n);
  };

  const moveLayer = (index, direction) => {
    const newIndex = direction === 'up' ? index + 1 : index - 1;
    if (newIndex < 0 || newIndex >= layers.length) return;
    const nextLayers = [...layers];
    const temp = nextLayers[index];
    nextLayers[index] = nextLayers[newIndex];
    nextLayers[newIndex] = temp;
    setLayers(nextLayers);
    setSelectedLayerIndex(newIndex);
  };

  const handleDragStart = (e, index) => {
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, targetIndex) => {
    e.preventDefault();
    if (draggingIndex === null || draggingIndex === targetIndex) return;
    const nextLayers = [...layers];
    const [draggedItem] = nextLayers.splice(draggingIndex, 1);
    nextLayers.splice(targetIndex, 0, draggedItem);
    setLayers(nextLayers);
    setSelectedLayerIndex(targetIndex);
    setDraggingIndex(null);
  };

  const reversedLayers = useMemo(() => {
    return [...layers].reverse();
  }, [layers]);

  return (
    <section className="sidebar-section">
      <div className="flex items-center justify-between py-1 select-none">
        <div 
          className="flex items-center gap-1.5 cursor-pointer py-1 select-none flex-1"
          onClick={() => setCompExpanded(!compExpanded)}
        >
          <h2 className="font-black text-[9px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
            <Layers size={12}/> Composition
          </h2>
          <ChevronDown size={12} className={`transition-transform duration-200 text-slate-400 ${compExpanded ? 'rotate-180' : ''}`} />
        </div>
        <div className="flex gap-1 shrink-0">
          <button onClick={addTextLayer} className="px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 rounded border shadow-sm text-[8px] font-bold uppercase flex items-center gap-0.5" title="Add Text">
            <Type size={10}/>
            <span>Text</span>
          </button>
          <label className="cursor-pointer px-1.5 py-0.5 bg-slate-50 hover:bg-slate-100 rounded border shadow-sm text-[8px] font-bold uppercase flex items-center gap-0.5">
            <Upload size={10}/>
            <span>Image</span>
            <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} />
          </label>
        </div>
      </div>
      
      {compExpanded && (
        <div className="mt-2 space-y-2 animate-in fade-in duration-200">
          <div className="space-y-1 max-h-24 lg:max-h-32 overflow-y-auto pr-1 mb-1.5">
            {reversedLayers.map((layer, rIdx) => {
              const actualIdx = layers.length - 1 - rIdx;
              const isSelected = selectedLayerIndex === actualIdx;
              return (
                <div 
                  key={actualIdx} 
                  draggable="true"
                  onDragStart={(e) => handleDragStart(e, actualIdx)}
                  onDragOver={handleDragOver}
                  onDrop={(e) => handleDrop(e, actualIdx)}
                  onClick={() => setSelectedLayerIndex(actualIdx)} 
                  className={`flex items-center justify-between p-1 rounded border-2 cursor-pointer transition-all ${draggingIndex === actualIdx ? 'opacity-40' : ''} ${isSelected ? 'border-orange-500 bg-orange-50' : 'border-slate-50 bg-white hover:border-slate-200'}`}
                >
                  <div className="flex items-center gap-1 truncate max-w-[120px]">
                    <div className="text-slate-300 cursor-grab px-0.5">
                      <GripVertical size={10} />
                    </div>
                    {layer.type === 'image' ? <Upload size={11} className="text-slate-400 shrink-0"/> : <Type size={11} className="text-slate-400 shrink-0"/>}
                    <span className="text-[9px] font-bold truncate tracking-tight">{layer.type === 'image' ? layer.name : layer.text}</span>
                  </div>
                  <div className="flex items-center gap-1 shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button onClick={() => moveLayer(actualIdx, 'up')} disabled={actualIdx === layers.length - 1} className="text-slate-400 hover:text-orange-600 disabled:opacity-30 p-0.5" title="Bring Forward">
                      <ArrowUp size={11}/>
                    </button>
                    <button onClick={() => moveLayer(actualIdx, 'down')} disabled={actualIdx === 0} className="text-slate-400 hover:text-orange-600 disabled:opacity-30 p-0.5" title="Send Backward">
                      <ArrowDown size={11}/>
                    </button>
                    <button onClick={() => { setLayers(layers.filter((_, i) => i !== actualIdx)); setSelectedLayerIndex(null); }} className="text-slate-300 hover:text-red-500 p-0.5" title="Delete">
                      <Trash2 size={12}/>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
          
          {selectedLayerIndex !== null && layers[selectedLayerIndex] && (
            <div className="p-2 bg-slate-50 rounded border space-y-1.5">
              <div className="space-y-0.5">
                <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Scale/Zoom <span>{Math.round((layers[selectedLayerIndex].scale || 1)*100)}%</span></div>
                <input type="range" min="0.01" max="2" step="0.01" value={layers[selectedLayerIndex].scale || 1} onChange={(e) => updateLayer('scale', parseFloat(e.target.value))} className="w-full h-0.5 mx-1"/>
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Rotation <span>{layers[selectedLayerIndex].rotation || 0}°</span></div>
                <input type="range" min="0" max="360" value={layers[selectedLayerIndex].rotation || 0} onChange={(e) => updateLayer('rotation', parseInt(e.target.value))} className="w-full h-0.5 mx-1"/>
              </div>
              <div className="space-y-0.5">
                <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Opacity <span>{Math.round((layers[selectedLayerIndex].opacity !== undefined ? layers[selectedLayerIndex].opacity : 1)*100)}%</span></div>
                <input type="range" min="0" max="1" step="0.01" value={layers[selectedLayerIndex].opacity !== undefined ? layers[selectedLayerIndex].opacity : 1} onChange={(e) => updateLayer('opacity', parseFloat(e.target.value))} className="w-full h-0.5 mx-1"/>
              </div>
              {layers[selectedLayerIndex].type === 'text' && (
                <>
                  <div className="space-y-0.5">
                    <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Text Content</div>
                    <input type="text" value={layers[selectedLayerIndex].text} onChange={(e) => updateLayer('text', e.target.value)} className="w-full p-1 border rounded font-bold text-[9px] bg-white outline-none" placeholder="Label..."/>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <div className="flex-1 space-y-0.5">
                      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Font Family</div>
                      <select 
                        value={layers[selectedLayerIndex].font} 
                        onChange={(e) => {
                          if (e.target.value === 'upload-custom-font') {
                            fontInputRef.current.click();
                          } else {
                            updateLayer('font', e.target.value);
                          }
                        }} 
                        className="w-full text-[9px] p-0.5 border rounded bg-white font-bold outline-none"
                      >
                        {availableFonts.map(f => <option key={f.id} value={f.id}>{f.name}</option>)}
                        <option value="upload-custom-font">➕ Upload Custom Font...</option>
                      </select>
                    </div>
                    <div className="space-y-0.5">
                      <div className="text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Color</div>
                      <input type="color" value={layers[selectedLayerIndex].color} onChange={(e) => updateLayer('color', e.target.value)} className="w-8 h-5 rounded border p-0.5 bg-white cursor-pointer"/>
                    </div>
                  </div>
                  <div className="space-y-0.5">
                    <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Font Size <span>{layers[selectedLayerIndex].size}px</span></div>
                    <input type="range" min="10" max="150" value={layers[selectedLayerIndex].size} onChange={(e) => updateLayer('size', parseInt(e.target.value))} className="w-full h-0.5 mx-1"/>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-100">
                    <div className="flex items-center gap-1.5">
                      <input type="checkbox" id="curved" checked={layers[selectedLayerIndex].curved || false} onChange={(e) => updateLayer('curved', e.target.checked)} className="accent-orange-600 w-3 h-3"/>
                      <label htmlFor="curved" className="text-[9px] font-black uppercase text-slate-500 italic cursor-pointer">Curved</label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input type="checkbox" id="isBold" checked={layers[selectedLayerIndex].isBold !== false} onChange={(e) => updateLayer('isBold', e.target.checked)} className="accent-orange-600 w-3 h-3"/>
                      <label htmlFor="isBold" className="text-[9px] font-black uppercase text-slate-500 italic cursor-pointer">Bold</label>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <input type="checkbox" id="shadow" checked={layers[selectedLayerIndex].shadow || false} onChange={(e) => updateLayer('shadow', e.target.checked)} className="accent-orange-600 w-3 h-3"/>
                      <label htmlFor="shadow" className="text-[9px] font-black uppercase text-slate-500 italic cursor-pointer">Shadow</label>
                    </div>
                  </div>
                  {layers[selectedLayerIndex].curved && (
                    <div className="space-y-1 pt-1 border-t border-slate-100">
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Curve Radius <span>{layers[selectedLayerIndex].radius || 150}px</span></div>
                        <input type="range" min="20" max="250" value={layers[selectedLayerIndex].radius || 150} onChange={(e) => updateLayer('radius', parseInt(e.target.value))} className="w-full h-0.5 mx-1"/>
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Start Angle <span>{layers[selectedLayerIndex].startAngle || -90}°</span></div>
                        <input type="range" min="-360" max="360" value={layers[selectedLayerIndex].startAngle || -90} onChange={(e) => updateLayer('startAngle', parseInt(e.target.value))} className="w-full h-0.5 mx-1"/>
                      </div>
                      <div className="space-y-0.5">
                        <div className="flex justify-between text-[8px] font-bold text-slate-400 uppercase tracking-tighter">Letter Spacing <span>{layers[selectedLayerIndex].spacing || 2}px</span></div>
                        <input type="range" min="-10" max="30" value={layers[selectedLayerIndex].spacing || 2} onChange={(e) => updateLayer('spacing', parseInt(e.target.value))} className="w-full h-0.5 mx-1"/>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
      <input 
        type="file" 
        ref={fontInputRef} 
        className="hidden" 
        accept=".ttf,.otf,.woff" 
        onChange={handleFontUpload} 
      />
    </section>
  );
};
