import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, TextInput, useTheme, Chip } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { OnboardingLayout } from '../../components/onboarding';
import { useAuthStore } from '../../stores/authStore';
import { spacing, brandColors } from '../../constants/theme';

const BUDGET_PRESETS = [1000, 1500, 2000, 2500, 3000, 4000];

export default function BudgetScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { updateProfile, completeOnboarding, isLoading } = useAuthStore();

  const [budget, setBudget] = useState('');

  const handleNext = async () => {
    if (budget) {
      const amount = parseFloat(budget.replace(',', '.'));
      if (!isNaN(amount) && amount > 0) {
        await updateProfile({ monthly_budget: amount });
      }
    }
    router.push('/(onboarding)/currency');
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const handlePresetSelect = (amount: number) => {
    setBudget(amount.toString());
  };

  return (
    <OnboardingLayout
      currentStep={2}
      title="Imposta il tuo budget"
      subtitle="Quanto vuoi spendere al massimo ogni mese? Potrai sempre modificarlo dopo."
      icon="wallet"
      iconColor={brandColors.primary}
      onNext={handleNext}
      onSkip={handleSkip}
      isLoading={isLoading}
    >
      <View style={styles.container}>
        {/* Budget Input */}
        <TextInput
          label="Budget mensile"
          value={budget}
          onChangeText={setBudget}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="currency-eur" />}
          placeholder="es. 2000"
        />

        {/* Presets */}
        <Text variant="labelLarge" style={styles.presetsLabel}>
          Suggerimenti rapidi:
        </Text>
        <View style={styles.presetsContainer}>
          {BUDGET_PRESETS.map((amount) => (
            <Chip
              key={amount}
              selected={budget === amount.toString()}
              onPress={() => handlePresetSelect(amount)}
              style={styles.presetChip}
              showSelectedCheck={false}
            >
              {amount.toLocaleString('it-IT')}
            </Chip>
          ))}
        </View>

        {/* Info Box */}
        <View style={[styles.infoBox, { backgroundColor: brandColors.primary + '10' }]}>
          <Text variant="bodyMedium" style={{ color: theme.colors.onSurface }}>
            Il budget ti aiuta a tenere sotto controllo le spese. Riceverai notifiche quando ti avvicini al limite.
          </Text>
        </View>
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  input: {
    marginBottom: spacing.lg,
  },
  presetsLabel: {
    marginBottom: spacing.sm,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  presetChip: {
    marginBottom: spacing.xs,
  },
  infoBox: {
    padding: spacing.md,
    borderRadius: 12,
  },
});
