import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Header, Card, Button, Badge, ProgressBar } from '../components';

interface LessonScreenProps {
  onBack?: () => void;
  onAskAI?: () => void;
}

export const LessonScreen: React.FC<LessonScreenProps> = ({
  onBack,
  onAskAI,
}) => {
  return (
    <View style={styles.container}>
      <Header onBack={onBack} title="পড়াশোনা" subtitle="গণিত • অধ্যায় ৩" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Lesson Progress */}
        <View style={styles.progressBox}>
          <View style={styles.progressHeader}>
            <Text style={styles.chapterBadge}>অধ্যায় ৩.১</Text>
            <Text style={styles.progressText}>পাঠ অগ্রগতি: ৭০%</Text>
          </View>
          <ProgressBar progress={0.7} color={colors.primary} />
        </View>

        {/* Title */}
        <Text style={styles.lessonTitle}>সরল সমীকরণ ও এর সমাধান</Text>

        {/* Explanation paragraph */}
        <Text style={styles.paragraph}>
          সমীকরণ হলো একটি গাণিতিক বাক্য যেখানে দুটি রাশি সমান চিহ্ন (=) দ্বারা যুক্ত থাকে।
          অজ্ঞাত রাশির মান নির্ণয় করাই সমীকরণের মূল উদ্দেশ্য।
        </Text>

        {/* Key takeaway card */}
        <Card variant="filled" style={styles.rememberCard}>
          <View style={styles.rememberHeader}>
            <Text style={{ fontSize: 20, marginRight: 6 }}>💡</Text>
            <Text style={styles.rememberTitle}>মনে রাখো</Text>
          </View>
          <Text style={styles.bulletPoint}>• সমীকরণের বামপক্ষ ও ডানপক্ষ সর্বদা সমান হয়।</Text>
          <Text style={styles.bulletPoint}>
            • সমীকরণের উভয় পক্ষে একই সংখ্যা যোগ, বিয়োগ, গুণ বা ভাগ করলে মান অপরিবর্তিত থাকে।
          </Text>
        </Card>

        {/* Example section */}
        <View style={styles.sectionMargin}>
          <Text style={styles.sectionTitle}>উদাহরণ:</Text>
          <Card variant="outlined" style={styles.exampleCard}>
            <Text style={styles.exampleText}>
              ধরি, একটি সংখ্যা <Text style={styles.highlightText}>x</Text>। সংখ্যাটির সাথে 5 যোগ করলে যোগফল 17 হয়। সমীকরণটি সমাধান করো।
            </Text>

            <View style={styles.formulaBox}>
              <Text style={styles.formulaText}>x + 5 = 17</Text>
            </View>

            <View style={styles.solutionStep}>
              <Text style={styles.stepText}>বা, x + 5 - 5 = 17 - 5 (উভয় পক্ষ থেকে 5 বিয়োগ করে)</Text>
            </View>

            <View style={styles.resultBox}>
              <Text style={styles.resultText}>∴ x = 12</Text>
            </View>
          </Card>
        </View>

        {/* AI Tutor Floating CTA */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onAskAI}
          style={styles.aiButton}
        >
          <Text style={{ fontSize: 20, marginRight: 8 }}>🤖</Text>
          <Text style={styles.aiButtonText}>AI শিক্ষককে জিজ্ঞেস করো</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Sticky Controls */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.navBtn}>
          <Text style={styles.navBtnText}>← পূর্ববর্তী</Text>
        </TouchableOpacity>
        <Button title="Mark Complete ✓" onPress={() => {}} size="medium" />
        <TouchableOpacity style={styles.navBtn}>
          <Text style={styles.navBtnText}>পরবর্তী →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  progressBox: {
    marginBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  chapterBadge: {
    fontSize: typography.size.xs,
    fontWeight: '700',
    color: colors.primary,
  },
  progressText: {
    fontSize: typography.size.xs,
    color: colors.onSurfaceVariant,
  },
  lessonTitle: {
    fontSize: typography.size.xxl,
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  paragraph: {
    fontSize: typography.size.md,
    color: colors.onSurfaceVariant,
    lineHeight: 24,
    marginBottom: spacing.md,
  },
  rememberCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    marginVertical: spacing.sm,
  },
  rememberHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  rememberTitle: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.primary,
  },
  bulletPoint: {
    fontSize: typography.size.sm,
    color: colors.onSurfaceVariant,
    lineHeight: 20,
    marginTop: 4,
  },
  sectionMargin: {
    marginVertical: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  exampleCard: {
    backgroundColor: colors.surface,
  },
  exampleText: {
    fontSize: typography.size.md,
    color: colors.onSurface,
    marginBottom: spacing.sm,
  },
  highlightText: {
    color: colors.primary,
    fontWeight: '700',
  },
  formulaBox: {
    backgroundColor: colors.surfaceContainerLow,
    padding: spacing.md,
    borderRadius: spacing.borderRadius.md,
    alignItems: 'center',
    marginVertical: spacing.sm,
  },
  formulaText: {
    fontSize: typography.size.xl,
    fontWeight: '700',
    color: colors.onSurface,
  },
  solutionStep: {
    marginVertical: spacing.xs,
  },
  stepText: {
    fontSize: typography.size.sm,
    color: colors.onSurfaceVariant,
  },
  resultBox: {
    marginTop: spacing.xs,
  },
  resultText: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.success,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.surfaceContainer,
    paddingVertical: spacing.md,
    borderRadius: spacing.borderRadius.lg,
    borderWidth: 1,
    borderColor: colors.secondaryContainer,
    marginVertical: spacing.md,
  },
  aiButtonText: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.primary,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.outlineVariant,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  navBtn: {
    padding: spacing.xs,
  },
  navBtnText: {
    fontSize: typography.size.sm,
    color: colors.onSurfaceVariant,
    fontWeight: '600',
  },
});
