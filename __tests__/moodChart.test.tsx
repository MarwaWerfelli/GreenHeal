import React from 'react';
import { Animated } from 'react-native';
import { act, render } from '@testing-library/react-native';
import * as SQLite from 'expo-sqlite';
import MoodChart from '../src/components/MoodChart';

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('MoodChart', () => {
  beforeEach(() => {
    jest.clearAllMocks();

    (SQLite.openDatabaseAsync as jest.Mock).mockResolvedValue({
      getAllAsync: jest.fn().mockResolvedValue([
        { mood_score: 4, created_at: new Date().toISOString() },
      ]),
    });

    jest.spyOn(global, 'setTimeout').mockImplementation(((callback: TimerHandler) => {
      if (typeof callback === 'function') {
        callback();
      }
      return 0 as any;
    }) as typeof setTimeout);

    jest.spyOn(Animated, 'spring').mockReturnValue({} as any);
    jest.spyOn(Animated, 'stagger').mockReturnValue({ start: jest.fn() } as any);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('animates bar height without the native driver', async () => {
    render(<MoodChart />);

    await act(async () => {
      await Promise.resolve();
    });

    expect(Animated.spring).toHaveBeenCalledWith(
      expect.anything(),
      expect.objectContaining({ useNativeDriver: false })
    );
  });
});