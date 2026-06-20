import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usersApi } from '../src/api';
import { updateProfileSchema, formatPhone } from '@bitebolt/utils';
import { useAuthStore } from '../src/store/auth.store';
import type { UserProfile } from '@bitebolt/types';
import type { z } from 'zod';

type ProfileFormData = z.infer<typeof updateProfileSchema>;

export default function PersonalInfoScreen() {
  const router = useRouter();
  const { user, setUser } = useAuthStore();

  const { data: profile, isLoading: profileLoading } = useQuery({
    queryKey: ['profile'],
    queryFn: () => usersApi.getProfile(),
    staleTime: 30_000,
  });

  const resolvedName = profile?.name ?? user?.name ?? '';
  const resolvedEmail = profile?.email ?? user?.email ?? '';
  const resolvedPhone = profile?.phone ?? user?.phone ?? '';

  const {
    control,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    values: {
      name: resolvedName ?? undefined,
      email: resolvedEmail ?? undefined,
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProfileFormData) => usersApi.updateProfile(data),
    onSuccess: (_, variables) => {
      setUser({
        name: variables.name ?? user?.name ?? null,
        email: variables.email ?? user?.email ?? null,
      });
      router.back();
    },
    onError: (err: Error) => {
      Alert.alert('Update Failed', err.message ?? 'Could not update profile.');
    },
  });

  const initials = resolvedName
    ? resolvedName
        .split(' ')
        .slice(0, 2)
        .map((w) => w[0])
        .join('')
        .toUpperCase()
    : '?';

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5' }} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────── */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingHorizontal: 20,
          paddingTop: 12,
          paddingBottom: 16,
        }}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: '#FFFFFF',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
            shadowColor: '#1A1A2E',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.06,
            shadowRadius: 6,
            elevation: 2,
          }}
        >
          <Ionicons name="arrow-back" size={20} color="#414158" />
        </TouchableOpacity>
        <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 20, color: '#414158', flex: 1 }}>
          Personal Info
        </Text>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, gap: 20 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Avatar ───────────────────────────────────── */}
          <View style={{ alignItems: 'center', paddingVertical: 8 }}>
            {profileLoading ? (
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: '#EEEEF5',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <ActivityIndicator color="#FA7938" />
              </View>
            ) : (
              <View
                style={{
                  width: 88,
                  height: 88,
                  borderRadius: 44,
                  backgroundColor: '#FA793825',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderWidth: 2,
                  borderColor: '#FA793840',
                }}
              >
                <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 32, color: '#FA7938' }}>
                  {initials}
                </Text>
              </View>
            )}
          </View>

          {/* ── Phone (read-only) ─────────────────────────── */}
          <View>
            <Text style={labelStyle}>Phone Number</Text>
            <View
              style={[
                inputStyle,
                {
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 10,
                  backgroundColor: '#F0F0F8',
                },
              ]}
            >
              <Ionicons name="lock-closed-outline" size={16} color="#C4C9D4" />
              <Text style={{ fontFamily: 'Urbanist', fontSize: 15, color: '#9098B1', flex: 1 }}>
                {resolvedPhone ? formatPhone(resolvedPhone) : '—'}
              </Text>
            </View>
            <Text style={{ fontFamily: 'Urbanist', fontSize: 11, color: '#9098B1', marginTop: 4 }}>
              Phone number cannot be changed
            </Text>
          </View>

          {/* ── Name ─────────────────────────────────────── */}
          <Controller
            control={control}
            name="name"
            render={({ field: { value, onChange, onBlur } }) => (
              <View>
                <Text style={labelStyle}>Full Name</Text>
                <TextInput
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter your name"
                  placeholderTextColor="#C4C9D4"
                  autoCapitalize="words"
                  style={[inputStyle, errors.name && { borderColor: '#EF4444' }]}
                />
                {errors.name && <Text style={errorStyle}>{errors.name.message}</Text>}
              </View>
            )}
          />

          {/* ── Email ────────────────────────────────────── */}
          <Controller
            control={control}
            name="email"
            render={({ field: { value, onChange, onBlur } }) => (
              <View>
                <Text style={labelStyle}>Email Address</Text>
                <TextInput
                  value={value ?? ''}
                  onChangeText={onChange}
                  onBlur={onBlur}
                  placeholder="Enter your email"
                  placeholderTextColor="#C4C9D4"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={[inputStyle, errors.email && { borderColor: '#EF4444' }]}
                />
                {errors.email && <Text style={errorStyle}>{errors.email.message}</Text>}
              </View>
            )}
          />

          {/* ── Save button ───────────────────────────────── */}
          <TouchableOpacity
            onPress={handleSubmit((data) => updateMutation.mutate(data))}
            disabled={updateMutation.isPending || !isDirty}
            style={{
              backgroundColor: updateMutation.isPending || !isDirty ? '#FBAD85' : '#FA7938',
              borderRadius: 14,
              paddingVertical: 16,
              alignItems: 'center',
              marginTop: 8,
              shadowColor: '#FA7938',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: isDirty ? 0.3 : 0,
              shadowRadius: 10,
              elevation: isDirty ? 5 : 0,
            }}
          >
            {updateMutation.isPending ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#FFFFFF', fontSize: 16 }}>
                Save Changes
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const labelStyle = {
  fontFamily: 'Urbanist-Medium',
  fontSize: 13,
  color: '#9098B1',
  marginBottom: 8,
} as const;

const inputStyle = {
  backgroundColor: '#FFFFFF',
  borderRadius: 14,
  paddingHorizontal: 16,
  paddingVertical: 14,
  fontFamily: 'Urbanist',
  fontSize: 15,
  color: '#414158',
  borderWidth: 1.5,
  borderColor: '#EEEEF5',
  shadowColor: '#1A1A2E',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.04,
  shadowRadius: 6,
  elevation: 1,
} as const;

const errorStyle = {
  fontFamily: 'Urbanist',
  fontSize: 11,
  color: '#EF4444',
  marginTop: 4,
} as const;
