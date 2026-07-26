export const saveProjectFile = (layers, dialSettings, previewConfig) => {
  const serializableLayers = layers.map(layer => {
    if (layer.type === 'image' && layer.img) {
      return {
        ...layer,
        imgSrc: layer.img.src,
        img: undefined
      };
    }
    return layer;
  });

  const projectData = {
    version: '1.0',
    timestamp: new Date().toISOString(),
    dialSettings,
    previewConfig,
    layers: serializableLayers
  };

  const jsonString = JSON.stringify(projectData, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `watch_dial_${dialSettings.diameterMm || 42}mm_${Date.now()}.json`;
  link.click();
  URL.revokeObjectURL(url);
};

export const loadProjectFile = (file, onSuccess) => {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const projectData = JSON.parse(e.target.result);
      if (!projectData.layers || !projectData.dialSettings) {
        alert('Invalid project file format.');
        return;
      }
      
      const loadedLayers = projectData.layers.map(layer => {
        if (layer.type === 'image' && layer.imgSrc) {
          const img = new Image();
          img.src = layer.imgSrc;
          return { ...layer, img };
        }
        return layer;
      });

      onSuccess({
        dialSettings: projectData.dialSettings,
        previewConfig: projectData.previewConfig || { x: 250, y: 345, r: 125, scale: 1.0 },
        layers: loadedLayers
      });
    } catch (err) {
      alert('Error parsing project file: ' + err.message);
    }
  };
  reader.readAsText(file);
};
