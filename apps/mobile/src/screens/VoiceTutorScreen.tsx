import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Header } from '../components';

interface VoiceTutorScreenProps {
  onBack?: () => void;
}

export const VoiceTutorScreen: React.FC<VoiceTutorScreenProps> = ({ onBack }) => {
  const [isListening, setIsListening] = useState(false);

  return (
    <View style={styles.container}>
      <Header onBack={onBack} title="AI ভয়েস টিউটর" />
      <View style={styles.content}>
        <Text style={styles.statusText}>
          {isListening ? 'শুনছি... কথা বলো' : 'কথা বলতে মাইক্রোফোন চেপে ধরো'}
        </Text>

        <View style={styles.visualizerContainer}>
          <View style={[styles.waveCircle, isListening ? styles.waveActive : null]}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setIsListening(!isListening)}
              style={styles.micButton}
            >
              <Text style={{ fontSize: 44 }}>🎙️</Text>
            </TouchableOpacity>
          </View>
        </View>

        <Text style={styles.sampleQuestion}>"বীজগণিতীয় সূত্রের প্রয়োগ বুঝিয়ে দাও"</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { flex: 1, alignItems: 'center', justifyContent: 'space-around', padding: spacing.xl },
  statusText: { fontSize: typography.size.lg, fontWeight: '700', color: colors.onSurface, textAlign: 'center' },
  visualizerContainer: { alignItems: 'center', justifyContent: 'center' },
  waveCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waveActive: {
    borderWidth: 4,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerHigh,
  },
  micButton: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sampleQuestion: { fontSize: typography.size.sm, color: colors.outline, fontStyle: 'italic' },
});
