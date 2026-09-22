import React, { useState, useCallback, useMemo } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSQLiteContext } from 'expo-sqlite';
import { useFocusEffect } from 'expo-router';
import { typography, colors } from '@/constants/theme';
import { Feather } from '@expo/vector-icons';
import { HistoryItem } from '@/types/history';
import { getHistoryEvents, HistoryCategory } from '@/lib/repositories/history';
import { HistoryItemCard } from '@/components/history/HistoryItemCard';

const FILTERS: HistoryCategory[] = ['All', 'Contracts', 'Payments', 'Tenants', 'Units'];
const PAGE_SIZE = 50;

export default function History() {
  const db = useSQLiteContext();
  
  // Set to 1st day of current month
  const [currentMonthDate, setCurrentMonthDate] = useState(() => {
    const d = new Date();
    d.setDate(1);
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);
  const [filter, setFilter] = useState<HistoryCategory>('All');
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0); // 0-indexed
  const [hasMore, setHasMore] = useState(true);

  const goToPreviousMonth = () => {
    const newDate = new Date(currentMonthDate);
    newDate.setMonth(newDate.getMonth() - 1);
    setCurrentMonthDate(newDate);
    setPage(0);
  };

  const goToNextMonth = () => {
    const newDate = new Date(currentMonthDate);
    newDate.setMonth(newDate.getMonth() + 1);
    setCurrentMonthDate(newDate);
    setPage(0);
  };

  const handleFilterChange = (newFilter: HistoryCategory) => {
    if (newFilter !== filter) {
      setFilter(newFilter);
      setPage(0);
    }
  };

  const loadData = useCallback(async (isLoadMore = false) => {
    try {
      if (isLoadMore) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }
      setError(null);

      // Start and end dates for the currently selected month
      const startD = new Date(currentMonthDate);
      const endD = new Date(currentMonthDate);
      endD.setMonth(endD.getMonth() + 1);

      // Local YYYY-MM-DD
      const formatLocalDate = (d: Date) => {
        const yr = d.getFullYear();
        const mo = String(d.getMonth() + 1).padStart(2, '0');
        const da = String(d.getDate()).padStart(2, '0');
        return `${yr}-${mo}-${da}`;
      };

      const startDateStr = formatLocalDate(startD);
      const endDateStr = formatLocalDate(endD);
      const offset = page * PAGE_SIZE;

      const data = await getHistoryEvents({
        db,
        startDate: startDateStr,
        endDate: endDateStr,
        category: filter,
        limit: PAGE_SIZE,
        offset
      });

      if (isLoadMore) {
        setHistoryItems(prev => [...prev, ...data]);
      } else {
        setHistoryItems(data);
      }
      
      setHasMore(data.length === PAGE_SIZE);
    } catch (e) {
      console.error(e);
      setError('Unable to load history.');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [db, currentMonthDate, filter, page]);

  useFocusEffect(
    useCallback(() => {
      loadData(page > 0);
    }, [loadData, page])
  );

  const monthYearStr = useMemo(() => {
    return currentMonthDate.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
  }, [currentMonthDate]);

  // Group by relative time (Today, Yesterday, Month Year)
  const groupedItems = useMemo(() => {
    const groups: { title: string; items: HistoryItem[] }[] = [];
    
    if (historyItems.length === 0) return groups;

    const todayStr = new Date().toLocaleDateString('en-CA');
    const yesterdayDate = new Date();
    yesterdayDate.setDate(yesterdayDate.getDate() - 1);
    const yesterdayStr = yesterdayDate.toLocaleDateString('en-CA');

    let currentGroupTitle = '';
    let currentGroupItems: HistoryItem[] = [];

    historyItems.forEach(item => {
      const itemDateObj = new Date(item.eventDate);
      const itemDateStr = itemDateObj.toLocaleDateString('en-CA');
      let groupTitle = '';

      if (itemDateStr === todayStr) {
        groupTitle = 'Today';
      } else if (itemDateStr === yesterdayStr) {
        groupTitle = 'Yesterday';
      } else {
        groupTitle = itemDateObj.toLocaleDateString('en-GB', { month: 'long', year: 'numeric' });
      }

      if (groupTitle !== currentGroupTitle) {
        if (currentGroupItems.length > 0) {
          groups.push({ title: currentGroupTitle, items: currentGroupItems });
        }
        currentGroupTitle = groupTitle;
        currentGroupItems = [item];
      } else {
        currentGroupItems.push(item);
      }
    });

    if (currentGroupItems.length > 0) {
      groups.push({ title: currentGroupTitle, items: currentGroupItems });
    }

    return groups;
  }, [historyItems]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['top']}>
      <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 140 }}>
        
        <View className="mb-6 flex-row items-center justify-between">
          <View>
            <Text className="text-slate-500 font-poppins-bold text-[10px] tracking-widest uppercase mb-0.5">Neon Rent Manager</Text>
            <Text className="text-[#1E293B] font-poppins-bold text-3xl leading-tight">History</Text>
            <Text className="text-slate-500 font-poppins-medium text-xs mt-0.5">Rental activity & records</Text>
          </View>
        </View>

        {/* Month Selector */}
        <View className="flex-row items-center justify-between bg-white rounded-2xl p-2 mb-4 border border-slate-100 shadow-sm">
          <TouchableOpacity onPress={goToPreviousMonth} className="p-3 bg-slate-50 rounded-xl">
            <Feather name="chevron-left" size={20} color="#475569" />
          </TouchableOpacity>
          <Text className="font-poppins-semibold text-[#1E293B] text-[15px]">
            {monthYearStr}
          </Text>
          <TouchableOpacity onPress={goToNextMonth} className="p-3 bg-slate-50 rounded-xl">
            <Feather name="chevron-right" size={20} color="#475569" />
          </TouchableOpacity>
        </View>

        {/* Filters */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} className="mb-6">
          {FILTERS.map(f => (
            <TouchableOpacity 
              key={f}
              onPress={() => handleFilterChange(f)}
              className={`px-4 py-1.5 rounded-full border mr-2 ${filter === f ? 'bg-[#1E293B] border-[#1E293B]' : 'bg-white border-slate-200'}`}
            >
              <Text className={`font-poppins-medium text-xs ${filter === f ? 'text-white' : 'text-slate-600'}`}>
                {f}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading && page === 0 ? (
          <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
        ) : error && page === 0 ? (
          <View className="items-center justify-center py-12 px-6 bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
            <View className="w-16 h-16 bg-red-50 rounded-full items-center justify-center mb-4">
              <Feather name="alert-circle" size={24} color={colors.error} />
            </View>
            <Text className="font-poppins-semibold text-lg text-[#1E293B] text-center mb-2">Error</Text>
            <Text className="font-poppins-regular text-sm text-slate-500 text-center mb-6">
              {error}
            </Text>
            <TouchableOpacity 
              onPress={() => loadData(false)}
              className="px-6 py-3 bg-[#1E293B] rounded-xl"
            >
              <Text className="font-poppins-semibold text-white">Retry</Text>
            </TouchableOpacity>
          </View>
        ) : historyItems.length === 0 ? (
          <View className="items-center justify-center py-12 px-6 bg-white rounded-3xl border border-slate-100 shadow-sm mt-4">
            <View className="w-16 h-16 bg-slate-50 rounded-full items-center justify-center mb-4">
              <Feather name="clock" size={24} color="#94A3B8" />
            </View>
            <Text className="font-poppins-semibold text-lg text-[#1E293B] text-center mb-2">
              No activity in {monthYearStr}
            </Text>
            <Text className="font-poppins-regular text-sm text-slate-500 text-center">
              {filter === 'All' 
                ? 'There are no historical records for this month.'
                : `There are no ${filter.toLowerCase()} records for this month.`}
            </Text>
          </View>
        ) : (
          <View>
            {groupedItems.map(group => (
              <View key={group.title} className="mb-4">
                <Text className={`${typography.h3} text-[#1E293B] mb-3 mt-1`}>{group.title}</Text>
                {group.items.map(item => (
                  <HistoryItemCard key={item.id} item={item} />
                ))}
              </View>
            ))}

            {hasMore && (
              <TouchableOpacity 
                className="items-center justify-center py-3.5 bg-slate-100 rounded-xl mt-4 mb-8"
                onPress={() => setPage(p => p + 1)}
                disabled={loadingMore}
              >
                {loadingMore ? (
                  <ActivityIndicator size="small" color="#64748B" />
                ) : (
                  <Text className="font-poppins-semibold text-[#475569] text-[13px]">
                    Load More
                  </Text>
                )}
              </TouchableOpacity>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}
