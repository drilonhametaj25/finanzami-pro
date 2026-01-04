import { create } from 'zustand';
import { supabase } from '../services/supabase';
import {
  SharedExpense,
  SharedExpenseParticipant,
  Transaction,
  InsertTables,
} from '../types/database';
import { differenceInDays } from 'date-fns';

export interface SharedExpenseWithDetails extends SharedExpense {
  transaction?: Transaction;
  participants: SharedExpenseParticipant[];
}

export interface CreditSummary {
  totalOwed: number;
  totalPaid: number;
  totalPending: number;
  participantCount: number;
  oldestCreditDays: number;
}

interface SharedState {
  sharedExpenses: SharedExpenseWithDetails[];
  isLoading: boolean;
  error: string | null;

  // Actions
  fetchSharedExpenses: () => Promise<void>;
  createSharedExpense: (
    transaction: Omit<InsertTables<'transactions'>, 'user_id'>,
    participants: { name: string; amount: number }[]
  ) => Promise<{ error: string | null }>;
  markParticipantPaid: (participantId: string, isPaid: boolean) => Promise<{ error: string | null }>;
  deleteSharedExpense: (id: string) => Promise<{ error: string | null }>;
  updateParticipantAmount: (participantId: string, amount: number) => Promise<{ error: string | null }>;
  getCreditSummary: () => CreditSummary;
  getPendingCredits: () => SharedExpenseParticipant[];
  getCreditsGroupedByPerson: () => { name: string; total: number; credits: SharedExpenseParticipant[] }[];
}

export const useSharedStore = create<SharedState>((set, get) => ({
  sharedExpenses: [],
  isLoading: false,
  error: null,

  fetchSharedExpenses: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false, error: 'Not authenticated' });
        return;
      }

      // Fetch shared expenses with transactions
      const { data: sharedData, error: sharedError } = await supabase
        .from('shared_expenses')
        .select(`
          *,
          transaction:transactions(*),
          participants:shared_expense_participants(*)
        `)
        .order('created_at', { ascending: false });

      if (sharedError) throw sharedError;

      // Filter to only include user's shared expenses
      const userSharedExpenses = (sharedData || []).filter(
        (se: any) => se.transaction?.user_id === user.id
      );

      set({ sharedExpenses: userSharedExpenses, isLoading: false });
    } catch (error) {
      console.error('Error fetching shared expenses:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch shared expenses',
      });
    }
  },

  createSharedExpense: async (transaction, participants) => {
    try {
      set({ isLoading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return { error: 'Not authenticated' };
      }

      // Calculate user's share
      const totalParticipantsAmount = participants.reduce((sum, p) => sum + p.amount, 0);
      const userShare = transaction.amount - totalParticipantsAmount;

      // Create the transaction first
      const { data: transactionData, error: transactionError } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          user_id: user.id,
          is_shared: true,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create shared expense record
      const { data: sharedData, error: sharedError } = await supabase
        .from('shared_expenses')
        .insert({
          transaction_id: transactionData.id,
          total_amount: transaction.amount,
          user_share: userShare,
        })
        .select()
        .single();

      if (sharedError) throw sharedError;

      // Create participant records
      const participantRecords = participants.map((p) => ({
        shared_expense_id: sharedData.id,
        participant_name: p.name,
        amount_owed: p.amount,
        is_paid: false,
      }));

      const { data: participantsData, error: participantsError } = await supabase
        .from('shared_expense_participants')
        .insert(participantRecords)
        .select();

      if (participantsError) throw participantsError;

      // Add to local state
      const newSharedExpense: SharedExpenseWithDetails = {
        ...sharedData,
        transaction: transactionData,
        participants: participantsData || [],
      };

      set((state) => ({
        sharedExpenses: [newSharedExpense, ...state.sharedExpenses],
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create shared expense';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  markParticipantPaid: async (participantId, isPaid) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('shared_expense_participants')
        .update({
          is_paid: isPaid,
          paid_at: isPaid ? new Date().toISOString() : null,
        })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;

      // Update local state
      set((state) => ({
        sharedExpenses: state.sharedExpenses.map((se) => ({
          ...se,
          participants: se.participants.map((p) =>
            p.id === participantId ? data : p
          ),
        })),
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update participant';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  deleteSharedExpense: async (id) => {
    try {
      set({ isLoading: true, error: null });

      const sharedExpense = get().sharedExpenses.find((se) => se.id === id);
      if (!sharedExpense) {
        set({ isLoading: false });
        return { error: 'Shared expense not found' };
      }

      // Delete the shared expense (cascade will delete participants)
      const { error: sharedError } = await supabase
        .from('shared_expenses')
        .delete()
        .eq('id', id);

      if (sharedError) throw sharedError;

      // Also delete the transaction
      if (sharedExpense.transaction?.id) {
        await supabase
          .from('transactions')
          .delete()
          .eq('id', sharedExpense.transaction.id);
      }

      set((state) => ({
        sharedExpenses: state.sharedExpenses.filter((se) => se.id !== id),
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete shared expense';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  updateParticipantAmount: async (participantId, amount) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('shared_expense_participants')
        .update({ amount_owed: amount })
        .eq('id', participantId)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        sharedExpenses: state.sharedExpenses.map((se) => ({
          ...se,
          participants: se.participants.map((p) =>
            p.id === participantId ? data : p
          ),
        })),
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update amount';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  getCreditSummary: () => {
    const { sharedExpenses } = get();

    const allParticipants = sharedExpenses.flatMap((se) => se.participants);
    const pendingParticipants = allParticipants.filter((p) => !p.is_paid);

    const totalOwed = allParticipants.reduce((sum, p) => sum + p.amount_owed, 0);
    const totalPaid = allParticipants
      .filter((p) => p.is_paid)
      .reduce((sum, p) => sum + p.amount_owed, 0);
    const totalPending = pendingParticipants.reduce((sum, p) => sum + p.amount_owed, 0);

    let oldestCreditDays = 0;
    if (pendingParticipants.length > 0) {
      const oldestCredit = pendingParticipants.reduce((oldest, p) => {
        const pDate = new Date(p.created_at);
        const oldestDate = new Date(oldest.created_at);
        return pDate < oldestDate ? p : oldest;
      });
      oldestCreditDays = differenceInDays(new Date(), new Date(oldestCredit.created_at));
    }

    return {
      totalOwed,
      totalPaid,
      totalPending,
      participantCount: new Set(allParticipants.map((p) => p.participant_name)).size,
      oldestCreditDays,
    };
  },

  getPendingCredits: () => {
    const { sharedExpenses } = get();
    return sharedExpenses
      .flatMap((se) => se.participants)
      .filter((p) => !p.is_paid)
      .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
  },

  getCreditsGroupedByPerson: () => {
    const { sharedExpenses } = get();
    const allParticipants = sharedExpenses.flatMap((se) => se.participants);

    const grouped = allParticipants.reduce((acc, p) => {
      const existing = acc.find((g) => g.name.toLowerCase() === p.participant_name.toLowerCase());
      if (existing) {
        existing.total += p.is_paid ? 0 : p.amount_owed;
        existing.credits.push(p);
      } else {
        acc.push({
          name: p.participant_name,
          total: p.is_paid ? 0 : p.amount_owed,
          credits: [p],
        });
      }
      return acc;
    }, [] as { name: string; total: number; credits: SharedExpenseParticipant[] }[]);

    return grouped.sort((a, b) => b.total - a.total);
  },
}));
