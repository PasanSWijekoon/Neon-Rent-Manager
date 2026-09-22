import * as SQLite from 'expo-sqlite';
import { Property } from '@/types/property';

export async function createProperty(db: SQLite.SQLiteDatabase, property: Property): Promise<void> {
  await db.runAsync(
    'INSERT INTO properties (id, name, address, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?)',
    [property.id, property.name, property.address, property.createdAt, property.updatedAt]
  );
}

export async function getProperties(db: SQLite.SQLiteDatabase): Promise<Property[]> {
  return await db.getAllAsync<Property>('SELECT * FROM properties');
}

export async function getProperty(db: SQLite.SQLiteDatabase, id: string): Promise<Property | null> {
  return await db.getFirstAsync<Property>('SELECT * FROM properties WHERE id = ?', [id]);
}

export async function updateProperty(
  db: SQLite.SQLiteDatabase, 
  id: string, 
  updates: Partial<Pick<Property, 'name' | 'address' | 'updatedAt'>>
): Promise<void> {
  const setStatements: string[] = [];
  const values: any[] = [];

  if (updates.name !== undefined) {
    setStatements.push('name = ?');
    values.push(updates.name);
  }
  if (updates.address !== undefined) {
    setStatements.push('address = ?');
    values.push(updates.address);
  }
  if (updates.updatedAt !== undefined) {
    setStatements.push('updatedAt = ?');
    values.push(updates.updatedAt);
  }

  if (setStatements.length === 0) return;

  values.push(id);
  const sql = `UPDATE properties SET ${setStatements.join(', ')} WHERE id = ?`;
  await db.runAsync(sql, values);
}
