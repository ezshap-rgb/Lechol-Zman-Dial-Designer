import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Header } from './components/Header.jsx';
import { CanvasEditor } from './components/CanvasEditor.jsx';
import { WatchPreview } from './components/WatchPreview.jsx';
import { DialCanvasPanel } from './components/Sidebar/DialCanvasPanel.jsx';
import { CompositionPanel } from './components/Sidebar/CompositionPanel.jsx';
import { IndicesPanel } from './components/Sidebar/IndicesPanel.jsx';
import { DomePanel } from './components/Sidebar/DomePanel.jsx';
import { OutputPanel } from './components/Sidebar/OutputPanel.jsx';
import { PrintQueuePanel } from './components/Sidebar/PrintQueuePanel.jsx';
import { ColorExtractorModal } from './components/ColorExtractorModal.jsx';
import { DEFAULT_FONTS, PRESET_INDEX_STYLES } from './constants/presets.js';
import { downloadDialImage, generatePrintSheet } from './utils/printEngine.js';
import { drawDialToContext } from './utils/dialRenderer.js';

export function App() {
  const [layers, setLayers] = useState([]);
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(null);
  const [customFonts, setCustomFonts] = useState([]);
  const [customMarkerImg, setCustomMarkerImg] = useState(null);
  const [loadedAssetImages, setLoadedAssetImages] = useState({});

  const [dialSettings, setDialSettings] = useState({
    indexStyle: 'ktm-3d-gold',
    indexColor: '#000000',
    dialColor: '#FFFFFF',
    indexSize: 35,
    indexWidth: 10,
    indexRadius: 195,
    showCenterDot: true,
    showShadow: false,
    diameterMm: 42,
    paperSize: '13x18',
    indexMask: Array(12).fill(true),
    rotateMarkers: true,
    transparentBg: false,
    domeEnabled: false,
    domeCurvature: 30,
    domeStartRadius: 0,
    domeGlassShine: 50,
    domeLightAngle: 315
  });

  const [showPreview, setShowPreview] = useState(false);
  const [previewPhoto, setPreviewPhoto] = useState(null);
  const [previewConfig, setPreviewConfig] = useState({ x: 250, y: 345, r: 125, scale: 1.0 });

  // Sidebar collapse states
  const [canvasExpanded, setCanvasExpanded] = useState(true);
  const [compExpanded, setCompExpanded] = useState(false);
  const [indicesExpanded, setIndicesExpanded] = useState(false);
  const [domeExpanded, setDomeExpanded] = useState(false);

  // Color Extractor Modal state
  const [extractorModalOpen, setExtractorModalOpen] = useState(false);

  // Recent customized colors
  const [recentColors, setRecentColors] = useState(['#FF6600', '#B0B0B0', '#1E40AF', '#D4AF37', '#000000', '#FFFFFF']);

  // Batch print list queue
  const [batchList, setBatchList] = useState([]);

  // Undo / Redo History Stack
  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const isHistoryActionRef = useRef(false);

  const canvasRef = useRef(null);

  // Pre-load local asset images for image-based index presets
  useEffect(() => {
    const assetPresets = PRESET_INDEX_STYLES.filter(s => s.type === 'asset-image');
    const imagesMap = {};
    let loadedCount = 0;
    const total = assetPresets.length;
    if (total === 0) return;

    const onFinished = (key, img) => {
      if (img) imagesMap[key] = img;
      loadedCount++;
      if (loadedCount === total) setLoadedAssetImages({ ...imagesMap });
    };

    assetPresets.forEach(preset => {
      const img = new Image();
      img.onload  = () => onFinished(preset.src, img);
      img.onerror = () => onFinished(preset.src, null);
      img.src = preset.src;
    });
  }, []);

  // Record History State for Undo / Redo
  const saveStateToHistory = useCallback((currentLayers, currentDialSettings) => {
    if (isHistoryActionRef.current) {
      isHistoryActionRef.current = false;
      return;
    }
    const stateSnapshot = {
      layers: JSON.parse(JSON.stringify(currentLayers.map(l => ({ ...l, img: undefined, imgSrc: l.img ? l.img.src : undefined })))),
      dialSettings: { ...currentDialSettings }
    };
    setHistory(prev => {
      const newHistory = prev.slice(0, historyIndex + 1);
      return [...newHistory, stateSnapshot];
    });
    setHistoryIndex(prev => prev + 1);
  }, [historyIndex]);

  // Debounced History Saver
  useEffect(() => {
    const timer = setTimeout(() => {
      saveStateToHistory(layers, dialSettings);
    }, 400);
    return () => clearTimeout(timer);
  }, [layers, dialSettings, saveStateToHistory]);

  const undo = () => {
    if (historyIndex > 0) {
      isHistoryActionRef.current = true;
      const targetIndex = historyIndex - 1;
      const snapshot = history[targetIndex];
      restoreSnapshot(snapshot);
      setHistoryIndex(targetIndex);
    }
  };

  const redo = () => {
    if (historyIndex < history.length - 1) {
      isHistoryActionRef.current = true;
      const targetIndex = historyIndex + 1;
      const snapshot = history[targetIndex];
      restoreSnapshot(snapshot);
      setHistoryIndex(targetIndex);
    }
  };

  const restoreSnapshot = (snapshot) => {
    const restoredLayers = snapshot.layers.map(l => {
      if (l.type === 'image' && l.imgSrc) {
        const img = new Image();
        img.src = l.imgSrc;
        return { ...l, img };
      }
      return l;
    });
    setLayers(restoredLayers);
    setDialSettings(snapshot.dialSettings);
  };

  // Keyboard Shortcuts (Ctrl+Z / Ctrl+Y)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          redo();
        } else {
          undo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        redo();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [historyIndex, history]);

  const availableFonts = useMemo(() => [...DEFAULT_FONTS, ...customFonts], [customFonts]);

  // Reusable dial rendering callback for print & export
  const renderDial = useCallback((ctx, cx, cy, r, s) => {
    drawDialToContext(ctx, cx, cy, r, s, {
      layers,
      dialSettings,
      customMarkerImg,
      loadedAssetImages
    });
  }, [layers, dialSettings, customMarkerImg, loadedAssetImages]);

  const handleDownloadImage = () => {
    downloadDialImage(renderDial, dialSettings);
  };

  const handleGeneratePrint = () => {
    generatePrintSheet(renderDial, dialSettings, batchList);
  };

  const handleApplyDialColor = (color) => {
    setDialSettings(prev => ({
      ...prev,
      dialColor: color,
      transparentBg: false
    }));
    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toUpperCase() !== color.toUpperCase());
      return [color, ...filtered].slice(0, 8);
    });
  };

  const handleApplyIndexColor = (color) => {
    setDialSettings(prev => ({
      ...prev,
      indexColor: color
    }));
    setRecentColors(prev => {
      const filtered = prev.filter(c => c.toUpperCase() !== color.toUpperCase());
      return [color, ...filtered].slice(0, 8);
    });
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden text-slate-800 no-select bg-[#1a0f0d]">
      <Header
        showPreview={showPreview}
        setShowPreview={setShowPreview}
        downloadDialImage={handleDownloadImage}
        generatePrint={handleGeneratePrint}
        layers={layers}
        dialSettings={dialSettings}
        previewConfig={previewConfig}
        setLayers={setLayers}
        setDialSettings={setDialSettings}
        setPreviewConfig={setPreviewConfig}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        undo={undo}
        redo={redo}
      />

      <main className="flex flex-col lg:flex-row flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-full lg:w-[280px] bg-white border-b lg:border-b-0 lg:border-r overflow-y-auto p-3 lg:p-4 flex flex-col scrollbar-thin shrink-0 shadow-xl z-10 h-auto lg:h-full">
          <DialCanvasPanel
            canvasExpanded={canvasExpanded}
            setCanvasExpanded={setCanvasExpanded}
            dialSettings={dialSettings}
            setDialSettings={setDialSettings}
            recentColors={recentColors}
            setRecentColors={setRecentColors}
            onOpenColorExtractor={() => setExtractorModalOpen(true)}
          />

          <CompositionPanel
            compExpanded={compExpanded}
            setCompExpanded={setCompExpanded}
            layers={layers}
            setLayers={setLayers}
            selectedLayerIndex={selectedLayerIndex}
            setSelectedLayerIndex={setSelectedLayerIndex}
            availableFonts={availableFonts}
            customFonts={customFonts}
            setCustomFonts={setCustomFonts}
          />

          <IndicesPanel
            indicesExpanded={indicesExpanded}
            setIndicesExpanded={setIndicesExpanded}
            dialSettings={dialSettings}
            setDialSettings={setDialSettings}
            customMarkerImg={customMarkerImg}
            setCustomMarkerImg={setCustomMarkerImg}
            recentColors={recentColors}
            setRecentColors={setRecentColors}
          />

          <DomePanel
            domeExpanded={domeExpanded}
            setDomeExpanded={setDomeExpanded}
            dialSettings={dialSettings}
            setDialSettings={setDialSettings}
          />

          <OutputPanel
            dialSettings={dialSettings}
            setDialSettings={setDialSettings}
          />

          <PrintQueuePanel
            batchList={batchList}
            setBatchList={setBatchList}
            canvasRef={canvasRef}
            dialSettings={dialSettings}
          />
        </aside>

        {/* Canvas Editor Workspace */}
        <CanvasEditor
          canvasRef={canvasRef}
          layers={layers}
          setLayers={setLayers}
          selectedLayerIndex={selectedLayerIndex}
          dialSettings={dialSettings}
          customMarkerImg={customMarkerImg}
          loadedAssetImages={loadedAssetImages}
          onOpenColorExtractor={() => setExtractorModalOpen(true)}
        />

        {/* Watch Model Preview Studio */}
        <WatchPreview
          showPreview={showPreview}
          previewPhoto={previewPhoto}
          setPreviewPhoto={setPreviewPhoto}
          previewConfig={previewConfig}
          setPreviewConfig={setPreviewConfig}
          layers={layers}
          dialSettings={dialSettings}
          customMarkerImg={customMarkerImg}
          loadedAssetImages={loadedAssetImages}
        />
      </main>

      {/* Color Extractor from Image Modal */}
      <ColorExtractorModal
        isOpen={extractorModalOpen}
        onClose={() => setExtractorModalOpen(false)}
        onApplyDialColor={handleApplyDialColor}
        onApplyIndexColor={handleApplyIndexColor}
        layers={layers}
        currentDialColor={dialSettings.dialColor || '#FFFFFF'}
        currentDialSettings={dialSettings}
      />

      <footer className="bg-slate-900 text-white px-6 py-1 lg:py-1.5 flex items-center justify-between text-[8px] lg:text-[9px] font-black tracking-widest uppercase italic shrink-0 h-8">
        <div className="flex items-center gap-6">
          <span className="text-orange-500 font-bold">Engine: Modular React Vite</span>
          <span>Resolution: 300 DPI</span>
        </div>
        <span className="opacity-40 tracking-tighter italic">Studio Precision Tool © 2026</span>
      </footer>
    </div>
  );
}
