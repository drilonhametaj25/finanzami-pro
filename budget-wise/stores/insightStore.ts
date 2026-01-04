import { create } from 'zustand';
import { supabase } from '../services/supabase';
import { generateInsights } from '../services/insights';
import { InsightType, InsightAction } from '../types';
import { Transaction, Category, Goal } from '../types/database';

export interface InsightData {
  id: string;
  type: InsightType;
  message: string;
  priority: 'high' | 'medium' | 'low';
  action?: InsightAction;
  categoryId?: string;
  isRead: boolean;
  createdAt: Date;
}

interface InsightState {
  insights: InsightData[];
  isLoading: boolean;
  error: string | null;
  lastRefresh: Date | null;

  // Actions
  fetchInsights: () => Promise<void>;
  markAsRead: (id: string) => void;
  dismissInsight: (id: string) => void;
  getUnreadCount: () => number;
  getInsightsByType: (type: InsightType) => InsightData[];
  getHighPriorityInsights: () => InsightData[];
}

export const useInsightStore = create<InsightState>((set, get) => ({
  insights: [],
  isLoading: false,
  error: null,
  lastRefresh: null,

  fetchInsights: async () => {
    try {
      set({ isLoading: true, error: null });

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        set({ isLoading: false, error: 'Not authenticated' });
        return;
      }

      // Fetch user profile for budget
      const { data: profile } = await supabase
        .from('profiles')
        .select('monthly_budget, main_currency')
        .eq('id', user.id)
        .single();

      // Fetch transactions (last 3 months)
      const threeMonthsAgo = new Date();
      threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', threeMonthsAgo.toISOString().split('T')[0])
        .order('date', { ascending: false });

      // Fetch categories
      const { data: categories } = await supabase
        .from('categories')
        .select('*')
        .or(`user_id.eq.${user.id},is_default.eq.true`)
        .eq('is_active', true);

      // Fetch goals
      const { data: goals } = await supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_completed', false);

      // Fetch shared expenses for credit reminders
      const { data: sharedExpenses } = await supabase
        .from('shared_expenses')
        .select(`
          *,
          transaction:transactions(*),
          participants:shared_expense_participants(*)
        `)
        .order('created_at', { ascending: false });

      // Filter shared expenses for this user
      const userSharedExpenses = (sharedExpenses || []).filter(
        (se: any) => se.transaction?.user_id === user.id
      );

      // Generate insights
      const generatedInsights = generateInsights(
        (transactions || []) as Transaction[],
        (categories || []) as Category[],
        (goals || []) as Goal[],
        profile?.monthly_budget || 0,
        profile?.main_currency || 'EUR'
      );

      // Add credit reminder insights
      const creditInsights = generateCreditInsights(userSharedExpenses);

      // Add recurring expense insights
      const { data: recurringTransactions } = await supabase
        .from('recurring_transactions')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_active', true);

      const recurringInsights = generateRecurringInsights(recurringTransactions || []);

      // Combine all insights and add IDs
      const allInsights: InsightData[] = [
        ...generatedInsights,
        ...creditInsights,
        ...recurringInsights,
      ].map((insight, index) => ({
        ...insight,
        id: `insight-${Date.now()}-${index}`,
        isRead: false,
        createdAt: new Date(),
      }));

      set({
        insights: allInsights,
        isLoading: false,
        lastRefresh: new Date(),
      });
    } catch (error) {
      console.error('Error fetching insights:', error);
      set({
        isLoading: false,
        error: error instanceof Error ? error.message : 'Failed to generate insights',
      });
    }
  },

  markAsRead: (id) => {
    set((state) => ({
      insights: state.insights.map((insight) =>
        insight.id === id ? { ...insight, isRead: true } : insight
      ),
    }));
  },

  dismissInsight: (id) => {
    set((state) => ({
      insights: state.insights.filter((insight) => insight.id !== id),
    }));
  },

  getUnreadCount: () => {
    return get().insights.filter((i) => !i.isRead).length;
  },

  getInsightsByType: (type) => {
    return get().insights.filter((i) => i.type === type);
  },

  getHighPriorityInsights: () => {
    return get().insights.filter((i) => i.priority === 'high');
  },
}));

// Helper function to generate credit-related insights
function generateCreditInsights(sharedExpenses: any[]): Omit<InsightData, 'id' | 'isRead' | 'createdAt'>[] {
  const insights: Omit<InsightData, 'id' | 'isRead' | 'createdAt'>[] = [];

  const allParticipants = sharedExpenses.flatMap((se) => se.participants || []);
  const pendingCredits = allParticipants.filter((p: any) => !p.is_paid);

  if (pendingCredits.length === 0) return insights;

  // Total pending amount
  const totalPending = pendingCredits.reduce((sum: number, p: any) => sum + p.amount_owed, 0);

  if (totalPending > 0) {
    insights.push({
      type: 'credit_reminder',
      message: `Hai €${totalPending.toFixed(0)} di crediti da riscuotere da ${pendingCredits.length} persone.`,
      priority: totalPending > 100 ? 'medium' : 'low',
      action: {
        type: 'navigate',
        label: 'Vedi crediti',
        data: { screen: 'shared' },
      },
    });
  }

  // Old credits (> 30 days)
  const now = new Date();
  const oldCredits = pendingCredits.filter((p: any) => {
    const createdDate = new Date(p.created_at);
    const days = Math.floor((now.getTime() - createdDate.getTime()) / (1000 * 60 * 60 * 24));
    return days > 30;
  });

  if (oldCredits.length > 0) {
    const oldTotal = oldCredits.reduce((sum: number, p: any) => sum + p.amount_owed, 0);
    insights.push({
      type: 'credit_reminder',
      message: `Attenzione: hai €${oldTotal.toFixed(0)} di crediti in sospeso da piu di 30 giorni.`,
      priority: 'high',
      action: {
        type: 'navigate',
        label: 'Sollecita',
        data: { screen: 'shared' },
      },
    });
  }

  return insights;
}

// Helper function to generate recurring expense insights
function generateRecurringInsights(recurring: any[]): Omit<InsightData, 'id' | 'isRead' | 'createdAt'>[] {
  const insights: Omit<InsightData, 'id' | 'isRead' | 'createdAt'>[] = [];

  if (recurring.length === 0) return insights;

  // Calculate total monthly cost of subscriptions
  let monthlyTotal = 0;
  recurring.forEach((r) => {
    switch (r.frequency) {
      case 'monthly':
        monthlyTotal += r.amount;
        break;
      case 'quarterly':
        monthlyTotal += r.amount / 3;
        break;
      case 'yearly':
        monthlyTotal += r.amount / 12;
        break;
    }
  });

  if (monthlyTotal > 0) {
    insights.push({
      type: 'recurring_optimization',
      message: `I tuoi abbonamenti costano €${monthlyTotal.toFixed(0)}/mese (€${(monthlyTotal * 12).toFixed(0)}/anno). Verifica se li usi tutti.`,
      priority: monthlyTotal > 100 ? 'medium' : 'low',
      action: {
        type: 'navigate',
        label: 'Gestisci abbonamenti',
        data: { screen: 'recurring' },
      },
    });
  }

  // Overdue recurring expenses
  const now = new Date();
  const overdue = recurring.filter((r) => new Date(r.next_date) < now);

  if (overdue.length > 0) {
    insights.push({
      type: 'recurring_optimization',
      message: `Hai ${overdue.length} spese ricorrenti scadute da registrare.`,
      priority: 'high',
      action: {
        type: 'navigate',
        label: 'Registra ora',
        data: { screen: 'recurring' },
      },
    });
  }

  return insights;
}
