import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { Transaction, InsertTables, UpdateTables } from '../types/database';
import { TransactionFilters } from '../types';
import { startOfMonth, endOfMonth, format, parseISO, isWithinInterval } from 'date-fns';

interface TransactionState {
  transactions: Transaction[];
  isLoading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;

  // Actions
  fetchTransactions: (filters?: TransactionFilters) => Promise<void>;
  loadMore: (filters?: TransactionFilters) => Promise<void>;
  createTransaction: (transaction: Omit<InsertTables<'transactions'>, 'user_id'>) => Promise<{ error: string | null; data?: Transaction }>;
  updateTransaction: (id: string, updates: UpdateTables<'transactions'>) => Promise<{ error: string | null }>;
  deleteTransaction: (id: string) => Promise<{ error: string | null }>;
  getTransactionById: (id: string) => Transaction | undefined;
  getMonthlyStats: (date: Date) => { income: number; expenses: number; balance: number };
  getDailySpending: (startDate: Date, endDate: Date) => { date: string; amount: number }[];
}

const PAGE_SIZE = 20;

export const useTransactionStore = create<TransactionState>((set, get) => ({
  transactions: [],
  isLoading: false,
  error: null,
  hasMore: true,
  currentPage: 0,

  fetchTransactions: async (filters?: TransactionFilters) => {
    try {
      set({ isLoading: true, error: null, currentPage: 0 });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false, error: 'Not authenticated' });
        return;
      }

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(0, PAGE_SIZE - 1);

      // Apply filters
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters?.searchQuery) {
        query = query.ilike('description', `%${filters.searchQuery}%`);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({
        transactions: data || [],
        isLoading: false,
        hasMore: (data?.length || 0) === PAGE_SIZE,
        currentPage: 1,
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to fetch transactions',
      });
    }
  },

  loadMore: async (filters?: TransactionFilters) => {
    const { hasMore, isLoading, currentPage, transactions } = get();

    if (!hasMore || isLoading) return;

    try {
      set({ isLoading: true });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const from = currentPage * PAGE_SIZE;
      const to = from + PAGE_SIZE - 1;

      let query = supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply same filters as fetchTransactions
      if (filters?.type && filters.type !== 'all') {
        query = query.eq('type', filters.type);
      }
      if (filters?.categoryId) {
        query = query.eq('category_id', filters.categoryId);
      }
      if (filters?.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters?.endDate) {
        query = query.lte('date', filters.endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      set({
        transactions: [...transactions, ...(data || [])],
        isLoading: false,
        hasMore: (data?.length || 0) === PAGE_SIZE,
        currentPage: currentPage + 1,
      });
    } catch (error) {
      set({ isLoading: false });
    }
  },

  createTransaction: async (transaction) => {
    try {
      set({ isLoading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false });
        return { error: 'Not authenticated' };
      }

      const { data, error } = await supabase
        .from('transactions')
        .insert({
          ...transaction,
          user_id: user.id,
        })
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        transactions: [data, ...state.transactions],
        isLoading: false,
      }));

      return { error: null, data };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create transaction';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  updateTransaction: async (id, updates) => {
    try {
      set({ isLoading: true, error: null });

      const { data, error } = await supabase
        .from('transactions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        transactions: state.transactions.map((t) => (t.id === id ? data : t)),
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update transaction';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  deleteTransaction: async (id) => {
    try {
      set({ isLoading: true, error: null });

      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) throw error;

      set((state) => ({
        transactions: state.transactions.filter((t) => t.id !== id),
        isLoading: false,
      }));

      return { error: null };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete transaction';
      set({ isLoading: false, error: message });
      return { error: message };
    }
  },

  getTransactionById: (id: string) => {
    return get().transactions.find((t) => t.id === id);
  },

  getMonthlyStats: (date: Date) => {
    const { transactions } = get();
    const start = startOfMonth(date);
    const end = endOfMonth(date);

    const monthlyTransactions = transactions.filter((t) => {
      const transactionDate = parseISO(t.date);
      return isWithinInterval(transactionDate, { start, end });
    });

    const income = monthlyTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = monthlyTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      income,
      expenses,
      balance: income - expenses,
    };
  },

  getDailySpending: (startDate: Date, endDate: Date) => {
    const { transactions } = get();

    const dailySpending = transactions
      .filter((t) => {
        const transactionDate = parseISO(t.date);
        return (
          t.type === 'expense' &&
          isWithinInterval(transactionDate, { start: startDate, end: endDate })
        );
      })
      .reduce((acc, t) => {
        const dateKey = t.date;
        acc[dateKey] = (acc[dateKey] || 0) + t.amount;
        return acc;
      }, {} as Record<string, number>);

    return Object.entries(dailySpending)
      .map(([date, amount]) => ({ date, amount }))
      .sort((a, b) => a.date.localeCompare(b.date));
  },
}));
