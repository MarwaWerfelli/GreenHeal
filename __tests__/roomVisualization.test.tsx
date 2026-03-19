import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RoomVisualizationScreen from '../src/screens/RoomVisualizationScreen';
import { prepareImageForVisualizationUpload } from '../src/modules/image';

jest.mock('../src/modules/image');
jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

class MockFormData {
  private fields = new Map<string, any>();

  append(key: string, value: any) {
    this.fields.set(key, value);
  }

  get(key: string) {
    return this.fields.get(key);
  }
}

const mockedPrepareImageForVisualizationUpload =
  prepareImageForVisualizationUpload as jest.MockedFunction<typeof prepareImageForVisualizationUpload>;
const originalFormData = global.FormData;
const snakePlant = {
  name: 'Snake Plant',
  placement: 'table corner',
  healingBenefit: 'Improves air quality',
  careDifficulty: 'easy' as const,
  estimatedCost: '20 TND',
  wateringFrequencyDays: 14,
  encouragingMessage: 'Great choice!',
};
const peaceLily = {
  name: 'Peace Lily',
  placement: 'reading nook',
  healingBenefit: 'Promotes calmness',
  careDifficulty: 'medium' as const,
  estimatedCost: '25 TND',
  wateringFrequencyDays: 5,
  encouragingMessage: 'A soothing addition!',
};
const pothos = {
  name: 'Pothos',
  placement: 'window sill',
  healingBenefit: 'Supports a restful atmosphere',
  careDifficulty: 'easy' as const,
  estimatedCost: '18 TND',
  wateringFrequencyDays: 7,
  encouragingMessage: 'Fresh and uplifting!',
};
const multiRoute = {
  params: {
    imageUri: 'file://room-original.jpg',
    recommendations: [snakePlant, peaceLily, pothos],
    selectedPlant: snakePlant,
    selectedPlants: [snakePlant, peaceLily, pothos],
  },
} as any;
const singleRoute = {
  params: {
    imageUri: 'file://room-original.jpg',
    recommendations: [snakePlant],
    selectedPlant: snakePlant,
    selectedPlants: [snakePlant],
  },
} as any;

describe('RoomVisualizationScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.FormData = MockFormData as any;
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: jest.fn().mockResolvedValue({ imageUrl: 'https://example.com/generated.jpg' }),
    } as any);
    mockedPrepareImageForVisualizationUpload.mockResolvedValue('file://room-resized.jpg');
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    global.FormData = originalFormData;
  });

  test('Resizes the room image before posting visualization form data', async () => {
    const { getByTestId, getByText, queryByText } = render(
      <RoomVisualizationScreen route={singleRoute} navigation={{} as any} />
    );

    fireEvent.press(getByText('aiAnalysis.generateSelectedPlant'));

    await waitFor(() => {
      expect(mockedPrepareImageForVisualizationUpload).toHaveBeenCalledWith('file://room-original.jpg');
      expect(global.fetch).toHaveBeenCalled();
    });

    const [, requestOptions] = (global.fetch as jest.Mock).mock.calls[0];
    const formData = requestOptions.body as MockFormData;
    const imageField = formData.get('image');

    expect(imageField).toEqual(
      expect.objectContaining({
        uri: 'file://room-resized.jpg',
        type: 'image/jpeg',
        name: 'room.jpg',
      })
    );
    expect(formData.get('renderStyle')).toBe('same-room-single-plant');
    expect(formData.get('selectedPlantName')).toBe('Snake Plant');
    expect(formData.get('stylePreset')).toBe('balancedModern');
    expect(getByTestId('generated-room-image')).toBeTruthy();
    expect(queryByText(/Drag the slider to compare before & after/i)).toBeNull();
  });

  test('Falls back safely when selectedPlants is malformed', () => {
    const malformedRoute = {
      params: {
        imageUri: 'file://room-original.jpg',
        recommendations: [snakePlant],
        selectedPlant: snakePlant,
        selectedPlants: null,
      },
    } as any;

    const { getByTestId, getByText } = render(
      <RoomVisualizationScreen route={malformedRoute} navigation={{} as any} />
    );

    expect(getByTestId('room-plan-marker-0')).toBeTruthy();
    expect(getByText('aiAnalysis.selectedForPreview: Snake Plant')).toBeTruthy();
  });

  test('Shows markers, selectors, and style presets for all selected plants in the room plan', () => {
    const { getByTestId, getByText } = render(
      <RoomVisualizationScreen route={multiRoute} navigation={{} as any} />
    );

    expect(getByTestId('room-plan-marker-0')).toBeTruthy();
    expect(getByTestId('room-plan-marker-1')).toBeTruthy();
    expect(getByTestId('room-plan-marker-2')).toBeTruthy();
    expect(getByTestId('room-plan-selector-0')).toBeTruthy();
    expect(getByTestId('room-plan-selector-1')).toBeTruthy();
    expect(getByTestId('room-plan-selector-2')).toBeTruthy();
    expect(getByTestId('style-preset-balancedModern')).toBeTruthy();
    expect(getByTestId('style-preset-wallGrid')).toBeTruthy();
    expect(getByText('aiAnalysis.multiPlantIncludedTitle')).toBeTruthy();
  });

  test('Generates a multi-plant payload with the selected style preset', async () => {
    const { getByTestId, getByText } = render(
      <RoomVisualizationScreen route={multiRoute} navigation={{} as any} />
    );

    fireEvent.press(getByTestId('room-plan-selector-1'));
    fireEvent.press(getByTestId('style-preset-wallGrid'));

    expect(getByText('aiAnalysis.selectedForPreview: Peace Lily')).toBeTruthy();

    fireEvent.press(getByText('aiAnalysis.generateMultiPlant'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const [, requestOptions] = (global.fetch as jest.Mock).mock.calls[0];
    const formData = requestOptions.body as MockFormData;

    expect(formData.get('renderStyle')).toBe('same-room-multi-plant');
    expect(formData.get('stylePreset')).toBe('wallGrid');
    expect(formData.get('selectedPlantName')).toBeUndefined();
    expect(formData.get('selectedPlacement')).toBeUndefined();
    expect(formData.get('plantDescriptions')).toBe(
      'Snake Plant (table corner), Peace Lily (reading nook), Pothos (window sill)'
    );
  });

  test('Uses hanging mode for modern ceiling planter placements', async () => {
    const hangingPlant = {
      name: 'Pothos',
      placement: 'ceiling hanging planter above the sofa',
      healingBenefit: 'Supports a restful atmosphere',
      careDifficulty: 'easy' as const,
      estimatedCost: '18 TND',
      wateringFrequencyDays: 7,
      encouragingMessage: 'Fresh and uplifting!',
    };
    const hangingRoute = {
      params: {
        ...singleRoute.params,
        recommendations: [hangingPlant],
        selectedPlant: hangingPlant,
        selectedPlants: [hangingPlant],
      },
    } as any;

    const { getByText } = render(
      <RoomVisualizationScreen route={hangingRoute} navigation={{} as any} />
    );

    expect(
      getByText('Ceiling-hung styling with slim visible support, compact scale, and no floating look.')
    ).toBeTruthy();

    fireEvent.press(getByText('aiAnalysis.generateSelectedPlant'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
    });

    const [, requestOptions] = (global.fetch as jest.Mock).mock.calls[0];
    const formData = requestOptions.body as MockFormData;

    expect(formData.get('selectedPlacement')).toBe('ceiling hanging planter above the sofa');
    expect(formData.get('placementMode')).toBe('hanging');
  });
});