import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Chip, useTheme, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { format } from 'date-fns';

import { OnboardingLayout } from '../../components/onboarding';
import { useAuthStore } from '../../stores/authStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { spacing, brandColors } from '../../constants/theme';

const INCOME_PRESETS = [
  { label: 'Stipendio', icon: 'briefcase', amounts: [1200, 1500, 2000, 2500, 3000] },
  { label: 'Freelance', icon: 'laptop', amounts: [500, 1000, 2000] },
  { label: 'Altro', icon: 'cash', amounts: [500, 1000] },
];

export default function IncomeScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, completeOnboarding } = useAuthStore();
  const { createTransaction, isLoading } = useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('Stipendio');
  const [selectedPreset, setSelectedPreset] = useState(0);

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const handleNext = async () => {
    if (amount) {
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        // Find income category or use first available
        const incomeCategory = categories.find((c) => c.name.toLowerCase().includes('stipendio') || c.name.toLowerCase().includes('entrat'));
        const categoryId = incomeCategory?.id || categories[0]?.id;

        if (categoryId) {
          await createTransaction({
            type: 'income',
            amount: parsedAmount,
            description: description || 'Stipendio',
            category_id: categoryId,
            date: format(new Date(), 'yyyy-MM-dd'),
          });
        }
      }
    }
    router.push('/(onboarding)/recurring');
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const handlePresetSelect = (index: number, presetAmount?: number) => {
    setSelectedPreset(index);
    setDescription(INCOME_PRESETS[index].label);
    if (presetAmount) {
      setAmount(presetAmount.toString());
    }
  };

  const currency = profile?.main_currency || 'EUR';

  return (
    <OnboardingLayout
      currentStep={4}
      title="Aggiungi la tua entrata"
      subtitle="Inserisci il tuo stipendio o entrata principale mensile."
      icon="cash-plus"
      iconColor={brandColors.success}
      onNext={handleNext}
      onSkip={handleSkip}
      isLoading={isLoading}
    >
      <View style={styles.container}>
        {/* Preset Type Selection */}
        <View style={styles.presetsRow}>
          {INCOME_PRESETS.map((preset, index) => (
            <Chip
              key={preset.label}
              selected={selectedPreset === index}
              onPress={() => handlePresetSelect(index)}
              style={styles.presetChip}
              showSelectedCheck={false}
            >
              {preset.label}
            </Chip>
          ))}
        </View>

        {/* Amount Input */}
        <TextInput
          label="Importo"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="currency-eur" />}
          placeholder="es. 2000"
        />

        {/* Quick Amounts */}
        <View style={styles.quickAmounts}>
          {INCOME_PRESETS[selectedPreset].amounts.map((preset) => (
            <Chip
              key={preset}
              selected={amount === preset.toString()}
              onPress={() => setAmount(preset.toString())}
              style={styles.amountChip}
              showSelectedCheck={false}
            >
              {preset.toLocaleString('it-IT')}
            </Chip>
          ))}
        </View>

        {/* Description Input */}
        <TextInput
          label="Descrizione"
          value={description}
          onChangeText={setDescription}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="text" />}
        />

        {/* Preview Card */}
        {amount && (
          <Card style={styles.previewCard} mode="elevated">
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Entrata da aggiungere:
              </Text>
              <Text variant="headlineSmall" style={{ color: brandColors.success, fontWeight: 'bold' }}>
                +{parseFloat(amount.replace(',', '.') || '0').toLocaleString('it-IT')} {currency}
              </Text>
              <Text variant="bodyMedium">{description}</Text>
            </Card.Content>
          </Card>
        )}
      </View>
    </OnboardingLayout>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: spacing.md,
  },
  presetsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  presetChip: {
    flex: 1,
  },
  input: {
    marginBottom: spacing.md,
  },
  quickAmounts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  amountChip: {
    marginBottom: spacing.xs,
  },
  previewCard: {
    marginTop: spacing.md,
  },
});
