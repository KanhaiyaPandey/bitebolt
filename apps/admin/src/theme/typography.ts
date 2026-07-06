/**
 * Design System · Typography scale
 *
 * Ready-to-spread `TextStyle` presets. Each preset fixes fontFamily +
 * fontSize + lineHeight only — colour is applied by the caller so type and
 * colour stay independently composable:
 *
 *   <Text style={[text.h2, { color: color.textPrimary }]}>Orders</Text>
 */
import type { TextStyle } from 'react-native';

import { font, fontSize } from './tokens';

export const text = {
  // Display — large numerics (metric values), brand hero titles
  display: { fontFamily: font.bold, fontSize: fontSize.display, lineHeight: 38 },

  // Headings
  h1: { fontFamily: font.bold, fontSize: fontSize.h1, lineHeight: 30 },
  h2: { fontFamily: font.bold, fontSize: fontSize.h2, lineHeight: 26 }, // screen titles
  h3: { fontFamily: font.bold, fontSize: fontSize.h3, lineHeight: 24 }, // sheet titles

  // Section / list titles
  titleMd: { fontFamily: font.semibold, fontSize: fontSize.bodyLg, lineHeight: 22 },

  // Body
  bodyLg: { fontFamily: font.medium, fontSize: fontSize.bodyLg, lineHeight: 22 },
  body: { fontFamily: font.regular, fontSize: fontSize.body, lineHeight: 20 },
  bodyStrong: { fontFamily: font.semibold, fontSize: fontSize.body, lineHeight: 20 },

  // Emphasis — prices, order numbers, avatar initials (15px bold)
  emphasis: { fontFamily: font.bold, fontSize: fontSize.md, lineHeight: 20 },

  // Labels
  label: { fontFamily: font.semibold, fontSize: fontSize.label, lineHeight: 18 },
  labelMuted: { fontFamily: font.medium, fontSize: fontSize.label, lineHeight: 18 },

  // Captions
  caption: { fontFamily: font.regular, fontSize: fontSize.caption, lineHeight: 16 },
  captionStrong: { fontFamily: font.semibold, fontSize: fontSize.caption, lineHeight: 16 },

  // Micro
  overline: { fontFamily: font.semibold, fontSize: fontSize.overline, lineHeight: 14 },
  tiny: { fontFamily: font.semibold, fontSize: fontSize.tiny, lineHeight: 13 },

  // Actions
  button: { fontFamily: font.bold, fontSize: fontSize.h3, lineHeight: 24 }, // primary CTA
  buttonSm: { fontFamily: font.semibold, fontSize: fontSize.md, lineHeight: 20 }, // secondary buttons
} satisfies Record<string, TextStyle>;

export type TextVariant = keyof typeof text;
