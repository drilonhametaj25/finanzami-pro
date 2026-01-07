import { useCallback, useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Surface,
  ProgressBar,
  Chip,
  IconButton,
  Button,
  Portal,
  Modal,
  TextInput,
  Snackbar,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, startOfMonth, endOfMonth, parseISO, isWithinInterval } from 'date-fns';
import { it } from 'date-fns/locale';

import { useAuthStore } from '../../stores/authStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useInsightStore } from '../../stores/insightStore';
import { useGoalStore } from '../../stores/goalStore';
import { useRecurringStore } from '../../stores/recurringStore';
import { spacing, borderRadius, brandColors, budgetStatusColors } from '../../constants/theme';
import { formatCurrency } from '../../constants/currencies';
import { useCelebration } from '../../components/celebration';
import { GradientFAB } from '../../components/ui';

export default function DashboardScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const { transactions, fetchTransactions, getMonthlyStats } = useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { insights, fetchInsights, getHighPriorityInsights, getUnreadCount } = useInsightStore();
  const { goals, fetchGoals, addToGoal } = useGoalStore();
  const { fetchRecurring, processOverdueAutomatically } = useRecurringStore();
  const { showGoalComplete } = useCelebration();

  const [refreshing, setRefreshing] = useState(false);

  // Goal quick-add modal state
  const [showGoalAddModal, setShowGoalAddModal] = useState(false);
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
  const [goalAddAmount, setGoalAddAmount] = useState('');
  const [isAddingToGoal, setIsAddingToGoal] = useState(false);
  const [snackbar, setSnackbar] = useState({ visible: false, message: '' });

  const currency = profile?.main_currency || 'EUR';
  const monthlyBudget = profile?.monthly_budget || 0;

  // Calculate monthly stats with useMemo so it updates when transactions change
  const monthlyStats = useMemo(() => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    const monthTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= start && date <= end;
    });

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  }, [transactions]);

  const budgetPercentage = monthlyBudget > 0 ? (monthlyStats.expenses / monthlyBudget) : 0;
  const budgetRemaining = monthlyBudget - monthlyStats.expenses;

  const getBudgetStatus = () => {
    if (budgetPercentage >= 1) return { color: budgetStatusColors.exceeded, label: 'Superato' };
    if (budgetPercentage >= 0.85) return { color: budgetStatusColors.danger, label: 'Critico' };
    if (budgetPercentage >= 0.70) return { color: budgetStatusColors.warning, label: 'Attenzione' };
    return { color: budgetStatusColors.safe, label: 'In regola' };
  };

  const budgetStatus = getBudgetStatus();

  const loadData = useCallback(async () => {
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    // First, fetch recurring and process any overdue ones automatically
    await fetchRecurring();
    await processOverdueAutomatically();

    // Then fetch all data (transactions will include any newly created from recurring)
    await Promise.all([
      fetchTransactions({
        startDate: format(start, 'yyyy-MM-dd'),
        endDate: format(end, 'yyyy-MM-dd'),
      }),
      fetchCategories(),
      fetchInsights(),
      fetchGoals(),
    ]);
  }, [fetchTransactions, fetchCategories, fetchInsights, fetchGoals, fetchRecurring, processOverdueAutomatically]);

  // Reload data every time the screen comes into focus
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [loadData])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const currentMonth = format(new Date(), 'MMMM yyyy', { locale: it });

  // Calculate spending per category for current month
  const categorySpending = useMemo(() => {
    const start = startOfMonth(new Date());
    const end = endOfMonth(new Date());

    const spending: Record<string, number> = {};

    transactions.forEach((t) => {
      if (t.type === 'expense') {
        const transactionDate = parseISO(t.date);
        if (isWithinInterval(transactionDate, { start, end })) {
          spending[t.category_id] = (spending[t.category_id] || 0) + t.amount;
        }
      }
    });

    return spending;
  }, [transactions]);

  // Categories with budgets (for quick-add cards)
  const categoriesWithBudgets = useMemo(() => {
    return categories
      .filter((cat) => cat.is_active && cat.budget && cat.budget > 0)
      .map((cat) => {
        const spent = categorySpending[cat.id] || 0;
        const budget = cat.budget || 0;
        const percentage = budget > 0 ? (spent / budget) * 100 : 0;
        const remaining = budget - spent;
        return { ...cat, spent, percentage, remaining };
      })
      .sort((a, b) => b.percentage - a.percentage);
  }, [categories, categorySpending]);

  // Active goals (not completed)
  const activeGoals = useMemo(() => {
    return goals
      .filter((g) => !g.is_completed)
      .slice(0, 3); // Show max 3 on home
  }, [goals]);

  // Get top spending categories (without budgets, for the old section)
  const categoryStats = categories
    .filter((cat) => cat.is_active)
    .map((cat) => {
      const catTransactions = transactions.filter(
        (t) => t.category_id === cat.id && t.type === 'expense'
      );
      const total = catTransactions.reduce((sum, t) => sum + t.amount, 0);
      return { ...cat, total };
    })
    .filter((cat) => cat.total > 0)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5);

  // Get insights data for preview
  const highPriorityInsights = getHighPriorityInsights();
  const unreadCount = getUnreadCount();
  const previewInsights = insights.slice(0, 3);

  const getCategoryBudgetStatus = (percentage: number) => {
    if (percentage >= 100) return { color: budgetStatusColors.exceeded, label: 'Sforato' };
    if (percentage >= 85) return { color: budgetStatusColors.danger, label: 'Critico' };
    if (percentage >= 70) return { color: budgetStatusColors.warning, label: 'Attenzione' };
    return { color: budgetStatusColors.safe, label: 'OK' };
  };

  // Goal quick-add handlers
  const handleOpenGoalAdd = (goalId: string) => {
    setSelectedGoalId(goalId);
    setGoalAddAmount('');
    setShowGoalAddModal(true);
  };

  const handleQuickAddToGoal = async (goalId: string, amount: number) => {
    const goal = goals.find((g) => g.id === goalId);
    if (!goal) return;

    const willComplete = goal.current_amount + amount >= goal.target_amount;

    setIsAddingToGoal(true);
    const { error } = await addToGoal(goalId, amount);
    setIsAddingToGoal(false);

    if (error) {
      setSnackbar({ visible: true, message: 'Errore nell\'aggiungere fondi' });
    } else {
      if (willComplete) {
        showGoalComplete({ ...goal, current_amount: goal.current_amount + amount });
      } else {
        setSnackbar({ visible: true, message: `+${formatCurrency(amount, currency)} aggiunto!` });
      }
    }
  };

  const handleConfirmGoalAdd = async () => {
    if (!selectedGoalId || !goalAddAmount) return;

    const amount = parseFloat(goalAddAmount.replace(',', '.'));
    if (isNaN(amount) || amount <= 0) {
      setSnackbar({ visible: true, message: 'Inserisci un importo valido' });
      return;
    }

    const goal = goals.find((g) => g.id === selectedGoalId);
    if (!goal) return;

    const willComplete = goal.current_amount + amount >= goal.target_amount;

    setIsAddingToGoal(true);
    const { error } = await addToGoal(selectedGoalId, amount);
    setIsAddingToGoal(false);

    if (error) {
      setSnackbar({ visible: true, message: 'Errore nell\'aggiungere fondi' });
    } else {
      setShowGoalAddModal(false);
      if (willComplete) {
        showGoalComplete({ ...goal, current_amount: goal.current_amount + amount });
      } else {
        setSnackbar({ visible: true, message: `+${formatCurrency(amount, currency)} aggiunto!` });
      }
    }
  };

  const selectedGoal = goals.find((g) => g.id === selectedGoalId);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              Ciao, {profile?.full_name?.split(' ')[0] || 'Utente'}
            </Text>
            <Text variant="headlineSmall" style={styles.monthTitle}>
              {currentMonth}
            </Text>
          </View>
          <IconButton
            icon="bell-outline"
            size={24}
            onPress={() => router.push('/insights')}
          />
        </View>

        {/* Balance Card with Gradient */}
        <LinearGradient
          colors={[brandColors.gradientStart, brandColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceContent}>
            <Text variant="bodyMedium" style={styles.balanceLabel}>
              Saldo del mese
            </Text>
            <Text variant="displaySmall" style={styles.balanceAmount}>
              {formatCurrency(monthlyStats.balance, currency)}
            </Text>

            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <View style={[styles.statIcon, styles.incomeIcon]}>
                  <MaterialCommunityIcons name="arrow-down" size={16} color="#4CAF50" />
                </View>
                <View>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Entrate
                  </Text>
                  <Text variant="titleMedium" style={styles.incomeAmount}>
                    {formatCurrency(monthlyStats.income, currency)}
                  </Text>
                </View>
              </View>

              <View style={styles.statItem}>
                <View style={[styles.statIcon, styles.expenseIcon]}>
                  <MaterialCommunityIcons name="arrow-up" size={16} color="#EF5350" />
                </View>
                <View>
                  <Text variant="bodySmall" style={styles.statLabel}>
                    Uscite
                  </Text>
                  <Text variant="titleMedium" style={styles.expenseAmount}>
                    {formatCurrency(monthlyStats.expenses, currency)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Budget Progress */}
        {monthlyBudget > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <View style={styles.budgetHeader}>
                <Text variant="titleMedium">Budget mensile</Text>
                <Chip
                  compact
                  style={{ backgroundColor: budgetStatus.color + '20' }}
                  textStyle={{ color: budgetStatus.color, fontSize: 12 }}
                >
                  {budgetStatus.label}
                </Chip>
              </View>

              <ProgressBar
                progress={Math.min(budgetPercentage, 1)}
                color={budgetStatus.color}
                style={styles.progressBar}
              />

              <View style={styles.budgetFooter}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  {formatCurrency(monthlyStats.expenses, currency)} di{' '}
                  {formatCurrency(monthlyBudget, currency)}
                </Text>
                <Text
                  variant="bodySmall"
                  style={{ color: budgetRemaining >= 0 ? brandColors.success : brandColors.error }}
                >
                  {budgetRemaining >= 0 ? 'Rimangono ' : 'Sforato di '}
                  {formatCurrency(Math.abs(budgetRemaining), currency)}
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Category Budget Cards - Quick Add */}
        {categoriesWithBudgets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Budget Categorie
              </Text>
              <IconButton
                icon="cog"
                size={20}
                onPress={() => router.push('/category/manage')}
              />
            </View>

            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.categoryBudgetScroll}
            >
              {categoriesWithBudgets.slice(0, 5).map((cat) => {
                const status = getCategoryBudgetStatus(cat.percentage);
                return (
                  <Surface
                    key={cat.id}
                    style={[styles.categoryBudgetCard, { borderLeftColor: cat.color }]}
                    elevation={2}
                  >
                    <View style={styles.categoryBudgetHeader}>
                      <View style={[styles.categoryBudgetIcon, { backgroundColor: cat.color + '20' }]}>
                        <MaterialCommunityIcons
                          name={cat.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={20}
                          color={cat.color}
                        />
                      </View>
                      <Text variant="titleSmall" numberOfLines={1} style={{ flex: 1 }}>
                        {cat.name}
                      </Text>
                    </View>

                    <View style={styles.categoryBudgetProgress}>
                      <ProgressBar
                        progress={Math.min(cat.percentage / 100, 1)}
                        color={status.color}
                        style={{ height: 6, borderRadius: 3 }}
                      />
                      <View style={styles.categoryBudgetStats}>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {formatCurrency(cat.spent, currency)}
                        </Text>
                        <Text variant="labelSmall" style={{ color: status.color }}>
                          {cat.percentage.toFixed(0)}%
                        </Text>
                      </View>
                    </View>

                    <Text
                      variant="bodySmall"
                      style={{
                        color: cat.remaining >= 0 ? theme.colors.onSurfaceVariant : brandColors.error,
                        marginBottom: 8,
                      }}
                    >
                      {cat.remaining >= 0
                        ? `Rimangono ${formatCurrency(cat.remaining, currency)}`
                        : `Sforato di ${formatCurrency(Math.abs(cat.remaining), currency)}`}
                    </Text>

                    <Button
                      mode="contained-tonal"
                      compact
                      icon="plus"
                      onPress={() => router.push(`/transaction/add?type=expense&category=${cat.id}`)}
                      style={{ borderRadius: 20 }}
                    >
                      Aggiungi spesa
                    </Button>
                  </Surface>
                );
              })}
            </ScrollView>
          </View>
        )}

        {/* Active Goals - Quick Add */}
        {activeGoals.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <View style={styles.goalsHeader}>
                <View style={styles.goalsTitleRow}>
                  <MaterialCommunityIcons
                    name="target"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text variant="titleMedium">I tuoi Obiettivi</Text>
                </View>
                <IconButton
                  icon="arrow-right"
                  size={20}
                  onPress={() => router.push('/goals')}
                />
              </View>

              {activeGoals.map((goal) => {
                const progress = goal.target_amount > 0
                  ? (goal.current_amount / goal.target_amount) * 100
                  : 0;
                const remaining = goal.target_amount - goal.current_amount;

                return (
                  <View key={goal.id} style={styles.goalItem}>
                    <View style={styles.goalInfo}>
                      <View style={[styles.goalIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                        <MaterialCommunityIcons
                          name={goal.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={24}
                          color={theme.colors.primary}
                        />
                      </View>
                      <View style={styles.goalDetails}>
                        <Text variant="titleSmall">{goal.name}</Text>
                        <ProgressBar
                          progress={Math.min(progress / 100, 1)}
                          color={theme.colors.primary}
                          style={styles.goalProgressBar}
                        />
                        <View style={styles.goalStats}>
                          <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                            {formatCurrency(goal.current_amount, currency)} / {formatCurrency(goal.target_amount, currency)}
                          </Text>
                          <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                            {progress.toFixed(0)}%
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.goalActions}>
                      {[10, 20, 50].map((amount) => (
                        <Pressable
                          key={amount}
                          style={[styles.quickAddButton, { backgroundColor: theme.colors.primaryContainer }]}
                          onPress={() => handleQuickAddToGoal(goal.id, amount)}
                          disabled={isAddingToGoal}
                        >
                          <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                            +{amount}€
                          </Text>
                        </Pressable>
                      ))}
                      <Pressable
                        style={[styles.quickAddButton, { backgroundColor: theme.colors.primary }]}
                        onPress={() => handleOpenGoalAdd(goal.id)}
                      >
                        <MaterialCommunityIcons name="plus" size={16} color={theme.colors.onPrimary} />
                      </Pressable>
                    </View>
                  </View>
                );
              })}

              {goals.filter((g) => !g.is_completed).length > 3 && (
                <Text
                  variant="bodySmall"
                  style={[styles.viewAll, { color: theme.colors.primary }]}
                  onPress={() => router.push('/goals')}
                >
                  Vedi tutti gli obiettivi ({goals.filter((g) => !g.is_completed).length})
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Insights Preview */}
        {insights.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <View style={styles.insightsHeader}>
                <View style={styles.insightsTitleRow}>
                  <MaterialCommunityIcons
                    name="lightbulb-on"
                    size={24}
                    color={brandColors.warning}
                  />
                  <Text variant="titleMedium">Insights</Text>
                  {unreadCount > 0 && (
                    <View style={[styles.badge, { backgroundColor: brandColors.error }]}>
                      <Text variant="labelSmall" style={{ color: '#FFF' }}>
                        {unreadCount}
                      </Text>
                    </View>
                  )}
                </View>
                <IconButton
                  icon="arrow-right"
                  size={20}
                  onPress={() => router.push('/insights')}
                />
              </View>

              {highPriorityInsights.length > 0 && (
                <View style={styles.alertBanner}>
                  <MaterialCommunityIcons
                    name="alert-circle"
                    size={18}
                    color={brandColors.error}
                  />
                  <Text variant="bodySmall" style={{ flex: 1, color: brandColors.error }}>
                    {highPriorityInsights.length} insight{highPriorityInsights.length > 1 ? 's' : ''} richied{highPriorityInsights.length > 1 ? 'ono' : 'e'} attenzione
                  </Text>
                </View>
              )}

              {previewInsights.map((insight, index) => (
                <View
                  key={insight.id}
                  style={[
                    styles.insightItem,
                    index < previewInsights.length - 1 && styles.insightItemBorder,
                  ]}
                >
                  <View
                    style={[
                      styles.insightPriority,
                      {
                        backgroundColor:
                          insight.priority === 'high'
                            ? brandColors.error
                            : insight.priority === 'medium'
                            ? brandColors.warning
                            : brandColors.success,
                      },
                    ]}
                  />
                  <Text
                    variant="bodyMedium"
                    numberOfLines={2}
                    style={styles.insightText}
                  >
                    {insight.message}
                  </Text>
                </View>
              ))}

              <Text
                variant="bodySmall"
                style={[styles.viewAll, { color: theme.colors.primary }]}
                onPress={() => router.push('/insights')}
              >
                Vedi tutti gli insights
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Top Categories */}
        {categoryStats.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitleCard}>
                Categorie principali
              </Text>

              {categoryStats.map((cat) => (
                <View key={cat.id} style={styles.categoryItem}>
                  <View style={styles.categoryLeft}>
                    <View style={[styles.categoryIcon, { backgroundColor: cat.color + '20' }]}>
                      <MaterialCommunityIcons
                        name={cat.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={20}
                        color={cat.color}
                      />
                    </View>
                    <Text variant="bodyMedium">{cat.name}</Text>
                  </View>
                  <Text variant="titleSmall">
                    {formatCurrency(cat.total, currency)}
                  </Text>
                </View>
              ))}

              {categories.length > 5 && (
                <Text
                  variant="bodySmall"
                  style={[styles.viewAll, { color: theme.colors.primary }]}
                  onPress={() => router.push('/stats')}
                >
                  Vedi tutte le categorie
                </Text>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Surface style={[styles.quickAction, { backgroundColor: theme.colors.primaryContainer }]} elevation={1}>
            <IconButton
              icon="plus"
              size={28}
              iconColor={theme.colors.primary}
              onPress={() => router.push('/transaction/add?type=expense')}
            />
            <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
              Spesa
            </Text>
          </Surface>

          <Surface style={[styles.quickAction, { backgroundColor: theme.colors.secondaryContainer }]} elevation={1}>
            <IconButton
              icon="plus"
              size={28}
              iconColor={theme.colors.secondary}
              onPress={() => router.push('/transaction/add?type=income')}
            />
            <Text variant="labelMedium" style={{ color: theme.colors.secondary }}>
              Entrata
            </Text>
          </Surface>

          <Surface style={[styles.quickAction, { backgroundColor: theme.colors.tertiaryContainer }]} elevation={1}>
            <IconButton
              icon="repeat"
              size={28}
              iconColor={theme.colors.tertiary}
              onPress={() => router.push('/recurring')}
            />
            <Text variant="labelMedium" style={{ color: theme.colors.tertiary }}>
              Ricorrenti
            </Text>
          </Surface>
        </View>
      </ScrollView>

      {/* Gradient FAB */}
      <View style={[styles.fabContainer, { bottom: spacing.md + insets.bottom }]}>
        <GradientFAB
          icon="plus"
          onPress={() => router.push('/transaction/add')}
          size="large"
        />
      </View>

      {/* Goal Add Modal */}
      <Portal>
        <Modal
          visible={showGoalAddModal}
          onDismiss={() => setShowGoalAddModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          {selectedGoal && (
            <>
              <View style={styles.modalHeader}>
                <View style={[styles.goalIcon, { backgroundColor: theme.colors.primaryContainer }]}>
                  <MaterialCommunityIcons
                    name={selectedGoal.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={28}
                    color={theme.colors.primary}
                  />
                </View>
                <Text variant="titleLarge" style={{ marginLeft: 12 }}>
                  {selectedGoal.name}
                </Text>
              </View>

              <View style={styles.goalModalProgress}>
                <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                  Progresso attuale: {formatCurrency(selectedGoal.current_amount, currency)} / {formatCurrency(selectedGoal.target_amount, currency)}
                </Text>
                <ProgressBar
                  progress={Math.min(selectedGoal.current_amount / selectedGoal.target_amount, 1)}
                  color={theme.colors.primary}
                  style={{ height: 8, borderRadius: 4, marginTop: 8 }}
                />
              </View>

              <TextInput
                mode="outlined"
                label="Importo da aggiungere"
                value={goalAddAmount}
                onChangeText={setGoalAddAmount}
                keyboardType="decimal-pad"
                placeholder="Es: 100"
                left={<TextInput.Icon icon="currency-eur" />}
                style={{ marginTop: 16 }}
              />

              <View style={styles.quickAmountRow}>
                {[20, 50, 100, 200].map((amount) => (
                  <Pressable
                    key={amount}
                    style={[styles.quickAmountButton, { borderColor: theme.colors.outline }]}
                    onPress={() => setGoalAddAmount(amount.toString())}
                  >
                    <Text variant="bodySmall">€{amount}</Text>
                  </Pressable>
                ))}
              </View>

              <View style={styles.modalActions}>
                <Button
                  mode="outlined"
                  onPress={() => setShowGoalAddModal(false)}
                  style={{ flex: 1, marginRight: 8 }}
                >
                  Annulla
                </Button>
                <Button
                  mode="contained"
                  onPress={handleConfirmGoalAdd}
                  loading={isAddingToGoal}
                  disabled={isAddingToGoal || !goalAddAmount}
                  style={{ flex: 1 }}
                >
                  Aggiungi
                </Button>
              </View>
            </>
          )}
        </Modal>
      </Portal>

      <Snackbar
        visible={snackbar.visible}
        onDismiss={() => setSnackbar({ ...snackbar, visible: false })}
        duration={2000}
      >
        {snackbar.message}
      </Snackbar>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  monthTitle: {
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
  balanceCard: {
    marginBottom: spacing.md,
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
  },
  balanceContent: {
    padding: spacing.lg,
  },
  balanceLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  balanceAmount: {
    fontWeight: 'bold',
    marginVertical: spacing.sm,
    color: '#FFFFFF',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  statIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  incomeIcon: {
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
  },
  expenseIcon: {
    backgroundColor: 'rgba(239, 83, 80, 0.2)',
  },
  statLabel: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  incomeAmount: {
    color: '#A5D6A7',
  },
  expenseAmount: {
    color: '#EF9A9A',
  },
  card: {
    marginBottom: spacing.md,
  },
  budgetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  budgetFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontWeight: '600',
  },
  sectionTitleCard: {
    marginBottom: spacing.md,
  },
  categoryBudgetScroll: {
    paddingVertical: spacing.xs,
    gap: spacing.sm,
  },
  categoryBudgetCard: {
    width: 180,
    padding: spacing.md,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginRight: spacing.sm,
  },
  categoryBudgetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  categoryBudgetIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryBudgetProgress: {
    marginBottom: spacing.xs,
  },
  categoryBudgetStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 4,
  },
  goalsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  goalsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  goalItem: {
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  goalInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  goalIcon: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  goalDetails: {
    flex: 1,
  },
  goalProgressBar: {
    height: 6,
    borderRadius: 3,
    marginVertical: 4,
  },
  goalStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalActions: {
    flexDirection: 'row',
    gap: spacing.xs,
    justifyContent: 'flex-end',
  },
  quickAddButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAll: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
  insightsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  insightsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: 'center',
  },
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    padding: spacing.sm,
    backgroundColor: brandColors.error + '15',
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  insightItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  insightPriority: {
    width: 4,
    height: 32,
    borderRadius: 2,
  },
  insightText: {
    flex: 1,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  quickAction: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: 12,
  },
  fabContainer: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  goalModalProgress: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
  },
  quickAmountRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 16,
  },
  quickAmountButton: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    marginTop: 20,
  },
});
