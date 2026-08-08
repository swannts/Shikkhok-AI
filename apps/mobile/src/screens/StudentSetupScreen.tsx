import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Button, Header, ProgressBar } from '../components';

interface ClassOption {
  id: string;
  bnName: string;
  enName: string;
}

const classOptions: ClassOption[] = [
  { id: '6', bnName: '৬ষ্ঠ', enName: 'Class VI' },
  { id: '7', bnName: '৭ম', enName: 'Class VII' },
  { id: '8', bnName: '৮ম', enName: 'Class VIII' },
  { id: '9', bnName: '৯ম', enName: 'Class IX' },
  { id: '10', bnName: '১০ম', enName: 'Class X' },
  { id: '11', bnName: '১১শ', enName: 'HSC 1st Yr' },
  { id: '12', bnName: '১২শ', enName: 'HSC 2nd Yr' },
];

interface StudentSetupScreenProps {
  onContinue: (selectedClass: string) => void;
  onBack?: () => void;
}

export const StudentSetupScreen: React.FC<StudentSetupScreenProps> = ({ onContinue, onBack }) => {
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      <Header onBack={onBack} title="স্টুডেন্ট সেটআপ" />

      <View style={styles.progressContainer}>
        <ProgressBar progress={0.4} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.headlineSection}>
          <Text style={styles.title}>তুমি কোন ক্লাসে পড়ো?</Text>
          <Text style={styles.subtitle}>
            তোমার জন্য সঠিক এবং প্রাসঙ্গিক পাঠ্যক্রম সাজাতে আমাদের সাহায্য করো।
          </Text>
        </View>

        <View style={styles.grid}>
          {classOptions.map((item) => {
            const isSelected = selectedClassId === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                activeOpacity={0.8}
                onPress={() => setSelectedClassId(item.id)}
                style={[styles.classCard, isSelected ? styles.selectedCard : styles.unselectedCard]}
              >
                <Text
                  style={[
                    styles.bnClassText,
                    { color: isSelected ? colors.primary : colors.onSurface },
                  ]}
                >
                  {item.bnName}
                </Text>
                <Text
                  style={[
                    styles.enClassText,
                    { color: isSelected ? colors.primary : colors.onSurfaceVariant },
                  ]}
                >
                  {item.enName}
                </Text>
                {isSelected && (
                  <View style={styles.checkIcon}>
                    <Text style={{ color: colors.primary, fontSize: 16 }}>✓</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Button
          title="চালিয়ে যাও →"
          onPress={() => selectedClassId && onContinue(selectedClassId)}
          disabled={!selectedClassId}
          size="large"
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  progressContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  headlineSection: {
    marginVertical: spacing.md,
    alignItems: 'center',
  },
  title: {
    fontSize: typography.size.headline,
    fontWeight: '800',
    color: colors.onSurface,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  classCard: {
    width: '48%',
    backgroundColor: colors.surface,
    borderRadius: spacing.borderRadius.lg,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    position: 'relative',
  },
  unselectedCard: {
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  selectedCard: {
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surfaceContainerLow,
  },
  bnClassText: {
    fontSize: typography.size.xxl,
    fontWeight: '800',
    marginBottom: 4,
  },
  enClassText: {
    fontSize: typography.size.xs,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  checkIcon: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    padding: spacing.md,
  },
});
