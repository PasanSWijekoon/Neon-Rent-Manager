import { SQLiteDatabase } from 'expo-sqlite';

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
