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
  if (data.updatedAt !== undefined) { updates.push('updatedAt = ?'); args.push(data.updatedAt); }
  
  if (updates.length === 0) return;
  
  args.push(id);
  await db.runAsync(`UPDATE contracts SET ${updates.join(', ')} WHERE id = ?`, args);
}

export async function checkContractOverlap(db: SQLite.SQLiteDatabase, unitId: string, startDate: string, endDate: string | null): Promise<boolean> {
  const query = `
    SELECT count(*) as count FROM contracts 
    WHERE unitId = ? 
    AND status NOT IN ('terminated') 
    AND startDate < COALESCE(?, '9999-12-31')
    AND COALESCE(endDate, '9999-12-31') > ?
  `;
  const result = await db.getFirstAsync<{count: number}>(query, [
    unitId, 
    endDate,
    startDate
  ]);
  return (result?.count || 0) > 0;
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
