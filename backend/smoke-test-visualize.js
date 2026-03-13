#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
require('dotenv').config();

const {
  parseSmokeArgs,
  normalizeBaseUrl,
  inferMimeType,
  buildSmokeVisualizationFields,
  buildDefaultOutputPath,
  decodeGeneratedImage,
} = require('./smokeTest');

function printHelp() {
  console.log('Usage: npm run smoke -- <imagePath> [--base-url=http://localhost:3000] [--mode=single|multi] [--plant=Snake Plant] [--placement=corner floor] [--descriptions=text] [--style-preset=balancedModern] [--out=output.jpg]');
  console.log('Single example: npm run smoke -- ../room.jpg --plant="Monstera" --placement="table corner"');
  console.log('Multi example: npm run smoke -- ../room.jpg --mode=multi --descriptions="Snake Plant (corner floor), Pothos (window sill)" --style-preset=wallGrid');
}

async function main() {
  const options = parseSmokeArgs(process.argv.slice(2));
  if (options.help || !options.imagePath) {
    printHelp();
    process.exit(options.help ? 0 : 1);
  }

  const imagePath = path.resolve(process.cwd(), options.imagePath);
  if (!fs.existsSync(imagePath)) {
    console.error(`[SMOKE] Image not found: ${imagePath}`);
    process.exit(1);
  }

  const imageBuffer = fs.readFileSync(imagePath);
  const mimeType = inferMimeType(imagePath);
  const fields = buildSmokeVisualizationFields(options);
  const url = `${normalizeBaseUrl(options.baseUrl)}/api/visualize`;

  const formData = new FormData();
  formData.append('image', imageBuffer, {
    filename: path.basename(imagePath),
    contentType: mimeType,
  });
  Object.entries(fields).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      formData.append(key, value);
    }
  });

  console.log(`[SMOKE] Posting to ${url}`);
  console.log(`[SMOKE] Render style: ${fields.renderStyle}`);
  console.log(`[SMOKE] Style preset: ${fields.stylePreset || 'balancedModern'}`);
  if (fields.selectedPlantName) {
    console.log(`[SMOKE] Plant: ${fields.selectedPlantName}`);
    console.log(`[SMOKE] Placement: ${fields.selectedPlacement} (${fields.placementMode})`);
  } else {
    console.log(`[SMOKE] Plants: ${fields.plantDescriptions}`);
  }

  const response = await axios.post(url, formData, {
    headers: formData.getHeaders(),
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 120000,
  });

  const generated = decodeGeneratedImage(response.data?.imageUrl);
  if (!generated) {
    console.log('[SMOKE] Response did not contain a data URL image.');
    console.log(response.data);
    return;
  }

  const outputPath = path.resolve(
    process.cwd(),
    options.outputPath || buildDefaultOutputPath(imagePath, generated.extension)
  );
  fs.writeFileSync(outputPath, generated.buffer);

  console.log(`[SMOKE] Saved preview to ${outputPath}`);
  console.log(`[SMOKE] Masked flow: ${response.data?.masked ? 'yes' : 'no'}`);
  console.log(`[SMOKE] Placement mode: ${response.data?.placementMode || fields.placementMode}`);
}

main().catch((error) => {
  const status = error.response?.status;
  const payload = error.response?.data;
  console.error(`[SMOKE] Request failed${status ? ` (${status})` : ''}`);
  if (payload) console.error(payload);
  else console.error(error.message);
  process.exit(1);
});