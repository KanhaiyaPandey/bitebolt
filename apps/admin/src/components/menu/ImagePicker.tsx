import { Ionicons } from '@expo/vector-icons';
import * as ExpoImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { ActivityIndicator, Alert, Image, Text, TouchableOpacity, View } from 'react-native';

import { uploadApi } from '@/api';
import { color, press, radius, space, text } from '@/theme';

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
      if (!url) {
        console.error('[AdminMenu] Image upload returned no URL');
        Alert.alert('Upload failed', 'The image could not be uploaded. Please try again.');
        return;
      }
      onChange(url);
    } catch (err) {
      console.error('[AdminMenu] Image upload failed', err);
    } finally {
      setUploading(false);
    }
  }

  return (
    <View style={{ marginBottom: space[4] }}>
      <Text style={[text.label, { color: color.textSecondary, marginBottom: space[1.5] }]}>
        {label}
      </Text>

      <View style={{ flexDirection: 'row', gap: space[2.5] }}>
        {/* Preview */}
        <View
          style={{
            width: 100,
            height: 100,
            borderRadius: radius.control,
            backgroundColor: color.surfaceSubtle,
            borderWidth: 1.5,
            borderColor: value ? color.brand : color.disabled,
            borderStyle: value ? 'solid' : 'dashed',
            overflow: 'hidden',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {uploading ? (
            <ActivityIndicator color={color.brand} />
          ) : value ? (
            <Image source={{ uri: value }} style={{ width: 100, height: 100 }} resizeMode="cover" />
          ) : (
            <Ionicons name="image-outline" size={32} color={color.textMuted} />
          )}
        </View>

        {/* Buttons */}
        <View style={{ flex: 1, gap: space[2], justifyContent: 'center' }}>
          <TouchableOpacity
            onPress={() => pickFromSource('camera')}
            disabled={uploading}
            activeOpacity={press.secondary}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: color.brandSubtle,
              borderRadius: radius.control,
              paddingHorizontal: space[3.5],
              paddingVertical: space[2.5],
              gap: space[2],
            }}
          >
            <Ionicons name="camera-outline" size={18} color={color.brand} />
            <Text style={[text.label, { color: color.brand }]}>Camera</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => pickFromSource('gallery')}
            disabled={uploading}
            activeOpacity={press.secondary}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              backgroundColor: color.surfaceSubtle,
              borderRadius: radius.control,
              paddingHorizontal: space[3.5],
              paddingVertical: space[2.5],
              gap: space[2],
            }}
          >
            <Ionicons name="images-outline" size={18} color={color.textPrimary} />
            <Text style={[text.label, { color: color.textPrimary }]}>Gallery</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
