import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Pressable } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Chip,
  SegmentedButtons,
  Badge,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useInsightStore, InsightData } from '../../stores/insightStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { PremiumGate } from '../../components/premium/PremiumGate';
import { InsightCard } from '../../components/insights/InsightCard';
import { InsightType } from '../../types';
import { spacing, borderRadius, brandColors } from '../../constants/theme';

type FilterMode = 'all' | 'high' | 'unread';

const insightCategories: { type: InsightType; label: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  { type: 'budget_alert', label: 'Budget', icon: 'alert-circle' },
  { type: 'pattern_temporal', label: 'Pattern', icon: 'chart-areaspline' },
  { type: 'goal_progress', label: 'Obiettivi', icon: 'flag-checkered' },
  { type: 'recurring_optimization', label: 'Ricorrenti', icon: 'refresh' },
  { type: 'credit_reminder', label: 'Crediti', icon: 'account-cash' },
  { type: 'financial_health', label: 'Salute', icon: 'heart-pulse' },
  { type: 'waste_detection', label: 'Sprechi', icon: 'trash-can-outline' },
  { type: 'motivational', label: 'Motivazione', icon: 'star' },
];

export default function InsightsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { canUseFeature } = usePremiumStore();

  // Check if user can access advanced insights feature
  if (!canUseFeature('advanced_insights')) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
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
                <MaterialCommunityIcons name="lightbulb-on" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text variant="titleLarge" style={styles.headerTitle}>
                  Insights & Coaching
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <PremiumGate feature="advanced_insights" showTeaser={false}>
          <View />
        </PremiumGate>
      </SafeAreaView>
    );
  }
  const {
    insights,
    fetchInsights,
    markAsRead,
    dismissInsight,
    getUnreadCount,
    getHighPriorityInsights,
    isLoading,
    lastRefresh,
  } = useInsightStore();

  const [refreshing, setRefreshing] = useState(false);
  const [filterMode, setFilterMode] = useState<FilterMode>('all');
  const [selectedType, setSelectedType] = useState<InsightType | null>(null);

  const loadData = useCallback(async () => {
    await fetchInsights();
  }, [fetchInsights]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const unreadCount = getUnreadCount();
  const highPriorityCount = getHighPriorityInsights().length;

  // Filter insights based on current filter mode and type
  const filteredInsights = insights.filter((insight) => {
    if (filterMode === 'high' && insight.priority !== 'high') return false;
    if (filterMode === 'unread' && insight.isRead) return false;
    if (selectedType && insight.type !== selectedType) return false;
    return true;
  });

  // Group insights by priority
  const groupedInsights = {
    high: filteredInsights.filter((i) => i.priority === 'high'),
    medium: filteredInsights.filter((i) => i.priority === 'medium'),
    low: filteredInsights.filter((i) => i.priority === 'low'),
  };

  const handleDismiss = (id: string) => {
    dismissInsight(id);
  };

  const handleMarkRead = (id: string) => {
    markAsRead(id);
  };

  const toggleTypeFilter = (type: InsightType) => {
    setSelectedType(selectedType === type ? null : type);
  };

  const renderInsightGroup = (
    title: string,
    insightList: InsightData[],
    icon: keyof typeof MaterialCommunityIcons.glyphMap,
    color: string
  ) => {
    if (insightList.length === 0) return null;

    return (
      <View style={styles.groupContainer}>
        <View style={styles.groupHeader}>
          <MaterialCommunityIcons name={icon} size={20} color={color} />
          <Text variant="titleMedium" style={{ color }}>
            {title}
          </Text>
          <Badge style={{ backgroundColor: color }}>{insightList.length}</Badge>
        </View>
        {insightList.map((insight, index) => (
          <View key={insight.id} style={index > 0 && { marginTop: spacing.sm }}>
            <InsightCard
              insight={insight}
              onDismiss={() => handleDismiss(insight.id)}
              onMarkRead={() => handleMarkRead(insight.id)}
            />
          </View>
        ))}
      </View>
    );
  };

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
              <MaterialCommunityIcons name="lightbulb-on" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text variant="titleLarge" style={styles.headerTitle}>
                Insights & Coaching
              </Text>
              {unreadCount > 0 ? (
                <Text variant="bodySmall" style={styles.headerSubtitle}>
                  {unreadCount} da leggere
                </Text>
              ) : (
                <Text variant="bodySmall" style={styles.headerSubtitle}>
                  Consigli personalizzati
                </Text>
              )}
            </View>
            <Pressable onPress={loadData} disabled={isLoading} style={styles.backButton}>
              <MaterialCommunityIcons name="refresh" size={24} color={isLoading ? 'rgba(255,255,255,0.5)' : '#FFFFFF'} />
            </Pressable>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Summary Card */}
        <Card style={styles.summaryCard} mode="elevated">
          <Card.Content>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons
                  name="lightbulb-on"
                  size={28}
                  color={brandColors.primary}
                />
                <Text variant="headlineMedium" style={{ color: brandColors.primary }}>
                  {insights.length}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Insights totali
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={28}
                  color={brandColors.error}
                />
                <Text variant="headlineMedium" style={{ color: brandColors.error }}>
                  {highPriorityCount}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Priorita alta
                </Text>
              </View>
              <View style={styles.summaryItem}>
                <MaterialCommunityIcons
                  name="email-outline"
                  size={28}
                  color={brandColors.warning}
                />
                <Text variant="headlineMedium" style={{ color: brandColors.warning }}>
                  {unreadCount}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Da leggere
                </Text>
              </View>
            </View>
            {lastRefresh && (
              <Text
                variant="bodySmall"
                style={[styles.lastRefresh, { color: theme.colors.onSurfaceVariant }]}
              >
                Aggiornato: {lastRefresh.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            )}
          </Card.Content>
        </Card>

        {/* Filter Mode */}
        <SegmentedButtons
          value={filterMode}
          onValueChange={(value) => setFilterMode(value as FilterMode)}
          buttons={[
            { value: 'all', label: 'Tutti' },
            { value: 'high', label: 'Importanti' },
            { value: 'unread', label: 'Non letti' },
          ]}
          style={styles.filterButtons}
        />

        {/* Category Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoryFilters}
        >
          {insightCategories.map((cat) => {
            const count = insights.filter((i) => i.type === cat.type).length;
            if (count === 0) return null;

            return (
              <Chip
                key={cat.type}
                selected={selectedType === cat.type}
                onPress={() => toggleTypeFilter(cat.type)}
                style={styles.categoryChip}
                avatar={
                  <MaterialCommunityIcons
                    name={cat.icon}
                    size={16}
                    color={
                      selectedType === cat.type
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                }
              >
                {cat.label} ({count})
              </Chip>
            );
          })}
        </ScrollView>

        {/* Insights List */}
        {filteredInsights.length > 0 ? (
          <View style={styles.insightsContainer}>
            {renderInsightGroup(
              'Richiede attenzione',
              groupedInsights.high,
              'alert-circle',
              brandColors.error
            )}
            {groupedInsights.high.length > 0 && groupedInsights.medium.length > 0 && (
              <Divider style={styles.groupDivider} />
            )}
            {renderInsightGroup(
              'Da considerare',
              groupedInsights.medium,
              'alert',
              brandColors.warning
            )}
            {(groupedInsights.high.length > 0 || groupedInsights.medium.length > 0) &&
              groupedInsights.low.length > 0 && (
                <Divider style={styles.groupDivider} />
              )}
            {renderInsightGroup(
              'Informativo',
              groupedInsights.low,
              'information',
              brandColors.success
            )}
          </View>
        ) : (
          <Card style={styles.emptyCard} mode="elevated">
            <Card.Content style={styles.emptyContent}>
              <MaterialCommunityIcons
                name="check-decagram"
                size={64}
                color={brandColors.success}
              />
              <Text variant="titleMedium" style={{ marginTop: spacing.md }}>
                Tutto sotto controllo!
              </Text>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center' }}
              >
                {selectedType || filterMode !== 'all'
                  ? 'Nessun insight corrisponde ai filtri selezionati'
                  : 'Non ci sono insights al momento. Continua a registrare le tue transazioni per ricevere consigli personalizzati.'}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Tips Section */}
        <Card style={styles.tipsCard} mode="outlined">
          <Card.Content>
            <View style={styles.tipsHeader}>
              <MaterialCommunityIcons
                name="lightbulb-on-outline"
                size={24}
                color={brandColors.warning}
              />
              <Text variant="titleMedium">Come funziona</Text>
            </View>
            <Text
              variant="bodyMedium"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.sm }}
            >
              Gli insights vengono generati automaticamente analizzando le tue transazioni,
              budget, obiettivi e spese ricorrenti. Piu dati inserisci, piu personalizzati
              saranno i consigli!
            </Text>
            <View style={styles.tipsList}>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color={brandColors.success}
                />
                <Text variant="bodySmall" style={{ flex: 1 }}>
                  Alert quando superi il budget
                </Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color={brandColors.success}
                />
                <Text variant="bodySmall" style={{ flex: 1 }}>
                  Analisi dei pattern di spesa
                </Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color={brandColors.success}
                />
                <Text variant="bodySmall" style={{ flex: 1 }}>
                  Suggerimenti per raggiungere gli obiettivi
                </Text>
              </View>
              <View style={styles.tipItem}>
                <MaterialCommunityIcons
                  name="check"
                  size={16}
                  color={brandColors.success}
                />
                <Text variant="bodySmall" style={{ flex: 1 }}>
                  Reminder per crediti e spese ricorrenti
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>
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
  summaryCard: {
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  summaryItem: {
    alignItems: 'center',
    gap: spacing.xs,
  },
  lastRefresh: {
    textAlign: 'center',
    marginTop: spacing.md,
  },
  filterButtons: {
    marginBottom: spacing.md,
  },
  categoryFilters: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
  },
  categoryChip: {
    marginRight: spacing.xs,
  },
  insightsContainer: {
    gap: spacing.lg,
  },
  groupContainer: {
    gap: spacing.sm,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  groupDivider: {
    marginVertical: spacing.sm,
  },
  emptyCard: {
    marginTop: spacing.lg,
  },
  emptyContent: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  tipsCard: {
    marginTop: spacing.lg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  tipsList: {
    marginTop: spacing.md,
    gap: spacing.sm,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
});
