import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, Chip, useTheme, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { OnboardingLayout } from '../../components/onboarding';
import { useAuthStore } from '../../stores/authStore';
import { useRecurringStore } from '../../stores/recurringStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { spacing, brandColors } from '../../constants/theme';

const RECURRING_PRESETS = [
  { name: 'Affitto', icon: 'home', amount: 800, category: 'casa' },
  { name: 'Bollette', icon: 'lightning-bolt', amount: 150, category: 'bollette' },
  { name: 'Internet', icon: 'wifi', amount: 30, category: 'bollette' },
  { name: 'Telefono', icon: 'cellphone', amount: 20, category: 'bollette' },
  { name: 'Palestra', icon: 'dumbbell', amount: 40, category: 'svago' },
  { name: 'Streaming', icon: 'play-circle', amount: 15, category: 'svago' },
];

export default function RecurringScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, completeOnboarding } = useAuthStore();
  const { createRecurring, isLoading } = useRecurringStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const handlePresetSelect = (index: number) => {
    const preset = RECURRING_PRESETS[index];
    setSelectedPreset(index);
    setName(preset.name);
    setAmount(preset.amount.toString());
  };

  const handleNext = async () => {
    if (amount && name) {
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        // Find matching category
        const preset = selectedPreset !== null ? RECURRING_PRESETS[selectedPreset] : null;
        const matchingCategory = categories.find((c) =>
          c.name.toLowerCase().includes(preset?.category || 'casa')
        );
        const categoryId = matchingCategory?.id || categories[0]?.id;

        if (categoryId) {
          await createRecurring({
            description: name,
            amount: parsedAmount,
            category_id: categoryId,
            frequency: 'monthly',
            next_date: new Date().toISOString().split('T')[0],
          });
        }
      }
    }
    router.push('/(onboarding)/goal');
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const currency = profile?.main_currency || 'EUR';

  return (
    <OnboardingLayout
      currentStep={5}
      title="Spese ricorrenti"
      subtitle="Aggiungi una spesa fissa mensile come affitto o bollette."
      icon="repeat"
      iconColor={brandColors.warning}
      onNext={handleNext}
      onSkip={handleSkip}
      isLoading={isLoading}
    >
      <View style={styles.container}>
        {/* Preset Grid */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Scegli una spesa comune:
        </Text>
        <View style={styles.presetsGrid}>
          {RECURRING_PRESETS.map((preset, index) => (
            <Card
              key={preset.name}
              style={[
                styles.presetCard,
                selectedPreset === index && {
                  borderColor: brandColors.primary,
                  borderWidth: 2,
                },
              ]}
              mode="outlined"
              onPress={() => handlePresetSelect(index)}
            >
              <Card.Content style={styles.presetCardContent}>
                <MaterialCommunityIcons
                  name={preset.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={28}
                  color={selectedPreset === index ? brandColors.primary : theme.colors.onSurfaceVariant}
                />
                <Text
                  variant="labelMedium"
                  style={[
                    styles.presetLabel,
                    selectedPreset === index && { color: brandColors.primary },
                  ]}
                >
                  {preset.name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  ~{preset.amount}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Custom Inputs */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Oppure personalizza:
        </Text>
        <TextInput
          label="Nome spesa"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="text" />}
          placeholder="es. Affitto"
        />

        <TextInput
          label="Importo mensile"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="currency-eur" />}
          placeholder="es. 800"
        />

        {/* Preview */}
        {amount && name && (
          <Card style={styles.previewCard} mode="elevated">
            <Card.Content>
              <Text variant="labelMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Spesa ricorrente da aggiungere:
              </Text>
              <Text variant="headlineSmall" style={{ color: brandColors.error, fontWeight: 'bold' }}>
                -{parseFloat(amount.replace(',', '.') || '0').toLocaleString('it-IT')} {currency}/mese
              </Text>
              <Text variant="bodyMedium">{name}</Text>
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
  sectionTitle: {
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  presetsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  presetCard: {
    width: '30%',
    flexGrow: 1,
  },
  presetCardContent: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  presetLabel: {
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  input: {
    marginBottom: spacing.md,
  },
  previewCard: {
    marginTop: spacing.md,
  },
});
