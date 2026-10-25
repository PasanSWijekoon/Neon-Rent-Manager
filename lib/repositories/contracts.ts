import * as SQLite from 'expo-sqlite';
import { Contract } from '@/types/contract';

export async function createContract(db: SQLite.SQLiteDatabase, contract: Contract): Promise<void> {
  await db.runAsync(
    'INSERT INTO contracts (id, unitId, tenantId, startDate, endDate, monthlyRent, dueDay, deposit, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [contract.id, contract.unitId, contract.tenantId, contract.startDate, contract.endDate, contract.monthlyRent, contract.dueDay, contract.deposit, contract.status, contract.notes, contract.createdAt, contract.updatedAt]
  );
}

export async function getContractsForUnit(db: SQLite.SQLiteDatabase, unitId: string): Promise<Contract[]> {
  return await db.getAllAsync<Contract>('SELECT * FROM contracts WHERE unitId = ? ORDER BY startDate DESC', [unitId]);
}

export async function getContractsForTenant(db: SQLite.SQLiteDatabase, tenantId: string): Promise<Contract[]> {
  return await db.getAllAsync<Contract>('SELECT * FROM contracts WHERE tenantId = ? ORDER BY startDate DESC', [tenantId]);
}

export async function getContract(db: SQLite.SQLiteDatabase, id: string): Promise<Contract | null> {
  return await db.getFirstAsync<Contract>('SELECT * FROM contracts WHERE id = ?', [id]);
}

export async function updateContract(db: SQLite.SQLiteDatabase, id: string, data: Partial<Contract>): Promise<void> {
  const updates: string[] = [];
  const args: any[] = [];
  
  if (data.status !== undefined) { updates.push('status = ?'); args.push(data.status); }
  if (data.endDate !== undefined) { updates.push('endDate = ?'); args.push(data.endDate); }
  if (data.notes !== undefined) { updates.push('notes = ?'); args.push(data.notes); }
  
  const now = data.updatedAt || new Date().toISOString();
  updates.push('updatedAt = ?');
  args.push(now);

  updates.push("syncStatus = 'pending'");
  
  args.push(id);
  await db.runAsync(`UPDATE contracts SET ${updates.join(', ')} WHERE id = ?`, args);
}

export async function checkContractOverlap(db: SQLite.SQLiteDatabase, unitId: string, startDate: string, endDate: string | null): Promise<boolean> {
  const query = `
    SELECT 
      (SELECT count(*) FROM contracts 
       WHERE unitId = ? 
       AND status NOT IN ('terminated') 
       AND startDate < COALESCE(?, '9999-12-31')
       AND COALESCE(endDate, '9999-12-31') > ?) as active_count,
      (SELECT capacity FROM units WHERE id = ?) as capacity
  `;
  const result = await db.getFirstAsync<{active_count: number, capacity: number}>(query, [
    unitId, 
    endDate,
    startDate,
    unitId
  ]);
  const activeCount = result?.active_count || 0;
  const capacity = result?.capacity || 1;
  return activeCount >= capacity;
}

export async function checkUnitOccupiedToday(db: SQLite.SQLiteDatabase, unitId: string): Promise<boolean> {
  const today = new Date().toISOString().split('T')[0];
  const query = `
    SELECT count(*) as count FROM contracts 
    WHERE unitId = ? 
    AND status = 'active'
    AND startDate <= ?
    AND COALESCE(endDate, '9999-12-31') >= ?
  `;
  const result = await db.getFirstAsync<{count: number}>(query, [unitId, today, today]);
  return (result?.count || 0) > 0;
}

export async function syncContractStatuses(db: SQLite.SQLiteDatabase): Promise<void> {
  const today = new Date().toISOString().split('T')[0];
  const now = new Date().toISOString();

  // Find all active contracts that have passed their endDate
  const expiredContracts = await db.getAllAsync<{ id: string; unitId: string }>(
    `SELECT id, unitId FROM contracts WHERE status = 'active' AND endDate IS NOT NULL AND endDate < ?`,
    [today]
  );

  if (expiredContracts.length === 0) return;

  // Update their status to 'expired' and flag for cloud sync
  await db.runAsync(
    `UPDATE contracts SET status = 'expired', updatedAt = ?, syncStatus = 'pending' WHERE status = 'active' AND endDate IS NOT NULL AND endDate < ?`,
    [now, today]
  );

  // For all affected units, check if they are still occupied today by another active contract
  const affectedUnitIds = Array.from(new Set(expiredContracts.map(c => c.unitId)));
  for (const unitId of affectedUnitIds) {
    const isStillOccupied = await checkUnitOccupiedToday(db, unitId);
    await db.runAsync(
      `UPDATE units SET status = ?, updatedAt = ?, syncStatus = 'pending' WHERE id = ?`,
      [isStillOccupied ? 'occupied' : 'vacant', now, unitId]
    );
  }
}
