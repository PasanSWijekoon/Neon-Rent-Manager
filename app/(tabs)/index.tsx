import React, { useEffect, useState, useCallback } from 'react';
import { ScrollView, View, Text, TouchableOpacity, ActivityIndicator, StyleSheet, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Feather, MaterialCommunityIcons } from '@expo/vector-icons';
import { useFocusEffect, router } from 'expo-router';
import Animated, { 
  FadeIn, 
  FadeOut, 
  SlideOutUp, 
  useSharedValue, 
  useAnimatedStyle, 
  withSpring, 
  withTiming 
} from 'react-native-reanimated';
import { Card } from '@/components/ui/Card';
import { StatusBadge, BadgeStatus } from '@/components/ui/StatusBadge';
import { typography, colors } from '@/constants/theme';
import { AppLogo } from '@/components/ui/AppLogo';
import { useAuthStore } from '@/store/authStore';
import { useDashboard } from '@/hooks/useDashboard';

const { height, width } = Dimensions.get('window');

function formatLKR(amount: number) {
  return amount.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
}

function getMonthName(monthNumber: number) {
  const date = new Date();
  date.setMonth(monthNumber - 1);
  return date.toLocaleString('default', { month: 'long' });
}

function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function RocketTransitionOverlay({ onComplete }: { onComplete: () => void }) {
  const [phase, setPhase] = useState<'loading' | 'ready' | 'flying'>('loading');
  const rocketY = useSharedValue(200); // Start below the screen
  const rocketScale = useSharedValue(0.5);

  useEffect(() => {
    // 1. Loading phase (wait 1.2 seconds to simulate data loading)
    const t1 = setTimeout(() => {
      setPhase('ready');
      rocketY.value = withSpring(0, { damping: 12, stiffness: 90 });
      rocketScale.value = withSpring(1);
    }, 1200);

    // 2. Flying phase
    const t2 = setTimeout(() => {
      setPhase('flying');
      rocketY.value = withTiming(-height, { duration: 800 });
    }, 2500);

    // 3. Complete (overlay slides up)
    const t3 = setTimeout(() => {
      onComplete();
    }, 3200);

    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); };
  }, []);

  const animatedRocketStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: rocketY.value },
      { scale: rocketScale.value }
    ]
  }));

  return (
    <Animated.View 
      entering={FadeIn.duration(300)}
      exiting={SlideOutUp.duration(600).springify()}
      style={[
        StyleSheet.absoluteFill, 
        { backgroundColor: colors.primary, zIndex: 1000, justifyContent: 'center', alignItems: 'center' }
      ]}
    >
      {phase === 'loading' && (
        <Animated.View entering={FadeIn} exiting={FadeOut} style={{ alignItems: 'center' }}>
          <ActivityIndicator size="large" color="#FFFFFF" style={{ marginBottom: 24 }} />
          <Text className="font-poppins-medium text-white text-lg">Generating Dashboard...</Text>
          <Text className="font-poppins-regular text-blue-200 text-sm mt-2">Syncing your properties</Text>
        </Animated.View>
      )}

      {(phase === 'ready' || phase === 'flying') && (
        <Animated.View style={[{ alignItems: 'center', justifyContent: 'center' }, animatedRocketStyle]}>
          <Text style={{ fontSize: 80, marginBottom: 16, textAlign: 'center' }}>🚀</Text>
          <Animated.Text entering={FadeIn} className="font-poppins-bold text-white text-2xl text-center">
            Ready to Go!
          </Animated.Text>
        </Animated.View>
      )}
    </Animated.View>
  );
}

export default function Home() {
  const { isNewLogin, setIsNewLogin } = useAuthStore();
  const [showOverlay, setShowOverlay] = useState(isNewLogin);

  const today = new Date();
  const currentYear = today.getFullYear();
  const currentMonth = today.getMonth() + 1; // 1-indexed

  const {
    totalCollected,
    expectedRent,
    outstandingRent,
    paidCount,
    dueCount,
    overdueCount,
    collectionProgress,
    monthOverMonthChange,
    thisMonthDue,
    recentPayments,
    refresh
  } = useDashboard(currentYear, currentMonth);

  useFocusEffect(
    useCallback(() => {
      refresh();
    }, [refresh])
  );

  const handleOverlayComplete = () => {
    setShowOverlay(false);
    setIsNewLogin(false); // Reset global flag so it doesn't happen on normal navigation
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.background }}>
      {showOverlay && <RocketTransitionOverlay onComplete={handleOverlayComplete} />}
      
      <SafeAreaView style={{ flex: 1 }} edges={['top']}>
        <ScrollView className="flex-1 px-4 pt-6" contentContainerStyle={{ paddingBottom: 140 }} showsVerticalScrollIndicator={false}>
        
        {/* Header */}
        <View className="flex-row items-center justify-between mb-6">
          <View className="flex-1">
            <Text className={`${typography.caption} text-text-secondary uppercase tracking-widest font-poppins-semibold`}>
              Neon Rent Manager
            </Text>
            <Text className="text-[22px] font-poppins-bold text-text-primary mt-1" numberOfLines={1} adjustsFontSizeToFit>
              {getGreeting()}, Admin
            </Text>
            <Text className={`${typography.bodyM} text-text-secondary mt-1`}>
              Here's your rental overview for
            </Text>
            <Text className="text-primary font-poppins-semibold text-[15px] mt-0.5">
              {getMonthName(currentMonth)} {currentYear}
            </Text>
          </View>
          <View className="flex-row items-center ml-4">
            <TouchableOpacity 
              onPress={() => router.push('/settings')}
              style={{
                shadowColor: '#1E40AF',
                shadowOpacity: 0.25,
                shadowRadius: 8,
                shadowOffset: { width: 0, height: 4 },
                elevation: 4
              }}
            >
              <LinearGradient
                colors={['#1E40AF', '#2563EB']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{ padding: 12, borderRadius: 14 }}
              >
                <Feather name="menu" size={24} color="#FFFFFF" />
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>

        {/* Hero Card */}
        <View 
          style={{
            marginBottom: 24,
            elevation: 12,
            shadowColor: '#0F172A',
            shadowOpacity: 0.3,
            shadowRadius: 15,
            shadowOffset: { width: 0, height: 8 },
            borderRadius: 24,
          }}
        >
          <LinearGradient
            colors={['#0B132B', '#1E40AF', '#2563EB']}
            start={{ x: 0, y: 0.2 }}
            end={{ x: 1, y: 1 }}
            style={{
              borderRadius: 24,
              padding: 20, // Reduced from 24
              overflow: 'hidden',
            }}
          >
            {/* Decorative Background Shapes for Depth */}
            <View style={{ position: 'absolute', top: -40, right: -20, width: 140, height: 140, borderRadius: 70, backgroundColor: 'rgba(255,255,255,0.08)' }} />
            <View style={{ position: 'absolute', bottom: -60, right: -30, width: 200, height: 200, borderRadius: 100, backgroundColor: 'rgba(96, 165, 250, 0.25)' }} />

            <View className="flex-row justify-between items-start mb-5 relative z-10">
              <View className="flex-row items-center">
                <View className="w-10 h-10 bg-[#1E3A8A] rounded-full items-center justify-center mr-3 shadow-sm">
                  <MaterialCommunityIcons name="database" size={20} color="#FFFFFF" />
                </View>
                <View>
                  <Text className="text-white/80 font-poppins-medium text-xs mb-0.5">Total Collected</Text>
                  <Text className="text-white font-poppins-bold text-2xl" style={{ textShadowColor: 'rgba(0,0,0,0.2)', textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 4 }}>
                    LKR {formatLKR(totalCollected)}
                  </Text>
                </View>
              </View>
              <TouchableOpacity className="bg-[#1E3A8A]/80 rounded-lg px-2.5 py-1.5 flex-row items-center border border-white/10 mt-1">
                <Feather name="calendar" size={12} color="#FFFFFF" />
                <Text className="text-white font-poppins-medium text-[10px] ml-1.5 mr-1">{getMonthName(currentMonth).substring(0,3)} {currentYear}</Text>
                <Feather name="chevron-down" size={12} color="#FFFFFF" />
              </TouchableOpacity>
            </View>
            
            <View className="relative z-10">
              <View className="flex-row justify-between mb-2.5 items-end">
                <View className="flex-1 h-2.5 bg-[#1E3A8A] rounded-full overflow-hidden mr-4 mb-1">
                  <LinearGradient
                    colors={['#60A5FA', '#3B82F6', '#2563EB']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={{ width: `${Math.min(collectionProgress, 100)}%`, height: '100%', borderRadius: 12 }}
                  />
                </View>
                <View className="items-center">
                  <Text className="text-white font-poppins-bold text-xs leading-tight">{collectionProgress.toFixed(1)}%</Text>
                  <Text className="text-white/70 font-poppins text-[8px] leading-tight">collected</Text>
                </View>
              </View>
              
              <View className="flex-row items-center">
                <View className={`w-5 h-5 rounded-full ${monthOverMonthChange >= 0 ? 'bg-[#064E3B]' : 'bg-[#7F1D1D]'} items-center justify-center mr-2`}>
                  <Feather name={monthOverMonthChange >= 0 ? "arrow-up" : "arrow-down"} size={12} color={monthOverMonthChange >= 0 ? "#34D399" : "#F87171"} />
                </View>
                <Text className="text-white/80 text-[10px] font-poppins">
                  <Text className={`${monthOverMonthChange >= 0 ? 'text-[#34D399]' : 'text-[#F87171]'} font-poppins-semibold`}>
                    {monthOverMonthChange >= 0 ? '+' : ''}{monthOverMonthChange.toFixed(0)}%
                  </Text> from last month
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>

        {/* Financial Summary */}
        <View className="flex-row justify-between mb-6">
          <Card className="flex-1 mr-2 bg-surface border-0 rounded-2xl p-3.5 shadow-sm flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-primary/10 items-center justify-center mr-3">
              <Feather name="bar-chart-2" size={16} color={colors.primary} />
            </View>
            <View className="flex-1">
              <Text className="text-text-secondary font-poppins-medium text-[10px]">Expected</Text>
              <Text className="text-text-primary font-poppins-semibold text-[13px]" numberOfLines={1} adjustsFontSizeToFit>LKR {formatLKR(expectedRent)}</Text>
            </View>
          </Card>
          
          <Card className="flex-1 ml-2 bg-surface border-0 rounded-2xl p-3.5 shadow-sm flex-row items-center">
            <View className="w-9 h-9 rounded-full bg-error/10 items-center justify-center mr-3">
              <Feather name="pie-chart" size={16} color={colors.error} />
            </View>
            <View className="flex-1">
              <Text className="text-text-secondary font-poppins-medium text-[10px]">Outstanding</Text>
              <Text className="text-text-primary font-poppins-semibold text-[13px]" numberOfLines={1} adjustsFontSizeToFit>LKR {formatLKR(outstandingRent)}</Text>
            </View>
          </Card>
        </View>

        {/* Payment Status */}
        <View className="mb-4 flex-row justify-between items-center">
          <Text className={`${typography.h2} text-text-primary font-poppins-bold`}>Payment Status</Text>
          <TouchableOpacity onPress={() => router.push('/(tabs)/payments')}>
            <Text className="text-primary font-poppins-semibold text-xs">View All &gt;</Text>
          </TouchableOpacity>
        </View>

        <View className="flex-row justify-between mb-8">
          <Card className="flex-1 p-2.5 bg-surface border-0 rounded-2xl shadow-sm mr-1.5 flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-success items-center justify-center mr-2 shadow-sm shadow-success/30">
              <Feather name="check" size={14} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="text-text-primary font-poppins-semibold text-xl leading-tight">{paidCount}</Text>
              <Text className="text-text-secondary font-poppins text-xs leading-tight">Paid</Text>
            </View>
          </Card>
          
          <Card className="flex-1 p-2.5 bg-surface border-0 rounded-2xl shadow-sm mx-1.5 flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-warning items-center justify-center mr-2 shadow-sm shadow-warning/30">
              <Feather name="clock" size={14} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="text-text-primary font-poppins-semibold text-xl leading-tight">{dueCount}</Text>
              <Text className="text-text-secondary font-poppins text-xs leading-tight">Due</Text>
            </View>
          </Card>

          <Card className="flex-1 p-2.5 bg-surface border-0 rounded-2xl shadow-sm ml-1.5 flex-row items-center">
            <View className="w-8 h-8 rounded-full bg-error items-center justify-center mr-2 shadow-sm shadow-error/30">
              <Feather name="alert-circle" size={14} color="#FFF" />
            </View>
            <View className="flex-1">
              <Text className="text-text-primary font-poppins-semibold text-xl leading-tight">{overdueCount}</Text>
              <Text className="text-text-secondary font-poppins text-xs leading-tight" numberOfLines={1} adjustsFontSizeToFit>Overdue</Text>
            </View>
          </Card>
        </View>

        {/* This Month's Due */}
        <View className="mb-4 flex-row justify-between items-center">
          <Text className={`${typography.h2} text-[#1E293B] font-poppins-bold`}>This Month&apos;s Due & Overdue</Text>
        </View>
        
        {thisMonthDue.length === 0 ? (
          <Text className="font-poppins-regular text-sm text-slate-500 mb-6 text-center mt-2">No pending payments.</Text>
        ) : (
          thisMonthDue.map((item) => (
            <TouchableOpacity key={item.id} onPress={() => router.push(`/rent/${item.id}`)} activeOpacity={0.7}>
              <Card className="mb-3 p-3.5 bg-surface border-0 rounded-2xl shadow-sm flex-row items-center justify-between">
                <View className="flex-row items-center flex-1">
                  <View className="w-11 h-11 rounded-full items-center justify-center mr-3 bg-blue-100">
                    <Text className="text-blue-600 font-poppins-bold text-sm">
                      {item.tenantName.substring(0, 2).toUpperCase()}
                    </Text>
                  </View>
                  <View>
                    <Text className="text-[#1E293B] font-poppins-semibold text-sm mb-0.5">{item.tenantName}</Text>
                    <Text className="text-slate-400 font-poppins-medium text-xs">{item.unitName}</Text>
                  </View>
                </View>
                <View className="flex-row items-center">
                  <View className="items-end mr-3">
                    <Text className="text-[#1E293B] font-poppins-semibold text-[13px] mb-1.5">LKR {formatLKR(item.amountDue)}</Text>
                    <View className={`rounded-full px-2 py-0.5 flex-row items-center ${item.status === 'overdue' ? 'bg-[#FEE2E2]' : 'bg-[#FEF3C7]'}`}>
                      <MaterialCommunityIcons name={item.status === 'overdue' ? 'alert-circle-outline' : 'clock-outline'} size={10} color={item.status === 'overdue' ? '#DC2626' : '#D97706'} style={{ marginRight: 2 }} />
                      <Text className={`font-poppins-semibold text-[8px] uppercase ${item.status === 'overdue' ? 'text-[#DC2626]' : 'text-[#D97706]'}`}>
                        {item.status === 'overdue' ? 'OVERDUE' : 'DUE'}
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={16} color="#CBD5E1" />
                </View>
              </Card>
            </TouchableOpacity>
          ))
        )}

        {/* Recent Payments */}
        <View className="mb-4 mt-2 flex-row justify-between items-center">
          <Text className={`${typography.h2} text-[#1E293B] font-poppins-bold`}>Recent Payments</Text>
        </View>
        
        {recentPayments.length === 0 ? (
          <Text className="font-poppins-regular text-sm text-slate-500 mb-6 text-center mt-2">No recent payments to display.</Text>
        ) : (
          recentPayments.map((item) => {
            const dateStr = new Date(item.paymentDate).toLocaleDateString();
            return (
              <TouchableOpacity key={item.id} onPress={() => router.push(`/rent/${item.rentPeriodId}`)} activeOpacity={0.7}>
                <Card className="mb-3 p-3.5 bg-surface border-0 rounded-2xl shadow-sm flex-row items-center justify-between">
                  <View className="flex-row items-center flex-1">
                    <View className="w-11 h-11 rounded-full items-center justify-center mr-3 bg-emerald-100">
                      <Text className="text-emerald-600 font-poppins-bold text-sm">
                        {item.tenantName.substring(0, 2).toUpperCase()}
                      </Text>
                    </View>
                    <View>
                      <Text className="text-[#1E293B] font-poppins-semibold text-sm mb-0.5">{item.tenantName}</Text>
                      <Text className="text-slate-400 font-poppins-medium text-xs">{item.unitName}</Text>
                    </View>
                  </View>
                  <View className="flex-row items-center">
                    <View className="items-end mr-3">
                      <Text className="text-[#1E293B] font-poppins-semibold text-[13px] mb-0.5">LKR {formatLKR(item.amount)}</Text>
                      <Text className="text-slate-400 font-poppins-medium text-[10px]">{dateStr}</Text>
                    </View>
                    <Feather name="chevron-right" size={16} color="#CBD5E1" />
                  </View>
                </Card>
              </TouchableOpacity>
            );
          })
        )}

      </ScrollView>
    </SafeAreaView>
    </View>
  );
}




