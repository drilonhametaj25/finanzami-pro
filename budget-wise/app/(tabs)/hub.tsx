import React, { useEffect, useMemo, useRef } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  ProgressBar,
  Surface,
  IconButton,
  Button,
  Chip,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { format, startOfMonth, endOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';

import { useGamificationStore } from '../../stores/gamificationStore';
import { useTransactionStore } from '../../stores/transactionStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useGoalStore } from '../../stores/goalStore';
import { usePatrimonioStore } from '../../stores/patrimonioStore';
import { useSubscriptionStore } from '../../stores/subscriptionStore';
import { useAuthStore } from '../../stores/authStore';
import { ACHIEVEMENTS } from '../../constants/gamification';
import { spacing, brandColors } from '../../constants/theme';
import { formatCurrency } from '../../constants/currencies';
import { useAchievementCheck } from '../../hooks/useAchievementCheck';

export default function HubTabScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useAuthStore();
  const { transactions } = useTransactionStore();
  const { categories } = useCategoryStore();
  const { goals } = useGoalStore();
  const { getNetWorth, getTotalInvestments } = usePatrimonioStore();
  const { getMonthlyTotal, getUnusedSubscriptions, getUpcomingRenewals } = useSubscriptionStore();

  const {
    getStats,
    updateStreak,
    calculateHealthScore,
    unlockedAchievements,
    monthlyChallenge,
  } = useGamificationStore();
  const { checkAndCelebrate } = useAchievementCheck();

  // Track if we've already checked achievements this session
  const hasCheckedAchievementsRef = useRef(false);

  const currency = profile?.main_currency || 'EUR';
  const stats = getStats();

  // Calculate current month stats
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

    const savingsRate = income > 0 ? ((income - expenses) / income) * 100 : 0;
    const budgetUsed = profile?.monthly_budget
      ? (expenses / profile.monthly_budget) * 100
      : 0;

    return { income, expenses, savingsRate, budgetUsed };
  }, [transactions, profile]);

  // Goal progress
  const goalProgress = useMemo(() => {
    const activeGoals = goals.filter((g) => !g.is_completed);
    if (activeGoals.length === 0) return 0;

    const totalProgress = activeGoals.reduce((sum, g) => {
      return sum + (g.current_amount / g.target_amount) * 100;
    }, 0);

    return totalProgress / activeGoals.length;
  }, [goals]);

  // Update streak and health score on mount
  useEffect(() => {
    updateStreak();

    const healthInput = {
      savingsRate: Math.max(0, monthlyStats.savingsRate),
      budgetUsed: monthlyStats.budgetUsed,
      goalProgress,
      currentStreak: stats.streak,
      hasInvestments: getTotalInvestments() > 0,
      hasMultipleIncomes: false,
    };

    calculateHealthScore(healthInput);

    // Only check achievements once per session to avoid annoying repeated animations
    if (!hasCheckedAchievementsRef.current && transactions.length > 0) {
      hasCheckedAchievementsRef.current = true;

      const achievementStats = {
        totalTransactions: transactions.length,
        totalIncome: monthlyStats.income,
        totalExpenses: monthlyStats.expenses,
        savingsRate: monthlyStats.savingsRate,
        currentStreak: stats.streak,
        longestStreak: stats.longestStreak,
        goalsCompleted: goals.filter((g) => g.is_completed).length,
        goalsTotal: goals.length,
        monthsUnderBudget: 0,
        categoriesWithBudget: categories.filter((c) => c.budget && c.budget > 0).length,
        totalSaved: goals.reduce((sum, g) => sum + g.current_amount, 0),
        investmentTotal: getTotalInvestments(),
        subscriptionsManaged: 0,
        daysActive: stats.streak,
      };

      checkAndCelebrate(achievementStats);
    }
  }, [transactions, goals]);

  // Health score color
  const getHealthScoreColor = (score: number) => {
    if (score >= 80) return brandColors.success;
    if (score >= 60) return '#8BC34A';
    if (score >= 40) return brandColors.warning;
    if (score >= 20) return '#FF9800';
    return brandColors.error;
  };

  const healthColor = getHealthScoreColor(stats.healthScore);

  // Upcoming renewals and unused subscriptions
  const upcomingRenewals = getUpcomingRenewals(7);
  const unusedSubs = getUnusedSubscriptions(60);
  const monthlySubTotal = getMonthlyTotal();

  // Recent achievements
  const recentAchievements = unlockedAchievements
    .sort((a, b) => new Date(b.unlockedAt).getTime() - new Date(a.unlockedAt).getTime())
    .slice(0, 3)
    .map((ua) => ACHIEVEMENTS.find((a) => a.id === ua.id)!)
    .filter(Boolean);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text variant="headlineSmall" style={styles.title}>
              Il tuo Hub
            </Text>
            <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
              {format(new Date(), "EEEE d MMMM", { locale: it })}
            </Text>
          </View>
          <IconButton
            icon="cog"
            size={24}
            onPress={() => router.push('/profile')}
          />
        </View>

        {/* Health Score & Level Card */}
        <Card style={styles.mainCard} mode="elevated">
          <Card.Content>
            <View style={styles.scoreRow}>
              {/* Health Score Circle */}
              <View style={styles.scoreCircle}>
                <Svg width={120} height={120}>
                  {/* Background circle */}
                  <Circle
                    cx={60}
                    cy={60}
                    r={50}
                    stroke={theme.colors.surfaceVariant}
                    strokeWidth={10}
                    fill="none"
                  />
                  {/* Progress circle */}
                  <Circle
                    cx={60}
                    cy={60}
                    r={50}
                    stroke={healthColor}
                    strokeWidth={10}
                    fill="none"
                    strokeDasharray={`${(stats.healthScore / 100) * 314} 314`}
                    strokeLinecap="round"
                    rotation={-90}
                    origin="60, 60"
                  />
                </Svg>
                <View style={styles.scoreCenter}>
                  <Text variant="headlineMedium" style={{ fontWeight: 'bold', color: healthColor }}>
                    {stats.healthScore}
                  </Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Health Score
                  </Text>
                </View>
              </View>

              {/* Level & XP */}
              <View style={styles.levelSection}>
                <View style={styles.levelBadge}>
                  <MaterialCommunityIcons name="shield-star" size={32} color={theme.colors.primary} />
                  <Text variant="titleLarge" style={{ fontWeight: 'bold' }}>
                    Lv. {stats.level}
                  </Text>
                </View>
                <Text variant="titleSmall" style={{ color: theme.colors.primary }}>
                  {stats.levelName}
                </Text>

                <View style={styles.xpBar}>
                  <ProgressBar
                    progress={stats.xpProgress}
                    color={theme.colors.primary}
                    style={{ height: 8, borderRadius: 4 }}
                  />
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}>
                    {stats.xp} XP • {stats.xpToNextLevel} al prossimo livello
                  </Text>
                </View>
              </View>
            </View>

            {/* Streak */}
            <View style={styles.streakRow}>
              <MaterialCommunityIcons name="fire" size={24} color="#FF5722" />
              <Text variant="titleMedium" style={{ marginLeft: 8 }}>
                {stats.streak} giorni di streak
              </Text>
              {stats.streak >= 7 && (
                <Chip compact style={{ marginLeft: 'auto' }} icon="star">
                  Record: {stats.longestStreak}
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Monthly Challenge */}
        {monthlyChallenge && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <View style={styles.challengeHeader}>
                <MaterialCommunityIcons name="trophy" size={24} color={brandColors.warning} />
                <Text variant="titleMedium" style={{ marginLeft: 8 }}>
                  Sfida del Mese
                </Text>
              </View>
              <Text variant="bodyLarge" style={{ marginTop: 8 }}>
                {monthlyChallenge.title}
              </Text>
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {monthlyChallenge.description}
              </Text>
              <ProgressBar
                progress={monthlyChallenge.currentAmount / monthlyChallenge.targetAmount}
                color={monthlyChallenge.isCompleted ? brandColors.success : theme.colors.primary}
                style={{ height: 8, borderRadius: 4, marginTop: 12 }}
              />
              <Text variant="labelSmall" style={{ marginTop: 4, color: theme.colors.onSurfaceVariant }}>
                {monthlyChallenge.currentAmount} / {monthlyChallenge.targetAmount} • +{monthlyChallenge.xpReward} XP
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Quick Stats Grid */}
        <View style={styles.statsGrid}>
          <Pressable onPress={() => router.push('/patrimonio')} style={styles.statCardWrapper}>
            <Surface style={styles.statCard} elevation={1}>
              <MaterialCommunityIcons name="bank" size={28} color={theme.colors.primary} />
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                {formatCurrency(getNetWorth(), currency)}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Patrimonio
              </Text>
            </Surface>
          </Pressable>

          <Pressable onPress={() => router.push('/subscriptions')} style={styles.statCardWrapper}>
            <Surface style={styles.statCard} elevation={1}>
              <MaterialCommunityIcons name="calendar-sync" size={28} color="#E91E63" />
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                {formatCurrency(monthlySubTotal, currency)}/mese
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Abbonamenti
              </Text>
            </Surface>
          </Pressable>

          <Pressable onPress={() => router.push('/goals')} style={styles.statCardWrapper}>
            <Surface style={styles.statCard} elevation={1}>
              <MaterialCommunityIcons name="target" size={28} color={brandColors.success} />
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                {goals.filter((g) => !g.is_completed).length}
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Obiettivi attivi
              </Text>
            </Surface>
          </Pressable>

          <Pressable onPress={() => router.push('/hub/simulator')} style={styles.statCardWrapper}>
            <Surface style={styles.statCard} elevation={1}>
              <MaterialCommunityIcons name="calculator-variant" size={28} color="#9C27B0" />
              <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                What If
              </Text>
              <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                Simulatore
              </Text>
            </Surface>
          </Pressable>
        </View>

        {/* Achievements Section */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="medal" size={24} color={brandColors.warning} />
                <Text variant="titleMedium" style={{ marginLeft: 8 }}>
                  Badge
                </Text>
                <Chip compact style={{ marginLeft: 8 }}>
                  {stats.unlockedBadges}/{stats.totalBadges}
                </Chip>
              </View>
              <IconButton
                icon="chevron-right"
                size={20}
                onPress={() => router.push('/hub/achievements')}
              />
            </View>

            {recentAchievements.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {recentAchievements.map((achievement) => (
                  <Surface key={achievement.id} style={styles.achievementCard} elevation={1}>
                    <View style={[styles.achievementIcon, { backgroundColor: achievement.color + '20' }]}>
                      <MaterialCommunityIcons
                        name={achievement.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={24}
                        color={achievement.color}
                      />
                    </View>
                    <Text variant="labelMedium" style={{ textAlign: 'center' }} numberOfLines={1}>
                      {achievement.name}
                    </Text>
                  </Surface>
                ))}
              </ScrollView>
            ) : (
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                Continua a usare l'app per sbloccare badge!
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Alerts Section */}
        {(unusedSubs.length > 0 || upcomingRenewals.length > 0) && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Attenzione
              </Text>

              {unusedSubs.length > 0 && (
                <Pressable
                  style={[styles.alertItem, { backgroundColor: brandColors.warning + '15' }]}
                  onPress={() => router.push('/subscriptions')}
                >
                  <MaterialCommunityIcons name="alert" size={20} color={brandColors.warning} />
                  <Text variant="bodyMedium" style={{ flex: 1, marginLeft: 12 }}>
                    {unusedSubs.length} abbonament{unusedSubs.length > 1 ? 'i' : 'o'} non utilizat{unusedSubs.length > 1 ? 'i' : 'o'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
                </Pressable>
              )}

              {upcomingRenewals.length > 0 && (
                <Pressable
                  style={[styles.alertItem, { backgroundColor: theme.colors.primaryContainer }]}
                  onPress={() => router.push('/subscriptions')}
                >
                  <MaterialCommunityIcons name="calendar-clock" size={20} color={theme.colors.primary} />
                  <Text variant="bodyMedium" style={{ flex: 1, marginLeft: 12 }}>
                    {upcomingRenewals.length} rinnov{upcomingRenewals.length > 1 ? 'i' : 'o'} in arrivo
                  </Text>
                  <MaterialCommunityIcons name="chevron-right" size={20} color={theme.colors.onSurfaceVariant} />
                </Pressable>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Predictions */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <MaterialCommunityIcons name="crystal-ball" size={24} color="#9C27B0" />
                <Text variant="titleMedium" style={{ marginLeft: 8 }}>
                  Previsioni
                </Text>
              </View>
            </View>

            <View style={styles.predictionItem}>
              <Text variant="bodyMedium">Saldo fine mese stimato:</Text>
              <Text
                variant="titleMedium"
                style={{
                  color: monthlyStats.savingsRate > 0 ? brandColors.success : brandColors.error,
                  fontWeight: 'bold',
                }}
              >
                {formatCurrency(monthlyStats.income - monthlyStats.expenses, currency)}
              </Text>
            </View>

            {goals.filter((g) => !g.is_completed).length > 0 && (
              <View style={styles.predictionItem}>
                <Text variant="bodyMedium">Prossimo obiettivo raggiunto:</Text>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                  ~{Math.ceil((goals[0]?.target_amount - goals[0]?.current_amount) / (goals[0]?.monthly_allocation || 100))} mesi
                </Text>
              </View>
            )}

            {monthlyStats.budgetUsed > 80 && monthlyStats.budgetUsed < 100 && (
              <View style={[styles.predictionItem, { backgroundColor: brandColors.warning + '15', padding: 12, borderRadius: 8, borderBottomWidth: 0 }]}>
                <MaterialCommunityIcons name="alert" size={20} color={brandColors.warning} />
                <Text variant="bodyMedium" style={{ flex: 1, marginLeft: 8 }}>
                  Attenzione: al ritmo attuale potresti sforare il budget!
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <Button
            mode="contained"
            icon="calendar-month"
            onPress={() => router.push('/hub/calendar')}
            style={styles.actionButton}
          >
            Calendario
          </Button>
          <Button
            mode="contained-tonal"
            icon="chart-timeline-variant"
            onPress={() => router.push('/stats')}
            style={styles.actionButton}
          >
            Statistiche
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: 'bold',
  },
  mainCard: {
    marginBottom: spacing.md,
  },
  scoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  scoreCircle: {
    position: 'relative',
    width: 120,
    height: 120,
  },
  scoreCenter: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  levelSection: {
    flex: 1,
  },
  levelBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  xpBar: {
    marginTop: spacing.sm,
  },
  streakRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  card: {
    marginBottom: spacing.md,
  },
  challengeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statCardWrapper: {
    width: '48%',
  },
  statCard: {
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    gap: 4,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  sectionTitle: {
    marginBottom: spacing.md,
  },
  achievementCard: {
    width: 100,
    padding: spacing.sm,
    borderRadius: 12,
    alignItems: 'center',
    marginRight: spacing.sm,
    gap: 8,
  },
  achievementIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  predictionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  actionButton: {
    flex: 1,
  },
});
