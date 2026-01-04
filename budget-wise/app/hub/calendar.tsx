import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import { Text, Card, useTheme, Surface, Chip, Divider, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import {
  format,
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  isSameDay,
  addMonths,
  subMonths,
  getDay,
  parseISO,
  isToday,
} from 'date-fns';
import { it } from 'date-fns/locale';

import { useTransactionStore } from '../../stores/transactionStore';
import { useRecurringStore } from '../../stores/recurringStore';
import { RecurringTransaction } from '../../types/database';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { useAuthStore } from '../../stores/authStore';
import { spacing, brandColors } from '../../constants/theme';
import { formatCurrency } from '../../constants/currencies';

const WEEKDAYS = ['Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab', 'Dom'];

interface DayData {
  date: Date;
  income: number;
  expenses: number;
  recurring: { name: string; amount: number; type: 'expense' | 'income' }[];
  subscriptions: { name: string; amount: number }[];
  transactions: { description: string; amount: number; type: 'expense' | 'income' }[];
}

export default function CalendarScreen() {
  const theme = useTheme();
  const { profile } = useAuthStore();
  const { transactions } = useTransactionStore();
  const { recurringTransactions } = useRecurringStore();
  const { subscriptions } = useSubscriptionStore();

  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const currency = profile?.main_currency || 'EUR';

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate padding days for the calendar grid
  const startDayOfWeek = getDay(monthStart);
  const paddingDays = startDayOfWeek === 0 ? 6 : startDayOfWeek - 1;

  // Build calendar data
  const calendarData = useMemo(() => {
    const data: Map<string, DayData> = new Map();

    daysInMonth.forEach((day) => {
      const dateKey = format(day, 'yyyy-MM-dd');
      data.set(dateKey, {
        date: day,
        income: 0,
        expenses: 0,
        recurring: [],
        subscriptions: [],
        transactions: [],
      });
    });

    // Add transactions
    transactions.forEach((t) => {
      const dateKey = t.date;
      if (data.has(dateKey)) {
        const dayData = data.get(dateKey)!;
        if (t.type === 'income') {
          dayData.income += t.amount;
        } else {
          dayData.expenses += t.amount;
        }
        dayData.transactions.push({
          description: t.description || 'Transazione',
          amount: t.amount,
          type: t.type,
        });
      }
    });

    // Add recurring expenses (projected)
    recurringTransactions.forEach((r: RecurringTransaction) => {
      if (!r.is_active) return;
      const dayOfMonth = parseInt(r.next_date.split('-')[2], 10);
      const dateKey = format(new Date(currentMonth.getFullYear(), currentMonth.getMonth(), dayOfMonth), 'yyyy-MM-dd');

      if (data.has(dateKey)) {
        const dayData = data.get(dateKey)!;
        // Recurring transactions are expenses by default
        dayData.recurring.push({
          name: r.description || 'Spesa ricorrente',
          amount: r.amount,
          type: 'expense',
        });
        dayData.expenses += r.amount;
      }
    });

    // Add subscriptions (projected renewals)
    subscriptions.forEach((s) => {
      if (!s.isActive) return;
      const renewalDate = parseISO(s.nextBillingDate);
      if (renewalDate >= monthStart && renewalDate <= monthEnd) {
        const dateKey = format(renewalDate, 'yyyy-MM-dd');
        if (data.has(dateKey)) {
          const dayData = data.get(dateKey)!;
          dayData.subscriptions.push({
            name: s.name,
            amount: s.amount,
          });
          dayData.expenses += s.amount;
        }
      }
    });

    return data;
  }, [transactions, recurringTransactions, subscriptions, currentMonth, daysInMonth, monthStart, monthEnd]);

  // Monthly totals
  const monthlyTotals = useMemo(() => {
    let income = 0;
    let expenses = 0;

    calendarData.forEach((day) => {
      income += day.income;
      expenses += day.expenses;
    });

    return { income, expenses, balance: income - expenses };
  }, [calendarData]);

  const selectedDayData = selectedDate
    ? calendarData.get(format(selectedDate, 'yyyy-MM-dd'))
    : null;

  const getDayColor = (day: DayData) => {
    const net = day.income - day.expenses;
    if (net > 0) return brandColors.success;
    if (net < 0) return brandColors.error;
    return 'transparent';
  };

  const getDayIntensity = (day: DayData) => {
    const total = day.income + day.expenses;
    if (total === 0) return 0;
    if (total < 50) return 0.3;
    if (total < 200) return 0.5;
    if (total < 500) return 0.7;
    return 1;
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Month Summary */}
        <Card style={styles.summaryCard} mode="elevated">
          <Card.Content>
            <View style={styles.monthNav}>
              <IconButton
                icon="chevron-left"
                onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}
              />
              <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
                {format(currentMonth, 'MMMM yyyy', { locale: it })}
              </Text>
              <IconButton
                icon="chevron-right"
                onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}
              />
            </View>

            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="arrow-down" size={20} color={brandColors.success} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Entrate
                </Text>
                <Text variant="titleMedium" style={{ color: brandColors.success, fontWeight: 'bold' }}>
                  {formatCurrency(monthlyTotals.income, currency)}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <MaterialCommunityIcons name="arrow-up" size={20} color={brandColors.error} />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Uscite
                </Text>
                <Text variant="titleMedium" style={{ color: brandColors.error, fontWeight: 'bold' }}>
                  {formatCurrency(monthlyTotals.expenses, currency)}
                </Text>
              </View>

              <View style={styles.summaryItem}>
                <MaterialCommunityIcons
                  name={monthlyTotals.balance >= 0 ? 'trending-up' : 'trending-down'}
                  size={20}
                  color={monthlyTotals.balance >= 0 ? brandColors.success : brandColors.error}
                />
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Bilancio
                </Text>
                <Text
                  variant="titleMedium"
                  style={{
                    color: monthlyTotals.balance >= 0 ? brandColors.success : brandColors.error,
                    fontWeight: 'bold',
                  }}
                >
                  {formatCurrency(monthlyTotals.balance, currency)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Calendar Grid */}
        <Card style={styles.calendarCard} mode="elevated">
          <Card.Content>
            {/* Weekday Headers */}
            <View style={styles.weekdayRow}>
              {WEEKDAYS.map((day) => (
                <Text
                  key={day}
                  variant="labelSmall"
                  style={[styles.weekdayLabel, { color: theme.colors.onSurfaceVariant }]}
                >
                  {day}
                </Text>
              ))}
            </View>

            {/* Calendar Days */}
            <View style={styles.daysGrid}>
              {/* Padding cells */}
              {Array.from({ length: paddingDays }).map((_, i) => (
                <View key={`pad-${i}`} style={styles.dayCell} />
              ))}

              {/* Actual days */}
              {daysInMonth.map((day) => {
                const dateKey = format(day, 'yyyy-MM-dd');
                const dayData = calendarData.get(dateKey);
                const isSelected = selectedDate && isSameDay(day, selectedDate);
                const hasActivity = dayData && (dayData.income > 0 || dayData.expenses > 0);
                const dayColor = dayData ? getDayColor(dayData) : 'transparent';
                const intensity = dayData ? getDayIntensity(dayData) : 0;

                return (
                  <Pressable
                    key={dateKey}
                    style={[
                      styles.dayCell,
                      isSelected && { backgroundColor: theme.colors.primaryContainer },
                      isToday(day) && styles.todayCell,
                    ]}
                    onPress={() => setSelectedDate(day)}
                  >
                    <Text
                      variant="bodyMedium"
                      style={[
                        styles.dayNumber,
                        isToday(day) && { color: theme.colors.primary, fontWeight: 'bold' },
                        isSelected && { color: theme.colors.onPrimaryContainer },
                      ]}
                    >
                      {format(day, 'd')}
                    </Text>
                    {hasActivity && (
                      <View
                        style={[
                          styles.dayIndicator,
                          {
                            backgroundColor: dayColor,
                            opacity: intensity,
                          },
                        ]}
                      />
                    )}
                  </Pressable>
                );
              })}
            </View>

            {/* Legend */}
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: brandColors.success }]} />
                <Text variant="labelSmall">Positivo</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: brandColors.error }]} />
                <Text variant="labelSmall">Negativo</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Selected Day Details */}
        {selectedDayData && (
          <Card style={styles.detailCard} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={{ fontWeight: 'bold', marginBottom: spacing.md }}>
                {format(selectedDayData.date, "EEEE d MMMM", { locale: it })}
              </Text>

              {/* Daily Summary */}
              <View style={styles.dailySummary}>
                <Chip
                  icon="arrow-down"
                  style={{ backgroundColor: brandColors.success + '20' }}
                  textStyle={{ color: brandColors.success }}
                >
                  +{formatCurrency(selectedDayData.income, currency)}
                </Chip>
                <Chip
                  icon="arrow-up"
                  style={{ backgroundColor: brandColors.error + '20' }}
                  textStyle={{ color: brandColors.error }}
                >
                  -{formatCurrency(selectedDayData.expenses, currency)}
                </Chip>
              </View>

              <Divider style={{ marginVertical: spacing.md }} />

              {/* Transactions */}
              {selectedDayData.transactions.length > 0 && (
                <View style={styles.detailSection}>
                  <Text variant="labelLarge" style={{ marginBottom: spacing.sm }}>
                    Transazioni
                  </Text>
                  {selectedDayData.transactions.map((t, i) => (
                    <View key={i} style={styles.detailItem}>
                      <MaterialCommunityIcons
                        name={t.type === 'income' ? 'arrow-down-circle' : 'arrow-up-circle'}
                        size={20}
                        color={t.type === 'income' ? brandColors.success : brandColors.error}
                      />
                      <Text variant="bodyMedium" style={{ flex: 1, marginLeft: 8 }}>
                        {t.description}
                      </Text>
                      <Text
                        variant="bodyMedium"
                        style={{
                          color: t.type === 'income' ? brandColors.success : brandColors.error,
                          fontWeight: '500',
                        }}
                      >
                        {t.type === 'income' ? '+' : '-'}{formatCurrency(t.amount, currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Recurring */}
              {selectedDayData.recurring.length > 0 && (
                <View style={styles.detailSection}>
                  <Text variant="labelLarge" style={{ marginBottom: spacing.sm }}>
                    Spese Ricorrenti
                  </Text>
                  {selectedDayData.recurring.map((r, i) => (
                    <View key={i} style={styles.detailItem}>
                      <MaterialCommunityIcons
                        name="refresh"
                        size={20}
                        color={theme.colors.primary}
                      />
                      <Text variant="bodyMedium" style={{ flex: 1, marginLeft: 8 }}>
                        {r.name}
                      </Text>
                      <Text
                        variant="bodyMedium"
                        style={{
                          color: r.type === 'income' ? brandColors.success : brandColors.error,
                          fontWeight: '500',
                        }}
                      >
                        {r.type === 'income' ? '+' : '-'}{formatCurrency(r.amount, currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Subscriptions */}
              {selectedDayData.subscriptions.length > 0 && (
                <View style={styles.detailSection}>
                  <Text variant="labelLarge" style={{ marginBottom: spacing.sm }}>
                    Rinnovi Abbonamenti
                  </Text>
                  {selectedDayData.subscriptions.map((s, i) => (
                    <View key={i} style={styles.detailItem}>
                      <MaterialCommunityIcons
                        name="calendar-sync"
                        size={20}
                        color="#E91E63"
                      />
                      <Text variant="bodyMedium" style={{ flex: 1, marginLeft: 8 }}>
                        {s.name}
                      </Text>
                      <Text
                        variant="bodyMedium"
                        style={{ color: brandColors.error, fontWeight: '500' }}
                      >
                        -{formatCurrency(s.amount, currency)}
                      </Text>
                    </View>
                  ))}
                </View>
              )}

              {/* Empty state */}
              {selectedDayData.transactions.length === 0 &&
                selectedDayData.recurring.length === 0 &&
                selectedDayData.subscriptions.length === 0 && (
                  <View style={styles.emptyState}>
                    <MaterialCommunityIcons
                      name="calendar-blank"
                      size={48}
                      color={theme.colors.onSurfaceVariant}
                    />
                    <Text
                      variant="bodyMedium"
                      style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.sm }}
                    >
                      Nessuna attività in questo giorno
                    </Text>
                  </View>
                )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: 40,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  monthNav: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: 4,
  },
  calendarCard: {
    marginBottom: spacing.md,
  },
  weekdayRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  weekdayLabel: {
    flex: 1,
    textAlign: 'center',
    fontWeight: '500',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 8,
  },
  todayCell: {
    borderWidth: 2,
    borderColor: '#6200EE',
  },
  dayNumber: {
    fontSize: 14,
  },
  dayIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 2,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  detailCard: {
    marginBottom: spacing.md,
  },
  dailySummary: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  detailSection: {
    marginBottom: spacing.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
});
