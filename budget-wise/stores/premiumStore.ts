import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { CustomerInfo, PurchasesOfferings, PurchasesPackage } from 'react-native-purchases';
import {
  initializeRevenueCat,
  getOfferings,
  getCustomerInfo,
  purchasePackage as rcPurchasePackage,
  restorePurchases as rcRestorePurchases,
  logoutRevenueCat,
  ENTITLEMENTS,
  PRODUCT_IDS,
  TipTier,
  TIP_TIERS,
} from '../services/revenueCat';

// Limiti per utenti FREE
export const FREE_LIMITS = {
  maxGoals: 1,
  maxCategories: 5, // categorie custom (oltre le preset)
} as const;

// Tipi di feature che possono essere premium
export type PremiumFeature =
  | 'unlimited_goals'
  | 'unlimited_categories'
  | 'advanced_insights'
  | 'patrimonio'
  | 'shared_expenses'
  | 'annual_report'
  | 'subscriptions_tracking';

// Acquisti tip jar
interface TipPurchase {
  tier: TipTier;
  amount: number;
  purchasedAt: string;
}

interface PremiumState {
  // Stato subscription
  isPremium: boolean;
  subscriptionType: 'free' | 'monthly' | 'yearly' | null;
  subscriptionExpiry: string | null;

  // Acquisti one-time
  hasPurchasedAnnualReport: boolean;

  // Tip Jar
  tipPurchases: TipPurchase[];
  isSupporter: boolean;

  // RevenueCat data
  customerInfo: CustomerInfo | null;
  offerings: PurchasesOfferings | null;

  // Loading states
  isLoading: boolean;
  isRestoring: boolean;
  error: string | null;
  isInitialized: boolean;

  // Actions
  initialize: (userId: string) => Promise<void>;
  refreshStatus: () => Promise<void>;
  purchasePackage: (pkg: PurchasesPackage) => Promise<{ error: string | null }>;
  purchaseProduct: (productId: string) => Promise<{ error: string | null }>;
  restorePurchases: () => Promise<{ error: string | null; restored: boolean }>;
  logout: () => Promise<void>;

  // Helpers
  canUseFeature: (feature: PremiumFeature) => boolean;
  getFeatureLimits: () => { maxGoals: number; maxCategories: number };
  clearError: () => void;
}

export const usePremiumStore = create<PremiumState>()(
  persist(
    (set, get) => ({
      // Initial state
      isPremium: false,
      subscriptionType: 'free',
      subscriptionExpiry: null,
      hasPurchasedAnnualReport: false,
      tipPurchases: [],
      isSupporter: false,
      customerInfo: null,
      offerings: null,
      isLoading: false,
      isRestoring: false,
      error: null,
      isInitialized: false,

      /**
       * Inizializza RevenueCat e carica lo stato premium
       */
      initialize: async (userId: string) => {
        if (get().isInitialized) {
          // Già inizializzato, solo refresh
          await get().refreshStatus();
          return;
        }

        set({ isLoading: true, error: null });

        try {
          // Inizializza RevenueCat
          await initializeRevenueCat(userId);

          // Carica offerings e customer info in parallelo
          const [offerings, customerInfo] = await Promise.all([
            getOfferings(),
            getCustomerInfo(),
          ]);

          // Processa customer info per determinare lo stato premium
          const premiumEntitlement = customerInfo?.entitlements?.active?.[ENTITLEMENTS.PREMIUM];
          const isPremium = !!premiumEntitlement;

          let subscriptionType: 'free' | 'monthly' | 'yearly' | null = 'free';
          if (isPremium && premiumEntitlement) {
            const productId = premiumEntitlement.productIdentifier;
            if (productId === PRODUCT_IDS.PREMIUM_MONTHLY) {
              subscriptionType = 'monthly';
            } else if (productId === PRODUCT_IDS.PREMIUM_YEARLY) {
              subscriptionType = 'yearly';
            }
          }

          // Check per annual report
          const hasAnnualReport = !!customerInfo?.entitlements?.active?.[ENTITLEMENTS.ANNUAL_REPORT];

          // Check per supporter (tip jar)
          const isSupporter = !!customerInfo?.entitlements?.active?.[ENTITLEMENTS.SUPPORTER];

          set({
            isPremium,
            subscriptionType,
            subscriptionExpiry: premiumEntitlement?.expirationDate || null,
            hasPurchasedAnnualReport: hasAnnualReport,
            isSupporter,
            customerInfo,
            offerings,
            isLoading: false,
            isInitialized: true,
          });
        } catch (error) {
          console.error('[PremiumStore] Initialization error:', error);
          set({
            isLoading: false,
            error: 'Errore durante il caricamento dello stato premium',
            isInitialized: true, // Comunque marchiamo come inizializzato per evitare loop
          });
        }
      },

      /**
       * Aggiorna lo stato premium da RevenueCat
       */
      refreshStatus: async () => {
        set({ isLoading: true, error: null });

        try {
          const customerInfo = await getCustomerInfo();

          if (!customerInfo) {
            set({ isLoading: false });
            return;
          }

          const premiumEntitlement = customerInfo.entitlements?.active?.[ENTITLEMENTS.PREMIUM];
          const isPremium = !!premiumEntitlement;

          let subscriptionType: 'free' | 'monthly' | 'yearly' | null = 'free';
          if (isPremium && premiumEntitlement) {
            const productId = premiumEntitlement.productIdentifier;
            if (productId === PRODUCT_IDS.PREMIUM_MONTHLY) {
              subscriptionType = 'monthly';
            } else if (productId === PRODUCT_IDS.PREMIUM_YEARLY) {
              subscriptionType = 'yearly';
            }
          }

          const hasAnnualReport = !!customerInfo.entitlements?.active?.[ENTITLEMENTS.ANNUAL_REPORT];
          const isSupporter = !!customerInfo.entitlements?.active?.[ENTITLEMENTS.SUPPORTER];

          set({
            isPremium,
            subscriptionType,
            subscriptionExpiry: premiumEntitlement?.expirationDate || null,
            hasPurchasedAnnualReport: hasAnnualReport,
            isSupporter,
            customerInfo,
            isLoading: false,
          });
        } catch (error) {
          console.error('[PremiumStore] Refresh error:', error);
          set({ isLoading: false });
        }
      },

      /**
       * Acquista un pacchetto (subscription)
       */
      purchasePackage: async (pkg: PurchasesPackage) => {
        set({ isLoading: true, error: null });

        try {
          const { customerInfo, error } = await rcPurchasePackage(pkg);

          if (error) {
            set({ isLoading: false, error });
            return { error };
          }

          if (customerInfo) {
            // Aggiorna lo stato con le nuove info
            const premiumEntitlement = customerInfo.entitlements?.active?.[ENTITLEMENTS.PREMIUM];
            const isPremium = !!premiumEntitlement;

            let subscriptionType: 'free' | 'monthly' | 'yearly' | null = 'free';
            if (isPremium && premiumEntitlement) {
              const productId = premiumEntitlement.productIdentifier;
              if (productId === PRODUCT_IDS.PREMIUM_MONTHLY) {
                subscriptionType = 'monthly';
              } else if (productId === PRODUCT_IDS.PREMIUM_YEARLY) {
                subscriptionType = 'yearly';
              }
            }

            set({
              isPremium,
              subscriptionType,
              subscriptionExpiry: premiumEntitlement?.expirationDate || null,
              customerInfo,
              isLoading: false,
            });
          } else {
            set({ isLoading: false });
          }

          return { error: null };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Errore durante l\'acquisto';
          set({ isLoading: false, error: message });
          return { error: message };
        }
      },

      /**
       * Acquista un prodotto one-time (report, tip jar)
       */
      purchaseProduct: async (productId: string) => {
        set({ isLoading: true, error: null });

        try {
          // Per ora usiamo purchasePackage - in produzione si userebbe purchaseStoreProduct
          // Questo è un placeholder che andrà implementato con la logica corretta
          console.log('[PremiumStore] Purchasing product:', productId);

          // Simula acquisto tip jar per development
          if (productId.includes('tip_')) {
            const tier = productId.replace('budgetwise_tip_', '') as TipTier;
            const tipInfo = TIP_TIERS[tier];

            if (tipInfo) {
              const newPurchase: TipPurchase = {
                tier,
                amount: parseFloat(tipInfo.price.replace('€', '').replace(',', '.')),
                purchasedAt: new Date().toISOString(),
              };

              set((state) => ({
                tipPurchases: [...state.tipPurchases, newPurchase],
                isSupporter: true,
                isLoading: false,
              }));

              return { error: null };
            }
          }

          // Per report annuale
          if (productId === PRODUCT_IDS.ANNUAL_REPORT) {
            set({
              hasPurchasedAnnualReport: true,
              isLoading: false,
            });
            return { error: null };
          }

          set({ isLoading: false });
          return { error: null };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Errore durante l\'acquisto';
          set({ isLoading: false, error: message });
          return { error: message };
        }
      },

      /**
       * Ripristina acquisti precedenti
       */
      restorePurchases: async () => {
        set({ isRestoring: true, error: null });

        try {
          const { customerInfo, error } = await rcRestorePurchases();

          if (error) {
            set({ isRestoring: false, error });
            return { error, restored: false };
          }

          if (!customerInfo) {
            set({ isRestoring: false });
            return { error: null, restored: false };
          }

          // Controlla se c'è qualcosa da ripristinare
          const hasActiveEntitlements = Object.keys(customerInfo.entitlements?.active || {}).length > 0;

          if (hasActiveEntitlements) {
            // Aggiorna lo stato
            const premiumEntitlement = customerInfo.entitlements?.active?.[ENTITLEMENTS.PREMIUM];
            const isPremium = !!premiumEntitlement;

            let subscriptionType: 'free' | 'monthly' | 'yearly' | null = 'free';
            if (isPremium && premiumEntitlement) {
              const productId = premiumEntitlement.productIdentifier;
              if (productId === PRODUCT_IDS.PREMIUM_MONTHLY) {
                subscriptionType = 'monthly';
              } else if (productId === PRODUCT_IDS.PREMIUM_YEARLY) {
                subscriptionType = 'yearly';
              }
            }

            const hasAnnualReport = !!customerInfo.entitlements?.active?.[ENTITLEMENTS.ANNUAL_REPORT];
            const isSupporter = !!customerInfo.entitlements?.active?.[ENTITLEMENTS.SUPPORTER];

            set({
              isPremium,
              subscriptionType,
              subscriptionExpiry: premiumEntitlement?.expirationDate || null,
              hasPurchasedAnnualReport: hasAnnualReport,
              isSupporter,
              customerInfo,
              isRestoring: false,
            });

            return { error: null, restored: true };
          }

          set({ isRestoring: false });
          return { error: null, restored: false };
        } catch (error) {
          const message = error instanceof Error ? error.message : 'Errore durante il ripristino';
          set({ isRestoring: false, error: message });
          return { error: message, restored: false };
        }
      },

      /**
       * Logout - chiamare quando l'utente fa signOut
       */
      logout: async () => {
        await logoutRevenueCat();

        set({
          isPremium: false,
          subscriptionType: 'free',
          subscriptionExpiry: null,
          hasPurchasedAnnualReport: false,
          tipPurchases: [],
          isSupporter: false,
          customerInfo: null,
          offerings: null,
          isInitialized: false,
          error: null,
        });
      },

      /**
       * Verifica se l'utente può usare una feature
       */
      canUseFeature: (feature: PremiumFeature): boolean => {
        const { isPremium, hasPurchasedAnnualReport } = get();

        switch (feature) {
          case 'unlimited_goals':
          case 'unlimited_categories':
          case 'advanced_insights':
          case 'patrimonio':
          case 'shared_expenses':
          case 'subscriptions_tracking':
            return isPremium;

          case 'annual_report':
            return isPremium || hasPurchasedAnnualReport;

          default:
            return false;
        }
      },

      /**
       * Ottiene i limiti per l'utente corrente
       */
      getFeatureLimits: () => {
        const { isPremium } = get();

        if (isPremium) {
          return {
            maxGoals: Infinity,
            maxCategories: Infinity,
          };
        }

        return {
          maxGoals: FREE_LIMITS.maxGoals,
          maxCategories: FREE_LIMITS.maxCategories,
        };
      },

      clearError: () => set({ error: null }),
    }),
    {
      name: 'premium-storage',
      storage: createJSONStorage(() => AsyncStorage),
      // Persisti solo alcuni campi (non customerInfo che è grande)
      partialize: (state) => ({
        isPremium: state.isPremium,
        subscriptionType: state.subscriptionType,
        subscriptionExpiry: state.subscriptionExpiry,
        hasPurchasedAnnualReport: state.hasPurchasedAnnualReport,
        tipPurchases: state.tipPurchases,
        isSupporter: state.isSupporter,
      }),
    }
  )
);

// Hook helper per check rapidi
export const useIsPremium = () => usePremiumStore((state) => state.isPremium);
export const useCanUseFeature = (feature: PremiumFeature) =>
  usePremiumStore((state) => state.canUseFeature(feature));
