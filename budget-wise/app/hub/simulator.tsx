import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  TextInput,
  Button,
  Surface,
  SegmentedButtons,
  Divider,
  Chip,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import { useTransactionStore } from '../../stores/transactionStore';
import { useGoalStore } from '../../stores/goalStore';
import { useAuthStore } from '../../stores/authStore';
import { spacing, brandColors } from '../../constants/theme';
import { formatCurrency } from '../../constants/currencies';

type ScenarioType = 'save_more' | 'reduce_expense' | 'new_income' | 'goal_acceleration';

interface Scenario {
  type: ScenarioType;
  title: string;
  icon: string;
  description: string;
}

const SCENARIOS: Scenario[] = [
  {
    type: 'save_more',
    title: 'Risparmia di più',
    icon: 'piggy-bank',
    description: 'Cosa succede se risparmi X€ in più al mese?',
  },
  {
    type: 'reduce_expense',
    title: 'Riduci una spesa',
    icon: 'scissors-cutting',
    description: 'Cosa succede se tagli una spesa?',
  },
  {
    type: 'new_income',
    title: 'Nuova entrata',
    icon: 'cash-plus',
    description: 'Cosa succede con un\'entrata extra?',
  },
  {
    type: 'goal_acceleration',
    title: 'Accelera obiettivo',
    icon: 'rocket',
    description: 'Come raggiungere un obiettivo prima?',
  },
];

export default function SimulatorScreen() {
  const theme = useTheme();
  const { profile } = useAuthStore();
  const { transactions } = useTransactionStore();
  const { goals } = useGoalStore();

  const [selectedScenario, setSelectedScenario] = useState<ScenarioType>('save_more');
  const [amount, setAmount] = useState('');
  const [months, setMonths] = useState('12');
  const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);

  const currency = profile?.main_currency || 'EUR';

  // Current monthly averages
  const currentStats = useMemo(() => {
    const now = new Date();
    const lastMonths = 3;
    const cutoff = new Date(now.getFullYear(), now.getMonth() - lastMonths, 1);

    const recentTransactions = transactions.filter((t) => new Date(t.date) >= cutoff);

    const totalIncome = recentTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = recentTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      monthlyIncome: totalIncome / lastMonths,
      monthlyExpenses: totalExpenses / lastMonths,
      monthlySavings: (totalIncome - totalExpenses) / lastMonths,
    };
  }, [transactions]);

  // Active goals
  const activeGoals = goals.filter((g) => !g.is_completed);
  const selectedGoal = activeGoals.find((g) => g.id === selectedGoalId);

  // Simulation results
  const simulationResults = useMemo(() => {
    const amountNum = parseFloat(amount) || 0;
    const monthsNum = parseInt(months, 10) || 12;

    switch (selectedScenario) {
      case 'save_more': {
        const newMonthlySavings = currentStats.monthlySavings + amountNum;
        const totalExtraSaved = amountNum * monthsNum;
        const yearlyExtra = amountNum * 12;

        return {
          title: 'Risparmiando ' + formatCurrency(amountNum, currency) + '/mese',
          metrics: [
            {
              label: 'Risparmio mensile totale',
              current: currentStats.monthlySavings,
              new: newMonthlySavings,
              positive: true,
            },
            {
              label: `Extra in ${monthsNum} mesi`,
              current: 0,
              new: totalExtraSaved,
              positive: true,
            },
            {
              label: 'Extra in 1 anno',
              current: 0,
              new: yearlyExtra,
              positive: true,
            },
          ],
          insight: totalExtraSaved > 1000
            ? `Con questo ritmo potresti creare un fondo emergenza in ${Math.ceil(3000 / amountNum)} mesi!`
            : `Piccoli passi! In un anno avrai ${formatCurrency(yearlyExtra, currency)} in più.`,
        };
      }

      case 'reduce_expense': {
        const newMonthlyExpenses = currentStats.monthlyExpenses - amountNum;
        const newSavings = currentStats.monthlySavings + amountNum;
        const yearlyReduction = amountNum * 12;

        return {
          title: 'Tagliando ' + formatCurrency(amountNum, currency) + '/mese',
          metrics: [
            {
              label: 'Spese mensili',
              current: currentStats.monthlyExpenses,
              new: newMonthlyExpenses,
              positive: false,
            },
            {
              label: 'Nuovo risparmio mensile',
              current: currentStats.monthlySavings,
              new: newSavings,
              positive: true,
            },
            {
              label: 'Risparmio annuo',
              current: 0,
              new: yearlyReduction,
              positive: true,
            },
          ],
          insight: amountNum >= 50
            ? `Tagliare ${formatCurrency(amountNum, currency)}/mese equivale a ${formatCurrency(yearlyReduction, currency)}/anno - potresti finanziare una vacanza!`
            : `Ogni taglio conta! ${formatCurrency(yearlyReduction, currency)} in più all'anno.`,
        };
      }

      case 'new_income': {
        const newMonthlyIncome = currentStats.monthlyIncome + amountNum;
        const newSavings = currentStats.monthlySavings + amountNum;
        const yearlyExtra = amountNum * 12;

        return {
          title: 'Con ' + formatCurrency(amountNum, currency) + '/mese in più',
          metrics: [
            {
              label: 'Entrate mensili',
              current: currentStats.monthlyIncome,
              new: newMonthlyIncome,
              positive: true,
            },
            {
              label: 'Nuovo risparmio mensile',
              current: currentStats.monthlySavings,
              new: newSavings,
              positive: true,
            },
            {
              label: 'Extra annuo',
              current: 0,
              new: yearlyExtra,
              positive: true,
            },
          ],
          insight: amountNum >= 200
            ? `Un'entrata extra di ${formatCurrency(amountNum, currency)}/mese potrebbe accelerare i tuoi obiettivi del ${Math.round((amountNum / Math.max(currentStats.monthlySavings, 1)) * 100)}%!`
            : `Anche piccole entrate extra fanno la differenza nel tempo.`,
        };
      }

      case 'goal_acceleration': {
        if (!selectedGoal) {
          return {
            title: 'Seleziona un obiettivo',
            metrics: [],
            insight: 'Scegli un obiettivo per vedere come accelerarlo.',
          };
        }

        const remaining = selectedGoal.target_amount - selectedGoal.current_amount;
        const currentMonthsToGoal = remaining / (selectedGoal.monthly_allocation || 100);
        const newAllocation = (selectedGoal.monthly_allocation || 100) + amountNum;
        const newMonthsToGoal = remaining / newAllocation;
        const monthsSaved = currentMonthsToGoal - newMonthsToGoal;

        return {
          title: `Accelerando "${selectedGoal.name}"`,
          metrics: [
            {
              label: 'Contributo mensile',
              current: selectedGoal.monthly_allocation || 100,
              new: newAllocation,
              positive: true,
            },
            {
              label: 'Mesi per raggiungere',
              current: Math.ceil(currentMonthsToGoal),
              new: Math.ceil(newMonthsToGoal),
              positive: false,
            },
            {
              label: 'Mesi risparmiati',
              current: 0,
              new: Math.floor(monthsSaved),
              positive: true,
            },
          ],
          insight: monthsSaved >= 1
            ? `Aggiungendo ${formatCurrency(amountNum, currency)}/mese raggiungerai l'obiettivo ${Math.floor(monthsSaved)} mes${monthsSaved > 1 ? 'i' : 'e'} prima!`
            : `Continua così! Ogni contributo ti avvicina all'obiettivo.`,
        };
      }

      default:
        return { title: '', metrics: [], insight: '' };
    }
  }, [selectedScenario, amount, months, selectedGoal, currentStats, currency]);

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        {/* Current Stats */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: spacing.md }}>
              La tua situazione attuale
            </Text>
            <View style={styles.currentStats}>
              <View style={styles.statItem}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Entrate/mese
                </Text>
                <Text variant="titleMedium" style={{ color: brandColors.success }}>
                  {formatCurrency(currentStats.monthlyIncome, currency)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Spese/mese
                </Text>
                <Text variant="titleMedium" style={{ color: brandColors.error }}>
                  {formatCurrency(currentStats.monthlyExpenses, currency)}
                </Text>
              </View>
              <View style={styles.statItem}>
                <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  Risparmio/mese
                </Text>
                <Text
                  variant="titleMedium"
                  style={{
                    color: currentStats.monthlySavings >= 0 ? brandColors.success : brandColors.error,
                  }}
                >
                  {formatCurrency(currentStats.monthlySavings, currency)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Scenario Selection */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: spacing.md }}>
              Scegli uno scenario
            </Text>

            <View style={styles.scenarioGrid}>
              {SCENARIOS.map((scenario) => (
                <Surface
                  key={scenario.type}
                  style={[
                    styles.scenarioCard,
                    selectedScenario === scenario.type && {
                      borderWidth: 2,
                      borderColor: theme.colors.primary,
                    },
                  ]}
                  elevation={selectedScenario === scenario.type ? 2 : 1}
                >
                  <Button
                    mode="text"
                    onPress={() => setSelectedScenario(scenario.type)}
                    style={styles.scenarioButton}
                    contentStyle={styles.scenarioContent}
                  >
                    <View style={styles.scenarioInner}>
                      <MaterialCommunityIcons
                        name={scenario.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={28}
                        color={
                          selectedScenario === scenario.type
                            ? theme.colors.primary
                            : theme.colors.onSurfaceVariant
                        }
                      />
                      <Text
                        variant="labelMedium"
                        style={{
                          textAlign: 'center',
                          marginTop: 4,
                          color:
                            selectedScenario === scenario.type
                              ? theme.colors.primary
                              : theme.colors.onSurface,
                        }}
                      >
                        {scenario.title}
                      </Text>
                    </View>
                  </Button>
                </Surface>
              ))}
            </View>
          </Card.Content>
        </Card>

        {/* Input Section */}
        <Card style={styles.card} mode="elevated">
          <Card.Content>
            <Text variant="titleMedium" style={{ marginBottom: spacing.md }}>
              Imposta i parametri
            </Text>

            <TextInput
              label={selectedScenario === 'goal_acceleration' ? 'Extra mensile (€)' : 'Importo mensile (€)'}
              value={amount}
              onChangeText={setAmount}
              keyboardType="numeric"
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="currency-eur" />}
            />

            {selectedScenario !== 'goal_acceleration' && (
              <View style={styles.monthsSelector}>
                <Text variant="bodyMedium" style={{ marginBottom: spacing.sm }}>
                  Periodo di simulazione
                </Text>
                <SegmentedButtons
                  value={months}
                  onValueChange={setMonths}
                  buttons={[
                    { value: '6', label: '6 mesi' },
                    { value: '12', label: '1 anno' },
                    { value: '24', label: '2 anni' },
                    { value: '60', label: '5 anni' },
                  ]}
                />
              </View>
            )}

            {selectedScenario === 'goal_acceleration' && activeGoals.length > 0 && (
              <View style={styles.goalSelector}>
                <Text variant="bodyMedium" style={{ marginBottom: spacing.sm }}>
                  Seleziona obiettivo
                </Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {activeGoals.map((goal) => (
                    <Chip
                      key={goal.id}
                      selected={selectedGoalId === goal.id}
                      onPress={() => setSelectedGoalId(goal.id)}
                      style={{ marginRight: spacing.sm }}
                      showSelectedCheck
                    >
                      {goal.name}
                    </Chip>
                  ))}
                </ScrollView>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Results */}
        {parseFloat(amount) > 0 && (
          <Card style={styles.resultCard} mode="elevated">
            <Card.Content>
              <View style={styles.resultHeader}>
                <MaterialCommunityIcons name="lightbulb" size={24} color={brandColors.warning} />
                <Text variant="titleMedium" style={{ marginLeft: 8, fontWeight: 'bold' }}>
                  {simulationResults.title}
                </Text>
              </View>

              <Divider style={{ marginVertical: spacing.md }} />

              {simulationResults.metrics.map((metric, i) => (
                <View key={i} style={styles.metricRow}>
                  <Text variant="bodyMedium" style={{ flex: 1 }}>
                    {metric.label}
                  </Text>
                  <View style={styles.metricValues}>
                    {metric.current > 0 && (
                      <Text
                        variant="bodyMedium"
                        style={{ color: theme.colors.onSurfaceVariant, textDecorationLine: 'line-through' }}
                      >
                        {typeof metric.current === 'number' && metric.label.includes('Mesi')
                          ? metric.current
                          : formatCurrency(metric.current, currency)}
                      </Text>
                    )}
                    <MaterialCommunityIcons
                      name="arrow-right"
                      size={16}
                      color={theme.colors.onSurfaceVariant}
                      style={{ marginHorizontal: 8 }}
                    />
                    <Text
                      variant="titleMedium"
                      style={{
                        fontWeight: 'bold',
                        color: metric.positive ? brandColors.success : brandColors.error,
                      }}
                    >
                      {typeof metric.new === 'number' && metric.label.includes('Mesi')
                        ? metric.new
                        : formatCurrency(metric.new, currency)}
                    </Text>
                  </View>
                </View>
              ))}

              <Surface style={styles.insightBox} elevation={0}>
                <MaterialCommunityIcons name="lightbulb-on" size={20} color={theme.colors.primary} />
                <Text variant="bodyMedium" style={{ flex: 1, marginLeft: 8 }}>
                  {simulationResults.insight}
                </Text>
              </Surface>
            </Card.Content>
          </Card>
        )}

        {/* Empty state */}
        {parseFloat(amount) <= 0 && (
          <Surface style={styles.emptyState} elevation={1}>
            <MaterialCommunityIcons
              name="calculator-variant"
              size={64}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.md, textAlign: 'center' }}
            >
              Inserisci un importo per vedere la simulazione
            </Text>
          </Surface>
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
  card: {
    marginBottom: spacing.md,
  },
  currentStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  scenarioGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  scenarioCard: {
    width: '48%',
    borderRadius: 12,
    overflow: 'hidden',
  },
  scenarioButton: {
    width: '100%',
  },
  scenarioContent: {
    height: 80,
  },
  scenarioInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  input: {
    marginBottom: spacing.md,
  },
  monthsSelector: {
    marginTop: spacing.sm,
  },
  goalSelector: {
    marginTop: spacing.md,
  },
  resultCard: {
    marginBottom: spacing.md,
    backgroundColor: '#F5F5F5',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  metricRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  metricValues: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  insightBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: 8,
    marginTop: spacing.md,
    backgroundColor: '#E3F2FD',
  },
  emptyState: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: 12,
  },
});
