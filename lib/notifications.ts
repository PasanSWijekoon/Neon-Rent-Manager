import { SQLiteDatabase } from 'expo-sqlite';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// Set up the foreground notification handler
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export type AlertType = 'due_today' | 'overdue' | 'expiring_contract';

export interface RentalAlert {
  id: string;
  type: AlertType;
  title: string;
  subtitle: string;
  severity: 'warning' | 'error' | 'info';
  date: string;
  targetId: string;
}

/**
 * Ensures notification channels exist on Android and requests notification permissions.
 */
export async function requestNotificationPermissions(): Promise<boolean> {
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('rent-reminders', {
        name: 'Rent Reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#2563EB',
      });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    return finalStatus === 'granted';
  } catch (e) {
    console.error('[Notifications] Failed to request permissions:', e);
    return false;
  }
}

/**
 * Scans local active rent periods and contracts for due, overdue, and expiring items.
 * Adheres to AGENTS.md rules:
 * - Rent due today
 * - Rent overdue
 * - Contract approaching expiry
 * - No duplicates or nagging on paid rents
 */
export async function getActiveAlerts(db: SQLiteDatabase): Promise<RentalAlert[]> {
  const alerts: RentalAlert[] = [];
  const today = new Date().toISOString().split('T')[0];

  // 1. Due Today
  const dueTodayRows = await db.getAllAsync<{
    id: string;
    amountDue: number;
    amountPaid: number;
    unitName: string;
    tenantName: string;
    dueDate: string;
  }>(`
    SELECT rp.id, rp.amountDue, rp.amountPaid, u.name as unitName, t.name as tenantName, rp.dueDate
    FROM rent_periods rp
    JOIN contracts c ON rp.contractId = c.id
    JOIN units u ON c.unitId = u.id
    JOIN tenants t ON c.tenantId = t.id
    WHERE rp.dueDate = ? AND rp.amountPaid < rp.amountDue AND c.status = 'active'
    ORDER BY rp.amountDue DESC
  `, [today]);

  for (const row of dueTodayRows) {
    const remaining = row.amountDue - row.amountPaid;
    alerts.push({
      id: `due-${row.id}`,
      type: 'due_today',
      title: `Rent Due Today: ${row.unitName}`,
      subtitle: `${row.tenantName} - LKR ${remaining.toLocaleString()} remaining`,
      severity: 'warning',
      date: row.dueDate,
      targetId: row.id,
    });
  }

  // 2. Overdue Rents
  const overdueRows = await db.getAllAsync<{
    id: string;
    amountDue: number;
    amountPaid: number;
    unitName: string;
    tenantName: string;
    dueDate: string;
  }>(`
    SELECT rp.id, rp.amountDue, rp.amountPaid, u.name as unitName, t.name as tenantName, rp.dueDate
    FROM rent_periods rp
    JOIN contracts c ON rp.contractId = c.id
    JOIN units u ON c.unitId = u.id
    JOIN tenants t ON c.tenantId = t.id
    WHERE rp.dueDate < ? AND rp.amountPaid < rp.amountDue AND c.status = 'active'
    ORDER BY rp.dueDate ASC
    LIMIT 10
  `, [today]);

  for (const row of overdueRows) {
    const remaining = row.amountDue - row.amountPaid;
    alerts.push({
      id: `overdue-${row.id}`,
      type: 'overdue',
      title: `Overdue Rent: ${row.unitName}`,
      subtitle: `${row.tenantName} - LKR ${remaining.toLocaleString()} overdue since ${new Date(row.dueDate).toLocaleDateString()}`,
      severity: 'error',
      date: row.dueDate,
      targetId: row.id,
    });
  }

  // 3. Contracts Expiring in the next 30 days
  const thirtyDaysAhead = new Date();
  thirtyDaysAhead.setDate(thirtyDaysAhead.getDate() + 30);
  const thirtyDaysStr = thirtyDaysAhead.toISOString().split('T')[0];

  const expiringContracts = await db.getAllAsync<{
    id: string;
    endDate: string;
    unitName: string;
    tenantName: string;
  }>(`
    SELECT c.id, c.endDate, u.name as unitName, t.name as tenantName
    FROM contracts c
    JOIN units u ON c.unitId = u.id
    JOIN tenants t ON c.tenantId = t.id
    WHERE c.status = 'active' 
      AND c.endDate IS NOT NULL 
      AND c.endDate >= ? 
      AND c.endDate <= ?
    ORDER BY c.endDate ASC
  `, [today, thirtyDaysStr]);

  for (const row of expiringContracts) {
    alerts.push({
      id: `contract-${row.id}`,
      type: 'expiring_contract',
      title: `Contract Expiring: ${row.unitName}`,
      subtitle: `${row.tenantName}'s contract expires on ${new Date(row.endDate).toLocaleDateString()}`,
      severity: 'info',
      date: row.endDate,
      targetId: row.id,
    });
  }

  return alerts;
}

/**
 * Builds a friendly, non-intrusive notification summary message.
 */
function buildNotificationSummary(alerts: RentalAlert[]): { title: string; body: string } | null {
  if (alerts.length === 0) return null;

  const dueToday = alerts.filter(a => a.type === 'due_today');
  const overdue = alerts.filter(a => a.type === 'overdue');
  const expiring = alerts.filter(a => a.type === 'expiring_contract');

  let title = 'Neon Rent Manager';
  let body = '';

  if (dueToday.length > 0 && overdue.length > 0) {
    title = 'Rent Due & Overdue';
    body = `You have ${dueToday.length} rent payment(s) due today and ${overdue.length} overdue.`;
  } else if (dueToday.length > 0) {
    title = 'Rent Due Today';
    body = dueToday.length === 1 
      ? dueToday[0].title + ': ' + dueToday[0].subtitle
      : `You have ${dueToday.length} rent payments due today.`;
  } else if (overdue.length > 0) {
    title = 'Overdue Rent Alert';
    body = overdue.length === 1
      ? overdue[0].title + ': ' + overdue[0].subtitle
      : `You have ${overdue.length} rent payments currently overdue.`;
  } else if (expiring.length > 0) {
    title = 'Contract Approaching Expiry';
    body = expiring.length === 1
      ? expiring[0].title + ': ' + expiring[0].subtitle
      : `${expiring.length} rental agreements are expiring within the next 30 days.`;
  }

  return { title, body };
}

/**
 * Schedules a daily reminder notification at 9:00 AM on Android.
 * Automatically clears duplicate notifications before scheduling.
 */
export async function scheduleDailyRentNotification(db: SQLiteDatabase): Promise<void> {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return;

    // Cancel previously scheduled reminders to prevent stacking
    await Notifications.cancelAllScheduledNotificationsAsync();

    const alerts = await getActiveAlerts(db);
    const summary = buildNotificationSummary(alerts);
    if (!summary) return;

    await Notifications.scheduleNotificationAsync({
      content: {
        title: summary.title,
        body: summary.body,
        sound: true,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: 9,
        minute: 0,
      },
    });

    console.log('[Notifications] Daily rent notification scheduled for 9:00 AM.');
  } catch (e) {
    console.error('[Notifications] Failed to schedule daily notification:', e);
  }
}

/**
 * Triggers an immediate notification in the Android status bar (useful for manual testing & immediate alert).
 */
export async function triggerImmediateRentNotification(db: SQLiteDatabase): Promise<boolean> {
  try {
    const granted = await requestNotificationPermissions();
    if (!granted) return false;

    const alerts = await getActiveAlerts(db);
    const summary = buildNotificationSummary(alerts);

    const title = summary ? summary.title : 'Neon Rent Manager';
    const body = summary 
      ? summary.body 
      : 'All rents are up to date! No payments are due today or overdue.';

    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: null, // null means trigger immediately
    });

    return true;
  } catch (e) {
    console.error('[Notifications] Failed to trigger immediate notification:', e);
    return false;
  }
}
