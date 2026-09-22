import * as SQLite from 'expo-sqlite';
import { Tenant } from '@/types/tenant';

export async function createTenant(db: SQLite.SQLiteDatabase, tenant: Tenant): Promise<void> {
  await db.runAsync(
    'INSERT INTO tenants (id, name, phone, notes, createdAt, updatedAt, archivedAt) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [tenant.id, tenant.name, tenant.phone, tenant.notes, tenant.createdAt, tenant.updatedAt, tenant.archivedAt]
  );
}

export async function getTenants(db: SQLite.SQLiteDatabase): Promise<Tenant[]> {
  return await db.getAllAsync<Tenant>('SELECT * FROM tenants');
}

export async function getTenant(db: SQLite.SQLiteDatabase, id: string): Promise<Tenant | null> {
  return await db.getFirstAsync<Tenant>('SELECT * FROM tenants WHERE id = ?', [id]);
}
