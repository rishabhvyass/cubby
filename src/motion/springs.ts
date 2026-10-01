/**
 * iOS-style springs for Reanimated — the heart of the "butter" feel.
 * Full guide: docs/SMOOTH_ANIMATION.md
 *
 * Apple describes springs as (response, dampingFraction):
 *   response        = time of one undamped oscillation, in seconds (smaller = snappier)
 *   dampingFraction = 1 → no overshoot (critically damped); < 1 → bounce
 * Reanimated wants (mass, stiffness, damping), so we convert:
 *   stiffness = mass · (2π / response)²
 *   damping   = 4π · dampingFraction · mass / response        (mass = 1)
 *
 * RULES
 *  - Anything the user touches or drags uses a SPRING (it keeps the finger's velocity). Timing curves are only for
 *    things nobody is touching (an entrance, a chart drawing).
 *  - Re-assigning `sv.value = withSpring(newTarget, …)` mid-flight keeps the current velocity: that's what makes
 *    interrupted animations feel continuous. Never reset the value first.
 *  - UI chrome (tab bar, chips, sheets) = no bounce or a hint of it. Bounce is for delight moments only (stickers).
 */
import { withSpring, withTiming, Easing, type WithSpringConfig, type WithTimingConfig } from 'react-native-reanimated';

/** Convert Apple (response, dampingFraction) to a Reanimated spring config. */
export function springFrom(response: number, dampingFraction: number, extra: Partial<WithSpringConfig> = {}): WithSpringConfig {
  'worklet';
  const mass = 1;
  return {
    mass,
    stiffness: mass * Math.pow((2 * Math.PI) / response, 2),
    damping: (4 * Math.PI * dampingFraction * mass) / response,
    // Stop sub-pixel jitter: without these a spring can keep "settling" at 0.001px for a second, burning frames.
    // Reanimated 3 reads these two; Reanimated 4 ignores them and uses its own energyThreshold (fine either way),
    // hence the cast: the typings only know one generation.
    restDisplacementThreshold: 0.01,
    restSpeedThreshold: 0.5,
    ...extra,
  } as unknown as WithSpringConfig;
}

/** The Cubby spring vocabulary. Pick by FEEL, not by number. */
export const springs = {
  /** SwiftUI `.smooth`: no bounce. Default for chrome: moving panels, indicators, cards re-ordering. */
  smooth: springFrom(0.5, 1),
  /** SwiftUI `.snappy`: a hair of overshoot, quick. Tab bar pill, segmented control, chips. */
  snappy: springFrom(0.42, 0.86),
  /** SwiftUI `.bouncy`: visible bounce. Stickers, mascot level-up, celebratory pops ONLY. */
  bouncy: springFrom(0.5, 0.7),
  /** Slow, soft, no bounce. Big surfaces: hero cards, Universe zoom, full-screen fades. */
  gentle: springFrom(0.6, 1),
  /** Very fast. Press-down / press-up scale. Feels instant, still has no hard stop. */
  press: springFrom(0.22, 0.9),
  /** SwiftUI `.interactiveSpring(response: 0.15, dampingFraction: 0.86)`: follows a finger being dragged. */
  interactive: springFrom(0.15, 0.86),
  /** Bottom sheets / trays settling after a drag. */
  sheet: springFrom(0.45, 0.92),
  /** SwiftUI default `.spring()`: response 0.5, damping 0.825. Good generic fallback. */
  standard: springFrom(0.5, 0.825),
} as const;

export type SpringName = keyof typeof springs;

/** `sv.value = spring(1, 'snappy')` */
export function spring(to: number, name: SpringName = 'smooth', velocity?: number) {
  'worklet';
  return withSpring(to, velocity === undefined ? springs[name] : { ...springs[name], velocity });
}

// ---- Timing curves (for things nobody is touching) ---------------------------------------------------------------
export const curves = {
  /** The app's default ease-out (design token): cubic-bezier(.22, 1, .36, 1). */
  easeOut: Easing.bezier(0.22, 1, 0.36, 1),
  /** iOS "ease in-out" (UIKit .curveEaseInOut ≈ CSS ease-in-out). */
  easeInOut: Easing.bezier(0.42, 0, 0.58, 1),
  /** Exits should be quicker and start slow: ease-in. */
  easeIn: Easing.bezier(0.5, 0, 0.75, 0),
  /** Chart line drawing. */
  draw: Easing.bezier(0.65, 0, 0.35, 1),
} as const;

/** Durations (ms). Enter ≈ 1× , exit ≈ 0.7× (leaving should feel quicker than arriving). */
export const durations = { micro: 120, small: 220, medium: 320, large: 450, enter: 700, exitFactor: 0.7 } as const;

export function timing(to: number, ms: number = durations.small, easing = curves.easeOut, config: Partial<WithTimingConfig> = {}) {
  'worklet';
  return withTiming(to, { duration: ms, easing, ...config });
}

// ---- Rubber band (iOS overscroll feel) ---------------------------------------------------------------------------
/**
 * UIScrollView's rubber-banding: the further you pull past the edge, the more resistance.
 * `offset` = how far past the limit the finger is, `dimension` = size of the scrollable viewport, `c` = 0.55 (Apple's constant).
 * Use when you drag a custom surface (sheet, card) past its limit, then spring back with `spring(0, 'smooth')`.
 */
export function rubberBand(offset: number, dimension: number, c = 0.55) {
  'worklet';
  const sign = offset < 0 ? -1 : 1;
  const x = Math.abs(offset);
  return sign * (1 - 1 / ((x * c) / dimension + 1)) * dimension;
}

// ---- Haptics map (expo-haptics) ----------------------------------------------------------------------------------
/**
 * Haptics are stubbed: this is a bare React Native app without `expo-haptics`.
 * To enable, install a haptics package (e.g. react-native-haptic-feedback) and call it in these functions.
 * Keep the call sites: they already fire at commit moments only.
 */
const noop = () => {};
export const haptic = {
  tap: noop,
  select: noop,
  success: noop,
  error: noop,
  soft: noop,
};
