// Utility functions for Color Extraction, EyeDropper, and Palette Generation

export const rgbToHex = (r, g, b) => {
  const toHex = (n) => {
    const clamped = Math.max(0, Math.min(255, Math.round(n)));
    const hex = clamped.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

export const hexToRgb = (hex) => {
  if (!hex) return { r: 255, g: 255, b: 255 };
  let clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  if (clean.length !== 6) return { r: 255, g: 255, b: 255 };
  const num = parseInt(clean, 16);
  if (isNaN(num)) return { r: 255, g: 255, b: 255 };
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
};

export const isValidHex = (hex) => {
  if (!hex || typeof hex !== 'string') return false;
  return /^#?([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/.test(hex.trim());
};

export const formatHex = (hex) => {
  if (!hex) return '#FFFFFF';
  let clean = hex.trim();
  if (!clean.startsWith('#')) clean = '#' + clean;
  return clean.toUpperCase();
};

export const hasNativeEyeDropper = () => {
  return typeof window !== 'undefined' && 'EyeDropper' in window;
};

export const openNativeEyeDropper = async () => {
  if (!hasNativeEyeDropper()) {
    throw new Error('EyeDropper API is not supported in this browser.');
  }
  // eslint-disable-next-line no-undef
  const dropper = new window.EyeDropper();
  const res = await dropper.open();
  return res && res.sRGBHex ? res.sRGBHex.toUpperCase() : null;
};

// Calculate Euclidean color distance between two RGB colors
const colorDistance = (c1, c2) => {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

/**
 * Extracts the top dominant colors from an Image or Canvas element.
 * Uses color quantization with minimum perceptual distance filtering.
 */
export const extractDominantColors = (imageSource, maxColors = 8) => {
  return new Promise((resolve) => {
    try {
      const sampleSize = 100; // 100x100 = 10,000 pixels is plenty and instantaneous
      const canvas = document.createElement('canvas');
      canvas.width = sampleSize;
      canvas.height = sampleSize;
      const ctx = canvas.getContext('2d', { willReadFrequently: true });
      if (!ctx) {
        resolve([]);
        return;
      }

      ctx.drawImage(imageSource, 0, 0, sampleSize, sampleSize);
      const imgData = ctx.getImageData(0, 0, sampleSize, sampleSize).data;

      // Group colors into quantized buckets (4-bit per channel = 4096 bins)
      const colorBuckets = {};

      for (let i = 0; i < imgData.length; i += 16) { // step by 4 pixels (16 bytes)
        const r = imgData[i];
        const g = imgData[i + 1];
        const b = imgData[i + 2];
        const a = imgData[i + 3];

        // Skip transparent or near-transparent pixels
        if (a < 128) continue;

        // 4-bit quantization (groups similar subtle shades)
        const qr = (r >> 4) << 4;
        const qg = (g >> 4) << 4;
        const qb = (b >> 4) << 4;
        const key = `${qr},${qg},${qb}`;

        if (!colorBuckets[key]) {
          colorBuckets[key] = { r: qr + 8, g: qg + 8, b: qb + 8, count: 1 };
        } else {
          colorBuckets[key].count++;
        }
      }

      // Sort buckets by frequency
      const sortedBuckets = Object.values(colorBuckets).sort((a, b) => b.count - a.count);

      // Select distinct colors with a minimum color distance threshold (e.g. 40)
      const selectedColors = [];
      const MIN_DIST = 38;

      for (const bucket of sortedBuckets) {
        const isTooClose = selectedColors.some(c => colorDistance(c, bucket) < MIN_DIST);
        if (!isTooClose) {
          selectedColors.push(bucket);
          if (selectedColors.length >= maxColors) break;
        }
      }

      // Format as hex strings
      const hexList = selectedColors.map(c => rgbToHex(c.r, c.g, c.b));
      resolve(hexList);
    } catch (err) {
      console.warn('Could not extract palette:', err);
      resolve([]);
    }
  });
};

