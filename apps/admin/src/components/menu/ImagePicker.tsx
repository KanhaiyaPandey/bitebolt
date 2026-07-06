import { Ionicons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Image, Text, TouchableOpacity, View } from 'react-native';

import { uploadApi } from '@/api';

interface ImagePickerProps {
  value?: string | null;
  onChange: (url: string) => void;
  label?: string;
}

export function ImagePicker({ value, onChange, label = 'Food Image' }: ImagePickerProps) {
  const [uploading, setUploading] = useState(false);

  async function pickFromSource(source: 'camera' | 'gallery') {
    let result: ExpoImagePicker.ImagePickerResult;

    if (source === 'camera') {
      const perm = await ExpoImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) return;
      result = await ExpoImagePicker.launchCameraAsync({ quality: 0.8, allowsEditing: true });
    } else {
      const perm = await ExpoImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) return;
      result = await ExpoImagePicker.launchImageLibraryAsync({ quality: 0.8, allowsEditing: true });
    }

    if (result.canceled || !result.assets[0]) return;

    const asset = result.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';

    console.debug('[AdminMenu] Upload image', { fileSize: asset.fileSize, mimeType });
    setUploading(true);
    try {
      const url = await uploadApi.uploadImage(asset.uri, mimeType);
      console.debug('[AdminMenu] Image uploaded', { url });
      onChange(url);
    } catch (err) {
      console.error('[AdminMenu] Image upload failed', err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={{ marginBottom: 16 }}>
      <Text
        style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 13, color: '#9098B1', marginBottom: 6 }}
      >
        {label}
      </Text>

      <View style={{ flexDirection: 'row', gap: 10 }}>
        {/* Preview */}
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: 12,
            backgroundColor: '#F5F5FA',
            borderWidth: 1.5,
            borderColor: value ? '#FA7938' : '#D3D6DE',
            borderStyle: value ? 'solid' : 'dashed',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {uploading ? (
            <ActivityIndicator color="#FA7938" />
          ) : value ? (
            <Image source={{ uri: value }} style={{ width: 100, height: 100 }} resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={32} color="#C4C9D4" />
          )}
        </View>

        {/* Buttons */}
        <View style={{ flex: 1, gap: 8, justifyContent: 'center' }}>
          <TouchableOpacity
            onPress={() => pickFromSource('camera')}
            disabled={uploading}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#FFF4EE',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
              gap: 8,
            }}
          >
            <Ionicons name="camera-outline" size={18} color="#FA7938" />
            <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 13, color: '#FA7938' }}>
              Camera
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => pickFromSource('gallery')}
            disabled={uploading}
            activeOpacity={0.8}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: '#F5F5FA',
              borderRadius: 10,
              paddingHorizontal: 14,
              paddingVertical: 10,
              gap: 8,
            }}
          >
            <Ionicons name="images-outline" size={18} color="#414158" />
            <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 13, color: '#414158' }}>
              Gallery
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
