/**
 * Design System · Interaction states
 *
 * Canonical values for press, focus, disabled, selection and toggle feedback.
 * Every touchable / input MUST source its feedback from here so behaviour is
 * uniform across screens.
 */
import type { Insets } from 'react-native';

import { color } from './tokens';

/** `activeOpacity` for TouchableOpacity, keyed by control weight. */
export const press = {
  primary: 0.9, // primary CTAs
  card: 0.85, // tappable cards / rows
  secondary: 0.8, // chips, secondary buttons
  subtle: 0.7, // icon buttons, text links
  scaleDown: 0.96, // Animated press-in scale for CTAs
} as const;

/** Standard focus ring for text inputs (2px) and search fields (1.5px). */
export const focus = {
  borderColor: color.brand,
  borderWidth: 2,
  searchBorderWidth: 1.5,
} as const;

/** Disabled visuals for buttons / actionable controls. */
export const disabled = {
  backgroundColor: color.disabled,
  opacity: 0.5,
} as const;

/** Cross-platform Switch styling (availability / active toggles). */
export const switchProps = {
  trackColor: { false: color.borderStrong, true: color.brand },
  thumbColor: color.surface,
  style: { transform: [{ scaleX: 0.8 as const }, { scaleY: 0.8 as const }] },
} as const;

/** Default touch target padding for small icon buttons. */
export const hitSlop: Insets = { top: 6, bottom: 6, left: 6, right: 6 };

/**
 * Haptics contract — apply with expo-haptics at these interaction points.
 * (Reference table; import Haptics at the call site.)
 *   primary press   → ImpactFeedbackStyle.Medium
 *   destructive      → NotificationFeedbackType.Warning
 *   success (save)   → NotificationFeedbackType.Success
 *   toggle / copy    → selectionAsync()
 *   light tap        → ImpactFeedbackStyle.Light
 */
export const haptics = {
  primary: 'Medium',
  destructive: 'Warning',
  success: 'Success',
  selection: 'selection',
  light: 'Light',
} as const;
