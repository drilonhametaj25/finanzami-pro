export * from './database';

// Auth types
export interface AuthState {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

export interface User {
  id: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface Session {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

// Category types
export interface CategoryWithStats extends Category {
  totalSpent: number;
  budgetPercentage: number;
  transactionCount: number;
}

// Transaction types
export interface TransactionWithCategory extends Transaction {
  category: Category;
}

export interface TransactionFilters {
  type?: 'expense' | 'income' | 'all';
  categoryId?: string;
  startDate?: string;
  endDate?: string;
  searchQuery?: string;
  tags?: string[];
}

// Budget types
export interface BudgetProgress {
  categoryId: string;
  categoryName: string;
  budget: number;
  spent: number;
  remaining: number;
  percentage: number;
  status: 'safe' | 'warning' | 'danger' | 'exceeded';
}

// Goal types
export interface GoalProgress extends Goal {
  percentage: number;
  remainingAmount: number;
  estimatedCompletionDate: string | null;
  monthsRemaining: number | null;
}

// Insight types
export type InsightType =
  | 'budget_alert'
  | 'budget_forecast'
  | 'pattern_temporal'
  | 'goal_progress'
  | 'recurring_optimization'
  | 'credit_reminder'
  | 'financial_health'
  | 'waste_detection'
  | 'motivational'
  | 'contextual';

export interface InsightAction {
  type: 'navigate' | 'adjust_budget' | 'add_to_goal' | 'dismiss';
  label: string;
  data?: Record<string, unknown>;
}

// Stats types
export interface MonthlyStats {
  month: string;
  income: number;
  expenses: number;
  savings: number;
  savingsRate: number;
}

export interface CategoryBreakdown {
  categoryId: string;
  categoryName: string;
  categoryColor: string;
  categoryIcon: string;
  amount: number;
  percentage: number;
}

export interface DailySpending {
  date: string;
  amount: number;
}

// Currency types
export interface Currency {
  code: string;
  name: string;
  symbol: string;
}

export interface ExchangeRate {
  from: string;
  to: string;
  rate: number;
  date: string;
}

// Notification preferences
export interface NotificationPreferences {
  dailyReminder: boolean;
  dailyReminderTime: string;
  budgetAlerts: boolean;
  recurringReminders: boolean;
  creditReminders: boolean;
  creditReminderDays: number;
  weeklyReport: boolean;
  monthlyReport: boolean;
}

// Theme types
export type ThemeMode = 'light' | 'dark' | 'system';

// Import Category from database types for CategoryWithStats
import { Category, Transaction, Goal } from './database';
