import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Header, Input, Card } from '../components';

interface SearchScreenProps {
  onBack?: () => void;
}

export const SearchScreen: React.FC<SearchScreenProps> = ({ onBack }) => {
  const [query, setQuery] = useState('');

  return (
    <View style={styles.container}>
      <Header onBack={onBack} title="অনুসন্ধান (Search)" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Input
          placeholder="বিষয়, অধ্যায় বা টপিক খুঁজুন..."
          value={query}
          onChangeText={setQuery}
        />

        <Text style={styles.sectionTitle}>জনপ্রিয় সার্চসমূহ 🔥</Text>
        {['পিথাগোরাসের উপপাদ্য', 'সরল সমীকরণ', 'সালোকসংশ্লেষণ', 'পর্যায় সারণী'].map((item, idx) => (
          <Card key={idx} variant="filled" style={styles.card}>
            <Text style={styles.itemText}>🔍 {item}</Text>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },
  sectionTitle: { fontSize: typography.size.md, fontWeight: '700', color: colors.onSurface, marginTop: spacing.md, marginBottom: spacing.xs },
  card: { marginVertical: spacing.xs },
  itemText: { fontSize: typography.size.sm, color: colors.onSurface, fontWeight: '600' },
});
