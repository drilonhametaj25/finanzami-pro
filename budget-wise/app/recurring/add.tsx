import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Chip,
  HelperText,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, addMonths } from 'date-fns';

import { useRecurringStore } from '../../stores/recurringStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import { spacing, borderRadius, brandColors, getContrastTextColor } from '../../constants/theme';
import { Category } from '../../types/database';

type Frequency = 'monthly' | 'quarterly' | 'yearly';

const frequencyOptions = [
  { value: 'monthly', label: 'Mensile' },
  { value: 'quarterly', label: 'Trimestrale' },
  { value: 'yearly', label: 'Annuale' },
];

// Common recurring expense presets
const PRESETS = [
  { name: 'Affitto', icon: 'home', category: 'Casa' },
  { name: 'Bolletta luce', icon: 'lightbulb', category: 'Casa' },
  { name: 'Bolletta gas', icon: 'fire', category: 'Casa' },
  { name: 'Internet', icon: 'wifi', category: 'Tecnologia' },
  { name: 'Telefono', icon: 'cellphone', category: 'Tecnologia' },
  { name: 'Netflix', icon: 'netflix', category: 'Tecnologia' },
  { name: 'Spotify', icon: 'spotify', category: 'Tecnologia' },
  { name: 'Palestra', icon: 'dumbbell', category: 'Salute' },
  { name: 'Assicurazione auto', icon: 'car', category: 'Trasporti' },
  { name: 'Abbonamento trasporti', icon: 'bus', category: 'Trasporti' },
];

export default function AddRecurringScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useAuthStore();
  const { createRecurring, isLoading } = useRecurringStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('monthly');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [nextDate, setNextDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    setAmount(cleaned);
    setError(null);
  };

  const handlePresetSelect = (preset: typeof PRESETS[0]) => {
    setDescription(preset.name);
    const category = categories.find((c) => c.name === preset.category);
    if (category) {
      setSelectedCategory(category);
    }
  };

  const validateForm = (): boolean => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Inserisci un importo valido');
      return false;
    }
    if (!selectedCategory) {
      setError('Seleziona una categoria');
      return false;
    }
    if (!description.trim()) {
      setError('Inserisci una descrizione');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const { error: createError } = await createRecurring({
      amount: parseFloat(amount),
      description: description.trim(),
      category_id: selectedCategory!.id,
      frequency,
      next_date: format(nextDate, 'yyyy-MM-dd'),
      is_active: true,
    });

    if (!createError) {
      router.back();
    } else {
      setError(createError);
    }
  };

  // Filter categories that make sense for recurring expenses
  const filteredCategories = categories.filter((cat) => cat.is_active);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <Pressable onPress={() => router.back()} style={styles.backButton}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons name="refresh" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text variant="titleLarge" style={styles.headerTitle}>
                Nuova spesa ricorrente
              </Text>
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                Traccia le tue uscite fisse
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Presets */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Suggerimenti rapidi
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsContainer}
            >
              {PRESETS.map((preset) => (
                <Chip
                  key={preset.name}
                  onPress={() => handlePresetSelect(preset)}
                  style={styles.presetChip}
                  icon={() => (
                    <MaterialCommunityIcons
                      name={preset.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={18}
                      color={theme.colors.primary}
                    />
                  )}
                >
                  {preset.name}
                </Chip>
              ))}
            </ScrollView>
          </View>

          {/* Description */}
          <TextInput
            label="Descrizione"
            value={description}
            onChangeText={(text) => {
              setDescription(text);
              setError(null);
            }}
            mode="outlined"
            style={styles.input}
            placeholder="es. Affitto mensile"
          />

          {/* Amount */}
          <View style={styles.amountContainer}>
            <Text
              variant="headlineMedium"
              style={[styles.currencySymbol, { color: brandColors.error }]}
            >
              {profile?.main_currency === 'EUR' ? '€' : '$'}
            </Text>
            <TextInput
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              keyboardType="decimal-pad"
              style={styles.amountInput}
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              textAlign="center"
              contentStyle={styles.amountInputContent}
            />
          </View>

          {/* Frequency */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Frequenza
            </Text>
            <SegmentedButtons
              value={frequency}
              onValueChange={(value) => setFrequency(value as Frequency)}
              buttons={frequencyOptions}
            />
          </View>

          {/* Category */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Categoria
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoriesContainer}
            >
              {filteredCategories.map((cat) => {
                const isSelected = selectedCategory?.id === cat.id;
                const textColor = isSelected ? getContrastTextColor(cat.color) : theme.colors.onSurface;
                return (
                  <Chip
                    key={cat.id}
                    selected={isSelected}
                    onPress={() => setSelectedCategory(cat)}
                    style={[
                      styles.categoryChip,
                      isSelected && {
                        backgroundColor: cat.color,
                      },
                    ]}
                    textStyle={{ color: textColor }}
                    avatar={
                      <MaterialCommunityIcons
                        name={cat.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={18}
                        color={isSelected ? textColor : theme.colors.onSurfaceVariant}
                      />
                    }
                  >
                    {cat.name}
                  </Chip>
                );
              })}
            </ScrollView>
          </View>

          {/* Next Date */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Prossima scadenza
            </Text>
            <View style={styles.dateOptions}>
              <Button
                mode={nextDate.getDate() === new Date().getDate() ? 'contained' : 'outlined'}
                onPress={() => setNextDate(new Date())}
                compact
              >
                Oggi
              </Button>
              <Button
                mode={
                  nextDate.getMonth() === addMonths(new Date(), 1).getMonth()
                    ? 'contained'
                    : 'outlined'
                }
                onPress={() => {
                  const next = addMonths(new Date(), 1);
                  next.setDate(1);
                  setNextDate(next);
                }}
                compact
              >
                1° prossimo mese
              </Button>
              <Button
                mode="outlined"
                icon="calendar"
                onPress={() => {
                  // TODO: Date picker
                }}
                compact
              >
                {format(nextDate, 'dd/MM/yyyy')}
              </Button>
            </View>
          </View>

          {/* Info Box */}
          <View style={[styles.infoBox, { backgroundColor: theme.colors.primaryContainer }]}>
            <MaterialCommunityIcons
              name="information"
              size={20}
              color={theme.colors.primary}
            />
            <Text variant="bodySmall" style={{ flex: 1, color: theme.colors.onPrimaryContainer }}>
              Le spese ricorrenti ti ricorderanno quando e il momento di pagare e terranno
              traccia automaticamente delle tue uscite fisse.
            </Text>
          </View>

          {/* Error */}
          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.submitPressable,
              pressed && styles.submitPressed,
              isLoading && styles.submitDisabled,
            ]}
          >
            <LinearGradient
              colors={isLoading ? ['#9E9E9E', '#757575'] : [brandColors.gradientStart, brandColors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <MaterialCommunityIcons name="plus-circle" size={22} color="#FFFFFF" style={styles.submitIcon} />
              <Text variant="titleMedium" style={styles.submitText}>
                {isLoading ? 'Creazione...' : 'Aggiungi spesa ricorrente'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
  },
  backButton: {
    padding: spacing.sm,
    marginRight: spacing.sm,
  },
  headerIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  headerTextContainer: {
    flex: 1,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  presetsContainer: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  presetChip: {
    marginRight: spacing.xs,
  },
  input: {
    marginBottom: spacing.md,
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.lg,
  },
  currencySymbol: {
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  amountInput: {
    backgroundColor: 'transparent',
    fontSize: 40,
    width: 180,
  },
  amountInputContent: {
    fontSize: 40,
    fontWeight: 'bold',
  },
  categoriesContainer: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  categoryChip: {
    marginRight: spacing.xs,
  },
  dateOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.md,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitPressable: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  submitPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  submitIcon: {
    marginRight: spacing.sm,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
