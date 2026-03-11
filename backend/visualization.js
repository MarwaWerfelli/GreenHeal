const zlib = require('zlib');

function detectPlacementMode(placement = '') {
  const normalized = placement.toLowerCase();
  if (normalized.includes('wall') || normalized.includes('hanging')) return 'wall';
  if (normalized.includes('shelf') || normalized.includes('bookcase') || normalized.includes('ledge')) return 'shelf';
  if (normalized.includes('table') || normalized.includes('desk') || normalized.includes('counter') || normalized.includes('nightstand')) return 'table';
  if (normalized.includes('window') || normalized.includes('sill')) return 'window';
  return 'corner';
}

function getPlacementInstruction(mode, placementText = '') {
  switch (mode) {
    case 'wall': return `Mount the plant naturally on the wall as a modern hanging planter at ${placementText}.`;
    case 'shelf': return `Place the plant cleanly on the shelf area at ${placementText} with realistic depth and contact shadow.`;
    case 'table': return `Place the plant on the described furniture surface at ${placementText} with accurate scale and tabletop shadow.`;
    case 'window': return `Stage the plant near the window area at ${placementText} while keeping the surrounding architecture unchanged.`;
    default: return `Place the plant on the floor in the described corner area at ${placementText} with a soft realistic shadow.`;
  }
}

function buildVisualizationPrompt({ plantDescriptions, selectedPlantName, selectedPlacement, placementMode }) {
  const mode = placementMode || detectPlacementMode(selectedPlacement || plantDescriptions || '');
  const placementText = selectedPlacement || plantDescriptions || 'the recommended placement';
  const subject = selectedPlantName ? `${selectedPlantName} in a modern planter` : `these healing plants: ${plantDescriptions}`;
  return `Edit this exact room photo and preserve the room as-is. Keep the existing layout, walls, floor, ceiling, furniture, decor, lighting, shadows, colors, and camera angle unchanged. Add only ${subject}. ${getPlacementInstruction(mode, placementText)} Match the original perspective, proportions, and lighting. Do not redesign, restyle, or add any extra objects. Photorealistic same-room interior plant staging.`;
}

function getDefaultMaskConfig(mode = 'corner') {
  switch (mode) {
    case 'wall': return { centerX: 0.78, centerY: 0.22, width: 0.2, height: 0.28 };
    case 'shelf': return { centerX: 0.7, centerY: 0.34, width: 0.22, height: 0.24 };
    case 'table': return { centerX: 0.58, centerY: 0.56, width: 0.22, height: 0.24 };
    case 'window': return { centerX: 0.24, centerY: 0.32, width: 0.2, height: 0.28 };
    default: return { centerX: 0.78, centerY: 0.74, width: 0.24, height: 0.34 };
  }
}

function clampRatio(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function coerceRatio(rawValue, fallback, min = 0.05, max = 0.95) {
  if (rawValue === undefined || rawValue === null || rawValue === '') return fallback;
  const parsed = Number(rawValue);
  if (!Number.isFinite(parsed)) return fallback;
  const normalized = parsed > 1 ? parsed / 100 : parsed;
  return clampRatio(normalized, min, max);
}

function buildMaskConfig({ placementMode, maskCenterX, maskCenterY, maskWidth, maskHeight }) {
  const defaults = getDefaultMaskConfig(placementMode);
  return {
    centerX: coerceRatio(maskCenterX, defaults.centerX, 0.05, 0.95),
    centerY: coerceRatio(maskCenterY, defaults.centerY, 0.05, 0.95),
    width: coerceRatio(maskWidth, defaults.width, 0.08, 0.75),
    height: coerceRatio(maskHeight, defaults.height, 0.08, 0.8),
  };
}

function getImageDimensions(buffer, mimeType = '') {
  if (!buffer || buffer.length < 24) return { width: 1024, height: 1024 };
  const isPng = mimeType === 'image/png' || buffer.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
  if (isPng) return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  const isJpeg = mimeType === 'image/jpeg' || (buffer[0] === 0xff && buffer[1] === 0xd8);
  if (isJpeg) {
    let offset = 2;
    while (offset < buffer.length - 9) {
      if (buffer[offset] !== 0xff) { offset += 1; continue; }
      const marker = buffer[offset + 1];
      const length = buffer.readUInt16BE(offset + 2);
      const isStartOfFrame = marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker);
      if (isStartOfFrame) {
        return { width: buffer.readUInt16BE(offset + 7), height: buffer.readUInt16BE(offset + 5) };
      }
      offset += 2 + length;
    }
  }
  return { width: 1024, height: 1024 };
}

function getMaskCanvasSize({ width, height }) {
  const safeWidth = Math.max(64, width || 1024);
  const safeHeight = Math.max(64, height || 1024);
  const scale = Math.min(1, 1024 / Math.max(safeWidth, safeHeight));
  return { width: Math.max(64, Math.round(safeWidth * scale)), height: Math.max(64, Math.round(safeHeight * scale)) };
}

const CRC_TABLE = new Uint32Array(256).map((_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) value = (value & 1) ? (0xedb88320 ^ (value >>> 1)) : (value >>> 1);
  return value >>> 0;
});

function crc32(buffer) {
  let crc = 0xffffffff;
  for (let i = 0; i < buffer.length; i += 1) crc = CRC_TABLE[(crc ^ buffer[i]) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

function createChunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const chunk = Buffer.alloc(12 + data.length);
  chunk.writeUInt32BE(data.length, 0);
  typeBuffer.copy(chunk, 4);
  data.copy(chunk, 8);
  chunk.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), data.length + 8);
  return chunk;
}

function createPlacementMaskPng({ width, height, maskConfig }) {
  const rgba = Buffer.alloc(width * height * 4, 0);
  const cx = maskConfig.centerX * width;
  const cy = maskConfig.centerY * height;
  const rx = Math.max(8, (maskConfig.width * width) / 2);
  const ry = Math.max(8, (maskConfig.height * height) / 2);
  const outerRx = rx + Math.max(6, rx * 0.16);
  const outerRy = ry + Math.max(6, ry * 0.16);

  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const inner = (((x - cx) ** 2) / (rx ** 2)) + (((y - cy) ** 2) / (ry ** 2));
      const outer = (((x - cx) ** 2) / (outerRx ** 2)) + (((y - cy) ** 2) / (outerRy ** 2));
      let value = 0;
      if (inner <= 1) value = 255;
      else if (outer <= 1) value = Math.round((1 - ((outer - 1) / Math.max(outer - inner, 0.0001))) * 160);
      const index = (y * width + x) * 4;
      rgba[index] = value;
      rgba[index + 1] = value;
      rgba[index + 2] = value;
      rgba[index + 3] = 255;
    }
  }

  const raw = Buffer.alloc(height * (1 + width * 4));
  for (let y = 0; y < height; y += 1) {
    const rawOffset = y * (1 + width * 4);
    raw[rawOffset] = 0;
    rgba.copy(raw, rawOffset + 1, y * width * 4, (y + 1) * width * 4);
  }

  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const pngSignature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([pngSignature, createChunk('IHDR', ihdr), createChunk('IDAT', zlib.deflateSync(raw)), createChunk('IEND', Buffer.alloc(0))]);
}

module.exports = {
  detectPlacementMode,
  getPlacementInstruction,
  buildVisualizationPrompt,
  buildMaskConfig,
  getImageDimensions,
  getMaskCanvasSize,
  createPlacementMaskPng,
};