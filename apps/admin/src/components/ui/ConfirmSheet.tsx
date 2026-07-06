import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ConfirmSheetProps {
  title: string;
  message: string;
  confirmLabel?: string;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
  loading?: boolean;
  visible: boolean;
}

export function ConfirmSheet({
  title,
  message,
  confirmLabel = 'Delete',
  onConfirm,
  onClose,
  loading = false,
  visible,
}: ConfirmSheetProps) {
  const sheetRef = useRef<BottomSheet>(null);
  const insets = useSafeAreaInsets();
  const bottomPad = Math.max(insets.bottom, Platform.OS === 'android' ? 6 : 0);
  // Floating tab bar sits at bottom:0 with height (58 + bottomPad) — clear it with some breathing room.
  const tabBarClearance = 58 + bottomPad - 20;

  useEffect(() => {
    if (visible) {
      sheetRef.current?.expand();
    } else {
      sheetRef.current?.close();
    }
  }, [visible]);

  const renderBackdrop = useCallback(
    (props: Parameters<typeof BottomSheetBackdrop>[0]) => (
      <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} onPress={onClose} />
    ),
    [onClose],
  );

  async function handleConfirm() {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    await onConfirm();
  }

  return (
    <BottomSheet
      ref={sheetRef}
      index={visible ? 0 : -1}
      snapPoints={['30%']}
      bottomInset={tabBarClearance}
      enablePanDownToClose
      onClose={onClose}
      backdropComponent={renderBackdrop}
      handleIndicatorStyle={{ backgroundColor: '#D3D6DE', width: 32, height: 4 }}
      backgroundStyle={{
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
      }}
    >
      <BottomSheetView style={{ padding: 24 }}>
        <Text
          style={{ fontFamily: 'Urbanist-Bold', fontSize: 18, color: '#414158', marginBottom: 8 }}
        >
          {title}
        </Text>
        <Text style={{ fontFamily: 'Urbanist', fontSize: 14, color: '#9098B1', marginBottom: 24 }}>
          {message}
        </Text>

        <View style={{ flexDirection: 'row', gap: 12 }}>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: '#F5F5FA',
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 15, color: '#414158' }}>
              Cancel
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={0.8}
            style={{
              flex: 1,
              backgroundColor: '#EF4444',
              borderRadius: 14,
              paddingVertical: 14,
              alignItems: 'center',
            }}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" />
            ) : (
              <Text style={{ fontFamily: 'Urbanist-SemiBold', fontSize: 15, color: '#FFF' }}>
                {confirmLabel}
              </Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
