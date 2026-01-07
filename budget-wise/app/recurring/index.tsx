import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, ScrollView, RefreshControl, Alert, Pressable } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  IconButton,
  Button,
  Divider,
  Portal,
  Dialog,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

import { useRecurringStore } from '../../stores/recurringStore';
import { useCategoryStore } from '../../stores/categoryStore';
import { useAuthStore } from '../../stores/authStore';
import { RecurringCard } from '../../components/recurring/RecurringCard';
import { spacing, borderRadius, brandColors } from '../../constants/theme';
import { formatCurrency } from '../../constants/currencies';
import { RecurringTransaction } from '../../types/database';

export default function RecurringListScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const {
    recurringTransactions,
    fetchRecurring,
    markAsPaid,
    deleteRecurring,
    getOverdue,
    getUpcoming,
    isLoading,
  } = useRecurringStore();
  const { categories, fetchCategories } = useCategoryStore();

  const [refreshing, setRefreshing] = useState(false);
  const [selectedRecurring, setSelectedRecurring] = useState<RecurringTransaction | null>(null);
  const [showActionDialog, setShowActionDialog] = useState(false);

  const currency = profile?.main_currency || 'EUR';

  const loadData = useCallback(async () => {
    await Promise.all([fetchRecurring(), fetchCategories()]);
  }, [fetchRecurring, fetchCategories]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, [loadData]);

  const handleMarkAsPaid = async (recurring: RecurringTransaction) => {
    Alert.alert(
      'Conferma pagamento',
      `Confermi di aver pagato "${recurring.description || 'questa spesa'}"?`,
      [
        { text: 'Annulla', style: 'cancel' },
        {
          text: 'Confermo',
          onPress: async () => {
            const { error } = await markAsPaid(recurring.id);
            if (error) {
              Alert.alert('Errore', error);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (!selectedRecurring) return;

    const { error } = await deleteRecurring(selectedRecurring.id);
    if (error) {
      Alert.alert('Errore', error);
    }
    setShowActionDialog(false);
    setSelectedRecurring(null);
  };

  const overdueTransactions = getOverdue();
  const upcomingTransactions = getUpcoming(7);
  const allOthers = recurringTransactions.filter(
    (r) =>
      !overdueTransactions.find((o) => o.id === r.id) &&
      !upcomingTransactions.find((u) => u.id === r.id)
  );

  // Calculate monthly total
  const monthlyTotal = recurringTransactions.reduce((sum, r) => {
    switch (r.frequency) {
      case 'monthly':
        return sum + r.amount;
      case 'quarterly':
        return sum + r.amount / 3;
      case 'yearly':
        return sum + r.amount / 12;
      default:
        return sum + r.amount;
    }
  }, 0);

  const renderSection = (
    title: string,
    items: RecurringTransaction[],
    showEmpty = false
  ) => {
    if (items.length === 0 && !showEmpty) return null;

    return (
      <View style={styles.section}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          {title}
        </Text>
        {items.length === 0 ? (
          <Text
            variant="bodyMedium"
            style={{ color: theme.colors.onSurfaceVariant, paddingVertical: spacing.sm }}
          >
            Nessuna spesa in questa sezione
          </Text>
        ) : (
          items.map((recurring) => {
            const category = categories.find((c) => c.id === recurring.category_id);
            return (
              <RecurringCard
                key={recurring.id}
                recurring={recurring}
                category={category}
                currency={currency}
                onPress={() => {
                  setSelectedRecurring(recurring);
                  setShowActionDialog(true);
                }}
                onMarkAsPaid={() => handleMarkAsPaid(recurring)}
              />
            );
          })
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.headerContent}>
          <Pressable
            onPress={() => router.back()}
            style={styles.backButton}
          >
            <MaterialCommunityIcons name="arrow-left" size={24} color="#FFFFFF" />
          </Pressable>
          <View style={styles.headerIconContainer}>
            <MaterialCommunityIcons name="repeat" size={28} color="#FFFFFF" />
          </View>
          <View style={styles.headerTextContainer}>
            <Text variant="titleLarge" style={styles.headerTitle}>
              Spese Ricorrenti
            </Text>
            <Text variant="bodySmall" style={styles.headerSubtitle}>
              Gestisci le tue spese fisse
            </Text>
          </View>
        </View>

        {/* Summary inside gradient */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text variant="headlineMedium" style={styles.summaryValue}>
              {recurringTransactions.length}
            </Text>
            <Text variant="bodySmall" style={styles.summaryLabel}>
              Spese attive
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text variant="headlineMedium" style={styles.summaryValue}>
              {formatCurrency(monthlyTotal, currency)}
            </Text>
            <Text variant="bodySmall" style={styles.summaryLabel}>
              Totale mensile
            </Text>
          </View>
        </View>

        {overdueTransactions.length > 0 && (
          <View style={styles.alertBanner}>
            <MaterialCommunityIcons
              name="alert-circle"
              size={20}
              color="#FFFFFF"
            />
            <Text variant="bodyMedium" style={styles.alertText}>
              {overdueTransactions.length} spesa/e in ritardo
            </Text>
          </View>
        )}
      </LinearGradient>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >

        {/* Overdue Section */}
        {overdueTransactions.length > 0 && (
          <Card
            style={[styles.sectionCard, { borderColor: brandColors.error, borderWidth: 1 }]}
            mode="elevated"
          >
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="alert-circle"
                  size={24}
                  color={brandColors.error}
                />
                <Text variant="titleMedium" style={{ color: brandColors.error }}>
                  In ritardo ({overdueTransactions.length})
                </Text>
              </View>
              {overdueTransactions.map((recurring, index) => {
                const category = categories.find((c) => c.id === recurring.category_id);
                return (
                  <View key={recurring.id}>
                    {index > 0 && <View style={{ height: spacing.sm }} />}
                    <RecurringCard
                      recurring={recurring}
                      category={category}
                      currency={currency}
                      onPress={() => {
                        setSelectedRecurring(recurring);
                        setShowActionDialog(true);
                      }}
                      onMarkAsPaid={() => handleMarkAsPaid(recurring)}
                    />
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* Upcoming Section */}
        {upcomingTransactions.length > 0 && (
          <Card style={styles.sectionCard} mode="elevated">
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="clock-outline"
                  size={24}
                  color={brandColors.warning}
                />
                <Text variant="titleMedium">
                  In scadenza ({upcomingTransactions.length})
                </Text>
              </View>
              {upcomingTransactions.map((recurring, index) => {
                const category = categories.find((c) => c.id === recurring.category_id);
                return (
                  <View key={recurring.id}>
                    {index > 0 && <View style={{ height: spacing.sm }} />}
                    <RecurringCard
                      recurring={recurring}
                      category={category}
                      currency={currency}
                      onPress={() => {
                        setSelectedRecurring(recurring);
                        setShowActionDialog(true);
                      }}
                      onMarkAsPaid={() => handleMarkAsPaid(recurring)}
                    />
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* All Others */}
        {allOthers.length > 0 && (
          <Card style={styles.sectionCard} mode="elevated">
            <Card.Content>
              <View style={styles.sectionHeader}>
                <MaterialCommunityIcons
                  name="repeat"
                  size={24}
                  color={theme.colors.primary}
                />
                <Text variant="titleMedium">
                  Altre spese ({allOthers.length})
                </Text>
              </View>
              {allOthers.map((recurring, index) => {
                const category = categories.find((c) => c.id === recurring.category_id);
                return (
                  <View key={recurring.id}>
                    {index > 0 && <View style={{ height: spacing.sm }} />}
                    <RecurringCard
                      recurring={recurring}
                      category={category}
                      currency={currency}
                      onPress={() => {
                        setSelectedRecurring(recurring);
                        setShowActionDialog(true);
                      }}
                    />
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* Empty State */}
        {recurringTransactions.length === 0 && !isLoading && (
          <View style={styles.emptyState}>
            <LinearGradient
              colors={[brandColors.gradientStart, brandColors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.emptyIcon}
            >
              <MaterialCommunityIcons
                name="repeat"
                size={48}
                color="#FFFFFF"
              />
            </LinearGradient>
            <Text variant="titleMedium" style={styles.emptyTitle}>
              Nessuna spesa ricorrente
            </Text>
            <Text
              variant="bodyMedium"
              style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}
            >
              Aggiungi le tue spese fisse come affitto, bollette e abbonamenti per tenerne traccia
            </Text>
            <Pressable
              onPress={() => router.push('/recurring/add')}
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
                <Text variant="titleSmall" style={styles.emptyButtonText}>Aggiungi spesa ricorrente</Text>
              </LinearGradient>
            </Pressable>
          </View>
        )}
      </ScrollView>

      {/* Gradient FAB */}
      {recurringTransactions.length > 0 && (
        <Pressable
          onPress={() => router.push('/recurring/add')}
          style={({ pressed }) => [
            styles.fabPressable,
            { bottom: spacing.md + insets.bottom },
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
      )}

      {/* Action Dialog */}
      <Portal>
        <Dialog
          visible={showActionDialog}
          onDismiss={() => {
            setShowActionDialog(false);
            setSelectedRecurring(null);
          }}
        >
          <Dialog.Title>
            {selectedRecurring?.description || 'Spesa ricorrente'}
          </Dialog.Title>
          <Dialog.Content>
            <Button
              mode="outlined"
              icon="check-circle"
              onPress={() => {
                if (selectedRecurring) {
                  handleMarkAsPaid(selectedRecurring);
                }
                setShowActionDialog(false);
              }}
              style={styles.dialogButton}
            >
              Segna come pagata
            </Button>
            <Button
              mode="outlined"
              icon="pencil"
              onPress={() => {
                setShowActionDialog(false);
                router.push(`/recurring/${selectedRecurring?.id}`);
              }}
              style={styles.dialogButton}
            >
              Modifica
            </Button>
            <Button
              mode="outlined"
              icon="delete"
              textColor={brandColors.error}
              onPress={handleDelete}
              style={styles.dialogButton}
              loading={isLoading}
            >
              Elimina
            </Button>
          </Dialog.Content>
          <Dialog.Actions>
            <Button
              onPress={() => {
                setShowActionDialog(false);
                setSelectedRecurring(null);
              }}
            >
              Chiudi
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
  // Gradient Header
  headerGradient: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
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
  scrollContent: {
    padding: spacing.md,
    paddingBottom: 100,
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
  alertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    borderRadius: borderRadius.md,
  },
  alertText: {
    color: '#FFFFFF',
    flex: 1,
  },
  sectionCard: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
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
  dialogButton: {
    marginBottom: spacing.sm,
  },
});
