/**
 * Cubby design tokens. Source of truth: the "Cubby design system" board on the design canvas.
 * Semantic tokens alias primitives, so every screen ships in light and dark from one source.
 * Contrast ratios are WCAG 2.2 against the page background (from the board).
 */

// ---------- primitives -------------------------------------------------------
export const primitive = {
  lime: '#B8FF4A',
  ink: '#0A0A0A',
  paper: '#F4F4EF',
  white: '#FFFFFF',
} as const;

/** Asset palette: planets, tiles and chart marks ONLY. Always put ink (#0A0A0A) text on top of these. */
export const assetPalette = {
  eth: '#B8FF4A',
  usdc: '#8FC4FF',
  btc: '#FFC94A',
  nft: '#FF9A9A',
  defi: '#E8E4FF',
  sol: '#E8E4FF',
  pol: '#FF9A9A',
} as const;

// ---------- semantic colours -------------------------------------------------
export type Palette = {
  bg: string;
  surface: string;
  surface2: string;
  /** floating tab bar background */
  bar: string;
  /** inactive icon colour on the tab bar (design: #8F8F8A light, #8F8F8F dark) */
  tabInactive: string;
  text: string;
  textSecondary: string;
  /** Hairline borders on cards, chips, inputs */
  border: string;
  /** Fill colour. Lime is NEVER small text on light. Use as a fill, a marker, or a big number on dark. */
  accent: string;
  /** Text on top of the accent fill (always ink) */
  onAccent: string;
  positive: string;
  negative: string;
  caution: string;
  /** Chip backgrounds (sign or icon always accompanies colour) */
  positiveTint: string;
  negativeTint: string;
  cautionTint: string;
  neutralTint: string;
  /** Outline + hard shadow used on tactile buttons ("press sinks 3px, shadow collapses") */
  buttonEdge: string;
  /** Secondary text used inside the black "story" card */
  storyMuted: string;
};

export const light: Palette = {
  bg: '#F4F4EF', // 
  surface: '#FFFFFF',
  surface2: '#EDEDE6',
  bar: '#0A0A0A',
  tabInactive: '#8F8F8A',
  text: '#0A0A0A', //            17.9:1 on bg
  textSecondary: '#5C5C56', //   6.1:1
  border: 'rgba(10,10,10,0.09)',
  accent: '#B8FF4A', //          ink on it 16.4:1
  onAccent: '#0A0A0A',
  positive: '#2E6600', //        6.3:1
  negative: '#C22A2A', //        5.2:1
  caution: '#8A5300', //         5.7:1
  positiveTint: '#E4F5C8',
  negativeTint: '#FBE3E1',
  cautionTint: '#FFF0D6',
  neutralTint: '#EDEDE6',
  buttonEdge: '#0A0A0A',
  storyMuted: '#A3A39C',
};

export const dark: Palette = {
  bg: '#050505',
  surface: '#111111',
  surface2: '#1A1A1A',
  bar: '#161616',
  tabInactive: '#8F8F8F',
  text: '#F5F5F5', //            18.7:1
  textSecondary: '#8F8F8F', //   6.3:1
  border: 'rgba(255,255,255,0.09)',
  accent: '#B8FF4A',
  onAccent: '#0A0A0A',
  positive: '#B8FF4A', //        16.9:1
  negative: '#FF6B6B', //        7.3:1
  caution: '#FFB84A', //         11.8:1
  positiveTint: 'rgba(184,255,74,0.12)',
  negativeTint: 'rgba(255,107,107,0.12)',
  cautionTint: 'rgba(255,184,74,0.12)',
  neutralTint: '#1A1A1A',
  buttonEdge: '#F5F5F5',
  storyMuted: '#8F8F8F',
};

export const palettes = { light, dark } as const;
export type Scheme = keyof typeof palettes;

// ---------- type -------------------------------------------------------------
/**
 * Fonts: Geist (UI) + Geist Mono (addresses) + Doto (dot-matrix, headline numbers ONLY:
 * net worth, health score, recap stats. Never tables or body copy).
 * Expo: `@expo-google-fonts/geist`, `@expo-google-fonts/geist-mono`, `@expo-google-fonts/doto`.
 * Numbers that change or align MUST use tabular numerals (fontVariant: ['tabular-nums']).
 * WEIGHT NOTE: the design uses Geist 650 in places. Static Expo font builds only ship 100-step weights, so we map 650 -> '600'.
 * (If you load the Geist variable font you may use 650 exactly.)
 */
export const fonts = {
  ui: 'Geist', // load weights 400, 500, 600, 700
  mono: 'GeistMono',
  dot: 'Doto', // weight 900
} as const;

export const type = {
  numeral: { fontFamily: 'Doto', fontWeight: '900', fontSize: 62, letterSpacing: -1.2 }, // + cents at 30px, textSecondary
  numeralCents: { fontFamily: 'Doto', fontWeight: '900', fontSize: 30 },
  display: { fontFamily: 'Geist', fontWeight: '600', fontSize: 46, letterSpacing: -2.3, lineHeight: 46 },
  title: { fontFamily: 'Geist', fontWeight: '600', fontSize: 36, letterSpacing: -1.4 },
  title2: { fontFamily: 'Geist', fontWeight: '600', fontSize: 20, letterSpacing: -0.4 },
  body: { fontFamily: 'Geist', fontWeight: '400', fontSize: 16, lineHeight: 24 },
  bodySmall: { fontFamily: 'Geist', fontWeight: '400', fontSize: 14 },
  label: { fontFamily: 'Geist', fontWeight: '600', fontSize: 13 },
  mono: { fontFamily: 'GeistMono', fontSize: 12 },
} as const;

/** Numeral face is a tweak so it can be A/B tested: 'dot-matrix' (default) or 'geist' (weight 620, letterSpacing -0.055em). */
export type NumeralFace = 'dot-matrix' | 'geist';

// ---------- shape ------------------------------------------------------------
export const radius = { card: 28, cardLg: 30, tile: 20, chip: 20, pill: 999, control: 24, button: 27, sticker: 0 } as const;
export const space = { screenX: 20, gap: 12, gapLg: 24 } as const;
/** Minimum touch target everywhere: 44. Buttons 48–54. Tab items 48. */
export const hit = { min: 44, tab: 48, button: 54 } as const;
export const screen = { designWidth: 390 } as const;

/**
 * Tactile button: 2px ink outline + hard 0-blur shadow 4px down (primary CTA) / 3px (secondary).
 * On press: translateY 3px and the shadow collapses to 0. 120ms.
 */
export const buttonShadow = { primary: 4, secondary: 3 } as const;

/** "Graph paper" page background used on the rare, fun screens (Universe, Milestone). */
export const graphPaper = { cell: 26, line: 'rgba(10,10,10,0.045)' } as const;

// ---------- motion (durations in ms) -----------------------------------------
export const motion = {
  press: 120, // button sinks 3px + light haptic
  state: 240, // chips, ranges, tab label grow; ease-out
  rise: 700, //  cards/rows entering: opacity 0→1, translateY 16→0
  riseRow: 550,
  pop: 700,
  fade: 900,
  draw: 1500, // chart line draws itself
  countUp: 1300, // net worth count-up, easeOutQuart
  universeZoom: 900,
  scoreBar: 700,
  /** Spring for physical things: trays, Universe zoom, sticker pop */
  spring: { damping: 18, stiffness: 200 },
  /** cubic-bezier(.22,1,.36,1), the default "ease-out expo" of the whole app */
  easeOut: [0.22, 1, 0.36, 1] as const,
  /** cubic-bezier(.65,0,.35,1), used for the chart draw-in */
  easeInOut: [0.65, 0, 0.35, 1] as const,
  /** cubic-bezier(.3,.1,.6,1), used for confetti */
  easeFall: [0.3, 0.1, 0.6, 1] as const,
} as const;

// ---------- health levels ----------------------------------------------------
export function levelForScore(score: number): 1 | 2 | 3 | 4 {
  if (score >= 90) return 4;
  if (score >= 80) return 3;
  if (score >= 60) return 2;
  return 1;
}
export function labelForScore(score: number): 'Excellent' | 'Great' | 'Good' | 'Fair' {
  if (score >= 94) return 'Excellent';
  if (score >= 90) return 'Great';
  if (score >= 80) return 'Good';
  return 'Fair'; // NOTE: only 'Good' / 'Great' / 'Excellent' are designed. 'Fair' is a placeholder for <80, confirm copy.
}
