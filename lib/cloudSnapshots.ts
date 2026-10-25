import { SQLiteDatabase } from 'expo-sqlite';
import { doc, setDoc, getDoc, getDocs, collection, deleteDoc } from 'firebase/firestore';
import { auth, firestore } from './firebase';
import { 
  dumpDatabaseSnapshot, 
  encryptSnapshot, 
  decryptSnapshot, 
  restoreDecryptedPayload,
  EncryptedBackupContainer,
  RestoreResult,
  DecryptedBackupData
} from './backup';

export interface CloudSnapshotMeta {
  id: string;
  createdAt: string;
  totalRecords: number;
}

/**
 * Creates an AES-256 encrypted snapshot with the owner's PIN and uploads it
 * to Firestore at users/{userId}/cloud_snapshots/{snapshotId}.
 * Zero-knowledge: The cloud only stores encrypted ciphertext.
 */
export async function saveEncryptedCloudSnapshot(
  db: SQLiteDatabase,
  pin: string
): Promise<{ success: boolean; snapshotId?: string; totalRecords: number; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, totalRecords: 0, error: 'User is not authenticated. Please log in.' };
    }

    const cleanPin = pin.trim();
    if (cleanPin.length < 4) {
      return { success: false, totalRecords: 0, error: 'PIN must be at least 4 digits.' };
    }

    const { snapshot, totalRecords } = await dumpDatabaseSnapshot(db);
    const container = encryptSnapshot(snapshot, cleanPin);

    const snapshotId = `snapshot_${Date.now().toString(36)}_${Math.random().toString(36).substring(2, 6)}`;
    const docRef = doc(firestore, 'users', user.uid, 'cloud_snapshots', snapshotId);

    await setDoc(docRef, {
      ...container,
      id: snapshotId,
      userId: user.uid,
    });

    return {
      success: true,
      snapshotId,
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
 * Lists all encrypted cloud snapshots for the authenticated owner.
 */
export async function listCloudSnapshots(): Promise<{
  success: boolean;
  snapshots: CloudSnapshotMeta[];
  error?: string;
}> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, snapshots: [], error: 'User is not authenticated.' };
    }

    const colRef = collection(firestore, 'users', user.uid, 'cloud_snapshots');
    const querySnapshot = await getDocs(colRef);

    const list: CloudSnapshotMeta[] = [];
    querySnapshot.forEach(docSnap => {
      const data = docSnap.data() as EncryptedBackupContainer & { id: string };
      list.push({
        id: data.id || docSnap.id,
        createdAt: data.createdAt,
        totalRecords: data.totalRecords || 0,
      });
    });

    list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      success: true,
      snapshots: list,
    };
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      success: false,
      snapshots: [],
      error: message,
    };
  }
}

/**
 * Downloads an encrypted cloud snapshot and decrypts it with the owner's PIN
 * without immediately writing to SQLite, allowing for preview.
 */
export async function fetchAndDecryptCloudSnapshot(
  snapshotId: string,
  pin: string
): Promise<{ success: boolean; data?: DecryptedBackupData; error?: string }> {
  try {
    const user = auth.currentUser;
    if (!user) {
      return { success: false, error: 'User is not authenticated.' };
    }

    const docRef = doc(firestore, 'users', user.uid, 'cloud_snapshots', snapshotId);
    const snap = await getDoc(docRef);

    if (!snap.exists()) {
      return { success: false, error: 'Snapshot not found in cloud.' };
    }

    const containerData = snap.data() as EncryptedBackupContainer;
    const decryptedPayload = decryptSnapshot(JSON.stringify(containerData), pin);

    return {
      success: true,
      data: decryptedPayload,
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
 * Downloads an encrypted cloud snapshot, decrypts it using the owner's PIN,
 * and merges the records into local SQLite.
 */
export async function restoreCloudSnapshot(
  db: SQLiteDatabase,
  snapshotId: string,
  pin: string
): Promise<RestoreResult> {
  const fetchResult = await fetchAndDecryptCloudSnapshot(snapshotId, pin);
  if (!fetchResult.success || !fetchResult.data) {
    return {
      success: false,
      totalRestored: 0,
      error: fetchResult.error || 'Failed to fetch snapshot.',
    };
  }

  return await restoreDecryptedPayload(db, fetchResult.data);
}

/**
 * Deletes an encrypted cloud snapshot document from Firestore.
 */
export async function deleteCloudSnapshot(snapshotId: string): Promise<boolean> {
  try {
    const user = auth.currentUser;
    if (!user) return false;
    const docRef = doc(firestore, 'users', user.uid, 'cloud_snapshots', snapshotId);
    await deleteDoc(docRef);
    return true;
  } catch {
    return false;
  }
}
