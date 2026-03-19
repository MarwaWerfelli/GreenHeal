const {
  detectPlacementMode,
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
    expect(prompt).toContain('professional interior-design photo');
    expect(prompt).toContain('must physically rest on a real floor, shelf, table, ledge, sill, desk, or stand');
  });

  test('detects modern wall and hanging placement modes', () => {
    expect(detectPlacementMode('geometric wall planter frame above the sofa')).toBe('wall');
    expect(detectPlacementMode('ceiling hanging planter near the window')).toBe('hanging');
    expect(detectPlacementMode('floating shelf planter by the reading nook')).toBe('shelf');
  });

  test('builds hanging prompts with visible support instructions', () => {
    const prompt = buildVisualizationPrompt({
      plantDescriptions: 'Pothos (ceiling hanging planter above the sofa)',
      selectedPlantName: 'Pothos',
      selectedPlacement: 'ceiling hanging planter above the sofa',
      placementMode: 'hanging',
    });

    expect(prompt).toContain('visible cords or rod anchored to the ceiling');
    expect(prompt).toContain('Do not make the plant oversized, dominant, floating, pasted-on, unsupported');
  });

  test('builds multi-plant prompts with style preset guidance', () => {
    const prompt = buildVisualizationPrompt({
      plantDescriptions: 'Snake Plant (table corner), Peace Lily (reading nook), Pothos (window sill)',
      renderStyle: 'same-room-multi-plant',
      stylePreset: 'shelfStyling',
    });

    expect(prompt).toContain('Add only these healing plants: Snake Plant (table corner), Peace Lily (reading nook), Pothos (window sill).');
    expect(prompt).toContain('Arrange them together as one cohesive, professionally styled, plant-rich composition');
    expect(prompt).toContain('Distribute the listed plants across realistic supports such as corners, floor stands, desks, side tables, consoles, shelves, window ledges, wall-mounted planters, and hanging planters');
    expect(prompt).toContain('Steer the styling toward curated shelf, ledge, and tabletop styling');
    expect(prompt).toContain('professional editorial photograph');
    expect(prompt).toContain('The result should feel dense, elegant, realistic, and professionally styled');
    expect(prompt).toContain('Do not duplicate plants or add extra planters beyond the listed plants.');
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