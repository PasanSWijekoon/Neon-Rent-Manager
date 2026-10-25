import { SQLiteDatabase } from 'expo-sqlite';
import { Share } from 'react-native';

export const BACKUP_TABLES = [
  'properties',
  'units',
  'tenants',
  'contracts',
  'rent_periods',
  'payments',
] as const;

export type BackupTable = typeof BACKUP_TABLES[number];

export interface BackupPayload {
  version: number;
  appName: string;
  exportedAt: string;
  totalRecords: number;
  data: Record<string, Record<string, unknown>[]>;
}

export interface BackupResult {
  success: boolean;
  totalRecords: number;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  totalRestored: number;
  error?: string;
}

/**
 * Exports all local SQLite domain data as a structured JSON object
 * and opens the native Android Share Sheet.
 */
export async function exportLocalBackup(db: SQLiteDatabase): Promise<BackupResult> {
  try {
    const backupData: Record<string, Record<string, unknown>[]> = {};
    let totalRecords = 0;

    for (const table of BACKUP_TABLES) {
      const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table}`);
      // Remove sensitive local internal tracking if needed, keep userId and domain columns
      backupData[table] = rows;
      totalRecords += rows.length;
    }

    const payload: BackupPayload = {
      version: 1,
      appName: 'Neon Rent Manager',
      exportedAt: new Date().toISOString(),
      totalRecords,
      data: backupData,
    };

    const jsonString = JSON.stringify(payload, null, 2);
    const dateStamp = new Date().toISOString().split('T')[0];

    await Share.share({
      title: `Neon_Rent_Manager_Backup_${dateStamp}.json`,
      message: jsonString,
    });

    return {
      success: true,
      totalRecords,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      totalRecords: 0,
      error: message,
    };
  }
}

/**
 * Validates and restores local data from a JSON backup string into SQLite.
 * Uses INSERT OR REPLACE to safely merge/update records without dropping foreign keys.
 */
export async function restoreLocalBackup(db: SQLiteDatabase, jsonString: string): Promise<RestoreResult> {
  try {
    const trimmed = jsonString.trim();
    if (!trimmed) {
      return { success: false, totalRestored: 0, error: 'Backup text is empty.' };
    }

    let payload: BackupPayload;
    try {
      payload = JSON.parse(trimmed);
    } catch {
      return { success: false, totalRestored: 0, error: 'Invalid JSON format. Please ensure the full backup text was copied.' };
    }

    if (!payload.data || typeof payload.data !== 'object') {
      return { success: false, totalRestored: 0, error: 'Unrecognized backup structure. Missing table data.' };
    }

    let totalRestored = 0;

    await db.execAsync('BEGIN TRANSACTION');

    try {
      for (const table of BACKUP_TABLES) {
        const rows = payload.data[table];
        if (Array.isArray(rows) && rows.length > 0) {
          for (const row of rows) {
            const columns = Object.keys(row);
            if (!columns.includes('syncStatus')) {
              columns.push('syncStatus');
            }
            const placeholders = columns.map(() => '?').join(', ');
            const values = columns.map(k => {
              if (k === 'syncStatus') return 'pending';
              return row[k];
            });

            await db.runAsync(
              `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`,
              values as (string | number | null)[]
            );
            totalRestored++;
          }
        }
      }

      await db.execAsync('COMMIT');
    } catch (e) {
      await db.execAsync('ROLLBACK');
      throw e;
    }

    return {
      success: true,
      totalRestored,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      totalRestored: 0,
      error: message,
    };
  }
}
