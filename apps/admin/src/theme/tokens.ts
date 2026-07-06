/**
 * BiteBolt Admin — Design System · Primitive Tokens
 *
 * The single source of truth for every raw value used in the admin app.
 * Screens and components MUST NOT hardcode hex colours, pixel spacing,
 * radii, or font strings — import from `@/theme` instead.
 *
 * Scales are intentionally small and named. If a value you need is not in a
 * scale, it does not belong in the design — reach for the nearest token.
 */

// ── Palette · raw brand + neutral + semantic hues ───────────────────────────
// Never consumed directly by UI. Use the semantic `color` map below.
export const palette = {
  // Brand orange ramp (mirrors tailwind primary.*)
  orange50: '#FFF4EE',
  orange100: '#FFE4D5',
  orange200: '#FFC9AB',
  orange300: '#FFA577',
  orange400: '#FA8D52',
  orange500: '#FA7938', // brand
  orange600: '#E8641E',
  orange700: '#C84F12',
  orange800: '#A63C0A',
  orange900: '#872E06',

  // Ink / neutral ramp
  ink900: '#1A1A2E', // display headings, numeric emphasis
  ink700: '#414158', // primary text
  ink500: '#9098B1', // secondary text
  ink300: '#C4C9D4', // muted text / faint icons
  ink200: '#D3D6DE', // disabled fills / handle bar
  slate400: '#A0AABF', // inactive nav / placeholder on brand

  // Surface / border neutrals
  white: '#FFFFFF',
  cloud: '#FAFBFC', // app background
  mist: '#EEEEF5', // sunken track / placeholder
  fog: '#F5F5FA', // subtle fill (inactive chips, secondary btn)
  line100: '#F0F0F8', // hairline dividers under headers
  line200: '#E8E8F0', // input borders
  line300: '#E0E0EA', // strong borders / switch-off track
  shadowNav: '#1A1A24', // tint for floating nav shadow

  // Semantic hues
  green500: '#10B981',
  amber500: '#F59E0B',
  red500: '#EF4444',
  blue500: '#3B82F6',
  violet500: '#8B5CF6',
  indigo400: '#808AFF',
} as const;

// ── Colour · semantic roles (this is what UI consumes) ──────────────────────
export const color = {
  // Surfaces (3-tier system)
  bg: palette.cloud, // screen background
  surface: palette.white, // cards, inputs, sheets
  surfaceSubtle: palette.fog, // secondary buttons, inactive chips
  track: palette.mist, // segmented-control track, image placeholder

  // Brand
  brand: palette.orange500,
  brandSubtle: palette.orange50, // tinted badge/avatar/icon-tile fills

  // Text
  textHeading: palette.ink900,
  textPrimary: palette.ink700,
  textSecondary: palette.ink500,
  textMuted: palette.ink300,
  onBrand: palette.white,
  onBrandMuted: 'rgba(255,255,255,0.85)',
  navInactive: palette.slate400, // inactive bottom-tab icon + label

  // Borders / dividers
  borderSubtle: palette.line100,
  borderMuted: palette.line200,
  borderStrong: palette.line300,

  // Semantic
  success: palette.green500,
  warning: palette.amber500,
  error: palette.red500,
  info: palette.blue500,

  // Disabled
  disabled: palette.ink200,
} as const;

// Categorical palette for data-viz accents (metric icons, ranks, chart series).
export const chartColors = [
  color.brand,
  color.success,
  palette.indigo400,
  color.warning,
  color.info,
  palette.violet500,
] as const;

// ── Spacing · 4-point grid ──────────────────────────────────────────────────
export const space = {
  0: 0,
  0.5: 2,
  1: 4,
  1.5: 6,
  2: 8,
  2.5: 10,
  3: 12,
  3.5: 14,
  4: 16,
  5: 20,
  6: 24,
  7: 28,
  8: 32,
  9: 36,
  10: 40,
  12: 48,
  14: 56,
  16: 64,
} as const;

// Layout constants derived from the spacing grid.
export const layout = {
  screenX: space[4], // 16 — canonical horizontal gutter for every screen
  gutter: space[4],
  cardGap: space[3], // 12 — vertical gap between list cards
  listBottomInset: 110, // clears the floating tab bar
  fabOffset: 110, // FAB bottom offset (above tab bar)
} as const;

// ── Radius ──────────────────────────────────────────────────────────────────
export const radius = {
  none: 0,
  control: 12, // search bar, small icon tiles, image tiles
  button: 14, // secondary buttons, OTP boxes
  field: 16, // primary CTA + large text inputs
  card: 16, // list rows, order cards
  panel: 24, // metric cards, dashboard panels, tab bar, bottom sheets
  hero: 32, // brand hero headers / auth sheets
  full: 9999, // pills, badges, chips, avatars, FAB
} as const;

// ── Typography · families + type ramp ───────────────────────────────────────
export const font = {
  regular: 'Urbanist',
  medium: 'Urbanist-Medium',
  semibold: 'Urbanist-SemiBold',
  bold: 'Urbanist-Bold',
} as const;

export const fontSize = {
  tiny: 10,
  overline: 11,
  caption: 12,
  label: 13,
  body: 14,
  md: 15, // interactive / emphasis step (prices, order #, secondary buttons)
  bodyLg: 16,
  h3: 18,
  h2: 20,
  h1: 24,
  display: 32,
} as const;

// ── Opacity ─────────────────────────────────────────────────────────────────
export const opacity = {
  disabled: 0.4,
  overlay: 0.2, // frosted controls on brand surfaces
  overlayStrong: 0.15,
} as const;

// ── Motion · durations (ms) + stagger ───────────────────────────────────────
export const motion = {
  fast: 150, // clear/close micro-transitions
  base: 300, // entrances, tab/segment slides
  slow: 600, // hero entrances
  press: 250, // segmented pill slide
  stagger: 55, // per-item list-entry delay (index * stagger)
  skeleton: 700, // one half of the pulse cycle
} as const;

// ── Z-index ─────────────────────────────────────────────────────────────────
export const zIndex = {
  base: 0,
  card: 1,
  fab: 10,
  header: 20,
  sheet: 30,
  toast: 40,
} as const;
