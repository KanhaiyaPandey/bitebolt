import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Switch,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import Animated, { FadeInDown } from 'react-native-reanimated';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { usersApi } from '../src/api';
import { addressSchema } from '@bitebolt/utils';
import { useAuthStore } from '../src/store/auth.store';
import type { Address } from '@bitebolt/types';
import type { z } from 'zod';

type AddressFormData = z.infer<typeof addressSchema>;

const LABEL_PRESETS = ['Home', 'Work', 'Other'];

export default function AddressesScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuthStore();

  const [modalVisible, setModalVisible] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);

  const { data: addresses, isLoading } = useQuery({
    queryKey: ['addresses'],
    queryFn: () => usersApi.getAddresses(),
    enabled: isAuthenticated,
  });

  const {
    control,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<AddressFormData>({
    resolver: zodResolver(addressSchema),
    defaultValues: {
      label: 'Home',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false,
    },
  });

  const openAddModal = () => {
    setEditingAddress(null);
    reset({
      label: 'Home',
      addressLine1: '',
      addressLine2: '',
      city: '',
      state: '',
      pincode: '',
      isDefault: false,
    });
    setModalVisible(true);
  };

  const openEditModal = (address: Address) => {
    setEditingAddress(address);
    reset({
      label: address.label,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 ?? '',
      city: address.city,
      state: address.state,
      pincode: address.pincode,
      isDefault: address.isDefault,
    });
    setModalVisible(true);
  };

  const saveMutation = useMutation({
    mutationFn: async (data: AddressFormData) => {
      if (editingAddress) {
        return usersApi.updateAddress(editingAddress.id, data);
      }
      return usersApi.addAddress(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
      setModalVisible(false);
    },
    onError: (err: Error) => {
      Alert.alert('Save Failed', err.message ?? 'Could not save address.');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => usersApi.deleteAddress(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['addresses'] });
    },
    onError: (err: Error) => {
      Alert.alert('Delete Failed', err.message ?? 'Could not delete address.');
    },
  });

  const handleDelete = (address: Address) => {
    Alert.alert('Delete Address', `Remove "${address.label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => deleteMutation.mutate(address.id),
      },
    ]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: '#EEEEF5' }} edges={['top']}>
      {/* ── Header ─────────────────────────────────────────── */}
      <Animated.View
        entering={FadeInDown.duration(400)}
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
          My Addresses
        </Text>
        <TouchableOpacity
          onPress={openAddModal}
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            backgroundColor: '#FA7938',
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: '#FA7938',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.3,
            shadowRadius: 6,
            elevation: 3,
          }}
        >
          <Ionicons name="add" size={22} color="#FFFFFF" />
        </TouchableOpacity>
      </Animated.View>

      {isLoading ? (
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <ActivityIndicator size="large" color="#FA7938" />
        </View>
      ) : !addresses?.length ? (
        <View
          style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 32 }}
        >
          <View
            style={{
              width: 80,
              height: 80,
              borderRadius: 40,
              backgroundColor: '#FA793820',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 20,
            }}
          >
            <Ionicons name="location-outline" size={36} color="#FA7938" />
          </View>
          <Text
            style={{
              fontFamily: 'Urbanist-Bold',
              fontSize: 20,
              color: '#414158',
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            No saved addresses
          </Text>
          <Text
            style={{
              fontFamily: 'Urbanist',
              fontSize: 14,
              color: '#9098B1',
              textAlign: 'center',
              marginBottom: 28,
            }}
          >
            Add your home or work address for faster checkout.
          </Text>
          <TouchableOpacity
            onPress={openAddModal}
            style={{
              backgroundColor: '#FA7938',
              borderRadius: 14,
              paddingVertical: 14,
              paddingHorizontal: 32,
              alignItems: 'center',
              shadowColor: '#FA7938',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.3,
              shadowRadius: 10,
              elevation: 5,
            }}
          >
            <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#FFFFFF', fontSize: 15 }}>
              Add Address
            </Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ padding: 20, gap: 12 }}
        >
          {addresses.map((address, idx) => (
            <Animated.View
              key={address.id}
              entering={FadeInDown.delay(Math.min(idx * 80, 400)).duration(400)}
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
                shadowColor: '#1A1A2E',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 8,
                elevation: 2,
                borderWidth: address.isDefault ? 1.5 : 0,
                borderColor: '#FA7938',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'flex-start' }}>
                <View
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    backgroundColor: '#FA793815',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginRight: 12,
                  }}
                >
                  <Ionicons
                    name={
                      address.label.toLowerCase() === 'home'
                        ? 'home-outline'
                        : address.label.toLowerCase() === 'work'
                          ? 'briefcase-outline'
                          : 'location-outline'
                    }
                    size={18}
                    color="#FA7938"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <View
                    style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 4 }}
                  >
                    <Text style={{ fontFamily: 'Urbanist-Bold', fontSize: 15, color: '#414158' }}>
                      {address.label}
                    </Text>
                    {address.isDefault && (
                      <View
                        style={{
                          backgroundColor: '#FA793820',
                          paddingHorizontal: 8,
                          paddingVertical: 2,
                          borderRadius: 6,
                        }}
                      >
                        <Text
                          style={{
                            fontFamily: 'Urbanist-SemiBold',
                            fontSize: 10,
                            color: '#FA7938',
                          }}
                        >
                          Default
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text
                    style={{
                      fontFamily: 'Urbanist',
                      fontSize: 13,
                      color: '#9098B1',
                      lineHeight: 18,
                    }}
                  >
                    {address.addressLine1}
                    {address.addressLine2 ? `\n${address.addressLine2}` : ''}
                  </Text>
                  <Text style={{ fontFamily: 'Urbanist', fontSize: 13, color: '#9098B1' }}>
                    {address.city}, {address.state} – {address.pincode}
                  </Text>
                </View>
              </View>

              <View
                style={{
                  flexDirection: 'row',
                  gap: 10,
                  marginTop: 14,
                  paddingTop: 14,
                  borderTopWidth: 1,
                  borderTopColor: '#F4F4FA',
                }}
              >
                <TouchableOpacity
                  onPress={() => openEditModal(address)}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: '#EEEEF5',
                  }}
                >
                  <Ionicons name="pencil-outline" size={15} color="#414158" />
                  <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 13, color: '#414158' }}>
                    Edit
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={() => handleDelete(address)}
                  disabled={deleteMutation.isPending}
                  style={{
                    flex: 1,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    paddingVertical: 10,
                    borderRadius: 10,
                    backgroundColor: '#FEF2F2',
                  }}
                >
                  <Ionicons name="trash-outline" size={15} color="#EF4444" />
                  <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 13, color: '#EF4444' }}>
                    Delete
                  </Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          ))}
        </ScrollView>
      )}

      {/* ── Add / Edit Modal ──────────────────────────────── */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity
            style={{ flex: 1, backgroundColor: '#00000050' }}
            activeOpacity={1}
            onPress={() => setModalVisible(false)}
          />
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderTopLeftRadius: 24,
              borderTopRightRadius: 24,
              paddingTop: 12,
              paddingBottom: Platform.OS === 'ios' ? 40 : 24,
              maxHeight: '90%',
            }}
          >
            {/* Drag handle */}
            <View
              style={{
                width: 36,
                height: 4,
                borderRadius: 2,
                backgroundColor: '#D3D6DE',
                alignSelf: 'center',
                marginBottom: 12,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                paddingHorizontal: 20,
                marginBottom: 20,
              }}
            >
              <Text
                style={{ fontFamily: 'Urbanist-Bold', fontSize: 18, color: '#414158', flex: 1 }}
              >
                {editingAddress ? 'Edit Address' : 'New Address'}
              </Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Ionicons name="close" size={22} color="#9098B1" />
              </TouchableOpacity>
            </View>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 14 }}
              keyboardShouldPersistTaps="handled"
            >
              {/* Label presets */}
              <View>
                <Text style={labelStyle}>Label</Text>
                <Controller
                  control={control}
                  name="label"
                  render={({ field: { value, onChange } }) => (
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {LABEL_PRESETS.map((preset) => (
                        <TouchableOpacity
                          key={preset}
                          onPress={() => onChange(preset)}
                          style={{
                            paddingHorizontal: 16,
                            paddingVertical: 8,
                            borderRadius: 10,
                            backgroundColor: value === preset ? '#FA7938' : '#EEEEF5',
                          }}
                        >
                          <Text
                            style={{
                              fontFamily: 'Urbanist-SemiBold',
                              fontSize: 13,
                              color: value === preset ? '#FFFFFF' : '#9098B1',
                            }}
                          >
                            {preset}
                          </Text>
                        </TouchableOpacity>
                      ))}
                      <TextInput
                        value={!LABEL_PRESETS.includes(value) ? value : ''}
                        onChangeText={onChange}
                        placeholder="Custom"
                        placeholderTextColor="#C4C9D4"
                        style={[
                          inputStyle,
                          {
                            flex: 1,
                            marginBottom: 0,
                            paddingVertical: 8,
                            borderColor: errors.label ? '#EF4444' : '#EEEEF5',
                          },
                        ]}
                      />
                    </View>
                  )}
                />
                {errors.label && <Text style={errorStyle}>{errors.label.message}</Text>}
              </View>

              {/* Address Line 1 */}
              <Controller
                control={control}
                name="addressLine1"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View>
                    <Text style={labelStyle}>Address Line 1 *</Text>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="House no., Street, Area"
                      placeholderTextColor="#C4C9D4"
                      style={[inputStyle, errors.addressLine1 && { borderColor: '#EF4444' }]}
                    />
                    {errors.addressLine1 && (
                      <Text style={errorStyle}>{errors.addressLine1.message}</Text>
                    )}
                  </View>
                )}
              />

              {/* Address Line 2 */}
              <Controller
                control={control}
                name="addressLine2"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View>
                    <Text style={labelStyle}>Address Line 2 (optional)</Text>
                    <TextInput
                      value={value ?? ''}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="Landmark, Colony"
                      placeholderTextColor="#C4C9D4"
                      style={inputStyle}
                    />
                  </View>
                )}
              />

              {/* City + State */}
              <View style={{ flexDirection: 'row', gap: 12 }}>
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <View style={{ flex: 1 }}>
                      <Text style={labelStyle}>City *</Text>
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="City"
                        placeholderTextColor="#C4C9D4"
                        style={[inputStyle, errors.city && { borderColor: '#EF4444' }]}
                      />
                      {errors.city && <Text style={errorStyle}>{errors.city.message}</Text>}
                    </View>
                  )}
                />
                <Controller
                  control={control}
                  name="state"
                  render={({ field: { value, onChange, onBlur } }) => (
                    <View style={{ flex: 1 }}>
                      <Text style={labelStyle}>State *</Text>
                      <TextInput
                        value={value}
                        onChangeText={onChange}
                        onBlur={onBlur}
                        placeholder="State"
                        placeholderTextColor="#C4C9D4"
                        style={[inputStyle, errors.state && { borderColor: '#EF4444' }]}
                      />
                      {errors.state && <Text style={errorStyle}>{errors.state.message}</Text>}
                    </View>
                  )}
                />
              </View>

              {/* Pincode */}
              <Controller
                control={control}
                name="pincode"
                render={({ field: { value, onChange, onBlur } }) => (
                  <View>
                    <Text style={labelStyle}>Pincode *</Text>
                    <TextInput
                      value={value}
                      onChangeText={onChange}
                      onBlur={onBlur}
                      placeholder="6-digit pincode"
                      placeholderTextColor="#C4C9D4"
                      keyboardType="number-pad"
                      maxLength={6}
                      style={[inputStyle, errors.pincode && { borderColor: '#EF4444' }]}
                    />
                    {errors.pincode && <Text style={errorStyle}>{errors.pincode.message}</Text>}
                  </View>
                )}
              />

              {/* Set as default */}
              <Controller
                control={control}
                name="isDefault"
                render={({ field: { value, onChange } }) => (
                  <View
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      backgroundColor: '#F8F9FA',
                      padding: 14,
                      borderRadius: 12,
                    }}
                  >
                    <View>
                      <Text
                        style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 14, color: '#414158' }}
                      >
                        Set as default
                      </Text>
                      <Text style={{ fontFamily: 'Urbanist', fontSize: 12, color: '#9098B1' }}>
                        Auto-selected at checkout
                      </Text>
                    </View>
                    <Switch
                      value={value}
                      onValueChange={onChange}
                      trackColor={{ false: '#E5E7EB', true: '#FA793860' }}
                      thumbColor={value ? '#FA7938' : '#FFFFFF'}
                    />
                  </View>
                )}
              />

              {/* Save button */}
              <TouchableOpacity
                onPress={handleSubmit((data) => saveMutation.mutate(data))}
                disabled={saveMutation.isPending}
                style={{
                  backgroundColor: saveMutation.isPending ? '#FBAD85' : '#FA7938',
                  borderRadius: 14,
                  paddingVertical: 16,
                  alignItems: 'center',
                  marginTop: 4,
                  shadowColor: '#FA7938',
                  shadowOffset: { width: 0, height: 4 },
                  shadowOpacity: 0.3,
                  shadowRadius: 10,
                  elevation: 5,
                }}
              >
                {saveMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={{ fontFamily: 'Urbanist-SemiBold', color: '#FFFFFF', fontSize: 16 }}>
                    {editingAddress ? 'Update Address' : 'Save Address'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const labelStyle = {
  fontFamily: 'Urbanist-Medium',
  fontSize: 13,
  color: '#9098B1',
  marginBottom: 6,
} as const;

const inputStyle = {
  backgroundColor: '#F8F9FA',
  borderRadius: 12,
  paddingHorizontal: 14,
  paddingVertical: 12,
  fontFamily: 'Urbanist',
  fontSize: 14,
  color: '#414158',
  borderWidth: 1.5,
  borderColor: '#EEEEF5',
} as const;

const errorStyle = {
  fontFamily: 'Urbanist',
  fontSize: 11,
  color: '#EF4444',
  marginTop: 4,
} as const;
