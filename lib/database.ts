import * as SQLite from 'expo-sqlite';

export const DB_NAME = 'neon-rent-manager.db';

const CURRENT_SCHEMA_VERSION = 2;

export async function initDatabase(db: SQLite.SQLiteDatabase) {
  // WIPE DATA block removed

  // Enforce foreign key constraints
  await db.execAsync('PRAGMA foreign_keys = ON;');
  
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  let currentDbVersion = result?.user_version ?? 0;

  if (currentDbVersion >= CURRENT_SCHEMA_VERSION) {
    return;
  }

  // Very simple migration framework
  if (currentDbVersion === 0) {
    await db.execAsync(`
      PRAGMA journal_mode = WAL;

      CREATE TABLE IF NOT EXISTS properties (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        address TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL
      );

      CREATE TABLE IF NOT EXISTS units (
        id TEXT PRIMARY KEY NOT NULL,
        propertyId TEXT NOT NULL,
        type TEXT NOT NULL,
        name TEXT NOT NULL,
        status TEXT NOT NULL,
        currentContractId TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (propertyId) REFERENCES properties (id)
      );

      CREATE TABLE IF NOT EXISTS tenants (
        id TEXT PRIMARY KEY NOT NULL,
        name TEXT NOT NULL,
        phone TEXT,
        address TEXT,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        archivedAt TEXT
      );

      CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY NOT NULL,
        unitId TEXT NOT NULL,
        tenantId TEXT NOT NULL,
        startDate TEXT NOT NULL,
        endDate TEXT,
        monthlyRent INTEGER NOT NULL,
        dueDay INTEGER NOT NULL,
        deposit INTEGER NOT NULL,
        status TEXT NOT NULL,
        notes TEXT,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (unitId) REFERENCES units (id),
        FOREIGN KEY (tenantId) REFERENCES tenants (id)
      );

      CREATE TABLE IF NOT EXISTS rent_periods (
        id TEXT PRIMARY KEY NOT NULL,
        contractId TEXT NOT NULL,
        periodYear INTEGER NOT NULL,
        periodMonth INTEGER NOT NULL,
        amountDue INTEGER NOT NULL,
        amountPaid INTEGER NOT NULL,
        dueDate TEXT NOT NULL,
        status TEXT NOT NULL,
        createdAt TEXT NOT NULL,
        updatedAt TEXT NOT NULL,
        FOREIGN KEY (contractId) REFERENCES contracts (id),
        UNIQUE(contractId, periodYear, periodMonth)
      );

      CREATE TABLE IF NOT EXISTS payments (
        id TEXT PRIMARY KEY NOT NULL,
        rentPeriodId TEXT NOT NULL,
        contractId TEXT NOT NULL,
        tenantId TEXT NOT NULL,
        amount INTEGER NOT NULL,
        paymentDate TEXT NOT NULL,
        method TEXT NOT NULL,
        notes TEXT,
        createdAt TEXT NOT NULL,
        FOREIGN KEY (rentPeriodId) REFERENCES rent_periods (id),
        FOREIGN KEY (contractId) REFERENCES contracts (id),
        FOREIGN KEY (tenantId) REFERENCES tenants (id)
      );
    `);
    
    await db.execAsync(`PRAGMA user_version = 1`);
  }

  if (currentDbVersion < 2) {
    try {
      await db.execAsync(`ALTER TABLE tenants ADD COLUMN address TEXT;`);
    } catch (e) {
      console.log('Column address already exists or error:', e);
    }
    await db.execAsync(`PRAGMA user_version = 2`);
  }
}
