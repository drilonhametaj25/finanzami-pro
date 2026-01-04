import { useCallback, useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Dimensions, Pressable } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  SegmentedButtons,
  ProgressBar,
  IconButton,
  Switch,
  Button,
  Portal,
  Modal,
  Divider,
  Surface,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { PieChart, BarChart, LineChart } from 'react-native-chart-kit';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import {
  format,
  startOfMonth,
  endOfMonth,
  subMonths,
  startOfWeek,
  endOfWeek,
  eachMonthOfInterval,
  addMonths,
  addWeeks,
  differenceInDays,
} from 'date-fns';
import { it } from 'date-fns/locale';

import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import { useGoalStore } from '../../stores/goalStore';
import { spacing, borderRadius, brandColors } from '../../constants/theme';
import { formatCurrency, formatCompactCurrency } from '../../constants/currencies';

type Period = 'week' | 'month' | 'year';

interface Tip {
  id: string;
  icon: string;
  title: string;
  message: string;
  type: 'success' | 'warning' | 'info' | 'danger';
}

const screenWidth = Dimensions.get('window').width;

export default function StatsScreen() {
  const theme = useTheme();
  const { profile } = useAuthStore();
  const { transactions, fetchTransactions } = useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();
  const { goals, fetchGoals } = useGoalStore();

  const [period, setPeriod] = useState<Period>('month');
  const [refreshing, setRefreshing] = useState(false);
  const [compareMode, setCompareMode] = useState(false);
  const [currentOffset, setCurrentOffset] = useState(0);
  const [compareOffset, setCompareOffset] = useState(-1);
  const [showPeriodPicker, setShowPeriodPicker] = useState<'current' | 'compare' | null>(null);

  const currency = profile?.main_currency || 'EUR';
  const monthlyBudget = profile?.monthly_budget || 0;

  const getDateRange = (offset: number = 0) => {
    const now = new Date();
    switch (period) {
      case 'week': {
        const baseDate = offset === 0 ? now : addWeeks(now, offset);
        return {
          start: startOfWeek(baseDate, { weekStartsOn: 1 }),
          end: endOfWeek(baseDate, { weekStartsOn: 1 }),
        };
      }
      case 'month': {
        const baseDate = offset === 0 ? now : addMonths(now, offset);
        return { start: startOfMonth(baseDate), end: endOfMonth(baseDate) };
      }
      case 'year': {
        const baseDate = offset === 0 ? now : addMonths(now, offset * 12);
        return { start: subMonths(baseDate, 11), end: baseDate };
      }
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  };

  const getPeriodLabel = (offset: number) => {
    const range = getDateRange(offset);
    switch (period) {
      case 'week':
        return `${format(range.start, 'd MMM', { locale: it })} - ${format(range.end, 'd MMM', { locale: it })}`;
      case 'month':
        return format(range.start, 'MMMM yyyy', { locale: it });
      case 'year':
        return `${format(range.start, 'MMM yyyy', { locale: it })} - ${format(range.end, 'MMM yyyy', { locale: it })}`;
      default:
        return '';
    }
  };

  const loadData = useCallback(async () => {
    const { start: start1, end: end1 } = getDateRange(currentOffset);
    const { start: start2, end: end2 } = compareMode ? getDateRange(compareOffset) : { start: start1, end: end1 };

    const minStart = subMonths(new Date(), 12); // Load 12 months of data
    const maxEnd = new Date();

    await Promise.all([
      fetchTransactions({
        startDate: format(minStart, 'yyyy-MM-dd'),
        endDate: format(maxEnd, 'yyyy-MM-dd'),
      }),
      fetchCategories(),
      fetchGoals(),
    ]);
  }, [period, currentOffset, compareOffset, compareMode, fetchTransactions, fetchCategories, fetchGoals]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Calculate stats for a specific period
  const getStatsForPeriod = (offset: number) => {
    const { start, end } = getDateRange(offset);

    const periodTransactions = transactions.filter((t) => {
      const date = new Date(t.date);
      return date >= start && date <= end;
    });

    const expenses = periodTransactions.filter((t) => t.type === 'expense');
    const income = periodTransactions.filter((t) => t.type === 'income');

    const totalExpenses = expenses.reduce((sum, t) => sum + t.amount, 0);
    const totalIncome = income.reduce((sum, t) => sum + t.amount, 0);
    const balance = totalIncome - totalExpenses;
    const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

    const categoryStats = categories
      .filter((cat) => cat.is_active)
      .map((cat) => {
        const catExpenses = expenses.filter((t) => t.category_id === cat.id);
        const total = catExpenses.reduce((sum, t) => sum + t.amount, 0);
        const percentage = totalExpenses > 0 ? (total / totalExpenses) * 100 : 0;
        const budget = cat.budget || 0;
        const budgetPercentage = budget > 0 ? (total / budget) * 100 : 0;
        return { ...cat, total, percentage, budgetPercentage };
      })
      .filter((cat) => cat.total > 0)
      .sort((a, b) => b.total - a.total);

    // Daily average
    const daysInPeriod = Math.max(1, differenceInDays(end, start) + 1);
    const dailyAverage = totalExpenses / daysInPeriod;

    return {
      totalExpenses,
      totalIncome,
      balance,
      savingsRate,
      categoryStats,
      transactionCount: periodTransactions.length,
      expenseCount: expenses.length,
      incomeCount: income.length,
      dailyAverage,
      daysInPeriod,
    };
  };

  const currentStats = useMemo(() => getStatsForPeriod(currentOffset), [transactions, categories, currentOffset, period]);
  const compareStats = useMemo(() => compareMode ? getStatsForPeriod(compareOffset) : null, [transactions, categories, compareOffset, period, compareMode]);
  const previousPeriodStats = useMemo(() => getStatsForPeriod(currentOffset - 1), [transactions, categories, currentOffset, period]);

  // Generate personalized tips
  const tips = useMemo((): Tip[] => {
    const tipsList: Tip[] = [];

    // Savings rate tips
    if (currentStats.savingsRate >= 30) {
      tipsList.push({
        id: 'savings-excellent',
        icon: 'star',
        title: 'Ottimo lavoro!',
        message: `Stai risparmiando il ${currentStats.savingsRate.toFixed(0)}% delle tue entrate. Continua così!`,
        type: 'success',
      });
    } else if (currentStats.savingsRate >= 20) {
      tipsList.push({
        id: 'savings-good',
        icon: 'thumb-up',
        title: 'Buon risparmio',
        message: `Risparmi il ${currentStats.savingsRate.toFixed(0)}%. Per una maggiore sicurezza, prova a raggiungere il 30%.`,
        type: 'info',
      });
    } else if (currentStats.savingsRate > 0) {
      tipsList.push({
        id: 'savings-low',
        icon: 'alert',
        title: 'Risparmio basso',
        message: `Stai risparmiando solo il ${currentStats.savingsRate.toFixed(0)}%. L'obiettivo minimo consigliato è il 20%.`,
        type: 'warning',
      });
    } else if (currentStats.totalIncome > 0) {
      tipsList.push({
        id: 'savings-negative',
        icon: 'alert-circle',
        title: 'Spendi più di quanto guadagni',
        message: 'Stai spendendo più delle tue entrate. Rivedi le spese non essenziali.',
        type: 'danger',
      });
    }

    // Compare with previous period
    if (previousPeriodStats.totalExpenses > 0) {
      const expenseChange = ((currentStats.totalExpenses - previousPeriodStats.totalExpenses) / previousPeriodStats.totalExpenses) * 100;

      if (expenseChange > 20) {
        tipsList.push({
          id: 'expense-increase',
          icon: 'trending-up',
          title: 'Spese in aumento',
          message: `Hai speso ${expenseChange.toFixed(0)}% in più rispetto al periodo precedente. Verifica le categorie principali.`,
          type: 'warning',
        });
      } else if (expenseChange < -10) {
        tipsList.push({
          id: 'expense-decrease',
          icon: 'trending-down',
          title: 'Spese in calo',
          message: `Ottimo! Hai ridotto le spese del ${Math.abs(expenseChange).toFixed(0)}% rispetto al periodo precedente.`,
          type: 'success',
        });
      }
    }

    // Category budget alerts
    const overBudgetCategories = currentStats.categoryStats.filter((cat) => cat.budgetPercentage > 100);
    if (overBudgetCategories.length > 0) {
      tipsList.push({
        id: 'over-budget',
        icon: 'cash-remove',
        title: `${overBudgetCategories.length} categori${overBudgetCategories.length > 1 ? 'e' : 'a'} oltre budget`,
        message: `Hai sforato il budget in: ${overBudgetCategories.map((c) => c.name).join(', ')}`,
        type: 'danger',
      });
    }

    // Top spending category tip
    if (currentStats.categoryStats.length > 0) {
      const topCategory = currentStats.categoryStats[0];
      if (topCategory.percentage > 40) {
        tipsList.push({
          id: 'top-category',
          icon: 'chart-pie',
          title: 'Categoria dominante',
          message: `"${topCategory.name}" rappresenta il ${topCategory.percentage.toFixed(0)}% delle tue spese. Considera di diversificare.`,
          type: 'info',
        });
      }
    }

    // Daily average tip
    if (currentStats.dailyAverage > 0 && monthlyBudget > 0) {
      const recommendedDaily = monthlyBudget / 30;
      if (currentStats.dailyAverage > recommendedDaily * 1.2) {
        tipsList.push({
          id: 'daily-high',
          icon: 'calendar-alert',
          title: 'Media giornaliera alta',
          message: `Spendi in media ${formatCurrency(currentStats.dailyAverage, currency)}/giorno. Per rispettare il budget, dovresti stare sotto ${formatCurrency(recommendedDaily, currency)}/giorno.`,
          type: 'warning',
        });
      }
    }

    // Goals tip
    const activeGoals = goals.filter((g) => !g.is_completed);
    if (activeGoals.length > 0 && currentStats.savingsRate < 10) {
      tipsList.push({
        id: 'goals-at-risk',
        icon: 'target',
        title: 'Obiettivi a rischio',
        message: `Hai ${activeGoals.length} obiettivi attivi ma il tuo tasso di risparmio è basso. Aumenta i risparmi per raggiungerli.`,
        type: 'warning',
      });
    }

    // Income diversification
    if (currentStats.incomeCount === 1 && currentStats.totalIncome > 0) {
      tipsList.push({
        id: 'income-single',
        icon: 'source-branch',
        title: 'Entrata singola',
        message: 'Hai una sola fonte di entrate. Valuta di diversificare con attività extra o investimenti.',
        type: 'info',
      });
    }

    // Emergency fund reminder
    if (currentStats.savingsRate > 20 && activeGoals.every((g) => !g.name.toLowerCase().includes('emergenz'))) {
      tipsList.push({
        id: 'emergency-fund',
        icon: 'shield-check',
        title: 'Fondo emergenza',
        message: 'Stai risparmiando bene! Assicurati di avere un fondo emergenza pari a 3-6 mesi di spese.',
        type: 'info',
      });
    }

    return tipsList.slice(0, 5); // Max 5 tips
  }, [currentStats, previousPeriodStats, goals, monthlyBudget, currency]);

  // Pie chart data
  const pieData = currentStats.categoryStats.slice(0, 6).map((cat) => ({
    name: cat.name,
    amount: cat.total,
    color: cat.color,
    legendFontColor: theme.colors.onSurface,
    legendFontSize: 12,
  }));

  // Monthly trend data (last 6 months)
  const monthlyTrendData = useMemo(() => {
    const months = eachMonthOfInterval({
      start: subMonths(new Date(), 5),
      end: new Date(),
    });

    return months.map((month) => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);

      const monthExpenses = transactions
        .filter(
          (t) =>
            t.type === 'expense' &&
            new Date(t.date) >= monthStart &&
            new Date(t.date) <= monthEnd
        )
        .reduce((sum, t) => sum + t.amount, 0);

      const monthIncome = transactions
        .filter(
          (t) =>
            t.type === 'income' &&
            new Date(t.date) >= monthStart &&
            new Date(t.date) <= monthEnd
        )
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: format(month, 'MMM', { locale: it }),
        expenses: monthExpenses,
        income: monthIncome,
        balance: monthIncome - monthExpenses,
      };
    });
  }, [transactions]);

  const chartConfig = {
    backgroundColor: theme.colors.surface,
    backgroundGradientFrom: theme.colors.surface,
    backgroundGradientTo: theme.colors.surface,
    decimalPlaces: 0,
    color: (opacity = 1) => theme.colors.primary,
    labelColor: () => theme.colors.onSurfaceVariant,
    style: {
      borderRadius: 16,
    },
    propsForDots: {
      r: '4',
      strokeWidth: '2',
      stroke: theme.colors.primary,
    },
  };

  const getDiffPercentage = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? 100 : 0;
    return ((current - previous) / previous) * 100;
  };

  const renderComparisonValue = (current: number, compare: number | null, isExpense: boolean = false) => {
    if (!compare) return null;
    const diff = getDiffPercentage(current, compare);
    const isPositive = isExpense ? diff < 0 : diff > 0;
    const color = isPositive ? brandColors.success : brandColors.error;
    const icon = diff > 0 ? 'arrow-up' : 'arrow-down';

    return (
      <View style={styles.diffContainer}>
        <MaterialCommunityIcons name={icon} size={14} color={color} />
        <Text variant="bodySmall" style={{ color }}>
          {Math.abs(diff).toFixed(1)}%
        </Text>
      </View>
    );
  };

  const getTipColor = (type: Tip['type']) => {
    switch (type) {
      case 'success': return brandColors.success;
      case 'warning': return brandColors.warning;
      case 'danger': return brandColors.error;
      default: return theme.colors.primary;
    }
  };

  const getPeriodOptions = () => {
    const options = [];
    for (let i = 0; i >= -11; i--) {
      options.push({
        offset: i,
        label: getPeriodLabel(i),
      });
    }
    return options;
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Gradient Header */}
        <LinearGradient
          colors={[brandColors.gradientStart, brandColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons name="chart-arc" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                Statistiche
              </Text>
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                Analizza le tue finanze
              </Text>
            </View>
            <View style={styles.compareSwitchContainer}>
              <Text variant="bodySmall" style={styles.compareLabel}>
                Confronta
              </Text>
              <Switch
                value={compareMode}
                onValueChange={setCompareMode}
                color="#FFFFFF"
                trackColor={{ false: 'rgba(255,255,255,0.3)', true: 'rgba(255,255,255,0.5)' }}
              />
            </View>
          </View>
        </LinearGradient>

        {/* Period Selector */}
        <SegmentedButtons
          value={period}
          onValueChange={(value) => {
            setPeriod(value as Period);
            setCurrentOffset(0);
            setCompareOffset(-1);
          }}
          buttons={[
            { value: 'week', label: 'Settimana' },
            { value: 'month', label: 'Mese' },
            { value: 'year', label: 'Anno' },
          ]}
          style={styles.periodSelector}
        />

        {/* Period Navigation */}
        <Card style={styles.periodNav} mode="elevated">
          <Card.Content>
            <View style={styles.periodRow}>
              <View style={styles.periodControl}>
                <IconButton
                  icon="chevron-left"
                  size={20}
                  onPress={() => setCurrentOffset(currentOffset - 1)}
                />
                <Pressable
                  style={[styles.periodLabel, { backgroundColor: theme.colors.primaryContainer }]}
                  onPress={() => setShowPeriodPicker('current')}
                >
                  <Text variant="labelLarge" style={{ color: theme.colors.onPrimaryContainer }}>
                    {getPeriodLabel(currentOffset)}
                  </Text>
                </Pressable>
                <IconButton
                  icon="chevron-right"
                  size={20}
                  onPress={() => setCurrentOffset(currentOffset + 1)}
                  disabled={currentOffset >= 0}
                />
              </View>
            </View>

            {compareMode && (
              <>
                <Text variant="bodySmall" style={{ textAlign: 'center', marginVertical: 8, color: theme.colors.onSurfaceVariant }}>
                  vs
                </Text>
                <View style={styles.periodRow}>
                  <View style={styles.periodControl}>
                    <IconButton
                      icon="chevron-left"
                      size={20}
                      onPress={() => setCompareOffset(compareOffset - 1)}
                    />
                    <Pressable
                      style={[styles.periodLabel, { backgroundColor: theme.colors.secondaryContainer }]}
                      onPress={() => setShowPeriodPicker('compare')}
                    >
                      <Text variant="labelLarge" style={{ color: theme.colors.onSecondaryContainer }}>
                        {getPeriodLabel(compareOffset)}
                      </Text>
                    </Pressable>
                    <IconButton
                      icon="chevron-right"
                      size={20}
                      onPress={() => setCompareOffset(compareOffset + 1)}
                      disabled={compareOffset >= currentOffset - 1}
                    />
                  </View>
                </View>
              </>
            )}
          </Card.Content>
        </Card>

        {/* Income vs Expenses Comparison Card */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Entrate vs Uscite
            </Text>

            <View style={styles.incomeExpenseComparison}>
              {/* Income Bar */}
              <View style={styles.comparisonBar}>
                <View style={styles.comparisonBarHeader}>
                  <View style={styles.comparisonBarLabel}>
                    <MaterialCommunityIcons name="arrow-down-bold" size={18} color={brandColors.success} />
                    <Text variant="bodyMedium">Entrate</Text>
                  </View>
                  <Text variant="titleMedium" style={{ color: brandColors.success }}>
                    {formatCompactCurrency(currentStats.totalIncome, currency)}
                  </Text>
                </View>
                <View style={[styles.barContainer, { backgroundColor: brandColors.success + '20' }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: brandColors.success,
                        width: `${Math.min(100, (currentStats.totalIncome / Math.max(currentStats.totalIncome, currentStats.totalExpenses)) * 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Expenses Bar */}
              <View style={styles.comparisonBar}>
                <View style={styles.comparisonBarHeader}>
                  <View style={styles.comparisonBarLabel}>
                    <MaterialCommunityIcons name="arrow-up-bold" size={18} color={brandColors.error} />
                    <Text variant="bodyMedium">Uscite</Text>
                  </View>
                  <Text variant="titleMedium" style={{ color: brandColors.error }}>
                    {formatCompactCurrency(currentStats.totalExpenses, currency)}
                  </Text>
                </View>
                <View style={[styles.barContainer, { backgroundColor: brandColors.error + '20' }]}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        backgroundColor: brandColors.error,
                        width: `${Math.min(100, (currentStats.totalExpenses / Math.max(currentStats.totalIncome, currentStats.totalExpenses)) * 100)}%`,
                      },
                    ]}
                  />
                </View>
              </View>

              {/* Balance Result */}
              <View style={[styles.balanceResult, { backgroundColor: currentStats.balance >= 0 ? brandColors.success + '15' : brandColors.error + '15' }]}>
                <MaterialCommunityIcons
                  name={currentStats.balance >= 0 ? 'check-circle' : 'alert-circle'}
                  size={24}
                  color={currentStats.balance >= 0 ? brandColors.success : brandColors.error}
                />
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {currentStats.balance >= 0 ? 'Hai risparmiato' : 'Hai speso in più'}
                  </Text>
                  <Text variant="titleLarge" style={{ color: currentStats.balance >= 0 ? brandColors.success : brandColors.error }}>
                    {formatCurrency(Math.abs(currentStats.balance), currency)}
                  </Text>
                </View>
                <Text variant="titleLarge" style={{ color: currentStats.balance >= 0 ? brandColors.success : brandColors.error }}>
                  {currentStats.savingsRate.toFixed(0)}%
                </Text>
              </View>
            </View>

            {/* Compare with previous */}
            {!compareMode && previousPeriodStats.totalExpenses > 0 && (
              <View style={styles.previousComparison}>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Rispetto al periodo precedente:
                </Text>
                <View style={styles.previousStats}>
                  <View style={styles.previousStat}>
                    <Text variant="bodySmall">Entrate</Text>
                    {renderComparisonValue(currentStats.totalIncome, previousPeriodStats.totalIncome)}
                  </View>
                  <View style={styles.previousStat}>
                    <Text variant="bodySmall">Uscite</Text>
                    {renderComparisonValue(currentStats.totalExpenses, previousPeriodStats.totalExpenses, true)}
                  </View>
                </View>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Quick Stats with Gradient Border */}
        <View style={styles.quickStatsRow}>
          <LinearGradient
            colors={[brandColors.gradientStart, brandColors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickStatGradient}
          >
            <View style={[styles.quickStatCard, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.quickStatIconContainer, { backgroundColor: brandColors.primary + '15' }]}>
                <MaterialCommunityIcons name="receipt" size={20} color={brandColors.primary} />
              </View>
              <Text variant="titleLarge">{currentStats.transactionCount}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Transazioni</Text>
            </View>
          </LinearGradient>
          <LinearGradient
            colors={[brandColors.gradientStart, brandColors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickStatGradient}
          >
            <View style={[styles.quickStatCard, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.quickStatIconContainer, { backgroundColor: '#2196F3' + '15' }]}>
                <MaterialCommunityIcons name="calendar-today" size={20} color="#2196F3" />
              </View>
              <Text variant="titleLarge">{formatCompactCurrency(currentStats.dailyAverage, currency)}</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Media/giorno</Text>
            </View>
          </LinearGradient>
          <LinearGradient
            colors={[brandColors.gradientStart, brandColors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.quickStatGradient}
          >
            <View style={[styles.quickStatCard, { backgroundColor: theme.colors.surface }]}>
              <View style={[styles.quickStatIconContainer, { backgroundColor: brandColors.success + '15' }]}>
                <MaterialCommunityIcons name="piggy-bank" size={20} color={brandColors.success} />
              </View>
              <Text variant="titleLarge">{currentStats.savingsRate.toFixed(0)}%</Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>Risparmio</Text>
            </View>
          </LinearGradient>
        </View>

        {/* Tips Section with Gradient Header */}
        {tips.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <LinearGradient
              colors={[brandColors.warning, '#FF9800']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.tipsHeaderGradient}
            >
              <View style={styles.tipsHeaderIconContainer}>
                <MaterialCommunityIcons name="lightbulb-on" size={22} color="#FFFFFF" />
              </View>
              <Text variant="titleMedium" style={styles.tipsHeaderText}>Consigli Personalizzati</Text>
            </LinearGradient>
            <Card.Content style={{ paddingTop: spacing.md }}>

              {tips.map((tip, index) => (
                <View
                  key={tip.id}
                  style={[
                    styles.tipItem,
                    index < tips.length - 1 && styles.tipItemBorder,
                  ]}
                >
                  <View style={[styles.tipIcon, { backgroundColor: getTipColor(tip.type) + '20' }]}>
                    <MaterialCommunityIcons
                      name={tip.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={20}
                      color={getTipColor(tip.type)}
                    />
                  </View>
                  <View style={styles.tipContent}>
                    <Text variant="titleSmall" style={{ color: getTipColor(tip.type) }}>
                      {tip.title}
                    </Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                      {tip.message}
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Monthly Trend Chart */}
        {monthlyTrendData.length > 0 && !compareMode && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Andamento ultimi 6 mesi
              </Text>

              {/* Legend */}
              <View style={styles.chartLegend}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: brandColors.success }]} />
                  <Text variant="bodySmall">Entrate</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: brandColors.error }]} />
                  <Text variant="bodySmall">Uscite</Text>
                </View>
              </View>

              <BarChart
                data={{
                  labels: monthlyTrendData.map((d) => d.month),
                  datasets: [
                    {
                      data: monthlyTrendData.map((d) => d.income || 0),
                      color: () => brandColors.success,
                    },
                    {
                      data: monthlyTrendData.map((d) => d.expenses || 0),
                      color: () => brandColors.error,
                    },
                  ],
                }}
                width={screenWidth - spacing.md * 4}
                height={200}
                yAxisLabel=""
                yAxisSuffix=""
                chartConfig={{
                  ...chartConfig,
                  barPercentage: 0.4,
                }}
                fromZero
                showBarTops={false}
                style={styles.chart}
              />
            </Card.Content>
          </Card>
        )}

        {/* Category Comparison in Compare Mode */}
        {compareMode && compareStats && currentStats.categoryStats.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Confronto per categoria
              </Text>
              {currentStats.categoryStats.slice(0, 8).map((cat) => {
                const compareCat = compareStats.categoryStats.find((c) => c.id === cat.id);
                const compareAmount = compareCat?.total || 0;
                const diff = getDiffPercentage(cat.total, compareAmount);

                return (
                  <View key={cat.id} style={styles.categoryCompareRow}>
                    <View style={styles.categoryInfo}>
                      <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                      <Text variant="bodyMedium" style={styles.categoryName} numberOfLines={1}>
                        {cat.name}
                      </Text>
                    </View>
                    <View style={styles.categoryCompareValues}>
                      <Text variant="bodyMedium">
                        {formatCompactCurrency(cat.total, currency)}
                      </Text>
                      <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        vs {formatCompactCurrency(compareAmount, currency)}
                      </Text>
                      {compareAmount > 0 && (
                        <View style={styles.diffContainer}>
                          <MaterialCommunityIcons
                            name={diff < 0 ? 'arrow-down' : 'arrow-up'}
                            size={12}
                            color={diff < 0 ? brandColors.success : brandColors.error}
                          />
                          <Text
                            variant="labelSmall"
                            style={{ color: diff < 0 ? brandColors.success : brandColors.error }}
                          >
                            {Math.abs(diff).toFixed(0)}%
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* Pie Chart */}
        {!compareMode && pieData.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Distribuzione spese
              </Text>
              <PieChart
                data={pieData}
                width={screenWidth - spacing.md * 4}
                height={200}
                chartConfig={chartConfig}
                accessor="amount"
                backgroundColor="transparent"
                paddingLeft="0"
                absolute
              />
            </Card.Content>
          </Card>
        )}

        {/* Category List with Budget Progress */}
        {!compareMode && currentStats.categoryStats.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Dettaglio categorie
              </Text>
              {currentStats.categoryStats.map((cat) => (
                <View key={cat.id} style={styles.categoryRow}>
                  <View style={styles.categoryInfo}>
                    <View style={[styles.categoryDot, { backgroundColor: cat.color }]} />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium">{cat.name}</Text>
                      {cat.budget && cat.budget > 0 && (
                        <View style={{ marginTop: 4 }}>
                          <ProgressBar
                            progress={Math.min(cat.budgetPercentage / 100, 1)}
                            color={cat.budgetPercentage > 100 ? brandColors.error : cat.budgetPercentage > 80 ? brandColors.warning : brandColors.success}
                            style={{ height: 4, borderRadius: 2 }}
                          />
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.categoryStats}>
                    <Text variant="bodyMedium">
                      {formatCurrency(cat.total, currency)}
                    </Text>
                    <Text
                      variant="bodySmall"
                      style={{ color: theme.colors.onSurfaceVariant }}
                    >
                      {cat.percentage.toFixed(1)}%
                    </Text>
                  </View>
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Empty State */}
        {currentStats.transactionCount === 0 && !refreshing && (
          <View style={styles.emptyState}>
            <MaterialCommunityIcons name="chart-line" size={64} color={theme.colors.onSurfaceVariant} />
            <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: 16 }}>
              Nessun dato per questo periodo
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Period Picker Modal */}
      <Portal>
        <Modal
          visible={showPeriodPicker !== null}
          onDismiss={() => setShowPeriodPicker(null)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={{ marginBottom: 16 }}>
            Seleziona periodo
          </Text>
          <ScrollView style={{ maxHeight: 400 }}>
            {getPeriodOptions().map((option) => (
              <Pressable
                key={option.offset}
                style={[
                  styles.periodOption,
                  {
                    backgroundColor:
                      (showPeriodPicker === 'current' && option.offset === currentOffset) ||
                      (showPeriodPicker === 'compare' && option.offset === compareOffset)
                        ? theme.colors.primaryContainer
                        : 'transparent',
                  },
                ]}
                onPress={() => {
                  if (showPeriodPicker === 'current') {
                    setCurrentOffset(option.offset);
                  } else {
                    setCompareOffset(option.offset);
                  }
                  setShowPeriodPicker(null);
                }}
              >
                <Text variant="bodyLarge">{option.label}</Text>
              </Pressable>
            ))}
          </ScrollView>
          <Button mode="outlined" onPress={() => setShowPeriodPicker(null)} style={{ marginTop: 16 }}>
            Chiudi
          </Button>
        </Modal>
      </Portal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  // Gradient Header
  headerGradient: {
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
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
  compareSwitchContainer: {
    alignItems: 'center',
    gap: 4,
  },
  compareLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  periodSelector: {
    marginBottom: spacing.md,
  },
  periodNav: {
    marginBottom: spacing.md,
  },
  periodRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  periodControl: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  periodLabel: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    minWidth: 150,
    alignItems: 'center',
  },
  card: {
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  incomeExpenseComparison: {
    gap: 12,
  },
  comparisonBar: {
    gap: 8,
  },
  comparisonBarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  comparisonBarLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  barContainer: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  barFill: {
    height: '100%',
    borderRadius: 6,
  },
  balanceResult: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  previousComparison: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  previousStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 8,
  },
  previousStat: {
    alignItems: 'center',
    gap: 4,
  },
  quickStatsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  quickStatGradient: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: 2,
  },
  quickStatCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg - 2,
    alignItems: 'center',
    gap: 4,
  },
  quickStatIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  tipsHeaderGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderTopLeftRadius: borderRadius.lg - 1,
    borderTopRightRadius: borderRadius.lg - 1,
    gap: spacing.sm,
  },
  tipsHeaderIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsHeaderText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tipItem: {
    flexDirection: 'row',
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  tipItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  tipIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipContent: {
    flex: 1,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginBottom: spacing.sm,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  chart: {
    borderRadius: 16,
    marginVertical: spacing.sm,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryCompareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: spacing.sm,
  },
  categoryName: {
    flex: 1,
  },
  categoryStats: {
    alignItems: 'flex-end',
  },
  categoryCompareValues: {
    alignItems: 'flex-end',
  },
  diffContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  modal: {
    margin: 20,
    padding: 20,
    borderRadius: 16,
    maxHeight: '70%',
  },
  periodOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginBottom: 4,
  },
});
