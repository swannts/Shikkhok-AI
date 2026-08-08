import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, TouchableOpacity } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { colors, spacing, radius } from '../../theme';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { TutorMessage as TutorMsgComponent } from '../../components/learning/TutorMessage';
import { StudentMessage } from '../../components/learning/StudentMessage';
import { TutorComposer } from '../../components/learning/TutorComposer';
import { tutorRepository } from '../../api/repositories/tutorRepository';
import { TutorMessage } from '../../api/types';

interface TutorScreenProps {
  initialPrompt?: string;
  onBack?: () => void;
}

export const TutorScreen: React.FC<TutorScreenProps> = ({ initialPrompt, onBack }) => {
  const [messages, setMessages] = useState<TutorMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);

  const { data: history } = useQuery({
    queryKey: ['tutorHistory'],
    queryFn: () => tutorRepository.getConversationHistory(),
  });

  useEffect(() => {
    if (history) {
      setMessages(history);
      if (initialPrompt) {
        handleSendMessage(initialPrompt);
      }
    }
  }, [history, initialPrompt]);

  const handleSendMessage = async (text: string) => {
    const studentMsg: TutorMessage = {
      id: `std-${Date.now()}`,
      role: 'student',
      content: text,
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, studentMsg]);
    setIsTyping(true);

    const placeholderId = `ai-${Date.now()}`;
    const initialAiMsg: TutorMessage = {
      id: placeholderId,
      role: 'assistant',
      content: '',
      createdAt: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, initialAiMsg]);

    await tutorRepository.sendMessage(text, (partialText) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === placeholderId ? { ...m, content: partialText } : m))
      );
    });

    setIsTyping(false);
  };

  const handleQuickAction = (actionKey: string) => {
    if (actionKey === 'hint') {
      handleSendMessage('আমাকে একটি হিন্ট দাও');
    } else if (actionKey === 'simpler') {
      handleSendMessage('আরও সহজ করে বুঝিয়ে দাও');
    } else if (actionKey === 'understood') {
      handleSendMessage('ধন্যবাদ, আমি বুঝেছি!');
    } else {
      handleSendMessage('এই বিষয়ে আরও বলো');
    }
  };

  return (
    <Screen padded={false}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}
      >
        {/* Header */}
        <View style={styles.header}>
          {onBack && (
            <TouchableOpacity onPress={onBack} style={styles.backBtn}>
              <AppText variant="bodySmall" color={colors.primary} weight="bold">
                ←
              </AppText>
            </TouchableOpacity>
          )}
          <View>
            <AppText variant="cardTitle" weight="bold">
              AI শিক্ষক (Shikkhok AI Tutor)
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              Class 8 • গণিত • বীজগণিত
            </AppText>
          </View>
        </View>

        {/* Message Trajectory */}
        <ScrollView contentContainerStyle={styles.messageList}>
          {messages.map((msg) => {
            if (msg.role === 'student') {
              return <StudentMessage key={msg.id} content={msg.content} />;
            }
            return (
              <TutorMsgComponent
                key={msg.id}
                content={msg.content || (isTyping ? 'চিন্তা করছি...' : '')}
                actions={msg.actions}
                onActionPress={handleQuickAction}
              />
            );
          })}
        </ScrollView>

        {/* Composer */}
        <TutorComposer onSend={handleSendMessage} disabled={isTyping} />
      </KeyboardAvoidingView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    backgroundColor: colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    marginRight: spacing.sm,
  },
  messageList: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
});
