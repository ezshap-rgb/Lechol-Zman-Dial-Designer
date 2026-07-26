export const DPI = 300;
export const MM_TO_INCH = 1 / 25.4;

export const PAPER_SIZES = [
  { id: '13x18', name: '13x18 cm', wMm: 130, hMm: 180 },
  { id: '10x15', name: '10x15 cm', wMm: 100, hMm: 150 }
];

export const DEFAULT_FONTS = [
  { id: 'Inter', name: 'Sans' },
  { id: 'Playfair Display', name: 'Serif' },
  { id: 'IBM Plex Sans Hebrew', name: 'Hebrew' },
  { id: 'Roboto Mono', name: 'Mono' }
];

export const PRESET_INDEX_STYLES = [
  { id: 'ktm-3d-gold', name: 'Faceted Gold (3D)', type: 'indices-3d', baseColor: '#D4AF37', facetColor: '#FDF1B8', shadowColor: '#5C4410' },
  { id: 'ktm-3d-silver', name: 'Faceted Silver (3D)', type: 'indices-3d', baseColor: '#B0B0B0', facetColor: '#FFFFFF', shadowColor: '#333333' },
  { id: 'ktm-batons', name: 'Classic Batons', type: 'indices', shape: 'rect' },
  { id: 'small-circles', name: 'Small Circles', type: 'circles' },
  { id: 'asset-gold-indice', name: 'Asset: Gold Indice (PNG)', type: 'asset-image', src: '/assets/indices/gold_indice.png' },
  { id: 'asset-gold-light-indice', name: 'Asset: Gold Light Indice (PNG)', type: 'asset-image', src: '/assets/indices/gold_indice_light.png' },
  { id: 'asset-silver-indice', name: 'Asset: Silver Indice (PNG)', type: 'asset-image', src: '/assets/indices/silver_indice.png' },
  { id: 'custom-image', name: 'Custom Marker Image', type: 'custom' },
  { id: 'none', name: 'None (Clean)', type: 'none' },
  { id: 'classic-arabic', name: 'Arabic Numbers', type: 'numbers', values: [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11] }
];

export const PRESET_WATCH_MODELS = [
  { id: 'rolex-silver', name: 'Rolex Silver', src: '/assets/models/Rolex_silver.jpg' },
  { id: 'gold-brown', name: 'Gold & Brown Leather', src: '/assets/models/Gold_Brown.jpg' },
  { id: 'silver-black', name: 'Silver & Black Leather', src: '/assets/models/silver_black.jpg' },
  { id: 'silver-brown', name: 'Silver & Brown Leather', src: '/assets/models/silver_brown.jpg' },
  { id: 'silver-silver', name: 'Silver & Silver Steel', src: '/assets/models/silver_silver.jpg' },
  { id: 'wood-case', name: 'Wood Case', src: '/assets/models/wood.jpg' }
];

export const COLORS = [
  { name: 'White', value: '#FFFFFF' },
  { name: 'Black', value: '#000000' },
  { name: 'Gold', value: '#D4AF37' },
  { name: 'Silver', value: '#C0C0C0' },
  { name: 'Blue', value: '#1E40AF' }
];

export const WATCH_HAND_FINISHES = [
  { id: 'silver', name: 'Silver', fill: '#D1D5DB', stroke: '#374151' },
  { id: 'gold', name: 'Gold', fill: '#F59E0B', stroke: '#78350F' },
  { id: 'black', name: 'Black', fill: '#1F2937', stroke: '#111827' },
  { id: 'rosegold', name: 'Rose Gold', fill: '#E0A96D', stroke: '#6A3814' }
];
