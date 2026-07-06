import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import * as Haptics from 'expo-haptics';
import { useCallback, useEffect, useRef } from 'react';
import { ActivityIndicator, Platform, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, press, radius, space, text } from '@/theme';

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
      handleIndicatorStyle={{ backgroundColor: color.disabled, width: space[8], height: space[1] }}
      backgroundStyle={{
        backgroundColor: color.surface,
        borderTopLeftRadius: radius.panel,
        borderTopRightRadius: radius.panel,
      }}
    >
      <BottomSheetView style={{ padding: space[6] }}>
        <Text style={[text.h3, { color: color.textPrimary, marginBottom: space[2] }]}>{title}</Text>
        <Text style={[text.body, { color: color.textSecondary, marginBottom: space[6] }]}>
          {message}
        </Text>

        <View style={{ flexDirection: 'row', gap: space[3] }}>
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={press.secondary}
            style={{
              flex: 1,
              backgroundColor: color.surfaceSubtle,
              borderRadius: radius.button,
              paddingVertical: space[3.5],
              alignItems: 'center',
            }}
          >
            <Text style={[text.buttonSm, { color: color.textPrimary }]}>Cancel</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={handleConfirm}
            disabled={loading}
            activeOpacity={press.secondary}
            style={{
              flex: 1,
              backgroundColor: color.error,
              borderRadius: radius.button,
              paddingVertical: space[3.5],
              alignItems: 'center',
            }}
          >
            {loading ? (
              <ActivityIndicator color={color.onBrand} />
            ) : (
              <Text style={[text.buttonSm, { color: color.onBrand }]}>{confirmLabel}</Text>
            )}
          </TouchableOpacity>
        </View>
      </BottomSheetView>
    </BottomSheet>
  );
}
