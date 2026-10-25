import { SQLiteDatabase } from 'expo-sqlite';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { AES, Utf8 } from 'crypto-es';

export const BACKUP_TABLES = [
  'properties',
  'units',
  'tenants',
  'contracts',
  'rent_periods',
  'payments',
] as const;

export type BackupTable = typeof BACKUP_TABLES[number];

export interface EncryptedBackupContainer {
  format: 'NEON_RENT_MANAGER_ENCRYPTED_BACKUP';
  version: 1;
  createdAt: string;
  appName: 'Neon Rent Manager';
  cipher: 'AES-256';
  totalRecords: number;
  ciphertext: string;
}

export interface DecryptedBackupData {
  version: number;
  appName: string;
  exportedAt: string;
  totalRecords: number;
  data: Record<string, Record<string, unknown>[]>;
}

export interface BackupResult {
  success: boolean;
  totalRecords: number;
  fileName?: string;
  error?: string;
}

export interface RestoreResult {
  success: boolean;
  totalRestored: number;
  error?: string;
}

/**
 * Gathers all domain data from SQLite and returns a structured object.
 */
export async function dumpDatabaseSnapshot(db: SQLiteDatabase): Promise<{
  snapshot: DecryptedBackupData;
  totalRecords: number;
}> {
  const backupData: Record<string, Record<string, unknown>[]> = {};
  let totalRecords = 0;

  for (const table of BACKUP_TABLES) {
    const rows = await db.getAllAsync<Record<string, unknown>>(`SELECT * FROM ${table}`);
    backupData[table] = rows;
    totalRecords += rows.length;
  }

  const snapshot: DecryptedBackupData = {
    version: 1,
    appName: 'Neon Rent Manager',
    exportedAt: new Date().toISOString(),
    totalRecords,
    data: backupData,
  };

  return { snapshot, totalRecords };
}

/**
 * Encrypts a database snapshot with the owner's numeric PIN using AES-256
 * and packages it into a verified container.
 */
export function encryptSnapshot(snapshot: DecryptedBackupData, pin: string): EncryptedBackupContainer {
  const jsonPayload = JSON.stringify(snapshot);
  const ciphertext = AES.encrypt(jsonPayload, pin).toString();

  return {
    format: 'NEON_RENT_MANAGER_ENCRYPTED_BACKUP',
    version: 1,
    createdAt: new Date().toISOString(),
    appName: 'Neon Rent Manager',
    cipher: 'AES-256',
    totalRecords: snapshot.totalRecords,
    ciphertext,
  };
}

/**
 * Decrypts an EncryptedBackupContainer using the owner's numeric PIN.
 * Returns the decrypted data or throws if PIN is incorrect or payload corrupted.
 */
export function decryptSnapshot(containerText: string, pin: string): DecryptedBackupData {
  let container: EncryptedBackupContainer;
  try {
    container = JSON.parse(containerText.trim());
  } catch {
    throw new Error('Invalid file format. This is not a valid Neon backup file.');
  }

  if (container.format !== 'NEON_RENT_MANAGER_ENCRYPTED_BACKUP' || !container.ciphertext) {
    throw new Error('Unrecognized backup format. Please select a valid .neon backup file.');
  }

  let decryptedJson = '';
  try {
    const bytes = AES.decrypt(container.ciphertext, pin);
    decryptedJson = bytes.toString(Utf8);
  } catch {
    throw new Error('Incorrect PIN. Please re-enter the 4-6 digit PIN used when creating this backup.');
  }

  if (!decryptedJson || decryptedJson.trim() === '') {
    throw new Error('Incorrect PIN. Please re-enter the 4-6 digit PIN used when creating this backup.');
  }

  let payload: DecryptedBackupData;
  try {
    payload = JSON.parse(decryptedJson);
  } catch {
    throw new Error('Failed to parse decrypted data. The backup file may be corrupted.');
  }

  if (!payload.data || typeof payload.data !== 'object') {
    throw new Error('Backup contents are incomplete or missing domain tables.');
  }

  return payload;
}

/**
 * Exports SQLite database to a password-encrypted .neon file and triggers
 * the Android native Save/Share sheet to store it in Downloads, Documents, or Google Drive.
 */
export async function exportEncryptedBackupFile(db: SQLiteDatabase, pin: string): Promise<BackupResult> {
  try {
    const cleanPin = pin.trim();
    if (cleanPin.length < 4) {
      return { success: false, totalRecords: 0, error: 'PIN must be at least 4 digits.' };
    }

    const { snapshot, totalRecords } = await dumpDatabaseSnapshot(db);
    const container = encryptSnapshot(snapshot, cleanPin);
    const containerJson = JSON.stringify(container, null, 2);

    const now = new Date();
    const dateStr = now.toISOString().split('T')[0];
    const timeStr = String(now.getHours()).padStart(2, '0') + String(now.getMinutes()).padStart(2, '0');
    const fileName = `NeonBackup_${dateStr}_${timeStr}.neon`;

    const targetDir = FileSystem.cacheDirectory || FileSystem.documentDirectory;
    const fileUri = `${targetDir}${fileName}`;

    await FileSystem.writeAsStringAsync(fileUri, containerJson, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(fileUri, {
        mimeType: 'application/octet-stream',
        dialogTitle: 'Save Encrypted Neon Backup',
      });
    }

    return {
      success: true,
      totalRecords,
      fileName,
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
 * Opens native Android Document Picker to choose a .neon file and reads its content.
 */
export async function pickBackupFile(): Promise<{
  canceled: boolean;
  fileContent?: string;
  fileName?: string;
  error?: string;
}> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: '*/*',
      copyToCacheDirectory: true,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) {
      return { canceled: true };
    }

    const asset = result.assets[0];
    const fileContent = await FileSystem.readAsStringAsync(asset.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    return {
      canceled: false,
      fileContent,
      fileName: asset.name,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      canceled: false,
      error: message,
    };
  }
}

/**
 * Opens native Android Document Picker to choose a .neon file, reads it,
 * and decrypts it with the provided PIN.
 */
export async function pickAndDecryptBackupFile(pin: string): Promise<{
  success: boolean;
  data?: DecryptedBackupData;
  fileName?: string;
  error?: string;
  canceled?: boolean;
}> {
  try {
    const pickResult = await pickBackupFile();
    if (pickResult.canceled) {
      return { success: false, canceled: true };
    }
    if (pickResult.error || !pickResult.fileContent) {
      return { success: false, error: pickResult.error || 'Failed to read file.' };
    }

    const decrypted = decryptSnapshot(pickResult.fileContent, pin);

    return {
      success: true,
      data: decrypted,
      fileName: pickResult.fileName,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      error: message,
    };
  }
}

/**
 * Safely inserts or replaces decrypted domain records into SQLite tables
 * within an atomic transaction.
 */
export async function restoreDecryptedPayload(
  db: SQLiteDatabase,
  payload: DecryptedBackupData
): Promise<RestoreResult> {
  try {
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
