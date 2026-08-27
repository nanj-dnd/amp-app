/**
 * amp design tokens
 * one source of truth for colour, type, space, radius, motion.
 * nothing in the app should hardcode a hex value.
 */

/* ---------------------------------------------------------------- palette */

// pulled from the amp mark. the deep one is the logo fill, the bright one is
// the dashed centre-line. everything green in the app derives from these two.
// sampled straight off the mark: #186D4C is the road fill, #30A06D the dashes.
const GREEN = {
  900: '#0B3F2C',
  800: '#11563B',
  700: '#186D4C', // primary — the logo green, exact
  600: '#22855E',
  500: '#30A06D', // the dashed centre line; highlights on dark greens only
  100: '#D8EBE1',
  50: '#EEF6F1',
} as const;

// score ramp. replaces the muddy tan — same warm family, but each step is a
// real semantic band instead of one flat colour doing four jobs.
// the old ramp went muddy in the middle — a brown-gold doing duty as "fair".
// these are cleaner and, critically, only ever fill shapes (rings, bars, dots).
// band *text* is neutral, so none of these has to clear a contrast bar.
const RAMP = {
  poor: '#C2452F', // < 50
  fair: '#D18A1E', // 50–69
  good: '#2E9E63', // 70–84
  elite: '#186D4C', // 85+
} as const;

export const light = {
  scheme: 'light' as 'light' | 'dark',

  // apple grouped-list model: page is the recessed layer, cards sit on top.
  bg: '#F4F4F1',
  surface: '#FFFFFF',
  surfaceAlt: '#FAFAF8',
  fill: '#EFEFEC', // inert control backgrounds (segmented track, chips)
  fillPressed: '#E5E5E1',
  fillStrong: '#DCDCD7', // locked path nodes, disabled discs
  hairline: 'rgba(0,0,0,0.07)',
  scrim: 'rgba(246,246,243,0.82)', // behind blurred chrome

  text: '#0C0C0D',
  textSecondary: '#6C6C70',
  textTertiary: '#A0A0A5',
  textOnBrand: '#FFFFFF',

  gold: '#DFA82B', // stars, streak, league — icons only, never body text
  brand: GREEN[700],
  brandPressed: GREEN[800],
  brandTint: GREEN[50],
  brandBorder: GREEN[100],
  brandBright: GREEN[500],

  danger: '#B4442E',
  dangerTint: '#FBEEEB',

  score: RAMP,

  shadow: '#0C0C0D',
} as const;

export const dark = {
  scheme: 'dark' as 'light' | 'dark',

  bg: '#0A0A0B',
  surface: '#161618',
  surfaceAlt: '#1D1D20',
  fill: '#232326',
  fillPressed: '#2C2C30',
  fillStrong: '#34343A',
  hairline: 'rgba(255,255,255,0.09)',
  scrim: 'rgba(14,14,16,0.82)',

  text: '#F5F5F4',
  textSecondary: '#9B9BA0',
  textTertiary: '#6C6C70',
  textOnBrand: '#FFFFFF',

  gold: '#F0C24F',
  brand: '#2FA271',
  brandPressed: '#26875E',
  brandTint: 'rgba(47,162,113,0.14)',
  brandBorder: 'rgba(47,162,113,0.28)',
  brandBright: '#43C98A',

  danger: '#E0705A',
  dangerTint: 'rgba(224,112,90,0.14)',

  score: {
    poor: '#EE7458',
    fair: '#EBAE45',
    good: '#43C98A',
    elite: '#2FA271',
  },

  shadow: '#000000',
} as const;

export type Palette = typeof light;

/* ------------------------------------------------------------------- type */

// archivo only. the whole app is lowercase — see <Text> which lowercases by
// default, so copy can stay sentence-case in source and read as amp on screen.
export const font = {
  regular: 'Archivo_400Regular',
  medium: 'Archivo_500Medium',
  semibold: 'Archivo_600SemiBold',
  bold: 'Archivo_700Bold',
  black: 'Archivo_800ExtraBold',
} as const;

export const type = {
  // large title, only ever one per screen
  display: { fontFamily: font.black, fontSize: 34, lineHeight: 38, letterSpacing: -1.1 },
  // the big number on a score
  score: { fontFamily: font.black, fontSize: 46, lineHeight: 48, letterSpacing: -2.2 },
  scoreSm: { fontFamily: font.black, fontSize: 30, lineHeight: 32, letterSpacing: -1.4 },
  title: { fontFamily: font.black, fontSize: 24, lineHeight: 28, letterSpacing: -0.7 },
  heading: { fontFamily: font.bold, fontSize: 18, lineHeight: 23, letterSpacing: -0.4 },
  bodyStrong: { fontFamily: font.semibold, fontSize: 16, lineHeight: 22, letterSpacing: -0.2 },
  body: { fontFamily: font.regular, fontSize: 16, lineHeight: 23, letterSpacing: -0.1 },
  callout: { fontFamily: font.medium, fontSize: 14.5, lineHeight: 20, letterSpacing: -0.1 },
  caption: { fontFamily: font.medium, fontSize: 13, lineHeight: 17, letterSpacing: 0 },
  // section eyebrows — lowercase + wide tracking instead of uppercase
  eyebrow: { fontFamily: font.semibold, fontSize: 11.5, lineHeight: 14, letterSpacing: 0.9 },
  tab: { fontFamily: font.semibold, fontSize: 10.5, lineHeight: 13, letterSpacing: 0.1 },
} as const;

/* -------------------------------------------------------- space / shape */

// 4pt grid. use the names, not the numbers.
export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
  xxxl: 40,
  gutter: 18, // the one true horizontal page inset
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 20,
  xl: 26,
  pill: 999,
} as const;

// apple shadows are wide + faint, never dark + tight.
export const elevation = {
  none: {},
  card: {
    shadowColor: light.shadow,
    shadowOpacity: 0.05,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  raised: {
    shadowColor: light.shadow,
    shadowOpacity: 0.1,
    shadowRadius: 22,
    shadowOffset: { width: 0, height: 8 },
    elevation: 8,
  },
} as const;

export const motion = {
  // ios-ish spring. used for every press + tab change.
  spring: { damping: 18, stiffness: 240, mass: 0.7 },
  fast: 140,
  base: 220,
  pressScale: 0.97,
} as const;

/* ------------------------------------------------------------- helpers */

export type ScoreBand = keyof typeof RAMP;

export function bandFor(score: number): ScoreBand {
  if (score >= 85) return 'elite';
  if (score >= 70) return 'good';
  if (score >= 50) return 'fair';
  return 'poor';
}

export const bandLabel: Record<ScoreBand, string> = {
  poor: 'needs work',
  fair: 'fair',
  good: 'good',
  elite: 'elite',
};
