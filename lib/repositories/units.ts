import * as SQLite from 'expo-sqlite';
import { Unit } from '@/types/unit';

export async function createUnit(db: SQLite.SQLiteDatabase, unit: Unit): Promise<void> {
  await db.runAsync(
    'INSERT INTO units (id, propertyId, type, name, status, currentContractId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [unit.id, unit.propertyId, unit.type, unit.name, unit.status, unit.currentContractId, unit.createdAt, unit.updatedAt]
  );
}

export async function getUnits(db: SQLite.SQLiteDatabase): Promise<Unit[]> {
  return await db.getAllAsync<Unit>('SELECT * FROM units');
}

export async function getUnitsForProperty(db: SQLite.SQLiteDatabase, propertyId: string): Promise<Unit[]> {
  return await db.getAllAsync<Unit>('SELECT * FROM units WHERE propertyId = ?', [propertyId]);
}
