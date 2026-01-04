import React, { useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
  Pressable,
} from 'react-native';
import {
  Text,
  Button,
  Card,
  useTheme,
  IconButton,
  Divider,
  Snackbar,
} from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { PurchasesPackage } from 'react-native-purchases';
import { usePremiumStore } from '../../stores/premiumStore';
import { TIP_TIERS, PRODUCT_IDS, TipTier } from '../../services/revenueCat';
import { spacing, borderRadius, brandColors } from '../../constants/theme';

export default function PaywallScreen() {
  const theme = useTheme();
  const router = useRouter();
  const {
    isPremium,
    subscriptionType,
    offerings,
    isLoading,
    isRestoring,
    error,
    hasPurchasedAnnualReport,
    isSupporter,
    purchasePackage,
    purchaseProduct,
    restorePurchases,
    refreshStatus,
    clearError,
  } = usePremiumStore();

  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  useEffect(() => {
    refreshStatus();
  }, []);

  useEffect(() => {
    if (error) {
      setSnackbarMessage(error);
      setSnackbarVisible(true);
    }
  }, [error]);

  const monthlyPackage = offerings?.current?.availablePackages?.find(
    (p) => p.packageType === 'MONTHLY'
  );
  const yearlyPackage = offerings?.current?.availablePackages?.find(
    (p) => p.packageType === 'ANNUAL'
  );

  // Mock prices for development (when RevenueCat products aren't available)
  const mockPrices = {
    monthly: { priceString: '3,99 €', price: 3.99 },
    yearly: { priceString: '29,99 €', price: 29.99 },
  };

  const getMonthlyPrice = () => monthlyPackage?.product?.priceString || mockPrices.monthly.priceString;
  const getYearlyPrice = () => yearlyPackage?.product?.priceString || mockPrices.yearly.priceString;
  const getYearlyMonthly = () => {
    const price = yearlyPackage?.product?.price || mockPrices.yearly.price;
    return (price / 12).toFixed(2);
  };

  const handlePurchase = async () => {
    const pkg = selectedPlan === 'yearly' ? yearlyPackage : monthlyPackage;

    if (!pkg) {
      // In development mode, show info about production
      Alert.alert(
        'Modalita Sviluppo',
        'Gli acquisti in-app sono disponibili solo nella versione pubblicata dell\'app.\n\nPrezzi:\n• Mensile: 3,99€/mese\n• Annuale: 29,99€/anno (risparmia 37%)',
        [{ text: 'OK' }]
      );
      return;
    }

    const { error } = await purchasePackage(pkg);

    if (error) {
      Alert.alert('Errore', error);
    } else {
      router.replace('/premium/success');
    }
  };

  const handleRestore = async () => {
    const { error, restored } = await restorePurchases();

    if (error) {
      Alert.alert('Errore', error);
    } else if (restored) {
      Alert.alert('Acquisti Ripristinati', 'I tuoi acquisti sono stati ripristinati con successo!');
    } else {
      Alert.alert('Nessun Acquisto', 'Non sono stati trovati acquisti precedenti.');
    }
  };

  const handleTipPurchase = async (tier: TipTier) => {
    const tipInfo = TIP_TIERS[tier];
    const { error } = await purchaseProduct(tipInfo.id);

    if (error) {
      Alert.alert('Errore', error);
    } else {
      setSnackbarMessage(`Grazie per il tuo supporto! ${tipInfo.emoji}`);
      setSnackbarVisible(true);
    }
  };

  const handleReportPurchase = async () => {
    const { error } = await purchaseProduct(PRODUCT_IDS.ANNUAL_REPORT);

    if (error) {
      Alert.alert('Errore', error);
    } else {
      setSnackbarMessage('Report PDF sbloccato!');
      setSnackbarVisible(true);
    }
  };

  // Se l'utente è già premium, mostra un messaggio diverso
  if (isPremium) {
    return (
      <View style={styles.container}>
        <LinearGradient
          colors={[brandColors.gradientStart, brandColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.premiumActiveGradient}
        >
          <SafeAreaView style={styles.premiumActiveSafeArea}>
            <View style={styles.premiumActiveHeader}>
              <IconButton icon="close" iconColor="#FFFFFF" onPress={() => router.back()} />
            </View>

            <View style={styles.premiumActiveContent}>
              <View style={styles.crownContainerActive}>
                <MaterialCommunityIcons name="crown" size={72} color="#FFD700" />
              </View>

              <Text variant="headlineMedium" style={styles.premiumActiveTitle}>
                Sei Premium!
              </Text>

              <Text variant="bodyLarge" style={styles.premiumActiveSubtitle}>
                Piano {subscriptionType === 'yearly' ? 'Annuale' : 'Mensile'} attivo
              </Text>

              <View style={styles.premiumActiveButtonContainer}>
                <Button
                  mode="contained"
                  onPress={() => Linking.openURL('https://apps.apple.com/account/subscriptions')}
                  buttonColor="#FFFFFF"
                  textColor={brandColors.primary}
                  style={styles.manageButton}
                >
                  Gestisci abbonamento
                </Button>

                <Button
                  mode="text"
                  onPress={() => router.back()}
                  textColor="rgba(255,255,255,0.9)"
                >
                  Torna all'app
                </Button>
              </View>
            </View>
          </SafeAreaView>
        </LinearGradient>
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Gradient Header */}
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.headerGradient}
      >
        <View style={styles.header}>
          <IconButton icon="close" iconColor="#FFFFFF" onPress={() => router.back()} />
          <Text variant="titleLarge" style={styles.headerTitle}>
            FinanzaMi.pro Premium
          </Text>
          <View style={{ width: 48 }} />
        </View>

        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.crownContainer}>
            <MaterialCommunityIcons name="crown" size={48} color="#FFD700" />
          </View>
          <Text variant="headlineSmall" style={styles.heroTitle}>
            Sblocca il tuo potenziale finanziario
          </Text>
          <Text variant="bodyMedium" style={styles.heroSubtitle}>
            Gestisci le tue finanze senza limiti
          </Text>
        </View>

        {/* Curved bottom */}
        <View style={styles.curveContainer}>
          <View style={[styles.curve, { backgroundColor: theme.colors.background }]} />
        </View>
      </LinearGradient>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={styles.scrollView}
      >
        {/* Pricing Cards */}
        <View style={styles.pricingSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Scegli il tuo piano
          </Text>

          <View style={styles.pricingCards}>
            {/* Yearly Card */}
            <Pressable
              style={({ pressed }) => [
                styles.pricingCard,
                selectedPlan === 'yearly' && styles.pricingCardSelected,
                pressed && styles.pricingCardPressed,
              ]}
              onPress={() => setSelectedPlan('yearly')}
            >
              {selectedPlan === 'yearly' && (
                <LinearGradient
                  colors={[brandColors.gradientStart, brandColors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedCardBorder}
                />
              )}
              <View style={[
                styles.pricingCardInner,
                { backgroundColor: theme.colors.surface },
                selectedPlan !== 'yearly' && { borderWidth: 1, borderColor: theme.colors.outline }
              ]}>
                <View style={styles.saveBadge}>
                  <LinearGradient
                    colors={[brandColors.success, '#2E7D32']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.saveBadgeGradient}
                  >
                    <Text style={styles.saveBadgeText}>RISPARMIA 37%</Text>
                  </LinearGradient>
                </View>

                <MaterialCommunityIcons
                  name={selectedPlan === 'yearly' ? 'radiobox-marked' : 'radiobox-blank'}
                  size={24}
                  color={selectedPlan === 'yearly' ? brandColors.primary : theme.colors.outline}
                  style={styles.radioIcon}
                />

                <Text variant="titleMedium" style={styles.planName}>
                  Annuale
                </Text>
                <Text variant="headlineMedium" style={[styles.planPrice, { color: brandColors.primary }]}>
                  {getYearlyPrice()}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  /anno ({getYearlyMonthly()}€/mese)
                </Text>
              </View>
            </Pressable>

            {/* Monthly Card */}
            <Pressable
              style={({ pressed }) => [
                styles.pricingCard,
                selectedPlan === 'monthly' && styles.pricingCardSelected,
                pressed && styles.pricingCardPressed,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              {selectedPlan === 'monthly' && (
                <LinearGradient
                  colors={[brandColors.gradientStart, brandColors.gradientEnd]}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                  style={styles.selectedCardBorder}
                />
              )}
              <View style={[
                styles.pricingCardInner,
                { backgroundColor: theme.colors.surface },
                selectedPlan !== 'monthly' && { borderWidth: 1, borderColor: theme.colors.outline }
              ]}>
                <MaterialCommunityIcons
                  name={selectedPlan === 'monthly' ? 'radiobox-marked' : 'radiobox-blank'}
                  size={24}
                  color={selectedPlan === 'monthly' ? brandColors.primary : theme.colors.outline}
                  style={styles.radioIcon}
                />

                <Text variant="titleMedium" style={styles.planName}>
                  Mensile
                </Text>
                <Text variant="headlineMedium" style={[styles.planPrice, { color: brandColors.primary }]}>
                  {getMonthlyPrice()}
                </Text>
                <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                  /mese
                </Text>
              </View>
            </Pressable>
          </View>
        </View>

        {/* Features Card with Gradient Border */}
        <LinearGradient
          colors={[brandColors.gradientStart, brandColors.gradientEnd]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.featuresCardBorder}
        >
          <View style={[styles.featuresCardInner, { backgroundColor: theme.colors.surface }]}>
            <Text variant="titleMedium" style={styles.featuresTitle}>
              Cosa include Premium
            </Text>

            <View style={styles.featuresList}>
              <FeatureRow icon="infinity" title="Obiettivi illimitati" description="Crea tutti gli obiettivi che vuoi" />
              <FeatureRow icon="tag-multiple" title="Categorie illimitate" description="Personalizza senza limiti" />
              <FeatureRow icon="lightbulb-on" title="Insights avanzati" description="Analisi e consigli personalizzati" />
              <FeatureRow icon="bank" title="Gestione patrimonio" description="Traccia investimenti e asset" />
              <FeatureRow icon="account-group" title="Spese condivise" description="Dividi le spese facilmente" />
              <FeatureRow icon="file-pdf-box" title="Report PDF" description="Esporta report annuali" />
            </View>
          </View>
        </LinearGradient>

        {/* CTA Button with Gradient */}
        <Pressable
          onPress={handlePurchase}
          disabled={isLoading}
          style={({ pressed }) => [
            styles.ctaButtonContainer,
            pressed && styles.ctaButtonPressed,
            isLoading && styles.ctaButtonDisabled,
          ]}
        >
          <LinearGradient
            colors={isLoading ? ['#9E9E9E', '#757575'] : [brandColors.gradientStart, brandColors.gradientEnd]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.ctaGradient}
          >
            <MaterialCommunityIcons name="crown" size={22} color="#FFFFFF" style={styles.ctaIcon} />
            <Text variant="titleMedium" style={styles.ctaText}>
              {isLoading ? 'Elaborazione...' : 'Abbonati ora'}
            </Text>
          </LinearGradient>
        </Pressable>

        {/* Restore */}
        <Button
          mode="text"
          onPress={handleRestore}
          loading={isRestoring}
          disabled={isRestoring}
          textColor={brandColors.primary}
        >
          Ripristina acquisti
        </Button>

        <Divider style={styles.divider} />

        {/* One-time Purchases */}
        <View style={styles.oneTimeSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Acquisti singoli
          </Text>

          {/* Report PDF */}
          <Card style={[styles.oneTimeCard, { backgroundColor: theme.colors.surface }]} mode="outlined">
            <Card.Content style={styles.oneTimeCardContent}>
              <View style={styles.oneTimeInfo}>
                <View style={styles.pdfIconContainer}>
                  <MaterialCommunityIcons name="file-pdf-box" size={28} color="#E53935" />
                </View>
                <View style={styles.oneTimeText}>
                  <Text variant="titleSmall">Report PDF Annuale</Text>
                  <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
                    Riepilogo completo delle tue finanze
                  </Text>
                </View>
              </View>
              <Button
                mode={hasPurchasedAnnualReport ? 'contained' : 'outlined'}
                onPress={handleReportPurchase}
                disabled={hasPurchasedAnnualReport || isLoading}
                buttonColor={hasPurchasedAnnualReport ? brandColors.success : undefined}
              >
                {hasPurchasedAnnualReport ? 'Acquistato' : '2,99€'}
              </Button>
            </Card.Content>
          </Card>
        </View>

        <Divider style={styles.divider} />

        {/* Tip Jar */}
        <View style={styles.tipJarSection}>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Supporta lo sviluppo
          </Text>
          <Text variant="bodySmall" style={[styles.tipJarSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            Ricevi il badge Supporter permanente
          </Text>

          <View style={styles.tipJarButtons}>
            {(Object.keys(TIP_TIERS) as TipTier[]).map((tier) => {
              const tipInfo = TIP_TIERS[tier];
              return (
                <TouchableOpacity
                  key={tier}
                  style={[
                    styles.tipButton,
                    {
                      borderColor: theme.colors.outline,
                      backgroundColor: theme.colors.surface,
                    },
                    isSupporter && styles.tipButtonDisabled,
                  ]}
                  onPress={() => handleTipPurchase(tier)}
                  disabled={isLoading}
                  activeOpacity={0.7}
                >
                  <Text style={styles.tipEmoji}>{tipInfo.emoji}</Text>
                  <Text variant="bodySmall">{tipInfo.label}</Text>
                  <Text variant="labelMedium" style={{ color: brandColors.primary }}>
                    {tipInfo.price}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {isSupporter && (
            <View style={styles.supporterMessage}>
              <MaterialCommunityIcons name="heart" size={16} color="#E91E63" />
              <Text variant="bodySmall" style={styles.supporterText}>
                Grazie per il tuo supporto!
              </Text>
            </View>
          )}
        </View>

        {/* Legal */}
        <View style={styles.legalSection}>
          <Text variant="bodySmall" style={[styles.legalText, { color: theme.colors.onSurfaceVariant }]}>
            L'abbonamento si rinnova automaticamente. Puoi cancellare in qualsiasi momento dalle impostazioni del tuo account.
          </Text>
          <View style={styles.legalLinks}>
            <TouchableOpacity onPress={() => Linking.openURL('https://finanzami.pro/terms')}>
              <Text variant="labelSmall" style={{ color: brandColors.primary }}>
                Termini di servizio
              </Text>
            </TouchableOpacity>
            <Text variant="labelSmall" style={{ color: theme.colors.onSurfaceVariant }}>
              {' | '}
            </Text>
            <TouchableOpacity onPress={() => Linking.openURL('https://finanzami.pro/privacy')}>
              <Text variant="labelSmall" style={{ color: brandColors.primary }}>
                Privacy Policy
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => {
          setSnackbarVisible(false);
          clearError();
        }}
        duration={3000}
      >
        {snackbarMessage}
      </Snackbar>
    </SafeAreaView>
  );
}

const FeatureRow: React.FC<{
  icon: string;
  title: string;
  description: string;
}> = ({ icon, title, description }) => {
  const theme = useTheme();

  return (
    <View style={styles.featureRow}>
      <LinearGradient
        colors={[brandColors.gradientStart, brandColors.gradientEnd]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.featureIconGradient}
      >
        <MaterialCommunityIcons name={icon as any} size={18} color="#FFFFFF" />
      </LinearGradient>
      <View style={styles.featureTextContainer}>
        <Text variant="bodyMedium" style={styles.featureTitle}>
          {title}
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {description}
        </Text>
      </View>
      <MaterialCommunityIcons name="check-circle" size={20} color={brandColors.success} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerGradient: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
  },
  headerTitle: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  hero: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.lg,
  },
  crownContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 215, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  heroTitle: {
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#FFFFFF',
    marginBottom: spacing.xs,
  },
  heroSubtitle: {
    textAlign: 'center',
    color: 'rgba(255, 255, 255, 0.85)',
  },
  curveContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 25,
    overflow: 'hidden',
  },
  curve: {
    position: 'absolute',
    bottom: 0,
    left: -50,
    right: -50,
    height: 50,
    borderTopLeftRadius: 1000,
    borderTopRightRadius: 1000,
  },
  scrollView: {
    marginTop: -15,
  },
  scrollContent: {
    padding: spacing.lg,
    paddingTop: spacing.md,
  },
  sectionTitle: {
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  pricingSection: {
    marginBottom: spacing.lg,
  },
  pricingCards: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  pricingCard: {
    flex: 1,
    borderRadius: borderRadius.lg,
  },
  pricingCardSelected: {},
  pricingCardPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  selectedCardBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: borderRadius.lg,
    padding: 2,
  },
  pricingCardInner: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg - 2,
    alignItems: 'center',
    margin: 2,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    zIndex: 1,
  },
  saveBadgeGradient: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  saveBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  radioIcon: {
    marginBottom: spacing.sm,
    marginTop: spacing.sm,
  },
  planName: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  planPrice: {
    fontWeight: 'bold',
  },
  featuresCardBorder: {
    borderRadius: borderRadius.lg,
    padding: 2,
    marginBottom: spacing.lg,
  },
  featuresCardInner: {
    borderRadius: borderRadius.lg - 2,
    padding: spacing.lg,
  },
  featuresTitle: {
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  featuresList: {
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  featureIconGradient: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTextContainer: {
    flex: 1,
  },
  featureTitle: {
    fontWeight: '500',
  },
  ctaButtonContainer: {
    borderRadius: borderRadius.xl,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  ctaButtonPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
  ctaButtonDisabled: {
    opacity: 0.6,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: borderRadius.xl,
  },
  ctaIcon: {
    marginRight: spacing.sm,
  },
  ctaText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  divider: {
    marginVertical: spacing.lg,
  },
  oneTimeSection: {
    marginBottom: spacing.md,
  },
  oneTimeCard: {
    borderRadius: borderRadius.lg,
  },
  oneTimeCardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  oneTimeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    flex: 1,
  },
  pdfIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFEBEE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  oneTimeText: {
    flex: 1,
  },
  tipJarSection: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  tipJarSubtitle: {
    marginBottom: spacing.md,
  },
  tipJarButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  tipButton: {
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    minWidth: 90,
  },
  tipButtonDisabled: {
    opacity: 0.5,
  },
  tipEmoji: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  supporterMessage: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  supporterText: {
    color: '#E91E63',
  },
  legalSection: {
    alignItems: 'center',
    marginTop: spacing.md,
    marginBottom: spacing.xl,
  },
  legalText: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // Premium active styles
  premiumActiveGradient: {
    flex: 1,
  },
  premiumActiveSafeArea: {
    flex: 1,
  },
  premiumActiveHeader: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
  },
  premiumActiveContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  crownContainerActive: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  premiumActiveTitle: {
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: spacing.sm,
  },
  premiumActiveSubtitle: {
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: spacing.xl,
  },
  premiumActiveButtonContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  manageButton: {
    borderRadius: borderRadius.lg,
  },
});
