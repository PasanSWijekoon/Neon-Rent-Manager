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

export async function reversePayment(db: SQLite.SQLiteDatabase, paymentId: string): Promise<void> {
  try {
    await db.execAsync('BEGIN TRANSACTION');

    const payment = await db.getFirstAsync<Payment>('SELECT * FROM payments WHERE id = ?', [paymentId]);
    if (!payment) {
      throw new Error('Payment not found');
    }

    const rentPeriod = await getRentPeriodById(db, payment.rentPeriodId);
    if (!rentPeriod) {
      throw new Error('Rent period not found');
    }

    const newAmountPaid = Math.max(0, rentPeriod.amountPaid - payment.amount);
    const newStatus = getRentPeriodStatus(rentPeriod.dueDate, rentPeriod.amountDue, newAmountPaid);

    await updateRentPeriod(db, payment.rentPeriodId, {
      amountPaid: newAmountPaid,
      status: newStatus,
      updatedAt: new Date().toISOString()
    });

    await db.runAsync('DELETE FROM payments WHERE id = ?', [paymentId]);

    await db.execAsync('COMMIT');

    // Attempt to delete cloud document if authenticated and online
    try {
      const { doc, deleteDoc } = require('firebase/firestore');
      const { auth, firestore } = require('../firebase');
      if (auth.currentUser) {
        const docRef = doc(firestore, 'users', auth.currentUser.uid, 'payments', paymentId);
        await deleteDoc(docRef);
      }
    } catch {
      // Offline: ignored
    }
  } catch (error) {
    await db.execAsync('ROLLBACK');
    throw error;
  }
}
