import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip, useTheme } from 'react-native-paper';
import { useRouter } from 'expo-router';

import { OnboardingLayout } from '../../components/onboarding';
import { useAuthStore } from '../../stores/authStore';
import { CURRENCIES } from '../../constants/currencies';
import { spacing, brandColors } from '../../constants/theme';

// Most common currencies to show prominently
const POPULAR_CURRENCIES = ['EUR', 'USD', 'GBP', 'CHF'];

export default function CurrencyScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, updateProfile, completeOnboarding, isLoading } = useAuthStore();

  const [selectedCurrency, setSelectedCurrency] = useState(profile?.main_currency || 'EUR');

  const handleNext = async () => {
    if (selectedCurrency !== profile?.main_currency) {
      await updateProfile({ main_currency: selectedCurrency });
    }
    router.push('/(onboarding)/income');
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const popularCurrencies = CURRENCIES.filter((c) => POPULAR_CURRENCIES.includes(c.code));
  const otherCurrencies = CURRENCIES.filter((c) => !POPULAR_CURRENCIES.includes(c.code));

  return (
    <OnboardingLayout
      currentStep={3}
      title="Scegli la tua valuta"
      subtitle="Seleziona la valuta principale per le tue transazioni."
      icon="currency-eur"
      iconColor="#2196F3"
      onNext={handleNext}
      onSkip={handleSkip}
      isLoading={isLoading}
    >
      <View style={styles.container}>
        {/* Popular Currencies */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Valute principali
        </Text>
        <View style={styles.currencyGrid}>
          {popularCurrencies.map((currency) => (
            <Chip
              key={currency.code}
              selected={selectedCurrency === currency.code}
              onPress={() => setSelectedCurrency(currency.code)}
              style={[
                styles.currencyChip,
                selectedCurrency === currency.code && {
                  backgroundColor: brandColors.primary,
                },
              ]}
              textStyle={[
                selectedCurrency === currency.code && { color: '#fff' },
              ]}
              showSelectedCheck={false}
            >
              {currency.symbol} {currency.code}
            </Chip>
          ))}
        </View>

        {/* Other Currencies */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Altre valute
        </Text>
        <View style={styles.currencyGrid}>
          {otherCurrencies.slice(0, 12).map((currency) => (
            <Chip
              key={currency.code}
              selected={selectedCurrency === currency.code}
              onPress={() => setSelectedCurrency(currency.code)}
              style={[
                styles.currencyChipSmall,
                selectedCurrency === currency.code && {
                  backgroundColor: brandColors.primary,
                },
              ]}
              textStyle={[
                styles.currencyChipSmallText,
                selectedCurrency === currency.code && { color: '#fff' },
              ]}
              showSelectedCheck={false}
            >
              {currency.symbol} {currency.code}
            </Chip>
          ))}
        </View>

        {/* Selected Info */}
        <View style={[styles.selectedInfo, { backgroundColor: theme.colors.primaryContainer }]}>
          <Text variant="bodyLarge" style={{ color: theme.colors.onPrimaryContainer }}>
            Valuta selezionata:{' '}
            <Text style={{ fontWeight: 'bold' }}>
              {CURRENCIES.find((c) => c.code === selectedCurrency)?.name} ({selectedCurrency})
            </Text>
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
  sectionTitle: {
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  currencyGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  currencyChip: {
    marginBottom: spacing.xs,
  },
  currencyChipSmall: {
    marginBottom: spacing.xs,
  },
  currencyChipSmallText: {
    fontSize: 12,
  },
  selectedInfo: {
    padding: spacing.md,
    borderRadius: 12,
    marginTop: spacing.md,
  },
});
