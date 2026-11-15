export const drawText = (ctx, layer, centerX, centerY, scaleFactor) => {
  const fs = layer.size * scaleFactor;
  ctx.save();
  ctx.font = `${layer.isBold ? 'bold' : ''} ${fs}px "${layer.font}"`;
  ctx.fillStyle = layer.color;
  ctx.globalAlpha = layer.opacity !== undefined ? layer.opacity : 1.0;
  
  if (layer.shadow) {
    ctx.shadowBlur = 4 * scaleFactor;
    ctx.shadowColor = 'rgba(0,0,0,0.5)';
    ctx.shadowOffsetX = 2 * scaleFactor;
    ctx.shadowOffsetY = 2 * scaleFactor;
  } else {
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
  }

  if (layer.curved) {
    const radius = layer.radius * scaleFactor;
    const spacing = (layer.spacing !== undefined ? layer.spacing : 2) * scaleFactor;
    
    // Handle Hebrew / RTL characters properly in clockwise arc
    const isHebrew = /[\u0590-\u05FF]/.test(layer.text);
    const processedText = isHebrew ? layer.text.split('').reverse().join('') : layer.text;
    const chars = processedText.split('');
    
    // Measure each character dynamically under current font metrics, tracking kerning changes
    const charWidths = chars.map((char, i) => {
      const currentWidth = ctx.measureText(processedText.slice(0, i + 1)).width;
      const prevWidth = i > 0 ? ctx.measureText(processedText.slice(0, i)).width : 0;
      return currentWidth - prevWidth;
    });
    
    // Map out precise flat baseline horizontal offsets for centers to maintain correct kerning
    let currentX = 0;
    const charCenters = [];
    for (let i = 0; i < chars.length; i++) {
      const charW = charWidths[i];
      const charCenter = currentX + charW / 2;
      charCenters.push(charCenter);
      currentX += charW + spacing;
    }
    
    const totalStringWidth = chars.length > 0 ? currentX - spacing : 0;
    const startRad = (layer.startAngle * Math.PI) / 180;
    
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    
    // Rotate and translate perfectly centered around our starting angle anchor
    chars.forEach((char, i) => {
      const charW = charWidths[i];
      const offsetFromCenter = charCenters[i] - totalStringWidth / 2;
      const targetAngle = startRad + offsetFromCenter / radius;
      
      ctx.save();
      ctx.translate(centerX + Math.cos(targetAngle) * radius, centerY + Math.sin(targetAngle) * radius);
      ctx.rotate(targetAngle + Math.PI / 2);
      ctx.fillText(char, -charW / 2, 0);
      ctx.restore();
    });
  } else {
    ctx.save();
    ctx.translate(centerX + (layer.x - 250) * scaleFactor, centerY + (layer.y - 250) * scaleFactor);
    ctx.rotate((layer.rotation || 0) * Math.PI / 180);
    ctx.fillText(layer.text, 0, 0);
    ctx.restore();
  }
  ctx.restore();
  ctx.globalAlpha = 1.0;
};
