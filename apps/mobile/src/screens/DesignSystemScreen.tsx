import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Header, Button, Input, Card, Badge, ProgressBar } from '../components';

export const DesignSystemScreen: React.FC = () => {
  return (
    <View style={styles.container}>
      <Header title="Design System" subtitle="Shikkhok AI Visual Tokens & Components" />

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Colors Palette */}
        <Text style={styles.sectionTitle}>1. Color Tokens</Text>
        <View style={styles.colorGrid}>
          <View style={[styles.colorChip, { backgroundColor: colors.primary }]}>
            <Text style={styles.chipText}>Primary</Text>
          </View>
          <View style={[styles.colorChip, { backgroundColor: colors.secondary }]}>
            <Text style={styles.chipText}>Secondary</Text>
          </View>
          <View style={[styles.colorChip, { backgroundColor: colors.tertiary }]}>
            <Text style={styles.chipText}>Tertiary</Text>
          </View>
          <View style={[styles.colorChip, { backgroundColor: colors.success }]}>
            <Text style={styles.chipText}>Success</Text>
          </View>
          <View style={[styles.colorChip, { backgroundColor: colors.warning }]}>
            <Text style={styles.chipText}>Warning</Text>
          </View>
          <View style={[styles.colorChip, { backgroundColor: colors.error }]}>
            <Text style={styles.chipText}>Error</Text>
          </View>
        </View>

        {/* Buttons */}
        <Text style={styles.sectionTitle}>2. Buttons</Text>
        <Card variant="outlined" style={styles.groupCard}>
          <Button
            title="Primary Button"
            onPress={() => {}}
            size="large"
            style={{ marginBottom: 8 }}
          />
          <Button
            title="Secondary Button"
            onPress={() => {}}
            variant="secondary"
            style={{ marginBottom: 8 }}
          />
          <Button
            title="Tertiary Button"
            onPress={() => {}}
            variant="tertiary"
            style={{ marginBottom: 8 }}
          />
          <Button
            title="Outline Button"
            onPress={() => {}}
            variant="outline"
            style={{ marginBottom: 8 }}
          />
          <Button title="Disabled Button" onPress={() => {}} disabled />
        </Card>

        {/* Badges & Chips */}
        <Text style={styles.sectionTitle}>3. Badges & Indicators</Text>
        <Card variant="filled" style={styles.groupCard}>
          <View style={styles.badgeRow}>
            <Badge label="Class 8" variant="primary" style={{ marginRight: 8 }} />
            <Badge label="সফল" variant="success" style={{ marginRight: 8 }} />
            <Badge label="সতর্কতা" variant="warning" style={{ marginRight: 8 }} />
            <Badge label="নতুন" variant="tertiary" />
          </View>
          <View style={{ marginTop: spacing.md }}>
            <Text style={styles.label}>Progress Bar (60%)</Text>
            <ProgressBar progress={0.6} color={colors.primary} />
          </View>
        </Card>

        {/* Form Inputs */}
        <Text style={styles.sectionTitle}>4. Form Inputs</Text>
        <Card variant="outlined" style={styles.groupCard}>
          <Input label="Standard Input" placeholder="Type text here..." />
          <Input
            label="Input with Error"
            placeholder="Enter valid data"
            error="This field is required"
          />
        </Card>
      </ScrollView>
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
  sectionTitle: {
    fontSize: typography.size.lg,
    fontWeight: '800',
    color: colors.onSurface,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  colorChip: {
    width: '30%',
    height: 60,
    borderRadius: spacing.borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  chipText: {
    color: colors.white,
    fontWeight: '700',
    fontSize: typography.size.xs,
  },
  groupCard: {
    marginVertical: spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  label: {
    fontSize: typography.size.xs,
    color: colors.onSurfaceVariant,
    marginBottom: spacing.xs,
    fontWeight: '600',
  },
});
