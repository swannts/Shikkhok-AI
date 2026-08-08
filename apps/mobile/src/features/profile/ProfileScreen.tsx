import React from 'react';
import { View, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, spacing, radius } from '../../theme';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { useAuthStore } from '../../store/useAuthStore';
import { useUIStore } from '../../store/useUIStore';
import { t } from '../../localization/i18n';

interface ProfileScreenProps {
  onOpenParentDashboard: () => void;
  onOpenSubscription: () => void;
  onOpenNotifications: () => void;
  onOpenDownloads: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  onOpenParentDashboard,
  onOpenSubscription,
  onOpenNotifications,
  onOpenDownloads,
  onLogout,
}) => {
  const user = useAuthStore((state) => state.user);
  const { language, setLanguage } = useUIStore();

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Profile Card Header */}
        <View style={styles.profileHeader}>
          <View style={styles.avatarCircle}>
            <AppText style={{ fontSize: 36 }}>👤</AppText>
          </View>
          <AppText variant="cardTitle" weight="bold" style={{ marginTop: spacing.xs }}>
            {user?.name || 'রাফি আহমেদ'}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {user?.className || 'Class 8'} • বাংলা মাধ্যম
          </AppText>
        </View>

        {/* Live Language Switcher */}
        <View style={styles.menuSection}>
          <AppText
            variant="caption"
            color={colors.textSecondary}
            weight="bold"
            style={{ marginBottom: spacing.xs }}
          >
            ভাষা (Language)
          </AppText>

          <View style={styles.langRow}>
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLanguage('bn')}
              style={[styles.langBtn, language === 'bn' ? styles.langActive : null]}
            >
              <AppText
                variant="button"
                color={language === 'bn' ? colors.white : colors.textPrimary}
                weight="bold"
              >
                বাংলা (Bangla)
              </AppText>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.8}
              onPress={() => setLanguage('en')}
              style={[styles.langBtn, language === 'en' ? styles.langActive : null]}
            >
              <AppText
                variant="button"
                color={language === 'en' ? colors.white : colors.textPrimary}
                weight="bold"
              >
                English
              </AppText>
            </TouchableOpacity>
          </View>
        </View>

        {/* Menu Items */}
        <AppText
          variant="caption"
          color={colors.textSecondary}
          weight="bold"
          style={{ marginBottom: spacing.xs }}
        >
          মেনু ও সেটিংস
        </AppText>

        <TouchableOpacity
          activeOpacity={0.8}
          onPress={onOpenParentDashboard}
          style={styles.menuItem}
        >
          <AppText style={{ fontSize: 20, marginRight: spacing.sm }}>👨‍👩‍👦</AppText>
          <AppText variant="body" weight="semiBold" style={{ flex: 1 }}>
            অভিভাবক ড্যাশবোর্ড (Parent Account)
          </AppText>
          <AppText variant="bodySmall" color={colors.primary}>
            →
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} onPress={onOpenSubscription} style={styles.menuItem}>
          <AppText style={{ fontSize: 20, marginRight: spacing.sm }}>⭐</AppText>
          <AppText variant="body" weight="semiBold" style={{ flex: 1 }}>
            সাবস্ক্রিপশন ও প্রিমিয়াম (Subscription)
          </AppText>
          <AppText variant="bodySmall" color={colors.primary}>
            →
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} onPress={onOpenNotifications} style={styles.menuItem}>
          <AppText style={{ fontSize: 20, marginRight: spacing.sm }}>🔔</AppText>
          <AppText variant="body" weight="semiBold" style={{ flex: 1 }}>
            নোটিফিকেশন সেটিংস
          </AppText>
          <AppText variant="bodySmall" color={colors.primary}>
            →
          </AppText>
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.8} onPress={onOpenDownloads} style={styles.menuItem}>
          <AppText style={{ fontSize: 20, marginRight: spacing.sm }}>📥</AppText>
          <AppText variant="body" weight="semiBold" style={{ flex: 1 }}>
            ডাউনলোডসমূহ (Offline Material)
          </AppText>
          <AppText variant="bodySmall" color={colors.primary}>
            →
          </AppText>
        </TouchableOpacity>

        {/* Logout Button */}
        <TouchableOpacity activeOpacity={0.8} onPress={onLogout} style={styles.logoutBtn}>
          <AppText variant="button" color={colors.error} weight="bold">
            লগআউট করুন 🚪
          </AppText>
        </TouchableOpacity>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingVertical: spacing.md, paddingBottom: spacing.xxl },
  profileHeader: { alignItems: 'center', marginBottom: spacing.lg },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primaryLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuSection: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: spacing.lg,
  },
  langRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.xs },
  langBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
    backgroundColor: colors.surfaceContainerLow,
    marginHorizontal: 4,
  },
  langActive: { backgroundColor: colors.primary },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.xs,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoutBtn: {
    backgroundColor: colors.errorLight,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
});
