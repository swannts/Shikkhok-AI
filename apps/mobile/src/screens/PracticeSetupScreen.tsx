import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Header, Card, Button } from '../components';

interface PracticeSetupScreenProps {
  onStart?: () => void;
  onBack?: () => void;
}

export const PracticeSetupScreen: React.FC<PracticeSetupScreenProps> = ({ onStart, onBack }) => {
  const [selectedSubject, setSelectedSubject] = useState('math');
  const [questionCount, setQuestionCount] = useState(10);

  return (
    <View style={styles.container}>
      <Header onBack={onBack} title="প্র্যাকটিস সেটাআপ" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.sectionTitle}>বিষয় নির্বাচন করো</Text>
        <View style={styles.row}>
          {['math', 'science', 'english'].map((sub) => (
            <TouchableOpacity
              key={sub}
              onPress={() => setSelectedSubject(sub)}
              style={[styles.chip, selectedSubject === sub ? styles.chipActive : null]}
            >
              <Text style={[styles.chipText, selectedSubject === sub ? styles.chipTextActive : null]}>
                {sub === 'math' ? 'গণিত' : sub === 'science' ? 'বিজ্ঞান' : 'ইংরেজি'}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.sectionTitle}>প্রশ্নের সংখ্যা</Text>
        <View style={styles.row}>
          {[5, 10, 15, 20].map((count) => (
            <TouchableOpacity
              key={count}
              onPress={() => setQuestionCount(count)}
              style={[styles.countBox, questionCount === count ? styles.chipActive : null]}
            >
              <Text style={[styles.chipText, questionCount === count ? styles.chipTextActive : null]}>
                {count}টি
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Button title="প্র্যাকটিস শুরু করো" onPress={onStart || (() => {})} size="large" style={{ marginTop: spacing.xl }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },
  sectionTitle: { fontSize: typography.size.md, fontWeight: '700', color: colors.onSurface, marginTop: spacing.md, marginBottom: spacing.xs },
  row: { flexDirection: 'row', flexWrap: 'wrap' },
  chip: { paddingHorizontal: spacing.md, paddingVertical: spacing.sm, borderRadius: spacing.borderRadius.md, backgroundColor: colors.surfaceContainerLow, marginRight: spacing.sm, marginBottom: spacing.sm },
  chipActive: { backgroundColor: colors.primary },
  chipText: { fontSize: typography.size.sm, color: colors.onSurface, fontWeight: '600' },
  chipTextActive: { color: colors.white },
  countBox: { width: 60, height: 48, borderRadius: spacing.borderRadius.md, backgroundColor: colors.surfaceContainerLow, alignItems: 'center', justifyContent: 'center', marginRight: spacing.sm },
});
