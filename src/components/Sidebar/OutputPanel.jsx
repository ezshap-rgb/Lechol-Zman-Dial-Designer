import React from 'react';
import { Download } from 'lucide-react';
import { PAPER_SIZES } from '../../constants/presets.js';

export const OutputPanel = ({ dialSettings, setDialSettings }) => {
  return (
    <section className="sidebar-section">
      <h2 className="font-black text-[9px] uppercase tracking-widest text-slate-400 mb-1.5 flex items-center gap-1.5">
        <Download size={11}/> Output
      </h2>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-0.5">
          <div className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Diam (mm)</div>
          <input 
            type="number" 
            value={dialSettings.diameterMm} 
            onChange={(e) => setDialSettings({...dialSettings, diameterMm: e.target.value})} 
            className="w-full p-1 border rounded text-[10px] font-bold bg-white text-center outline-none focus:ring-1 focus:ring-orange-500"
          />
        </div>
        <div className="space-y-0.5">
          <div className="text-[8px] font-black uppercase text-slate-400 tracking-tighter">Paper Size</div>
          <select 
            value={dialSettings.paperSize} 
            onChange={(e) => setDialSettings({...dialSettings, paperSize: e.target.value})} 
            className="w-full p-1 border rounded text-[10px] font-bold bg-white text-center outline-none focus:ring-1 focus:ring-orange-500"
          >
            {PAPER_SIZES.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
        </div>
      </div>
    </section>
  );
};
