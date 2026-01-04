import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, TextInput, useTheme, Card } from 'react-native-paper';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { OnboardingLayout } from '../../components/onboarding';
import { useAuthStore } from '../../stores/authStore';
import { useGoalStore } from '../../stores/goalStore';
import { spacing, brandColors } from '../../constants/theme';

const GOAL_PRESETS = [
  { name: 'Fondo emergenza', icon: 'shield-check', amount: 5000, color: brandColors.error },
  { name: 'Vacanza', icon: 'airplane', amount: 2000, color: '#2196F3' },
  { name: 'Nuovo telefono', icon: 'cellphone', amount: 1000, color: '#9C27B0' },
  { name: 'Risparmio generale', icon: 'piggy-bank', amount: 3000, color: brandColors.success },
];

export default function GoalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile, completeOnboarding } = useAuthStore();
  const { createGoal, isLoading } = useGoalStore();

  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [icon, setIcon] = useState('target');

  const handlePresetSelect = (index: number) => {
    const preset = GOAL_PRESETS[index];
    setSelectedPreset(index);
    setName(preset.name);
    setAmount(preset.amount.toString());
    setIcon(preset.icon);
  };

  const handleNext = async () => {
    if (amount && name) {
      const parsedAmount = parseFloat(amount.replace(',', '.'));
      if (!isNaN(parsedAmount) && parsedAmount > 0) {
        await createGoal({
          name,
          target_amount: parsedAmount,
          current_amount: 0,
          icon,
        });
      }
    }
    router.push('/(onboarding)/complete');
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const currency = profile?.main_currency || 'EUR';

  return (
    <OnboardingLayout
      currentStep={6}
      title="Crea un obiettivo"
      subtitle="Imposta il tuo primo obiettivo di risparmio. Ti aiutera a rimanere motivato!"
      icon="target"
      iconColor={brandColors.warning}
      onNext={handleNext}
      onSkip={handleSkip}
      isLoading={isLoading}
    >
      <View style={styles.container}>
        {/* Preset Goals */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Obiettivi popolari:
        </Text>
        <View style={styles.presetsGrid}>
          {GOAL_PRESETS.map((preset, index) => (
            <Card
              key={preset.name}
              style={[
                styles.presetCard,
                selectedPreset === index && {
                  borderColor: preset.color,
                  borderWidth: 2,
                },
              ]}
              mode="outlined"
              onPress={() => handlePresetSelect(index)}
            >
              <Card.Content style={styles.presetCardContent}>
                <View style={[styles.presetIcon, { backgroundColor: preset.color + '20' }]}>
                  <MaterialCommunityIcons
                    name={preset.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={24}
                    color={preset.color}
                  />
                </View>
                <Text variant="labelMedium" numberOfLines={1} style={styles.presetLabel}>
                  {preset.name}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {preset.amount.toLocaleString('it-IT')} {currency}
                </Text>
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* Custom Inputs */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Personalizza:
        </Text>
        <TextInput
          label="Nome obiettivo"
          value={name}
          onChangeText={setName}
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="flag" />}
          placeholder="es. Vacanza estiva"
        />

        <TextInput
          label="Importo da raggiungere"
          value={amount}
          onChangeText={setAmount}
          keyboardType="numeric"
          mode="outlined"
          style={styles.input}
          left={<TextInput.Icon icon="currency-eur" />}
          placeholder="es. 2000"
        />

        {/* Preview */}
        {amount && name && (
          <Card style={styles.previewCard} mode="elevated">
            <Card.Content style={styles.previewContent}>
              <View style={[styles.previewIcon, { backgroundColor: brandColors.warning + '20' }]}>
                <MaterialCommunityIcons
                  name={icon as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={32}
                  color={brandColors.warning}
                />
              </View>
              <View style={styles.previewInfo}>
                <Text variant="titleMedium">{name}</Text>
                <Text variant="headlineSmall" style={{ color: brandColors.primary, fontWeight: 'bold' }}>
                  {parseFloat(amount.replace(',', '.') || '0').toLocaleString('it-IT')} {currency}
                </Text>
              </View>
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
    width: '47%',
  },
  presetCardContent: {
    alignItems: 'center',
    paddingVertical: spacing.md,
  },
  presetIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  presetLabel: {
    textAlign: 'center',
    marginTop: spacing.xs,
  },
  input: {
    marginBottom: spacing.md,
  },
  previewCard: {
    marginTop: spacing.md,
  },
  previewContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  previewIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  previewInfo: {
    flex: 1,
  },
});
