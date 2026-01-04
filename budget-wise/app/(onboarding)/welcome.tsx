import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Card, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { OnboardingLayout } from '../../components/onboarding';
import { useAuthStore } from '../../stores/authStore';
import { spacing, brandColors } from '../../constants/theme';

const FEATURES = [
  { icon: 'wallet', label: 'Traccia spese e entrate', color: brandColors.primary },
  { icon: 'target', label: 'Imposta obiettivi di risparmio', color: brandColors.warning },
  { icon: 'chart-line', label: 'Analizza le tue finanze', color: brandColors.success },
  { icon: 'lightbulb', label: 'Ricevi consigli personalizzati', color: '#9C27B0' },
];

export default function WelcomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, completeOnboarding } = useAuthStore();

  const handleNext = () => {
    router.push('/(onboarding)/budget');
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  return (
    <OnboardingLayout
      currentStep={1}
      title={`Ciao ${profile?.full_name?.split(' ')[0] || 'Utente'}!`}
      subtitle="Benvenuto in FinanzaMi.pro. Configuriamo insieme la tua app in pochi semplici passi."
      icon="rocket-launch"
      iconColor={brandColors.primary}
      onNext={handleNext}
      onSkip={handleSkip}
      showBack={false}
      nextLabel="Iniziamo"
    >
      <View style={styles.featuresContainer}>
        <Text variant="titleMedium" style={styles.featuresTitle}>
          Cosa puoi fare con FinanzaMi.pro:
        </Text>

        {FEATURES.map((feature, index) => (
          <Card key={index} style={styles.featureCard} mode="outlined">
            <Card.Content style={styles.featureContent}>
              <View style={[styles.featureIcon, { backgroundColor: feature.color + '15' }]}>
                <MaterialCommunityIcons
                  name={feature.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={24}
                  color={feature.color}
                />
              </View>
              <Text variant="bodyLarge" style={styles.featureLabel}>
                {feature.label}
              </Text>
            </Card.Content>
          </Card>
        ))}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  featuresContainer: {
    marginTop: spacing.lg,
  },
  featuresTitle: {
    marginBottom: spacing.md,
    fontWeight: '600',
  },
  featureCard: {
    marginBottom: spacing.sm,
  },
  featureContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  featureLabel: {
    flex: 1,
  },
});
