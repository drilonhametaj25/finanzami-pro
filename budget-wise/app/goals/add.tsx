import { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from 'react-native';
import {
  Text,
  TextInput,
  Button,
  useTheme,
  HelperText,
  Card,
  Switch,
  Divider,
} from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { format, addMonths } from 'date-fns';
import { it } from 'date-fns/locale';

import { useGoalStore } from '../../stores/goalStore';
import { useAuthStore } from '../../stores/authStore';
import { usePremiumStore } from '../../stores/premiumStore';
import { PremiumGate } from '../../components/premium/PremiumGate';
import { spacing, borderRadius, brandColors } from '../../constants/theme';
import { formatCurrency } from '../../constants/currencies';

const GOAL_ICONS: { icon: string; label: string }[] = [
  { icon: 'target', label: 'Obiettivo' },
  { icon: 'home', label: 'Casa' },
  { icon: 'car', label: 'Auto' },
  { icon: 'airplane', label: 'Viaggio' },
  { icon: 'school', label: 'Istruzione' },
  { icon: 'hospital', label: 'Salute' },
  { icon: 'laptop', label: 'Tecnologia' },
  { icon: 'ring', label: 'Matrimonio' },
  { icon: 'baby-carriage', label: 'Famiglia' },
  { icon: 'piggy-bank', label: 'Risparmio' },
  { icon: 'briefcase', label: 'Business' },
  { icon: 'gift', label: 'Regalo' },
  { icon: 'dumbbell', label: 'Fitness' },
  { icon: 'music', label: 'Hobby' },
  { icon: 'shield-check', label: 'Emergenza' },
  { icon: 'trending-up', label: 'Investimento' },
];

const PRESET_GOALS = [
  { name: 'Fondo emergenza', icon: 'shield-check', amount: 5000 },
  { name: 'Vacanza', icon: 'airplane', amount: 2000 },
  { name: 'Nuova auto', icon: 'car', amount: 15000 },
  { name: 'Acconto casa', icon: 'home', amount: 30000 },
  { name: 'Nuovo laptop', icon: 'laptop', amount: 1500 },
  { name: 'Corso formazione', icon: 'school', amount: 1000 },
];

export default function AddGoalScreen() {
  const theme = useTheme();
  const router = useRouter();
  const { profile } = useAuthStore();
  const { goals, createGoal, isLoading, fetchGoals } = useGoalStore();
  const { isPremium, getFeatureLimits } = usePremiumStore();

  // All hooks must be called before any conditional returns
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('target');
  const [targetAmount, setTargetAmount] = useState('');
  const [hasTargetDate, setHasTargetDate] = useState(false);
  const [targetMonths, setTargetMonths] = useState('12');
  const [hasMonthlyAllocation, setHasMonthlyAllocation] = useState(false);
  const [monthlyAllocation, setMonthlyAllocation] = useState('');
  const [initialAmount, setInitialAmount] = useState('');
  const [error, setError] = useState<string | null>(null);

  const currency = profile?.main_currency || 'EUR';
  const limits = getFeatureLimits();
  const hasReachedLimit = !isPremium && goals.length >= limits.maxGoals;

  // Fetch goals to check count
  useEffect(() => {
    fetchGoals();
  }, [fetchGoals]);

  // If user has reached limit, show premium gate
  if (hasReachedLimit) {
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
                <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
              </Pressable>
              <Text variant="titleLarge" style={styles.headerTitle}>
                Nuovo obiettivo
              </Text>
            </View>
          </SafeAreaView>
        </LinearGradient>
        <PremiumGate feature="unlimited_goals" showTeaser={false}>
          <View />
        </PremiumGate>
      </SafeAreaView>
    );
  }

  const handleAmountChange = (text: string, setter: (value: string) => void) => {
    const cleaned = text.replace(/[^0-9.,]/g, '').replace(',', '.');
    setter(cleaned);
    setError(null);
  };

  const applyPreset = (preset: typeof PRESET_GOALS[0]) => {
    setName(preset.name);
    setSelectedIcon(preset.icon);
    setTargetAmount(preset.amount.toString());
    setError(null);
  };

  const calculateEstimatedDate = () => {
    const target = parseFloat(targetAmount) || 0;
    const initial = parseFloat(initialAmount) || 0;
    const monthly = parseFloat(monthlyAllocation) || 0;

    if (monthly > 0 && target > initial) {
      const remaining = target - initial;
      const months = Math.ceil(remaining / monthly);
      return addMonths(new Date(), months);
    }
    return null;
  };

  const calculateMonthlyNeeded = () => {
    const target = parseFloat(targetAmount) || 0;
    const initial = parseFloat(initialAmount) || 0;
    const months = parseInt(targetMonths) || 12;

    if (target > initial && months > 0) {
      return (target - initial) / months;
    }
    return 0;
  };

  const validateForm = (): boolean => {
    if (!name.trim()) {
      setError('Inserisci un nome per l\'obiettivo');
      return false;
    }
    if (!targetAmount || parseFloat(targetAmount) <= 0) {
      setError('Inserisci un importo target valido');
      return false;
    }
    const initial = parseFloat(initialAmount) || 0;
    const target = parseFloat(targetAmount);
    if (initial >= target) {
      setError('L\'importo iniziale deve essere inferiore al target');
      return false;
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    const targetDate = hasTargetDate
      ? addMonths(new Date(), parseInt(targetMonths) || 12).toISOString().split('T')[0]
      : null;

    const monthlyAlloc = hasMonthlyAllocation
      ? parseFloat(monthlyAllocation) || null
      : null;

    const { error: createError } = await createGoal({
      name: name.trim(),
      icon: selectedIcon,
      target_amount: parseFloat(targetAmount),
      current_amount: parseFloat(initialAmount) || 0,
      target_date: targetDate,
      monthly_allocation: monthlyAlloc,
    });

    if (!createError) {
      router.back();
    } else {
      setError(createError);
    }
  };

  const estimatedDate = calculateEstimatedDate();
  const monthlyNeeded = calculateMonthlyNeeded();

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
              <MaterialCommunityIcons name="close" size={24} color="#FFFFFF" />
            </Pressable>
            <View style={styles.headerIconContainer}>
              <MaterialCommunityIcons name="target" size={28} color="#FFFFFF" />
            </View>
            <View style={styles.headerTextContainer}>
              <Text variant="titleLarge" style={styles.headerTitle}>
                Nuovo obiettivo
              </Text>
              <Text variant="bodySmall" style={styles.headerSubtitle}>
                Imposta il tuo traguardo
              </Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Preset Goals */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Suggerimenti
            </Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.presetsContainer}
            >
              {PRESET_GOALS.map((preset) => (
                <Pressable
                  key={preset.name}
                  onPress={() => applyPreset(preset)}
                  style={({ pressed }) => [
                    styles.presetCard,
                    { backgroundColor: theme.colors.surface },
                    pressed && styles.pressed,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={preset.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={24}
                    color={theme.colors.primary}
                  />
                  <Text variant="labelMedium" numberOfLines={1}>
                    {preset.name}
                  </Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    {formatCurrency(preset.amount, currency)}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          {/* Name */}
          <TextInput
            label="Nome obiettivo"
            value={name}
            onChangeText={(text) => {
              setName(text);
              setError(null);
            }}
            mode="outlined"
            style={styles.input}
            placeholder="es. Vacanza in Giappone"
          />

          {/* Icon Selection */}
          <View style={styles.section}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Icona
            </Text>
            <View style={styles.iconGrid}>
              {GOAL_ICONS.map((item) => (
                <Pressable
                  key={item.icon}
                  onPress={() => setSelectedIcon(item.icon)}
                  style={[
                    styles.iconItem,
                    {
                      backgroundColor:
                        selectedIcon === item.icon
                          ? theme.colors.primaryContainer
                          : theme.colors.surface,
                    },
                  ]}
                >
                  <MaterialCommunityIcons
                    name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={28}
                    color={
                      selectedIcon === item.icon
                        ? theme.colors.primary
                        : theme.colors.onSurfaceVariant
                    }
                  />
                </Pressable>
              ))}
            </View>
          </View>

          {/* Target Amount */}
          <View style={styles.amountSection}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Quanto vuoi risparmiare?
            </Text>
            <View style={styles.amountRow}>
              <Text
                variant="headlineMedium"
                style={[styles.currencySymbol, { color: theme.colors.primary }]}
              >
                {currency === 'EUR' ? '€' : '$'}
              </Text>
              <TextInput
                value={targetAmount}
                onChangeText={(text) => handleAmountChange(text, setTargetAmount)}
                placeholder="0"
                keyboardType="decimal-pad"
                style={styles.amountInput}
                mode="flat"
                underlineColor="transparent"
                activeUnderlineColor="transparent"
                contentStyle={styles.amountInputContent}
              />
            </View>
          </View>

          {/* Initial Amount */}
          <TextInput
            label="Importo iniziale (opzionale)"
            value={initialAmount}
            onChangeText={(text) => handleAmountChange(text, setInitialAmount)}
            mode="outlined"
            keyboardType="decimal-pad"
            style={styles.input}
            placeholder="0"
            left={<TextInput.Affix text={currency === 'EUR' ? '€' : '$'} />}
          />

          {/* Target Date Option */}
          <Card style={styles.optionCard} mode="outlined">
            <Card.Content>
              <View style={styles.optionRow}>
                <View style={styles.optionInfo}>
                  <MaterialCommunityIcons
                    name="calendar-check"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <View style={styles.optionText}>
                    <Text variant="bodyLarge">Data obiettivo</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Imposta una scadenza
                    </Text>
                  </View>
                </View>
                <Switch value={hasTargetDate} onValueChange={setHasTargetDate} />
              </View>

              {hasTargetDate && (
                <>
                  <Divider style={styles.optionDivider} />
                  <View style={styles.monthsSelector}>
                    <Text variant="bodyMedium">Raggiungi in:</Text>
                    <View style={styles.monthsButtons}>
                      {['6', '12', '24', '36'].map((months) => (
                        <Pressable
                          key={months}
                          onPress={() => setTargetMonths(months)}
                          style={[
                            styles.monthButton,
                            {
                              backgroundColor:
                                targetMonths === months
                                  ? theme.colors.primary
                                  : theme.colors.surface,
                            },
                          ]}
                        >
                          <Text
                            variant="labelMedium"
                            style={{
                              color:
                                targetMonths === months
                                  ? theme.colors.onPrimary
                                  : theme.colors.onSurface,
                            }}
                          >
                            {months} mesi
                          </Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>
                  {monthlyNeeded > 0 && (
                    <View style={styles.suggestionBox}>
                      <MaterialCommunityIcons
                        name="lightbulb-outline"
                        size={18}
                        color={brandColors.warning}
                      />
                      <Text variant="bodySmall" style={{ flex: 1 }}>
                        Dovrai risparmiare circa{' '}
                        <Text style={{ fontWeight: 'bold' }}>
                          {formatCurrency(monthlyNeeded, currency)}/mese
                        </Text>
                      </Text>
                    </View>
                  )}
                </>
              )}
            </Card.Content>
          </Card>

          {/* Monthly Allocation Option */}
          <Card style={styles.optionCard} mode="outlined">
            <Card.Content>
              <View style={styles.optionRow}>
                <View style={styles.optionInfo}>
                  <MaterialCommunityIcons
                    name="cash-refund"
                    size={24}
                    color={theme.colors.primary}
                  />
                  <View style={styles.optionText}>
                    <Text variant="bodyLarge">Risparmio mensile</Text>
                    <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                      Imposta un importo fisso mensile
                    </Text>
                  </View>
                </View>
                <Switch
                  value={hasMonthlyAllocation}
                  onValueChange={setHasMonthlyAllocation}
                />
              </View>

              {hasMonthlyAllocation && (
                <>
                  <Divider style={styles.optionDivider} />
                  <TextInput
                    label="Importo mensile"
                    value={monthlyAllocation}
                    onChangeText={(text) => handleAmountChange(text, setMonthlyAllocation)}
                    mode="outlined"
                    keyboardType="decimal-pad"
                    style={styles.allocationInput}
                    left={<TextInput.Affix text={currency === 'EUR' ? '€' : '$'} />}
                  />
                  {estimatedDate && (
                    <View style={styles.suggestionBox}>
                      <MaterialCommunityIcons
                        name="calendar-clock"
                        size={18}
                        color={brandColors.success}
                      />
                      <Text variant="bodySmall" style={{ flex: 1 }}>
                        Raggiungerai l'obiettivo entro{' '}
                        <Text style={{ fontWeight: 'bold' }}>
                          {format(estimatedDate, 'MMMM yyyy', { locale: it })}
                        </Text>
                      </Text>
                    </View>
                  )}
                </>
              )}
            </Card.Content>
          </Card>

          {/* Summary */}
          {parseFloat(targetAmount) > 0 && (
            <Card
              style={[styles.summaryCard, { backgroundColor: theme.colors.primaryContainer }]}
              mode="elevated"
            >
              <Card.Content>
                <View style={styles.summaryHeader}>
                  <MaterialCommunityIcons
                    name={selectedIcon as keyof typeof MaterialCommunityIcons.glyphMap}
                    size={32}
                    color={theme.colors.primary}
                  />
                  <View style={styles.summaryInfo}>
                    <Text variant="titleMedium">{name || 'Nuovo obiettivo'}</Text>
                    <Text variant="headlineSmall" style={{ color: theme.colors.primary }}>
                      {formatCurrency(parseFloat(targetAmount), currency)}
                    </Text>
                  </View>
                </View>
                {(parseFloat(initialAmount) > 0 || hasTargetDate || hasMonthlyAllocation) && (
                  <>
                    <Divider style={styles.summaryDivider} />
                    <View style={styles.summaryDetails}>
                      {parseFloat(initialAmount) > 0 && (
                        <View style={styles.summaryRow}>
                          <Text variant="bodySmall">Importo iniziale</Text>
                          <Text variant="bodySmall">
                            {formatCurrency(parseFloat(initialAmount), currency)}
                          </Text>
                        </View>
                      )}
                      {hasTargetDate && (
                        <View style={styles.summaryRow}>
                          <Text variant="bodySmall">Scadenza</Text>
                          <Text variant="bodySmall">
                            {format(
                              addMonths(new Date(), parseInt(targetMonths)),
                              'd MMM yyyy',
                              { locale: it }
                            )}
                          </Text>
                        </View>
                      )}
                      {hasMonthlyAllocation && parseFloat(monthlyAllocation) > 0 && (
                        <View style={styles.summaryRow}>
                          <Text variant="bodySmall">Risparmio mensile</Text>
                          <Text variant="bodySmall">
                            {formatCurrency(parseFloat(monthlyAllocation), currency)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </>
                )}
              </Card.Content>
            </Card>
          )}

          {/* Error */}
          {error && (
            <HelperText type="error" visible={!!error}>
              {error}
            </HelperText>
          )}
        </ScrollView>

        {/* Submit Button */}
        <View style={styles.footer}>
          <Pressable
            onPress={handleSubmit}
            disabled={isLoading || !name.trim() || !targetAmount}
            style={({ pressed }) => [
              styles.submitPressable,
              pressed && styles.submitPressed,
              (isLoading || !name.trim() || !targetAmount) && styles.submitDisabled,
            ]}
          >
            <LinearGradient
              colors={(isLoading || !name.trim() || !targetAmount) ? ['#9E9E9E', '#757575'] : [brandColors.gradientStart, brandColors.gradientEnd]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.submitGradient}
            >
              <MaterialCommunityIcons name="flag-checkered" size={22} color="#FFFFFF" style={styles.submitIcon} />
              <Text variant="titleMedium" style={styles.submitText}>
                {isLoading ? 'Creazione...' : 'Crea obiettivo'}
              </Text>
            </LinearGradient>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    marginBottom: spacing.sm,
  },
  presetsContainer: {
    gap: spacing.sm,
  },
  presetCard: {
    padding: spacing.md,
    borderRadius: 12,
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 100,
    marginRight: spacing.sm,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  pressed: {
    opacity: 0.7,
  },
  input: {
    marginBottom: spacing.md,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  iconItem: {
    width: 52,
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currencySymbol: {
    fontWeight: 'bold',
    marginRight: spacing.sm,
  },
  amountInput: {
    backgroundColor: 'transparent',
    fontSize: 36,
    width: 180,
  },
  amountInputContent: {
    fontSize: 36,
    fontWeight: 'bold',
  },
  optionCard: {
    marginBottom: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  optionText: {
    flex: 1,
  },
  optionDivider: {
    marginVertical: spacing.md,
  },
  monthsSelector: {
    gap: spacing.sm,
  },
  monthsButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  monthButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: 20,
  },
  suggestionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
    padding: spacing.sm,
    backgroundColor: '#FFF8E1',
    borderRadius: 8,
  },
  allocationInput: {
    marginTop: spacing.xs,
  },
  summaryCard: {
    marginTop: spacing.md,
  },
  summaryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  summaryInfo: {
    flex: 1,
  },
  summaryDivider: {
    marginVertical: spacing.md,
  },
  summaryDetails: {
    gap: spacing.xs,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footer: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  submitPressable: {
    borderRadius: borderRadius.lg,
    overflow: 'hidden',
  },
  submitPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  submitDisabled: {
    opacity: 0.6,
  },
  submitGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  submitIcon: {
    marginRight: spacing.sm,
  },
  submitText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
