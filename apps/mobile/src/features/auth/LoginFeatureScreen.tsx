import React from 'react';
import { View, StyleSheet, ScrollView, TextInput, TouchableOpacity } from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { colors, spacing, radius } from '../../theme';
import { Screen } from '../../components/ui/Screen';
import { AppText } from '../../components/ui/AppText';
import { authRepository } from '../../api/repositories/authRepository';
import { useAuthStore } from '../../store/useAuthStore';

const loginSchema = z.object({
  identifier: z.string().min(3, 'ফোন নম্বর বা ইমেইল প্রদান করুন'),
  password: z.string().min(6, 'পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে'),
});

type LoginFormValues = z.infer<typeof loginSchema>;

interface LoginFeatureScreenProps {
  onSuccess: () => void;
  onGoSignup: () => void;
  onGoOTP: () => void;
}

export const LoginFeatureScreen: React.FC<LoginFeatureScreenProps> = ({
  onSuccess,
  onGoSignup,
  onGoOTP,
}) => {
  const setAuthenticated = useAuthStore((state) => state.setAuthenticated);

  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      identifier: '01712345678',
      password: 'password123',
    },
  });

  const onSubmit = async (values: LoginFormValues) => {
    const res = await authRepository.login(values);
    setAuthenticated(res.user);
    onSuccess();
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <AppText variant="display" weight="bold">
            স্বাগতম! 👋
          </AppText>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            তোমার অ্যাকাউন্টে লগইন করো
          </AppText>
        </View>

        {/* Identifier Field */}
        <AppText variant="caption" weight="bold" style={{ marginBottom: 4 }}>
          ইমেইল বা ফোন নম্বর
        </AppText>
        <Controller
          control={control}
          name="identifier"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="user@example.com / 017XXXXXXXX"
              placeholderTextColor={colors.outline}
              value={value}
              onChangeText={onChange}
              style={[styles.input, errors.identifier ? styles.inputError : null]}
              autoCapitalize="none"
            />
          )}
        />
        {errors.identifier && (
          <AppText variant="caption" color={colors.error} style={{ marginBottom: spacing.xs }}>
            {errors.identifier.message}
          </AppText>
        )}

        {/* Password Field */}
        <AppText variant="caption" weight="bold" style={{ marginTop: spacing.sm, marginBottom: 4 }}>
          পাসওয়ার্ড
        </AppText>
        <Controller
          control={control}
          name="password"
          render={({ field: { onChange, value } }) => (
            <TextInput
              placeholder="••••••••"
              placeholderTextColor={colors.outline}
              value={value}
              onChangeText={onChange}
              secureTextEntry
              style={[styles.input, errors.password ? styles.inputError : null]}
            />
          )}
        />
        {errors.password && (
          <AppText variant="caption" color={colors.error} style={{ marginBottom: spacing.xs }}>
            {errors.password.message}
          </AppText>
        )}

        <TouchableOpacity
          onPress={onGoOTP}
          style={{ alignSelf: 'flex-end', marginVertical: spacing.xs }}
        >
          <AppText variant="caption" color={colors.primary} weight="bold">
            পাসওয়ার্ড ভুলে গেছ?
          </AppText>
        </TouchableOpacity>

        {/* Submit Button */}
        <TouchableOpacity
          activeOpacity={0.8}
          onPress={handleSubmit(onSubmit)}
          disabled={isSubmitting}
          style={styles.submitBtn}
        >
          <AppText variant="button" color={colors.white} weight="bold">
            {isSubmitting ? 'লগইন হচ্ছে...' : 'লগইন'}
          </AppText>
        </TouchableOpacity>

        <View style={styles.footerRow}>
          <AppText variant="bodySmall" color={colors.textSecondary}>
            অ্যাকাউন্ট নেই?{' '}
          </AppText>
          <TouchableOpacity onPress={onGoSignup}>
            <AppText variant="bodySmall" color={colors.primary} weight="bold">
              নতুন অ্যাকাউন্ট তৈরি করো
            </AppText>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </Screen>
  );
};

const styles = StyleSheet.create({
  scrollContent: { paddingVertical: spacing.md, paddingBottom: spacing.xxl },
  header: { marginVertical: spacing.lg },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 50,
    fontSize: 16,
    color: colors.textPrimary,
    marginBottom: spacing.xs,
  },
  inputError: { borderColor: colors.error },
  submitBtn: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  footerRow: { flexDirection: 'row', justifyContent: 'center', marginTop: spacing.xl },
});
