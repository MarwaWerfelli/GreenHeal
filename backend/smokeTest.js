const path = require('path');
const { detectPlacementMode } = require('./visualization');

function parseSmokeArgs(argv = [], env = process.env) {
  const options = {
    baseUrl: env.GREENHEAL_BACKEND_URL || 'http://localhost:3000',
    mode: 'single',
    plantName: 'Snake Plant',
    placement: 'corner floor',
    descriptions: '',
    stylePreset: 'balancedModern',
    outputPath: '',
    help: false,
    imagePath: '',
  };

  argv.forEach((arg) => {
    if (arg === '--help' || arg === '-h') options.help = true;
    else if (arg.startsWith('--base-url=')) options.baseUrl = arg.split('=').slice(1).join('=');
    else if (arg.startsWith('--mode=')) options.mode = arg.split('=').slice(1).join('=');
    else if (arg.startsWith('--plant=')) options.plantName = arg.split('=').slice(1).join('=');
    else if (arg.startsWith('--placement=')) options.placement = arg.split('=').slice(1).join('=');
    else if (arg.startsWith('--descriptions=')) options.descriptions = arg.split('=').slice(1).join('=');
    else if (arg.startsWith('--style-preset=')) options.stylePreset = arg.split('=').slice(1).join('=');
    else if (arg.startsWith('--out=')) options.outputPath = arg.split('=').slice(1).join('=');
    else if (!arg.startsWith('--') && !options.imagePath) options.imagePath = arg;
  });

  return options;
}

function normalizeBaseUrl(baseUrl = '') {
  return (baseUrl || 'http://localhost:3000').replace(/\/+$/, '');
}

function inferMimeType(filePath = '') {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === '.png') return 'image/png';
  if (ext === '.webp') return 'image/webp';
  return 'image/jpeg';
}

function buildSmokeVisualizationFields({
  mode = 'single',
  plantName,
  placement,
  descriptions,
  stylePreset = 'balancedModern',
}) {
  if (mode === 'multi') {
    return {
      plantDescriptions:
        descriptions ||
        'Snake Plant (corner floor), Pothos (window sill), Peace Lily (table corner)',
      renderStyle: 'same-room-multi-plant',
      stylePreset,
    };
  }

  const placementMode = detectPlacementMode(placement);
  return {
    plantDescriptions: descriptions || `${plantName} (${placement})`,
    selectedPlantName: plantName,
    selectedPlacement: placement,
    placementMode,
    renderStyle: 'same-room-single-plant',
    stylePreset,
  };
}

function buildDefaultOutputPath(imagePath, extension = '.jpg') {
  const parsed = path.parse(imagePath);
  return path.join(parsed.dir, `${parsed.name}.greenheal-preview${extension}`);
}

function decodeGeneratedImage(imageUrl) {
  const match = /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/.exec(imageUrl || '');
  if (!match) return null;
  const mimeType = match[1];
  const buffer = Buffer.from(match[2], 'base64');
  const extension = mimeType === 'image/png' ? '.png' : mimeType === 'image/webp' ? '.webp' : '.jpg';
  return { mimeType, buffer, extension };
}

module.exports = {
  parseSmokeArgs,
  normalizeBaseUrl,
  inferMimeType,
  buildSmokeVisualizationFields,
  buildDefaultOutputPath,
  decodeGeneratedImage,
};