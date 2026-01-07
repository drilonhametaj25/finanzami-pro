export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string | null;
          avatar_url: string | null;
          main_currency: string;
          monthly_budget: number | null;
          notification_preferences: Json | null;
          onboarding_completed: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name?: string | null;
          avatar_url?: string | null;
          main_currency?: string;
          monthly_budget?: number | null;
          notification_preferences?: Json | null;
          onboarding_completed?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          main_currency?: string;
          monthly_budget?: number | null;
          notification_preferences?: Json | null;
          onboarding_completed?: boolean;
          updated_at?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          budget: number | null;
          is_preset: boolean;
          is_active: boolean;
          order_index: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          budget?: number | null;
          is_preset?: boolean;
          is_active?: boolean;
          order_index?: number;
          created_at?: string;
        };
        Update: {
          name?: string;
          icon?: string;
          color?: string;
          budget?: number | null;
          is_active?: boolean;
          order_index?: number;
        };
      };
      transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          original_amount: number | null;
          original_currency: string | null;
          exchange_rate: number | null;
          type: 'expense' | 'income';
          description: string | null;
          date: string;
          is_recurring: boolean;
          recurring_id: string | null;
          tags: string[] | null;
          receipt_url: string | null;
          is_shared: boolean;
          // SaltEdge fields
          saltedge_transaction_id: string | null;
          bank_account_id: string | null;
          is_synced: boolean;
          saltedge_category: string | null;
          merchant_name: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          original_amount?: number | null;
          original_currency?: string | null;
          exchange_rate?: number | null;
          type: 'expense' | 'income';
          description?: string | null;
          date: string;
          is_recurring?: boolean;
          recurring_id?: string | null;
          tags?: string[] | null;
          receipt_url?: string | null;
          is_shared?: boolean;
          saltedge_transaction_id?: string | null;
          bank_account_id?: string | null;
          is_synced?: boolean;
          saltedge_category?: string | null;
          merchant_name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          category_id?: string;
          amount?: number;
          original_amount?: number | null;
          original_currency?: string | null;
          exchange_rate?: number | null;
          type?: 'expense' | 'income';
          description?: string | null;
          date?: string;
          tags?: string[] | null;
          receipt_url?: string | null;
          is_shared?: boolean;
          saltedge_transaction_id?: string | null;
          bank_account_id?: string | null;
          is_synced?: boolean;
          saltedge_category?: string | null;
          merchant_name?: string | null;
          updated_at?: string;
        };
      };
      recurring_transactions: {
        Row: {
          id: string;
          user_id: string;
          category_id: string;
          amount: number;
          description: string | null;
          frequency: 'monthly' | 'quarterly' | 'yearly';
          next_date: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          category_id: string;
          amount: number;
          description?: string | null;
          frequency: 'monthly' | 'quarterly' | 'yearly';
          next_date: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          category_id?: string;
          amount?: number;
          description?: string | null;
          frequency?: 'monthly' | 'quarterly' | 'yearly';
          next_date?: string;
          is_active?: boolean;
        };
      };
      goals: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          target_amount: number;
          current_amount: number;
          target_date: string | null;
          monthly_allocation: number | null;
          is_completed: boolean;
          completed_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon: string;
          target_amount: number;
          current_amount?: number;
          target_date?: string | null;
          monthly_allocation?: number | null;
          is_completed?: boolean;
          completed_at?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          icon?: string;
          target_amount?: number;
          current_amount?: number;
          target_date?: string | null;
          monthly_allocation?: number | null;
          is_completed?: boolean;
          completed_at?: string | null;
        };
      };
      shared_expenses: {
        Row: {
          id: string;
          transaction_id: string;
          total_amount: number;
          user_share: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          transaction_id: string;
          total_amount: number;
          user_share: number;
          created_at?: string;
        };
        Update: {
          total_amount?: number;
          user_share?: number;
        };
      };
      shared_expense_participants: {
        Row: {
          id: string;
          shared_expense_id: string;
          participant_name: string;
          amount_owed: number;
          is_paid: boolean;
          paid_at: string | null;
          reminder_sent_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          shared_expense_id: string;
          participant_name: string;
          amount_owed: number;
          is_paid?: boolean;
          paid_at?: string | null;
          reminder_sent_at?: string | null;
          created_at?: string;
        };
        Update: {
          participant_name?: string;
          amount_owed?: number;
          is_paid?: boolean;
          paid_at?: string | null;
          reminder_sent_at?: string | null;
        };
      };
      insights: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          message: string;
          priority: 'high' | 'medium' | 'low';
          action_type: string | null;
          action_data: Json | null;
          is_read: boolean;
          is_dismissed: boolean;
          valid_until: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          message: string;
          priority: 'high' | 'medium' | 'low';
          action_type?: string | null;
          action_data?: Json | null;
          is_read?: boolean;
          is_dismissed?: boolean;
          valid_until?: string | null;
          created_at?: string;
        };
        Update: {
          type?: string;
          message?: string;
          priority?: 'high' | 'medium' | 'low';
          action_type?: string | null;
          action_data?: Json | null;
          is_read?: boolean;
          is_dismissed?: boolean;
          valid_until?: string | null;
        };
      };
      monthly_summaries: {
        Row: {
          id: string;
          user_id: string;
          month: string;
          total_income: number;
          total_expenses: number;
          savings: number;
          savings_rate: number;
          category_breakdown: Json | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          month: string;
          total_income: number;
          total_expenses: number;
          savings: number;
          savings_rate: number;
          category_breakdown?: Json | null;
          created_at?: string;
        };
        Update: {
          total_income?: number;
          total_expenses?: number;
          savings?: number;
          savings_rate?: number;
          category_breakdown?: Json | null;
        };
      };
      subscriptions: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          icon: string;
          color: string;
          amount: number;
          frequency: 'monthly' | 'quarterly' | 'yearly';
          next_billing_date: string;
          category_id: string | null;
          reminder_days_before: number;
          is_active: boolean;
          last_used_at: string | null;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          icon?: string;
          color?: string;
          amount: number;
          frequency: 'monthly' | 'quarterly' | 'yearly';
          next_billing_date: string;
          category_id?: string | null;
          reminder_days_before?: number;
          is_active?: boolean;
          last_used_at?: string | null;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          icon?: string;
          color?: string;
          amount?: number;
          frequency?: 'monthly' | 'quarterly' | 'yearly';
          next_billing_date?: string;
          category_id?: string | null;
          reminder_days_before?: number;
          is_active?: boolean;
          last_used_at?: string | null;
          notes?: string | null;
        };
      };
      investments: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'etf' | 'stocks' | 'bonds' | 'crypto' | 'real_estate' | 'other';
          icon: string;
          color: string;
          total_invested: number;
          current_value: number;
          last_updated_at: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'etf' | 'stocks' | 'bonds' | 'crypto' | 'real_estate' | 'other';
          icon?: string;
          color?: string;
          total_invested?: number;
          current_value?: number;
          last_updated_at?: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          name?: string;
          type?: 'etf' | 'stocks' | 'bonds' | 'crypto' | 'real_estate' | 'other';
          icon?: string;
          color?: string;
          total_invested?: number;
          current_value?: number;
          last_updated_at?: string;
          notes?: string | null;
        };
      };
      investment_transactions: {
        Row: {
          id: string;
          investment_id: string;
          amount: number;
          type: 'deposit' | 'withdrawal';
          date: string;
          notes: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          investment_id: string;
          amount: number;
          type: 'deposit' | 'withdrawal';
          date: string;
          notes?: string | null;
          created_at?: string;
        };
        Update: {
          amount?: number;
          type?: 'deposit' | 'withdrawal';
          date?: string;
          notes?: string | null;
        };
      };
      user_achievements: {
        Row: {
          id: string;
          user_id: string;
          achievement_id: string;
          unlocked_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          achievement_id: string;
          unlocked_at?: string;
        };
        Update: {};
      };
      user_gamification: {
        Row: {
          id: string;
          user_id: string;
          level: number;
          experience_points: number;
          current_streak: number;
          longest_streak: number;
          last_activity_date: string | null;
          health_score: number;
          total_badges: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          level?: number;
          experience_points?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          health_score?: number;
          total_badges?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          level?: number;
          experience_points?: number;
          current_streak?: number;
          longest_streak?: number;
          last_activity_date?: string | null;
          health_score?: number;
          total_badges?: number;
          updated_at?: string;
        };
      };
      bank_accounts: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          type: 'checking' | 'savings' | 'cash' | 'credit_card' | 'investment';
          balance: number;
          icon: string;
          color: string;
          is_primary: boolean;
          // SaltEdge fields
          saltedge_account_id: string | null;
          saltedge_connection_id: string | null;
          currency_code: string;
          iban: string | null;
          account_number: string | null;
          is_connected: boolean;
          last_sync_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          type: 'checking' | 'savings' | 'cash' | 'credit_card' | 'investment';
          balance?: number;
          icon?: string;
          color?: string;
          is_primary?: boolean;
          saltedge_account_id?: string | null;
          saltedge_connection_id?: string | null;
          currency_code?: string;
          iban?: string | null;
          account_number?: string | null;
          is_connected?: boolean;
          last_sync_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          name?: string;
          type?: 'checking' | 'savings' | 'cash' | 'credit_card' | 'investment';
          balance?: number;
          icon?: string;
          color?: string;
          is_primary?: boolean;
          saltedge_account_id?: string | null;
          saltedge_connection_id?: string | null;
          currency_code?: string;
          iban?: string | null;
          account_number?: string | null;
          is_connected?: boolean;
          last_sync_at?: string | null;
          updated_at?: string;
        };
      };
      saltedge_customers: {
        Row: {
          id: string;
          user_id: string;
          saltedge_customer_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          saltedge_customer_id: string;
          created_at?: string;
        };
        Update: {};
      };
      saltedge_connections: {
        Row: {
          id: string;
          user_id: string;
          saltedge_connection_id: string;
          saltedge_customer_id: string;
          provider_code: string;
          provider_name: string;
          country_code: string | null;
          status: string;
          last_sync_at: string | null;
          next_refresh_at: string | null;
          sync_status: 'pending' | 'syncing' | 'success' | 'error';
          sync_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          saltedge_connection_id: string;
          saltedge_customer_id: string;
          provider_code: string;
          provider_name: string;
          country_code?: string | null;
          status?: string;
          last_sync_at?: string | null;
          next_refresh_at?: string | null;
          sync_status?: 'pending' | 'syncing' | 'success' | 'error';
          sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          provider_code?: string;
          provider_name?: string;
          country_code?: string | null;
          status?: string;
          last_sync_at?: string | null;
          next_refresh_at?: string | null;
          sync_status?: 'pending' | 'syncing' | 'success' | 'error';
          sync_error?: string | null;
          updated_at?: string;
        };
      };
      enable_banking_sessions: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          status: 'pending' | 'authorized' | 'expired' | 'revoked' | 'error';
          valid_until: string | null;
          accounts_data: Json | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          status?: 'pending' | 'authorized' | 'expired' | 'revoked' | 'error';
          valid_until?: string | null;
          accounts_data?: Json | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          session_id?: string;
          status?: 'pending' | 'authorized' | 'expired' | 'revoked' | 'error';
          valid_until?: string | null;
          accounts_data?: Json | null;
          updated_at?: string;
        };
      };
      enable_banking_accounts: {
        Row: {
          id: string;
          user_id: string;
          session_id: string;
          account_id: string;
          iban: string | null;
          bban: string | null;
          account_name: string | null;
          account_type: string | null;
          currency: string;
          balance_amount: number | null;
          balance_type: string | null;
          balance_date: string | null;
          bank_name: string | null;
          bank_bic: string | null;
          bank_country: string | null;
          is_active: boolean;
          last_sync_at: string | null;
          sync_status: 'pending' | 'syncing' | 'success' | 'error';
          sync_error: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          session_id: string;
          account_id: string;
          iban?: string | null;
          bban?: string | null;
          account_name?: string | null;
          account_type?: string | null;
          currency?: string;
          balance_amount?: number | null;
          balance_type?: string | null;
          balance_date?: string | null;
          bank_name?: string | null;
          bank_bic?: string | null;
          bank_country?: string | null;
          is_active?: boolean;
          last_sync_at?: string | null;
          sync_status?: 'pending' | 'syncing' | 'success' | 'error';
          sync_error?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          account_name?: string | null;
          account_type?: string | null;
          currency?: string;
          balance_amount?: number | null;
          balance_type?: string | null;
          balance_date?: string | null;
          bank_name?: string | null;
          is_active?: boolean;
          last_sync_at?: string | null;
          sync_status?: 'pending' | 'syncing' | 'success' | 'error';
          sync_error?: string | null;
          updated_at?: string;
        };
      };
      enable_banking_aspsps: {
        Row: {
          id: string;
          name: string;
          bic: string | null;
          country: string;
          logo_url: string | null;
          supported_features: Json | null;
          maximum_consent_validity: string | null;
          cached_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          bic?: string | null;
          country: string;
          logo_url?: string | null;
          supported_features?: Json | null;
          maximum_consent_validity?: string | null;
          cached_at?: string;
        };
        Update: {
          name?: string;
          bic?: string | null;
          country?: string;
          logo_url?: string | null;
          supported_features?: Json | null;
          maximum_consent_validity?: string | null;
          cached_at?: string;
        };
      };
      transaction_category_rules: {
        Row: {
          id: string;
          user_id: string | null;
          pattern: string;
          pattern_type: 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'exact';
          category_id: string;
          priority: number;
          is_global: boolean;
          match_count: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          pattern: string;
          pattern_type?: 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'exact';
          category_id: string;
          priority?: number;
          is_global?: boolean;
          match_count?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          pattern?: string;
          pattern_type?: 'contains' | 'starts_with' | 'ends_with' | 'regex' | 'exact';
          category_id?: string;
          priority?: number;
          is_global?: boolean;
          match_count?: number;
          updated_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {
      transaction_type: 'expense' | 'income';
      frequency_type: 'monthly' | 'quarterly' | 'yearly';
      priority_type: 'high' | 'medium' | 'low';
    };
  };
}

// Helper types
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row'];
export type InsertTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert'];
export type UpdateTables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update'];

// Convenience aliases
export type Profile = Tables<'profiles'>;
export type Category = Tables<'categories'>;
export type Transaction = Tables<'transactions'>;
export type RecurringTransaction = Tables<'recurring_transactions'>;
export type Goal = Tables<'goals'>;
export type SharedExpense = Tables<'shared_expenses'>;
export type SharedExpenseParticipant = Tables<'shared_expense_participants'>;
export type Insight = Tables<'insights'>;
export type MonthlySummary = Tables<'monthly_summaries'>;
export type Subscription = Tables<'subscriptions'>;
export type Investment = Tables<'investments'>;
export type InvestmentTransaction = Tables<'investment_transactions'>;
export type UserAchievement = Tables<'user_achievements'>;
export type UserGamification = Tables<'user_gamification'>;
export type BankAccount = Tables<'bank_accounts'>;
export type SaltEdgeCustomer = Tables<'saltedge_customers'>;
export type SaltEdgeConnection = Tables<'saltedge_connections'>;
export type EnableBankingSession = Tables<'enable_banking_sessions'>;
export type EnableBankingAccount = Tables<'enable_banking_accounts'>;
export type EnableBankingASPSP = Tables<'enable_banking_aspsps'>;
export type TransactionCategoryRule = Tables<'transaction_category_rules'>;
