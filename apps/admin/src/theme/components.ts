/**
 * Design System · Component recipes
 *
 * Style factories for the recurring composite patterns (cards, headers, chips,
 * badges, FAB, buttons). Screens compose these instead of re-declaring the same
 * inline objects, guaranteeing every instance is pixel-identical.
 */
import type { ViewStyle } from 'react-native';

import { elevation } from './elevation';
import { press } from './interaction';
import { color, radius, space } from './tokens';

/** Resting white card for list rows / order cards. */
export const card: ViewStyle = {
  backgroundColor: color.surface,
  borderRadius: radius.card,
  padding: space[3.5], // 14
  marginHorizontal: space[4],
  marginBottom: space[2.5], // 10
  ...elevation.sm,
};

/** Raised panel for dashboard sections & metric cards. */
export const panel: ViewStyle = {
  backgroundColor: color.surface,
  borderRadius: radius.panel,
  padding: space[5], // 20
  ...elevation.md,
};

/** White screen header with hairline divider. Pass the top safe-area inset. */
export function screenHeader(topInset: number): ViewStyle {
  return {
    backgroundColor: color.surface,
    paddingTop: topInset + space[3], // inset + 12
    paddingHorizontal: space[4],
    paddingBottom: space[3],
    borderBottomWidth: 1,
    borderBottomColor: color.borderSubtle,
  };
}

/** Circular floating action button. */
export const fab: ViewStyle = {
  position: 'absolute',
  bottom: 110,
  right: space[6],
  width: 56,
  height: 56,
  borderRadius: radius.full,
  backgroundColor: color.brand,
  alignItems: 'center',
  justifyContent: 'center',
  ...elevation.brandLg,
};

/** Full-width primary CTA (auth, forms). `enabled` toggles brand vs disabled. */
export function primaryButton(enabled: boolean): ViewStyle {
  return {
    backgroundColor: enabled ? color.brand : color.disabled,
    borderRadius: radius.field,
    height: 56,
    alignItems: 'center',
    justifyContent: 'center',
    ...(enabled ? elevation.brandLg : elevation.none),
  };
}

/** Pill filter chip. `active` swaps to brand fill. */
export function chip(active: boolean): ViewStyle {
  return {
    backgroundColor: active ? color.brand : color.surfaceSubtle,
    borderRadius: radius.full,
    paddingHorizontal: space[3.5], // 14
    paddingVertical: space[2] - 1, // 7
  };
}

/** Rounded status/count badge. Pass the tone background. */
export function badge(bg: string): ViewStyle {
  return {
    backgroundColor: bg,
    borderRadius: radius.full,
    paddingHorizontal: space[2],
    paddingVertical: space[1] - 1, // 3
  };
}

/** Tinted square/round icon tile (avatars, metric icons, method icons). */
export function iconTile(size: number, bg: string, rounded: number = radius.full): ViewStyle {
  return {
    width: size,
    height: size,
    borderRadius: rounded === radius.full ? size / 2 : rounded,
    backgroundColor: bg,
    alignItems: 'center',
    justifyContent: 'center',
  };
}

/** Segmented-control track container. */
export const segmentTrack: ViewStyle = {
  flexDirection: 'row',
  backgroundColor: color.track,
  borderRadius: radius.full,
  padding: space[1],
  marginHorizontal: space[4],
  marginBottom: space[3],
  height: 44,
};

/** Sliding active pill inside a segmented control (width set by caller). */
export const segmentPill: ViewStyle = {
  position: 'absolute',
  top: space[1],
  bottom: space[1],
  left: space[1],
  backgroundColor: color.brand,
  borderRadius: radius.full,
  ...elevation.brandSm,
};

export const touchable = { press };
