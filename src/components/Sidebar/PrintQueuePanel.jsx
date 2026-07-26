import React from 'react';
import { Printer, Plus } from 'lucide-react';

export const PrintQueuePanel = ({ 
  batchList, 
  setBatchList, 
  canvasRef, 
  dialSettings 
}) => {
  const addCurrentToBatch = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const dataUrl = canvas.toDataURL('image/png');
    const img = new Image();
    img.onload = () => {
      setBatchList(prev => [...prev, { 
        id: Math.random().toString(), 
        name: 'Current Design', 
        img, 
        diameterMm: parseFloat(dialSettings.diameterMm) 
      }]);
    };
    img.src = dataUrl;
  };

  const handleBatchFilesUpload = (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          setBatchList(prev => [...prev, { 
            id: Math.random().toString(), 
            name: file.name, 
            img, 
            diameterMm: parseFloat(dialSettings.diameterMm) 
          }]);
        };
        img.src = event.target.result;
      };
      reader.readAsDataURL(file);
    });
  };

  const removeBatchItem = (id) => {
    setBatchList(prev => prev.filter(item => item.id !== id));
  };

  const handleBatchDiameterChange = (id, val) => {
    const parsedVal = parseFloat(val) || 0;
    setBatchList(prev => prev.map(item => 
      item.id === id ? { ...item, diameterMm: parsedVal } : item
    ));
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-1.5">
        <h2 className="font-black text-[9px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <Printer size={11}/> Print Queue
        </h2>
        <button onClick={addCurrentToBatch} className="text-[9px] font-bold text-orange-600 hover:text-orange-700 uppercase flex items-center gap-0.5">
          <Plus size={10}/> Add Current
        </button>
      </div>
      <div className="border border-dashed border-slate-200 rounded p-1.5 bg-slate-50 flex items-center justify-between mb-2">
        <span className="text-[8px] font-bold text-slate-400 uppercase">Upload Dials</span>
        <label className="bg-slate-200 hover:bg-slate-300 text-slate-700 px-2 py-0.5 rounded text-[8px] font-bold uppercase cursor-pointer">
          Files
          <input type="file" multiple onChange={handleBatchFilesUpload} className="hidden" accept="image/*"/>
        </label>
      </div>
      <div className="grid grid-cols-3 gap-1.5 max-h-36 overflow-y-auto pr-1">
        {batchList.map((item) => (
          <div key={item.id} className="relative bg-slate-50 rounded-lg p-1.5 border border-slate-200 shadow-sm flex flex-col items-center gap-1">
            <div className="relative w-10 h-10 border rounded bg-white overflow-hidden flex items-center justify-center p-0.5">
              <img src={item.img.src} className="max-w-full max-h-full rounded-full object-cover" alt={item.name} />
              <button onClick={() => removeBatchItem(item.id)} className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold shadow">
                ×
              </button>
            </div>
            <div className="flex items-center gap-0.5 mt-0.5">
              <input 
                type="number" 
                value={item.diameterMm} 
                onChange={(e) => handleBatchDiameterChange(item.id, e.target.value)}
                className="w-9 text-[9px] font-black text-center border rounded bg-white p-0.5 outline-none focus:ring-1 focus:ring-orange-500" 
                title="Dial Diameter (mm)"
              />
              <span className="text-[7px] text-slate-400 font-bold">mm</span>
            </div>
          </div>
        ))}
      </div>
      <div className="text-[8px] text-slate-400 italic mt-1 leading-normal">
        {batchList.length > 0 ? `${batchList.length} dial(s) in queue. Will tile dynamically using individual diameters.` : 'Queue empty. Output prints current canvas design repeatedly.'}
      </div>
    </section>
  );
};
