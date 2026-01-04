import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  Chip,
  IconButton,
  HelperText,
  Card,
  Divider,
  Avatar,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';

import { useSharedStore } from '../../stores/sharedStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import { spacing, borderRadius, brandColors, getContrastTextColor } from '../../constants/theme';
import { formatCurrency } from '../../constants/currencies';
import { Category } from '../../types/database';

interface Participant {
  id: string;
  name: string;
  amount: number;
}

type SplitMode = 'equal' | 'custom';

export default function AddSharedExpenseScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useAuthStore();
  const { createSharedExpense, isLoading } = useSharedStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [description, setDescription] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [newParticipantName, setNewParticipantName] = useState('');
  const [splitMode, setSplitMode] = useState<SplitMode>('equal');
  const [error, setError] = useState<string | null>(null);

  const currency = profile?.main_currency || 'EUR';

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const handleAmountChange = (text: string) => {
    const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    setTotalAmount(cleaned);
    setError(null);

    // Recalculate equal split
    if (splitMode === 'equal' && participants.length > 0) {
      const total = parseFloat(cleaned) || 0;
      const perPerson = total / (participants.length + 1); // +1 for user
      setParticipants((prev) =>
        prev.map((p) => ({ ...p, amount: Math.round(perPerson * 100) / 100 }))
      );
    }
  };

  const addParticipant = () => {
    if (!newParticipantName.trim()) return;

    // Check for duplicate
    if (participants.some((p) => p.name.toLowerCase() === newParticipantName.trim().toLowerCase())) {
      setError('Partecipante gia aggiunto');
      return;
    }

    const total = parseFloat(totalAmount) || 0;
    const newParticipantsCount = participants.length + 2; // +1 for new +1 for user
    const perPerson = splitMode === 'equal' ? total / newParticipantsCount : 0;

    const newParticipant: Participant = {
      id: Date.now().toString(),
      name: newParticipantName.trim(),
      amount: Math.round(perPerson * 100) / 100,
    };

    let updatedParticipants = [...participants, newParticipant];

    if (splitMode === 'equal') {
      updatedParticipants = updatedParticipants.map((p) => ({
        ...p,
        amount: Math.round(perPerson * 100) / 100,
      }));
    }

    setParticipants(updatedParticipants);
    setNewParticipantName('');
    setError(null);
  };

  const removeParticipant = (id: string) => {
    const updatedParticipants = participants.filter((p) => p.id !== id);

    if (splitMode === 'equal' && updatedParticipants.length > 0) {
      const total = parseFloat(totalAmount) || 0;
      const perPerson = total / (updatedParticipants.length + 1);
      setParticipants(
        updatedParticipants.map((p) => ({
          ...p,
          amount: Math.round(perPerson * 100) / 100,
        }))
      );
    } else {
      setParticipants(updatedParticipants);
    }
  };

  const updateParticipantAmount = (id: string, amount: string) => {
    const cleaned = amount.replace(/[^0-9.,]/g, '').replace(',', '.');
    setParticipants((prev) =>
      prev.map((p) => (p.id === id ? { ...p, amount: parseFloat(cleaned) || 0 } : p))
    );
  };

  const handleSplitModeChange = (mode: string) => {
    setSplitMode(mode as SplitMode);
    if (mode === 'equal' && participants.length > 0) {
      const total = parseFloat(totalAmount) || 0;
      const perPerson = total / (participants.length + 1);
      setParticipants((prev) =>
        prev.map((p) => ({ ...p, amount: Math.round(perPerson * 100) / 100 }))
      );
    }
  };

  const calculateUserShare = () => {
    const total = parseFloat(totalAmount) || 0;
    const participantsTotal = participants.reduce((sum, p) => sum + p.amount, 0);
    return total - participantsTotal;
  };

  const validateForm = (): boolean => {
    if (!totalAmount || parseFloat(totalAmount) <= 0) {
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
    if (participants.length === 0) {
      setError('Aggiungi almeno un partecipante');
      return false;
    }

    const participantsTotal = participants.reduce((sum, p) => sum + p.amount, 0);
    const total = parseFloat(totalAmount);
    if (participantsTotal >= total) {
      setError('La somma delle quote non puo superare il totale');
      return false;
    }

    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const { error: createError } = await createSharedExpense(
      {
        amount: parseFloat(totalAmount),
        type: 'expense',
        category_id: selectedCategory!.id,
        description: description.trim(),
        date: format(new Date(), 'yyyy-MM-dd'),
        is_shared: true,
      },
      participants.map((p) => ({ name: p.name, amount: p.amount }))
    );

    if (!createError) {
      router.back();
    } else {
      setError(createError);
    }
  };

  const filteredCategories = categories.filter((cat) => cat.is_active);
  const userShare = calculateUserShare();
  const total = parseFloat(totalAmount) || 0;

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
              <MaterialCommunityIcons name="account-multiple" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text variant="titleLarge" style={styles.headerTitle}>
                Spesa condivisa
              </Text>
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                Dividi le spese con altri
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
            placeholder="es. Cena al ristorante"
          />

          {/* Total Amount */}
          <View style={styles.amountContainer}>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              Totale spesa
            </Text>
            <View style={styles.amountRow}>
              <Text
                variant="headlineMedium"
                style={[styles.currencySymbol, { color: brandColors.error }]}
              >
                {currency === 'EUR' ? '€' : '$'}
              </Text>
              <TextInput
                value={totalAmount}
                onChangeText={handleAmountChange}
                placeholder="0.00"
                keyboardType="decimal-pad"
                style={styles.amountInput}
                mode="flat"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                contentStyle={styles.amountInputContent}
              />
            </View>
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

          {/* Split Mode */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Modalita divisione
            </Text>
            <SegmentedButtons
              value={splitMode}
              onValueChange={handleSplitModeChange}
              buttons={[
                { value: 'equal', label: 'Dividi equamente' },
                { value: 'custom', label: 'Importi personalizzati' },
              ]}
            />
          </View>

          {/* Participants */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Partecipanti
            </Text>

            {/* Add participant input */}
            <View style={styles.addParticipantRow}>
              <TextInput
                label="Nome partecipante"
                value={newParticipantName}
                onChangeText={setNewParticipantName}
                mode="outlined"
                style={styles.participantInput}
                onSubmitEditing={addParticipant}
              />
              <IconButton
                icon="plus"
                mode="contained"
                onPress={addParticipant}
                disabled={!newParticipantName.trim()}
              />
            </View>

            {/* Participants list */}
            {participants.length > 0 && (
              <Card style={styles.participantsCard} mode="outlined">
                <Card.Content>
                  {participants.map((participant, index) => (
                    <View key={participant.id}>
                      {index > 0 && <Divider style={styles.participantDivider} />}
                      <View style={styles.participantRow}>
                        <View style={styles.participantInfo}>
                          <Avatar.Text
                            size={36}
                            label={participant.name.slice(0, 2).toUpperCase()}
                            style={{ backgroundColor: theme.colors.primaryContainer }}
                            labelStyle={{ fontSize: 14 }}
                          />
                          <Text variant="bodyLarge">{participant.name}</Text>
                        </View>
                        <View style={styles.participantAmount}>
                          {splitMode === 'custom' ? (
                            <TextInput
                              value={participant.amount.toString()}
                              onChangeText={(text) =>
                                updateParticipantAmount(participant.id, text)
                              }
                              keyboardType="decimal-pad"
                              mode="outlined"
                              dense
                              style={styles.customAmountInput}
                            />
                          ) : (
                            <Text variant="titleSmall">
                              {formatCurrency(participant.amount, currency)}
                            </Text>
                          )}
                          <IconButton
                            icon="close"
                            size={20}
                            onPress={() => removeParticipant(participant.id)}
                          />
                        </View>
                      </View>
                    </View>
                  ))}
                </Card.Content>
              </Card>
            )}
          </View>

          {/* Summary */}
          {participants.length > 0 && total > 0 && (
            <Card
              style={[
                styles.summaryCard,
                { backgroundColor: theme.colors.primaryContainer },
              ]}
              mode="elevated"
            >
              <Card.Content>
                <Text variant="titleMedium" style={styles.summaryTitle}>
                  Riepilogo
                </Text>
                <View style={styles.summaryRow}>
                  <Text variant="bodyMedium">Totale spesa</Text>
                  <Text variant="bodyMedium">{formatCurrency(total, currency)}</Text>
                </View>
                <View style={styles.summaryRow}>
                  <Text variant="bodyMedium">La tua quota</Text>
                  <Text
                    variant="titleMedium"
                    style={{ color: brandColors.primary }}
                  >
                    {formatCurrency(userShare, currency)}
                  </Text>
                </View>
                <Divider style={styles.summaryDivider} />
                <View style={styles.summaryRow}>
                  <Text variant="bodyMedium">Da ricevere</Text>
                  <Text variant="titleMedium" style={{ color: brandColors.success }}>
                    {formatCurrency(total - userShare, currency)}
                  </Text>
                </View>
              </Card.Content>
            </Card>
          )}

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
            disabled={isLoading || participants.length === 0}
            style={({ pressed }) => [
              styles.submitPressable,
              pressed && styles.submitPressed,
              (isLoading || participants.length === 0) && styles.submitDisabled,
            ]}
          >
            <LinearGradient
              colors={(isLoading || participants.length === 0) ? ['#9E9E9E', '#757575'] : [brandColors.gradientStart, brandColors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <MaterialCommunityIcons name="account-multiple-plus" size={22} color="#FFFFFF" style={styles.submitIcon} />
              <Text variant="titleMedium" style={styles.submitText}>
                {isLoading ? 'Creazione...' : 'Crea spesa condivisa'}
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
  input: {
    marginBottom: spacing.md,
  },
  amountContainer: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  amountInput: {
    backgroundColor: 'transparent',
    fontSize: 36,
    width: 150,
  },
  amountInputContent: {
    fontSize: 36,
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
  addParticipantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  participantInput: {
    flex: 1,
  },
  participantsCard: {
    marginTop: spacing.md,
  },
  participantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  participantDivider: {
    marginVertical: spacing.xs,
  },
  participantInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  participantAmount: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  customAmountInput: {
    width: 80,
    height: 40,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  summaryTitle: {
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  summaryDivider: {
    marginVertical: spacing.sm,
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
