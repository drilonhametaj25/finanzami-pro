import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useAuthStore } from '../../stores/authStore';
import { spacing, borderRadius, brandColors } from '../../constants/theme';
import { SafeAreaView } from 'react-native-safe-area-context';

const FEATURES_COMPLETED = [
  { icon: 'check-circle', label: 'Account creato', color: brandColors.success },
  { icon: 'wallet', label: 'Budget impostato', color: brandColors.primary },
  { icon: 'currency-eur', label: 'Valuta configurata', color: '#2196F3' },
  { icon: 'cash-plus', label: 'Prima entrata aggiunta', color: brandColors.success },
  { icon: 'repeat', label: 'Spesa ricorrente creata', color: brandColors.warning },
  { icon: 'target', label: 'Obiettivo di risparmio', color: '#9C27B0' },
];

export default function CompleteScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { completeOnboarding, profile } = useAuthStore();

  // Animation
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Animate entrance
    Animated.sequence([
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }),
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleStart = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.content}>
        {/* Success Icon with Gradient */}
        <Animated.View
          style={[
            styles.iconContainer,
            { transform: [{ scale: scaleAnim }] },
          ]}
        >
          <LinearGradient
            colors={[brandColors.gradientStart, brandColors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.iconCircle}
          >
            <MaterialCommunityIcons
              name="check-decagram"
              size={72}
              color="#FFFFFF"
            />
          </LinearGradient>
        </Animated.View>

        {/* Title */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Text variant="headlineMedium" style={styles.title}>
            Perfetto!
          </Text>
          <Text variant="headlineSmall" style={[styles.subtitle, { color: brandColors.primary }]}>
            Sei pronto per iniziare
          </Text>
          <Text
            variant="bodyLarge"
            style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
          >
            Hai configurato tutto il necessario per gestire le tue finanze con FinanzaMi.pro.
          </Text>
        </Animated.View>

        {/* Summary Card with Gradient Border */}
        <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
          <LinearGradient
            colors={[brandColors.gradientStart, brandColors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.summaryCardBorder}
          >
            <View style={[styles.summaryCardInner, { backgroundColor: theme.colors.surface }]}>
              <Text variant="titleMedium" style={styles.summaryTitle}>
                Riepilogo configurazione
              </Text>
              {FEATURES_COMPLETED.map((feature, index) => (
                <View key={index} style={styles.featureRow}>
                  <View style={[styles.featureIconContainer, { backgroundColor: feature.color + '15' }]}>
                    <MaterialCommunityIcons
                      name={feature.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={18}
                      color={feature.color}
                    />
                  </View>
                  <Text variant="bodyMedium" style={styles.featureLabel}>
                    {feature.label}
                  </Text>
                  <MaterialCommunityIcons
                    name="check"
                    size={18}
                    color={brandColors.success}
                  />
                </View>
              ))}
            </View>
          </LinearGradient>
        </Animated.View>

        {/* Tips Card */}
        <Animated.View style={{ opacity: fadeAnim, width: '100%' }}>
          <Card style={styles.tipsCard} mode="outlined">
            <Card.Content style={styles.tipsContent}>
              <View style={styles.tipsIconContainer}>
                <MaterialCommunityIcons
                  name="lightbulb-on"
                  size={22}
                  color={brandColors.warning}
                />
              </View>
              <Text variant="bodyMedium" style={[styles.tipsText, { color: theme.colors.onSurfaceVariant }]}>
                Aggiungi le tue transazioni giornalmente per avere statistiche accurate!
              </Text>
            </Card.Content>
          </Card>
        </Animated.View>
      </View>

      {/* Footer with Gradient Button */}
      <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
        <Pressable
          onPress={handleStart}
          style={({ pressed }) => [
            styles.buttonPressable,
            pressed && styles.buttonPressed,
          ]}
        >
          <LinearGradient
            colors={[brandColors.gradientStart, brandColors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.gradientButton}
          >
            <MaterialCommunityIcons
              name="rocket-launch"
              size={22}
              color="#FFFFFF"
              style={styles.buttonIcon}
            />
            <Text variant="titleMedium" style={styles.buttonText}>
              Inizia ad usare FinanzaMi.pro
            </Text>
          </LinearGradient>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  iconContainer: {
    marginBottom: spacing.lg,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  subtitle: {
    textAlign: 'center',
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  description: {
    textAlign: 'center',
    marginBottom: spacing.lg,
    paddingHorizontal: spacing.md,
  },
  summaryCardBorder: {
    borderRadius: borderRadius.lg,
    padding: 2,
    marginBottom: spacing.lg,
  },
  summaryCardInner: {
    borderRadius: borderRadius.lg - 2,
    padding: spacing.lg,
  },
  summaryTitle: {
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureLabel: {
    flex: 1,
  },
  tipsCard: {
    marginBottom: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  tipsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipsIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: brandColors.warning + '15',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsText: {
    flex: 1,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  buttonPressable: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  buttonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  gradientButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
  },
  buttonIcon: {
    marginRight: spacing.sm,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
