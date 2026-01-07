import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  ProgressBar,
  IconButton,
  Button,
  Chip,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, differenceInMonths, addMonths } from 'date-fns';
import { it } from 'date-fns/locale';

import { useGoalStore } from '../../stores/goalStore';
import { useAuthStore } from '../../stores/authStore';
import { usePremiumStore, FREE_LIMITS } from '../../stores/premiumStore';
import { spacing, borderRadius, brandColors } from '../../constants/theme';
import { formatCurrency } from '../../constants/currencies';
import { Goal } from '../../types/database';

export default function GoalsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const { goals, fetchGoals, isLoading } = useGoalStore();
  const { isPremium, getFeatureLimits } = usePremiumStore();

  const [refreshing, setRefreshing] = useState(false);

  const currency = profile?.main_currency || 'EUR';
  const limits = getFeatureLimits();
  const canAddGoal = isPremium || goals.length < limits.maxGoals;

  const handleAddGoal = () => {
    if (canAddGoal) {
      router.push('/goals/add');
    } else {
      router.push('/premium');
    }
  };

  const loadData = useCallback(async () => {
    await fetchGoals();
  }, [fetchGoals]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const activeGoals = goals.filter((g) => !g.is_completed);
  const completedGoals = goals.filter((g) => g.is_completed);

  const calculateProgress = (goal: Goal) => {
    const percentage = goal.target_amount > 0
      ? (goal.current_amount / goal.target_amount) * 100
      : 0;
    const remaining = goal.target_amount - goal.current_amount;

    let estimatedDate: Date | null = null;
    let monthsRemaining: number | null = null;

    if (goal.monthly_allocation && goal.monthly_allocation > 0 && remaining > 0) {
      monthsRemaining = Math.ceil(remaining / goal.monthly_allocation);
      estimatedDate = addMonths(new Date(), monthsRemaining);
    } else if (goal.target_date) {
      estimatedDate = new Date(goal.target_date);
      monthsRemaining = differenceInMonths(estimatedDate, new Date());
    }

    return { percentage, remaining, estimatedDate, monthsRemaining };
  };

  const renderGoalCard = (goal: Goal) => {
    const { percentage, remaining, estimatedDate, monthsRemaining } = calculateProgress(goal);
    const isCompleted = goal.is_completed || percentage >= 100;

    return (
      <Card
        key={goal.id}
        style={styles.goalCard}
        mode="elevated"
        onPress={() => router.push(`/goals/${goal.id}`)}
      >
        <Card.Content>
          <View style={styles.goalHeader}>
            <View
              style={[
                styles.goalIcon,
                { backgroundColor: isCompleted ? brandColors.success + '20' : theme.colors.primaryContainer },
              ]}
            >
              <MaterialCommunityIcons
                name={(goal.icon || 'target') as keyof typeof MaterialCommunityIcons.glyphMap}
                size={24}
                color={isCompleted ? brandColors.success : theme.colors.primary}
              />
            </View>
            <View style={styles.goalInfo}>
              <Text variant="titleMedium">{goal.name}</Text>
              {goal.target_date && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Obiettivo: {format(new Date(goal.target_date), 'd MMM yyyy', { locale: it })}
                </Text>
              )}
            </View>
            {isCompleted && (
              <MaterialCommunityIcons
                name="check-circle"
                size={24}
                color={brandColors.success}
              />
            )}
          </View>

          <View style={styles.progressSection}>
            <View style={styles.progressLabels}>
              <Text variant="bodyMedium">
                {formatCurrency(goal.current_amount, currency)}
              </Text>
              <Text variant="bodyMedium" style={{ color: theme.colors.onSurfaceVariant }}>
                di {formatCurrency(goal.target_amount, currency)}
              </Text>
            </View>
            <ProgressBar
              progress={Math.min(percentage / 100, 1)}
              color={isCompleted ? brandColors.success : theme.colors.primary}
              style={styles.progressBar}
            />
            <View style={styles.progressLabels}>
              <Text variant="labelMedium" style={{ color: theme.colors.primary }}>
                {percentage.toFixed(0)}%
              </Text>
              {!isCompleted && remaining > 0 && (
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Mancano {formatCurrency(remaining, currency)}
                </Text>
              )}
            </View>
          </View>

          {!isCompleted && estimatedDate && monthsRemaining && monthsRemaining > 0 && (
            <View style={styles.estimateSection}>
              <MaterialCommunityIcons
                name="calendar-clock"
                size={16}
                color={theme.colors.onSurfaceVariant}
              />
              <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                {goal.monthly_allocation
                  ? `Raggiungimento stimato: ${format(estimatedDate, 'MMMM yyyy', { locale: it })}`
                  : `${monthsRemaining} mesi rimanenti`}
              </Text>
            </View>
          )}

          {goal.monthly_allocation && goal.monthly_allocation > 0 && (
            <View style={styles.allocationBadge}>
              <Text variant="labelSmall" style={{ color: theme.colors.primary }}>
                {formatCurrency(goal.monthly_allocation, currency)}/mese
              </Text>
            </View>
          )}
        </Card.Content>
      </Card>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 100 + insets.bottom }]}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Gradient Header with Summary */}
        <LinearGradient
          colors={[brandColors.gradientStart, brandColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons name="target" size={32} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text variant="headlineSmall" style={styles.headerTitle}>
                Obiettivi
              </Text>
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                Raggiungi i tuoi traguardi
              </Text>
            </View>
          </View>

          {/* Summary Stats */}
          {goals.length > 0 && (
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="headlineMedium" style={styles.summaryValue}>
                  {activeGoals.length}
                </Text>
                <Text variant="bodySmall" style={styles.summaryLabel}>
                  Attivi
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text variant="headlineMedium" style={styles.summaryValue}>
                  {completedGoals.length}
                </Text>
                <Text variant="bodySmall" style={styles.summaryLabel}>
                  Completati
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text variant="headlineMedium" style={styles.summaryValue}>
                  {formatCurrency(
                    activeGoals.reduce((sum, g) => sum + g.current_amount, 0),
                    currency
                  )}
                </Text>
                <Text variant="bodySmall" style={styles.summaryLabel}>
                  Risparmiato
                </Text>
              </View>
            </View>
          )}
        </LinearGradient>

        {/* Active Goals */}
        {activeGoals.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              In corso
            </Text>
            {activeGoals.map(renderGoalCard)}
          </View>
        )}

        {/* Completed Goals */}
        {completedGoals.length > 0 && (
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Completati
            </Text>
            {completedGoals.map(renderGoalCard)}
          </View>
        )}

        {/* Empty State */}
        {goals.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={[brandColors.gradientStart, brandColors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIcon}
            >
              <MaterialCommunityIcons
                name="target"
                size={48}
                color="#FFFFFF"
              />
            </LinearGradient>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Nessun obiettivo
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
            >
              Crea il tuo primo obiettivo di risparmio per iniziare a monitorare i tuoi progressi
            </Text>
            <Pressable
              onPress={handleAddGoal}
              style={({ pressed }) => [
                styles.emptyButtonPressable,
                pressed && styles.emptyButtonPressed,
              ]}
            >
              <LinearGradient
                colors={[brandColors.gradientStart, brandColors.gradientEnd]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.emptyButtonGradient}
              >
                <MaterialCommunityIcons name="plus" size={20} color="#FFFFFF" style={{ marginRight: spacing.sm }} />
                <Text variant="titleSmall" style={styles.emptyButtonText}>Crea obiettivo</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Gradient FAB */}
      {goals.length > 0 && (
        <Pressable
          onPress={handleAddGoal}
          style={({ pressed }) => [
            styles.fabPressable,
            { bottom: spacing.md + insets.bottom },
            pressed && styles.fabPressed,
          ]}
        >
          <LinearGradient
            colors={canAddGoal ? [brandColors.gradientStart, brandColors.gradientEnd] : ['#FFD700', '#FFA000']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.fabGradient}
          >
            <MaterialCommunityIcons
              name={canAddGoal ? 'plus' : 'crown'}
              size={24}
              color={canAddGoal ? '#FFFFFF' : '#000'}
            />
          </LinearGradient>
        </Pressable>
      )}

      {/* Free limit indicator */}
      {!isPremium && goals.length > 0 && (
        <View style={[styles.limitIndicator, { bottom: spacing.md + insets.bottom }]}>
          <Chip
            icon={canAddGoal ? 'target' : 'lock'}
            onPress={() => !canAddGoal && router.push('/premium')}
          >
            {goals.length}/{limits.maxGoals} obiettivi
            {!canAddGoal && ' - Passa a Premium'}
          </Chip>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
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
    marginBottom: spacing.md,
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
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.lg,
    padding: spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  summaryLabel: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  summaryDivider: {
    width: 1,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  goalCard: {
    marginBottom: spacing.sm,
  },
  goalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  goalInfo: {
    flex: 1,
  },
  progressSection: {
    gap: spacing.xs,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
  },
  estimateSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.sm,
    paddingTop: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  allocationBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: '#E3F2FD',
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: 12,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    marginBottom: spacing.sm,
  },
  emptyText: {
    textAlign: 'center',
    paddingHorizontal: spacing.xl,
    marginBottom: spacing.lg,
  },
  emptyButtonPressable: {
    marginTop: spacing.sm,
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  emptyButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  emptyButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.lg,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  fabPressable: {
    position: 'absolute',
    right: spacing.md,
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
  limitIndicator: {
    position: 'absolute',
    left: spacing.md,
  },
});
