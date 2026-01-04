import React from 'react';
import { View, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { Text, Button, useTheme, Portal, IconButton } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePremiumStore } from '../../stores/premiumStore';
import { spacing, brandColors } from '../../constants/theme';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface PaywallModalProps {
  visible: boolean;
  onDismiss: () => void;
  feature?: string;
  title?: string;
  description?: string;
}

/**
 * Modal che appare quando l'utente tenta di usare una feature premium.
 * Mostra un teaser e invita a passare a Premium.
 */
export const PaywallModal: React.FC<PaywallModalProps> = ({
  visible,
  onDismiss,
  feature,
  title = 'Passa a Premium',
  description = 'Sblocca tutte le funzionalita per gestire al meglio le tue finanze.',
}) => {
  const theme = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { offerings, isLoading } = usePremiumStore();

  const handleUpgrade = () => {
    onDismiss();
    router.push('/premium');
  };

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

  return (
    <Portal>
      <Modal
        visible={visible}
        transparent
        animationType="slide"
        onRequestClose={onDismiss}
      >
        <View style={styles.backdrop}>
          <TouchableOpacity
            style={styles.backdropTouchable}
            activeOpacity={1}
            onPress={onDismiss}
          />
          <View
            style={[
              styles.container,
              {
                backgroundColor: theme.colors.surface,
                paddingBottom: insets.bottom + spacing.md,
              },
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={styles.handle} />
              <IconButton
                icon="close"
                size={24}
                onPress={onDismiss}
                style={styles.closeButton}
              />
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.content}
            >
              {/* Crown Icon */}
              <View style={styles.crownContainer}>
                <MaterialCommunityIcons name="crown" size={56} color="#FFD700" />
              </View>

              {/* Title */}
              <Text variant="headlineSmall" style={styles.title}>
                {title}
              </Text>

              {/* Description */}
              <Text
                variant="bodyLarge"
                style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
              >
                {description}
              </Text>

              {/* Features */}
              <View style={styles.featuresContainer}>
                <FeatureItem icon="infinity" text="Obiettivi illimitati" />
                <FeatureItem icon="tag-multiple" text="Categorie illimitate" />
                <FeatureItem icon="lightbulb-on" text="Insights avanzati" />
                <FeatureItem icon="bank" text="Gestione patrimonio" />
                <FeatureItem icon="account-group" text="Spese condivise" />
                <FeatureItem icon="file-pdf-box" text="Report PDF annuale" />
              </View>

              {/* Pricing Preview */}
              <View style={styles.pricingContainer}>
                <View
                  style={[
                    styles.pricingCard,
                    styles.pricingCardHighlight,
                    { borderColor: brandColors.primary },
                  ]}
                >
                  <View style={styles.saveBadge}>
                    <Text style={styles.saveBadgeText}>-37%</Text>
                  </View>
                  <Text variant="titleMedium" style={styles.pricingTitle}>
                    Annuale
                  </Text>
                  <Text variant="headlineMedium" style={styles.pricingPrice}>
                    {getYearlyPrice()}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    /anno
                  </Text>
                </View>
                <View style={[styles.pricingCard, { borderColor: theme.colors.outline }]}>
                  <Text variant="titleMedium" style={styles.pricingTitle}>
                    Mensile
                  </Text>
                  <Text variant="headlineMedium" style={styles.pricingPrice}>
                    {getMonthlyPrice()}
                  </Text>
                  <Text
                    variant="bodySmall"
                    style={{ color: theme.colors.onSurfaceVariant }}
                  >
                    /mese
                  </Text>
                </View>
              </View>

              {/* CTA Button */}
              <Button
                mode="contained"
                onPress={handleUpgrade}
                style={styles.ctaButton}
                contentStyle={styles.ctaButtonContent}
                icon="crown"
                loading={isLoading}
              >
                Scopri tutti i piani
              </Button>

              {/* Secondary action */}
              <Button mode="text" onPress={onDismiss} style={styles.secondaryButton}>
                Continua con il piano Free
              </Button>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Portal>
  );
};

const FeatureItem: React.FC<{ icon: string; text: string }> = ({ icon, text }) => {
  const theme = useTheme();

  return (
    <View style={styles.featureItem}>
      <MaterialCommunityIcons
        name={icon as any}
        size={20}
        color={brandColors.primary}
      />
      <Text variant="bodyMedium" style={styles.featureText}>
        {text}
      </Text>
    </View>
  );
};

/**
 * Hook per gestire facilmente il paywall modal
 */
export const usePaywallModal = () => {
  const [visible, setVisible] = React.useState(false);
  const [modalProps, setModalProps] = React.useState<Partial<PaywallModalProps>>({});

  const showPaywall = (props?: Partial<PaywallModalProps>) => {
    setModalProps(props || {});
    setVisible(true);
  };

  const hidePaywall = () => {
    setVisible(false);
    setModalProps({});
  };

  const PaywallModalComponent = () => (
    <PaywallModal visible={visible} onDismiss={hidePaywall} {...modalProps} />
  );

  return {
    showPaywall,
    hidePaywall,
    PaywallModal: PaywallModalComponent,
  };
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  backdropTouchable: {
    flex: 1,
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  header: {
    alignItems: 'center',
    paddingTop: spacing.sm,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E0E0E0',
    borderRadius: 2,
  },
  closeButton: {
    position: 'absolute',
    right: spacing.sm,
    top: 0,
  },
  content: {
    padding: spacing.lg,
    alignItems: 'center',
  },
  crownContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#FFD700' + '20',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  description: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  featuresContainer: {
    alignSelf: 'stretch',
    marginBottom: spacing.lg,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  featureText: {
    marginLeft: spacing.sm,
  },
  pricingContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  pricingCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  pricingCardHighlight: {
    borderWidth: 2,
  },
  saveBadge: {
    position: 'absolute',
    top: -10,
    right: -10,
    backgroundColor: brandColors.success,
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  saveBadgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  pricingTitle: {
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  pricingPrice: {
    fontWeight: 'bold',
  },
  ctaButton: {
    alignSelf: 'stretch',
    borderRadius: 24,
    marginBottom: spacing.sm,
  },
  ctaButtonContent: {
    paddingVertical: 8,
  },
  secondaryButton: {
    marginTop: spacing.xs,
  },
});

export default PaywallModal;
