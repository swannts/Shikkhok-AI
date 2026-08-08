import React from 'react';
import { View, StyleSheet } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { AppText } from '../ui/AppText';

interface StudentMessageProps {
  content: string;
}

export const StudentMessage: React.FC<StudentMessageProps> = ({ content }) => {
  return (
    <View style={styles.container}>
      <View style={styles.bubble}>
        <AppText variant="body" color={colors.white} weight="medium">
          {content}
        </AppText>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignSelf: 'flex-end',
    marginVertical: spacing.xs,
    maxWidth: '80%',
  },
  bubble: {
    backgroundColor: colors.primary,
    padding: spacing.md,
    borderRadius: radius.lg,
    borderBottomRightRadius: radius.xs,
  },
});
