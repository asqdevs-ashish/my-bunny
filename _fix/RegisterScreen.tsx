import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, TextInput, KeyboardAvoidingView, Platform, TouchableOpacity,
  Animated, useColorScheme, ScrollView, ActivityIndicator, Image,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { lightColors, darkColors, spacing } from '../constants/theme';
import { API_URL } from '../constants';
import { useAuth } from '../auth/AuthContext';

type Step = 'details' | 'avatar' | 'otp';

export default function RegisterScreen() {
  const { login } = useAuth();
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const isDark = useColorScheme() === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const [step, setStep] = useState<Step>('details');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const otpRefs = useRef<(TextInput | null)[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

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

  const stepNumber = step === 'details' ? 1 : step === 'avatar' ? 2 : 3;

  const handleDetailsSubmit = () => {
    setError('');
    if (!name.trim() || !email.trim() || password.length < 6) {
      setError('Please fill all fields correctly. Password must be at least 6 characters.');
      return;
    }
    setStep('avatar');
  };

  const handleSendOTP = async () => {
    setError('');
    setOtpSending(true);
    try {
      const res = await fetch(`${API_URL}/api/otp/send`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Failed to send verification code');
        setOtpSending(false);
        return;
      }
      setStep('otp');
      setTimeout(() => otpRefs.current[0]?.focus(), 100);
    } catch {
      setError('Failed to send verification code. Check your connection.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      otpRefs.current[index + 1]?.focus();
    }
    if (newOtp.every((d) => d !== '')) {
      verifyOtp(newOtp.join(''));
    }
  };

  const handleOtpKeyDown = (index: number, e: any) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtp = async (code: string) => {
    setError('');
    setOtpVerifying(true);
    try {
      const res = await fetch(`${API_URL}/api/otp/verify`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim().toLowerCase(), code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Invalid code');
        setOtp(['', '', '', '', '', '']);
        otpRefs.current[0]?.focus();
        setOtpVerifying(false);
        return;
      }
      setOtpVerified(true);
      await completeRegistration();
    } catch {
      setError('Verification failed. Please try again.');
      setOtpVerifying(false);
    }
  };

  const completeRegistration = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/api/register`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(), email: email.trim().toLowerCase(), password, image: imagePreview,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Registration failed');
        setLoading(false);
        return;
      }
      await login(email.trim().toLowerCase(), password);
    } catch {
      setError('Something went wrong. Please try again!');
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: colors.background }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', paddingTop: insets.top, paddingBottom: insets.bottom + 20 }} keyboardShouldPersistTaps="handled">
        <View style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} pointerEvents="none">
          <Animated.View style={{ position: 'absolute', top: -80, right: -60, width: 240, height: 240, borderRadius: 120, backgroundColor: isDark ? 'rgba(212, 168, 83, 0.06)' : 'rgba(244, 63, 94, 0.08)', transform: [{ translateY: floatAnim }] }} />
          <View style={{ position: 'absolute', bottom: -80, left: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: isDark ? 'rgba(212, 168, 83, 0.05)' : 'rgba(245, 158, 11, 0.08)' }} />
        </View>
        <Animated.View style={{ paddingHorizontal: spacing.lg, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={{ backgroundColor: isDark ? 'rgba(26, 26, 46, 0.85)' : 'rgba(255, 255, 255, 0.85)', borderRadius: 24, paddingVertical: spacing.xl, paddingHorizontal: spacing.lg, shadowColor: isDark ? '#d4a853' : '#f43f5e', shadowOffset: { width: 0, height: 8 }, shadowOpacity: isDark ? 0.15 : 0.2, shadowRadius: 32, elevation: 12 }}>
            {/* Step Indicator */}
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.lg }}>
              {[1, 2, 3].map((s, i) => (
                <React.Fragment key={s}>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: stepNumber >= s ? (isDark ? '#d4a853' : '#e85d75') : (isDark ? '#2a2a3e' : '#e5e7eb'), alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 12, fontWeight: '700', color: stepNumber >= s ? (isDark ? '#121212' : '#ffffff') : colors.mutedForeground }}>
                      {stepNumber > s ? '✓' : s}
                    </Text>
                  </View>
                  {i < 2 && (
                    <View style={{ width: 24, height: 2, backgroundColor: stepNumber > s ? (isDark ? '#d4a853' : '#e85d75') : (isDark ? '#2a2a3e' : '#e5e7eb'), marginHorizontal: 4 }} />
                  )}
                </React.Fragment>
              ))}
            </View>

            {/* Heart Icon */}
            <View style={{ alignItems: 'center', marginBottom: spacing.md }}>
              <Animated.View style={{ transform: [{ translateY: floatAnim }] }}>
                <View style={{ width: 72, height: 72, borderRadius: 36, backgroundColor: isDark ? '#d4a853' : '#e85d75', alignItems: 'center', justifyContent: 'center', shadowColor: isDark ? '#d4a853' : '#e85d75', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.3, shadowRadius: 16, elevation: 10 }}>
                  <Text style={{ fontSize: 32 }}>❤️</Text>
                </View>
              </Animated.View>
            </View>

            <Text style={{ fontSize: 24, fontWeight: '700', textAlign: 'center', color: isDark ? '#d4a853' : '#e85d75', marginBottom: spacing.xs }}>
              {step === 'details' ? 'Create Account' : step === 'avatar' ? 'Pick Your DP' : 'Verify Email'}
            </Text>
            <Text style={{ fontSize: 13, color: colors.mutedForeground, textAlign: 'center', marginBottom: spacing.lg }}>
              {step === 'details' ? 'Join My Bunny' : step === 'avatar' ? 'Choose a profile picture' : `Code sent to ${email}`}
            </Text>

            {step === 'details' && (
              <View style={{ gap: spacing.md }}>
                <View style={{ gap: spacing.xs }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground, marginLeft: 4 }}>Your Name</Text>
                  <TextInput style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: isDark ? 'rgba(212,168,83,0.3)' : '#fbcfe8', borderRadius: 12, padding: spacing.md, fontSize: 16, color: colors.foreground }} placeholder="Enter your name" placeholderTextColor={colors.mutedForeground} value={name} onChangeText={setName} autoCapitalize="words" />
                </View>
                <View style={{ gap: spacing.xs }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground, marginLeft: 4 }}>Email</Text>
                  <TextInput style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: isDark ? 'rgba(212,168,83,0.3)' : '#fbcfe8', borderRadius: 12, padding: spacing.md, fontSize: 16, color: colors.foreground }} placeholder="your@email.com" placeholderTextColor={colors.mutedForeground} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" autoCorrect={false} />
                </View>
                <View style={{ gap: spacing.xs }}>
                  <Text style={{ fontSize: 13, fontWeight: '600', color: colors.foreground, marginLeft: 4 }}>Password</Text>
                  <TextInput style={{ backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderWidth: 1, borderColor: isDark ? 'rgba(212,168,83,0.3)' : '#fbcfe8', borderRadius: 12, padding: spacing.md, fontSize: 16, color: colors.foreground }} placeholder="At least 6 characters" placeholderTextColor={colors.mutedForeground} value={password} onChangeText={setPassword} secureTextEntry />
                </View>
                {error ? (
                  <View style={{ backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : '#fef2f2', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: isDark ? 'rgba(244,63,94,0.2)' : '#fecaca' }}>
                    <Text style={{ fontSize: 13, color: '#ef4444', textAlign: 'center' }}>{error}</Text>
                  </View>
                ) : null}
                <TouchableOpacity style={{ marginTop: spacing.sm, backgroundColor: isDark ? '#d4a853' : '#e85d75', borderRadius: 12, paddingVertical: spacing.md + 2, alignItems: 'center', shadowColor: isDark ? '#d4a853' : '#e85d75', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 12, elevation: 6 }} onPress={handleDetailsSubmit} activeOpacity={0.8}>
                  <Text style={{ fontSize: 16, fontWeight: '700', color: isDark ? '#121212' : '#ffffff' }}>Continue →</Text>
                </TouchableOpacity>
                <TouchableOpacity style={{ alignItems: 'center', marginTop: spacing.sm }} onPress={() => navigation.goBack()} activeOpacity={0.7}>
                  <Text style={{ fontSize: 13, color: colors.mutedForeground }}>Already have an account? <Text style={{ fontSize: 13, fontWeight: '600', color: isDark ? '#d4a853' : '#e85d75' }}>Sign in →</Text></Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'avatar' && (
              <View style={{ gap: spacing.lg }}>
                <View style={{ alignItems: 'center' }}>
                  <View style={{ width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: isDark ? 'rgba(212,168,83,0.5)' : '#fbcfe8', borderStyle: 'dashed', backgroundColor: isDark ? 'rgba(212,168,83,0.05)' : '#fff1f2', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                    {imagePreview ? (
                      <Image source={{ uri: imagePreview }} style={{ width: 120, height: 120, borderRadius: 60 }} />
                    ) : (
                      <View style={{ alignItems: 'center' }}>
                        <Text style={{ fontSize: 36 }}>📷</Text>
                        <Text style={{ fontSize: 10, color: isDark ? 'rgba(212,168,83,0.4)' : '#fb7185', marginTop: 4 }}>Add Photo</Text>
                      </View>
                    )}
                  </View>
                </View>
                <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: 'center' }}>Choose a nice profile picture for your partner to see</Text>
                {error ? (
                  <View style={{ backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : '#fef2f2', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: isDark ? 'rgba(244,63,94,0.2)' : '#fecaca' }}>
                    <Text style={{ fontSize: 13, color: '#ef4444', textAlign: 'center' }}>{error}</Text>
                  </View>
                ) : null}
                <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                  <TouchableOpacity style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center' }} onPress={() => setStep('details')}>
                    <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Back</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={{ flex: 1, backgroundColor: isDark ? '#d4a853' : '#e85d75', borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center', opacity: otpSending ? 0.7 : 1 }} onPress={handleSendOTP} disabled={otpSending}>
                    {otpSending ? (
                      <ActivityIndicator color={isDark ? '#121212' : '#ffffff'} size="small" />
                    ) : (
                      <Text style={{ fontSize: 14, fontWeight: '700', color: isDark ? '#121212' : '#ffffff' }}>Send OTP ✉️</Text>
                    )}
                  </TouchableOpacity>
                </View>
                <TouchableOpacity onPress={handleSendOTP} disabled={otpSending} activeOpacity={0.7}>
                  <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: 'center' }}>Skip photo & continue →</Text>
                </TouchableOpacity>
              </View>
            )}

            {step === 'otp' && (
              <View style={{ gap: spacing.lg }}>
                {otpVerified ? (
                  <View style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
                    <View style={{ width: 60, height: 60, borderRadius: 30, backgroundColor: isDark ? 'rgba(34,197,94,0.2)' : '#f0fdf4', alignItems: 'center', justifyContent: 'center', marginBottom: spacing.md }}>
                      <Text style={{ fontSize: 28 }}>✓</Text>
                    </View>
                    <Text style={{ fontSize: 16, fontWeight: '600', color: colors.foreground }}>Email Verified! ✨</Text>
                    <Text style={{ fontSize: 13, color: colors.mutedForeground, marginTop: 4 }}>Setting up your account...</Text>
                    <ActivityIndicator size="small" color={isDark ? '#d4a853' : '#e85d75'} style={{ marginTop: spacing.md }} />
                  </View>
                ) : (
                  <>
                    <Text style={{ fontSize: 14, color: colors.mutedForeground, textAlign: 'center' }}>
                      Verification code sent to <Text style={{ fontWeight: '600', color: colors.foreground }}>{email}</Text>
                    </Text>
                    <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing.sm }}>
                      {otp.map((digit, i) => (
                        <TextInput key={i} ref={(el) => { otpRefs.current[i] = el; }} style={{ width: 44, height: 52, textAlign: 'center', fontSize: 20, fontWeight: '700', backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.5)', borderWidth: 2, borderColor: isDark ? 'rgba(212,168,83,0.3)' : '#fbcfe8', borderRadius: 12, color: colors.foreground }} keyboardType="number-pad" maxLength={1} value={digit} onChangeText={(v) => handleOtpChange(i, v)} onKeyPress={(e) => handleOtpKeyDown(i, e)} />
                      ))}
                    </View>
                    {error ? (
                      <View style={{ backgroundColor: isDark ? 'rgba(244,63,94,0.1)' : '#fef2f2', borderRadius: 12, padding: 10, borderWidth: 1, borderColor: isDark ? 'rgba(244,63,94,0.2)' : '#fecaca' }}>
                        <Text style={{ fontSize: 13, color: '#ef4444', textAlign: 'center' }}>{error}</Text>
                      </View>
                    ) : null}
                    {otpVerifying && (
                      <View style={{ alignItems: 'center' }}>
                        <ActivityIndicator size="small" color={colors.primary} />
                        <Text style={{ fontSize: 12, color: colors.mutedForeground, marginTop: 4 }}>Verifying...</Text>
                      </View>
                    )}
                    <View style={{ flexDirection: 'row', gap: spacing.sm }}>
                      <TouchableOpacity style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center' }} onPress={() => { setStep('avatar'); setOtp(['', '', '', '', '', '']); setError(''); }}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.foreground }}>Back</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={{ flex: 1, backgroundColor: 'transparent', borderWidth: 1.5, borderColor: colors.border, borderRadius: 12, paddingVertical: spacing.md, alignItems: 'center' }} onPress={handleSendOTP} disabled={otpSending}>
                        <Text style={{ fontSize: 14, fontWeight: '600', color: isDark ? '#d4a853' : '#e85d75' }}>{otpSending ? 'Sending...' : 'Resend Code'}</Text>
                      </TouchableOpacity>
                    </View>
                  </>
                )}
              </View>
            )}
          </View>
          <Text style={{ fontSize: 12, color: colors.mutedForeground, textAlign: 'center', marginTop: spacing.xl, opacity: 0.5 }}>Made with ❤️ just for you</Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
