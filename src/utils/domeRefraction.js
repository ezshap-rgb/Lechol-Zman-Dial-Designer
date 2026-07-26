export const applyDomeWarp = (sourceCanvas, destCtx, centerX, centerY, radius, settings) => {
  const width = sourceCanvas.width;
  const height = sourceCanvas.height;
  const srcCtx = sourceCanvas.getContext('2d');
  const srcData = srcCtx.getImageData(0, 0, width, height);
  const dstData = destCtx.createImageData(width, height);
  
  const srcPixels = srcData.data;
  const dstPixels = dstData.data;
  
  const curvature = settings.domeCurvature / 100;
  const domeStart = (settings.domeStartRadius !== undefined ? settings.domeStartRadius : 0) / 100;
  
  const radAngle = (settings.domeLightAngle * Math.PI) / 180;
  const lx = Math.cos(radAngle) * 0.707;
  const ly = Math.sin(radAngle) * 0.707;
  const lz = 0.707;
  
  const shineCoeff = settings.domeGlassShine / 100;
  
  const rMax = Math.ceil(radius);
  const yMin = Math.max(0, centerY - rMax);
  const yMax = Math.min(height - 1, centerY + rMax);
  const xMin = Math.max(0, centerX - rMax);
  const xMax = Math.min(width - 1, centerX + rMax);

  for (let i = 0; i < srcPixels.length; i++) {
    dstPixels[i] = srcPixels[i];
  }
  
  for (let y = yMin; y <= yMax; y++) {
    const dy = y - centerY;
    const dySq = dy * dy;
    const yOffset = y * width;
    for (let x = xMin; x <= xMax; x++) {
      const dx = x - centerX;
      const rSq = dx * dx + dySq;
      const r = Math.sqrt(rSq);
      const idx = (yOffset + x) * 4;
      
      if (r > radius) continue;
      
      const u = r / radius;
      let uSrc = u;
      let nx = 0;
      let ny = 0;
      let nz = 1;

      if (u >= domeStart) {
        const denom = 1.0 - domeStart;
        const t = denom > 0 ? (u - domeStart) / denom : 0;
        
        const bulge = curvature * t * (1.0 - t);
        uSrc = domeStart + denom * t * (1.0 + bulge);
        
        uSrc = Math.max(0, Math.min(1, uSrc));

        nx = (dx / radius) * t * curvature;
        ny = (dy / radius) * t * curvature;
        const nzSq = 1.0 - nx * nx - ny * ny;
        nz = nzSq > 0 ? Math.sqrt(nzSq) : 0;
      }
      
      const factor = r > 0 ? (uSrc * radius) / r : 0;
      const srcX = centerX + dx * factor;
      const srcY = centerY + dy * factor;
      
      const x0 = Math.floor(srcX);
      const x1 = Math.min(width - 1, x0 + 1);
      const y0 = Math.floor(srcY);
      const y1 = Math.min(height - 1, y0 + 1);
      
      const tx = srcX - x0;
      const ty = srcY - y0;
      
      const idx00 = (y0 * width + x0) * 4;
      const idx10 = (y0 * width + x1) * 4;
      const idx01 = (y1 * width + x0) * 4;
      const idx11 = (y1 * width + x1) * 4;
      
      const rVal = (1 - ty) * ((1 - tx) * srcPixels[idx00] + tx * srcPixels[idx10]) + ty * ((1 - tx) * srcPixels[idx01] + tx * srcPixels[idx11]);
      const gVal = (1 - ty) * ((1 - tx) * srcPixels[idx00+1] + tx * srcPixels[idx10+1]) + ty * ((1 - tx) * srcPixels[idx01+1] + tx * srcPixels[idx11+1]);
      const bVal = (1 - ty) * ((1 - tx) * srcPixels[idx00+2] + tx * srcPixels[idx10+2]) + ty * ((1 - tx) * srcPixels[idx01+2] + tx * srcPixels[idx11+2]);
      const aVal = (1 - ty) * ((1 - tx) * srcPixels[idx00+3] + tx * srcPixels[idx10+3]) + ty * ((1 - tx) * srcPixels[idx01+3] + tx * srcPixels[idx11+3]);
      
      const nLen = Math.sqrt(nx * nx + ny * ny + nz * nz);
      const nnx = nLen > 0 ? nx / nLen : 0;
      const nny = nLen > 0 ? ny / nLen : 0;
      const nnz = nLen > 0 ? nz / nLen : 1;
      
      const dotNL = Math.max(0, nnx * lx + nny * ly + nnz * lz);
      
      const hx = lx;
      const hy = ly;
      const hz = lz + 1.0;
      const hLen = Math.sqrt(hx * hx + hy * hy + hz * hz);
      const nhx = hx / hLen;
      const nhy = hz / hLen;
      const nhz = hz / hLen;
      
      const dotNH = Math.max(0, nnx * nhx + nny * nhy + nnz * nhz);
      const specular = Math.pow(dotNH, 16) * shineCoeff;
      
      const ambient = 0.85;
      const litIntensity = ambient + dotNL * 0.15;
      
      dstPixels[idx] = Math.min(255, rVal * litIntensity + specular * 255);
      dstPixels[idx+1] = Math.min(255, gVal * litIntensity + specular * 255);
      dstPixels[idx+2] = Math.min(255, bVal * litIntensity + specular * 255);
      dstPixels[idx+3] = aVal;
    }
  }
  destCtx.putImageData(dstData, 0, 0);
};
