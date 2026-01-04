import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Button, Card, useTheme } from 'react-native-paper';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { usePremiumStore, PremiumFeature } from '../../stores/premiumStore';
import { spacing, brandColors } from '../../constants/theme';

interface PremiumGateProps {
  feature: PremiumFeature;
  children: React.ReactNode;
  title?: string;
  description?: string;
  showTeaser?: boolean;
}

/**
 * Wrapper che blocca i contenuti per utenti non premium.
 * Mostra un messaggio di upgrade se l'utente non ha accesso alla feature.
 */
export const PremiumGate: React.FC<PremiumGateProps> = ({
  feature,
  children,
  title = 'Funzionalita Premium',
  description = 'Questa funzionalita e disponibile solo per gli utenti Premium.',
  showTeaser = true,
}) => {
  const theme = useTheme();
  const router = useRouter();
  const canUseFeature = usePremiumStore((state) => state.canUseFeature);

  if (canUseFeature(feature)) {
    return <>{children}</>;
  }

  const featureInfo = getFeatureInfo(feature);

  return (
    <View style={styles.container}>
      {showTeaser && (
        <View style={[styles.teaserContainer, { opacity: 0.3 }]}>
          {children}
        </View>
      )}
      <View style={[styles.overlay, { backgroundColor: theme.colors.background }]}>
        <Card style={[styles.card, { backgroundColor: theme.colors.surface }]}>
          <Card.Content style={styles.cardContent}>
            <View style={[styles.iconContainer, { backgroundColor: '#FFD700' + '20' }]}>
              <MaterialCommunityIcons
                name="crown"
                size={48}
                color="#FFD700"
              />
            </View>

            <Text variant="headlineSmall" style={styles.title}>
              {featureInfo.title || title}
            </Text>

            <Text
              variant="bodyMedium"
              style={[styles.description, { color: theme.colors.onSurfaceVariant }]}
            >
              {featureInfo.description || description}
            </Text>

            <View style={styles.benefitsList}>
              {featureInfo.benefits.map((benefit, index) => (
                <View key={index} style={styles.benefitRow}>
                  <MaterialCommunityIcons
                    name="check-circle"
                    size={20}
                    color={brandColors.success}
                  />
                  <Text variant="bodyMedium" style={styles.benefitText}>
                    {benefit}
                  </Text>
                </View>
              ))}
            </View>

            <Button
              mode="contained"
              onPress={() => router.push('/premium')}
              style={styles.button}
              contentStyle={styles.buttonContent}
              icon="crown"
            >
              Scopri Premium
            </Button>
          </Card.Content>
        </Card>
      </View>
    </View>
  );
};

/**
 * Componente per mostrare un badge Premium
 */
export const PremiumBadge: React.FC<{ size?: 'small' | 'medium' | 'large' }> = ({
  size = 'medium',
}) => {
  const iconSize = size === 'small' ? 12 : size === 'medium' ? 16 : 20;
  const fontSize = size === 'small' ? 10 : size === 'medium' ? 12 : 14;
  const padding = size === 'small' ? 4 : size === 'medium' ? 6 : 8;

  return (
    <View style={[styles.badge, { paddingHorizontal: padding, paddingVertical: padding / 2 }]}>
      <MaterialCommunityIcons name="crown" size={iconSize} color="#FFD700" />
      <Text style={[styles.badgeText, { fontSize, marginLeft: 4 }]}>PRO</Text>
    </View>
  );
};

/**
 * Componente per mostrare il badge Supporter
 */
export const SupporterBadge: React.FC = () => {
  const isSupporter = usePremiumStore((state) => state.isSupporter);

  if (!isSupporter) return null;

  return (
    <View style={styles.supporterBadge}>
      <MaterialCommunityIcons name="heart" size={14} color="#E91E63" />
      <Text style={styles.supporterText}>Supporter</Text>
    </View>
  );
};

// Info per ogni feature
const getFeatureInfo = (feature: PremiumFeature) => {
  const featureMap: Record<PremiumFeature, { title: string; description: string; benefits: string[] }> = {
    unlimited_goals: {
      title: 'Obiettivi Illimitati',
      description: 'Con Premium puoi creare tutti gli obiettivi di risparmio che vuoi.',
      benefits: [
        'Crea obiettivi illimitati',
        'Monitora tutti i tuoi traguardi',
        'Suggerimenti personalizzati',
      ],
    },
    unlimited_categories: {
      title: 'Categorie Illimitate',
      description: 'Personalizza le tue categorie di spesa senza limiti.',
      benefits: [
        'Categorie personalizzate illimitate',
        'Icone e colori custom',
        'Organizzazione avanzata',
      ],
    },
    advanced_insights: {
      title: 'Insights Avanzati',
      description: 'Ottieni analisi dettagliate e consigli personalizzati sulle tue finanze.',
      benefits: [
        'Analisi pattern di spesa',
        'Previsioni finanziarie',
        'Coaching personalizzato',
      ],
    },
    patrimonio: {
      title: 'Gestione Patrimonio',
      description: 'Tieni traccia di investimenti, conti e patrimonio netto.',
      benefits: [
        'Tracking investimenti',
        'Patrimonio netto in tempo reale',
        'Performance portfolio',
      ],
    },
    shared_expenses: {
      title: 'Spese Condivise',
      description: 'Dividi le spese con amici e familiari facilmente.',
      benefits: [
        'Dividi spese con altri',
        'Tracking debiti/crediti',
        'Reminder automatici',
      ],
    },
    annual_report: {
      title: 'Report PDF Annuale',
      description: 'Genera un report completo delle tue finanze annuali.',
      benefits: [
        'Report PDF professionale',
        'Grafici e statistiche',
        'Esporta e condividi',
      ],
    },
    subscriptions_tracking: {
      title: 'Gestione Abbonamenti',
      description: 'Tieni sotto controllo tutti i tuoi abbonamenti.',
      benefits: [
        'Tracking abbonamenti',
        'Reminder rinnovi',
        'Analisi costi ricorrenti',
      ],
    },
  };

  return featureMap[feature];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: 'relative',
  },
  teaserContainer: {
    flex: 1,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    borderRadius: 16,
    elevation: 4,
  },
  cardContent: {
    alignItems: 'center',
    padding: spacing.lg,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
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
  benefitsList: {
    alignSelf: 'stretch',
    marginBottom: spacing.lg,
  },
  benefitRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  benefitText: {
    marginLeft: spacing.sm,
    flex: 1,
  },
  button: {
    borderRadius: 24,
  },
  buttonContent: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFD700' + '20',
    borderRadius: 12,
  },
  badgeText: {
    fontWeight: 'bold',
    color: '#B8860B',
  },
  supporterBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E91E63' + '20',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  supporterText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#E91E63',
    marginLeft: 4,
  },
});

export default PremiumGate;
