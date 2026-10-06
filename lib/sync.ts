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

/**
 * Pushes all 'pending' local records to Firebase Cloud Firestore.
 */
export async function pushSync(db: SQLiteDatabase): Promise<void> {
  const user = auth.currentUser;
  if (!user) return; // Cannot sync if not logged in

  const userId = user.uid;

  for (const table of SYNCABLE_TABLES) {
    try {
      // 1. Assign ownership to any old test records that were created before we added the userId column
      await db.runAsync(`UPDATE ${table} SET userId = ? WHERE userId IS NULL`, [userId]);

      // 2. Find all pending records
      const pendingRecords = await db.getAllAsync<any>(
        `SELECT * FROM ${table} WHERE syncStatus = ? AND userId = ?`, 
        ['pending', userId]
      );

      if (pendingRecords.length === 0) continue;

      // 3. Upload them to Firestore
      for (const record of pendingRecords) {
        // Strip out the local sync tracking columns before sending to cloud
        const { syncStatus, ...cloudData } = record;

        // Path: users/{userId}/{table}/{record.id}
        const docRef = doc(firestore, 'users', userId, table, record.id);
        
        await setDoc(docRef, cloudData, { merge: true });

        // 4. Mark as synced locally
        await db.runAsync(`UPDATE ${table} SET syncStatus = 'synced' WHERE id = ?`, [record.id]);
      }
      
      console.log(`[Sync Engine] Successfully pushed ${pendingRecords.length} records to ${table}.`);
    } catch (error) {
      console.error(`[Sync Engine] Failed to sync table ${table}:`, error);
    }
  }
}

/**
 * Pulls all records from Firebase Cloud Firestore down to the local SQLite database.
 * Used for restoring data on a new device.
 */
export async function pullSync(db: SQLiteDatabase): Promise<void> {
  const user = auth.currentUser;
  if (!user) return;

  const userId = user.uid;

  for (const table of SYNCABLE_TABLES) {
    try {
      const colRef = collection(firestore, 'users', userId, table);
      const snapshot = await getDocs(colRef);
      
      if (snapshot.empty) continue;

      let importedCount = 0;

      for (const docSnapshot of snapshot.docs) {
        const cloudData = docSnapshot.data();
        
        // We need to dynamically construct an UPSERT (INSERT OR REPLACE) query
        // so we don't crash on primary key collisions.
        const columns = Object.keys(cloudData);
        // Force the sync tracking columns so they stay synced locally
        columns.push('syncStatus');
        
        const placeholders = columns.map(() => '?').join(', ');
        
        const values = Object.keys(cloudData).map(k => cloudData[k]);
        values.push('synced'); // For the syncStatus column
        
        const query = `INSERT OR REPLACE INTO ${table} (${columns.join(', ')}) VALUES (${placeholders})`;
        
        await db.runAsync(query, values);
        importedCount++;
      }
      
      console.log(`[Sync Engine] Successfully pulled ${importedCount} records to ${table}.`);
    } catch (error) {
      console.error(`[Sync Engine] Failed to pull table ${table}:`, error);
    }
  }
}
