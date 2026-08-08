import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Button, Header } from '../components';

interface OTPVerificationScreenProps {
  phoneNumber?: string;
  onVerify: () => void;
  onResend?: () => void;
  onBack?: () => void;
}

export const OTPVerificationScreen: React.FC<OTPVerificationScreenProps> = ({
  phoneNumber = '+880 1712 345678',
  onVerify,
  onResend,
  onBack,
}) => {
  const [otp, setOtp] = useState(['', '', '', '']);

  const handleChangeText = (text: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = text;
    setOtp(newOtp);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <Header onBack={onBack} title="পাসকোড ভেরিফিকেশন" />

      <View style={styles.content}>
        <View style={styles.iconCircle}>
          <Text style={styles.icon}>📱</Text>
        </View>

        <Text style={styles.title}>OTP কোড প্রদান করো</Text>
        <Text style={styles.subtitle}>
          আমরা <Text style={styles.phoneHighlight}>{phoneNumber}</Text> নম্বরে একটি ৪ ডিজিটের
          ভেরিফিকেশন কোড পাঠিয়েছি।
        </Text>

        <View style={styles.otpInputContainer}>
          {otp.map((digit, index) => (
            <TextInput
              key={index}
              style={styles.otpBox}
              keyboardType="number-pad"
              maxLength={1}
              value={digit}
              onChangeText={(text) => handleChangeText(text, index)}
            />
          ))}
        </View>

        <Button
          title="যাচাই করুন"
          onPress={onVerify}
          size="large"
          style={{ width: '100%', marginTop: spacing.xl }}
        />

        <View style={styles.resendContainer}>
          <Text style={styles.resendText}>কোড পাওনি? </Text>
          <TouchableOpacity onPress={onResend}>
            <Text style={styles.resendLink}>পুনরায় পাঠান</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  icon: {
    fontSize: 36,
  },
  title: {
    fontSize: typography.size.xxl,
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: spacing.xs,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: typography.size.sm,
    color: colors.onSurfaceVariant,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  phoneHighlight: {
    color: colors.onSurface,
    fontWeight: '700',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '80%',
    marginBottom: spacing.lg,
  },
  otpBox: {
    width: 56,
    height: 64,
    borderRadius: spacing.borderRadius.md,
    borderWidth: 2,
    borderColor: colors.primary,
    backgroundColor: colors.surface,
    textAlign: 'center',
    fontSize: typography.size.xxl,
    fontWeight: '700',
    color: colors.onSurface,
  },
  resendContainer: {
    flexDirection: 'row',
    marginTop: spacing.lg,
  },
  resendText: {
    fontSize: typography.size.sm,
    color: colors.onSurfaceVariant,
  },
  resendLink: {
    fontSize: typography.size.sm,
    color: colors.primary,
    fontWeight: '700',
  },
});
