import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Href, useRouter } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { HistoryItem } from '@/types/history';

interface HistoryItemCardProps {
  item: HistoryItem;
}

export function HistoryItemCard({ item }: HistoryItemCardProps) {
  const router = useRouter();

  // Determine colors and initials based on event type
  let avatarBg = 'bg-slate-100';
  let avatarIcon = 'activity';
  let avatarColor = '#64748B';

  if (item.eventType === 'payment') {
    avatarBg = 'bg-emerald-100';
    avatarIcon = 'Rs';
    avatarColor = '#10B981';
  } else if (item.eventType === 'contract_new' || item.eventType === 'contract_ended') {
    avatarBg = 'bg-blue-100';
    avatarIcon = 'file-text';
    avatarColor = '#3B82F6';
  } else if (item.eventType === 'tenant_added' || item.eventType === 'tenant_archived') {
    avatarBg = 'bg-purple-100';
    avatarIcon = 'user';
    avatarColor = '#9333EA';
  } else if (item.eventType === 'unit_added') {
    avatarBg = 'bg-amber-100';
    avatarIcon = 'home';
    avatarColor = '#F59E0B';
  }

  // Format date
  const dateObj = new Date(item.eventDate);
  const formattedDate = dateObj.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  }); // e.g., 18 Sep 2026

  // Subtitle
  const parts = [];
  if (item.unitName) parts.push(item.unitName);
  if (item.tenantName) parts.push(item.tenantName);
  const subtitle = parts.join(' · ');

  // Amount rendering
  let formattedAmount = null;
  if (item.amount !== null && item.amount !== undefined) {
    if (item.eventType === 'contract_new' || item.eventType === 'contract_ended') {
      formattedAmount = `LKR ${item.amount.toLocaleString()} / month`;
    } else {
      formattedAmount = `LKR ${item.amount.toLocaleString()}`;
    }
  }

  const handlePress = () => {
    // Navigate where appropriate
    if (item.eventType === 'payment' && item.extraInfo) {
      router.push(`/rent/${item.extraInfo}` as Href);
    } else if (item.eventType.startsWith('contract')) {
      router.push(`/contracts/${item.entityId}` as Href);
    } else if (item.eventType.startsWith('tenant')) {
      router.push(`/tenants/${item.entityId}` as Href);
    } else if (item.eventType.startsWith('unit')) {
      router.push(`/units/${item.entityId}` as Href);
    }
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.7} disabled={item.eventType === 'payment' && !item.extraInfo}>
      <Card className="mb-3 p-3.5 bg-surface border-0 rounded-2xl shadow-sm flex-row items-center justify-between">
        <View className="flex-row items-center flex-1">
          <View className={`w-11 h-11 rounded-full items-center justify-center mr-3 ${avatarBg}`}>
            {avatarIcon === 'Rs' ? (
              <Text style={{ color: avatarColor, fontFamily: 'Poppins_700Bold', fontSize: 16 }}>Rs</Text>
            ) : (
              <Feather name={avatarIcon as any} size={18} color={avatarColor} />
            )}
          </View>
          <View className="flex-1">
            <Text className="text-[#1E293B] font-poppins-semibold text-sm mb-0.5 uppercase" numberOfLines={1}>
              {item.eventLabel}
            </Text>
            {subtitle ? (
              <Text className="text-slate-400 font-poppins-medium text-xs" numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
          </View>
        </View>
        
        <View className="flex-row items-center">
          <View className="items-end mr-3">
            {formattedAmount ? (
              <Text className="text-[#1E293B] font-poppins-semibold text-[13px] mb-0.5">
                {formattedAmount}
              </Text>
            ) : null}
            
            {item.detail ? (
              <Text className="text-slate-500 font-poppins-medium text-[11px] mb-0.5 capitalize">
                {item.detail.replace('_', ' ')}
              </Text>
            ) : null}

            <Text className="text-slate-400 font-poppins-medium text-[10px]">
              {formattedDate}
            </Text>
          </View>
          <Feather name="chevron-right" size={16} color="#CBD5E1" />
        </View>
      </Card>
    </TouchableOpacity>
  );
}
