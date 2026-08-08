import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { useAuthStore } from '../../store/useAuthStore';

interface OnboardingFlowScreenProps {
  onFinish: () => void;
}

export const OnboardingFlowScreen: React.FC<OnboardingFlowScreenProps> = ({ onFinish }) => {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selectedClass, setSelectedClass] = useState('8');
  const [selectedGoal, setSelectedGoal] = useState('exam_prep');
  const setOnboardingCompleted = useAuthStore((state) => state.setOnboardingCompleted);

  const handleComplete = () => {
    setOnboardingCompleted(true);
    onFinish();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Step Indicator */}
        <View style={styles.stepIndicatorRow}>
          {[1, 2, 3].map((s) => (
            <View
              key={s}
              style={[styles.stepDot, s <= step ? styles.stepDotActive : styles.stepDotInactive]}
            />
          ))}
        </View>

        {step === 1 && (
          <View style={styles.stepContainer}>
            <AppText variant="pageTitle" weight="bold" align="center">
              তুমি কোন ক্লাসে পড়ো? 🏫
            </AppText>
            <AppText variant="bodySmall" color={colors.textSecondary} align="center" style={{ marginBottom: spacing.lg }}>
              তোমার পাঠ্যক্রম সাজাতে আমাদের সাহায্য করো
            </AppText>

            <View style={styles.grid}>
              {['৬ষ্ঠ', '৭ম', '৮ম', '৯ম', '১০ম', '১১শ', '১২শ'].map((cl, idx) => {
                const isSelected = selectedClass === String(idx + 6);
                return (
                  <TouchableOpacity
                    key={cl}
                    activeOpacity={0.8}
                    onPress={() => setSelectedClass(String(idx + 6))}
                    style={[styles.classCard, isSelected ? styles.classCardSelected : null]}
                  >
                    <AppText variant="cardTitle" weight="bold" color={isSelected ? colors.primary : colors.textPrimary}>
                      {cl}
                    </AppText>
                  </TouchableOpacity>
                );
              })}
            </View>

            <TouchableOpacity activeOpacity={0.9} onPress={() => setStep(2)} style={styles.nextBtn}>
              <AppText variant="button" color={colors.white} weight="bold">
                পরবর্তী ধাপ →
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        {step === 2 && (
          <View style={styles.stepContainer}>
            <AppText variant="pageTitle" weight="bold" align="center">
              তোমার প্রধান লক্ষ্য কোনটি? 🎯
            </AppText>
            <AppText variant="bodySmall" color={colors.textSecondary} align="center" style={{ marginBottom: spacing.lg }}>
              আমরা তোমার লক্ষ্য অনুযায়ী পড়া সাজাবো
            </AppText>

            {[
              { id: 'exam_prep', title: 'পরীক্ষায় জিপিএ-৫ পাওয়া 🏆', desc: 'মডেল টেস্ট ও প্রশ্ন সমাধান' },
              { id: 'concept_clear', title: 'বেসিক মজবুত করা 🧠', desc: 'ধাপে ধাপে সহজ ব্যাখ্যা' },
              { id: 'homework_help', title: 'হোমওয়ার্কে সাহায্য নেওয়া 📝', desc: 'AI শিক্ষকের তাত্ক্ষণিক গাইড' },
            ].map((goal) => {
              const isSelected = selectedGoal === goal.id;
              return (
                <TouchableOpacity
                  key={goal.id}
                  activeOpacity={0.8}
                  onPress={() => setSelectedGoal(goal.id)}
                  style={[styles.goalCard, isSelected ? styles.goalSelected : null]}
                >
                  <AppText variant="cardTitle" weight="bold" color={isSelected ? colors.primary : colors.textPrimary}>
                    {goal.title}
                  </AppText>
                  <AppText variant="caption" color={colors.textSecondary} style={{ marginTop: 2 }}>
                    {goal.desc}
                  </AppText>
                </TouchableOpacity>
              );
            })}

            <TouchableOpacity activeOpacity={0.9} onPress={() => setStep(3)} style={styles.nextBtn}>
              <AppText variant="button" color={colors.white} weight="bold">
                পরবর্তী ধাপ →
              </AppText>
            </TouchableOpacity>
          </View>
        )}

        {step === 3 && (
          <View style={styles.stepContainer}>
            <AppText style={{ fontSize: 64, textAlign: 'center' }}>🚀</AppText>
            <AppText variant="pageTitle" weight="bold" align="center" style={{ marginTop: spacing.md }}>
              সব প্রস্তুত!
            </AppText>
            <AppText variant="bodySmall" color={colors.textSecondary} align="center" style={{ marginBottom: spacing.xl }}>
              তোমার ব্যক্তিগত AI শিক্ষক প্রস্তুত। এখনই শেখা শুরু করো!
            </AppText>

            <TouchableOpacity activeOpacity={0.9} onPress={handleComplete} style={styles.finishBtn}>
              <AppText variant="button" color={colors.white} weight="bold">
                শেখা শুরু করি ✨
              </AppText>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingVertical: spacing.md, paddingBottom: spacing.xxl },
  stepIndicatorRow: { flexDirection: 'row', justifyContent: 'center', marginBottom: spacing.lg },
  stepDot: { height: 6, borderRadius: 3, marginHorizontal: 4 },
  stepDotActive: { width: 32, backgroundColor: colors.primary },
  stepDotInactive: { width: 12, backgroundColor: colors.border },
  stepContainer: { flex: 1 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.lg },
  classCard: { width: '48%', backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, alignItems: 'center', marginBottom: spacing.sm },
  classCardSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primaryLight },
  goalCard: { backgroundColor: colors.surface, padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.sm },
  goalSelected: { borderColor: colors.primary, borderWidth: 2, backgroundColor: colors.primaryLight },
  nextBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center', marginTop: spacing.md },
  finishBtn: { backgroundColor: colors.success, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
});
