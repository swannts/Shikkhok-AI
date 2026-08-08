import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors, spacing, typography } from '../theme';
import { Button } from '../components';

interface OnboardingSlide {
  title: string;
  subtitle: string;
  icon: string;
}

const slides: OnboardingSlide[] = [
  {
    title: 'তোমার নিজের AI শিক্ষক',
    subtitle: 'যেকোনো বিষয় বুঝতে তোমার পাশে থাকবে ব্যক্তিগত AI শিক্ষক।',
    icon: '🤖',
  },
  {
    title: 'ইন্টারেক্টিভ লার্নিং ও প্র্যাকটিস',
    subtitle: 'কঠিন প্রশ্নের সহজ ব্যাখ্যা এবং তাৎক্ষণিক সলভ গাইড।',
    icon: '🧠',
  },
  {
    title: 'স্মার্ট অগ্রগতি ট্র্যাকিং',
    subtitle: 'প্রতিদিনের পড়া এবং স্কিল ডেভলপমেন্ট সহজে ট্র্যাক করো।',
    icon: '📈',
  },
];

interface OnboardingScreenProps {
  onStart: () => void;
  onLogin: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({
  onStart,
  onLogin,
}) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  const handleNext = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      onStart();
    }
  };

  const activeSlide = slides[currentSlideIndex];

  return (
    <View style={styles.container}>
      <View style={styles.illustrationContainer}>
        <View style={styles.iconCircle}>
          <Text style={styles.illustrationIcon}>{activeSlide.icon}</Text>
        </View>
      </View>

      <View style={styles.contentContainer}>
        <Text style={styles.title}>{activeSlide.title}</Text>
        <Text style={styles.subtitle}>{activeSlide.subtitle}</Text>

        <View style={styles.paginationContainer}>
          {slides.map((_, index) => (
            <TouchableOpacity
              key={index}
              onPress={() => setCurrentSlideIndex(index)}
              style={[
                styles.dot,
                index === currentSlideIndex ? styles.activeDot : styles.inactiveDot,
              ]}
            />
          ))}
        </View>

        <View style={styles.buttonGroup}>
          <Button title="শুরু করি" onPress={handleNext} size="large" />
          <Button
            title="আগেই অ্যাকাউন্ট আছে"
            onPress={onLogin}
            variant="secondary"
            size="large"
            style={{ marginTop: spacing.sm }}
          />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    justifyContent: 'space-between',
    padding: spacing.lg,
  },
  illustrationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 4,
  },
  illustrationIcon: {
    fontSize: 64,
  },
  contentContainer: {
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: typography.size.headline,
    fontWeight: '800',
    color: colors.onSurface,
    marginBottom: spacing.xs,
    lineHeight: typography.lineHeight.headline,
  },
  subtitle: {
    fontSize: typography.size.md,
    color: colors.onSurfaceVariant,
    lineHeight: typography.lineHeight.md,
    marginBottom: spacing.lg,
  },
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  activeDot: {
    width: 24,
    backgroundColor: colors.primary,
  },
  inactiveDot: {
    width: 8,
    backgroundColor: colors.outlineVariant,
  },
  buttonGroup: {
    width: '100%',
  },
});
