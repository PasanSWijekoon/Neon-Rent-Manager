import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert, Modal, TextInput, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors } from '@/constants/theme';
import { signOut } from '@/lib/auth';
import { pushSync, pullSync, getPendingSyncCount } from '@/lib/sync';
import { exportLocalBackup, restoreLocalBackup } from '@/lib/backup';
import { getActiveAlerts, RentalAlert, triggerImmediateRentNotification } from '@/lib/notifications';
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

export default function SettingsScreen() {
  const db = useSQLiteContext();

  const [alertsModalVisible, setAlertsModalVisible] = useState(false);
  const [alerts, setAlerts] = useState<RentalAlert[]>([]);
  const [loadingAlerts, setLoadingAlerts] = useState(false);

  const [restoreModalVisible, setRestoreModalVisible] = useState(false);
  const [restoreJson, setRestoreJson] = useState('');
  const [restoring, setRestoring] = useState(false);

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

  const handleBackup = async () => {
    try {
      const res = await exportLocalBackup(db);
      if (res.success) {
        Alert.alert(
          'Backup Generated',
          `Successfully exported ${res.totalRecords} records. Use the system share sheet to save your JSON backup to Google Drive, email, or local files.`
        );
      } else {
        Alert.alert('Backup Error', res.error || 'Failed to export backup.');
      }
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Failed to export backup.');
    }
  };

  const handleRestorePrompt = () => {
    Alert.alert(
      'Restore Data',
      'Choose your restore source. Cloud restore downloads data from Firebase. Local restore imports from a saved JSON backup.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Local JSON Backup',
          onPress: () => {
            setRestoreJson('');
            setRestoreModalVisible(true);
          }
        },
        {
          text: 'Firebase Cloud',
          onPress: async () => {
            try { 
              const res = await pullSync(db); 
              if (res.success) {
                Alert.alert('Success', `Data restored from cloud! (${res.pulledCount} records imported)`); 
              } else {
                Alert.alert('Restore Incomplete', res.error || 'Failed to restore. Please check your internet connection.');
              }
            } catch(e: any) { 
              Alert.alert('Error', e?.message || 'Failed to restore.'); 
            }
          }
        }
      ]
    );
  };

  const handleExecuteLocalRestore = async () => {
    if (!restoreJson.trim()) {
      Alert.alert('Validation Error', 'Please paste the backup JSON text into the box.');
      return;
    }

    Alert.alert(
      'Confirm Restore',
      'This will merge the backup records into your database. Existing matching records will be updated safely. Proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore Now',
          onPress: async () => {
            setRestoring(true);
            try {
              const res = await restoreLocalBackup(db, restoreJson);
              if (res.success) {
                setRestoreModalVisible(false);
                setRestoreJson('');
                Alert.alert('Restore Complete', `Successfully imported ${res.totalRestored} records!`);
              } else {
                Alert.alert('Restore Failed', res.error || 'Invalid backup payload.');
              }
            } catch (e: any) {
              Alert.alert('Error', e?.message || 'Failed to restore backup.');
            } finally {
              setRestoring(false);
            }
          }
        }
      ]
    );
  };

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
            title="Cloud Sync" 
            subtitle="Sync your data with Firebase"
            onPress={async () => { 
              try { 
                const res = await pushSync(db); 
                if (res.success) {
                  Alert.alert('Success', `Data successfully synced to cloud! (${res.pushedCount} records updated)`);
                } else {
                  Alert.alert('Sync Incomplete', res.error || 'Failed to sync. Please check your internet connection.');
                }
              } catch(e: any) { 
                Alert.alert('Error', e?.message || 'Failed to sync.'); 
              } 
            }}
          />
          
          <SettingItem 
            icon="database-export" 
            iconFamily="MaterialCommunityIcons"
            title="Backup Data" 
            subtitle="Export local data to JSON / Storage"
            onPress={handleBackup}
          />
          
          <SettingItem 
            icon="database-import" 
            iconFamily="MaterialCommunityIcons"
            title="Restore Data" 
            subtitle="Import data from Cloud or JSON backup"
            onPress={handleRestorePrompt}
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
                onPress={async () => {
                  const sent = await triggerImmediateRentNotification(db);
                  if (sent) {
                    Alert.alert("Notification Sent", "A rent alert notification was sent to your status bar.");
                  } else {
                    Alert.alert("Permission Needed", "Please allow notifications in Android settings to receive alerts.");
                  }
                }}
                className="mt-4 bg-blue-50 py-3.5 rounded-xl items-center border border-blue-200 flex-row justify-center"
              >
                <Feather name="bell" size={16} color="#2563EB" style={{ marginRight: 6 }} />
                <Text className="font-poppins-semibold text-sm text-blue-700">Test Status Bar Notification</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setAlertsModalVisible(false)}
                className="mt-2.5 bg-slate-100 py-3.5 rounded-xl items-center"
              >
                <Text className="font-poppins-semibold text-sm text-slate-700">Dismiss</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Local JSON Restore Modal */}
        <Modal
          visible={restoreModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setRestoreModalVisible(false)}
        >
          <KeyboardAvoidingView 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            className="flex-1 bg-black/50 justify-end"
          >
            <View className="bg-white rounded-t-3xl p-5 pb-8">
              <View className="flex-row items-center justify-between pb-4 border-b border-slate-100 mb-4">
                <View>
                  <Text className="font-poppins-bold text-lg text-[#1E293B]">Restore from Backup</Text>
                  <Text className="font-poppins-medium text-xs text-slate-400">Paste your exported JSON backup below</Text>
                </View>
                <TouchableOpacity 
                  onPress={() => setRestoreModalVisible(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 items-center justify-center"
                >
                  <Feather name="x" size={18} color="#64748B" />
                </TouchableOpacity>
              </View>

              <TextInput
                className="bg-slate-50 border border-slate-200 rounded-2xl p-3.5 font-poppins-regular text-xs text-[#1E293B] h-40 mb-4"
                placeholder="Paste backup JSON payload here..."
                placeholderTextColor="#94A3B8"
                multiline
                textAlignVertical="top"
                value={restoreJson}
                onChangeText={setRestoreJson}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <View className="flex-row items-center">
                <TouchableOpacity
                  onPress={() => setRestoreModalVisible(false)}
                  className="flex-1 py-3.5 bg-slate-100 rounded-xl items-center mr-2"
                >
                  <Text className="font-poppins-semibold text-sm text-slate-600">Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleExecuteLocalRestore}
                  disabled={restoring}
                  className="flex-1 py-3.5 bg-blue-600 rounded-xl items-center ml-2"
                >
                  {restoring ? (
                    <ActivityIndicator size="small" color="#FFFFFF" />
                  ) : (
                    <Text className="font-poppins-semibold text-sm text-white">Restore Data</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </KeyboardAvoidingView>
        </Modal>

      </SafeAreaView>
    </View>
  );
}
