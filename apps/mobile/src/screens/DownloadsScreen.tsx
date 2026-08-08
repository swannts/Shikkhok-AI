import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Header, Card, Button } from '../components';

interface DownloadsScreenProps {
  onBack?: () => void;
}

export const DownloadsScreen: React.FC<DownloadsScreenProps> = ({ onBack }) => {
  const items = [
    { id: '1', title: 'গণিত অধ্যায় ৩ লেকচার শিট (PDF)', size: '৪.২ MB' },
    { id: '2', title: 'বিজ্ঞান অধ্যায় ১ অফলাইন নোট', size: '২.১ MB' },
  ];

  return (
    <View style={styles.container}>
      <Header onBack={onBack} title="ডাউনলোডসমূহ" subtitle="অফলাইন স্টাডি মেটেরিয়াল" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {items.map((item) => (
          <Card key={item.id} variant="outlined" style={styles.card}>
            <View style={styles.row}>
              <Text style={{ fontSize: 24, marginRight: spacing.sm }}>📄</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.size}>{item.size}</Text>
              </View>
              <Button title="পড়ুন" onPress={() => {}} size="small" />
            </View>
          </Card>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  scrollContent: { padding: spacing.md },
  card: { marginVertical: spacing.xs },
  row: { flexDirection: 'row', alignItems: 'center' },
  title: { fontSize: typography.size.sm, fontWeight: '700', color: colors.onSurface },
  size: { fontSize: typography.size.xs, color: colors.outline },
});
