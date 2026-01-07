// Enable Banking Store - manages bank connections and sync state
import { create } from 'zustand';
import * as enableBankingService from '../services/enableBanking';
import type {
  EnableBankingAccount,
  EnableBankingSession,
  ASPSP,
  SyncStats,
} from '../services/enableBanking';

export type SyncStatus = 'idle' | 'connecting' | 'syncing' | 'success' | 'error';

interface EnableBankingState {
  // State
  connectedAccounts: EnableBankingAccount[];
  sessions: EnableBankingSession[];
  availableBanks: ASPSP[];
  syncStatus: SyncStatus;
  lastSyncAt: Date | null;
  error: string | null;
  isLoading: boolean;
  lastSyncStats: SyncStats | null;
  selectedCountry: string;

  // Actions
  fetchAvailableBanks: (country?: string) => Promise<void>;
  fetchConnectedAccounts: (refreshBalances?: boolean) => Promise<void>;
  startConnection: (bankName: string, country?: string, appRedirectUrl?: string) => Promise<string>;
  completeConnection: (callbackUrl: string) => Promise<{
    success: boolean;
    bankName?: string;
    accountsCount?: number;
    error?: string;
  }>;
  syncAccount: (accountId: string, fromDate?: string, toDate?: string) => Promise<SyncStats>;
  syncAllAccounts: () => Promise<void>;
  disconnectBank: (sessionId: string, deleteTransactions?: boolean) => Promise<void>;
  setSelectedCountry: (country: string) => void;
  clearError: () => void;
  reset: () => void;

  // Computed
  hasConnectedBanks: () => boolean;
  getActiveAccounts: () => EnableBankingAccount[];
  getTotalBalance: () => number;
  getAccountsBySession: (sessionId: string) => EnableBankingAccount[];
}

const initialState = {
  connectedAccounts: [],
  sessions: [],
  availableBanks: [],
  syncStatus: 'idle' as SyncStatus,
  lastSyncAt: null,
  error: null,
  isLoading: false,
  lastSyncStats: null,
  selectedCountry: 'IT',
};

export const useEnableBankingStore = create<EnableBankingState>((set, get) => ({
  ...initialState,

  fetchAvailableBanks: async (country?: string) => {
    try {
      set({ isLoading: true, error: null });

      const countryCode = country || get().selectedCountry;
      const { aspsps } = await enableBankingService.getAvailableBanks(countryCode);

      set({
        availableBanks: aspsps,
        selectedCountry: countryCode,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching available banks:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Errore nel caricamento delle banche',
      });
    }
  },

  fetchConnectedAccounts: async (refreshBalances = false) => {
    try {
      set({ isLoading: true, error: null });

      const { accounts, sessions } = await enableBankingService.getConnectedAccounts(
        refreshBalances
      );

      set({
        connectedAccounts: accounts,
        sessions,
        isLoading: false,
      });
    } catch (error) {
      console.error('Error fetching connected accounts:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Errore nel caricamento dei conti',
      });
    }
  },

  startConnection: async (bankName: string, country?: string, appRedirectUrl?: string) => {
    try {
      set({ syncStatus: 'connecting', error: null });

      const countryCode = country || get().selectedCountry;
      const { url } = await enableBankingService.startBankConnection(bankName, countryCode, appRedirectUrl);

      return url;
    } catch (error) {
      console.error('Error starting connection:', error);
      set({
        syncStatus: 'error',
        error: error instanceof Error ? error.message : 'Errore nella connessione',
      });
      throw error;
    }
  },

  completeConnection: async (callbackUrl: string) => {
    try {
      set({ syncStatus: 'connecting', error: null });

      const result = await enableBankingService.handleBankCallback(callbackUrl);

      if (result.success) {
        // Refresh accounts list
        await get().fetchConnectedAccounts();

        set({ syncStatus: 'success' });

        return {
          success: true,
          bankName: result.bank_name,
          accountsCount: result.accounts_count,
        };
      } else {
        set({
          syncStatus: 'error',
          error: result.error || 'Errore nella connessione',
        });

        return {
          success: false,
          error: result.error,
        };
      }
    } catch (error) {
      console.error('Error completing connection:', error);
      const errorMessage = error instanceof Error ? error.message : 'Errore nella connessione';
      set({
        syncStatus: 'error',
        error: errorMessage,
      });
      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  syncAccount: async (accountId: string, fromDate?: string, toDate?: string) => {
    try {
      set({ syncStatus: 'syncing', error: null });

      const { stats } = await enableBankingService.syncTransactions(
        accountId,
        fromDate,
        toDate
      );

      set({
        syncStatus: 'success',
        lastSyncAt: new Date(),
        lastSyncStats: stats,
      });

      // Refresh accounts to update sync status
      await get().fetchConnectedAccounts();

      return stats;
    } catch (error) {
      console.error('Error syncing account:', error);
      set({
        syncStatus: 'error',
        error: error instanceof Error ? error.message : 'Errore nella sincronizzazione',
      });
      throw error;
    }
  },

  syncAllAccounts: async () => {
    try {
      set({ syncStatus: 'syncing', error: null });

      const { total_stats, errors } = await enableBankingService.syncAllAccounts();

      set({
        syncStatus: errors.length > 0 ? 'error' : 'success',
        lastSyncAt: new Date(),
        lastSyncStats: total_stats,
        error: errors.length > 0 ? errors.join('\n') : null,
      });

      // Refresh accounts
      await get().fetchConnectedAccounts();
    } catch (error) {
      console.error('Error syncing all accounts:', error);
      set({
        syncStatus: 'error',
        error: error instanceof Error ? error.message : 'Errore nella sincronizzazione',
      });
      throw error;
    }
  },

  disconnectBank: async (sessionId: string, deleteTransactions = false) => {
    try {
      set({ isLoading: true, error: null });

      await enableBankingService.disconnectBank(sessionId, deleteTransactions);

      // Remove from local state
      set((state) => ({
        connectedAccounts: state.connectedAccounts.filter(
          (a) => !state.sessions.find(s => s.id === sessionId && a.session_status === s.status)
        ),
        sessions: state.sessions.filter((s) => s.id !== sessionId),
        isLoading: false,
      }));

      // Refresh to get accurate state
      await get().fetchConnectedAccounts();
    } catch (error) {
      console.error('Error disconnecting bank:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Errore nella disconnessione',
      });
      throw error;
    }
  },

  setSelectedCountry: (country: string) => {
    set({ selectedCountry: country });
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),

  // Computed values
  hasConnectedBanks: () => {
    return get().connectedAccounts.length > 0;
  },

  getActiveAccounts: () => {
    return get().connectedAccounts.filter(
      (a) => a.session_status === 'authorized'
    );
  },

  getTotalBalance: () => {
    return get().connectedAccounts
      .filter((a) => a.session_status === 'authorized' && a.balance !== null)
      .reduce((total, account) => total + (account.balance || 0), 0);
  },

  getAccountsBySession: (sessionId: string) => {
    const session = get().sessions.find((s) => s.id === sessionId);
    if (!session) return [];

    return get().connectedAccounts.filter(
      (a) => a.session_valid_until === session.valid_until
    );
  },
}));
