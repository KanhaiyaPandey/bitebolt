/**
 * Design System · Elevation levels
 *
 * Cross-platform shadow recipes (iOS shadow* + Android elevation). Spread the
 * level that matches the surface's role — do not author ad-hoc shadows.
 *
 *   <View style={[{ backgroundColor: color.surface }, elevation.sm]} />
 */
import type { ViewStyle } from 'react-native';

import { color, palette } from './tokens';

export const elevation = {
  // e0 — flat
  none: {
    shadowColor: 'transparent',
    shadowOpacity: 0,
    shadowRadius: 0,
    shadowOffset: { width: 0, height: 0 },
    elevation: 0,
  },

  // e1 — resting cards & list rows
  sm: {
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },

  // e2 — raised panels (metric cards, dashboard sections, bottom sheets)
  md: {
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },

  // e3 — floating layers (modals, overlays)
  lg: {
    shadowColor: palette.shadowNav,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 8 },
    elevation: 12,
  },

  // Floating bottom nav — shadow casts upward
  navBar: {
    shadowColor: palette.shadowNav,
    shadowOpacity: 0.1,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -2 },
    elevation: 14,
  },

  // Brand-tinted — small (segmented pill, active chip)
  brandSm: {
    shadowColor: color.brand,
    shadowOpacity: 0.25,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },

  // Brand-tinted — large (primary CTA, FAB)
  brandLg: {
    shadowColor: color.brand,
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },

  // Upward-casting hero sheet (auth bottom cards)
  sheetTop: {
    shadowColor: '#000000',
    shadowOpacity: 0.05,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -8 },
    elevation: 10,
  },

  // Brand-tinted — hero header strip (dashboard)
  brandHero: {
    shadowColor: color.brand,
    shadowOpacity: 0.15,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 8,
  },
} satisfies Record<string, ViewStyle>;

export type ElevationLevel = keyof typeof elevation;
