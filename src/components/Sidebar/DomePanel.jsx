import React from 'react';
import { ChevronDown } from 'lucide-react';

export const DomePanel = ({ 
  domeExpanded, 
  setDomeExpanded, 
  dialSettings, 
  setDialSettings 
}) => {
  return (
    <section className="sidebar-section">
      <div 
        className="flex items-center justify-between cursor-pointer py-1 select-none"
        onClick={() => setDomeExpanded(!domeExpanded)}
      >
        <h2 className="font-black text-[9px] uppercase tracking-widest text-slate-400 flex items-center gap-1.5">
          <span className="text-[11px]">🔮</span> 3D Dome Crystal
        </h2>
        <ChevronDown size={12} className={`transition-transform duration-200 text-slate-400 ${domeExpanded ? 'rotate-180' : ''}`} />
      </div>
      
      {domeExpanded && (
        <div className="mt-2 space-y-2.5 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <span className="text-[8px] font-black uppercase text-slate-400">Glass Crystal</span>
            <div className="flex items-center gap-2">
              <input 
                type="checkbox" 
                id="domeEnabled" 
                checked={dialSettings.domeEnabled} 
                onChange={(e) => setDialSettings({...dialSettings, domeEnabled: e.target.checked})} 
                className="w-3.5 h-3.5 accent-orange-600 cursor-pointer"
              />
              <label htmlFor="domeEnabled" className="text-[9px] font-black uppercase text-orange-600 tracking-tighter cursor-pointer">Enable 3D Dome</label>
            </div>
          </div>

          {dialSettings.domeEnabled && (
            <div className="space-y-2.5 bg-slate-50/50 p-2 rounded border border-slate-100/50">
              <div className="space-y-0.5">
                <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                  <span>Curvature</span>
                  <span className="text-slate-500 font-bold">{dialSettings.domeCurvature}%</span>
                </div>
                <input 
                  type="range" 
                  min="-100" 
                  max="100" 
                  value={dialSettings.domeCurvature} 
                  onChange={(e) => setDialSettings({...dialSettings, domeCurvature: parseInt(e.target.value)})} 
                  className="w-full h-1"
                />
                <div className="flex justify-between text-[7px] text-slate-400 font-bold">
                  <span>Concave Cup</span>
                  <span>Flat</span>
                  <span>Convex Dome</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                  <span>Curvature Start Radius</span>
                  <span className="text-slate-500 font-bold">{dialSettings.domeStartRadius}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="95" 
                  value={dialSettings.domeStartRadius} 
                  onChange={(e) => setDialSettings({...dialSettings, domeStartRadius: parseInt(e.target.value)})} 
                  className="w-full h-1"
                />
                <div className="flex justify-between text-[7px] text-slate-400 font-bold">
                  <span>0% (Center)</span>
                  <span>95% (Extreme Edge)</span>
                </div>
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                  <span>Specular Shine</span>
                  <span className="text-slate-500 font-bold">{dialSettings.domeGlassShine}%</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="100" 
                  value={dialSettings.domeGlassShine} 
                  onChange={(e) => setDialSettings({...dialSettings, domeGlassShine: parseInt(e.target.value)})} 
                  className="w-full h-1"
                />
              </div>

              <div className="space-y-0.5">
                <div className="flex justify-between text-[8px] font-black uppercase text-slate-400">
                  <span>Light Angle</span>
                  <span className="text-slate-500 font-bold">{dialSettings.domeLightAngle}°</span>
                </div>
                <input 
                  type="range" 
                  min="0" 
                  max="360" 
                  value={dialSettings.domeLightAngle} 
                  onChange={(e) => setDialSettings({...dialSettings, domeLightAngle: parseInt(e.target.value)})} 
                  className="w-full h-1"
                />
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
};
