const zlib = require('zlib');

function includesAnyKeyword(text, keywords) {
  return keywords.some((keyword) => text.includes(keyword));
}

function detectPlacementMode(placement = '') {
  const normalized = placement.toLowerCase();
  if (includesAnyKeyword(normalized, ['hanging', 'ceiling', 'suspended', 'pendant', 'macrame'])) return 'hanging';
  if (includesAnyKeyword(normalized, ['wall', 'mounted', 'mount', 'grid', 'frame', 'geometric', 'modular', 'rail'])) return 'wall';
  if (includesAnyKeyword(normalized, ['shelf', 'bookcase', 'ledge', 'mantel', 'etagere'])) return 'shelf';
  if (includesAnyKeyword(normalized, ['table', 'desk', 'counter', 'nightstand', 'console', 'coffee table', 'side table'])) return 'table';
  if (includesAnyKeyword(normalized, ['window', 'sill', 'bay window'])) return 'window';
  return 'corner';
}

function getPlacementInstruction(mode, placementText = '') {
  switch (mode) {
    case 'hanging': return `Integrate the plant naturally at ${placementText} as a compact ceiling-hung planter with slim visible cords or rod anchored to the ceiling, believable weight, and no floating foliage in open air.`;
    case 'wall': return `Integrate the plant naturally at ${placementText} as a compact geometric wall-mounted planter or refined black-metal frame planter, visibly fixed to the wall with realistic depth, support, and soft shadow.`;
    case 'shelf': return `Style the plant neatly at ${placementText} on a shelf or ledge using a compact planter that sits fully on the surface with realistic depth, contact shadow, and clear surface support.`;
    case 'table': return `Place the plant at ${placementText} as a small or medium tabletop plant with a compact planter, accurate scale, visible contact with the furniture, and most of the surface still open.`;
    case 'window': return `Stage the plant elegantly at ${placementText} near the window on a real sill, ledge, or planter stand with natural daylight, restrained size, and unchanged surrounding architecture.`;
    default: return `Place the plant elegantly at ${placementText} in the corner as a modest floor plant near the wall with a modern planter, grounded base, and soft contact shadow.`;
  }
}

function getStyleInstruction(stylePreset = 'balancedModern') {
  switch (stylePreset) {
    case 'wallGrid':
      return 'Steer the styling toward a refined wall-led composition with neat alignment, compact geometric planters, and clearly visible support where appropriate.';
    case 'hanging':
      return 'Steer the styling toward an airy modern composition with at most one compact hanging planter and any companion plants grounded nearby with believable support.';
    case 'shelfStyling':
      return 'Steer the styling toward curated shelf and ledge styling with neat spacing, varied heights, and fully supported planters.';
    case 'cornerRetreat':
      return 'Steer the styling toward a calming corner retreat with layered heights near a nook or wall edge while keeping walkways open.';
    default:
      return 'Steer the styling toward a balanced modern arrangement with clean spacing, restrained styling, and subtle variation in height.';
  }
}

function buildVisualizationPrompt({
  plantDescriptions,
  selectedPlantName,
  selectedPlacement,
  placementMode,
  renderStyle = 'same-room-single-plant',
  stylePreset = 'balancedModern',
}) {
  const mode = placementMode || detectPlacementMode(selectedPlacement || plantDescriptions || '');
  const placementText = selectedPlacement || plantDescriptions || 'the recommended placement';
  const styleInstruction = getStyleInstruction(stylePreset);
  if (renderStyle === 'same-room-multi-plant') {
    return `Edit this exact room photo and preserve the room as-is. Keep the existing layout, walls, floor, ceiling, furniture, decor, lighting, shadows, colors, and camera angle unchanged. Add only these healing plants: ${plantDescriptions}. Arrange them together as one cohesive, restrained composition that follows the suggested placements from this list: ${plantDescriptions}. ${styleInstruction} Keep each plant compact-to-medium relative to the room, use believable spacing with subtle variation in height, and leave enough negative space so the room still feels open and calm. Every plant must physically rest on a real floor, shelf, table, ledge, sill, or stand, or be visibly mounted to the wall or ceiling with realistic support. If any plant is hanging, show the visible support attaching it to the ceiling. If any plant is wall-mounted, show a compact modern geometric planter support fixed to the wall. Do not duplicate plants or add extra planters beyond the listed plants. Do not make the cluster oversized, dominant, floating, pasted-on, unsupported, or centered as the main subject. Do not block walkways, large furniture areas, windows, doors, or important room features. Keep the arrangement refined, minimal, and photorealistic. Do not redesign the room or add extra objects. Photorealistic same-room interior multi-plant staging.`;
  }
  const subject = selectedPlantName ? `${selectedPlantName} in a modern planter` : `these healing plants: ${plantDescriptions}`;
  return `Edit this exact room photo and preserve the room as-is. Keep the existing layout, walls, floor, ceiling, furniture, decor, lighting, shadows, colors, and camera angle unchanged. Add only ${subject}. ${getPlacementInstruction(mode, placementText)} ${styleInstruction} Match the original perspective, room scale, and lighting perfectly. The plant must feel beautifully staged for a calm modern healing interior, with subtle placement, believable contact shadows, and realistic depth. The plant must physically rest on a real floor, shelf, table, ledge, sill, or stand, or be visibly mounted to the wall or ceiling. If the placement is hanging, show the visible support attaching it to the ceiling. If the placement is wall-mounted, show a compact modern geometric planter support fixed to the wall. Keep the plant small-to-medium relative to the room and use at most one restrained planter installation for the selected plant. Do not make the plant oversized, dominant, floating, pasted-on, unsupported, or centered as the main subject. Do not block walkways, large furniture areas, windows, doors, or important room features. Keep the planter refined, minimal, and realistic. Do not redesign the room or add extra objects. Photorealistic same-room interior plant staging.`;
}

function getDefaultMaskConfig(mode = 'corner') {
  switch (mode) {
    case 'hanging': return { centerX: 0.56, centerY: 0.18, width: 0.16, height: 0.24 };
    case 'wall': return { centerX: 0.72, centerY: 0.34, width: 0.18, height: 0.24 };
    case 'shelf': return { centerX: 0.68, centerY: 0.35, width: 0.16, height: 0.18 };
    case 'table': return { centerX: 0.58, centerY: 0.56, width: 0.15, height: 0.17 };
    case 'window': return { centerX: 0.24, centerY: 0.32, width: 0.14, height: 0.2 };
    default: return { centerX: 0.78, centerY: 0.76, width: 0.16, height: 0.22 };
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
    width: coerceRatio(maskWidth, defaults.width, 0.08, 0.42),
    height: coerceRatio(maskHeight, defaults.height, 0.08, 0.48),
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