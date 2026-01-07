import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  Surface,
  Chip,
  IconButton,
  Menu,
  Divider,
  Portal,
  Modal,
  Button,
  TextInput,
  SegmentedButtons,
} from 'react-native-paper';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { format, parseISO, differenceInDays } from 'date-fns';
import { it } from 'date-fns/locale';

import {
  useSubscriptionStore,
  Subscription,
  SUBSCRIPTION_PRESETS,
  SUBSCRIPTION_CATEGORIES,
} from '../../stores/subscriptionStore';
import { useAuthStore } from '../../stores/authStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { PremiumGate } from '../../components/premium/PremiumGate';
import { spacing, borderRadius, brandColors } from '../../constants/theme';
import { formatCurrency } from '../../constants/currencies';

const FREQUENCY_LABELS = {
  monthly: 'Mensile',
  quarterly: 'Trimestrale',
  yearly: 'Annuale',
};

export default function SubscriptionsScreen() {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { profile } = useAuthStore();
  const { canUseFeature } = usePremiumStore();

  // Check if user can access subscriptions tracking feature
  if (!canUseFeature('subscriptions_tracking')) {
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
              <View style={styles.headerIconContainer}>
                <MaterialCommunityIcons name="calendar-sync" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text variant="titleLarge" style={styles.headerTitle}>
                  Abbonamenti
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <PremiumGate feature="subscriptions_tracking" showTeaser={false}>
          <View />
        </PremiumGate>
      </SafeAreaView>
    );
  }
  const {
    subscriptions,
    addSubscription,
    updateSubscription,
    deleteSubscription,
    markAsUsed,
    getMonthlyTotal,
    getYearlyTotal,
    getUpcomingRenewals,
    getUnusedSubscriptions,
    getCategorySpending,
    setCategoryBudget,
    categoryBudgets,
  } = useSubscriptionStore();

  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [addModalVisible, setAddModalVisible] = useState(false);
  const [editingSubscription, setEditingSubscription] = useState<Subscription | null>(null);
  const [budgetModalVisible, setBudgetModalVisible] = useState(false);
  const [editingBudgetCategory, setEditingBudgetCategory] = useState<string | null>(null);
  const [budgetAmount, setBudgetAmount] = useState('');

  // Form state
  const [name, setName] = useState('');
  const [amount, setAmount] = useState('');
  const [frequency, setFrequency] = useState<'monthly' | 'quarterly' | 'yearly'>('monthly');
  const [icon, setIcon] = useState('credit-card');
  const [color, setColor] = useState('#6200EE');
  const [categoryId, setCategoryId] = useState<string | null>(null);

  const currency = profile?.main_currency || 'EUR';
  const monthlyTotal = getMonthlyTotal();
  const yearlyTotal = getYearlyTotal();
  const upcomingRenewals = getUpcomingRenewals(7);
  const unusedSubs = getUnusedSubscriptions(60);

  // Group subscriptions
  const groupedSubscriptions = useMemo(() => {
    const active = subscriptions.filter((s) => s.isActive);
    const inactive = subscriptions.filter((s) => !s.isActive);
    return { active, inactive };
  }, [subscriptions]);

  const handleAddSubscription = () => {
    if (!name.trim() || !amount) return;

    addSubscription({
      name: name.trim(),
      icon,
      color,
      amount: parseFloat(amount),
      frequency,
      nextBillingDate: format(new Date(), 'yyyy-MM-dd'),
      categoryId,
      reminderDaysBefore: 3,
      isActive: true,
      lastUsedAt: null,
      notes: null,
    });

    resetForm();
    setAddModalVisible(false);
  };

  const handleEditSubscription = () => {
    if (!editingSubscription || !name.trim() || !amount) return;

    updateSubscription(editingSubscription.id, {
      name: name.trim(),
      icon,
      color,
      amount: parseFloat(amount),
      frequency,
      categoryId,
    });

    resetForm();
    setEditingSubscription(null);
  };

  const handleSelectPreset = (preset: typeof SUBSCRIPTION_PRESETS[0]) => {
    setName(preset.name);
    setAmount(preset.amount.toString());
    setIcon(preset.icon);
    setColor(preset.color);
    setCategoryId(preset.categoryId);
  };

  const handleSaveBudget = () => {
    if (!editingBudgetCategory || !budgetAmount) return;
    const budget = parseFloat(budgetAmount);
    if (isNaN(budget) || budget <= 0) return;
    setCategoryBudget(editingBudgetCategory, budget);
    setBudgetModalVisible(false);
    setEditingBudgetCategory(null);
    setBudgetAmount('');
  };

  const openBudgetModal = (catId: string) => {
    const existing = categoryBudgets.find((b) => b.categoryId === catId);
    setEditingBudgetCategory(catId);
    setBudgetAmount(existing?.budget?.toString() || '');
    setBudgetModalVisible(true);
  };

  const handleEdit = (sub: Subscription) => {
    setEditingSubscription(sub);
    setName(sub.name);
    setAmount(sub.amount.toString());
    setFrequency(sub.frequency);
    setIcon(sub.icon);
    setColor(sub.color);
    setCategoryId(sub.categoryId);
    setMenuVisible(null);
  };

  const resetForm = () => {
    setName('');
    setAmount('');
    setFrequency('monthly');
    setIcon('credit-card');
    setColor('#6200EE');
    setCategoryId(null);
  };

  const getDaysUntilRenewal = (nextBillingDate: string) => {
    return differenceInDays(parseISO(nextBillingDate), new Date());
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
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons name="calendar-sync" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text variant="titleLarge" style={styles.headerTitle}>
                Abbonamenti
              </Text>
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                {formatCurrency(monthlyTotal, currency)}/mese
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Summary Card */}
        <Card style={styles.summaryCard} mode="elevated">
          <Card.Content>
            <View style={styles.summaryRow}>
              <View style={styles.summaryItem}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Costo mensile
                </Text>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: brandColors.error }}>
                  {formatCurrency(monthlyTotal, currency)}
                </Text>
              </View>
              <View style={styles.summaryDivider} />
              <View style={styles.summaryItem}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Costo annuale
                </Text>
                <Text variant="headlineSmall" style={{ fontWeight: 'bold', color: brandColors.error }}>
                  {formatCurrency(yearlyTotal, currency)}
                </Text>
              </View>
            </View>

            <View style={styles.statsRow}>
              <Chip icon="check-circle" style={{ backgroundColor: brandColors.success + '20' }}>
                {groupedSubscriptions.active.length} attivi
              </Chip>
              {upcomingRenewals.length > 0 && (
                <Chip icon="calendar-clock" style={{ backgroundColor: brandColors.warning + '20' }}>
                  {upcomingRenewals.length} in scadenza
                </Chip>
              )}
              {unusedSubs.length > 0 && (
                <Chip icon="alert" style={{ backgroundColor: brandColors.error + '20' }}>
                  {unusedSubs.length} inutilizzati
                </Chip>
              )}
            </View>
          </Card.Content>
        </Card>

        {/* Category Spending with Budgets */}
        {getCategorySpending().length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <View style={styles.categoryHeader}>
                <Text variant="titleMedium">Spese per categoria</Text>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Tocca per impostare budget
                </Text>
              </View>
              {getCategorySpending().map((catSpending) => {
                const category = SUBSCRIPTION_CATEGORIES.find((c) => c.id === catSpending.categoryId);
                if (!category) return null;
                const percentage = catSpending.budget ? (catSpending.spent / catSpending.budget) * 100 : 0;
                const isOverBudget = catSpending.budget && catSpending.spent > catSpending.budget;

                return (
                  <Pressable
                    key={category.id}
                    style={styles.categorySpendingItem}
                    onPress={() => openBudgetModal(category.id)}
                  >
                    <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                      <MaterialCommunityIcons
                        name={category.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={20}
                        color={category.color}
                      />
                    </View>
                    <View style={styles.categorySpendingInfo}>
                      <View style={styles.categorySpendingHeader}>
                        <Text variant="bodyMedium">{category.name}</Text>
                        <Text
                          variant="titleSmall"
                          style={{ color: isOverBudget ? brandColors.error : theme.colors.onSurface }}
                        >
                          {formatCurrency(catSpending.spent, currency)}/mese
                        </Text>
                      </View>
                      {catSpending.budget ? (
                        <>
                          <View style={styles.categoryProgressBar}>
                            <View
                              style={[
                                styles.categoryProgressFill,
                                {
                                  width: `${Math.min(percentage, 100)}%`,
                                  backgroundColor: isOverBudget ? brandColors.error : category.color,
                                },
                              ]}
                            />
                          </View>
                          <Text
                            variant="labelSmall"
                            style={{
                              color: isOverBudget ? brandColors.error : theme.colors.onSurfaceVariant,
                            }}
                          >
                            {isOverBudget
                              ? `Sforato di ${formatCurrency(catSpending.spent - catSpending.budget, currency)}`
                              : `Budget: ${formatCurrency(catSpending.budget, currency)}`}
                          </Text>
                        </>
                      ) : (
                        <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                          Nessun budget impostato
                        </Text>
                      )}
                    </View>
                    <MaterialCommunityIcons
                      name="chevron-right"
                      size={20}
                      color={theme.colors.onSurfaceVariant}
                    />
                  </Pressable>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* Upcoming Renewals */}
        {upcomingRenewals.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={{ marginBottom: spacing.md }}>
                Prossimi rinnovi (7 giorni)
              </Text>
              {upcomingRenewals.map((sub) => {
                const daysUntil = getDaysUntilRenewal(sub.nextBillingDate);
                return (
                  <View key={sub.id} style={styles.renewalItem}>
                    <View style={[styles.subIcon, { backgroundColor: sub.color + '20' }]}>
                      <MaterialCommunityIcons
                        name={sub.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={20}
                        color={sub.color}
                      />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium">{sub.name}</Text>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {daysUntil === 0
                          ? 'Oggi'
                          : daysUntil === 1
                          ? 'Domani'
                          : `Tra ${daysUntil} giorni`}
                      </Text>
                    </View>
                    <Text variant="titleMedium" style={{ color: brandColors.error, fontWeight: 'bold' }}>
                      {formatCurrency(sub.amount, currency)}
                    </Text>
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* Unused Subscriptions Alert */}
        {unusedSubs.length > 0 && (
          <Card
            style={[styles.card, { backgroundColor: brandColors.warning + '10' }]}
            mode="elevated"
          >
            <Card.Content>
              <View style={styles.alertHeader}>
                <MaterialCommunityIcons name="alert" size={24} color={brandColors.warning} />
                <Text variant="titleMedium" style={{ marginLeft: 8 }}>
                  Abbonamenti inutilizzati
                </Text>
              </View>
              <Text
                variant="bodyMedium"
                style={{ color: theme.colors.onSurfaceVariant, marginTop: 4 }}
              >
                Questi abbonamenti non sono stati usati negli ultimi 60 giorni. Considera di cancellarli.
              </Text>
              <View style={{ marginTop: spacing.sm }}>
                {unusedSubs.map((sub) => (
                  <Chip
                    key={sub.id}
                    icon="close"
                    style={{ marginRight: 8, marginTop: 8 }}
                    onPress={() => updateSubscription(sub.id, { isActive: false })}
                  >
                    {sub.name} • {formatCurrency(sub.amount, currency)}/
                    {sub.frequency === 'monthly' ? 'mese' : sub.frequency === 'quarterly' ? 'trim' : 'anno'}
                  </Chip>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Active Subscriptions */}
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Abbonamenti attivi ({groupedSubscriptions.active.length})
        </Text>

        {groupedSubscriptions.active.map((sub) => (
          <Surface key={sub.id} style={styles.subscriptionCard} elevation={1}>
            <View style={[styles.subIcon, { backgroundColor: sub.color + '20' }]}>
              <MaterialCommunityIcons
                name={sub.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={24}
                color={sub.color}
              />
            </View>

            <View style={styles.subInfo}>
              <Text variant="titleMedium">{sub.name}</Text>
              <View style={styles.subMeta}>
                <Chip compact style={{ marginRight: 8 }}>
                  {FREQUENCY_LABELS[sub.frequency]}
                </Chip>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Prossimo: {format(parseISO(sub.nextBillingDate), 'd MMM', { locale: it })}
                </Text>
              </View>
            </View>

            <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
              {formatCurrency(sub.amount, currency)}
            </Text>

            <Menu
              visible={menuVisible === sub.id}
              onDismiss={() => setMenuVisible(null)}
              anchor={
                <IconButton icon="dots-vertical" onPress={() => setMenuVisible(sub.id)} />
              }
            >
              <Menu.Item
                leadingIcon="check"
                onPress={() => {
                  markAsUsed(sub.id);
                  setMenuVisible(null);
                }}
                title="Segna come usato"
              />
              <Menu.Item
                leadingIcon="pencil"
                onPress={() => handleEdit(sub)}
                title="Modifica"
              />
              <Menu.Item
                leadingIcon="pause"
                onPress={() => {
                  updateSubscription(sub.id, { isActive: false });
                  setMenuVisible(null);
                }}
                title="Disattiva"
              />
              <Divider />
              <Menu.Item
                leadingIcon="delete"
                onPress={() => {
                  deleteSubscription(sub.id);
                  setMenuVisible(null);
                }}
                title="Elimina"
                titleStyle={{ color: brandColors.error }}
              />
            </Menu>
          </Surface>
        ))}

        {/* Inactive Subscriptions */}
        {groupedSubscriptions.inactive.length > 0 && (
          <>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Disattivati ({groupedSubscriptions.inactive.length})
            </Text>

            {groupedSubscriptions.inactive.map((sub) => (
              <Surface
                key={sub.id}
                style={[styles.subscriptionCard, { opacity: 0.6 }]}
                elevation={0}
              >
                <View style={[styles.subIcon, { backgroundColor: '#E0E0E0' }]}>
                  <MaterialCommunityIcons
                    name={sub.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={24}
                    color="#9E9E9E"
                  />
                </View>

                <View style={styles.subInfo}>
                  <Text variant="titleMedium">{sub.name}</Text>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Disattivato
                  </Text>
                </View>

                <Text variant="titleMedium">{formatCurrency(sub.amount, currency)}</Text>

                <IconButton
                  icon="play"
                  onPress={() => updateSubscription(sub.id, { isActive: true })}
                />
              </Surface>
            ))}
          </>
        )}

        {/* Empty State */}
        {subscriptions.length === 0 && (
          <Surface style={styles.emptyState} elevation={1}>
            <MaterialCommunityIcons
              name="calendar-sync"
              size={64}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.md }}
            >
              Nessun abbonamento tracciato
            </Text>
            <Button mode="contained" onPress={() => setAddModalVisible(true)} style={{ marginTop: spacing.md }}>
              Aggiungi il primo
            </Button>
          </Surface>
        )}

        <View style={{ height: 80 + insets.bottom }} />
      </ScrollView>

      {/* Gradient FAB */}
      <Pressable
        onPress={() => setAddModalVisible(true)}
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

      {/* Add/Edit Modal */}
      <Portal>
        <Modal
          visible={addModalVisible || editingSubscription !== null}
          onDismiss={() => {
            setAddModalVisible(false);
            setEditingSubscription(null);
            resetForm();
          }}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <ScrollView>
            <Text variant="titleLarge" style={{ marginBottom: spacing.lg }}>
              {editingSubscription ? 'Modifica abbonamento' : 'Nuovo abbonamento'}
            </Text>

            {/* Presets */}
            {!editingSubscription && (
              <View style={styles.presets}>
                <Text variant="labelLarge" style={{ marginBottom: spacing.sm }}>
                  Scegli un preset
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {SUBSCRIPTION_PRESETS.map((preset) => (
                    <Pressable
                      key={preset.name}
                      style={[
                        styles.presetItem,
                        name === preset.name && { borderColor: theme.colors.primary, borderWidth: 2 },
                      ]}
                      onPress={() => handleSelectPreset(preset)}
                    >
                      <MaterialCommunityIcons
                        name={preset.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={24}
                        color={preset.color}
                      />
                      <Text variant="labelSmall" numberOfLines={1}>
                        {preset.name}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </View>
            )}

            <TextInput
              label="Nome"
              value={name}
              onChangeText={setName}
              mode="outlined"
              style={styles.input}
            />

            <TextInput
              label="Importo (€)"
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="currency-eur" />}
            />

            <Text variant="labelLarge" style={{ marginBottom: spacing.sm }}>
              Frequenza
            </Text>
            <SegmentedButtons
              value={frequency}
              onValueChange={(v) => setFrequency(v as typeof frequency)}
              buttons={[
                { value: 'monthly', label: 'Mensile' },
                { value: 'quarterly', label: 'Trim.' },
                { value: 'yearly', label: 'Annuale' },
              ]}
              style={{ marginBottom: spacing.md }}
            />

            <Text variant="labelLarge" style={{ marginBottom: spacing.sm }}>
              Categoria
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
              {SUBSCRIPTION_CATEGORIES.map((cat) => (
                <Pressable
                  key={cat.id}
                  style={[
                    styles.categoryChip,
                    categoryId === cat.id && { borderColor: cat.color, borderWidth: 2 },
                  ]}
                  onPress={() => setCategoryId(cat.id)}
                >
                  <MaterialCommunityIcons
                    name={cat.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={18}
                    color={categoryId === cat.id ? cat.color : theme.colors.onSurfaceVariant}
                  />
                  <Text
                    variant="labelSmall"
                    style={{ color: categoryId === cat.id ? cat.color : theme.colors.onSurfaceVariant }}
                  >
                    {cat.name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>

            <View style={styles.modalActions}>
              <Button
                mode="outlined"
                onPress={() => {
                  setAddModalVisible(false);
                  setEditingSubscription(null);
                  resetForm();
                }}
              >
                Annulla
              </Button>
              <Button
                mode="contained"
                onPress={editingSubscription ? handleEditSubscription : handleAddSubscription}
                disabled={!name.trim() || !amount}
              >
                {editingSubscription ? 'Salva' : 'Aggiungi'}
              </Button>
            </View>
          </ScrollView>
        </Modal>

        {/* Budget Modal */}
        <Modal
          visible={budgetModalVisible}
          onDismiss={() => {
            setBudgetModalVisible(false);
            setEditingBudgetCategory(null);
            setBudgetAmount('');
          }}
          contentContainerStyle={[styles.budgetModal, { backgroundColor: theme.colors.surface }]}
        >
          {editingBudgetCategory && (
            <>
              {(() => {
                const category = SUBSCRIPTION_CATEGORIES.find((c) => c.id === editingBudgetCategory);
                if (!category) return null;
                return (
                  <>
                    <View style={styles.budgetModalHeader}>
                      <View style={[styles.categoryIcon, { backgroundColor: category.color + '20' }]}>
                        <MaterialCommunityIcons
                          name={category.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                          size={24}
                          color={category.color}
                        />
                      </View>
                      <Text variant="titleLarge" style={{ marginLeft: spacing.md }}>
                        Budget {category.name}
                      </Text>
                    </View>

                    <TextInput
                      label="Budget mensile"
                      value={budgetAmount}
                      onChangeText={setBudgetAmount}
                      keyboardType="numeric"
                      mode="outlined"
                      style={{ marginTop: spacing.lg }}
                      left={<TextInput.Icon icon="currency-eur" />}
                      placeholder="Es: 30"
                    />

                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.sm }}>
                      Imposta un budget mensile per questa categoria di abbonamenti.
                      Riceverai un avviso se lo superi.
                    </Text>

                    <View style={styles.modalActions}>
                      <Button
                        mode="outlined"
                        onPress={() => {
                          setBudgetModalVisible(false);
                          setEditingBudgetCategory(null);
                          setBudgetAmount('');
                        }}
                      >
                        Annulla
                      </Button>
                      <Button
                        mode="contained"
                        onPress={handleSaveBudget}
                        disabled={!budgetAmount}
                      >
                        Salva
                      </Button>
                    </View>
                  </>
                );
              })()}
            </>
          )}
        </Modal>
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
  content: {
    padding: spacing.md,
  },
  summaryCard: {
    marginBottom: spacing.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryDivider: {
    width: 1,
    backgroundColor: '#E0E0E0',
  },
  statsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  card: {
    marginBottom: spacing.md,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  renewalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  sectionTitle: {
    marginTop: spacing.md,
    marginBottom: spacing.sm,
    fontWeight: 'bold',
  },
  subscriptionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 12,
    marginBottom: spacing.sm,
  },
  subIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  subInfo: {
    flex: 1,
  },
  subMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: 12,
    marginTop: spacing.lg,
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
  modal: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    maxHeight: '80%',
  },
  presets: {
    marginBottom: spacing.md,
  },
  presetItem: {
    width: 72,
    height: 72,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    marginRight: spacing.sm,
    padding: spacing.xs,
    gap: 4,
  },
  input: {
    marginBottom: spacing.md,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  categorySpendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  categorySpendingInfo: {
    flex: 1,
  },
  categorySpendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryProgressBar: {
    height: 6,
    backgroundColor: '#E0E0E0',
    borderRadius: 3,
    marginVertical: 4,
  },
  categoryProgressFill: {
    height: 6,
    borderRadius: 3,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    marginRight: spacing.sm,
    gap: spacing.xs,
  },
  budgetModal: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
  },
  budgetModalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});
