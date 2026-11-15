import React from 'react';
import { Printer, Plus, AlertTriangle } from 'lucide-react';
import { PAPER_SIZES } from '../../constants/presets.js';

export const PrintQueuePanel = ({ 
  batchList, 
  setBatchList, 
  canvasRef, 
  dialSettings 
}) => {
  const currentPaper = PAPER_SIZES.find(p => p.id === dialSettings.paperSize) || PAPER_SIZES[0];

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
        diameterMm: parseFloat(dialSettings.diameterMm) || 42,
        quantity: 1
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
            diameterMm: parseFloat(dialSettings.diameterMm) || 42,
            quantity: 1
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

  const handleBatchQuantityChange = (id, val) => {
    const parsedQty = Math.max(1, Math.min(50, parseInt(val, 10) || 1));
    setBatchList(prev => prev.map(item => 
      item.id === id ? { ...item, quantity: parsedQty } : item
    ));
  };

  const totalCopies = batchList.reduce((sum, item) => sum + (parseInt(item.quantity, 10) || 1), 0);

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

      <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-1">
        {batchList.map((item) => {
          const dMm = parseFloat(item.diameterMm) || 0;
          const isOversized = dMm > currentPaper.wMm;

          return (
            <div 
              key={item.id} 
              className={`relative bg-slate-50 rounded-lg p-1.5 border shadow-sm flex flex-col items-center gap-1 ${
                isOversized ? 'border-amber-400 bg-amber-50/50' : 'border-slate-200'
              }`}
            >
              <div className="relative w-11 h-11 border rounded bg-white overflow-hidden flex items-center justify-center p-0.5">
                <img src={item.img.src} className="max-w-full max-h-full rounded-full object-cover" alt={item.name} />
                <button 
                  onClick={() => removeBatchItem(item.id)} 
                  className="absolute -top-1 -right-1 bg-red-500 hover:bg-red-600 text-white rounded-full w-3.5 h-3.5 flex items-center justify-center text-[10px] font-bold shadow"
                  title="Remove from queue"
                >
                  ×
                </button>
              </div>

              {/* Diameter & Quantity inputs */}
              <div className="flex items-center gap-1 w-full justify-center">
                <div className="flex items-center">
                  <input 
                    type="number" 
                    value={item.diameterMm} 
                    onChange={(e) => handleBatchDiameterChange(item.id, e.target.value)}
                    className="w-8 text-[9px] font-black text-center border rounded-l bg-white p-0.5 outline-none focus:ring-1 focus:ring-orange-500" 
                    title="Dial Diameter (mm)"
                  />
                  <span className="text-[7px] text-slate-500 font-bold bg-slate-100 border border-l-0 px-0.5 py-0.5 rounded-r">mm</span>
                </div>

                <div className="flex items-center" title="Print Quantity (Copies)">
                  <span className="text-[8px] text-slate-400 font-bold mr-0.5">×</span>
                  <input 
                    type="number" 
                    min="1"
                    max="50"
                    value={item.quantity || 1} 
                    onChange={(e) => handleBatchQuantityChange(item.id, e.target.value)}
                    className="w-6 text-[9px] font-black text-center border rounded bg-white p-0.5 outline-none focus:ring-1 focus:ring-orange-500" 
                  />
                </div>
              </div>

              {isOversized && (
                <div className="flex items-center gap-0.5 text-amber-600 text-[7px] font-bold" title={`Dial diameter (${dMm}mm) exceeds ${currentPaper.name} width (${currentPaper.wMm}mm)`}>
                  <AlertTriangle size={8} /> Exceeds paper
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="text-[8px] text-slate-400 italic mt-1.5 leading-normal">
        {batchList.length > 0 ? (
          <span className="text-slate-600 font-medium">
            {batchList.length} design(s) ({totalCopies} copies). Click <strong className="text-orange-600">PRINT</strong> for 300 DPI sheet with 50mm ruler.
          </span>
        ) : (
          'Queue empty. "PRINT" tiles current canvas design repeatedly with 50mm ruler.'
        )}
      </div>
    </section>
  );
};
