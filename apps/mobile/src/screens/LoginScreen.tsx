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

interface LoginScreenProps {
  onLogin: () => void;
  onSignup: () => void;
  onForgotPassword?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  onLogin,
  onSignup,
  onForgotPassword,
}) => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.keyboardView}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <Header title="" />

        <View style={styles.headerArea}>
          <Text style={styles.title}>স্বাগতম! 👋</Text>
          <Text style={styles.subtitle}>তোমার অ্যাকাউন্টে লগইন করো</Text>
        </View>

        <View style={styles.form}>
          <Input
            label="ইমেইল বা ফোন নম্বর"
            placeholder="user@example.com / 017XXXXXXXX"
            value={identifier}
            onChangeText={setIdentifier}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Input
            label="পাসওয়ার্ড"
            placeholder="••••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          <TouchableOpacity
            activeOpacity={0.7}
            onPress={onForgotPassword}
            style={styles.forgotPassContainer}
          >
            <Text style={styles.forgotPassText}>পাসওয়ার্ড ভুলে গেছ?</Text>
          </TouchableOpacity>

          <Button
            title="লগইন"
            onPress={onLogin}
            size="large"
            style={{ marginTop: spacing.md }}
          />

          <View style={styles.dividerContainer}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>অথবা</Text>
            <View style={styles.dividerLine} />
          </View>

          <Button
            title="Google দিয়ে লগইন করো"
            onPress={() => {}}
            variant="outline"
            size="large"
          />
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>অ্যাকাউন্ট নেই? </Text>
          <TouchableOpacity onPress={onSignup}>
            <Text style={styles.signupLink}>নতুন অ্যাকাউন্ট তৈরি করো</Text>
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
    marginVertical: spacing.lg,
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
  forgotPassContainer: {
    alignSelf: 'flex-end',
    marginVertical: spacing.xs,
  },
  forgotPassText: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: '600',
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
  signupLink: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: '700',
  },
});
