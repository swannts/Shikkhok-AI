import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius } from '../../theme';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { practiceRepository } from '../../api/repositories/practiceRepository';

interface PracticeSessionScreenProps {
  onComplete: (answers: Record<string, string>, timeSpentSeconds: number) => void;
  onBack: () => void;
}

export const PracticeSessionScreen: React.FC<PracticeSessionScreenProps> = ({
  onComplete,
  onBack,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [showExplanation, setShowExplanation] = useState(false);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const { data: session, isLoading, isError, refetch } = useQuery({
    queryKey: ['practiceSession'],
    queryFn: () => practiceRepository.getPracticeSession(),
  });

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsedSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (isLoading || !session) {
    return (
      <Screen>
        <LoadingState message="প্র্যাকটিস সেসন লোড হচ্ছে..." />
      </Screen>
    );
  }

  if (isError) {
    return (
      <Screen>
        <ErrorState onRetry={refetch} />
      </Screen>
    );
  }

  const currentQ = session.questions[currentIndex];
  const selectedLabel = userAnswers[currentQ.id];

  const handleSelectOption = (label: string) => {
    setUserAnswers((prev) => ({ ...prev, [currentQ.id]: label }));
    setShowExplanation(true);
  };

  const handleNext = () => {
    setShowExplanation(false);
    if (currentIndex < session.questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      onComplete(userAnswers, elapsedSeconds);
    }
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.topRow}>
          <TouchableOpacity onPress={onBack}>
            <AppText variant="bodySmall" color={colors.primary} weight="bold">
              ✕ বের হয়ে যাও
            </AppText>
          </TouchableOpacity>

          <AppText variant="caption" color={colors.textSecondary} weight="bold">
            প্রশ্ন {currentIndex + 1} / {session.questions.length} • ⏱️ {Math.floor(elapsedSeconds / 60)}:{(elapsedSeconds % 60).toString().padStart(2, '0')}
          </AppText>
        </View>

        {/* Question Text */}
        <View style={styles.questionCard}>
          <AppText variant="cardTitle" weight="bold" style={styles.questionText}>
            {currentQ.questionText}
          </AppText>
        </View>

        {/* MCQ Options */}
        {currentQ.options.map((opt) => {
          const isSelected = selectedLabel === opt.label;
          let optionStyle = styles.optionNormal;
          let labelColor = colors.textPrimary;

          if (isSelected) {
            optionStyle = opt.isCorrect ? styles.optionCorrect : styles.optionWrong;
            labelColor = colors.white;
          }

          return (
            <TouchableOpacity
              key={opt.label}
              activeOpacity={0.8}
              onPress={() => handleSelectOption(opt.label)}
              style={[styles.optionCard, optionStyle]}
            >
              <View style={[styles.badge, isSelected ? styles.badgeSelected : null]}>
                <AppText variant="button" color={isSelected ? colors.primary : colors.textPrimary} weight="bold">
                  {opt.label}
                </AppText>
              </View>
              <AppText variant="body" color={labelColor} weight="medium" style={{ marginLeft: spacing.sm, flex: 1 }}>
                {opt.text}
              </AppText>
            </TouchableOpacity>
          );
        })}

        {/* Explanation Block */}
        {showExplanation && (
          <View style={styles.explanationBox}>
            <AppText variant="cardTitle" color={colors.primary} weight="bold">
              ব্যাখ্যা 💡
            </AppText>
            <AppText variant="bodySmall" color={colors.textPrimary} style={{ marginTop: 4 }}>
              {currentQ.explanation}
            </AppText>
          </View>
        )}
      </ScrollView>

      {/* Next CTA */}
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleNext}
        disabled={!selectedLabel}
        style={[styles.nextBtn, !selectedLabel ? styles.btnDisabled : null]}
      >
        <AppText variant="button" color={colors.white} weight="bold">
          {currentIndex === session.questions.length - 1 ? 'ফলাফল দেখুন →' : 'পরবর্তী প্রশ্ন →'}
        </AppText>
      </TouchableOpacity>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    paddingVertical: spacing.md,
    paddingBottom: 100,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  questionCard: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  questionText: {
    lineHeight: 28,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: radius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  optionNormal: {
    backgroundColor: colors.surface,
  },
  optionCorrect: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  optionWrong: {
    backgroundColor: colors.error,
    borderColor: colors.error,
  },
  badge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeSelected: {
    backgroundColor: colors.white,
  },
  explanationBox: {
    backgroundColor: colors.primaryLight,
    padding: spacing.md,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  nextBtn: {
    position: 'absolute',
    bottom: spacing.md,
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
  },
  btnDisabled: {
    opacity: 0.5,
  },
});
