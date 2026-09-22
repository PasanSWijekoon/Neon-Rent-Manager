import React from 'react';
import { View, Text, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { typography, colors } from '@/constants/theme';
import { signOut } from '@/lib/auth';

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
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: async () => {
            try {
              await signOut();
            } catch (e) {
              console.error(e);
            }
          }
        }
      ]
    );
  };

  const showPlaceholder = (feature: string) => {
    Alert.alert("Coming Soon", `${feature} will be available in a future update.`);
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
            Preferences
          </Text>
          
          <SettingItem 
            icon="bell" 
            title="Notifications" 
            subtitle="Manage alerts and reminders"
            onPress={() => showPlaceholder("Notifications")}
          />

          <Text className="font-poppins-semibold text-xs text-slate-400 uppercase tracking-wider mb-3 mt-6 ml-1">
            Data & Backup
          </Text>
          
          <SettingItem 
            icon="cloud-sync-outline" 
            iconFamily="MaterialCommunityIcons"
            title="Cloud Sync" 
            subtitle="Sync your data with Firebase"
            onPress={() => showPlaceholder("Cloud Sync")}
          />
          
          <SettingItem 
            icon="database-export" 
            iconFamily="MaterialCommunityIcons"
            title="Backup Data" 
            subtitle="Export local data to storage"
            onPress={() => showPlaceholder("Backup")}
          />
          
          <SettingItem 
            icon="database-import" 
            iconFamily="MaterialCommunityIcons"
            title="Restore Data" 
            subtitle="Import data from a backup file"
            onPress={() => showPlaceholder("Restore")}
          />

          <Text className="font-poppins-semibold text-xs text-slate-400 uppercase tracking-wider mb-3 mt-6 ml-1">
            Account
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
      </SafeAreaView>
    </View>
  );
}
