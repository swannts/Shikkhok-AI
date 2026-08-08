import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Card, Button, Badge, ProgressBar, BottomNavigation, TabKey } from '../components';

interface HomeScreenProps {
  userName?: string;
  className?: string;
  onNavigateTab: (tab: TabKey) => void;
  onOpenLesson: () => void;
  onOpenPractice: () => void;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({
  userName = 'রাফি',
  className = 'Class 8',
  onNavigateTab,
  onOpenLesson,
  onOpenPractice,
}) => {
  const subjects = [
    { title: 'গণিত', icon: '📐', bg: colors.surfaceContainerLow },
    { title: 'বিজ্ঞান', icon: '🧪', bg: colors.surfaceContainer },
    { title: 'ইংরেজি', icon: '🔤', bg: colors.tertiaryFixed },
    { title: 'বাংলা', icon: '📖', bg: colors.errorContainer },
    { title: 'ICT', icon: '💻', bg: colors.surfaceContainerHigh },
  ];

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Top Greeting */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greetingTitle}>হ্যালো, {userName} 👋</Text>
            <Text style={styles.greetingSubtitle}>আজ কী শিখতে চাও?</Text>
          </View>
          <View style={styles.badgeRow}>
            <Badge label={className} variant="primary" />
          </View>
        </View>

        {/* AI Tutor Search Banner */}
        <Card variant="elevated" style={styles.aiBanner}>
          <View style={styles.aiHeader}>
            <View style={styles.aiBadgeIcon}>
              <Text style={{ fontSize: 20 }}>🤖</Text>
            </View>
            <Text style={styles.aiTitle}>AI শিক্ষককে জিজ্ঞেস করো</Text>
          </View>

          <TouchableOpacity
            activeOpacity={0.8}
            onPress={onOpenLesson}
            style={styles.searchBarMock}
          >
            <Text style={{ fontSize: 18, marginRight: 8 }}>🔍</Text>
            <Text style={styles.searchPlaceholder}>কী জানতে চাও?</Text>
            <View style={styles.searchIconsRight}>
              <Text style={styles.actionIconButton}>📷</Text>
              <Text style={styles.actionIconButton}>🎙️</Text>
            </View>
          </TouchableOpacity>
        </Card>

        {/* Continue Learning */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>চালিয়ে যাও</Text>
        </View>
        <Card variant="outlined" style={styles.continueCard}>
          <View style={styles.continueRow}>
            <View style={styles.continueIconBox}>
              <Text style={{ fontSize: 28 }}>📐</Text>
            </View>
            <View style={{ flex: 1, marginHorizontal: spacing.sm }}>
              <Text style={styles.subjectCategory}>গণিত</Text>
              <Text style={styles.lessonTitle}>সরল সমীকরণ</Text>
              <View style={{ marginTop: spacing.xs }}>
                <ProgressBar progress={0.6} color={colors.success} />
              </View>
            </View>
            <Button title="চালিয়ে যাও" onPress={onOpenLesson} size="small" />
          </View>
        </Card>

        {/* Subjects Grid */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>বিষয়সমূহ</Text>
          <TouchableOpacity>
            <Text style={styles.seeAllText}>সব দেখুন</Text>
          </TouchableOpacity>
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.subjectsScroll}>
          {subjects.map((sub, index) => (
            <TouchableOpacity
              key={index}
              activeOpacity={0.8}
              onPress={onOpenLesson}
              style={[styles.subjectItem, { backgroundColor: sub.bg }]}
            >
              <Text style={styles.subIcon}>{sub.icon}</Text>
              <Text style={styles.subTitle}>{sub.title}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Today's Plan */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>আজকের প্ল্যান 📅</Text>
        </View>
        <Card variant="filled" style={styles.planCard}>
          <View style={styles.planItem}>
            <Text style={styles.planCheck}>✅</Text>
            <View style={{ flex: 1, marginLeft: spacing.sm }}>
              <Text style={styles.planItemTitle}>বীজগণিত অধ্যায় ১ রিভিশন</Text>
              <Text style={styles.planItemTime}>১০ মিনিট • ১৫টি প্রশ্ন</Text>
            </View>
            <Button title="শুরু" onPress={onOpenPractice} variant="outline" size="small" />
          </View>
        </Card>
      </ScrollView>

      {/* Bottom Navigation Bar */}
      <BottomNavigation activeTab="home" onTabSelect={onNavigateTab} />
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
    paddingBottom: spacing.xl,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
    marginTop: spacing.sm,
  },
  greetingTitle: {
    fontSize: typography.size.headline,
    fontWeight: '800',
    color: colors.onSurface,
  },
  greetingSubtitle: {
    fontSize: typography.size.sm,
    color: colors.onSurfaceVariant,
  },
  badgeRow: {
    alignItems: 'flex-end',
  },
  aiBanner: {
    backgroundColor: colors.surface,
    marginBottom: spacing.lg,
    borderColor: colors.outlineVariant,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  aiBadgeIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  aiTitle: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.onSurface,
  },
  searchBarMock: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    borderRadius: spacing.borderRadius.md,
    paddingHorizontal: spacing.md,
    height: 48,
  },
  searchPlaceholder: {
    flex: 1,
    color: colors.outline,
    fontSize: typography.size.sm,
  },
  searchIconsRight: {
    flexDirection: 'row',
  },
  actionIconButton: {
    fontSize: 16,
    marginLeft: spacing.xs,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '700',
    color: colors.onSurface,
  },
  seeAllText: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: '600',
  },
  continueCard: {
    marginVertical: spacing.xs,
  },
  continueRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  continueIconBox: {
    width: 48,
    height: 48,
    borderRadius: spacing.borderRadius.md,
    backgroundColor: colors.surfaceContainerLow,
    alignItems: 'center',
    justifyContent: 'center',
  },
  subjectCategory: {
    fontSize: typography.size.xs,
    color: colors.secondary,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  lessonTitle: {
    fontSize: typography.size.md,
    fontWeight: '700',
    color: colors.onSurface,
  },
  subjectsScroll: {
    marginVertical: spacing.xs,
  },
  subjectItem: {
    width: 90,
    height: 100,
    borderRadius: spacing.borderRadius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.sm,
    padding: spacing.xs,
  },
  subIcon: {
    fontSize: 32,
    marginBottom: spacing.xs,
  },
  subTitle: {
    fontSize: typography.size.xs,
    fontWeight: '600',
    color: colors.onSurface,
  },
  planCard: {
    marginVertical: spacing.xs,
  },
  planItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  planCheck: {
    fontSize: 20,
  },
  planItemTitle: {
    fontSize: typography.size.sm,
    fontWeight: '600',
    color: colors.onSurface,
  },
  planItemTime: {
    fontSize: typography.size.xs,
    color: colors.onSurfaceVariant,
  },
});
