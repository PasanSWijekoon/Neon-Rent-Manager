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

export async function getUnitById(db: SQLite.SQLiteDatabase, id: string): Promise<Unit | null> {
  return await db.getFirstAsync<Unit>('SELECT * FROM units WHERE id = ?', [id]);
}

export async function updateUnit(
  db: SQLite.SQLiteDatabase,
  id: string,
  updates: Partial<Pick<Unit, 'name' | 'status' | 'updatedAt'>>
): Promise<void> {
  const setStatements: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    setStatements.push('name = ?');
    values.push(updates.name);
  }
  if (updates.status !== undefined) {
    setStatements.push('status = ?');
    values.push(updates.status);
  }
  if (updates.updatedAt !== undefined) {
    setStatements.push('updatedAt = ?');
    values.push(updates.updatedAt);
  }

  if (setStatements.length === 0) return;

  values.push(id);
  const sql = `UPDATE units SET ${setStatements.join(', ')} WHERE id = ?`;
  await db.runAsync(sql, values);
}
