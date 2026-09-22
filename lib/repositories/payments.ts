import * as SQLite from 'expo-sqlite';
import { Payment } from '@/types/payment';
import { getRentPeriodById, updateRentPeriod } from './rentPeriods';
import { getRentPeriodStatus } from '../rentHelpers';

export async function createPayment(db: SQLite.SQLiteDatabase, payment: Payment): Promise<void> {
  // Use a transaction if available in expo-sqlite, or manual BEGIN/COMMIT
  try {
    await db.execAsync('BEGIN TRANSACTION');
    
    // Insert the payment
    await db.runAsync(
      'INSERT INTO payments (id, rentPeriodId, contractId, tenantId, amount, paymentDate, method, notes, createdAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
      [payment.id, payment.rentPeriodId, payment.contractId, payment.tenantId, payment.amount, payment.paymentDate, payment.method, payment.notes, payment.createdAt]
    );

    // Update the rent period
    const rentPeriod = await getRentPeriodById(db, payment.rentPeriodId);
    if (!rentPeriod) {
      throw new Error('Rent period not found');
    }

    const newAmountPaid = rentPeriod.amountPaid + payment.amount;
    const newStatus = getRentPeriodStatus(rentPeriod.dueDate, rentPeriod.amountDue, newAmountPaid);

    await updateRentPeriod(db, payment.rentPeriodId, {
      amountPaid: newAmountPaid,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    await db.execAsync('COMMIT');
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}

export async function getPaymentsForRentPeriod(db: SQLite.SQLiteDatabase, rentPeriodId: string): Promise<Payment[]> {
  return await db.getAllAsync<Payment>('SELECT * FROM payments WHERE rentPeriodId = ? ORDER BY paymentDate DESC, createdAt DESC', [rentPeriodId]);
}

export async function getPaymentsForContract(db: SQLite.SQLiteDatabase, contractId: string): Promise<Payment[]> {
  return await db.getAllAsync<Payment>('SELECT * FROM payments WHERE contractId = ? ORDER BY paymentDate DESC, createdAt DESC', [contractId]);
}

export async function getPaymentsForTenant(db: SQLite.SQLiteDatabase, tenantId: string): Promise<Payment[]> {
  return await db.getAllAsync<Payment>('SELECT * FROM payments WHERE tenantId = ? ORDER BY paymentDate DESC, createdAt DESC', [tenantId]);
}
