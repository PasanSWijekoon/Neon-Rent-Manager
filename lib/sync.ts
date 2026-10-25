import { auth, firestore } from '@/lib/firebase';
import { doc, setDoc, collection, getDocs } from 'firebase/firestore';
import { SQLiteDatabase } from 'expo-sqlite';

const SYNCABLE_TABLES = [
  'properties',
  'units',
  'tenants',
  'contracts',
  'rent_periods',
  'payments'
];

export interface PushSyncResult {
  success: boolean;
  pushedCount: number;
  error?: string;
}

export interface PullSyncResult {
  success: boolean;
  pulledCount: number;
  error?: string;
}

/**
 * Counts all records across all tables that have syncStatus = 'pending'.
 */
export async function getPendingSyncCount(db: SQLiteDatabase): Promise<number> {
  let count = 0;
  for (const table of SYNCABLE_TABLES) {
    try {
      const result = await db.getFirstAsync<{ count: number }>(
        `SELECT count(*) as count FROM ${table} WHERE syncStatus = 'pending'`
      );
      count += result?.count || 0;
    } catch (e) {
      // Column might not exist in old test databases, ignore safely
    }
  }
  return count;
}

/**
 * Pushes all 'pending' local records to Firebase Cloud Firestore.
 */
export async function pushSync(db: SQLiteDatabase): Promise<PushSyncResult> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, pushedCount: 0, error: 'User is not authenticated' };
  }

  const userId = user.uid;
  let totalPushed = 0;
  let hasError = false;
  let lastErrorMessage = '';

  for (const table of SYNCABLE_TABLES) {
    try {
      // 1. Assign ownership to any records that were created before userId was populated
      await db.runAsync(`UPDATE ${table} SET userId = ? WHERE userId IS NULL`, [userId]);

      // 2. Find all pending records
      const pendingRecords = await db.getAllAsync<any>(
        `SELECT * FROM ${table} WHERE syncStatus = ? AND userId = ?`, 
        ['pending', userId]
      );

      if (pendingRecords.length === 0) continue;

      // 3. Upload them to Firestore
      for (const record of pendingRecords) {
        // Strip out the local sync tracking column before sending to cloud
        const { syncStatus, ...cloudData } = record;

        // Path: users/{userId}/{table}/{record.id}
        const docRef = doc(firestore, 'users', userId, table, record.id);
        
        await setDoc(docRef, cloudData, { merge: true });

        // 4. Mark as synced locally
        await db.runAsync(`UPDATE ${table} SET syncStatus = 'synced' WHERE id = ?`, [record.id]);
        totalPushed++;
      }
      
      console.log(`[Sync Engine] Successfully pushed ${pendingRecords.length} records to ${table}.`);
    } catch (error: any) {
      hasError = true;
      lastErrorMessage = error?.message || String(error);
      console.error(`[Sync Engine] Failed to sync table ${table}:`, error);
    }
  }

  return {
    success: !hasError,
    pushedCount: totalPushed,
    error: hasError ? lastErrorMessage : undefined
  };
}

/**
 * Pulls all records from Firebase Cloud Firestore down to the local SQLite database.
 * Used for restoring data on a new device.
 */
export async function pullSync(db: SQLiteDatabase): Promise<PullSyncResult> {
  const user = auth.currentUser;
  if (!user) {
    return { success: false, pulledCount: 0, error: 'User is not authenticated' };
  }

  const userId = user.uid;
  let totalImported = 0;
  let hasError = false;
  let lastErrorMessage = '';

  for (const table of SYNCABLE_TABLES) {
    try {
      const colRef = collection(firestore, 'users', userId, table);
      const snapshot = await getDocs(colRef);
      
      if (snapshot.empty) continue;

      let importedCount = 0;

      for (const docSnapshot of snapshot.docs) {
        const cloudData = docSnapshot.data();
        
        // Dynamically construct an UPSERT (INSERT OR REPLACE) query
        const columns = Object.keys(cloudData);
        // Force the sync tracking columns so they stay synced locally
        if (!columns.includes('syncStatus')) columns.push('syncStatus');
        if (!columns.includes('userId')) columns.push('userId');
        
        const placeholders = columns.map(() => '?').join(', ');
        
        const values = columns.map(k => {
          if (k === 'syncStatus') return 'synced';
          if (k === 'userId') return cloudData.userId || userId;
          return cloudData[k];
        });
        
        const query = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        
        await db.runAsync(query, values);
        importedCount++;
      }
      
      totalImported += importedCount;
      console.log(`[Sync Engine] Successfully pulled ${importedCount} records to ${table}.`);
    } catch (error: any) {
      hasError = true;
      lastErrorMessage = error?.message || String(error);
      console.error(`[Sync Engine] Failed to pull table ${table}:`, error);
    }
  }

  return {
    success: !hasError,
    pulledCount: totalImported,
    error: hasError ? lastErrorMessage : undefined
  };
}
