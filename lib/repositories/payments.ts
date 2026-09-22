import * as SQLite from 'expo-sqlite';
import { Payment } from '@/types/payment';

export async function createPayment(db: SQLite.SQLiteDatabase, payment: Payment): Promise<void> {
  await db.runAsync(
    'INSERT INTO payments (id, rentPeriodId, contractId, tenantId, amount, paymentDate, method, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
    [payment.id, payment.rentPeriodId, payment.contractId, payment.tenantId, payment.amount, payment.paymentDate, payment.method, payment.notes, payment.createdAt]
  );
}

export async function getPaymentsForRentPeriod(db: SQLite.SQLiteDatabase, rentPeriodId: string): Promise<Payment[]> {
  return await db.getAllAsync<Payment>('SELECT * FROM payments WHERE rentPeriodId = ?', [rentPeriodId]);
}

export async function getPaymentsForContract(db: SQLite.SQLiteDatabase, contractId: string): Promise<Payment[]> {
  return await db.getAllAsync<Payment>('SELECT * FROM payments WHERE contractId = ?', [contractId]);
}
