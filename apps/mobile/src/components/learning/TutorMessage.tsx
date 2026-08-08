import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { AppText } from '../ui/AppText';

interface TutorMessageProps {
  content: string;
  actions?: { label: string; actionKey: string }[];
  onActionPress?: (actionKey: string) => void;
}

export const TutorMessage: React.FC<TutorMessageProps> = ({ content, actions, onActionPress }) => {
  return (
    <View style={styles.container}>
      <View style={styles.avatarCircle}>
        <AppText style={styles.avatarIcon}>🤖</AppText>
      </View>
      <View style={styles.bubbleContent}>
        <View style={styles.bubble}>
          <AppText variant="body" color={colors.textPrimary}>
            {content}
          </AppText>
        </View>

        {actions && actions.length > 0 && (
          <View style={styles.actionsContainer}>
            {actions.map((act) => (
              <TouchableOpacity
                key={act.actionKey}
                activeOpacity={0.8}
                onPress={() => onActionPress && onActionPress(act.actionKey)}
                style={styles.actionChip}
              >
                <AppText variant="caption" color={colors.primary} weight="bold">
                  {act.label}
                </AppText>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginVertical: spacing.xs,
    alignItems: 'flex-start',
  },
  avatarCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  avatarIcon: {
    fontSize: 20,
  },
  bubbleContent: {
    flex: 1,
  },
  bubble: {
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderTopLeftRadius: radius.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  actionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.xs,
  },
  actionChip: {
    backgroundColor: colors.primaryLight,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
    marginRight: spacing.xs,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
});
