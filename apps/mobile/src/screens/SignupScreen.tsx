import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Button, Input, Header } from '../components';

interface SignupScreenProps {
  onSignupSubmit: () => void;
  onLogin: () => void;
}

export const SignupScreen: React.FC<SignupScreenProps> = ({
  onSignupSubmit,
  onLogin,
}) => {
  const [fullName, setFullName] = useState('');
  const [phoneOrEmail, setPhoneOrEmail] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Header onBack={onLogin} />

        <View style={styles.headerArea}>
          <Text style={styles.title}>নতুন অ্যাকাউন্ট খুলুন ✨</Text>
          <Text style={styles.subtitle}>সহজে রেজিস্ট্রেশন করে শেখা শুরু করো</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="পূর্ণ নাম"
            placeholder="তোমার নাম লিখো"
            value={fullName}
            onChangeText={setFullName}
          />

          <Input
            label="ফোন নম্বর অথবা ইমেইল"
            placeholder="017XXXXXXXX / example@gmail.com"
            value={phoneOrEmail}
            onChangeText={setPhoneOrEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="পাসওয়ার্ড"
            placeholder="কমপক্ষে ৮ অক্ষরের পাসওয়ার্ড"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <Button
            title="সাইন আপ করুন"
            onPress={onSignupSubmit}
            size="large"
            style={{ marginTop: spacing.lg }}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>অথবা</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Google দিয়ে সাইন আপ করুন"
            onPress={() => {}}
            variant="outline"
            size="large"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>ইতিমধ্যে অ্যাকাউন্ট আছে? </Text>
          <TouchableOpacity onPress={onLogin}>
            <Text style={styles.loginLink}>লগইন করো</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flexGrow: 1,
    padding: spacing.md,
    justifyContent: 'space-between',
  },
  headerArea: {
    marginVertical: spacing.md,
  },
  title: {
    fontSize: typography.size.headline,
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.onSurfaceVariant,
  },
  form: {
    marginVertical: spacing.md,
  },
  dividerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: colors.outlineVariant,
  },
  dividerText: {
    marginHorizontal: spacing.sm,
    fontSize: typography.size.xs,
    color: colors.outline,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: spacing.lg,
  },
  footerText: {
    fontSize: typography.size.sm,
    color: colors.onSurfaceVariant,
  },
  loginLink: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: '700',
  },
});
