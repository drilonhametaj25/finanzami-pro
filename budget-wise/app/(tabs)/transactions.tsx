import { useCallback, useEffect, useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable, Dimensions } from 'react-native';
import {
  Text,
  Searchbar,
  Chip,
  useTheme,
  ActivityIndicator,
  Surface,
  IconButton,
  Portal,
  Modal,
  Button,
  Divider,
  TextInput,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { format, parseISO, isToday, isYesterday, startOfMonth, endOfMonth, startOfWeek, endOfWeek, startOfYear, endOfYear, subMonths, addMonths, parse, isValid } from 'date-fns';
import { it } from 'date-fns/locale';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import { TransactionCard } from '../../components/transactions/TransactionCard';
import { spacing, borderRadius, brandColors, getContrastTextColor } from '../../constants/theme';
import { TransactionFilters } from '../../types';
import { Transaction } from '../../types/database';
import { formatCurrency } from '../../constants/currencies';

type FilterType = 'all' | 'expense' | 'income';
type PeriodType = 'week' | 'month' | 'year' | 'custom';

const screenWidth = Dimensions.get('window').width;

export default function TransactionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useAuthStore();
  const { transactions, fetchTransactions, loadMore, isLoading, hasMore } = useTransactionStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);
  const [showFiltersModal, setShowFiltersModal] = useState(false);

  // Custom date range
  const [customStartDate, setCustomStartDate] = useState(startOfMonth(new Date()));
  const [customEndDate, setCustomEndDate] = useState(endOfMonth(new Date()));
  const [startDateText, setStartDateText] = useState(format(startOfMonth(new Date()), 'dd/MM/yyyy'));
  const [endDateText, setEndDateText] = useState(format(endOfMonth(new Date()), 'dd/MM/yyyy'));

  const currency = profile?.main_currency || 'EUR';

  // Calculate date range based on selected period
  const dateRange = useMemo(() => {
    const now = new Date();
    switch (selectedPeriod) {
      case 'week':
        return { start: startOfWeek(now, { locale: it }), end: endOfWeek(now, { locale: it }) };
      case 'month':
        return { start: startOfMonth(now), end: endOfMonth(now) };
      case 'year':
        return { start: startOfYear(now), end: endOfYear(now) };
      case 'custom':
        return { start: customStartDate, end: customEndDate };
      default:
        return { start: startOfMonth(now), end: endOfMonth(now) };
    }
  }, [selectedPeriod, customStartDate, customEndDate]);

  const filters: TransactionFilters = {
    type: filterType,
    searchQuery: searchQuery || undefined,
    startDate: format(dateRange.start, 'yyyy-MM-dd'),
    endDate: format(dateRange.end, 'yyyy-MM-dd'),
    categoryId: selectedCategory || undefined,
  };

  const loadData = useCallback(async () => {
    await Promise.all([fetchTransactions(filters), fetchCategories()]);
  }, [fetchTransactions, fetchCategories, filterType, searchQuery, dateRange, selectedCategory]);

  useEffect(() => {
    loadData();
  }, [filterType, selectedPeriod, selectedCategory, customStartDate, customEndDate]);

  useEffect(() => {
    const debounce = setTimeout(() => {
      fetchTransactions(filters);
    }, 500);
    return () => clearTimeout(debounce);
  }, [searchQuery]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  // Calculate summary stats
  const summaryStats = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
    const expenses = transactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
    return { income, expenses, balance: income - expenses };
  }, [transactions]);

  // Category breakdown
  const categoryBreakdown = useMemo(() => {
    const breakdown: Record<string, { amount: number; color: string; name: string; icon: string }> = {};

    transactions
      .filter((t) => t.type === 'expense')
      .forEach((t) => {
        const category = categories.find((c) => c.id === t.category_id);
        if (category) {
          if (!breakdown[category.id]) {
            breakdown[category.id] = { amount: 0, color: category.color, name: category.name, icon: category.icon };
          }
          breakdown[category.id].amount += t.amount;
        }
      });

    return Object.values(breakdown)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, categories]);

  const totalExpenses = summaryStats.expenses;

  // Group transactions by date
  const groupedTransactions = transactions.reduce((groups, transaction) => {
    const date = transaction.date;
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(transaction);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const sections = Object.entries(groupedTransactions)
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([date, items]) => ({
      date,
      data: items,
    }));

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    if (isToday(date)) return 'Oggi';
    if (isYesterday(date)) return 'Ieri';
    return format(date, 'EEEE d MMMM', { locale: it });
  };

  const getPeriodLabel = () => {
    switch (selectedPeriod) {
      case 'week': return 'Questa settimana';
      case 'month': return format(dateRange.start, 'MMMM yyyy', { locale: it });
      case 'year': return format(dateRange.start, 'yyyy');
      case 'custom': return `${format(dateRange.start, 'd MMM', { locale: it })} - ${format(dateRange.end, 'd MMM yyyy', { locale: it })}`;
      default: return 'Questo mese';
    }
  };

  const parseDate = (text: string): Date | null => {
    // Try to parse dd/MM/yyyy format
    const parsed = parse(text, 'dd/MM/yyyy', new Date());
    if (isValid(parsed)) {
      return parsed;
    }
    return null;
  };

  const handleStartDateBlur = () => {
    const parsed = parseDate(startDateText);
    if (parsed) {
      setCustomStartDate(parsed);
      setStartDateText(format(parsed, 'dd/MM/yyyy'));
      if (selectedPeriod !== 'custom') {
        setSelectedPeriod('custom');
      }
    } else {
      // Reset to current value if invalid
      setStartDateText(format(customStartDate, 'dd/MM/yyyy'));
    }
  };

  const handleEndDateBlur = () => {
    const parsed = parseDate(endDateText);
    if (parsed) {
      setCustomEndDate(parsed);
      setEndDateText(format(parsed, 'dd/MM/yyyy'));
      if (selectedPeriod !== 'custom') {
        setSelectedPeriod('custom');
      }
    } else {
      // Reset to current value if invalid
      setEndDateText(format(customEndDate, 'dd/MM/yyyy'));
    }
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setFilterType('all');
    setSelectedPeriod('month');
    setSearchQuery('');
    const newStart = startOfMonth(new Date());
    const newEnd = endOfMonth(new Date());
    setCustomStartDate(newStart);
    setCustomEndDate(newEnd);
    setStartDateText(format(newStart, 'dd/MM/yyyy'));
    setEndDateText(format(newEnd, 'dd/MM/yyyy'));
  };

  const activeFiltersCount = [
    filterType !== 'all',
    selectedCategory !== null,
    selectedPeriod !== 'month',
  ].filter(Boolean).length;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="swap-horizontal" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text variant="headlineSmall" style={styles.headerTitle}>Movimenti</Text>
            <Pressable
              style={styles.periodBadgeGradient}
              onPress={() => setShowFiltersModal(true)}
            >
              <MaterialCommunityIcons name="calendar" size={14} color="#FFFFFF" />
              <Text variant="labelSmall" style={styles.periodBadgeText}>
                {getPeriodLabel()}
              </Text>
            </Pressable>
          </View>
          <Pressable
            onPress={() => setShowFiltersModal(true)}
            style={styles.filterButtonGradient}
          >
            <MaterialCommunityIcons name="tune-variant" size={22} color="#FFFFFF" />
          </Pressable>
        </View>
      </LinearGradient>

      {/* Fixed Search & Filters */}
      <View style={[styles.fixedHeader, { backgroundColor: theme.colors.background, borderBottomColor: theme.colors.outlineVariant }]}>
        {/* Search */}
        <Searchbar
          placeholder="Cerca transazioni..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchbar}
          inputStyle={styles.searchbarInput}
          elevation={0}
        />

        {/* Quick Type Filters */}
        <View style={styles.typeFilters}>
          <Chip
            selected={filterType === 'all'}
            onPress={() => setFilterType('all')}
            style={styles.typeChip}
            compact
          >
            Tutti
          </Chip>
          <Chip
            selected={filterType === 'expense'}
            onPress={() => setFilterType('expense')}
            style={styles.typeChip}
            selectedColor={brandColors.error}
            compact
          >
            Uscite
          </Chip>
          <Chip
            selected={filterType === 'income'}
            onPress={() => setFilterType('income')}
            style={styles.typeChip}
            selectedColor={brandColors.success}
            compact
          >
            Entrate
          </Chip>
          {selectedCategory && (
            <Chip
              icon="close"
              onPress={() => setSelectedCategory(null)}
              style={styles.typeChip}
              compact
            >
              {categories.find((c) => c.id === selectedCategory)?.name || 'Categoria'}
            </Chip>
          )}
        </View>
      </View>

      {/* Scrollable Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        showsVerticalScrollIndicator={false}
      >
        {/* Summary Cards with Gradient Borders */}
        <View style={styles.summarySection}>
          <View style={styles.summaryRow}>
            <LinearGradient
              colors={[brandColors.success, '#4CAF50']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                <View style={[styles.statIconContainer, { backgroundColor: brandColors.success + '15' }]}>
                  <MaterialCommunityIcons name="arrow-down-circle" size={18} color={brandColors.success} />
                </View>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Entrate</Text>
                <Text variant="titleSmall" style={{ color: brandColors.success, fontWeight: 'bold' }}>
                  {formatCurrency(summaryStats.income, currency)}
                </Text>
              </View>
            </LinearGradient>
            <LinearGradient
              colors={[brandColors.error, '#EF5350']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                <View style={[styles.statIconContainer, { backgroundColor: brandColors.error + '15' }]}>
                  <MaterialCommunityIcons name="arrow-up-circle" size={18} color={brandColors.error} />
                </View>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Uscite</Text>
                <Text variant="titleSmall" style={{ color: brandColors.error, fontWeight: 'bold' }}>
                  {formatCurrency(summaryStats.expenses, currency)}
                </Text>
              </View>
            </LinearGradient>
            <LinearGradient
              colors={summaryStats.balance >= 0 ? [brandColors.gradientStart, brandColors.gradientEnd] : [brandColors.warning, '#FF9800']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.statCardGradient}
            >
              <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
                <View style={[styles.statIconContainer, { backgroundColor: summaryStats.balance >= 0 ? brandColors.primary + '15' : brandColors.warning + '15' }]}>
                  <MaterialCommunityIcons
                    name={summaryStats.balance >= 0 ? 'trending-up' : 'trending-down'}
                    size={18}
                    color={summaryStats.balance >= 0 ? brandColors.primary : brandColors.warning}
                  />
                </View>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>Bilancio</Text>
                <Text variant="titleSmall" style={{ color: summaryStats.balance >= 0 ? brandColors.primary : brandColors.warning, fontWeight: 'bold' }}>
                  {summaryStats.balance >= 0 ? '+' : ''}{formatCurrency(summaryStats.balance, currency)}
                </Text>
              </View>
            </LinearGradient>
          </View>
        </View>

        {/* Category Breakdown */}
        {categoryBreakdown.length > 0 && (
          <View style={styles.breakdownSection}>
            <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
              Spese per categoria
            </Text>
            <Surface style={styles.breakdownCard} elevation={1}>
              {categoryBreakdown.map((item, index) => {
                const percentage = totalExpenses > 0 ? (item.amount / totalExpenses) * 100 : 0;
                return (
                  <View key={index}>
                    <View style={styles.breakdownItem}>
                      <View style={styles.breakdownLeft}>
                        <View style={[styles.categoryIcon, { backgroundColor: item.color + '20' }]}>
                          <MaterialCommunityIcons
                            name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                            size={16}
                            color={item.color}
                          />
                        </View>
                        <Text variant="bodyMedium" style={{ flex: 1 }} numberOfLines={1}>
                          {item.name}
                        </Text>
                      </View>
                      <View style={styles.breakdownRight}>
                        <Text variant="bodyMedium" style={{ fontWeight: '600' }}>
                          {formatCurrency(item.amount, currency)}
                        </Text>
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          {percentage.toFixed(0)}%
                        </Text>
                      </View>
                    </View>
                    <View style={styles.progressBarContainer}>
                      <View style={[styles.progressBarBg, { backgroundColor: theme.colors.surfaceVariant }]}>
                        <View
                          style={[styles.progressBarFill, { backgroundColor: item.color, width: `${percentage}%` }]}
                        />
                      </View>
                    </View>
                    {index < categoryBreakdown.length - 1 && <Divider style={{ marginVertical: spacing.sm }} />}
                  </View>
                );
              })}
            </Surface>
          </View>
        )}

        {/* Transactions List */}
        <View style={styles.transactionsSection}>
          <Text variant="titleSmall" style={[styles.sectionTitle, { color: theme.colors.onSurfaceVariant }]}>
            Transazioni ({transactions.length})
          </Text>

          {isLoading && transactions.length === 0 ? (
            <View style={styles.loadingState}>
              <ActivityIndicator size="large" />
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialCommunityIcons name="receipt" size={48} color={theme.colors.onSurfaceVariant} />
              <Text variant="bodyLarge" style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.md }}>
                Nessuna transazione trovata
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}>
                {filterType !== 'all' || searchQuery || selectedCategory
                  ? 'Prova a modificare i filtri'
                  : 'Inizia ad aggiungere le tue transazioni'}
              </Text>
            </View>
          ) : (
            sections.map((section) => (
              <View key={section.date}>
                <View style={styles.dateHeader}>
                  <Text variant="labelMedium" style={[styles.dateLabel, { color: theme.colors.onSurfaceVariant }]}>
                    {getDateLabel(section.date)}
                  </Text>
                </View>
                {section.data.map((transaction) => {
                  const category = categories.find((c) => c.id === transaction.category_id);
                  return (
                    <TransactionCard
                      key={transaction.id}
                      transaction={transaction}
                      category={category}
                      currency={currency}
                      onPress={() => router.push(`/transaction/${transaction.id}`)}
                    />
                  );
                })}
              </View>
            ))
          )}

          {isLoading && transactions.length > 0 && (
            <View style={styles.loadingMore}>
              <ActivityIndicator size="small" />
            </View>
          )}
        </View>

        {/* Bottom spacing for FAB */}
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Gradient FAB */}
      <Pressable
        onPress={() => router.push('/transaction/add')}
        style={({ pressed }) => [
          styles.fabPressable,
          pressed && styles.fabPressed,
        ]}
      >
        <LinearGradient
          colors={[brandColors.gradientStart, brandColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.fabGradient}
        >
          <MaterialCommunityIcons name="plus" size={24} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>

      {/* Filters Modal */}
      <Portal>
        <Modal
          visible={showFiltersModal}
          onDismiss={() => setShowFiltersModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <View style={styles.modalHeader}>
            <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>Filtri</Text>
            <IconButton icon="close" size={24} onPress={() => setShowFiltersModal(false)} />
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* Period Filter */}
            <Text variant="titleSmall" style={styles.filterLabel}>Periodo</Text>
            <View style={styles.periodOptions}>
              {(['week', 'month', 'year', 'custom'] as PeriodType[]).map((period) => (
                <Chip
                  key={period}
                  selected={selectedPeriod === period}
                  onPress={() => setSelectedPeriod(period)}
                  style={styles.periodChip}
                >
                  {period === 'week' ? 'Settimana' : period === 'month' ? 'Mese' : period === 'year' ? 'Anno' : 'Personalizzato'}
                </Chip>
              ))}
            </View>

            {/* Custom Date Range */}
            {selectedPeriod === 'custom' && (
              <View style={styles.dateRangeContainer}>
                <View style={styles.dateInputWrapper}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>Da</Text>
                  <TextInput
                    mode="outlined"
                    value={startDateText}
                    onChangeText={setStartDateText}
                    onBlur={handleStartDateBlur}
                    placeholder="gg/mm/aaaa"
                    style={styles.dateInput}
                    dense
                    left={<TextInput.Icon icon="calendar-start" size={18} />}
                  />
                </View>
                <MaterialCommunityIcons name="arrow-right" size={20} color={theme.colors.onSurfaceVariant} style={{ marginTop: 20 }} />
                <View style={styles.dateInputWrapper}>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginBottom: 4 }}>A</Text>
                  <TextInput
                    mode="outlined"
                    value={endDateText}
                    onChangeText={setEndDateText}
                    onBlur={handleEndDateBlur}
                    placeholder="gg/mm/aaaa"
                    style={styles.dateInput}
                    dense
                    left={<TextInput.Icon icon="calendar-end" size={18} />}
                  />
                </View>
              </View>
            )}

            <Divider style={{ marginVertical: spacing.md }} />

            {/* Category Filter */}
            <Text variant="titleSmall" style={styles.filterLabel}>Categoria</Text>
            <View style={styles.categoryOptions}>
              <Chip
                selected={selectedCategory === null}
                onPress={() => setSelectedCategory(null)}
                style={styles.categoryChip}
              >
                Tutte
              </Chip>
              {categories.filter((c) => c.is_active).map((cat) => {
                const isSelected = selectedCategory === cat.id;
                const textColor = isSelected ? getContrastTextColor(cat.color) : theme.colors.onSurface;
                return (
                  <Chip
                    key={cat.id}
                    selected={isSelected}
                    onPress={() => setSelectedCategory(cat.id)}
                    style={[
                      styles.categoryChip,
                      isSelected && { backgroundColor: cat.color },
                    ]}
                    textStyle={{ color: textColor }}
                    icon={() => (
                      <MaterialCommunityIcons
                        name={cat.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={16}
                        color={isSelected ? textColor : cat.color}
                      />
                    )}
                  >
                    {cat.name}
                  </Chip>
                );
              })}
            </View>
          </ScrollView>

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={resetFilters} style={{ flex: 1 }}>
              Reset
            </Button>
            <Button mode="contained" onPress={() => setShowFiltersModal(false)} style={{ flex: 1 }}>
              Applica
            </Button>
          </View>
        </Modal>
      </Portal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // Gradient Header
  headerGradient: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
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
  periodBadgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  periodBadgeText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  filterButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fixedHeader: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: 1,
  },
  searchbar: {
    marginBottom: spacing.sm,
    borderRadius: 12,
    height: 44,
  },
  searchbarInput: {
    minHeight: 44,
  },
  typeFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  typeChip: {
    height: 32,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
  },
  summarySection: {
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statCardGradient: {
    flex: 1,
    borderRadius: borderRadius.lg,
    padding: 2,
  },
  statCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.lg - 2,
    alignItems: 'center',
    gap: 2,
  },
  statIconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
  },
  breakdownSection: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: 11,
    letterSpacing: 0.5,
  },
  breakdownCard: {
    padding: spacing.md,
    borderRadius: 12,
  },
  breakdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  breakdownLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: spacing.sm,
  },
  breakdownRight: {
    alignItems: 'flex-end',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBarContainer: {
    marginTop: spacing.xs,
  },
  progressBarBg: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  transactionsSection: {
    flex: 1,
  },
  dateHeader: {
    paddingVertical: spacing.sm,
    marginTop: spacing.sm,
  },
  dateLabel: {
    fontWeight: '600',
    textTransform: 'capitalize',
  },
  loadingState: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  loadingMore: {
    paddingVertical: spacing.lg,
    alignItems: 'center',
  },
  emptyState: {
    paddingVertical: spacing.xxl,
    alignItems: 'center',
  },
  fabPressable: {
    position: 'absolute',
    right: spacing.md,
    bottom: spacing.md,
    borderRadius: 28,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.27,
    shadowRadius: 4.65,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.95 }],
  },
  fabGradient: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  filterLabel: {
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  periodOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  periodChip: {
    marginBottom: spacing.xs,
  },
  dateRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  dateInputWrapper: {
    flex: 1,
  },
  dateInput: {
    fontSize: 14,
  },
  categoryOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  categoryChip: {
    marginBottom: spacing.xs,
  },
  modalActions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
});
