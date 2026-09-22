import * as SQLite from 'expo-sqlite';
import { RentPeriod } from '@/types/rent';

export async function createRentPeriod(db: SQLite.SQLiteDatabase, rentPeriod: RentPeriod): Promise<void> {
  await db.runAsync(
    'INSERT INTO rent_periods (id, contractId, periodYear, periodMonth, amountDue, amountPaid, dueDate, status, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [rentPeriod.id, rentPeriod.contractId, rentPeriod.periodYear, rentPeriod.periodMonth, rentPeriod.amountDue, rentPeriod.amountPaid, rentPeriod.dueDate, rentPeriod.status, rentPeriod.createdAt, rentPeriod.updatedAt]
  );
}

export async function getRentPeriodsForContract(db: SQLite.SQLiteDatabase, contractId: string): Promise<RentPeriod[]> {
  return await db.getAllAsync<RentPeriod>('SELECT * FROM rent_periods WHERE contractId = ?', [contractId]);
}
