import * as SQLite from 'expo-sqlite';
import { Contract } from '@/types/contract';

export async function createContract(db: SQLite.SQLiteDatabase, contract: Contract): Promise<void> {
  await db.runAsync(
    'INSERT INTO contracts (id, unitId, tenantId, startDate, endDate, monthlyRent, dueDay, deposit, status, notes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [contract.id, contract.unitId, contract.tenantId, contract.startDate, contract.endDate, contract.monthlyRent, contract.dueDay, contract.deposit, contract.status, contract.notes, contract.createdAt, contract.updatedAt]
  );
}

export async function getContractsForUnit(db: SQLite.SQLiteDatabase, unitId: string): Promise<Contract[]> {
  return await db.getAllAsync<Contract>('SELECT * FROM contracts WHERE unitId = ?', [unitId]);
}

export async function getContract(db: SQLite.SQLiteDatabase, id: string): Promise<Contract | null> {
  return await db.getFirstAsync<Contract>('SELECT * FROM contracts WHERE id = ?', [id]);
}
