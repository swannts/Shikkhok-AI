import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Image } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { colors, spacing, radius } from '../../theme';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { LoadingState } from '../../components/ui/LoadingState';
import { homeworkRepository, HomeworkDetectionResult } from '../../api/repositories/homeworkRepository';

interface HomeworkScreenProps {
  onAskTutorWithQuery: (query: string) => void;
  onBack?: () => void;
}

export const HomeworkScreen: React.FC<HomeworkScreenProps> = ({
  onAskTutorWithQuery,
  onBack,
}) => {
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [detection, setDetection] = useState<HomeworkDetectionResult | null>(null);

  const handlePickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      processImage(uri);
    }
  };

  const handleTakePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      alert('ক্যামেরা ব্যবহারের অনুমতি আবশ্যক');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setImageUri(uri);
      processImage(uri);
    }
  };

  const processImage = async (uri: string) => {
    setIsAnalyzing(true);
    const res = await homeworkRepository.analyzeHomeworkImage(uri);
    setDetection(res);
    setIsAnalyzing(false);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {onBack && (
          <TouchableOpacity activeOpacity={0.7} onPress={onBack} style={{ marginBottom: spacing.xs }}>
            <AppText variant="bodySmall" color={colors.primary} weight="bold">
              ← ফিরে যাও
            </AppText>
          </TouchableOpacity>
        )}

        <AppText variant="pageTitle" weight="bold">
          হোমওয়ার্ক সাহায্য 📸
        </AppText>
        <AppText variant="bodySmall" color={colors.textSecondary} style={{ marginBottom: spacing.lg }}>
          তোমার প্রশ্ন বা অংকের ছবি তুলে পোস্ট করো
        </AppText>

        {/* Action Buttons: Camera vs Gallery */}
        <View style={styles.actionRow}>
          <TouchableOpacity activeOpacity={0.8} onPress={handleTakePhoto} style={styles.pickerBox}>
            <AppText style={{ fontSize: 32 }}>📷</AppText>
            <AppText variant="button" weight="bold" style={{ marginTop: 4 }}>
              ছবি তুলুন
            </AppText>
          </TouchableOpacity>

          <TouchableOpacity activeOpacity={0.8} onPress={handlePickImage} style={styles.pickerBox}>
            <AppText style={{ fontSize: 32 }}>🖼️</AppText>
            <AppText variant="button" weight="bold" style={{ marginTop: 4 }}>
              গ্যালারি থেকে নিন
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Analysis Loading */}
        {isAnalyzing && <LoadingState message="ছবি বিশ্লেষণ ও প্রশ্ন সনাক্ত করা হচ্ছে..." />}

        {/* Detected Question Banner */}
        {detection && !isAnalyzing && (
          <View style={styles.resultContainer}>
            {imageUri && <Image source={{ uri: imageUri }} style={styles.previewImage} />}

            <View style={styles.detectionBox}>
              <AppText variant="caption" color={colors.primary} weight="bold">
                সনাক্তকৃত প্রশ্ন ({detection.subjectName} • {detection.topicName}):
              </AppText>
              <AppText variant="cardTitle" weight="bold" style={{ marginTop: 4 }}>
                "{detection.detectedText}"
              </AppText>
            </View>

            <AppText variant="sectionTitle" weight="bold" style={{ marginTop: spacing.md, marginBottom: spacing.xs }}>
              কীভাবে সাহায্য করব?
            </AppText>

            {detection.suggestedActions.map((act) => (
              <TouchableOpacity
                key={act.key}
                activeOpacity={0.8}
                onPress={() => onAskTutorWithQuery(`${detection.detectedText} - ${act.label}`)}
                style={styles.actionCard}
              >
                <AppText variant="body" color={colors.primary} weight="bold">
                  {act.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: spacing.md,
    paddingBottom: spacing.xxl,
  },
  actionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.lg,
  },
  pickerBox: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  resultContainer: {
    marginTop: spacing.md,
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: radius.lg,
    marginBottom: spacing.md,
  },
  detectionBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
  },
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
