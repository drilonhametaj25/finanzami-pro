import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { usePremiumStore } from '../../stores/premiumStore';
import { spacing, borderRadius, brandColors } from '../../constants/theme';

export default function PremiumSuccessScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { subscriptionType } = usePremiumStore();

  // Animations
  const scale = useRef(new Animated.Value(0)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(50)).current;

  useEffect(() => {
    // Animate crown
    Animated.spring(scale, {
      toValue: 1,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // Animate content with delay
    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.spring(opacity, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
        Animated.spring(translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, []);

  const handleContinue = () => {
    router.replace('/(tabs)');
  };

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.gradient}
      >
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.content}>
            {/* Animated Crown */}
            <Animated.View style={[styles.crownContainer, { transform: [{ scale }] }]}>
              <View style={styles.crownCircle}>
                <MaterialCommunityIcons name="crown" size={72} color="#FFD700" />
              </View>
              {/* Sparkles */}
              <View style={[styles.sparkle, styles.sparkle1]}>
                <MaterialCommunityIcons name="star-four-points" size={16} color="#FFD700" />
              </View>
              <View style={[styles.sparkle, styles.sparkle2]}>
                <MaterialCommunityIcons name="star-four-points" size={12} color="#FFFFFF" />
              </View>
              <View style={[styles.sparkle, styles.sparkle3]}>
                <MaterialCommunityIcons name="star-four-points" size={14} color="#FFD700" />
              </View>
            </Animated.View>

            {/* Content */}
            <Animated.View style={[styles.textContainer, { opacity, transform: [{ translateY }] }]}>
              <Text variant="displaySmall" style={styles.title}>
                Benvenuto in Premium!
              </Text>

              <Text variant="bodyLarge" style={styles.subtitle}>
                Hai sbloccato tutte le funzionalita di FinanzaMi.pro.
                {'\n'}
                Inizia subito a gestire le tue finanze senza limiti!
              </Text>

              {/* Features unlocked card */}
              <View style={styles.featuresCard}>
                <Text variant="titleSmall" style={styles.featuresCardTitle}>
                  Ora puoi:
                </Text>
                <FeatureUnlocked icon="infinity" text="Creare obiettivi illimitati" />
                <FeatureUnlocked icon="tag-multiple" text="Aggiungere categorie illimitate" />
                <FeatureUnlocked icon="lightbulb-on" text="Accedere agli insights avanzati" />
                <FeatureUnlocked icon="bank" text="Gestire il tuo patrimonio" />
                <FeatureUnlocked icon="account-group" text="Dividere le spese con altri" />
                <FeatureUnlocked icon="file-pdf-box" text="Esportare report PDF" />
              </View>

              {/* Plan info badge */}
              <View style={styles.planBadge}>
                <MaterialCommunityIcons name="check-decagram" size={20} color="#FFFFFF" />
                <Text variant="labelLarge" style={styles.planBadgeText}>
                  Piano {subscriptionType === 'yearly' ? 'Annuale' : 'Mensile'} attivo
                </Text>
              </View>
            </Animated.View>

            {/* CTA */}
            <Animated.View style={[styles.ctaContainer, { opacity, transform: [{ translateY }] }]}>
              <Pressable
                onPress={handleContinue}
                style={({ pressed }) => [
                  styles.ctaButton,
                  pressed && styles.ctaButtonPressed,
                ]}
              >
                <MaterialCommunityIcons name="rocket-launch" size={22} color={brandColors.primary} style={styles.ctaIcon} />
                <Text variant="titleMedium" style={styles.ctaText}>
                  Inizia a esplorare
                </Text>
              </Pressable>
            </Animated.View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    </View>
  );
}

const FeatureUnlocked: React.FC<{ icon: string; text: string }> = ({ icon, text }) => {
  return (
    <View style={styles.featureRow}>
      <View style={styles.featureIconContainer}>
        <MaterialCommunityIcons name={icon as any} size={18} color="#FFFFFF" />
      </View>
      <Text variant="bodyMedium" style={styles.featureText}>{text}</Text>
      <MaterialCommunityIcons name="check" size={18} color="rgba(255, 255, 255, 0.7)" />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  crownContainer: {
    marginBottom: spacing.xl,
    position: 'relative',
  },
  crownCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 215, 0, 0.3)',
  },
  sparkle: {
    position: 'absolute',
  },
  sparkle1: {
    top: 10,
    right: -5,
  },
  sparkle2: {
    top: -5,
    left: 20,
  },
  sparkle3: {
    bottom: 15,
    right: -10,
  },
  textContainer: {
    alignItems: 'center',
    width: '100%',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: spacing.md,
  },
  subtitle: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: spacing.xl,
    lineHeight: 24,
  },
  featuresCard: {
    width: '100%',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  featuresCardTitle: {
    color: 'rgba(255, 255, 255, 0.8)',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  featureIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
    color: '#FFFFFF',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  planBadgeText: {
    color: '#FFFFFF',
  },
  ctaContainer: {
    width: '100%',
    marginTop: spacing.xl,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  ctaButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaIcon: {
    marginRight: spacing.sm,
  },
  ctaText: {
    color: brandColors.primary,
    fontWeight: '600',
  },
});
