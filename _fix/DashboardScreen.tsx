import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, ScrollView, RefreshControl, TouchableOpacity, Animated, useColorScheme, Image
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { lightColors, darkColors, spacing } from '../constants/theme';
import { DashboardStackParamList } from '../navigation/types';
import { useAuth } from '../auth/AuthContext';
import { authApi } from '../api/client';
import Card from '../components/Card';
import Loading from '../components/Loading';
import QuickActionButton from '../components/QuickActionButton';
import { LOVE_NOTES } from '../constants';

type NavProp = NativeStackNavigationProp<DashboardStackParamList, 'DashboardHome'>;

function SectionDivider({ label, icon }: { label: string; icon: string }) {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingTop: spacing.md, marginBottom: spacing.sm }}>
      <View style={{ width: 24, height: 24, borderRadius: 12, backgroundColor: isDark ? 'rgba(212,168,83,0.15)' : 'rgba(244,63,94,0.1)', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 12 }}>{icon}</Text>
      </View>
      <Text style={{ fontSize: 10, fontWeight: '700', color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 1.5, opacity: 0.7 }}>{label}</Text>
      <View style={{ flex: 1, height: 1, backgroundColor: colors.border, opacity: 0.5 }} />
    </View>
  );
}

function StatPill({ emoji, label }: { emoji: string; label: string }) {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4, backgroundColor: isDark ? 'rgba(212,168,83,0.15)' : 'rgba(244,63,94,0.1)' }}>
      <Text style={{ fontSize: 11, fontWeight: '600', color: colors.foreground }}>{emoji} {label}</Text>
    </View>
  );
}

function PartnerOverviewWidget({ onPress }: { onPress: () => void }) {
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const [partner, setPartner] = useState<any>(null);
  const [loadingPartner, setLoadingPartner] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const data = await authApi.getPartnerOverview();
        if (data.linked && data.partner) {
          setPartner(data.partner);
        }
      } catch {} finally { setLoadingPartner(false); }
    })();
  }, []);

  if (loadingPartner || !partner) return null;

  const moodMap: Record<string, string> = { happy: '😊', stressed: '😰', tired: '😴', productive: '💪' };

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
      <Card variant="elevated" style={{ padding: spacing.md, borderTopWidth: 3, borderTopColor: isDark ? '#d4a853' : '#e85d75' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm }}>
          <View style={{ width: 44, height: 44, borderRadius: 22, overflow: 'hidden', backgroundColor: isDark ? '#d4a853' : '#e85d75', alignItems: 'center', justifyContent: 'center' }}>
            <Text style={{ fontSize: 18, fontWeight: '700', color: '#fff' }}>{partner.name?.charAt(0)?.toUpperCase() || 'P'}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>{partner.name}</Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground }}>Today's Update</Text>
          </View>
          <Text style={{ fontSize: 12, color: colors.mutedForeground }}>View →</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
          <View style={{ flex: 1, alignItems: 'center', backgroundColor: colors.muted, borderRadius: 10, padding: spacing.sm }}>
            <Text style={{ fontSize: 20 }}>{partner.today?.mood ? (moodMap[partner.today.mood.mood] || '🥰') : '—'}</Text>
            <Text style={{ fontSize: 9, color: colors.mutedForeground, marginTop: 2 }}>Mood</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#e0f2fe', borderRadius: 10, padding: spacing.sm }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#3b82f6' }}>💧</Text>
            <Text style={{ fontSize: 9, color: colors.mutedForeground, marginTop: 2 }}>{partner.today?.waterGlasses || 0}/8</Text>
          </View>
          <View style={{ flex: 1, alignItems: 'center', backgroundColor: isDark ? 'rgba(245,158,11,0.1)' : '#fff3e0', borderRadius: 10, padding: spacing.sm }}>
            <Text style={{ fontSize: 16, fontWeight: '600', color: '#f59e0b' }}>🍽️</Text>
            <Text style={{ fontSize: 9, color: colors.mutedForeground, marginTop: 2 }}>{partner.today?.meals?.length || 0} meals</Text>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );
}

export default function DashboardScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { user } = useAuth();
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [todaysNote] = useState(LOVE_NOTES[Math.floor(Math.random() * LOVE_NOTES.length)]);

  const fadeAnims = useRef([0, 1, 2, 3, 4, 5, 6].map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const animations = fadeAnims.map((anim, i) =>
      Animated.timing(anim, { toValue: 1, duration: 500, delay: i * 80, useNativeDriver: true })
    );
    Animated.stagger(80, animations).start();
    setTimeout(() => setLoading(false), 300);
  }, []);

  const loadData = useCallback(async () => {
    try { setLoading(false); } catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { loadData(); }, [loadData]));

  const onRefresh = async () => { setRefreshing(true); await loadData(); setRefreshing(false); };

  if (loading) return <Loading fullScreen message="Loading your dashboard..." />;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: colors.background, paddingTop: insets.top }}
      contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xxl + 60 }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
    >
      <Animated.View style={{ opacity: fadeAnims[0], transform: [{ translateY: fadeAnims[0].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <Card variant="elevated" style={{ marginBottom: spacing.md, overflow: 'hidden' }}>
          <View style={{ position: 'absolute', top: -40, right: -40, width: 160, height: 160, borderRadius: 80, backgroundColor: isDark ? 'rgba(212,168,83,0.08)' : 'rgba(244,63,94,0.06)' }} />
          <View style={{ position: 'absolute', bottom: -40, left: -40, width: 120, height: 120, borderRadius: 60, backgroundColor: isDark ? 'rgba(212,168,83,0.05)' : 'rgba(245,158,11,0.06)' }} />
          <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.xs }}>
                <Text style={{ fontSize: 22, fontWeight: '700', color: colors.foreground }}>My Bunny 🥰</Text>
              </View>
              <Text style={{ fontSize: 13, color: colors.mutedForeground, lineHeight: 18 }}>
                Your personal wellness companion. Check in your mood, track your water, and let's eat healthy & happy! 💕
              </Text>
            </View>
          </View>
          <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.sm }}>
            <StatPill emoji="❤️" label="Made with love" />
            <StatPill emoji="✨" label="Personalised" />
          </View>
        </Card>
      </Animated.View>

      <SectionDivider label="Daily Check-ins" icon="☀️" />
      <Animated.View style={{ opacity: fadeAnims[1], transform: [{ translateY: fadeAnims[1].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], flexDirection: 'row', gap: spacing.sm }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('Mood')} activeOpacity={0.7}>
          <Card variant="outlined" style={{ padding: spacing.md, minHeight: 100 }}>
            <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>😊</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>How are you feeling?</Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>Tap to check in</Text>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('Water')} activeOpacity={0.7}>
          <Card variant="outlined" style={{ padding: spacing.md, minHeight: 100, backgroundColor: isDark ? 'rgba(59,130,246,0.08)' : '#f0f9ff' }}>
            <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>💧</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Hydration</Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>Log your water</Text>
          </Card>
        </TouchableOpacity>
      </Animated.View>

      <SectionDivider label="Nutrition &amp; Growth" icon="🍽️" />
      <Animated.View style={{ opacity: fadeAnims[2], transform: [{ translateY: fadeAnims[2].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }], flexDirection: 'row', gap: spacing.sm }}>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('Meals')} activeOpacity={0.7}>
          <Card variant="outlined" style={{ padding: spacing.md, minHeight: 100, backgroundColor: isDark ? 'rgba(245,158,11,0.08)' : '#fff7ed' }}>
            <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>🍽️</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Meal Logger</Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>Log what you ate</Text>
          </Card>
        </TouchableOpacity>
        <TouchableOpacity style={{ flex: 1 }} onPress={() => { try { (navigation as any).navigate('LovePlant'); } catch {} }} activeOpacity={0.7}>
          <Card variant="outlined" style={{ padding: spacing.md, minHeight: 100, backgroundColor: isDark ? 'rgba(34,197,94,0.08)' : '#f0fdf4' }}>
            <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>🌱</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Love Plant</Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>Grow together</Text>
          </Card>
        </TouchableOpacity>
      </Animated.View>

      <SectionDivider label="Together" icon="💕" />
      <Animated.View style={{ opacity: fadeAnims[3], transform: [{ translateY: fadeAnims[3].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <PartnerOverviewWidget onPress={() => navigation.navigate('PartnerProfile')} />
      </Animated.View>

      <SectionDivider label="Romance" icon="💌" />
      <Animated.View style={{ opacity: fadeAnims[4], transform: [{ translateY: fadeAnims[4].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <Card variant="outlined" style={{ padding: spacing.md, backgroundColor: isDark ? 'rgba(212,168,83,0.05)' : '#fdf2f8', borderColor: isDark ? 'rgba(212,168,83,0.2)' : '#fbcfe8' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.sm }}>
            <Text style={{ fontSize: 20 }}>💌</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#d4a853' : '#e85d75' }}>Today's Love Note</Text>
          </View>
          <Text style={{ fontSize: 13, color: colors.foreground, fontStyle: 'italic', lineHeight: 20, opacity: 0.85 }}>"{todaysNote}"</Text>
        </Card>
        <View style={{ flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs }}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('Memories')} activeOpacity={0.7}>
            <Card variant="outlined" style={{ padding: spacing.md, alignItems: 'center', backgroundColor: isDark ? 'rgba(244,63,94,0.08)' : '#fef2f2' }}>
              <Text style={{ fontSize: 24 }}>📸</Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>Memories</Text>
            </Card>
          </TouchableOpacity>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => navigation.navigate('SecretNotes')} activeOpacity={0.7}>
            <Card variant="outlined" style={{ padding: spacing.md, alignItems: 'center', backgroundColor: isDark ? 'rgba(168,85,247,0.08)' : '#faf5ff' }}>
              <Text style={{ fontSize: 24 }}>🤫</Text>
              <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>Secret Notes</Text>
            </Card>
          </TouchableOpacity>
        </View>
      </Animated.View>

      <SectionDivider label="Progress" icon="📊" />
      <Animated.View style={{ opacity: fadeAnims[5], transform: [{ translateY: fadeAnims[5].interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) }] }}>
        <TouchableOpacity onPress={() => navigation.navigate('WeeklySummary')} activeOpacity={0.7}>
          <Card variant="outlined" style={{ padding: spacing.md, backgroundColor: isDark ? 'rgba(34,197,94,0.08)' : '#f0fdf4' }}>
            <Text style={{ fontSize: 28, marginBottom: spacing.xs }}>📊</Text>
            <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Weekly Summary</Text>
            <Text style={{ fontSize: 11, color: colors.mutedForeground, marginTop: 2 }}>View your week's progress</Text>
          </Card>
        </TouchableOpacity>
      </Animated.View>

      <SectionDivider label="Quick Actions" icon="⚡" />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
        {[
          { emoji: '💧', label: 'Water', screen: 'Water' as const },
          { emoji: '🍽️', label: 'Meals', screen: 'Meals' as const },
          { emoji: '😊', label: 'Mood', screen: 'Mood' as const },
          { emoji: '🤫', label: 'Secret', screen: 'SecretNotes' as const },
          { emoji: '💌', label: 'Love Notes', screen: 'LoveNotes' as const },
          { emoji: '📸', label: 'Memories', screen: 'Memories' as const },
        ].map((action) => (
          <QuickActionButton key={action.label} emoji={action.emoji} label={action.label} onPress={() => navigation.navigate(action.screen)} />
        ))}
      </View>
      <View style={{ height: 80 }} />
    </ScrollView>
  );
}
