import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import {
  Text,
  TextInput,
  SegmentedButtons,
  useTheme,
  Chip,
  HelperText,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import { spacing, borderRadius, brandColors, getContrastTextColor } from '../../constants/theme';
import { COMMON_TAGS } from '../../constants/categories';
import { Category } from '../../types/database';

type TransactionType = 'expense' | 'income';

export default function AddTransactionScreen() {
  const theme = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams<{ type?: string; category?: string }>();
  const { profile } = useAuthStore();
  const { createTransaction, isLoading } = useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [type, setType] = useState<TransactionType>(
    (params.type as TransactionType) || 'expense'
  );
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [date, setDate] = useState(new Date());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  // Preselect category if provided in URL params
  useEffect(() => {
    if (params.category && categories.length > 0) {
      const category = categories.find((c) => c.id === params.category);
      if (category) {
        setSelectedCategory(category);
      }
    }
  }, [params.category, categories]);

  // Filter categories by type
  const filteredCategories = categories.filter((cat) => cat.is_active);

  const handleAmountChange = (text: string) => {
    // Allow only numbers and decimal point
    const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    setAmount(cleaned);
    setError(null);
  };

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
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
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const { error: createError } = await createTransaction({
      amount: parseFloat(amount),
      type,
      category_id: selectedCategory!.id,
      description: description.trim() || null,
      date: format(date, 'yyyy-MM-dd'),
      tags: selectedTags.length > 0 ? selectedTags : null,
      is_recurring: false,
      is_shared: false,
    });

    if (!createError) {
      router.back();
    } else {
      setError(createError);
    }
  };

  // Get gradient colors based on type
  const getGradientColors = (): [string, string] => {
    return type === 'expense'
      ? [brandColors.error, '#EF5350']
      : [brandColors.success, '#66BB6A'];
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        {/* Gradient Header with Amount */}
        <LinearGradient
          colors={getGradientColors()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <Pressable onPress={() => router.back()} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>
            <Text variant="titleMedium" style={styles.headerTitle}>
              Nuova transazione
            </Text>
            <View style={{ width: 40 }} />
          </View>

          {/* Type Selector inside gradient */}
          <View style={styles.typeSelectorContainer}>
            <Pressable
              style={[
                styles.typeButton,
                type === 'expense' && styles.typeButtonActive,
              ]}
              onPress={() => setType('expense')}
            >
              <MaterialCommunityIcons
                name="arrow-up-circle"
                size={20}
                color={type === 'expense' ? brandColors.error : 'rgba(255,255,255,0.7)'}
              />
              <Text style={[
                styles.typeButtonText,
                type === 'expense' && styles.typeButtonTextActive,
              ]}>
                Spesa
              </Text>
            </Pressable>
            <Pressable
              style={[
                styles.typeButton,
                type === 'income' && styles.typeButtonActive,
              ]}
              onPress={() => setType('income')}
            >
              <MaterialCommunityIcons
                name="arrow-down-circle"
                size={20}
                color={type === 'income' ? brandColors.success : 'rgba(255,255,255,0.7)'}
              />
              <Text style={[
                styles.typeButtonText,
                type === 'income' && styles.typeButtonTextActive,
              ]}>
                Entrata
              </Text>
            </Pressable>
          </View>

          {/* Amount Input */}
          <View style={styles.amountContainer}>
            <Text variant="headlineLarge" style={styles.currencySymbol}>
              {profile?.main_currency === 'EUR' ? '€' : '$'}
            </Text>
            <TextInput
              value={amount}
              onChangeText={handleAmountChange}
              placeholder="0.00"
              placeholderTextColor="rgba(255,255,255,0.5)"
              keyboardType="decimal-pad"
              style={styles.amountInput}
              mode="flat"
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              textAlign="center"
              textColor="#FFFFFF"
              contentStyle={styles.amountInputContent}
            />
          </View>
        </LinearGradient>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >

          {/* Description */}
          <TextInput
            label="Descrizione (opzionale)"
            value={description}
            onChangeText={setDescription}
            mode="outlined"
            style={styles.input}
          />

          {/* Category Selection */}
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

          {/* Tags */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Tag (opzionale)
            </Text>
            <View style={styles.tagsContainer}>
              {COMMON_TAGS.map((tag) => (
                <Chip
                  key={tag}
                  selected={selectedTags.includes(tag)}
                  onPress={() => toggleTag(tag)}
                  style={styles.tagChip}
                  compact
                >
                  {tag}
                </Chip>
              ))}
            </View>
          </View>

          {/* Date */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Data
            </Text>
            <Pressable
              onPress={() => {
                // TODO: Date picker
              }}
              style={[styles.dateButton, { borderColor: theme.colors.outline }]}
            >
              <MaterialCommunityIcons name="calendar" size={20} color={theme.colors.primary} />
              <Text variant="bodyLarge" style={{ marginLeft: spacing.sm }}>
                {format(date, 'dd/MM/yyyy')}
              </Text>
            </Pressable>
          </View>

          {/* Error */}
          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}
        </ScrollView>

        {/* Gradient Submit Button */}
        <View style={[styles.footer, { borderTopColor: theme.colors.outlineVariant }]}>
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading}
            style={({ pressed }) => [
              styles.submitButtonPressable,
              pressed && styles.submitButtonPressed,
              isLoading && styles.submitButtonDisabled,
            ]}
          >
            <LinearGradient
              colors={isLoading ? ['#9E9E9E', '#757575'] : getGradientColors()}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitButtonGradient}
            >
              <MaterialCommunityIcons
                name={type === 'expense' ? 'arrow-up-circle' : 'arrow-down-circle'}
                size={22}
                color="#FFFFFF"
                style={{ marginRight: spacing.sm }}
              />
              <Text variant="titleMedium" style={styles.submitButtonText}>
                {isLoading ? 'Salvataggio...' : type === 'expense' ? 'Aggiungi spesa' : 'Aggiungi entrata'}
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
  keyboardView: {
    flex: 1,
  },
  // Gradient Header
  headerGradient: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  typeSelectorContainer: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: borderRadius.lg,
    padding: 4,
    marginBottom: spacing.lg,
  },
  typeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  typeButtonActive: {
    backgroundColor: '#FFFFFF',
  },
  typeButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#333333',
  },
  amountContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  currencySymbol: {
    fontWeight: 'bold',
    marginRight: spacing.sm,
    color: '#FFFFFF',
  },
  amountInput: {
    backgroundColor: 'transparent',
    fontSize: 48,
    width: 200,
  },
  amountInputContent: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  input: {
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  categoriesContainer: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  categoryChip: {
    marginRight: spacing.xs,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  tagChip: {
    marginBottom: spacing.xs,
  },
  dateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
  },
  submitButtonPressable: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  submitButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
