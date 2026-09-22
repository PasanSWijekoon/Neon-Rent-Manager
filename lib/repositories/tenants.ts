import * as SQLite from 'expo-sqlite';
import { Tenant } from '@/types/tenant';

export async function createTenant(db: SQLite.SQLiteDatabase, tenant: Tenant): Promise<void> {
  await db.runAsync(
    'INSERT INTO tenants (id, name, phone, address, notes, createdAt, updatedAt, archivedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [tenant.id, tenant.name, tenant.phone, tenant.address, tenant.notes, tenant.createdAt, tenant.updatedAt, tenant.archivedAt]
  );
}

export async function getTenants(db: SQLite.SQLiteDatabase): Promise<Tenant[]> {
  return await db.getAllAsync<Tenant>('SELECT * FROM tenants ORDER BY name ASC');
}

export async function getTenant(db: SQLite.SQLiteDatabase, id: string): Promise<Tenant | null> {
  return await db.getFirstAsync<Tenant>('SELECT * FROM tenants WHERE id = ?', [id]);
}

export async function updateTenant(db: SQLite.SQLiteDatabase, id: string, data: Partial<Tenant>): Promise<void> {
  const updates: string[] = [];
  const args: any[] = [];
  
  if (data.name !== undefined) { updates.push('name = ?'); args.push(data.name); }
  if (data.phone !== undefined) { updates.push('phone = ?'); args.push(data.phone); }
  if (data.address !== undefined) { updates.push('address = ?'); args.push(data.address); }
  if (data.notes !== undefined) { updates.push('notes = ?'); args.push(data.notes); }
  if (data.updatedAt !== undefined) { updates.push('updatedAt = ?'); args.push(data.updatedAt); }
  
  if (updates.length === 0) return;
  
  args.push(id);
  await db.runAsync(`UPDATE tenants SET ${updates.join(', ')} WHERE id = ?`, args);
}

export async function archiveTenant(db: SQLite.SQLiteDatabase, id: string): Promise<void> {
  const now = new Date().toISOString();
  await db.runAsync('UPDATE tenants SET archivedAt = ?, updatedAt = ? WHERE id = ?', [now, now, id]);
}
