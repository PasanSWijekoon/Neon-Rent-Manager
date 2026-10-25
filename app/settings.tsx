import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  ScrollView, 
  Alert, 
  Modal, 
  TextInput, 
  ActivityIndicator, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import { signOut } from '@/lib/auth';
import { pushSync, getPendingSyncCount } from '@/lib/sync';
import { 
  exportEncryptedBackupFile, 
  pickBackupFile, 
  decryptSnapshot, 
  restoreDecryptedPayload,
  DecryptedBackupData,
  BACKUP_TABLES
} from '@/lib/backup';
import { 
  saveEncryptedCloudSnapshot, 
  listCloudSnapshots, 
  fetchAndDecryptCloudSnapshot, 
  deleteCloudSnapshot, 
  CloudSnapshotMeta 
} from '@/lib/cloudSnapshots';
import { getActiveAlerts, RentalAlert } from '@/lib/notifications';
import { useSQLiteContext } from 'expo-sqlite';

type SettingItemProps = {
  icon: keyof typeof Feather.glyphMap | keyof typeof MaterialCommunityIcons.glyphMap;
  title: string;
  subtitle?: string;
  isDestructive?: boolean;
  onPress: () => void;
  iconFamily?: 'Feather' | 'MaterialCommunityIcons';
};

function SettingItem({ icon, title, subtitle, isDestructive, onPress, iconFamily = 'Feather' }: SettingItemProps) {
  const color = isDestructive ? colors.error : colors.textPrimary;
  const bgColor = isDestructive ? 'bg-error/10' : 'bg-primary/10';

  return (
    <TouchableOpacity 
      className="flex-row items-center justify-between p-4 bg-white mb-2 rounded-2xl shadow-sm border border-slate-100"
      activeOpacity={0.7}
      onPress={onPress}
    >
      <View className="flex-row items-center flex-1">
        <View className={`w-10 h-10 rounded-full items-center justify-center mr-4 ${bgColor}`}>
          {iconFamily === 'Feather' ? (
            <Feather name={icon as any} size={20} color={color} />
          ) : (
            <MaterialCommunityIcons name={icon as any} size={20} color={color} />
          )}
        </View>
        <View className="flex-1 pr-4">
          <Text className={`font-poppins-semibold text-[15px] ${isDestructive ? 'text-error' : 'text-[#1E293B]'} mb-0.5`}>
            {title}
          </Text>
          {subtitle && (
            <Text className="font-poppins-medium text-xs text-slate-400">
              {subtitle}
            </Text>
          )}
        </View>
      </View>
      <Feather name="chevron-right" size={20} color="#CBD5E1" />
    </TouchableOpacity>
  );
}

type PinModalMode = 'export_local' | 'restore_local' | 'export_cloud' | 'restore_cloud';

function formatSnapshotDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export default function SettingsScreen() {
  const db = useSQLiteContext();

  // Rent Alerts
  const [alertsModalVisible, setAlertsModalVisible] = useState(false);
  const [alerts, setAlerts] = useState<RentalAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  // PIN Entry Modal
  const [pinModalVisible, setPinModalVisible] = useState(false);
  const [pinModalMode, setPinModalMode] = useState<PinModalMode>('export_local');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [pinProcessing, setPinProcessing] = useState(false);
  const [targetSnapshotId, setTargetSnapshotId] = useState<string | null>(null);

  // Picked local file (for restore_local)
  const [pickedLocalFile, setPickedLocalFile] = useState<{
    fileName: string;
    fileContent: string;
  } | null>(null);

  // Restore Preview Modal
  const [previewModalVisible, setPreviewModalVisible] = useState(false);
  const [previewData, setPreviewData] = useState<DecryptedBackupData | null>(null);
  const [previewSource, setPreviewSource] = useState<string>('');
  const [restoring, setRestoring] = useState(false);

  // Cloud Snapshots Modal
  const [cloudModalVisible, setCloudModalVisible] = useState(false);
  const [cloudSnapshots, setCloudSnapshots] = useState<CloudSnapshotMeta[]>([]);
  const [loadingSnapshots, setLoadingSnapshots] = useState(false);

  // Open Alerts Modal
  const handleOpenAlerts = async () => {
    setLoadingAlerts(true);
    setAlertsModalVisible(true);
    try {
      const activeAlerts = await getActiveAlerts(db);
      setAlerts(activeAlerts);
    } catch (e) {
      console.error(e);
      Alert.alert('Error', 'Unable to load alerts.');
    } finally {
      setLoadingAlerts(false);
    }
  };

  // 1. Export Local Encrypted Backup
  const handleStartExportLocal = () => {
    setPin('');
    setConfirmPin('');
    setPinModalMode('export_local');
    setPinModalVisible(true);
  };

  // 2. Pick and Restore Local Encrypted Backup
  const handleStartRestoreLocal = async () => {
    try {
      const pick = await pickBackupFile();
      if (pick.canceled) return;

      if (pick.error || !pick.fileContent) {
        Alert.alert('File Picker Error', pick.error || 'Failed to read the chosen file.');
        return;
      }

      // Check header format safely
      try {
        const parsed = JSON.parse(pick.fileContent);
        if (parsed.format !== 'NEON_RENT_MANAGER_ENCRYPTED_BACKUP') {
          Alert.alert('Invalid File', 'The selected file is not a valid Neon Rent Manager encrypted backup (.neon).');
          return;
        }
      } catch {
        Alert.alert('Invalid File', 'The selected file is corrupted or not a valid JSON/Neon container.');
        return;
      }

      setPickedLocalFile({
        fileName: pick.fileName || 'backup.neon',
        fileContent: pick.fileContent,
      });

      setPin('');
      setConfirmPin('');
      setPinModalMode('restore_local');
      setPinModalVisible(true);
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Error', msg);
    }
  };

  // 3. Open Cloud Snapshots Modal
  const handleOpenCloudSnapshots = async () => {
    setCloudModalVisible(true);
    await refreshCloudSnapshots();
  };

  const refreshCloudSnapshots = async () => {
    setLoadingSnapshots(true);
    try {
      const res = await listCloudSnapshots();
      if (res.success) {
        setCloudSnapshots(res.snapshots);
      } else {
        Alert.alert('Cloud Error', res.error || 'Failed to load cloud snapshots.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Error', msg);
    } finally {
      setLoadingSnapshots(false);
    }
  };

  // Handle PIN Form Submission
  const handlePinSubmit = async () => {
    const cleanPin = pin.trim();

    if (cleanPin.length < 4 || cleanPin.length > 6) {
      Alert.alert('Validation Error', 'PIN must be between 4 and 6 digits.');
      return;
    }

    if (!/^\d+$/.test(cleanPin)) {
      Alert.alert('Validation Error', 'PIN must contain numeric digits only.');
      return;
    }

    if (pinModalMode === 'export_local' || pinModalMode === 'export_cloud') {
      if (cleanPin !== confirmPin.trim()) {
        Alert.alert('Validation Error', 'PIN confirmation does not match. Please verify your PIN.');
        return;
      }
    }

    setPinProcessing(true);

    try {
      if (pinModalMode === 'export_local') {
        const res = await exportEncryptedBackupFile(db, cleanPin);
        setPinModalVisible(false);
        if (res.success) {
          Alert.alert(
            'Backup Created & Encrypted',
            `Exported ${res.totalRecords} records into ${res.fileName}.\n\nUse the Android Share sheet to save it to your phone storage, Google Drive, or send via email.`
          );
        } else {
          Alert.alert('Export Error', res.error || 'Failed to export backup file.');
        }
      } else if (pinModalMode === 'restore_local') {
        if (!pickedLocalFile) {
          throw new Error('No local file selected.');
        }
        const decrypted = decryptSnapshot(pickedLocalFile.fileContent, cleanPin);
        setPinModalVisible(false);
        setPreviewData(decrypted);
        setPreviewSource(`Local File: ${pickedLocalFile.fileName}`);
        setPreviewModalVisible(true);
      } else if (pinModalMode === 'export_cloud') {
        const res = await saveEncryptedCloudSnapshot(db, cleanPin);
        setPinModalVisible(false);
        if (res.success) {
          Alert.alert(
            'Cloud Snapshot Saved',
            `Your data (${res.totalRecords} records) was encrypted with AES-256 and securely uploaded to Firebase.`
          );
          await refreshCloudSnapshots();
        } else {
          Alert.alert('Cloud Snapshot Error', res.error || 'Failed to create cloud snapshot.');
        }
      } else if (pinModalMode === 'restore_cloud') {
        if (!targetSnapshotId) {
          throw new Error('No snapshot selected.');
        }
        const res = await fetchAndDecryptCloudSnapshot(targetSnapshotId, cleanPin);
        if (res.success && res.data) {
          setPinModalVisible(false);
          setPreviewData(res.data);
          const found = cloudSnapshots.find(s => s.id === targetSnapshotId);
          setPreviewSource(`Cloud Snapshot (${found ? formatSnapshotDate(found.createdAt) : targetSnapshotId})`);
          setPreviewModalVisible(true);
        } else {
          Alert.alert('Decryption Failed', res.error || 'Incorrect PIN or corrupt snapshot.');
        }
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('PIN Error', msg);
    } finally {
      setPinProcessing(false);
    }
  };

  // Execute Restore from Preview Modal
  const handleExecuteMergeRestore = async () => {
    if (!previewData) return;

    setRestoring(true);
    try {
      const res = await restoreDecryptedPayload(db, previewData);
      if (res.success) {
        setPreviewModalVisible(false);
        setPreviewData(null);
        Alert.alert(
          'Restore Complete',
          `Successfully merged ${res.totalRestored} records into your database! All existing records were preserved and updated safely.`
        );
      } else {
        Alert.alert('Restore Failed', res.error || 'Unable to complete database restore.');
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      Alert.alert('Restore Error', msg);
    } finally {
      setRestoring(false);
    }
  };

  // Sign out handler
  const handleLogout = async () => {
    try {
      const pendingCount = await getPendingSyncCount(db);

      const proceedSignOut = async () => {
        try {
          await signOut();
          router.replace('/(auth)/login' as any);
        } catch (e) {
          console.error(e);
          Alert.alert("Error", "Failed to sign out. Please try again.");
        }
      };

      if (pendingCount > 0) {
        Alert.alert(
          "Unsynced Changes Detected",
          `You have ${pendingCount} local change${pendingCount === 1 ? '' : 's'} waiting to be uploaded to Firebase Cloud.\n\nWould you like to sync now before signing out?`,
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Sync & Sign Out",
              onPress: async () => {
                const res = await pushSync(db);
                if (res.success) {
                  await proceedSignOut();
                } else {
                  Alert.alert(
                    "Sync Incomplete",
                    "Unable to upload some changes (you might be offline). Your data will stay safe locally on this device, but will not be in the cloud yet. Sign out anyway?",
                    [
                      { text: "Cancel", style: "cancel" },
                      { text: "Sign Out Anyway", style: "destructive", onPress: proceedSignOut }
                    ]
                  );
                }
              }
            },
            {
              text: "Sign Out Without Syncing",
              style: "destructive",
              onPress: proceedSignOut
            }
          ]
        );
      } else {
        Alert.alert(
          "Log Out",
          "Are you sure you want to log out? Your local rental data will remain safely stored on this device.",
          [
            { text: "Cancel", style: "cancel" },
            { 
              text: "Log Out", 
              style: "destructive",
              onPress: proceedSignOut
            }
          ]
        );
      }
    } catch (e) {
      console.error(e);
    }
  };

  const isExportMode = pinModalMode === 'export_local' || pinModalMode === 'export_cloud';

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
        {/* Header */}
        <View className="px-4 py-4 flex-row items-center border-b border-slate-200 bg-white">
          <TouchableOpacity onPress={() => router.back()} className="mr-3 p-1">
            <Feather name="arrow-left" size={24} color="#1E293B" />
          </TouchableOpacity>
          <Text className="font-poppins-semibold text-lg text-[#1E293B]">Settings</Text>
        </View>

        <ScrollView className="flex-1 px-4 pt-4" showsVerticalScrollIndicator={false}>
          <Text className="font-poppins-semibold text-xs text-slate-400 uppercase tracking-wider mb-3 mt-2 ml-1">
            Account
          </Text>
          
          <SettingItem 
            icon="user" 
            title="Edit Profile" 
            subtitle="Update name, contact & password"
            onPress={() => router.push('/settings/profile' as any)}
          />

          <Text className="font-poppins-semibold text-xs text-slate-400 uppercase tracking-wider mb-3 mt-6 ml-1">
            Preferences & Alerts
          </Text>
          
          <SettingItem 
            icon="bell" 
            title="Rent Alerts & Reminders" 
            subtitle="View rent due today, overdue & expiring contracts"
            onPress={handleOpenAlerts}
          />

          <Text className="font-poppins-semibold text-xs text-slate-400 uppercase tracking-wider mb-3 mt-6 ml-1">
            Data & Backup
          </Text>
          
          <SettingItem 
            icon="cloud-sync-outline" 
            iconFamily="MaterialCommunityIcons"
            title="Cloud Live Sync" 
            subtitle="Push pending local changes to Firebase Firestore"
            onPress={async () => { 
              try { 
                const res = await pushSync(db); 
                if (res.success) {
                  Alert.alert('Success', `Data successfully synced to cloud! (${res.pushedCount} records updated)`);
                } else {
                  Alert.alert('Sync Incomplete', res.error || 'Failed to sync. Please check your internet connection.');
                }
              } catch(e: unknown) { 
                const msg = e instanceof Error ? e.message : String(e);
                Alert.alert('Error', msg); 
              } 
            }}
          />
          
          <SettingItem 
            icon="shield-lock-outline" 
            iconFamily="MaterialCommunityIcons"
            title="Encrypted Backup (.neon)" 
            subtitle="Export AES-256 encrypted file to phone storage"
            onPress={handleStartExportLocal}
          />
          
          <SettingItem 
            icon="file-restore-outline" 
            iconFamily="MaterialCommunityIcons"
            title="Restore Backup (.neon)" 
            subtitle="Select .neon file and decrypt with your PIN"
            onPress={handleStartRestoreLocal}
          />

          <SettingItem 
            icon="cloud-lock-outline" 
            iconFamily="MaterialCommunityIcons"
            title="Encrypted Cloud Snapshots" 
            subtitle="Zero-knowledge AES-256 backups on Firebase"
            onPress={handleOpenCloudSnapshots}
          />

          <Text className="font-poppins-semibold text-xs text-slate-400 uppercase tracking-wider mb-3 mt-6 ml-1">
            Authentication
          </Text>

          <SettingItem 
            icon="log-out" 
            title="Log Out" 
            subtitle="Sign out of your account safely"
            isDestructive={true}
            onPress={handleLogout}
          />
          
          <View className="items-center mt-8 mb-12 opacity-50">
            <Text className="font-poppins-medium text-xs text-slate-400">Neon Rent Manager v1.0.0</Text>
          </View>
        </ScrollView>

        {/* Alerts & Reminders Modal */}
        <Modal
          visible={alertsModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAlertsModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl max-h-[85%] pb-8 pt-5 px-5">
              <View className="flex-row items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <Feather name="bell" size={20} color="#2563EB" />
                  </View>
                  <View>
                    <Text className="font-poppins-bold text-lg text-[#1E293B]">Rent Alerts</Text>
                    <Text className="font-poppins-medium text-xs text-slate-400">
                      {alerts.length} active notification{alerts.length === 1 ? '' : 's'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => setAlertsModalVisible(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                >
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              {loadingAlerts ? (
                <View className="py-12 items-center justify-center">
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : alerts.length === 0 ? (
                <View className="py-12 items-center justify-center">
                  <View className="w-14 h-14 rounded-full bg-emerald-100 items-center justify-center mb-3">
                    <Feather name="check" size={28} color="#10B981" />
                  </View>
                  <Text className="font-poppins-semibold text-base text-[#1E293B] mb-1">All Clear</Text>
                  <Text className="font-poppins-regular text-xs text-slate-400 text-center px-6">
                    No rents are due today or overdue, and no contracts are nearing expiration.
                  </Text>
                </View>
              ) : (
                <ScrollView className="max-h-[420px]" showsVerticalScrollIndicator={false}>
                  {alerts.map(a => {
                    let badgeBg = 'bg-blue-100';
                    let badgeText = 'text-blue-700';
                    let iconName: any = 'clock-outline';
                    
                    if (a.severity === 'error') {
                      badgeBg = 'bg-red-100';
                      badgeText = 'text-red-700';
                      iconName = 'alert-circle-outline';
                    } else if (a.severity === 'warning') {
                      badgeBg = 'bg-amber-100';
                      badgeText = 'text-amber-700';
                      iconName = 'calendar-clock';
                    }

                    return (
                      <View key={a.id} className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl mb-2.5 flex-row items-center">
                        <View className={`w-10 h-10 rounded-full ${badgeBg} items-center justify-center mr-3`}>
                          <MaterialCommunityIcons name={iconName} size={20} color={a.severity === 'error' ? '#EF4444' : a.severity === 'warning' ? '#D97706' : '#2563EB'} />
                        </View>
                        <View className="flex-1 pr-2">
                          <Text className="font-poppins-semibold text-sm text-[#1E293B] mb-0.5">{a.title}</Text>
                          <Text className="font-poppins-regular text-xs text-slate-500 leading-relaxed">{a.subtitle}</Text>
                        </View>
                      </View>
                    );
                  })}
                </ScrollView>
              )}

              <TouchableOpacity
                onPress={() => setAlertsModalVisible(false)}
                className="mt-4 bg-slate-100 py-3.5 rounded-xl items-center"
              >
                <Text className="font-poppins-semibold text-sm text-slate-700">Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* PIN Entry / Prompt Modal */}
        <Modal
          visible={pinModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            if (!pinProcessing) setPinModalVisible(false);
          }}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-black/50 justify-end"
          >
            <View className="bg-white rounded-t-3xl p-5 pb-8">
              <View className="flex-row items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <View className="flex-row items-center flex-1 pr-2">
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <MaterialCommunityIcons name="shield-key-outline" size={22} color="#2563EB" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-poppins-bold text-base text-[#1E293B]">
                      {isExportMode ? 'Set 4–6 Digit Backup PIN' : 'Enter Backup PIN'}
                    </Text>
                    <Text className="font-poppins-medium text-xs text-slate-400">
                      {pinModalMode === 'export_local' && 'Used to encrypt your .neon backup with AES-256'}
                      {pinModalMode === 'export_cloud' && 'Used to encrypt your cloud snapshot with zero-knowledge AES-256'}
                      {pinModalMode === 'restore_local' && `Enter PIN for ${pickedLocalFile?.fileName || 'this file'}`}
                      {pinModalMode === 'restore_cloud' && 'Enter PIN to decrypt and preview this cloud snapshot'}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => setPinModalVisible(false)}
                  disabled={pinProcessing}
                  className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                >
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <View className="mb-4">
                <Text className="font-poppins-medium text-xs text-slate-600 mb-1.5 ml-1">
                  {isExportMode ? 'Create PIN (4–6 digits)' : 'Numeric PIN (4–6 digits)'}
                </Text>
                <TextInput
                  className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-poppins-semibold text-base text-[#1E293B] tracking-widest text-center"
                  placeholder="••••"
                  placeholderTextColor="#94A3B8"
                  keyboardType="numeric"
                  secureTextEntry
                  maxLength={6}
                  value={pin}
                  onChangeText={setPin}
                />
              </View>

              {isExportMode && (
                <View className="mb-4">
                  <Text className="font-poppins-medium text-xs text-slate-600 mb-1.5 ml-1">
                    Confirm PIN
                  </Text>
                  <TextInput
                    className="bg-slate-50 border border-slate-200 rounded-2xl px-4 py-3 font-poppins-semibold text-base text-[#1E293B] tracking-widest text-center"
                    placeholder="••••"
                    placeholderTextColor="#94A3B8"
                    keyboardType="numeric"
                    secureTextEntry
                    maxLength={6}
                    value={confirmPin}
                    onChangeText={setConfirmPin}
                  />
                  <Text className="font-poppins-regular text-[11px] text-amber-600 mt-2 ml-1">
                    Important: Remember this PIN! Without it, your encrypted backup cannot be decrypted.
                  </Text>
                </View>
              )}

              <View className="flex-row items-center mt-2">
                <TouchableOpacity
                  onPress={() => setPinModalVisible(false)}
                  disabled={pinProcessing}
                  className="flex-1 py-3.5 bg-slate-100 rounded-xl items-center mr-2"
                >
                  <Text className="font-poppins-semibold text-sm text-slate-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handlePinSubmit}
                  disabled={pinProcessing}
                  className="flex-1 py-3.5 bg-blue-600 rounded-xl items-center ml-2"
                >
                  {pinProcessing ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="font-poppins-semibold text-sm text-white">
                      {isExportMode ? 'Encrypt & Export' : 'Decrypt & Preview'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

        {/* Restore Preview Modal */}
        <Modal
          visible={previewModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => {
            if (!restoring) setPreviewModalVisible(false);
          }}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
              <View className="flex-row items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <View className="flex-row items-center flex-1 pr-2">
                  <View className="w-10 h-10 rounded-full bg-emerald-100 items-center justify-center mr-3">
                    <MaterialCommunityIcons name="database-check-outline" size={22} color="#10B981" />
                  </View>
                  <View className="flex-1">
                    <Text className="font-poppins-bold text-base text-[#1E293B]">Restore Preview</Text>
                    <Text className="font-poppins-medium text-xs text-slate-400" numberOfLines={1}>
                      {previewSource}
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => setPreviewModalVisible(false)}
                  disabled={restoring}
                  className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                >
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} className="max-h-[380px]">
                {/* Total Records Badge */}
                <View className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 mb-4 flex-row items-center justify-between">
                  <View>
                    <Text className="font-poppins-semibold text-sm text-emerald-900">Total Decrypted Records</Text>
                    <Text className="font-poppins-regular text-xs text-emerald-700">AES-256 decryption verified</Text>
                  </View>
                  <View className="bg-emerald-600 px-3 py-1.5 rounded-full">
                    <Text className="font-poppins-bold text-sm text-white">
                      {previewData?.totalRecords || 0}
                    </Text>
                  </View>
                </View>

                {/* Table Breakdown Grid */}
                <Text className="font-poppins-semibold text-xs text-slate-500 uppercase tracking-wider mb-2 ml-1">
                  Record Breakdown
                </Text>
                
                <View className="bg-slate-50 border border-slate-200 rounded-2xl p-3 mb-4">
                  {BACKUP_TABLES.map(table => {
                    const count = Array.isArray(previewData?.data?.[table]) 
                      ? previewData!.data[table].length 
                      : 0;
                    const readableName = table.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

                    return (
                      <View key={table} className="flex-row items-center justify-between py-2 border-b border-slate-100 last:border-b-0">
                        <Text className="font-poppins-medium text-xs text-slate-700">{readableName}</Text>
                        <Text className="font-poppins-semibold text-xs text-slate-900">{count} record{count === 1 ? '' : 's'}</Text>
                      </View>
                    );
                  })}
                </View>

                {/* Merge Safety Note */}
                <View className="p-3.5 bg-blue-50 rounded-2xl border border-blue-100 mb-4 flex-row items-start">
                  <Feather name="info" size={18} color="#2563EB" style={{ marginTop: 2, marginRight: 8 }} />
                  <Text className="font-poppins-regular text-xs text-blue-800 flex-1 leading-relaxed">
                    Safe Merge: Records will be merged into SQLite via an atomic transaction. Existing records with matching IDs will be safely updated without deleting other data.
                  </Text>
                </View>
              </ScrollView>

              <View className="flex-row items-center mt-3">
                <TouchableOpacity
                  onPress={() => setPreviewModalVisible(false)}
                  disabled={restoring}
                  className="flex-1 py-3.5 bg-slate-100 rounded-xl items-center mr-2"
                >
                  <Text className="font-poppins-semibold text-sm text-slate-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleExecuteMergeRestore}
                  disabled={restoring}
                  className="flex-1 py-3.5 bg-emerald-600 rounded-xl items-center ml-2"
                >
                  {restoring ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="font-poppins-semibold text-sm text-white">Confirm & Restore</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Encrypted Cloud Snapshots Manager Modal */}
        <Modal
          visible={cloudModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setCloudModalVisible(false)}
        >
          <View className="flex-1 bg-black/50 justify-end">
            <View className="bg-white rounded-t-3xl p-5 pb-8 max-h-[85%]">
              <View className="flex-row items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <View className="flex-row items-center">
                  <View className="w-10 h-10 rounded-full bg-blue-100 items-center justify-center mr-3">
                    <MaterialCommunityIcons name="cloud-lock" size={22} color="#2563EB" />
                  </View>
                  <View>
                    <Text className="font-poppins-bold text-lg text-[#1E293B]">Cloud Snapshots</Text>
                    <Text className="font-poppins-medium text-xs text-slate-400">
                      Zero-knowledge AES-256 encrypted
                    </Text>
                  </View>
                </View>
                <TouchableOpacity 
                  onPress={() => setCloudModalVisible(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                >
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              {/* Action: Create Cloud Snapshot */}
              <TouchableOpacity
                onPress={() => {
                  setPin('');
                  setConfirmPin('');
                  setPinModalMode('export_cloud');
                  setPinModalVisible(true);
                }}
                className="mb-4 bg-blue-600 py-3.5 px-4 rounded-xl flex-row items-center justify-center shadow-sm"
              >
                <MaterialCommunityIcons name="plus-circle-outline" size={18} color="#FFFFFF" style={{ marginRight: 6 }} />
                <Text className="font-poppins-semibold text-sm text-white">Create Cloud Snapshot</Text>
              </TouchableOpacity>

              {loadingSnapshots ? (
                <View className="py-12 items-center justify-center">
                  <ActivityIndicator size="large" color={colors.primary} />
                </View>
              ) : cloudSnapshots.length === 0 ? (
                <View className="py-12 items-center justify-center">
                  <View className="w-14 h-14 rounded-full bg-slate-100 items-center justify-center mb-3">
                    <MaterialCommunityIcons name="cloud-outline" size={28} color="#94A3B8" />
                  </View>
                  <Text className="font-poppins-semibold text-base text-[#1E293B] mb-1">No Snapshots Yet</Text>
                  <Text className="font-poppins-regular text-xs text-slate-400 text-center px-6">
                    Create your first encrypted snapshot above to store a secure cloud recovery point.
                  </Text>
                </View>
              ) : (
                <ScrollView className="max-h-[380px]" showsVerticalScrollIndicator={false}>
                  {cloudSnapshots.map(snap => (
                    <View 
                      key={snap.id} 
                      className="p-3.5 bg-slate-50 border border-slate-200 rounded-2xl mb-3 flex-row items-center justify-between"
                    >
                      <View className="flex-1 pr-3">
                        <View className="flex-row items-center mb-1">
                          <MaterialCommunityIcons name="shield-check" size={16} color="#10B981" style={{ marginRight: 4 }} />
                          <Text className="font-poppins-semibold text-sm text-[#1E293B]">
                            {formatSnapshotDate(snap.createdAt)}
                          </Text>
                        </View>
                        <Text className="font-poppins-medium text-xs text-slate-400">
                          {snap.totalRecords} records • AES-256
                        </Text>
                      </View>

                      <View className="flex-row items-center">
                        <TouchableOpacity
                          onPress={() => {
                            setTargetSnapshotId(snap.id);
                            setPin('');
                            setPinModalMode('restore_cloud');
                            setPinModalVisible(true);
                          }}
                          className="bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 mr-2"
                        >
                          <Text className="font-poppins-semibold text-xs text-blue-700">Restore</Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                          onPress={() => {
                            Alert.alert(
                              'Delete Snapshot',
                              'Are you sure you want to permanently delete this encrypted cloud snapshot?',
                              [
                                { text: 'Cancel', style: 'cancel' },
                                {
                                  text: 'Delete',
                                  style: 'destructive',
                                  onPress: async () => {
                                    const success = await deleteCloudSnapshot(snap.id);
                                    if (success) {
                                      await refreshCloudSnapshots();
                                    } else {
                                      Alert.alert('Error', 'Failed to delete cloud snapshot.');
                                    }
                                  }
                                }
                              ]
                            );
                          }}
                          className="w-8 h-8 rounded-lg bg-red-50 items-center justify-center border border-red-100"
                        >
                          <Feather name="trash-2" size={16} color="#EF4444" />
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </ScrollView>
              )}

              <TouchableOpacity
                onPress={() => setCloudModalVisible(false)}
                className="mt-4 bg-slate-100 py-3.5 rounded-xl items-center"
              >
                <Text className="font-poppins-semibold text-sm text-slate-700">Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

      </SafeAreaView>
    </View>
  );
}
