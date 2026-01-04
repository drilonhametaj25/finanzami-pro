import React, { useState, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Pressable } from 'react-native';
import {
  Text,
  Card,
  useTheme,
  FAB,
  Surface,
  Chip,
  IconButton,
  Menu,
  Divider,
  Portal,
  Modal,
  Button,
  TextInput,
  ProgressBar,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

import {
  usePatrimonioStore,
  Investment,
  BankAccount,
  Debt,
  getInvestmentTypeLabel,
  getInvestmentTypeConfig,
  InvestmentType,
} from '../../stores/patrimonioStore';
import { useAuthStore } from '../../stores/authStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { PremiumGate } from '../../components/premium/PremiumGate';
import { spacing, borderRadius, brandColors } from '../../constants/theme';
import { formatCurrency } from '../../constants/currencies';

type ViewMode = 'overview' | 'investments' | 'accounts' | 'debts';

const INVESTMENT_TYPES: { type: InvestmentType; label: string }[] = [
  { type: 'etf', label: 'ETF' },
  { type: 'stocks', label: 'Azioni' },
  { type: 'bonds', label: 'Obbligazioni' },
  { type: 'crypto', label: 'Crypto' },
  { type: 'real_estate', label: 'Immobili' },
  { type: 'other', label: 'Altro' },
];

export default function PatrimonioScreen() {
  const theme = useTheme();
  const { profile } = useAuthStore();
  const { canUseFeature } = usePremiumStore();

  // Check if user can access patrimonio feature
  if (!canUseFeature('patrimonio')) {
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
                <MaterialCommunityIcons name="bank" size={28} color="#FFFFFF" />
              </View>
              <View style={styles.headerTextContainer}>
                <Text variant="titleLarge" style={styles.headerTitle}>
                  Patrimonio
                </Text>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <PremiumGate feature="patrimonio" showTeaser={false}>
          <View />
        </PremiumGate>
      </SafeAreaView>
    );
  }
  const {
    investments,
    bankAccounts,
    debts,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    addToInvestment,
    updateInvestmentValue,
    addBankAccount,
    updateBankAccount,
    deleteBankAccount,
    addDebt,
    updateDebt,
    deleteDebt,
    getTotalInvestments,
    getTotalInvested,
    getInvestmentPerformance,
    getTotalBankBalance,
    getTotalDebts,
    getNetWorth,
    getAssetAllocation,
  } = usePatrimonioStore();

  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [menuVisible, setMenuVisible] = useState<string | null>(null);
  const [fabOpen, setFabOpen] = useState(false);

  // Add modals
  const [addInvestmentModal, setAddInvestmentModal] = useState(false);
  const [addAccountModal, setAddAccountModal] = useState(false);
  const [addDebtModal, setAddDebtModal] = useState(false);
  const [addFundsModal, setAddFundsModal] = useState<Investment | null>(null);

  // Form states
  const [investmentName, setInvestmentName] = useState('');
  const [investmentType, setInvestmentType] = useState<InvestmentType>('etf');
  const [investmentAmount, setInvestmentAmount] = useState('');

  const [accountName, setAccountName] = useState('');
  const [accountType, setAccountType] = useState<'checking' | 'savings' | 'cash'>('checking');
  const [accountBalance, setAccountBalance] = useState('');

  const [debtName, setDebtName] = useState('');
  const [debtAmount, setDebtAmount] = useState('');
  const [debtRemaining, setDebtRemaining] = useState('');
  const [debtRate, setDebtRate] = useState('');

  const [fundsAmount, setFundsAmount] = useState('');

  const currency = profile?.main_currency || 'EUR';

  const totalInvestments = getTotalInvestments();
  const totalInvested = getTotalInvested();
  const performance = getInvestmentPerformance();
  const totalBankBalance = getTotalBankBalance();
  const totalDebts = getTotalDebts();
  const netWorth = getNetWorth();
  const allocation = getAssetAllocation();

  // Allocation colors
  const allocationColors = [
    '#2196F3', '#4CAF50', '#FF9800', '#E91E63', '#9C27B0', '#00BCD4', '#795548',
  ];

  const handleAddInvestment = () => {
    if (!investmentName.trim() || !investmentAmount) return;

    const config = getInvestmentTypeConfig(investmentType);
    addInvestment({
      name: investmentName.trim(),
      type: investmentType,
      icon: config.icon,
      color: config.color,
      totalInvested: parseFloat(investmentAmount),
      currentValue: parseFloat(investmentAmount),
      notes: null,
    });

    setInvestmentName('');
    setInvestmentType('etf');
    setInvestmentAmount('');
    setAddInvestmentModal(false);
  };

  const handleAddAccount = () => {
    if (!accountName.trim() || !accountBalance) return;

    const iconMap = { checking: 'bank', savings: 'piggy-bank', cash: 'cash' };
    const colorMap = { checking: '#2196F3', savings: '#4CAF50', cash: '#FF9800' };

    addBankAccount({
      name: accountName.trim(),
      type: accountType,
      balance: parseFloat(accountBalance),
      icon: iconMap[accountType],
      color: colorMap[accountType],
      isPrimary: bankAccounts.length === 0,
    });

    setAccountName('');
    setAccountType('checking');
    setAccountBalance('');
    setAddAccountModal(false);
  };

  const handleAddDebt = () => {
    if (!debtName.trim() || !debtAmount || !debtRemaining) return;

    addDebt({
      name: debtName.trim(),
      type: 'loan',
      totalAmount: parseFloat(debtAmount),
      remainingAmount: parseFloat(debtRemaining),
      interestRate: parseFloat(debtRate) || 0,
      monthlyPayment: 0,
      icon: 'credit-card',
      color: '#F44336',
    });

    setDebtName('');
    setDebtAmount('');
    setDebtRemaining('');
    setDebtRate('');
    setAddDebtModal(false);
  };

  const handleAddFunds = () => {
    if (!addFundsModal || !fundsAmount) return;

    addToInvestment(addFundsModal.id, parseFloat(fundsAmount));
    setFundsAmount('');
    setAddFundsModal(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]} edges={['bottom']}>
      {/* Gradient Header */}
      <LinearGradient
        colors={netWorth >= 0 ? [brandColors.gradientStart, brandColors.gradientEnd] : [brandColors.error, '#B71C1C']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <SafeAreaView edges={['top']}>
          <View style={styles.headerContent}>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons name="bank" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text variant="titleLarge" style={styles.headerTitle}>
                Patrimonio
              </Text>
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                {formatCurrency(netWorth, currency)}
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Net Worth Card */}
        <Card style={styles.mainCard} mode="elevated">
          <Card.Content>
            <Text variant="labelLarge" style={{ color: theme.colors.onSurfaceVariant }}>
              Patrimonio Netto
            </Text>
            <Text
              variant="displaySmall"
              style={{
                fontWeight: 'bold',
                color: netWorth >= 0 ? brandColors.success : brandColors.error,
              }}
            >
              {formatCurrency(netWorth, currency)}
            </Text>

            <View style={styles.netWorthBreakdown}>
              <View style={styles.breakdownItem}>
                <MaterialCommunityIcons name="bank" size={20} color="#2196F3" />
                <Text variant="bodySmall">Liquidità</Text>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                  {formatCurrency(totalBankBalance, currency)}
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <MaterialCommunityIcons name="chart-line" size={20} color="#4CAF50" />
                <Text variant="bodySmall">Investimenti</Text>
                <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                  {formatCurrency(totalInvestments, currency)}
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <MaterialCommunityIcons name="credit-card" size={20} color="#F44336" />
                <Text variant="bodySmall">Debiti</Text>
                <Text variant="titleMedium" style={{ fontWeight: 'bold', color: brandColors.error }}>
                  -{formatCurrency(totalDebts, currency)}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Asset Allocation */}
        {allocation.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={{ marginBottom: spacing.md }}>
                Allocazione Asset
              </Text>

              <View style={styles.allocationChart}>
                <Svg width={120} height={120}>
                  {allocation.reduce(
                    (acc, item, index) => {
                      const startAngle = acc.currentAngle;
                      const sweepAngle = (item.percentage / 100) * 360;
                      const endAngle = startAngle + sweepAngle;

                      // Convert to radians for SVG arc
                      const startRad = ((startAngle - 90) * Math.PI) / 180;
                      const endRad = ((endAngle - 90) * Math.PI) / 180;

                      const x1 = 60 + 50 * Math.cos(startRad);
                      const y1 = 60 + 50 * Math.sin(startRad);
                      const x2 = 60 + 50 * Math.cos(endRad);
                      const y2 = 60 + 50 * Math.sin(endRad);

                      const largeArc = sweepAngle > 180 ? 1 : 0;

                      acc.elements.push(
                        <Circle
                          key={item.type}
                          cx={60}
                          cy={60}
                          r={40}
                          stroke={allocationColors[index % allocationColors.length]}
                          strokeWidth={20}
                          fill="none"
                          strokeDasharray={`${(item.percentage / 100) * 251.2} 251.2`}
                          strokeDashoffset={-acc.offset}
                          strokeLinecap="butt"
                        />
                      );

                      return {
                        currentAngle: endAngle,
                        elements: acc.elements,
                        offset: acc.offset + (item.percentage / 100) * 251.2,
                      };
                    },
                    { currentAngle: 0, elements: [] as React.ReactElement[], offset: 0 }
                  ).elements}
                </Svg>

                <View style={styles.allocationLegend}>
                  {allocation.map((item, index) => (
                    <View key={item.type} style={styles.legendItem}>
                      <View
                        style={[
                          styles.legendDot,
                          { backgroundColor: allocationColors[index % allocationColors.length] },
                        ]}
                      />
                      <Text variant="bodySmall" style={{ flex: 1 }}>
                        {item.type}
                      </Text>
                      <Text variant="bodySmall" style={{ fontWeight: 'bold' }}>
                        {item.percentage.toFixed(1)}%
                      </Text>
                    </View>
                  ))}
                </View>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Investments Performance */}
        {investments.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium">Investimenti</Text>
                <Chip
                  icon={performance >= 0 ? 'trending-up' : 'trending-down'}
                  style={{
                    backgroundColor: performance >= 0 ? brandColors.success + '20' : brandColors.error + '20',
                  }}
                  textStyle={{ color: performance >= 0 ? brandColors.success : brandColors.error }}
                >
                  {performance >= 0 ? '+' : ''}{performance.toFixed(2)}%
                </Chip>
              </View>

              <View style={styles.investmentSummary}>
                <View>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Investito
                  </Text>
                  <Text variant="titleMedium">{formatCurrency(totalInvested, currency)}</Text>
                </View>
                <MaterialCommunityIcons name="arrow-right" size={20} color={theme.colors.onSurfaceVariant} />
                <View>
                  <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Valore attuale
                  </Text>
                  <Text
                    variant="titleMedium"
                    style={{ color: performance >= 0 ? brandColors.success : brandColors.error }}
                  >
                    {formatCurrency(totalInvestments, currency)}
                  </Text>
                </View>
              </View>

              <Divider style={{ marginVertical: spacing.md }} />

              {investments.map((inv) => {
                const invPerformance = inv.totalInvested > 0
                  ? ((inv.currentValue - inv.totalInvested) / inv.totalInvested) * 100
                  : 0;

                return (
                  <View key={inv.id} style={styles.investmentItem}>
                    <View style={[styles.investmentIcon, { backgroundColor: inv.color + '20' }]}>
                      <MaterialCommunityIcons
                        name={inv.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                        size={24}
                        color={inv.color}
                      />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text variant="bodyLarge">{inv.name}</Text>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        {getInvestmentTypeLabel(inv.type)} • Investito: {formatCurrency(inv.totalInvested, currency)}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                        {formatCurrency(inv.currentValue, currency)}
                      </Text>
                      <Text
                        variant="labelSmall"
                        style={{
                          color: invPerformance >= 0 ? brandColors.success : brandColors.error,
                        }}
                      >
                        {invPerformance >= 0 ? '+' : ''}{invPerformance.toFixed(1)}%
                      </Text>
                    </View>

                    <Menu
                      visible={menuVisible === `inv-${inv.id}`}
                      onDismiss={() => setMenuVisible(null)}
                      anchor={
                        <IconButton
                          icon="dots-vertical"
                          onPress={() => setMenuVisible(`inv-${inv.id}`)}
                        />
                      }
                    >
                      <Menu.Item
                        leadingIcon="plus"
                        onPress={() => {
                          setAddFundsModal(inv);
                          setMenuVisible(null);
                        }}
                        title="Aggiungi fondi"
                      />
                      <Menu.Item
                        leadingIcon="refresh"
                        onPress={() => {
                          // Would open value update modal
                          setMenuVisible(null);
                        }}
                        title="Aggiorna valore"
                      />
                      <Divider />
                      <Menu.Item
                        leadingIcon="delete"
                        onPress={() => {
                          deleteInvestment(inv.id);
                          setMenuVisible(null);
                        }}
                        title="Elimina"
                        titleStyle={{ color: brandColors.error }}
                      />
                    </Menu>
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* Bank Accounts */}
        {bankAccounts.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <Text variant="titleMedium" style={{ marginBottom: spacing.md }}>
                Conti e Liquidità
              </Text>

              {bankAccounts.map((account) => (
                <View key={account.id} style={styles.accountItem}>
                  <View style={[styles.accountIcon, { backgroundColor: account.color + '20' }]}>
                    <MaterialCommunityIcons
                      name={account.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                      size={24}
                      color={account.color}
                    />
                  </View>

                  <View style={{ flex: 1 }}>
                    <Text variant="bodyLarge">{account.name}</Text>
                    <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      {account.type === 'checking' ? 'Conto corrente' : account.type === 'savings' ? 'Conto risparmio' : 'Contante'}
                    </Text>
                  </View>

                  <Text variant="titleMedium" style={{ fontWeight: 'bold' }}>
                    {formatCurrency(account.balance, currency)}
                  </Text>

                  <IconButton
                    icon="dots-vertical"
                    onPress={() => setMenuVisible(`acc-${account.id}`)}
                  />
                </View>
              ))}
            </Card.Content>
          </Card>
        )}

        {/* Debts */}
        {debts.length > 0 && (
          <Card style={styles.card} mode="elevated">
            <Card.Content>
              <View style={styles.sectionHeader}>
                <Text variant="titleMedium">Debiti</Text>
                <Chip
                  icon="alert"
                  style={{ backgroundColor: brandColors.error + '20' }}
                  textStyle={{ color: brandColors.error }}
                >
                  {formatCurrency(totalDebts, currency)}
                </Chip>
              </View>

              {debts.map((debt) => {
                const paidPercentage = ((debt.totalAmount - debt.remainingAmount) / debt.totalAmount) * 100;

                return (
                  <View key={debt.id} style={styles.debtItem}>
                    <View style={[styles.debtIcon, { backgroundColor: '#F44336' + '20' }]}>
                      <MaterialCommunityIcons name="credit-card" size={24} color="#F44336" />
                    </View>

                    <View style={{ flex: 1 }}>
                      <Text variant="bodyLarge">{debt.name}</Text>
                      <ProgressBar
                        progress={paidPercentage / 100}
                        color={brandColors.success}
                        style={{ height: 6, borderRadius: 3, marginTop: 4 }}
                      />
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant, marginTop: 2 }}>
                        {paidPercentage.toFixed(0)}% ripagato • {debt.interestRate > 0 ? `${debt.interestRate}% interesse` : ''}
                      </Text>
                    </View>

                    <View style={{ alignItems: 'flex-end' }}>
                      <Text variant="titleMedium" style={{ fontWeight: 'bold', color: brandColors.error }}>
                        {formatCurrency(debt.remainingAmount, currency)}
                      </Text>
                      <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
                        di {formatCurrency(debt.totalAmount, currency)}
                      </Text>
                    </View>

                    <IconButton
                      icon="dots-vertical"
                      onPress={() => setMenuVisible(`debt-${debt.id}`)}
                    />
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* Empty State */}
        {investments.length === 0 && bankAccounts.length === 0 && debts.length === 0 && (
          <Surface style={styles.emptyState} elevation={1}>
            <MaterialCommunityIcons
              name="bank"
              size={64}
              color={theme.colors.onSurfaceVariant}
            />
            <Text
              variant="bodyLarge"
              style={{ color: theme.colors.onSurfaceVariant, marginTop: spacing.md, textAlign: 'center' }}
            >
              Inizia a tracciare il tuo patrimonio
            </Text>
            <Text
              variant="bodySmall"
              style={{ color: theme.colors.onSurfaceVariant, textAlign: 'center', marginTop: 4 }}
            >
              Aggiungi conti, investimenti o debiti
            </Text>
          </Surface>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Gradient FAB */}
      <Pressable
        onPress={() => setFabOpen(!fabOpen)}
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
          <MaterialCommunityIcons name={fabOpen ? 'close' : 'plus'} size={24} color="#FFFFFF" />
        </LinearGradient>
      </Pressable>

      {/* FAB Actions */}
      {fabOpen && (
        <View style={styles.fabActions}>
          <Pressable onPress={() => { setAddInvestmentModal(true); setFabOpen(false); }} style={styles.fabActionItem}>
            <View style={[styles.fabActionIcon, { backgroundColor: '#4CAF50' }]}>
              <MaterialCommunityIcons name="chart-line" size={20} color="#FFFFFF" />
            </View>
            <Text variant="labelMedium">Investimento</Text>
          </Pressable>
          <Pressable onPress={() => { setAddAccountModal(true); setFabOpen(false); }} style={styles.fabActionItem}>
            <View style={[styles.fabActionIcon, { backgroundColor: '#2196F3' }]}>
              <MaterialCommunityIcons name="bank" size={20} color="#FFFFFF" />
            </View>
            <Text variant="labelMedium">Conto</Text>
          </Pressable>
          <Pressable onPress={() => { setAddDebtModal(true); setFabOpen(false); }} style={styles.fabActionItem}>
            <View style={[styles.fabActionIcon, { backgroundColor: '#F44336' }]}>
              <MaterialCommunityIcons name="credit-card" size={20} color="#FFFFFF" />
            </View>
            <Text variant="labelMedium">Debito</Text>
          </Pressable>
        </View>
      )}

      {/* Add Investment Modal */}
      <Portal>
        <Modal
          visible={addInvestmentModal}
          onDismiss={() => setAddInvestmentModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={{ marginBottom: spacing.lg }}>
            Nuovo Investimento
          </Text>

          <TextInput
            label="Nome"
            value={investmentName}
            onChangeText={setInvestmentName}
            mode="outlined"
            style={styles.input}
            placeholder="es. ETF VWCE"
          />

          <Text variant="labelLarge" style={{ marginBottom: spacing.sm }}>
            Tipo
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: spacing.md }}>
            {INVESTMENT_TYPES.map((type) => (
              <Chip
                key={type.type}
                selected={investmentType === type.type}
                onPress={() => setInvestmentType(type.type)}
                style={{ marginRight: spacing.sm }}
                showSelectedCheck
              >
                {type.label}
              </Chip>
            ))}
          </ScrollView>

          <TextInput
            label="Importo investito (€)"
            value={investmentAmount}
            onChangeText={setInvestmentAmount}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="currency-eur" />}
          />

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setAddInvestmentModal(false)}>
              Annulla
            </Button>
            <Button
              mode="contained"
              onPress={handleAddInvestment}
              disabled={!investmentName.trim() || !investmentAmount}
            >
              Aggiungi
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Add Account Modal */}
      <Portal>
        <Modal
          visible={addAccountModal}
          onDismiss={() => setAddAccountModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={{ marginBottom: spacing.lg }}>
            Nuovo Conto
          </Text>

          <TextInput
            label="Nome"
            value={accountName}
            onChangeText={setAccountName}
            mode="outlined"
            style={styles.input}
            placeholder="es. Conto principale"
          />

          <Text variant="labelLarge" style={{ marginBottom: spacing.sm }}>
            Tipo
          </Text>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginBottom: spacing.md }}>
            <Chip
              selected={accountType === 'checking'}
              onPress={() => setAccountType('checking')}
              showSelectedCheck
            >
              Conto corrente
            </Chip>
            <Chip
              selected={accountType === 'savings'}
              onPress={() => setAccountType('savings')}
              showSelectedCheck
            >
              Risparmio
            </Chip>
            <Chip
              selected={accountType === 'cash'}
              onPress={() => setAccountType('cash')}
              showSelectedCheck
            >
              Contante
            </Chip>
          </View>

          <TextInput
            label="Saldo attuale (€)"
            value={accountBalance}
            onChangeText={setAccountBalance}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="currency-eur" />}
          />

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setAddAccountModal(false)}>
              Annulla
            </Button>
            <Button
              mode="contained"
              onPress={handleAddAccount}
              disabled={!accountName.trim() || !accountBalance}
            >
              Aggiungi
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Add Debt Modal */}
      <Portal>
        <Modal
          visible={addDebtModal}
          onDismiss={() => setAddDebtModal(false)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={{ marginBottom: spacing.lg }}>
            Nuovo Debito
          </Text>

          <TextInput
            label="Nome"
            value={debtName}
            onChangeText={setDebtName}
            mode="outlined"
            style={styles.input}
            placeholder="es. Mutuo casa"
          />

          <TextInput
            label="Importo totale (€)"
            value={debtAmount}
            onChangeText={setDebtAmount}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="currency-eur" />}
          />

          <TextInput
            label="Rimanente da pagare (€)"
            value={debtRemaining}
            onChangeText={setDebtRemaining}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="currency-eur" />}
          />

          <TextInput
            label="Tasso interesse % (opzionale)"
            value={debtRate}
            onChangeText={setDebtRate}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="percent" />}
          />

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setAddDebtModal(false)}>
              Annulla
            </Button>
            <Button
              mode="contained"
              onPress={handleAddDebt}
              disabled={!debtName.trim() || !debtAmount || !debtRemaining}
            >
              Aggiungi
            </Button>
          </View>
        </Modal>
      </Portal>

      {/* Add Funds Modal */}
      <Portal>
        <Modal
          visible={addFundsModal !== null}
          onDismiss={() => setAddFundsModal(null)}
          contentContainerStyle={[styles.modal, { backgroundColor: theme.colors.surface }]}
        >
          <Text variant="titleLarge" style={{ marginBottom: spacing.lg }}>
            Aggiungi fondi a {addFundsModal?.name}
          </Text>

          <TextInput
            label="Importo (€)"
            value={fundsAmount}
            onChangeText={setFundsAmount}
            keyboardType="numeric"
            mode="outlined"
            style={styles.input}
            left={<TextInput.Icon icon="currency-eur" />}
          />

          <View style={styles.modalActions}>
            <Button mode="outlined" onPress={() => setAddFundsModal(null)}>
              Annulla
            </Button>
            <Button
              mode="contained"
              onPress={handleAddFunds}
              disabled={!fundsAmount}
            >
              Aggiungi
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
  mainCard: {
    marginBottom: spacing.md,
  },
  netWorthBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: spacing.lg,
    paddingTop: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  breakdownItem: {
    alignItems: 'center',
    gap: 4,
  },
  card: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  allocationChart: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.lg,
  },
  allocationLegend: {
    flex: 1,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  investmentSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
  },
  investmentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  investmentIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  accountItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  accountIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  debtItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  debtIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
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
  fabActions: {
    position: 'absolute',
    right: spacing.md,
    bottom: 80,
    alignItems: 'flex-end',
    gap: spacing.sm,
  },
  fabActionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#FFFFFF',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.lg,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  fabActionIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: 12,
    maxHeight: '80%',
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
});
