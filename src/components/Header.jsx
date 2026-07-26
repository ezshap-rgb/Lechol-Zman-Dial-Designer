import React, { useRef } from 'react';
import { Eye, Download, Printer, Save, FolderOpen, RotateCcw, RotateCw } from 'lucide-react';
import { saveProjectFile, loadProjectFile } from '../utils/history.js';

export const Header = ({ 
  showPreview, 
  setShowPreview, 
  downloadDialImage, 
  generatePrint, 
  layers, 
  dialSettings, 
  previewConfig, 
  setLayers, 
  setDialSettings, 
  setPreviewConfig,
  canUndo,
  canRedo,
  undo,
  redo
}) => {
  const fileInputRef = useRef(null);

  const handleFileLoad = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    loadProjectFile(file, ({ layers, dialSettings, previewConfig }) => {
      setLayers(layers);
      setDialSettings(dialSettings);
      setPreviewConfig(previewConfig);
    });
  };

  return (
    <header className="bg-white border-b px-4 py-1 flex items-center justify-between shadow-sm z-10 shrink-0 h-10 lg:h-11">
      <div className="flex items-center gap-3">
        <div className="w-6 h-6 lg:w-7 lg:h-7 bg-orange-600 rounded flex items-center justify-center text-white font-black text-xs lg:text-sm italic shadow-md">
          K
        </div>
        <h1 className="text-[11px] lg:text-xs font-bold tracking-tight text-slate-700">
          Studio Lechol Zman <span className="text-[9px] lg:text-[10px] text-slate-400 font-normal ml-1 lg:ml-2 uppercase tracking-widest hidden sm:inline">Precision Designer</span>
        </h1>
      </div>

      <div className="flex items-center gap-1.5 lg:gap-2">
        {/* Undo / Redo */}
        <button
          onClick={undo}
          disabled={!canUndo}
          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 transition-all border border-slate-200"
          title="Undo (Ctrl+Z)"
        >
          <RotateCcw size={13} />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo}
          className="p-1 rounded bg-slate-100 hover:bg-slate-200 text-slate-700 disabled:opacity-30 transition-all border border-slate-200"
          title="Redo (Ctrl+Y)"
        >
          <RotateCw size={13} />
        </button>

        <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        {/* Save & Load JSON */}
        <button
          onClick={() => saveProjectFile(layers, dialSettings, previewConfig)}
          className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 px-2 py-0.5 rounded font-bold text-[9px] lg:text-[10px] border shadow-sm transition-all"
          title="Save Design Project as JSON"
        >
          <Save size={12} className="text-orange-600" />
          <span className="hidden sm:inline">SAVE</span>
        </button>

        <button
          onClick={() => fileInputRef.current.click()}
          className="flex items-center gap-1 bg-white hover:bg-slate-50 text-slate-700 px-2 py-0.5 rounded font-bold text-[9px] lg:text-[10px] border shadow-sm transition-all"
          title="Load Design Project JSON File"
        >
          <FolderOpen size={12} className="text-blue-600" />
          <span className="hidden sm:inline">LOAD</span>
        </button>
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".json" 
          onChange={handleFileLoad} 
        />

        <div className="h-4 w-px bg-slate-200 mx-0.5 hidden sm:block" />

        {/* Preview toggle */}
        <button 
          onClick={() => setShowPreview(!showPreview)} 
          className={`flex items-center gap-1.5 px-2 py-0.5 rounded font-bold text-[9px] lg:text-[10px] transition-all border ${showPreview ? 'bg-orange-50 border-orange-500 text-orange-600' : 'bg-white text-slate-600 border-slate-200'}`}
        >
          <Eye size={12}/> {showPreview ? 'CLOSE' : 'PREVIEW'}
        </button>

        {/* Download Image */}
        <button 
          onClick={downloadDialImage} 
          className="flex items-center gap-1 bg-white text-slate-700 px-2 py-0.5 rounded font-bold text-[9px] lg:text-[10px] border shadow-sm hover:bg-slate-50"
        >
          <Download size={12}/> {dialSettings.transparentBg ? 'PNG' : 'JPG'}
        </button>

        {/* Print Sheet */}
        <button 
          onClick={generatePrint} 
          className="flex items-center gap-1 bg-orange-600 hover:bg-orange-700 text-white px-2 py-0.5 rounded font-bold text-[9px] lg:text-[10px] shadow-md transition-colors"
        >
          <Printer size={12}/> PRINT
        </button>
      </div>
    </header>
  );
};
