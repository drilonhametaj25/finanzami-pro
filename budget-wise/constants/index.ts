export * from './theme';
export * from './categories';
export * from './currencies';

// App constants
export const APP_NAME = 'FinanzaMi.pro';
export const APP_VERSION = '1.0.0';

// Budget thresholds
export const BUDGET_THRESHOLDS = {
  SAFE: 70, // Under 70% - green
  WARNING: 85, // 70-85% - yellow/orange
  DANGER: 95, // 85-95% - red
  EXCEEDED: 100, // Over 100% - dark red
};

// Savings target
export const IDEAL_SAVINGS_RATE = 20; // 20% target savings rate

// Notification settings defaults
export const DEFAULT_NOTIFICATION_SETTINGS = {
  dailyReminder: true,
  dailyReminderTime: '20:00',
  budgetAlerts: true,
  recurringReminders: true,
  creditReminders: true,
  creditReminderDays: 7,
  weeklyReport: true,
  monthlyReport: true,
};

// Pagination
export const DEFAULT_PAGE_SIZE = 20;

// Date formats
export const DATE_FORMATS = {
  display: 'dd MMM yyyy',
  displayShort: 'dd/MM/yy',
  displayMonth: 'MMMM yyyy',
  api: 'yyyy-MM-dd',
  time: 'HH:mm',
};

// Animation durations (ms)
export const ANIMATION_DURATION = {
  fast: 150,
  normal: 300,
  slow: 500,
};
