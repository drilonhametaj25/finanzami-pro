import React from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Pressable } from 'react-native';
import { Text, Button, IconButton, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { StepIndicator } from './StepIndicator';
import { spacing, borderRadius, brandColors } from '../../constants/theme';

interface OnboardingLayoutProps {
  children: React.ReactNode;
  currentStep: number;
  totalSteps?: number;
  title: string;
  subtitle?: string;
  icon?: keyof typeof MaterialCommunityIcons.glyphMap;
  iconColor?: string;
  onNext: () => void;
  onSkip?: () => void;
  onBack?: () => void;
  nextLabel?: string;
  showBack?: boolean;
  showSkip?: boolean;
  isLoading?: boolean;
  nextDisabled?: boolean;
}

export const OnboardingLayout: React.FC<OnboardingLayoutProps> = ({
  children,
  currentStep,
  totalSteps = 7,
  title,
  subtitle,
  icon,
  iconColor = brandColors.primary,
  onNext,
  onSkip,
  onBack,
  nextLabel = 'Continua',
  showBack = true,
  showSkip = true,
  isLoading = false,
  nextDisabled = false,
}) => {
  const theme = useTheme();
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Header */}
        <View style={styles.header}>
          {showBack && currentStep > 1 ? (
            <IconButton icon="arrow-left" onPress={handleBack} />
          ) : (
            <View style={{ width: 48 }} />
          )}

          <StepIndicator totalSteps={totalSteps} currentStep={currentStep} />

          {showSkip && onSkip ? (
            <Pressable onPress={onSkip} style={styles.skipButton}>
              <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
                Salta
              </Text>
            </Pressable>
          ) : (
            <View style={{ width: 48 }} />
          )}
        </View>

        {/* Content */}
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Icon with Gradient Background */}
          {icon && (
            <LinearGradient
              colors={[brandColors.gradientStart, brandColors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <MaterialCommunityIcons name={icon} size={56} color="#FFFFFF" />
            </LinearGradient>
          )}

          {/* Title */}
          <Text variant="headlineMedium" style={styles.title}>
            {title}
          </Text>

          {/* Subtitle */}
          {subtitle && (
            <Text
              variant="bodyLarge"
              style={[styles.subtitle, { color: theme.colors.onSurfaceVariant }]}
            >
              {subtitle}
            </Text>
          )}

          {/* Form Content */}
          <View style={styles.content}>
            {children}
          </View>
        </ScrollView>

        {/* Footer with Gradient Button */}
        <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
          <View style={styles.buttonContainer}>
            <LinearGradient
              colors={
                nextDisabled || isLoading
                  ? ['#9E9E9E', '#757575']
                  : [brandColors.gradientStart, brandColors.gradientEnd]
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.gradientButton}
            >
              <Button
                mode="text"
                onPress={onNext}
                loading={isLoading}
                disabled={nextDisabled || isLoading}
                textColor="#FFFFFF"
                contentStyle={styles.nextButtonContent}
                labelStyle={styles.buttonLabel}
                icon={({ size }) => (
                  <MaterialCommunityIcons
                    name="arrow-right"
                    size={size}
                    color="#FFFFFF"
                  />
                )}
              >
                {nextLabel}
              </Button>
            </LinearGradient>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xs,
  },
  skipButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  iconContainer: {
    width: 100,
    height: 100,
    borderRadius: borderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    alignSelf: 'center',
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  content: {
    flex: 1,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  buttonContainer: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  gradientButton: {
    borderRadius: borderRadius.lg,
  },
  nextButtonContent: {
    paddingVertical: spacing.sm,
    flexDirection: 'row-reverse',
  },
  buttonLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default OnboardingLayout;
