import { create } from 'zustand';
import * as saltedgeService from '../services/saltedge';
import type { ConnectedBankAccount, SaltEdgeConnection, SyncStats } from '../services/saltedge';

export type SyncStatus = 'idle' | 'connecting' | 'syncing' | 'success' | 'error';

interface BankSyncState {
  // State
  connectedAccounts: ConnectedBankAccount[];
  connections: SaltEdgeConnection[];
  syncStatus: SyncStatus;
  lastSyncAt: Date | null;
  error: string | null;
  isLoading: boolean;
  lastSyncStats: SyncStats | null;

  // Actions
  fetchConnectedAccounts: () => Promise<void>;
  startConnection: (countryCode?: string) => Promise<string>;
  syncTransactions: (connectionId: string, accountId?: string) => Promise<void>;
  refreshConnection: (connectionId: string) => Promise<void>;
  disconnectBank: (connectionId: string, deleteTransactions?: boolean) => Promise<void>;
  clearError: () => void;
  reset: () => void;

  // Computed
  hasConnectedBanks: () => boolean;
  getConnectionByAccountId: (accountId: string) => SaltEdgeConnection | undefined;
  getTotalSyncedBalance: () => number;
}

const initialState = {
  connectedAccounts: [],
  connections: [],
  syncStatus: 'idle' as SyncStatus,
  lastSyncAt: null,
  error: null,
  isLoading: false,
  lastSyncStats: null,
};

export const useBankSyncStore = create<BankSyncState>((set, get) => ({
  ...initialState,

  fetchConnectedAccounts: async () => {
    try {
      set({ isLoading: true, error: null });

      const { accounts, connections } = await saltedgeService.getConnectedAccounts();

      set({
        connectedAccounts: accounts,
        connections,
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

  startConnection: async (countryCode?: string) => {
    try {
      set({ syncStatus: 'connecting', error: null });

      const connectUrl = await saltedgeService.startBankConnection(countryCode);

      // Return the URL - the UI will open it in a browser
      return connectUrl;
    } catch (error) {
      console.error('Error starting connection:', error);
      set({
        syncStatus: 'error',
        error: error instanceof Error ? error.message : 'Errore nella connessione',
      });
      throw error;
    }
  },

  syncTransactions: async (connectionId: string, accountId?: string) => {
    try {
      set({ syncStatus: 'syncing', error: null });

      const { stats } = await saltedgeService.syncTransactions(connectionId, accountId);

      set({
        syncStatus: 'success',
        lastSyncAt: new Date(),
        lastSyncStats: stats,
      });

      // Refresh accounts to update balances
      await get().fetchConnectedAccounts();
    } catch (error) {
      console.error('Error syncing transactions:', error);
      set({
        syncStatus: 'error',
        error: error instanceof Error ? error.message : 'Errore nella sincronizzazione',
      });
      throw error;
    }
  },

  refreshConnection: async (connectionId: string) => {
    try {
      set({ syncStatus: 'syncing', error: null });

      await saltedgeService.refreshConnection(connectionId);

      // Sync transactions after refresh
      await get().syncTransactions(connectionId);
    } catch (error) {
      console.error('Error refreshing connection:', error);

      // Handle rate limit
      if (error instanceof Error && error.message.includes('not yet available')) {
        set({
          syncStatus: 'idle',
          error: 'Aggiornamento non ancora disponibile. Riprova più tardi.',
        });
      } else {
        set({
          syncStatus: 'error',
          error: error instanceof Error ? error.message : 'Errore nell\'aggiornamento',
        });
      }
      throw error;
    }
  },

  disconnectBank: async (connectionId: string, deleteTransactions = false) => {
    try {
      set({ isLoading: true, error: null });

      await saltedgeService.disconnectBank(connectionId, deleteTransactions);

      // Remove from local state
      set((state) => ({
        connectedAccounts: state.connectedAccounts.filter(
          (a) => a.saltedge_connection_id !== connectionId
        ),
        connections: state.connections.filter(
          (c) => c.saltedge_connection_id !== connectionId
        ),
        isLoading: false,
      }));
    } catch (error) {
      console.error('Error disconnecting bank:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Errore nella disconnessione',
      });
      throw error;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),

  // Computed values
  hasConnectedBanks: () => {
    return get().connectedAccounts.length > 0;
  },

  getConnectionByAccountId: (accountId: string) => {
    const account = get().connectedAccounts.find((a) => a.id === accountId);
    if (!account?.saltedge_connection_id) return undefined;

    return get().connections.find(
      (c) => c.saltedge_connection_id === account.saltedge_connection_id
    );
  },

  getTotalSyncedBalance: () => {
    return get().connectedAccounts.reduce((total, account) => total + account.balance, 0);
  },
}));
