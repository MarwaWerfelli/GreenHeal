import React from 'react';
import { fireEvent, render } from '@testing-library/react-native';
import FeedbackScreen from '../src/screens/FeedbackScreen';

jest.mock('expo-linear-gradient', () => {
  const React = require('react');
  const { View } = require('react-native');

  return {
    LinearGradient: ({ children }: { children: React.ReactNode }) => <View>{children}</View>,
  };
});

jest.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

describe('Feedback Screen', () => {
  test('submits feedback after ratings are selected', () => {
    const { getByTestId, getByText } = render(<FeedbackScreen />);

    fireEvent.press(getByTestId('overall-rating-4'));
    fireEvent.press(getByTestId('support-rating-5'));
    fireEvent.changeText(getByTestId('feedback-notes-input'), 'Very calming experience');
    fireEvent.press(getByText('feedback.submit'));

    expect(getByText('feedback.thankYouTitle')).toBeTruthy();
    expect(getByText('feedback.thankYouBody')).toBeTruthy();
  });
});