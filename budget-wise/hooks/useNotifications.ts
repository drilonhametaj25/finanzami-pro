import { useEffect, useRef, useState, useCallback } from 'react';
import * as Notifications from 'expo-notifications';
import { useRouter } from 'expo-router';
import { AppState, AppStateStatus } from 'react-native';

import {
  notificationService,
  NotificationData,
  DEFAULT_NOTIFICATION_PREFERENCES,
} from '../services/notifications';
import { NotificationPreferences } from '../types';

export function useNotifications() {
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(
    DEFAULT_NOTIFICATION_PREFERENCES
  );
  const [expoPushToken, setExpoPushToken] = useState<string | null>(null);
  const notificationListener = useRef<Notifications.Subscription | null>(null);
  const responseListener = useRef<Notifications.Subscription | null>(null);
  const appState = useRef(AppState.currentState);

  // Initialize notification service
  const initialize = useCallback(async () => {
    try {
      await notificationService.initialize();
      const prefs = notificationService.getPreferences();
      setPreferences(prefs);
      setExpoPushToken(notificationService.getPushToken());
      setIsInitialized(true);
    } catch (error) {
      console.error('Error initializing notifications:', error);
    }
  }, []);

  // Handle notification navigation
  const handleNotificationResponse = useCallback(
    (response: Notifications.NotificationResponse) => {
      const data = response.notification.request.content.data as NotificationData;

      if (data?.screen) {
        // Navigate to the appropriate screen
        switch (data.screen) {
          case 'transaction/add':
            router.push('/transaction/add');
            break;
          case 'stats':
            router.push('/(tabs)/stats');
            break;
          case 'recurring':
            router.push('/recurring');
            break;
          case 'shared':
            router.push('/shared');
            break;
          case 'goals':
            router.push('/(tabs)/goals');
            break;
          case 'insights':
            router.push('/insights');
            break;
          default:
            break;
        }
      }
    },
    [router]
  );

  // Set up listeners
  useEffect(() => {
    initialize();

    // Listener for notifications received while app is foregrounded
    notificationListener.current = Notifications.addNotificationReceivedListener(
      (notification) => {
        console.log('Notification received:', notification);
      }
    );

    // Listener for when user taps on notification
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      handleNotificationResponse
    );

    // Handle app state changes to clear badge
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appState.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // Clear badge when app comes to foreground
        notificationService.clearBadge();
      }
      appState.current = nextAppState;
    };

    const appStateSubscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );

    // Check for initial notification (app opened via notification)
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response) {
        handleNotificationResponse(response);
      }
    });

    return () => {
      if (notificationListener.current) {
        Notifications.removeNotificationSubscription(notificationListener.current);
      }
      if (responseListener.current) {
        Notifications.removeNotificationSubscription(responseListener.current);
      }
      appStateSubscription.remove();
    };
  }, [initialize, handleNotificationResponse]);

  // Update preferences
  const updatePreferences = useCallback(
    async (newPreferences: Partial<NotificationPreferences>) => {
      await notificationService.savePreferences(newPreferences);
      setPreferences((prev) => ({ ...prev, ...newPreferences }));
    },
    []
  );

  // Send budget alert
  const sendBudgetAlert = useCallback(
    async (percentage: number, spent: number, budget: number, currency: string) => {
      await notificationService.sendBudgetAlert(percentage, spent, budget, currency);
    },
    []
  );

  // Send category budget alert
  const sendCategoryBudgetAlert = useCallback(
    async (
      categoryName: string,
      percentage: number,
      remaining: number,
      currency: string
    ) => {
      await notificationService.sendCategoryBudgetAlert(
        categoryName,
        percentage,
        remaining,
        currency
      );
    },
    []
  );

  // Send recurring reminder
  const sendRecurringReminder = useCallback(
    async (name: string, amount: number, currency: string, dueDate: Date) => {
      await notificationService.sendRecurringReminder(name, amount, currency, dueDate);
    },
    []
  );

  // Schedule recurring reminder
  const scheduleRecurringReminder = useCallback(
    async (
      id: string,
      name: string,
      amount: number,
      currency: string,
      dueDate: Date,
      daysBefore?: number
    ) => {
      return await notificationService.scheduleRecurringReminder(
        id,
        name,
        amount,
        currency,
        dueDate,
        daysBefore
      );
    },
    []
  );

  // Send credit reminder
  const sendCreditReminder = useCallback(
    async (
      participantName: string,
      amount: number,
      currency: string,
      daysSinceCreated: number
    ) => {
      await notificationService.sendCreditReminder(
        participantName,
        amount,
        currency,
        daysSinceCreated
      );
    },
    []
  );

  // Send goal notifications
  const sendGoalCompletedNotification = useCallback(async (goalName: string) => {
    await notificationService.sendGoalCompletedNotification(goalName);
  }, []);

  const sendGoalProgressNotification = useCallback(
    async (goalName: string, percentage: number, remaining: number, currency: string) => {
      await notificationService.sendGoalProgressNotification(
        goalName,
        percentage,
        remaining,
        currency
      );
    },
    []
  );

  // Cancel notification
  const cancelNotification = useCallback(async (notificationId: string) => {
    await notificationService.cancelNotification(notificationId);
  }, []);

  // Get scheduled notifications
  const getScheduledNotifications = useCallback(async () => {
    return await notificationService.getScheduledNotifications();
  }, []);

  // Clear all notifications
  const clearAllNotifications = useCallback(async () => {
    await notificationService.cancelAllNotifications();
  }, []);

  // Request permissions
  const requestPermissions = useCallback(async () => {
    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
  }, []);

  // Check permissions
  const checkPermissions = useCallback(async () => {
    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }, []);

  return {
    isInitialized,
    preferences,
    expoPushToken,
    updatePreferences,
    sendBudgetAlert,
    sendCategoryBudgetAlert,
    sendRecurringReminder,
    scheduleRecurringReminder,
    sendCreditReminder,
    sendGoalCompletedNotification,
    sendGoalProgressNotification,
    cancelNotification,
    getScheduledNotifications,
    clearAllNotifications,
    requestPermissions,
    checkPermissions,
  };
}

// Hook for checking and triggering budget alerts
export function useBudgetAlerts() {
  const { sendBudgetAlert, sendCategoryBudgetAlert, preferences } = useNotifications();
  const lastAlertPercentage = useRef<number>(0);
  const lastCategoryAlerts = useRef<Map<string, number>>(new Map());

  const checkBudgetAndAlert = useCallback(
    async (spent: number, budget: number, currency: string) => {
      if (!preferences.budgetAlerts || budget <= 0) return;

      const percentage = (spent / budget) * 100;
      const thresholds = [70, 85, 95, 100];

      // Find the highest threshold crossed
      const crossedThreshold = thresholds
        .filter((t) => percentage >= t && lastAlertPercentage.current < t)
        .pop();

      if (crossedThreshold) {
        await sendBudgetAlert(percentage, spent, budget, currency);
        lastAlertPercentage.current = crossedThreshold;
      }
    },
    [preferences.budgetAlerts, sendBudgetAlert]
  );

  const checkCategoryBudgetAndAlert = useCallback(
    async (
      categoryId: string,
      categoryName: string,
      spent: number,
      budget: number,
      currency: string
    ) => {
      if (!preferences.budgetAlerts || budget <= 0) return;

      const percentage = (spent / budget) * 100;
      const remaining = budget - spent;
      const lastAlert = lastCategoryAlerts.current.get(categoryId) || 0;

      if (percentage >= 100 && lastAlert < 100) {
        await sendCategoryBudgetAlert(categoryName, percentage, remaining, currency);
        lastCategoryAlerts.current.set(categoryId, 100);
      } else if (percentage >= 85 && lastAlert < 85) {
        await sendCategoryBudgetAlert(categoryName, percentage, remaining, currency);
        lastCategoryAlerts.current.set(categoryId, 85);
      }
    },
    [preferences.budgetAlerts, sendCategoryBudgetAlert]
  );

  const resetAlerts = useCallback(() => {
    lastAlertPercentage.current = 0;
    lastCategoryAlerts.current.clear();
  }, []);

  return {
    checkBudgetAndAlert,
    checkCategoryBudgetAndAlert,
    resetAlerts,
  };
}
