import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity, Modal } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius } from '../../theme';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { LoadingState } from '../../components/ui/LoadingState';
import { ErrorState } from '../../components/ui/ErrorState';
import { examRepository, ExamResult } from '../../api/repositories/examRepository';

interface ExamSessionScreenProps {
  examId?: string;
  onFinishExam: (result: ExamResult) => void;
  onCancel: () => void;
}

export const ExamSessionScreen: React.FC<ExamSessionScreenProps> = ({
  examId = 'model-test-1',
  onFinishExam,
  onCancel,
}) => {
  const [started, setStarted] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [flagged, setFlagged] = useState<Record<string, boolean>>({});
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [remainingSeconds, setRemainingSeconds] = useState(20 * 60);

  const { data: exam, isLoading, isError, refetch } = useQuery({
    queryKey: ['examDetails', examId],
    queryFn: () => examRepository.getExamDetails(examId),
  });

  useEffect(() => {
    if (started) {
      const timer = setInterval(() => {
        setRemainingSeconds((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            handleConfirmSubmit();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [started]);

  if (isLoading || !exam) {
    return (
      <Screen>
        <LoadingState message="পরীক্ষার তথ্য লোড হচ্ছে..." />
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

  // Pre-exam Instructions view
  if (!started) {
    return (
      <Screen>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <TouchableOpacity onPress={onCancel} style={{ marginBottom: spacing.xs }}>
            <AppText variant="bodySmall" color={colors.primary} weight="bold">
              ← ফিরে যাও
            </AppText>
          </TouchableOpacity>

          <AppText variant="pageTitle" weight="bold">
            {exam.title}
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary} style={{ marginBottom: spacing.lg }}>
            {exam.subjectName} • সময়: {exam.timeLimitMinutes} মিনিট • নম্বর: {exam.totalMarks}
          </AppText>

          <View style={styles.rulesCard}>
            <AppText variant="cardTitle" weight="bold" style={{ marginBottom: spacing.xs }}>
              পরীক্ষার নিয়মাবলী 📋
            </AppText>
            {exam.instructions.map((inst, idx) => (
              <AppText key={idx} variant="bodySmall" color={colors.textPrimary} style={{ marginTop: 4 }}>
                • {inst}
              </AppText>
            ))}
          </View>

          <TouchableOpacity activeOpacity={0.9} onPress={() => setStarted(true)} style={styles.startBtn}>
            <AppText variant="button" color={colors.white} weight="bold">
              পরীক্ষা শুরু করো ⏱️
            </AppText>
          </TouchableOpacity>
        </ScrollView>
      </Screen>
    );
  }

  const currentQ = exam.questions[currentIndex];
  const selectedOpt = answers[currentQ.id];
  const isFlagged = !!flagged[currentQ.id];

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    const result = await examRepository.submitExam(examId, answers);
    onFinishExam(result);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Exam Timer & Status Header */}
        <View style={styles.examHeader}>
          <TouchableOpacity onPress={() => setShowConfirmModal(true)}>
            <AppText variant="bodySmall" color={colors.error} weight="bold">
              Submit Exam
            </AppText>
          </TouchableOpacity>

          <View style={styles.timerBadge}>
            <AppText variant="bodySmall" color={colors.primary} weight="bold">
              ⏱️ {Math.floor(remainingSeconds / 60)}:{(remainingSeconds % 60).toString().padStart(2, '0')}
            </AppText>
          </View>

          <TouchableOpacity
            onPress={() => setFlagged((prev) => ({ ...prev, [currentQ.id]: !prev[currentQ.id] }))}
          >
            <AppText variant="bodySmall" color={isFlagged ? colors.warning : colors.outline} weight="bold">
              {isFlagged ? '🚩 Flagged' : '🏳️ Flag'}
            </AppText>
          </TouchableOpacity>
        </View>

        {/* Question Navigator Pills */}
        <View style={styles.navigatorRow}>
          {exam.questions.map((q, idx) => {
            const isAns = !!answers[q.id];
            const isCurr = idx === currentIndex;
            return (
              <TouchableOpacity
                key={q.id}
                onPress={() => setCurrentIndex(idx)}
                style={[
                  styles.navPill,
                  isCurr ? styles.navCurr : isAns ? styles.navAns : styles.navUnans,
                ]}
              >
                <AppText
                  variant="caption"
                  color={isCurr || isAns ? colors.white : colors.textPrimary}
                  weight="bold"
                >
                  {idx + 1}
                </AppText>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Question Body */}
        <View style={styles.qBox}>
          <AppText variant="cardTitle" weight="bold">
            প্রশ্ন {currentIndex + 1}: {currentQ.questionText}
          </AppText>
        </View>

        {/* Options (strictly NO correct/incorrect indicators until submit) */}
        {currentQ.options.map((opt) => {
          const isSelected = selectedOpt === opt.label;
          return (
            <TouchableOpacity
              key={opt.label}
              activeOpacity={0.8}
              onPress={() => setAnswers((prev) => ({ ...prev, [currentQ.id]: opt.label }))}
              style={[styles.optCard, isSelected ? styles.optSelected : null]}
            >
              <AppText variant="button" color={isSelected ? colors.white : colors.textPrimary} weight="bold">
                {opt.label}. {opt.text}
              </AppText>
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Footer Navigation */}
      <View style={styles.footerRow}>
        <TouchableOpacity
          disabled={currentIndex === 0}
          onPress={() => setCurrentIndex((prev) => prev - 1)}
          style={[styles.footerBtn, currentIndex === 0 ? { opacity: 0.5 } : null]}
        >
          <AppText variant="button" color={colors.textPrimary} weight="bold">
            ← আগেরটি
          </AppText>
        </TouchableOpacity>

        {currentIndex === exam.questions.length - 1 ? (
          <TouchableOpacity onPress={() => setShowConfirmModal(true)} style={[styles.footerBtn, styles.submitBtn]}>
            <AppText variant="button" color={colors.white} weight="bold">
              Submit Exam ✓
            </AppText>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity onPress={() => setCurrentIndex((prev) => prev + 1)} style={[styles.footerBtn, styles.nextBtn]}>
            <AppText variant="button" color={colors.white} weight="bold">
              পরবর্তী →
            </AppText>
          </TouchableOpacity>
        )}
      </View>

      {/* Confirmation Modal */}
      <Modal visible={showConfirmModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <AppText variant="cardTitle" weight="bold">
              পরীক্ষা সম্পন্ন করতে চাও?
            </AppText>
            <AppText variant="bodySmall" color={colors.textSecondary} style={{ marginVertical: spacing.sm }}>
              তুমি {Object.keys(answers).length}/{exam.questions.length} টি প্রশ্নের উত্তর দিয়েছ।
            </AppText>

            <View style={styles.modalActions}>
              <TouchableOpacity onPress={() => setShowConfirmModal(false)} style={styles.cancelBtn}>
                <AppText variant="button" color={colors.textPrimary}>
                  ফিরে যাও
                </AppText>
              </TouchableOpacity>

              <TouchableOpacity onPress={handleConfirmSubmit} style={styles.confirmBtn}>
                <AppText variant="button" color={colors.white} weight="bold">
                  হ্যাঁ, Submit করো
                </AppText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingVertical: spacing.md, paddingBottom: 100 },
  rulesCard: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.lg },
  startBtn: { backgroundColor: colors.primary, paddingVertical: spacing.md, borderRadius: radius.md, alignItems: 'center' },
  examHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  timerBadge: { backgroundColor: colors.primaryLight, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.full },
  navigatorRow: { flexDirection: 'row', marginBottom: spacing.md },
  navPill: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginRight: spacing.xs },
  navCurr: { backgroundColor: colors.primary },
  navAns: { backgroundColor: colors.success },
  navUnans: { backgroundColor: colors.surfaceContainerHigh },
  qBox: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.md, borderWidth: 1, borderColor: colors.border, marginBottom: spacing.md },
  optCard: { padding: spacing.md, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, marginBottom: spacing.sm },
  optSelected: { backgroundColor: colors.primary, borderColor: colors.primary },
  footerRow: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: colors.surface, padding: spacing.md, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', justifyContent: 'space-between' },
  footerBtn: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm, borderRadius: radius.md, backgroundColor: colors.surfaceContainerLow },
  nextBtn: { backgroundColor: colors.primary },
  submitBtn: { backgroundColor: colors.success },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', padding: spacing.lg },
  modalContent: { backgroundColor: colors.surface, borderRadius: radius.lg, padding: spacing.lg },
  modalActions: { flexDirection: 'row', justifyContent: 'flex-end', marginTop: spacing.md },
  cancelBtn: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, marginRight: spacing.sm },
  confirmBtn: { backgroundColor: colors.primary, paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.md },
});
