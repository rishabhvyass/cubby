/**
 * Cubby motion presets for react-native-reanimated (v3+).
 * Every preset is a 1:1 port of a keyframe in the design (names in comments: `nx-*`).
 * Full catalogue, timings and where each is used: docs/ANIMATIONS.md
 *
 * REDUCE MOTION (design rule): "Fades only. Confetti becomes a static sticker. Haptics still confirm."
 * Every hook below checks useReducedMotion() and falls back to a plain fade (or nothing).
 */
import { useEffect, useState } from 'react';
import Animated, {
  Easing,
  interpolate,
  useAnimatedProps,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { Circle, Path } from 'react-native-svg';
import { motion } from '../theme/tokens';
import { springs } from './springs';

type Bezier = readonly [number, number, number, number];
const bez = (b: Bezier) => Easing.bezier(b[0], b[1], b[2], b[3]);

export const easeOut = bez(motion.easeOut); // cubic-bezier(.22,1,.36,1)
export const easeInOutCurve = bez(motion.easeInOut); // cubic-bezier(.65,0,.35,1)
export const easeFall = bez(motion.easeFall); // cubic-bezier(.3,.1,.6,1)
const sine = Easing.inOut(Easing.ease); // CSS "ease-in-out"

export const AnimatedCircle = Animated.createAnimatedComponent(Circle);
export const AnimatedPath = Animated.createAnimatedComponent(Path);

/** Progress 0→1 once, after `delay`. */
function useOnce(duration: number, delay: number, easing = easeOut) {
  const p = useSharedValue(0);
  useEffect(() => {
    p.value = withDelay(delay, withTiming(1, { duration, easing }));
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  return p;
}

/** Progress 0→1→0 forever (CSS `infinite` with 0%,100% / 50% keyframes). */
function usePingPong(duration: number, delay = 0, easing = sine, enabled = true) {
  const p = useSharedValue(0);
  useEffect(() => {
    if (!enabled) return;
    p.value = withDelay(
      delay,
      withRepeat(withSequence(withTiming(1, { duration: duration / 2, easing }), withTiming(0, { duration: duration / 2, easing })), -1, false),
    );
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps
  return p;
}

// ---------------------------------------------------------------------------------
// nx-rise: opacity 0→1, translateY 16→0, .7s ease-out. Cards, headings, story.
export function useRise(delayMs = 0, duration: number = motion.rise) {
  const reduced = useReducedMotion();
  const p = useOnce(duration, delayMs);
  return useAnimatedStyle(() => ({ opacity: p.value, transform: [{ translateY: reduced ? 0 : (1 - p.value) * 16 }] }));
}

/** nx-row: same as rise but .55s, staggered 40ms per row (nth-child(2)=.04s, (3)=.08s ...). */
export function useRow(index: number) {
  return useRise(index * 40, motion.riseRow);
}

// nx-pop: scale .6→1.06→1, rotate -8°→2°→0, opacity 0→1 by 60%. Stickers, mascot, unlock cards.
export function usePop(delayMs = 0, duration: number = motion.pop) {
  const reduced = useReducedMotion();
  const p = useOnce(duration, delayMs);
  return useAnimatedStyle(() => ({
    opacity: interpolate(p.value, [0, 0.6, 1], [0, 1, 1]),
    transform: reduced
      ? []
      : [{ scale: interpolate(p.value, [0, 0.6, 1], [0.6, 1.06, 1]) }, { rotate: `${interpolate(p.value, [0, 0.6, 1], [-8, 2, 0])}deg` }],
  }));
}

// nx-fade: opacity 0→1, .9s.
export function useFade(delayMs = 0, duration: number = motion.fade) {
  const p = useOnce(duration, delayMs);
  return useAnimatedStyle(() => ({ opacity: p.value }));
}

// nx-float: translateY 0→-8→0 forever, keeps its own tilt (`--r`). Mascot 6s; Universe planets 4.6s + i*0.8s; welcome stickers 5s.
export function useFloat({ tiltDeg = 0, durationMs = 5000, delayMs = 0 }: { tiltDeg?: number; durationMs?: number; delayMs?: number } = {}) {
  const reduced = useReducedMotion();
  const p = usePingPong(durationMs, delayMs, sine, !reduced);
  return useAnimatedStyle(() => ({ transform: [{ translateY: reduced ? 0 : interpolate(p.value, [0, 1], [0, -8]) }, { rotate: `${tiltDeg}deg` }] }));
}

// nx-wobble: rotate -4°↔4° forever. Health "risky" flag 1.6s; Milestone sticker 3.2s.
export function useWobble(durationMs = 1600) {
  const reduced = useReducedMotion();
  const p = usePingPong(durationMs, 0, sine, !reduced);
  return useAnimatedStyle(() => ({ transform: [{ rotate: `${reduced ? 0 : interpolate(p.value, [0, 1], [-4, 4])}deg` }] }));
}

// nx-nudge: translateY 0→6→0 forever, 1.2s. The "receive" arrow on the empty state.
export function useNudge(durationMs = 1200) {
  const reduced = useReducedMotion();
  const p = usePingPong(durationMs, 0, sine, !reduced);
  return useAnimatedStyle(() => ({ transform: [{ translateY: reduced ? 0 : interpolate(p.value, [0, 1], [0, 6]) }] }));
}

// nx-spin: 360° linear, 18s forever. Slow orbit on the Home Universe card.
export function useSpin(durationMs = 18000) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    p.value = withRepeat(withTiming(1, { duration: durationMs, easing: Easing.linear }), -1, false);
  }, [reduced]); // eslint-disable-line react-hooks/exhaustive-deps
  return useAnimatedStyle(() => ({ transform: [{ rotate: `${p.value * 360}deg` }] }));
}

// nx-shimmer: skeleton loading. A soft highlight sweeps left→right, 1.4s linear, forever.
// Design (V1 States board, dark): base #111 → highlight #1C1C1C → base, gradient 400px wide. RECOMMENDATION for light: surface2 → a slightly lighter tint.
// Usage: put a LinearGradient (expo-linear-gradient), width 400, inside an overflow:'hidden' skeleton block and apply this style to it.
// Reduce Motion: static base colour, no sweep.
export function useShimmer(durationMs = 1400, travel = 400) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    p.value = withRepeat(withTiming(1, { duration: durationMs, easing: Easing.linear }), -1, false);
  }, [reduced]); // eslint-disable-line react-hooks/exhaustive-deps
  return useAnimatedStyle(() => ({ transform: [{ translateX: reduced ? 0 : interpolate(p.value, [0, 1], [-travel / 2, travel / 2]) }] }));
}

// nx-pulse: the live dot on the chart. r 5→16, opacity .7→0, 2.2s ease-out, starts at 1.6s, forever.
// Usage: <AnimatedCircle cx={342} cy={30.6} fill="none" stroke={ink} animatedProps={usePulseProps()} />
export function usePulseProps(delayMs = 1600, durationMs = 2200) {
  const reduced = useReducedMotion();
  const p = useSharedValue(0);
  useEffect(() => {
    if (reduced) return;
    p.value = withDelay(delayMs, withRepeat(withTiming(1, { duration: durationMs, easing: Easing.out(Easing.ease) }), -1, false));
  }, [reduced]); // eslint-disable-line react-hooks/exhaustive-deps
  return useAnimatedProps(() => ({ r: interpolate(p.value, [0, 1], [5, 16]), opacity: reduced ? 0 : interpolate(p.value, [0, 1], [0.7, 0]) }));
}

// nx-draw: stroke-dashoffset 1400→0, 1.5s cubic-bezier(.65,0,.35,1). The chart line "draws itself" (delay .1s);
// the gradient area under it fades in (nx-fade, delay .7s) and the end dot fades in (delay 1.4s).
// Usage: <AnimatedPath d={d} strokeDasharray={1400} animatedProps={useDrawProps()} stroke=... />
export function useDrawProps(delayMs = 100, durationMs: number = motion.draw, dash = 1400) {
  const reduced = useReducedMotion();
  const p = useOnce(reduced ? 1 : durationMs, delayMs, easeInOutCurve);
  return useAnimatedProps(() => ({ strokeDashoffset: reduced ? 0 : (1 - p.value) * dash }));
}

// nx-grow: scaleX 0→1 from the left, .9s ease-out. Story-card segment bar (delay .8s).
// scaleX would grow from the centre in RN, so animate width instead.
export function useGrowWidth(targetWidth: number, delayMs = 800, durationMs = 900) {
  const p = useOnce(durationMs, delayMs);
  return useAnimatedStyle(() => ({ width: p.value * targetWidth }));
}

// Progress-bar style transitions (score bar 700ms, recap segments 400ms, Universe opacity 500ms, chips 240ms).
export function useTimingTo(target: number, durationMs: number = motion.state) {
  const p = useSharedValue(target);
  useEffect(() => {
    p.value = withTiming(target, { duration: durationMs, easing: easeOut });
  }, [target]); // eslint-disable-line react-hooks/exhaustive-deps
  return p;
}

// Press: button sinks 3px and its hard shadow collapses. 120ms ease-out. Pair with expo-haptics ImpactFeedbackStyle.Light.
export function usePressSink(distance = 3) {
  const p = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ translateY: p.value * distance }] }));
  const shadowStyle = useAnimatedStyle(() => ({ shadowOffset: { width: 0, height: (1 - p.value) * distance } }));
  // Spring (not a 120ms tween): reverses mid-press without a jump, keeps velocity. Feels like a physical key.
  return {
    style,
    shadowStyle,
    onPressIn: () => { p.value = withSpring(1, springs.press); },
    onPressOut: () => { p.value = withSpring(0, springs.press); },
  };
}

/** Spring for physical things: sticker pop settle, trays, Universe zoom. damping 18, stiffness 200. */
export const physicalSpring = (to: number) => withSpring(to, motion.spring);

// NOTE: prefer <AnimatedDollars/> (src/motion/AnimatedNumber.tsx): same curve, runs on the UI thread. This hook re-renders React every frame.
// Net-worth count-up: 0 → target over 1300ms with easeOutQuart (1 - (1-k)^4). Runs on every open of Home.
// Returns the current number; format with toLocaleString + tabular numerals. Reduce motion: returns target at once.
export function useCountUp(target: number, durationMs: number = motion.countUp) {
  const reduced = useReducedMotion();
  const [v, setV] = useState(reduced ? target : 0);
  useEffect(() => {
    if (reduced) { setV(target); return; }
    let raf = 0;
    const t0 = Date.now();
    const step = () => {
      const k = Math.min(1, (Date.now() - t0) / durationMs);
      setV(target * (1 - Math.pow(1 - k, 4)));
      if (k < 1) raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [target, durationMs, reduced]);
  return v;
}

/** Split a dollar amount into "$24,821" + ".42" for the dot-matrix hero (cents rendered smaller, textSecondary). */
export function splitDollars(v: number) {
  const whole = Math.floor(v);
  const cents = Math.min(99, Math.round((v - whole) * 100));
  return { dollars: '$' + whole.toLocaleString('en-US'), cents: '.' + String(cents).padStart(2, '0') };
}

// Universe zoom target: the whole 390x520 stage translates/scales so the tapped planet fills the view.
// stage = translate(-x*S, -y*S - 110) scale(S), S = 2.5, .9s ease-out (or spring). Other planets fade to 0 (500ms); rings + centre dim to .06.
export function universeStage(focus: { x: number; y: number } | null, S = 2.5) {
  return focus ? { translateX: -focus.x * S, translateY: -focus.y * S - 110, scale: S } : { translateX: 0, translateY: 0, scale: 1 };
}
