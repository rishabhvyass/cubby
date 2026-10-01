/**
 * Net-worth count-up that runs ENTIRELY on the UI thread (no React re-render per frame → no dropped frames).
 * Replaces the older `useCountUp` (which called setState every frame on the JS thread). Keep `useCountUp` only for tests.
 *
 * How: a read-only <TextInput> whose `text` prop is driven by a shared value via useAnimatedProps.
 * Formatting is done by hand in the worklet (Intl / toLocaleString are not reliably available on the UI runtime).
 *
 * Design: 0 → value, 1300 ms, easeOutQuart (1 - (1-k)^4), runs on every open of Home. Dollars in Doto 62, cents smaller.
 * Reduce Motion: shows the final value immediately.
 *
 *   <AnimatedDollars value={24821.42} dollarStyle={...doto62} centsStyle={...doto30} />
 */
import React, { useEffect } from 'react';
import { StyleProp, StyleSheet, TextInput, TextStyle, View } from 'react-native';
import Animated, { Easing, useAnimatedProps, useReducedMotion, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { motion } from '../theme/tokens';

const AnimatedInput = Animated.createAnimatedComponent(TextInput);

/** 24821 -> "24,821". Worklet-safe (no Intl). */
export function groupThousands(n: number) {
  'worklet';
  const s = String(Math.floor(Math.abs(n)));
  let out = '';
  for (let i = 0; i < s.length; i++) {
    out += s[i];
    const left = s.length - 1 - i;
    if (left > 0 && left % 3 === 0) out += ',';
  }
  return (n < 0 ? '-' : '') + out;
}

/** easeOutQuart as a plain function so the count and the curve match the design exactly. */
const easeOutQuart = Easing.bezier(0.25, 1, 0.5, 1); // closest cubic-bezier to 1-(1-k)^4

function useProgress(durationMs: number, delayMs: number) {
  const reduced = useReducedMotion();
  const p = useSharedValue(reduced ? 1 : 0);
  useEffect(() => {
    if (reduced) {
      p.value = 1;
      return;
    }
    p.value = 0;
    p.value = withDelay(delayMs, withTiming(1, { duration: durationMs, easing: easeOutQuart }));
  }, [durationMs, delayMs, reduced, p]);
  return p;
}

type Common = { style?: StyleProp<TextStyle>; durationMs?: number; delayMs?: number };

/** One animated whole-number text: "$24,821". `prefix` e.g. '$'. */
export function AnimatedWhole({ value, prefix = '$', style, durationMs = motion.countUp, delayMs = 0 }: Common & { value: number; prefix?: string }) {
  const p = useProgress(durationMs, delayMs);
  const props = useAnimatedProps(() => {
    const v = Math.floor(value * p.value);
    const text = prefix + groupThousands(v);
    return { text, defaultValue: text } as any; // `text` isn't in TextInput's typings; this is the documented Reanimated pattern
  });
  return <AnimatedInput editable={false} pointerEvents="none" underlineColorAndroid="transparent" style={[styles.input, style]} animatedProps={props} />;
}

/** Cents ".42" that counts together with the whole part. */
export function AnimatedCents({ value, style, durationMs = motion.countUp, delayMs = 0 }: Common & { value: number }) {
  const p = useProgress(durationMs, delayMs);
  const props = useAnimatedProps(() => {
    const v = value * p.value;
    const c = Math.min(99, Math.round((v - Math.floor(v)) * 100));
    const text = '.' + (c < 10 ? '0' + c : String(c));
    return { text, defaultValue: text } as any;
  });
  return <AnimatedInput editable={false} pointerEvents="none" underlineColorAndroid="transparent" style={[styles.input, style]} animatedProps={props} />;
}

/** The Home hero: `$24,821` + `.42`, baseline-aligned. */
export function AnimatedDollars({
  value,
  dollarStyle,
  centsStyle,
  durationMs,
  delayMs,
}: {
  value: number;
  dollarStyle?: StyleProp<TextStyle>;
  centsStyle?: StyleProp<TextStyle>;
  durationMs?: number;
  delayMs?: number;
}) {
  return (
    <View style={styles.row} accessible accessibilityRole="text" accessibilityLabel={`Net worth ${value.toFixed(2)} dollars`}>
      <AnimatedWhole value={value} style={dollarStyle} durationMs={durationMs} delayMs={delayMs} />
      <AnimatedCents value={value} style={centsStyle} durationMs={durationMs} delayMs={delayMs} />
    </View>
  );
}

const styles = StyleSheet.create({
  // TextInput has default padding/background on Android; neutralise so it renders like a Text
  input: { padding: 0, margin: 0, backgroundColor: 'transparent', includeFontPadding: false },
  row: { flexDirection: 'row', alignItems: 'flex-end' },
});
