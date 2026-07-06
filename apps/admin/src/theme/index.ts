/**
 * BiteBolt Admin — Design System
 *
 * Single import surface for the whole system:
 *
 *   import { color, space, radius, text, elevation, press, ui } from '@/theme';
 *
 * Pillars:
 *   • color / palette / chartColors  — colour usage rules
 *   • space / layout                 — 4-point spacing scale
 *   • radius                         — border-radius tokens
 *   • font / fontSize / text         — typography scale
 *   • elevation                      — elevation levels
 *   • press / focus / disabled …     — interaction states
 *   • ui.*                           — component recipes
 *   • orderTone / paymentTone …      — status colour maps
 */
export {
  palette,
  color,
  chartColors,
  space,
  layout,
  radius,
  font,
  fontSize,
  opacity,
  motion,
  zIndex,
} from './tokens';
export { text } from './typography';
export type { TextVariant } from './typography';
export { elevation } from './elevation';
export type { ElevationLevel } from './elevation';
export { press, focus, disabled, switchProps, hitSlop, haptics } from './interaction';
export {
  orderStatus,
  paymentStatus,
  walletReason,
  orderTone,
  paymentTone,
  walletTone,
} from './status';
export type { StatusTone } from './status';

import * as ui from './components';
export { ui };
