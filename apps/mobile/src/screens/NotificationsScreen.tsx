import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Header, Card } from '../components';

interface NotificationsScreenProps {
  onBack?: () => void;
}

export const NotificationsScreen: React.FC<NotificationsScreenProps> = ({ onBack }) => {
  const notifs = [
    {
      id: '1',
      title: 'দৈনিক কুইজ রিমাইন্ডার 🔔',
      time: '১০ মিনিট আগে',
      desc: 'আজকের বীজগণিত প্র্যাকটিস এখনো বাকি!',
    },
    {
      id: '2',
      title: 'নতুন অধ্যায় যোগ হয়েছে 📚',
      time: '২ ঘণ্টা আগে',
      desc: 'বিজ্ঞান: মহাবিশ্ব ও সৌরজগত পাঠ তৈরি।',
    },
    {
      id: '3',
      title: 'সাপ্তাহিক রিপোর্ট তৈরি 📊',
      time: 'গতকাল',
      desc: 'তোমার অভিভাবক ড্যাশবোর্ডে নতুন পারফরম্যান্স আপডেট।',
    },
  ];

  return (
    <View style={styles.container}>
      <Header onBack={onBack} title="নোটিফিকেশন" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {notifs.map((item) => (
          <Card key={item.id} variant="outlined" style={styles.card}>
            <View style={styles.header}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
            <Text style={styles.desc}>{item.desc}</Text>
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
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  title: { fontSize: typography.size.sm, fontWeight: '700', color: colors.onSurface },
  time: { fontSize: typography.size.xs, color: colors.outline },
  desc: { fontSize: typography.size.xs, color: colors.onSurfaceVariant },
});
