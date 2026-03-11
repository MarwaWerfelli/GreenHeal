const {
  buildVisualizationPrompt,
  buildMaskConfig,
  getMaskCanvasSize,
  createPlacementMaskPng,
  getImageDimensions,
} = require('../backend/visualization');

describe('backend visualization helpers', () => {
  test('builds a placement-aware same-room prompt', () => {
    const prompt = buildVisualizationPrompt({
      plantDescriptions: 'Snake Plant (table corner)',
      selectedPlantName: 'Snake Plant',
      selectedPlacement: 'table corner',
      placementMode: 'table',
    });

    expect(prompt).toContain('Edit this exact room photo and preserve the room as-is.');
    expect(prompt).toContain('Add only Snake Plant in a modern planter.');
    expect(prompt).toContain('table corner');
  });

  test('builds bounded mask config from defaults and overrides', () => {
    const mask = buildMaskConfig({
      placementMode: 'window',
      maskCenterX: '80',
      maskCenterY: '0.3',
      maskWidth: '0.26',
      maskHeight: '40',
    });

    expect(mask.centerX).toBeCloseTo(0.8, 5);
    expect(mask.centerY).toBeCloseTo(0.3, 5);
    expect(mask.width).toBeCloseTo(0.26, 5);
    expect(mask.height).toBeCloseTo(0.4, 5);
  });

  test('creates a png mask with readable dimensions', () => {
    const png = createPlacementMaskPng({
      width: 320,
      height: 240,
      maskConfig: buildMaskConfig({ placementMode: 'corner' }),
    });

    expect(Buffer.from(png.subarray(0, 8))).toEqual(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    expect(getImageDimensions(png, 'image/png')).toEqual({ width: 320, height: 240 });
  });

  test('scales large source images down for mask generation', () => {
    expect(getMaskCanvasSize({ width: 4032, height: 3024 })).toEqual({ width: 1024, height: 768 });
  });
});