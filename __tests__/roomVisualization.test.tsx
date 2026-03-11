import React from 'react';
import { render, fireEvent, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import RoomVisualizationScreen from '../src/screens/RoomVisualizationScreen';
import { resizeForStabilityAI } from '../src/modules/image';

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

const mockedResizeForStabilityAI = resizeForStabilityAI as jest.MockedFunction<typeof resizeForStabilityAI>;
const originalFormData = global.FormData;
const mockRoute = {
  params: {
    imageUri: 'file://room-original.jpg',
    recommendations: [
      {
        name: 'Snake Plant',
        placement: 'table corner',
        healingBenefit: 'Improves air quality',
        careDifficulty: 'easy' as const,
        estimatedCost: '20 TND',
        wateringFrequencyDays: 14,
        encouragingMessage: 'Great choice!',
      },
    ],
    selectedPlant: {
      name: 'Snake Plant',
      placement: 'table corner',
      healingBenefit: 'Improves air quality',
      careDifficulty: 'easy' as const,
      estimatedCost: '20 TND',
      wateringFrequencyDays: 14,
      encouragingMessage: 'Great choice!',
    },
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
    mockedResizeForStabilityAI.mockResolvedValue('file://room-resized.jpg');
    jest.spyOn(Alert, 'alert').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  afterAll(() => {
    global.FormData = originalFormData;
  });

  test('Resizes the room image before posting visualization form data', async () => {
    const { getByText } = render(
      <RoomVisualizationScreen route={mockRoute} navigation={{} as any} />
    );

    fireEvent.press(getByText('aiAnalysis.generateSelectedPlant'));

    await waitFor(() => {
      expect(mockedResizeForStabilityAI).toHaveBeenCalledWith('file://room-original.jpg');
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
  });
});