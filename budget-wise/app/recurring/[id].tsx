import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Chip,
  HelperText,
  SegmentedButtons,
  Card,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO } from 'date-fns';
import { it } from 'date-fns/locale';

import { useRecurringStore } from '../../stores/recurringStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import { spacing, borderRadius, brandColors, getContrastTextColor } from '../../constants/theme';
import { formatCurrency } from '../../constants/currencies';
import { Category } from '../../types/database';

type Frequency = 'monthly' | 'quarterly' | 'yearly';

const frequencyLabels: Record<Frequency, string> = {
  monthly: 'Mensile',
  quarterly: 'Trimestrale',
  yearly: 'Annuale',
};

export default function RecurringDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuthStore();
  const {
    recurringTransactions,
    updateRecurring,
    deleteRecurring,
    markAsPaid,
    isLoading,
  } = useRecurringStore();
  const { categories } = useCategoryStore();

  const recurring = recurringTransactions.find((r) => r.id === id);
  const category = categories.find((c) => c.id === recurring?.category_id);
  const currency = profile?.main_currency || 'EUR';

  const [isEditing, setIsEditing] = useState(false);
  const [description, setDescription] = useState(recurring?.description || '');
  const [amount, setAmount] = useState(recurring?.amount.toString() || '');
  const [frequency, setFrequency] = useState<Frequency>(
    (recurring?.frequency as Frequency) || 'monthly'
  );
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(category || null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (recurring) {
      setDescription(recurring.description || '');
      setAmount(recurring.amount.toString());
      setFrequency(recurring.frequency as Frequency);
      const cat = categories.find((c) => c.id === recurring.category_id);
      setSelectedCategory(cat || null);
    }
  }, [recurring, categories]);

  if (!recurring) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <LinearGradient
          colors={[brandColors.gradientStart, brandColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <SafeAreaView edges={['top']}>
            <View style={styles.headerContent}>
              <Pressable onPress={() => router.back()} style={styles.backButton}>
                <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
              </Pressable>
              <Text variant="titleLarge" style={styles.headerTitle}>Spesa non trovata</Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </SafeAreaView>
    );
  }

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    setAmount(cleaned);
    setError(null);
  };

  const handleSave = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setError('Inserisci un importo valido');
      return;
    }
    if (!selectedCategory) {
      setError('Seleziona una categoria');
      return;
    }

    const { error: updateError } = await updateRecurring(id!, {
      amount: parseFloat(amount),
      description: description.trim() || null,
      category_id: selectedCategory.id,
      frequency,
    });

    if (!updateError) {
      setIsEditing(false);
    } else {
      setError(updateError);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Elimina spesa ricorrente',
      'Sei sicuro di voler eliminare questa spesa ricorrente? Le transazioni passate rimarranno.',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteRecurring(id!);
            if (!error) {
              router.back();
            } else {
              Alert.alert('Errore', error);
            }
          },
        },
      ]
    );
  };

  const handleMarkAsPaid = () => {
    Alert.alert(
      'Conferma pagamento',
      `Confermi di aver pagato questa spesa? Verra creata una transazione e la prossima scadenza sara aggiornata.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Confermo',
          onPress: async () => {
            const { error } = await markAsPaid(id!);
            if (error) {
              Alert.alert('Errore', error);
            }
          },
        },
      ]
    );
  };

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
              <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
            </Pressable>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons
                name={(category?.icon || 'repeat') as keyof typeof MaterialCommunityIcons.glyphMap}
                size={28}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.headerTextContainer}>
              <Text variant="titleLarge" style={styles.headerTitle}>
                {isEditing ? 'Modifica' : recurring.description || category?.name || 'Spesa ricorrente'}
              </Text>
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                {formatCurrency(recurring.amount, currency)}/
                {recurring.frequency === 'monthly' ? 'mese' : recurring.frequency === 'quarterly' ? 'trimestre' : 'anno'}
              </Text>
            </View>
            {!isEditing ? (
              <Pressable onPress={() => setIsEditing(true)} style={styles.backButton}>
                <MaterialCommunityIcons name="pencil" size={24} color="#FFFFFF" />
              </Pressable>
            ) : (
              <Pressable onPress={() => setIsEditing(false)} style={styles.backButton}>
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </Pressable>
            )}
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {isEditing ? (
          // Edit Mode
          <>
            <TextInput
              label="Descrizione"
              value={description}
              onChangeText={(text) => {
                setDescription(text);
                setError(null);
              }}
              mode="outlined"
              style={styles.input}
            />

            <View style={styles.amountContainer}>
              <Text
                variant="headlineMedium"
                style={[styles.currencySymbol, { color: brandColors.error }]}
              >
                {currency === 'EUR' ? '€' : '$'}
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

            <View style={styles.section}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Frequenza
              </Text>
              <SegmentedButtons
                value={frequency}
                onValueChange={(value) => setFrequency(value as Frequency)}
                buttons={[
                  { value: 'monthly', label: 'Mensile' },
                  { value: 'quarterly', label: 'Trimestrale' },
                  { value: 'yearly', label: 'Annuale' },
                ]}
              />
            </View>

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

            {error && (
              <HelperText type="error" visible={!!error}>
                {error}
              </HelperText>
            )}

            <Pressable
              onPress={handleSave}
              disabled={isLoading}
              style={({ pressed }) => [
                styles.savePressable,
                pressed && styles.savePressed,
                isLoading && styles.saveDisabled,
              ]}
            >
              <LinearGradient
                colors={isLoading ? ['#9E9E9E', '#757575'] : [brandColors.gradientStart, brandColors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.saveGradient}
              >
                <Text variant="titleMedium" style={styles.saveText}>
                  {isLoading ? 'Salvataggio...' : 'Salva modifiche'}
                </Text>
              </LinearGradient>
            </Pressable>
          </>
        ) : (
          // View Mode
          <>
            <Card style={styles.detailCard} mode="elevated">
              <Card.Content style={styles.detailContent}>
                <View
                  style={[
                    styles.categoryIcon,
                    { backgroundColor: (category?.color || '#757575') + '20' },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={(category?.icon || 'repeat') as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={32}
                    color={category?.color || '#757575'}
                  />
                </View>
                <Text variant="headlineSmall" style={styles.detailAmount}>
                  {formatCurrency(recurring.amount, currency)}
                </Text>
                <Text variant="titleMedium">
                  {recurring.description || category?.name || 'Spesa ricorrente'}
                </Text>
                <Chip compact style={styles.frequencyChip}>
                  {frequencyLabels[recurring.frequency as Frequency]}
                </Chip>
              </Card.Content>
            </Card>

            <Card style={styles.infoCard} mode="elevated">
              <Card.Content>
                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Categoria
                  </Text>
                  <View style={styles.categoryBadge}>
                    <View
                      style={[
                        styles.smallCategoryIcon,
                        { backgroundColor: (category?.color || '#757575') + '20' },
                      ]}
                    >
                      <MaterialCommunityIcons
                        name={(category?.icon || 'help') as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={16}
                        color={category?.color || '#757575'}
                      />
                    </View>
                    <Text variant="bodyMedium">{category?.name || 'Senza categoria'}</Text>
                  </View>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Prossima scadenza
                  </Text>
                  <Text variant="bodyMedium">
                    {format(parseISO(recurring.next_date), 'd MMMM yyyy', { locale: it })}
                  </Text>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Costo annuale
                  </Text>
                  <Text variant="bodyMedium" style={{ color: brandColors.error }}>
                    {formatCurrency(
                      recurring.amount *
                        (recurring.frequency === 'monthly'
                          ? 12
                          : recurring.frequency === 'quarterly'
                          ? 4
                          : 1),
                      currency
                    )}
                  </Text>
                </View>

                <Divider style={styles.divider} />

                <View style={styles.infoRow}>
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Creata il
                  </Text>
                  <Text variant="bodyMedium">
                    {format(parseISO(recurring.created_at), 'd MMM yyyy', { locale: it })}
                  </Text>
                </View>
              </Card.Content>
            </Card>

            {/* Actions */}
            <View style={styles.actions}>
              <Pressable
                onPress={handleMarkAsPaid}
                style={({ pressed }) => [
                  styles.actionPressable,
                  pressed && styles.actionPressed,
                ]}
              >
                <LinearGradient
                  colors={[brandColors.success, '#2E7D32']}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.actionGradient}
                >
                  <MaterialCommunityIcons name="check-circle" size={20} color="#FFFFFF" style={{ marginRight: spacing.sm }} />
                  <Text variant="titleMedium" style={styles.actionText}>
                    Segna come pagata
                  </Text>
                </LinearGradient>
              </Pressable>

              <Button
                mode="outlined"
                icon="delete"
                onPress={handleDelete}
                textColor={brandColors.error}
                style={styles.actionButton}
              >
                Elimina
              </Button>
            </View>
          </>
        )}
      </ScrollView>
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
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
  savePressable: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.md,
  },
  savePressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  saveDisabled: {
    opacity: 0.6,
  },
  saveGradient: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  saveText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  detailCard: {
    marginBottom: spacing.md,
  },
  detailContent: {
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  categoryIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  detailAmount: {
    fontWeight: 'bold',
    color: brandColors.error,
    marginBottom: spacing.xs,
  },
  frequencyChip: {
    marginTop: spacing.sm,
  },
  infoCard: {
    marginBottom: spacing.md,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  divider: {
    marginVertical: spacing.xs,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  smallCategoryIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actions: {
    gap: spacing.sm,
  },
  actionPressable: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  actionPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  actionButton: {
    borderRadius: 12,
  },
});
