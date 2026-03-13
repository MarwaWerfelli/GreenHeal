const path = require('path');
const {
  parseSmokeArgs,
  normalizeBaseUrl,
  buildSmokeVisualizationFields,
  buildDefaultOutputPath,
  decodeGeneratedImage,
} = require('../backend/smokeTest');

describe('backend smoke test helpers', () => {
  test('parses cli arguments with overrides', () => {
    const options = parseSmokeArgs([
      'room.jpg',
      '--base-url=http://localhost:9999/',
      '--mode=multi',
      '--plant=Monstera',
      '--placement=table corner',
      '--descriptions=Snake Plant (corner floor), Pothos (window sill)',
      '--style-preset=wallGrid',
      '--out=result.jpg',
    ]);

    expect(options.imagePath).toBe('room.jpg');
    expect(options.baseUrl).toBe('http://localhost:9999/');
    expect(options.mode).toBe('multi');
    expect(options.plantName).toBe('Monstera');
    expect(options.placement).toBe('table corner');
    expect(options.descriptions).toBe('Snake Plant (corner floor), Pothos (window sill)');
    expect(options.stylePreset).toBe('wallGrid');
    expect(options.outputPath).toBe('result.jpg');
  });

  test('builds same-room visualization fields', () => {
    expect(buildSmokeVisualizationFields({
      mode: 'single',
      plantName: 'Monstera',
      placement: 'table corner',
      descriptions: '',
      stylePreset: 'balancedModern',
    })).toEqual({
      plantDescriptions: 'Monstera (table corner)',
      selectedPlantName: 'Monstera',
      selectedPlacement: 'table corner',
      placementMode: 'table',
      renderStyle: 'same-room-single-plant',
      stylePreset: 'balancedModern',
    });
  });

  test('builds multi-plant visualization fields', () => {
    expect(buildSmokeVisualizationFields({
      mode: 'multi',
      descriptions: 'Snake Plant (corner floor), Peace Lily (table corner)',
      stylePreset: 'shelfStyling',
    })).toEqual({
      plantDescriptions: 'Snake Plant (corner floor), Peace Lily (table corner)',
      renderStyle: 'same-room-multi-plant',
      stylePreset: 'shelfStyling',
    });
  });

  test('normalizes base urls and default output paths', () => {
    expect(normalizeBaseUrl('http://localhost:3000///')).toBe('http://localhost:3000');
    expect(buildDefaultOutputPath('C:/tmp/room.jpg', '.png')).toBe(
      path.normalize('C:/tmp/room.greenheal-preview.png')
    );
  });

  test('decodes generated data urls', () => {
    const result = decodeGeneratedImage('data:image/jpeg;base64,aGVsbG8=');
    expect(result.mimeType).toBe('image/jpeg');
    expect(result.extension).toBe('.jpg');
    expect(result.buffer.equals(Buffer.from('hello'))).toBe(true);
  });
});