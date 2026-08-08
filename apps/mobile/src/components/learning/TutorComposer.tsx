import React, { useState } from 'react';
import { View, TextInput, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { AppText } from '../ui/AppText';

interface TutorComposerProps {
  onSend: (text: string) => void;
  disabled?: boolean;
}

export const TutorComposer: React.FC<TutorComposerProps> = ({ onSend, disabled }) => {
  const [text, setText] = useState('');

  const handleSend = () => {
    if (text.trim()) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity activeOpacity={0.7} style={styles.iconButton}>
        <AppText style={{ fontSize: 20 }}>📷</AppText>
      </TouchableOpacity>

      <TouchableOpacity activeOpacity={0.7} style={styles.iconButton}>
        <AppText style={{ fontSize: 20 }}>🎙️</AppText>
      </TouchableOpacity>

      <TextInput
        placeholder="তোমার প্রশ্ন এখানে লেখো..."
        placeholderTextColor={colors.outline}
        value={text}
        onChangeText={setText}
        style={styles.input}
        multiline
      />

      <TouchableOpacity
        activeOpacity={0.8}
        onPress={handleSend}
        disabled={disabled || !text.trim()}
        style={[styles.sendButton, text.trim() ? styles.sendActive : null]}
      >
        <AppText style={{ fontSize: 18 }}>➔</AppText>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  iconButton: {
    padding: spacing.xs,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    maxHeight: 100,
    fontSize: 16,
    color: colors.textPrimary,
    marginHorizontal: spacing.xs,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendActive: {
    backgroundColor: colors.primary,
  },
});
