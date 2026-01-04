import { Platform } from 'react-native';
import Purchases, {
  CustomerInfo,
  PurchasesOfferings,
  PurchasesPackage,
  LOG_LEVEL,
} from 'react-native-purchases';
import Constants from 'expo-constants';

// RevenueCat API Keys - Da configurare su RevenueCat Dashboard
// Per ora usiamo placeholder, andranno sostituiti con le chiavi reali
const REVENUECAT_IOS_KEY = process.env.EXPO_PUBLIC_REVENUECAT_IOS_KEY || '';
const REVENUECAT_ANDROID_KEY = process.env.EXPO_PUBLIC_REVENUECAT_ANDROID_KEY || '';

// Check if running in Expo Go (where RevenueCat native SDK doesn't work)
const IS_EXPO_GO = Constants.appOwnership === 'expo';

// Product IDs (devono corrispondere a quelli configurati su App Store Connect / Google Play Console)
export const PRODUCT_IDS = {
  // Subscriptions
  PREMIUM_MONTHLY: 'budgetwise_premium_monthly',
  PREMIUM_YEARLY: 'budgetwise_premium_yearly',
  // One-time purchases
  ANNUAL_REPORT: 'budgetwise_annual_report',
  // Tip Jar (consumable)
  TIP_COFFEE: 'budgetwise_tip_coffee',
  TIP_PIZZA: 'budgetwise_tip_pizza',
  TIP_DINNER: 'budgetwise_tip_dinner',
} as const;

// Entitlements (configurati su RevenueCat Dashboard)
export const ENTITLEMENTS = {
  PREMIUM: 'premium',
  ANNUAL_REPORT: 'annual_report',
  SUPPORTER: 'supporter',
} as const;

// Tip Jar tiers con prezzi
export const TIP_TIERS = {
  coffee: { id: PRODUCT_IDS.TIP_COFFEE, price: '€1,99', emoji: '☕', label: 'Caffè' },
  pizza: { id: PRODUCT_IDS.TIP_PIZZA, price: '€4,99', emoji: '🍕', label: 'Pizza' },
  dinner: { id: PRODUCT_IDS.TIP_DINNER, price: '€9,99', emoji: '🍽️', label: 'Cena' },
} as const;

export type TipTier = keyof typeof TIP_TIERS;

// Flag per development mode (mock purchases)
const IS_DEVELOPMENT = __DEV__;

let isInitialized = false;

/**
 * Inizializza RevenueCat SDK
 * Deve essere chiamato una volta all'avvio dell'app dopo il login
 */
export const initializeRevenueCat = async (userId: string): Promise<void> => {
  if (isInitialized) {
    console.log('[RevenueCat] Already initialized');
    return;
  }

  // In Expo Go, skip RevenueCat initialization and use mock mode
  if (IS_EXPO_GO) {
    console.log('[RevenueCat] Running in Expo Go - using mock mode');
    isInitialized = true;
    return;
  }

  const apiKey = Platform.OS === 'ios' ? REVENUECAT_IOS_KEY : REVENUECAT_ANDROID_KEY;

  if (!apiKey) {
    console.warn('[RevenueCat] API key not configured for', Platform.OS);
    // In development, continuiamo comunque con mock mode
    if (IS_DEVELOPMENT) {
      isInitialized = true;
      return;
    }
    throw new Error('RevenueCat API key not configured');
  }

  try {
    // Configura log level
    if (IS_DEVELOPMENT) {
      Purchases.setLogLevel(LOG_LEVEL.DEBUG);
    }

    // Inizializza SDK
    await Purchases.configure({
      apiKey,
      appUserID: userId,
    });

    isInitialized = true;
    console.log('[RevenueCat] Initialized successfully for user:', userId);
  } catch (error) {
    console.error('[RevenueCat] Initialization error:', error);
    throw error;
  }
};

/**
 * Verifica se RevenueCat è inizializzato
 */
export const isRevenueCatInitialized = (): boolean => isInitialized;

/**
 * Ottiene le offerte disponibili (piani e prezzi)
 */
export const getOfferings = async (): Promise<PurchasesOfferings | null> => {
  // In Expo Go or development without initialization, use mock data
  if (IS_EXPO_GO || (IS_DEVELOPMENT && !isInitialized)) {
    return getMockOfferings();
  }

  try {
    const offerings = await Purchases.getOfferings();
    return offerings;
  } catch (error) {
    console.error('[RevenueCat] Error fetching offerings:', error);
    return null;
  }
};

/**
 * Ottiene le informazioni del cliente (subscription status, purchases, etc.)
 */
export const getCustomerInfo = async (): Promise<CustomerInfo | null> => {
  // In Expo Go or development without initialization, use mock data
  if (IS_EXPO_GO || (IS_DEVELOPMENT && !isInitialized)) {
    return getMockCustomerInfo();
  }

  try {
    const customerInfo = await Purchases.getCustomerInfo();
    return customerInfo;
  } catch (error) {
    console.error('[RevenueCat] Error fetching customer info:', error);
    return null;
  }
};

/**
 * Verifica se l'utente ha un entitlement attivo
 */
export const checkEntitlement = async (entitlement: string): Promise<boolean> => {
  const customerInfo = await getCustomerInfo();
  if (!customerInfo) return false;

  return typeof customerInfo.entitlements.active[entitlement] !== 'undefined';
};

/**
 * Verifica se l'utente è Premium
 */
export const isPremiumUser = async (): Promise<boolean> => {
  return checkEntitlement(ENTITLEMENTS.PREMIUM);
};

/**
 * Acquista un pacchetto (subscription o one-time)
 */
export const purchasePackage = async (
  pkg: PurchasesPackage
): Promise<{ customerInfo: CustomerInfo | null; error: string | null }> => {
  // In Expo Go, purchases are not available
  if (IS_EXPO_GO) {
    console.log('[RevenueCat] Expo Go - mock purchase:', pkg.identifier);
    return { customerInfo: getMockCustomerInfo(true), error: null };
  }

  if (IS_DEVELOPMENT && !isInitialized) {
    console.log('[RevenueCat] Mock purchase:', pkg.identifier);
    return { customerInfo: getMockCustomerInfo(true), error: null };
  }

  try {
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    return { customerInfo, error: null };
  } catch (error: any) {
    // Gestione errori specifici di RevenueCat
    if (error.userCancelled) {
      return { customerInfo: null, error: null }; // User cancelled, non è un errore
    }

    const errorMessage = error.message || 'Errore durante l\'acquisto';
    console.error('[RevenueCat] Purchase error:', error);
    return { customerInfo: null, error: errorMessage };
  }
};

/**
 * Acquista un prodotto tramite ID
 */
export const purchaseProduct = async (
  productId: string
): Promise<{ customerInfo: CustomerInfo | null; error: string | null }> => {
  // In Expo Go, purchases are not available
  if (IS_EXPO_GO) {
    console.log('[RevenueCat] Expo Go - mock purchase product:', productId);
    return { customerInfo: getMockCustomerInfo(true), error: null };
  }

  if (IS_DEVELOPMENT && !isInitialized) {
    console.log('[RevenueCat] Mock purchase product:', productId);
    return { customerInfo: getMockCustomerInfo(true), error: null };
  }

  try {
    const { customerInfo } = await Purchases.purchaseStoreProduct({
      productId,
    } as any);
    return { customerInfo, error: null };
  } catch (error: any) {
    if (error.userCancelled) {
      return { customerInfo: null, error: null };
    }

    const errorMessage = error.message || 'Errore durante l\'acquisto';
    console.error('[RevenueCat] Purchase product error:', error);
    return { customerInfo: null, error: errorMessage };
  }
};

/**
 * Ripristina acquisti precedenti
 */
export const restorePurchases = async (): Promise<{
  customerInfo: CustomerInfo | null;
  error: string | null;
}> => {
  // In Expo Go, restore is not available
  if (IS_EXPO_GO) {
    console.log('[RevenueCat] Expo Go - mock restore purchases');
    return { customerInfo: getMockCustomerInfo(), error: null };
  }

  if (IS_DEVELOPMENT && !isInitialized) {
    console.log('[RevenueCat] Mock restore purchases');
    return { customerInfo: getMockCustomerInfo(), error: null };
  }

  try {
    const customerInfo = await Purchases.restorePurchases();
    return { customerInfo, error: null };
  } catch (error: any) {
    const errorMessage = error.message || 'Errore durante il ripristino';
    console.error('[RevenueCat] Restore error:', error);
    return { customerInfo: null, error: errorMessage };
  }
};

/**
 * Logout utente da RevenueCat (chiamare quando l'utente fa signOut)
 */
export const logoutRevenueCat = async (): Promise<void> => {
  if (!isInitialized) return;

  // In Expo Go, just reset the flag
  if (IS_EXPO_GO) {
    isInitialized = false;
    console.log('[RevenueCat] Expo Go - logged out (mock)');
    return;
  }

  try {
    await Purchases.logOut();
    isInitialized = false;
    console.log('[RevenueCat] Logged out');
  } catch (error) {
    console.error('[RevenueCat] Logout error:', error);
  }
};

// ============================================
// Mock data per development
// ============================================

const getMockOfferings = (): PurchasesOfferings => {
  return {
    current: {
      identifier: 'default',
      serverDescription: 'Default offering',
      metadata: {},
      availablePackages: [
        {
          identifier: 'monthly',
          packageType: 'MONTHLY',
          product: {
            identifier: PRODUCT_IDS.PREMIUM_MONTHLY,
            description: 'Accesso Premium mensile',
            title: 'Premium Mensile',
            price: 3.99,
            priceString: '3,99 €',
            currencyCode: 'EUR',
          },
          offeringIdentifier: 'default',
        },
        {
          identifier: 'annual',
          packageType: 'ANNUAL',
          product: {
            identifier: PRODUCT_IDS.PREMIUM_YEARLY,
            description: 'Accesso Premium annuale - Risparmia 37%',
            title: 'Premium Annuale',
            price: 29.99,
            priceString: '29,99 €',
            currencyCode: 'EUR',
          },
          offeringIdentifier: 'default',
        },
      ],
      monthly: null,
      annual: null,
      lifetime: null,
      sixMonth: null,
      threeMonth: null,
      twoMonth: null,
      weekly: null,
    },
    all: {},
  } as any;
};

const getMockCustomerInfo = (isPremium = false): CustomerInfo => {
  return {
    entitlements: {
      active: isPremium
        ? {
            [ENTITLEMENTS.PREMIUM]: {
              identifier: ENTITLEMENTS.PREMIUM,
              isActive: true,
              willRenew: true,
              periodType: 'NORMAL',
              latestPurchaseDate: new Date().toISOString(),
              originalPurchaseDate: new Date().toISOString(),
              expirationDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
              store: 'APP_STORE',
              productIdentifier: PRODUCT_IDS.PREMIUM_MONTHLY,
              isSandbox: true,
            },
          }
        : {},
      all: {},
    },
    activeSubscriptions: isPremium ? [PRODUCT_IDS.PREMIUM_MONTHLY] : [],
    allPurchasedProductIdentifiers: [],
    nonSubscriptionTransactions: [],
    firstSeen: new Date().toISOString(),
    originalAppUserId: 'mock_user',
    requestDate: new Date().toISOString(),
    latestExpirationDate: isPremium
      ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
      : null,
    originalPurchaseDate: null,
    originalApplicationVersion: null,
    managementURL: null,
  } as any;
};
