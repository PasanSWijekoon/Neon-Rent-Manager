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
