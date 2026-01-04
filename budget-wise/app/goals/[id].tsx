import { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Alert, Pressable } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Button,
  ProgressBar,
  TextInput,
  Dialog,
  Portal,
  Divider,
  Menu,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, differenceInMonths, differenceInDays, addMonths } from 'date-fns';
import { it } from 'date-fns/locale';

import { useGoalStore } from '../../stores/goalStore';
import { useAuthStore } from '../../stores/authStore';
import { spacing, borderRadius, brandColors } from '../../constants/theme';
import { formatCurrency } from '../../constants/currencies';
import { useCelebration } from '../../components/celebration';

export default function GoalDetailScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { profile } = useAuthStore();
  const { getGoalById, addToGoal, updateGoal, deleteGoal, fetchGoals, isLoading } = useGoalStore();
  const { showGoalComplete } = useCelebration();

  const [goal, setGoal] = useState(getGoalById(id || ''));
  const [addFundsVisible, setAddFundsVisible] = useState(false);
  const [addAmount, setAddAmount] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState('');
  const [editTargetAmount, setEditTargetAmount] = useState('');
  const [editMonthlyAllocation, setEditMonthlyAllocation] = useState('');

  const currency = profile?.main_currency || 'EUR';

  useEffect(() => {
    const currentGoal = getGoalById(id || '');
    setGoal(currentGoal);
    if (currentGoal) {
      setEditName(currentGoal.name);
      setEditTargetAmount(currentGoal.target_amount.toString());
      setEditMonthlyAllocation(currentGoal.monthly_allocation?.toString() || '');
    }
  }, [id, getGoalById]);

  const loadData = useCallback(async () => {
    await fetchGoals();
    setGoal(getGoalById(id || ''));
  }, [fetchGoals, getGoalById, id]);

  if (!goal) {
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
            </View>
          </SafeAreaView>
        </LinearGradient>
        <View style={styles.emptyState}>
          <MaterialCommunityIcons
            name="target"
            size={64}
            color={theme.colors.onSurfaceVariant}
          />
          <Text variant="titleMedium" style={{ marginTop: spacing.md }}>
            Obiettivo non trovato
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const percentage = goal.target_amount > 0
    ? (goal.current_amount / goal.target_amount) * 100
    : 0;
  const remaining = goal.target_amount - goal.current_amount;
  const isCompleted = goal.is_completed || percentage >= 100;

  const getEstimatedDate = () => {
    if (isCompleted) return null;
    if (goal.monthly_allocation && goal.monthly_allocation > 0 && remaining > 0) {
      const monthsRemaining = Math.ceil(remaining / goal.monthly_allocation);
      return addMonths(new Date(), monthsRemaining);
    }
    return null;
  };

  const getDaysRemaining = () => {
    if (!goal.target_date) return null;
    const days = differenceInDays(new Date(goal.target_date), new Date());
    return days > 0 ? days : 0;
  };

  const estimatedDate = getEstimatedDate();
  const daysRemaining = getDaysRemaining();

  const handleAddFunds = async () => {
    const amount = parseFloat(addAmount);
    if (!amount || amount <= 0) return;

    const willComplete = goal.current_amount + amount >= goal.target_amount;
    const { error } = await addToGoal(goal.id, amount);
    if (!error) {
      setAddFundsVisible(false);
      setAddAmount('');
      await loadData();

      // Check if goal completed and show celebration
      if (willComplete) {
        showGoalComplete({
          ...goal,
          current_amount: goal.current_amount + amount,
        });
      }
    } else {
      Alert.alert('Errore', error);
    }
  };

  const handleSaveEdit = async () => {
    const { error } = await updateGoal(goal.id, {
      name: editName.trim(),
      target_amount: parseFloat(editTargetAmount) || goal.target_amount,
      monthly_allocation: editMonthlyAllocation
        ? parseFloat(editMonthlyAllocation)
        : null,
    });

    if (!error) {
      setEditMode(false);
      await loadData();
    } else {
      Alert.alert('Errore', error);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Elimina obiettivo',
      `Sei sicuro di voler eliminare "${goal.name}"? Questa azione non puo essere annullata.`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Elimina',
          style: 'destructive',
          onPress: async () => {
            const { error } = await deleteGoal(goal.id);
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

  const handleResetProgress = () => {
    Alert.alert(
      'Azzera progresso',
      'Vuoi azzerare il progresso di questo obiettivo?',
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Azzera',
          style: 'destructive',
          onPress: async () => {
            await updateGoal(goal.id, {
              current_amount: 0,
              is_completed: false,
              completed_at: null,
            });
            await loadData();
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={isCompleted ? [brandColors.success, '#2E7D32'] : [brandColors.gradientStart, brandColors.gradientEnd]}
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
                name={(goal.icon || 'target') as keyof typeof MaterialCommunityIcons.glyphMap}
                size={28}
                color="#FFFFFF"
              />
            </View>
            <View style={styles.headerTextContainer}>
              <Text variant="titleLarge" style={styles.headerTitle} numberOfLines={1}>
                {goal.name}
              </Text>
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                {percentage.toFixed(0)}% completato
              </Text>
            </View>
            <Menu
              visible={menuVisible}
              onDismiss={() => setMenuVisible(false)}
              anchor={
                <Pressable onPress={() => setMenuVisible(true)} style={styles.backButton}>
                  <MaterialCommunityIcons name="dots-vertical" size={24} color="#FFFFFF" />
                </Pressable>
              }
            >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              setEditMode(true);
            }}
            title="Modifica"
            leadingIcon="pencil"
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              handleResetProgress();
            }}
            title="Azzera progresso"
            leadingIcon="refresh"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              handleDelete();
            }}
            title="Elimina"
            leadingIcon="delete"
            titleStyle={{ color: brandColors.error }}
          />
        </Menu>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Goal Card */}
        <Card
          style={[
            styles.mainCard,
            isCompleted && { borderColor: brandColors.success, borderWidth: 2 },
          ]}
          mode="elevated"
        >
          <Card.Content>
            {/* Icon and Status */}
            <View style={styles.goalHeader}>
              <View
                style={[
                  styles.iconContainer,
                  {
                    backgroundColor: isCompleted
                      ? brandColors.success + '20'
                      : theme.colors.primaryContainer,
                  },
                ]}
              >
                <MaterialCommunityIcons
                  name={(goal.icon || 'target') as keyof typeof MaterialCommunityIcons.glyphMap}
                  size={40}
                  color={isCompleted ? brandColors.success : theme.colors.primary}
                />
              </View>
              {isCompleted && (
                <View style={styles.completedBadge}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={brandColors.success}
                  />
                  <Text variant="labelMedium" style={{ color: brandColors.success }}>
                    Completato
                  </Text>
                </View>
              )}
            </View>

            {/* Progress */}
            <View style={styles.progressSection}>
              <View style={styles.amountRow}>
                <Text
                  variant="displaySmall"
                  style={[
                    styles.currentAmount,
                    { color: isCompleted ? brandColors.success : theme.colors.primary },
                  ]}
                >
                  {formatCurrency(goal.current_amount, currency)}
                </Text>
                <Text variant="titleMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  / {formatCurrency(goal.target_amount, currency)}
                </Text>
              </View>

              <ProgressBar
                progress={Math.min(percentage / 100, 1)}
                color={isCompleted ? brandColors.success : theme.colors.primary}
                style={styles.progressBar}
              />

              <View style={styles.progressLabels}>
                <Text
                  variant="titleMedium"
                  style={{ color: isCompleted ? brandColors.success : theme.colors.primary }}
                >
                  {percentage.toFixed(1)}%
                </Text>
                {!isCompleted && (
                  <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                    Mancano {formatCurrency(remaining, currency)}
                  </Text>
                )}
              </View>
            </View>

            {/* Add Funds Button */}
            {!isCompleted && (
              <Pressable
                onPress={() => setAddFundsVisible(true)}
                style={({ pressed }) => [
                  styles.addFundsPressable,
                  pressed && styles.addFundsPressed,
                ]}
              >
                <LinearGradient
                  colors={[brandColors.gradientStart, brandColors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.addFundsGradient}
                >
                  <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" style={{ marginRight: spacing.sm }} />
                  <Text variant="titleMedium" style={styles.addFundsText}>
                    Aggiungi fondi
                  </Text>
                </LinearGradient>
              </Pressable>
            )}
          </Card.Content>
        </Card>

        {/* Details Card */}
        <Card style={styles.detailsCard} mode="outlined">
          <Card.Content>
            <Text variant="titleMedium" style={styles.detailsTitle}>
              Dettagli
            </Text>

            {goal.target_date && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MaterialCommunityIcons
                    name="calendar"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.detailInfo}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Data obiettivo
                  </Text>
                  <Text variant="bodyLarge">
                    {format(new Date(goal.target_date), 'd MMMM yyyy', { locale: it })}
                  </Text>
                  {daysRemaining !== null && daysRemaining > 0 && (
                    <Text
                      variant="bodySmall"
                      style={{
                        color: daysRemaining < 30 ? brandColors.warning : theme.colors.onSurfaceVariant,
                      }}
                    >
                      {daysRemaining} giorni rimanenti
                    </Text>
                  )}
                </View>
              </View>
            )}

            {goal.monthly_allocation && goal.monthly_allocation > 0 && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MaterialCommunityIcons
                    name="cash-refund"
                    size={20}
                    color={theme.colors.primary}
                  />
                </View>
                <View style={styles.detailInfo}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Risparmio mensile
                  </Text>
                  <Text variant="bodyLarge">
                    {formatCurrency(goal.monthly_allocation, currency)}/mese
                  </Text>
                </View>
              </View>
            )}

            {estimatedDate && !isCompleted && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MaterialCommunityIcons
                    name="calendar-clock"
                    size={20}
                    color={brandColors.success}
                  />
                </View>
                <View style={styles.detailInfo}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Raggiungimento stimato
                  </Text>
                  <Text variant="bodyLarge" style={{ color: brandColors.success }}>
                    {format(estimatedDate, 'MMMM yyyy', { locale: it })}
                  </Text>
                </View>
              </View>
            )}

            <View style={styles.detailRow}>
              <View style={styles.detailIcon}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={20}
                  color={theme.colors.onSurfaceVariant}
                />
              </View>
              <View style={styles.detailInfo}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Creato il
                </Text>
                <Text variant="bodyLarge">
                  {format(new Date(goal.created_at), 'd MMMM yyyy', { locale: it })}
                </Text>
              </View>
            </View>

            {goal.completed_at && (
              <View style={styles.detailRow}>
                <View style={styles.detailIcon}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={brandColors.success}
                  />
                </View>
                <View style={styles.detailInfo}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Completato il
                  </Text>
                  <Text variant="bodyLarge" style={{ color: brandColors.success }}>
                    {format(new Date(goal.completed_at), 'd MMMM yyyy', { locale: it })}
                  </Text>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Quick Add Amounts */}
        {!isCompleted && (
          <Card style={styles.quickAddCard} mode="outlined">
            <Card.Content>
              <Text variant="titleMedium" style={styles.detailsTitle}>
                Aggiungi rapidamente
              </Text>
              <View style={styles.quickAddButtons}>
                {[10, 20, 50, 100].map((amount) => (
                  <Button
                    key={amount}
                    mode="outlined"
                    onPress={async () => {
                      const willComplete = goal.current_amount + amount >= goal.target_amount;
                      const { error } = await addToGoal(goal.id, amount);
                      if (!error) {
                        await loadData();
                        if (willComplete) {
                          showGoalComplete({
                            ...goal,
                            current_amount: goal.current_amount + amount,
                          });
                        }
                      }
                    }}
                    style={styles.quickAddButton}
                    disabled={isLoading}
                  >
                    +{formatCurrency(amount, currency)}
                  </Button>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Add Funds Dialog */}
      <Portal>
        <Dialog visible={addFundsVisible} onDismiss={() => setAddFundsVisible(false)}>
          <Dialog.Title>Aggiungi fondi</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Importo"
              value={addAmount}
              onChangeText={(text) =>
                setAddAmount(text.replace(/[^0-9.,]/g, '').replace(',', '.'))
              }
              keyboardType="decimal-pad"
              mode="outlined"
              left={<TextInput.Affix text={currency === 'EUR' ? '€' : '$'} />}
              autoFocus
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setAddFundsVisible(false)}>Annulla</Button>
            <Button
              onPress={handleAddFunds}
              disabled={!addAmount || parseFloat(addAmount) <= 0}
            >
              Aggiungi
            </Button>
          </Dialog.Actions>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog visible={editMode} onDismiss={() => setEditMode(false)}>
          <Dialog.Title>Modifica obiettivo</Dialog.Title>
          <Dialog.Content>
            <TextInput
              label="Nome"
              value={editName}
              onChangeText={setEditName}
              mode="outlined"
              style={styles.dialogInput}
            />
            <TextInput
              label="Importo target"
              value={editTargetAmount}
              onChangeText={(text) =>
                setEditTargetAmount(text.replace(/[^0-9.,]/g, '').replace(',', '.'))
              }
              keyboardType="decimal-pad"
              mode="outlined"
              left={<TextInput.Affix text={currency === 'EUR' ? '€' : '$'} />}
              style={styles.dialogInput}
            />
            <TextInput
              label="Risparmio mensile (opzionale)"
              value={editMonthlyAllocation}
              onChangeText={(text) =>
                setEditMonthlyAllocation(text.replace(/[^0-9.,]/g, '').replace(',', '.'))
              }
              keyboardType="decimal-pad"
              mode="outlined"
              left={<TextInput.Affix text={currency === 'EUR' ? '€' : '$'} />}
            />
          </Dialog.Content>
          <Dialog.Actions>
            <Button onPress={() => setEditMode(false)}>Annulla</Button>
            <Button onPress={handleSaveEdit} disabled={!editName.trim()}>
              Salva
            </Button>
          </Dialog.Actions>
        </Dialog>
      </Portal>
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
  mainCard: {
    marginBottom: spacing.md,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  completedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    backgroundColor: brandColors.success + '15',
    borderRadius: 20,
  },
  progressSection: {
    gap: spacing.sm,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: spacing.sm,
  },
  currentAmount: {
    fontWeight: 'bold',
  },
  progressBar: {
    height: 12,
    borderRadius: 6,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  addFundsPressable: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
    marginTop: spacing.lg,
  },
  addFundsPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  addFundsGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  addFundsText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  detailsCard: {
    marginBottom: spacing.md,
  },
  detailsTitle: {
    marginBottom: spacing.md,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  detailIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  detailInfo: {
    flex: 1,
  },
  quickAddCard: {
    marginBottom: spacing.md,
  },
  quickAddButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  quickAddButton: {
    flex: 1,
    minWidth: '45%',
  },
  dialogInput: {
    marginBottom: spacing.md,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
