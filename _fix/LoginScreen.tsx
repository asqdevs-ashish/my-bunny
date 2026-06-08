import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity, Alert, Animated, useColorScheme, ScrollView, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useAuth } from '../auth/AuthContext';
import { lightColors, darkColors, spacing } from '../constants/theme';
import { useGoogleAuth } from '../hooks/useGoogleAuth';

export default function LoginScreen() {
  const { login, setUser } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleGoogleSuccess = async (userData: any) => {
    await setUser(userData);
  };

  const { signInWithGoogle, loading: googleLoading, error: googleError, clearError: clearGoogleError } = useGoogleAuth(handleGoogleSuccess);

  const floatAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -10, duration: 3000, useNativeDriver: true }),
      Animated.timing(floatAnim, { toValue: 0, duration: 3000, useNativeDriver: true }),
    ])).start();
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Error', 'Please enter email and password');
      return;
    }
    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (error: any) {
      const msg = error?.message || '';
      if (msg.includes('401') || msg.includes('Invalid')) {
        Alert.alert('Login Failed', 'Invalid email or password. Please try again!');
      } else if (msg.includes('Network request failed')) {
        Alert.alert('Connection Error', 'Cannot reach server.');
      } else {
        Alert.alert('Login Failed', 'Something went wrong.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: insets.top, paddingBottom: insets.bottom + 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
          <Animated.View style={{ position: 'absolute', top: -80, right: -60, width: 300, height: 300, borderRadius: 150, backgroundColor: isDark ? 'rgba(212, 168, 83, 0.06)' : 'rgba(244, 63, 94, 0.12)', transform: [{ translateY: floatAnim }] }} />
          <Animated.View style={{ position: 'absolute', bottom: -100, left: -60, width: 250, height: 250, borderRadius: 125, backgroundColor: isDark ? 'rgba(244, 63, 94, 0.05)' : 'rgba(245, 158, 11, 0.10)' }} />
        </View>
        <Animated.View style={{ paddingHorizontal: spacing.lg, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={{ backgroundColor: isDark ? 'rgba(26, 26, 46, 0.85)' : 'rgba(255, 255, 255, 0.85)', borderRadius: 24, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, shadowColor: isDark ? '#d4a853' : '#f43f5e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.15 : 0.2, shadowRadius: 32, elevation: 12 }}>
            <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
              <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: isDark ? '#d4a853' : '#e85d75', alignItems: 'center', justifyContent: 'center', shadowColor: isDark ? '#d4a853' : '#e85d75', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.35, shadowRadius: 16, elevation: 10 }}>
                  <Text style={{ fontSize: 32 }}>❤️</Text>
                </View>
              </Animated.View>
            </View>
            <Text style={{ fontSize: 28, fontWeight: '700', textAlign: 'center', color: isDark ? '#d4a853' : '#e85d75', marginBottom: spacing.xs }}>Welcome Back</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.xl }}>
              <Text style={{ fontSize: 14, color: colors.mutedForeground }}>Sign in to </Text>
              <Text style={{ fontSize: 15, fontWeight: '600', color: isDark ? '#d4a853' : '#e85d75' }}>My Bunny</Text>
              <Text style={{ fontSize: 14, color: colors.mutedForeground }}> ✨</Text>
            </View>

            <TouchableOpacity style={[{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: isDark ? 'rgba(255,255,255,0.08)' : colors.card, borderWidth: 2, borderColor: colors.border, borderRadius: 12, paddingVertical: spacing.md, marginBottom: spacing.md }, googleLoading && { opacity: 0.7 }]} onPress={() => { clearGoogleError(); signInWithGoogle(); }} disabled={googleLoading} activeOpacity={0.7}>
              {googleLoading ? (
                <ActivityIndicator size="small" color={colors.primary} style={{ marginRight: 8 }} />
              ) : (
                <Text style={{ fontSize: 15, fontWeight: '600', color: colors.foreground }}>Continue with Google</Text>
              )}
            </TouchableOpacity>

            {googleError ? (
              <View style={{ backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : '#fef2f2', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: isDark ? 'rgba(244,63,94,0.2)' : '#fecaca', marginBottom: spacing.md }}>
                <Text style={{ fontSize: 13, color: '#ef4444', textAlign: 'center' }}>{googleError}</Text>
              </View>
            ) : null}

            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg }}>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
              <Text style={{ marginHorizontal: spacing.md, fontSize: 11, color: colors.mutedForeground, textTransform: 'uppercase', letterSpacing: 0.5 }}>Or continue with email</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: colors.border }} />
            </View>

            <View style={{ gap: spacing.md }}>
              <View style={{ gap: spacing.xs }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground, marginLeft: 4 }}>Email</Text>
                <TextInput style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: isDark ? 'rgba(212,168,83,0.3)' : '#fbcfe8', borderRadius: 12, padding: spacing.md, fontSize: 16, color: colors.foreground }} placeholder="your@email.com" placeholderTextColor={colors.mutedForeground} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
              </View>
              <View style={{ gap: spacing.xs }}>
                <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground, marginLeft: 4 }}>Password</Text>
                <TextInput style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: isDark ? 'rgba(212,168,83,0.3)' : '#fbcfe8', borderRadius: 12, padding: spacing.md, fontSize: 16, color: colors.foreground }} placeholder="......" placeholderTextColor={colors.mutedForeground} value={password} onChangeText={setPassword} secureTextEntry />
              </View>

              <TouchableOpacity style={[{ marginTop: spacing.sm, backgroundColor: isDark ? '#d4a853' : '#e85d75', borderRadius: 12, paddingVertical: spacing.md + 2, alignItems: 'center', shadowColor: isDark ? '#d4a853' : '#e85d75', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6, flexDirection: 'row', justifyContent: 'center' }, loading && { opacity: 0.7 }]} onPress={handleLogin} disabled={loading} activeOpacity={0.8}>
                {loading ? (
                  <ActivityIndicator color={isDark ? '#121212' : '#ffffff'} size="small" />
                ) : (
                  <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#121212' : '#ffffff' }}>Sign In</Text>
                )}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={{ alignItems: 'center', marginTop: spacing.xl }} onPress={() => navigation.navigate('Register')} activeOpacity={0.7}>
              <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Don't have an account? <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#d4a853' : '#e85d75' }}>Create one →</Text></Text>
            </TouchableOpacity>
          </View>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.xl, opacity: 0.5 }}>Made with ❤️ just for you</Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
