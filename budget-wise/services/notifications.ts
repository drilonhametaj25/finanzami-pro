import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { format, addDays, setHours, setMinutes, startOfWeek, endOfWeek, startOfMonth } from 'date-fns';
import { it } from 'date-fns/locale';

import { NotificationPreferences } from '../types';
import { formatCurrency } from '../constants/currencies';

const NOTIFICATION_PREFERENCES_KEY = '@notification_preferences';
const PUSH_TOKEN_KEY = '@push_token';

// Default notification preferences
export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  dailyReminder: true,
  dailyReminderTime: '20:00',
  budgetAlerts: true,
  recurringReminders: true,
  creditReminders: true,
  creditReminderDays: 7,
  weeklyReport: true,
  monthlyReport: true,
};

// Notification channel IDs (Android)
export const NOTIFICATION_CHANNELS = {
  BUDGET_ALERTS: 'budget-alerts',
  DAILY_REMINDER: 'daily-reminder',
  RECURRING: 'recurring-expenses',
  CREDITS: 'credits',
  REPORTS: 'reports',
};

// Configure notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private preferences: NotificationPreferences = DEFAULT_NOTIFICATION_PREFERENCES;
  private pushToken: string | null = null;

  private constructor() {}

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<void> {
    await this.loadPreferences();
    await this.registerForPushNotifications();
    await this.setupNotificationChannels();
  }

  private async registerForPushNotifications(): Promise<string | null> {
    if (!Device.isDevice) {
      console.log('Push notifications require a physical device');
      return null;
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      console.log('Permission for push notifications not granted');
      return null;
    }

    try {
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: process.env.EXPO_PROJECT_ID,
      });
      this.pushToken = token.data;
      await AsyncStorage.setItem(PUSH_TOKEN_KEY, token.data);
      return token.data;
    } catch (error) {
      console.error('Error getting push token:', error);
      return null;
    }
  }

  private async setupNotificationChannels(): Promise<void> {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.BUDGET_ALERTS, {
        name: 'Alert Budget',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF0000',
        description: 'Notifiche quando superi il budget',
      });

      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.DAILY_REMINDER, {
        name: 'Promemoria Giornaliero',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Promemoria per registrare le spese',
      });

      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.RECURRING, {
        name: 'Spese Ricorrenti',
        importance: Notifications.AndroidImportance.HIGH,
        description: 'Promemoria per spese ricorrenti in scadenza',
      });

      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.CREDITS, {
        name: 'Crediti',
        importance: Notifications.AndroidImportance.DEFAULT,
        description: 'Promemoria per crediti da riscuotere',
      });

      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNELS.REPORTS, {
        name: 'Report',
        importance: Notifications.AndroidImportance.LOW,
        description: 'Report settimanali e mensili',
      });
    }
  }

  // Preferences management
  async loadPreferences(): Promise<NotificationPreferences> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_PREFERENCES_KEY);
      if (stored) {
        this.preferences = { ...DEFAULT_NOTIFICATION_PREFERENCES, ...JSON.parse(stored) };
      }
    } catch (error) {
      console.error('Error loading notification preferences:', error);
    }
    return this.preferences;
  }

  async savePreferences(preferences: Partial<NotificationPreferences>): Promise<void> {
    this.preferences = { ...this.preferences, ...preferences };
    await AsyncStorage.setItem(NOTIFICATION_PREFERENCES_KEY, JSON.stringify(this.preferences));
    await this.rescheduleNotifications();
  }

  getPreferences(): NotificationPreferences {
    return this.preferences;
  }

  // Schedule notifications
  async rescheduleNotifications(): Promise<void> {
    // Cancel all existing scheduled notifications
    await Notifications.cancelAllScheduledNotificationsAsync();

    // Reschedule based on preferences
    if (this.preferences.dailyReminder) {
      await this.scheduleDailyReminder();
    }

    if (this.preferences.weeklyReport) {
      await this.scheduleWeeklyReport();
    }

    if (this.preferences.monthlyReport) {
      await this.scheduleMonthlyReport();
    }
  }

  private async scheduleDailyReminder(): Promise<void> {
    const [hours, minutes] = this.preferences.dailyReminderTime.split(':').map(Number);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hai registrato le spese di oggi?',
        body: 'Tocca per aggiungere le tue transazioni e mantenere il budget sotto controllo.',
        data: { type: 'daily_reminder', screen: 'transaction/add' },
        categoryIdentifier: NOTIFICATION_CHANNELS.DAILY_REMINDER,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: hours,
        minute: minutes,
      },
    });
  }

  private async scheduleWeeklyReport(): Promise<void> {
    // Schedule for Sunday at 10:00
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Report Settimanale',
        body: 'Il tuo riepilogo settimanale e pronto! Scopri come hai gestito le tue finanze.',
        data: { type: 'weekly_report', screen: 'stats' },
        categoryIdentifier: NOTIFICATION_CHANNELS.REPORTS,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
        weekday: 1, // Sunday
        hour: 10,
        minute: 0,
      },
    });
  }

  private async scheduleMonthlyReport(): Promise<void> {
    // Schedule for 1st of each month at 9:00
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Report Mensile',
        body: 'E iniziato un nuovo mese! Rivedi il riepilogo del mese scorso.',
        data: { type: 'monthly_report', screen: 'stats' },
        categoryIdentifier: NOTIFICATION_CHANNELS.REPORTS,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
        day: 1,
        hour: 9,
        minute: 0,
      },
    });
  }

  // Immediate notifications
  async sendBudgetAlert(
    percentage: number,
    spent: number,
    budget: number,
    currency: string
  ): Promise<void> {
    if (!this.preferences.budgetAlerts) return;

    let title: string;
    let body: string;

    if (percentage >= 100) {
      title = 'Budget superato!';
      body = `Hai speso ${formatCurrency(spent, currency)} superando il budget di ${formatCurrency(budget, currency)}.`;
    } else if (percentage >= 95) {
      title = 'Budget quasi esaurito!';
      body = `Hai usato il ${percentage.toFixed(0)}% del budget. Rimangono solo ${formatCurrency(budget - spent, currency)}.`;
    } else if (percentage >= 85) {
      title = 'Attenzione al budget';
      body = `Sei al ${percentage.toFixed(0)}% del budget mensile. Rallenta le spese.`;
    } else if (percentage >= 70) {
      title = 'Aggiornamento budget';
      body = `Hai usato il ${percentage.toFixed(0)}% del budget. Rimangono ${formatCurrency(budget - spent, currency)}.`;
    } else {
      return; // Don't send notification for lower percentages
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'budget_alert', screen: 'stats' },
        categoryIdentifier: NOTIFICATION_CHANNELS.BUDGET_ALERTS,
      },
      trigger: null, // Send immediately
    });
  }

  async sendCategoryBudgetAlert(
    categoryName: string,
    percentage: number,
    remaining: number,
    currency: string
  ): Promise<void> {
    if (!this.preferences.budgetAlerts) return;

    let title: string;
    let body: string;

    if (percentage >= 100) {
      title = `Budget "${categoryName}" superato`;
      body = `Hai superato il budget per ${categoryName}. Valuta di ridurre le spese in questa categoria.`;
    } else if (percentage >= 85) {
      title = `Budget "${categoryName}" quasi esaurito`;
      body = `Rimangono solo ${formatCurrency(remaining, currency)} per ${categoryName} questo mese.`;
    } else {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'category_budget_alert', screen: 'stats' },
        categoryIdentifier: NOTIFICATION_CHANNELS.BUDGET_ALERTS,
      },
      trigger: null,
    });
  }

  async sendRecurringReminder(
    name: string,
    amount: number,
    currency: string,
    dueDate: Date
  ): Promise<void> {
    if (!this.preferences.recurringReminders) return;

    const formattedDate = format(dueDate, 'd MMMM', { locale: it });

    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Spesa ricorrente in scadenza',
        body: `${name} (${formatCurrency(amount, currency)}) scade il ${formattedDate}.`,
        data: { type: 'recurring_reminder', screen: 'recurring' },
        categoryIdentifier: NOTIFICATION_CHANNELS.RECURRING,
      },
      trigger: null,
    });
  }

  async scheduleRecurringReminder(
    id: string,
    name: string,
    amount: number,
    currency: string,
    dueDate: Date,
    daysBefore: number = 1
  ): Promise<string | null> {
    if (!this.preferences.recurringReminders) return null;

    const reminderDate = addDays(dueDate, -daysBefore);
    if (reminderDate <= new Date()) return null;

    const formattedDate = format(dueDate, 'd MMMM', { locale: it });

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Spesa ricorrente in arrivo',
        body: `${name} (${formatCurrency(amount, currency)}) scade ${daysBefore === 1 ? 'domani' : `tra ${daysBefore} giorni`} (${formattedDate}).`,
        data: { type: 'recurring_reminder', screen: 'recurring', recurringId: id },
        categoryIdentifier: NOTIFICATION_CHANNELS.RECURRING,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

    return notificationId;
  }

  async sendCreditReminder(
    participantName: string,
    amount: number,
    currency: string,
    daysSinceCreated: number
  ): Promise<void> {
    if (!this.preferences.creditReminders) return;

    let title: string;
    let body: string;

    if (daysSinceCreated >= 30) {
      title = 'Credito in sospeso da molto tempo';
      body = `${participantName} ti deve ${formatCurrency(amount, currency)} da oltre un mese. Considera di sollecitare.`;
    } else if (daysSinceCreated >= this.preferences.creditReminderDays) {
      title = 'Promemoria credito';
      body = `${participantName} ti deve ancora ${formatCurrency(amount, currency)}.`;
    } else {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'credit_reminder', screen: 'shared' },
        categoryIdentifier: NOTIFICATION_CHANNELS.CREDITS,
      },
      trigger: null,
    });
  }

  async sendGoalCompletedNotification(goalName: string): Promise<void> {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Obiettivo raggiunto!',
        body: `Complimenti! Hai raggiunto l'obiettivo "${goalName}"! Continua cosi!`,
        data: { type: 'goal_completed', screen: 'goals' },
        categoryIdentifier: NOTIFICATION_CHANNELS.REPORTS,
      },
      trigger: null,
    });
  }

  async sendGoalProgressNotification(
    goalName: string,
    percentage: number,
    remaining: number,
    currency: string
  ): Promise<void> {
    if (percentage < 50) return;

    let title: string;
    let body: string;

    if (percentage >= 90) {
      title = 'Quasi al traguardo!';
      body = `Mancano solo ${formatCurrency(remaining, currency)} per completare "${goalName}"!`;
    } else if (percentage >= 75) {
      title = 'Ottimo progresso!';
      body = `Sei al ${percentage.toFixed(0)}% dell'obiettivo "${goalName}". Continua cosi!`;
    } else if (percentage >= 50) {
      title = 'A meta strada!';
      body = `Hai raggiunto il 50% dell'obiettivo "${goalName}"!`;
    } else {
      return;
    }

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data: { type: 'goal_progress', screen: 'goals' },
        categoryIdentifier: NOTIFICATION_CHANNELS.REPORTS,
      },
      trigger: null,
    });
  }

  // Utility methods
  async cancelNotification(notificationId: string): Promise<void> {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  }

  async cancelAllNotifications(): Promise<void> {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getScheduledNotifications(): Promise<Notifications.NotificationRequest[]> {
    return await Notifications.getAllScheduledNotificationsAsync();
  }

  async setBadgeCount(count: number): Promise<void> {
    await Notifications.setBadgeCountAsync(count);
  }

  async clearBadge(): Promise<void> {
    await Notifications.setBadgeCountAsync(0);
  }

  getPushToken(): string | null {
    return this.pushToken;
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance();

// Export types for notification data
export interface NotificationData {
  type: string;
  screen?: string;
  recurringId?: string;
  [key: string]: any;
}
