import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  Image,
  Dimensions,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  ScrollView,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import type { RoomVisualizationScreenProps } from '../types';
import { COLORS } from '../utils/constants';
import axios from 'axios';
import Constants from 'expo-constants';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const OPENAI_API_KEY = Constants.expoConfig?.extra?.OPENAI_API_KEY || '';

export default function RoomVisualizationScreen({
  route,
}: RoomVisualizationScreenProps) {
  const { imageUri, recommendations } = route.params;
  const { t } = useTranslation();
  const [aiImageUrl, setAiImageUrl] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  // Fixed positions for plant icons (as percentages of container)
  const plantPositions = [
    { left: '15%', top: '25%' },  // Top left area
    { left: '65%', top: '40%' },  // Right side
    { left: '25%', top: '70%' },  // Bottom left
  ];

  async function handleGenerateAIExample() {
    if (!recommendations.length) {
      return;
    }

    try {
      console.log('[ROOM_VIZ] Starting AI example generation...');
      setGenerating(true);

      // Convert image to base64
      const response = await fetch(imageUri);
      const blob = await response.blob();
      const base64Image = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          const base64 = reader.result as string;
          const base64Data = base64.split(',')[1];
          resolve(base64Data);
        };
        reader.onerror = reject;
        reader.readAsDataURL(blob);
      });

      console.log('[ROOM_VIZ] Image converted to base64');

      // Step 1: Use GPT-4 Vision to describe the room
      console.log('[ROOM_VIZ] Calling GPT-4 Vision...');
      const descriptionResponse = await axios.post(
        'https://api.openai.com/v1/chat/completions',
        {
          model: 'gpt-4o',
          messages: [
            {
              role: 'system',
              content: 'You are an interior design expert. Describe this room in detail: layout, furniture, colors, lighting, style. Keep it under 150 words.',
            },
            {
              role: 'user',
              content: [
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:image/jpeg;base64,${base64Image}`,
                  },
                },
              ],
            },
          ],
          max_tokens: 250,
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );

      const roomDescription = descriptionResponse.data.choices[0]?.message?.content;
      console.log('[ROOM_VIZ] Room description received');

      // Step 2: Generate similar room with plants using DALL-E 3
      const plantDescriptions = recommendations.map((plant) => 
        `${plant.name} ${plant.placement}`
      ).join(', ');

      const dallePrompt = `Interior design photo: ${roomDescription}. Add these healing plants in modern decorative pots: ${plantDescriptions}. The plants should be placed naturally and beautifully. Maintain similar room style, colors, and lighting. Photorealistic, professional interior design photography.`;

      console.log('[ROOM_VIZ] Calling DALL-E 3...');
      const imageResponse = await axios.post(
        'https://api.openai.com/v1/images/generations',
        {
          model: 'dall-e-3',
          prompt: dallePrompt,
          n: 1,
          size: '1024x1024',
          quality: 'standard',
        },
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
        }
      );

      const imageUrl = imageResponse.data.data[0]?.url;
      if (!imageUrl) {
        throw new Error('No image URL in response');
      }

      console.log('[ROOM_VIZ] AI example generated successfully');
      setAiImageUrl(imageUrl);
      
      Alert.alert(
        t('common.success'),
        t('aiAnalysis.visualizationSuccess'),
        [{ text: t('common.ok') }]
      );
    } catch (error: any) {
      console.error('[ROOM_VIZ] AI example error:', error);
      console.error('[ROOM_VIZ] Error details:', error.response?.data);
      
      let errorMessage = t('aiAnalysis.visualizationErrorMessage', 'Failed to generate example. Please try again.');
      if (error.response?.status === 401) {
        errorMessage = 'API authentication failed. Please check your API key.';
      }
      
      Alert.alert(
        t('aiAnalysis.visualizationError', 'Generation Error'),
        errorMessage,
        [{ text: t('common.ok') }]
      );
    } finally {
      setGenerating(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.title}>
        {t('aiAnalysis.yourRoom')}
      </Text>
      <Text style={styles.subtitle}>
        {t('aiAnalysis.placementSuggestions')}
      </Text>

      {/* Room Photo with Plant Icons Overlay */}
      <View style={styles.imageWrapper}>
        <ImageBackground
          source={{ uri: imageUri }}
          style={styles.roomImage}
          imageStyle={styles.roomImageStyle}
        >
          {/* Plant icons at fixed positions */}
          {recommendations.slice(0, 3).map((plant, index) => (
            <View
              key={index}
              style={[
                styles.plantIcon,
                {
                  left: plantPositions[index]?.left || '50%',
                  top: plantPositions[index]?.top || '50%',
                },
              ]}
            >
              <View style={styles.plantIconCircle}>
                <Text style={styles.plantEmoji}>🪴</Text>
              </View>
              <View style={styles.plantLabelContainer}>
                <Text style={styles.plantLabel} numberOfLines={1}>
                  {plant.name}
                </Text>
              </View>
            </View>
          ))}
        </ImageBackground>
      </View>

      {/* Plant Placement Details */}
      <View style={styles.suggestionsContainer}>
        <Text style={styles.suggestionsTitle}>
          📍 {t('aiAnalysis.suggestedPlacements')}
        </Text>
        {recommendations.map((plant, index) => (
          <View key={index} style={styles.suggestionItem}>
            <Text style={styles.suggestionEmoji}>🪴</Text>
            <View style={styles.suggestionTextContainer}>
              <Text style={styles.plantName}>{plant.name}</Text>
              <Text style={styles.plantPlacement}>{plant.placement}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* AI Example Generation */}
      <View style={styles.aiSection}>
        <Text style={styles.aiTitle}>
          ✨ {t('aiAnalysis.aiExampleTitle')}
        </Text>
        <Text style={styles.aiSubtitle}>
          {t('aiAnalysis.aiExampleSubtitle')}
        </Text>
        
        <TouchableOpacity
          style={[styles.generateButton, generating && styles.generateButtonDisabled]}
          onPress={handleGenerateAIExample}
          disabled={generating}
        >
          {generating ? (
            <>
              <ActivityIndicator size="small" color={COLORS.white} style={{ marginRight: 8 }} />
              <Text style={styles.generateButtonText}>
                {t('aiAnalysis.generating')}
              </Text>
            </>
          ) : (
            <>
              <Text style={styles.generateButtonIcon}>🎨</Text>
              <Text style={styles.generateButtonText}>
                {aiImageUrl
                  ? t('aiAnalysis.regenerateExample')
                  : t('aiAnalysis.generateExample')}
              </Text>
            </>
          )}
        </TouchableOpacity>

        {aiImageUrl && (
          <View style={styles.aiImageContainer}>
            <Text style={styles.aiImageLabel}>
              {t('aiAnalysis.aiGeneratedExample')}
            </Text>
            <Image
              source={{ uri: aiImageUrl }}
              style={styles.aiImage}
              resizeMode="cover"
            />
            <Text style={styles.aiImageNote}>
              {t('aiAnalysis.exampleNote')}
            </Text>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.primary,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  imageWrapper: {
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  roomImage: {
    width: '100%',
    aspectRatio: 3 / 4,
  },
  roomImageStyle: {
    resizeMode: 'cover',
  },
  plantIcon: {
    position: 'absolute',
    alignItems: 'center',
    transform: [{ translateX: -30 }, { translateY: -30 }], // Center the icon
  },
  plantIconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
    borderWidth: 3,
    borderColor: COLORS.primary,
  },
  plantEmoji: {
    fontSize: 32,
  },
  plantLabelContainer: {
    marginTop: 6,
    backgroundColor: 'rgba(45, 106, 79, 0.9)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    maxWidth: 120,
  },
  plantLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: COLORS.white,
    textAlign: 'center',
  },
  suggestionsContainer: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  suggestionsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 16,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.background,
  },
  suggestionEmoji: {
    fontSize: 28,
    marginRight: 12,
  },
  suggestionTextContainer: {
    flex: 1,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  plantPlacement: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  aiSection: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  aiTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: COLORS.primary,
    marginBottom: 8,
  },
  aiSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 16,
    lineHeight: 20,
  },
  generateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  generateButtonDisabled: {
    opacity: 0.7,
  },
  generateButtonIcon: {
    fontSize: 22,
    marginRight: 8,
  },
  generateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
  },
  aiImageContainer: {
    marginTop: 20,
  },
  aiImageLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 12,
  },
  aiImage: {
    width: '100%',
    height: 300,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  aiImageNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
    marginTop: 12,
    textAlign: 'center',
  },
});
