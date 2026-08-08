import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Header, Card, Badge } from '../components';

interface ChatHistoryScreenProps {
  onBack?: () => void;
  onSelectChat?: () => void;
}

export const ChatHistoryScreen: React.FC<ChatHistoryScreenProps> = ({ onBack, onSelectChat }) => {
  const history = [
    { id: '1', title: 'সরল সমীকরণের সমাধান কীভাবে করব?', date: 'আজ, ২:৩০ PM', category: 'গণিত' },
    {
      id: '2',
      title: 'Photosynthesis বা সালোকসংশ্লেষণ ব্যাখ্যা করো',
      date: 'গতকাল',
      category: 'বিজ্ঞান',
    },
    { id: '3', title: 'Right forms of verbs নিয়মাবলী', date: '৫ আগস্ট', category: 'ইংরেজি' },
  ];

  return (
    <View style={styles.container}>
      <Header onBack={onBack} title="আগের আলোচনা" subtitle="AI শিক্ষকের সাথে কথোপকথন" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {history.map((item) => (
          <TouchableOpacity key={item.id} activeOpacity={0.8} onPress={onSelectChat}>
            <Card variant="outlined" style={styles.itemCard}>
              <View style={styles.cardHeader}>
                <Badge label={item.category} variant="primary" />
                <Text style={styles.dateText}>{item.date}</Text>
              </View>
              <Text style={styles.chatTitle}>{item.title}</Text>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },
  itemCard: { marginVertical: spacing.xs },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  dateText: { fontSize: typography.size.xs, color: colors.outline },
  chatTitle: {
    fontSize: typography.size.md,
    fontWeight: '600',
    color: colors.onSurface,
    marginTop: 4,
  },
});
