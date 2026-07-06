import { useState } from 'react';
import { ActivityIndicator, Switch, Text, TextInput, TouchableOpacity, View } from 'react-native';

import { color, elevation, press, radius, space, text } from '@/theme';

/** Field label above an input. */
export function FieldLabel({ children }: { children: React.ReactNode }) {
  return (
    <Text style={[text.label, { color: color.textSecondary, marginBottom: space[1.5] }]}>
      {children}
    </Text>
  );
}

/** Inline validation message; renders nothing when there is no error. */
export function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return <Text style={[text.caption, { color: color.error, marginTop: space[1] }]}>{message}</Text>;
}

/** Design-system text input with focus glow + error state. */
export function FormInput({
  error,
  ...props
}: React.ComponentProps<typeof TextInput> & { error?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <TextInput
      {...props}
      onFocus={(e) => {
        setFocused(true);
        props.onFocus?.(e);
      }}
      onBlur={(e) => {
        setFocused(false);
        props.onBlur?.(e);
      }}
      placeholderTextColor={color.textMuted}
      style={[
        text.body,
        {
          backgroundColor: color.surface,
          borderRadius: radius.control,
          borderWidth: 1.5,
          borderColor: error ? color.error : focused ? color.brand : color.disabled,
          paddingHorizontal: space[3.5],
          paddingVertical: space[3],
          color: color.textPrimary,
          // Focus glow (documented interaction state)
          shadowColor: focused ? color.brand : 'transparent',
          shadowOpacity: 0.15,
          shadowRadius: 6,
          shadowOffset: { width: 0, height: 0 },
        },
        props.style as object,
      ]}
    />
  );
}

/** Full-width form submit button. */
export function PrimaryButton({
  label,
  onPress,
  loading = false,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  loading?: boolean;
  disabled?: boolean;
}) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={press.card}
      style={[
        {
          backgroundColor: disabled ? color.disabled : color.brand,
          borderRadius: radius.button,
          paddingVertical: space[4],
          alignItems: 'center',
        },
        disabled ? elevation.none : elevation.brandLg,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={color.onBrand} />
      ) : (
        <Text style={[text.titleMd, { color: color.onBrand }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

/** Labelled toggle row (used inside a card). `tone` colours the on-track. */
export function ToggleRow({
  label,
  value,
  onValueChange,
  tone = color.brand,
}: {
  label: string;
  value: boolean;
  onValueChange: (v: boolean) => void;
  tone?: string;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <Text style={[text.bodyStrong, { flex: 1, color: color.textPrimary }]}>{label}</Text>
      <Switch
        value={value}
        onValueChange={onValueChange}
        trackColor={{ false: color.borderStrong, true: tone }}
        thumbColor={color.surface}
      />
    </View>
  );
}
