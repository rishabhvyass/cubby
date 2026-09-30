/**
 * Confetti — the milestone celebration (design: V2Milestone, keyframe `nx-fall`).
 * 26 pieces, each falls translateY -30 -> 340, rotates 0 -> 320deg, opacity 0 -> 1 (at 10%) -> 0. Runs 2 iterations.
 * Easing cubic-bezier(.3,.1,.6,1).
 *
 * RULES (design system):
 *  - ONLY for milestones and care (new sticker, level up). NEVER for price gains, PnL or trades.
 *  - Reduce Motion: render nothing. The screen already shows the static sticker.
 *
 * Usage: place inside the screen, over the sticker area, e.g. <Confetti /> (container is 390x330 at top 60).
 */
import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withDelay,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { easeFall } from './motion';

type Piece = { left: number; w: number; h: number; color: string; dur: number; delay: number };

/** Extracted 1:1 from the design board. Colors are the asset palette + ink. */
export const CONFETTI_PIECES: Piece[] = [
  { left: 85, w: 12, h: 12, color: '#B8FF4A', dur: 3.3, delay: 0.95 },
  { left: 195, w: 8, h: 8, color: '#FFC94A', dur: 5.02, delay: 1.4 },
  { left: 27, w: 10, h: 10, color: '#FF9A9A', dur: 4.04, delay: 0.21 },
  { left: 54, w: 10, h: 10, color: '#8FC4FF', dur: 3.32, delay: 1.32 },
  { left: 122, w: 8, h: 8, color: '#0A0A0A', dur: 4.37, delay: 1.51 },
  { left: 303, w: 8, h: 8, color: '#E8E4FF', dur: 3.3, delay: 1.41 },
  { left: 31, w: 10, h: 10, color: '#B8FF4A', dur: 3.47, delay: 1.34 },
  { left: 81, w: 14, h: 14, color: '#FFC94A', dur: 4.34, delay: 1.3 },
  { left: 60, w: 10, h: 10, color: '#FF9A9A', dur: 4.48, delay: 1.4 },
  { left: 57, w: 12, h: 12, color: '#8FC4FF', dur: 3.33, delay: 1.31 },
  { left: 324, w: 8, h: 8, color: '#0A0A0A', dur: 4.56, delay: 0.49 },
  { left: 168, w: 14, h: 14, color: '#E8E4FF', dur: 5.05, delay: 1.12 },
  { left: 161, w: 12, h: 12, color: '#B8FF4A', dur: 3.56, delay: 0.6 },
  { left: 49, w: 10, h: 10, color: '#FFC94A', dur: 4.25, delay: 1.38 },
  { left: 237, w: 12, h: 12, color: '#FF9A9A', dur: 5.16, delay: 0.69 },
  { left: 270, w: 8, h: 8, color: '#8FC4FF', dur: 4.71, delay: 1 },
  { left: 258, w: 10, h: 10, color: '#0A0A0A', dur: 5.12, delay: 1.01 },
  { left: 293, w: 8, h: 8, color: '#E8E4FF', dur: 4.95, delay: 1.38 },
  { left: 182, w: 12, h: 12, color: '#B8FF4A', dur: 4.39, delay: 1.67 },
  { left: 43, w: 14, h: 14, color: '#FFC94A', dur: 5.09, delay: 2.02 },
  { left: 364, w: 14, h: 14, color: '#FF9A9A', dur: 3.32, delay: 1.59 },
  { left: 339, w: 12, h: 12, color: '#8FC4FF', dur: 4.56, delay: 1.39 },
  { left: 153, w: 14, h: 14, color: '#0A0A0A', dur: 4.97, delay: 1.72 },
  { left: 19, w: 12, h: 12, color: '#E8E4FF', dur: 3.91, delay: 2.26 },
  { left: 260, w: 8, h: 8, color: '#B8FF4A', dur: 4.74, delay: 0.14 },
  { left: 134, w: 10, h: 10, color: '#FFC94A', dur: 5.03, delay: 0.95 },
];

const FALL_FROM = -30;
const FALL_TO = 340;
const ITERATIONS = 2;

function ConfettiPiece({ p }: { p: Piece }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withDelay(
      p.delay * 1000,
      withRepeat(withTiming(1, { duration: p.dur * 1000, easing: easeFall }), ITERATIONS, false),
    );
  }, [p.delay, p.dur, t]);

  const style = useAnimatedStyle(() => ({
    opacity: interpolate(t.value, [0, 0.1, 1], [0, 1, 0]),
    transform: [
      { translateY: interpolate(t.value, [0, 1], [FALL_FROM, FALL_TO]) },
      { rotate: `${interpolate(t.value, [0, 1], [0, 320])}deg` },
    ],
  }));

  return (
    <Animated.View
      style={[styles.piece, { left: p.left, width: p.w, height: p.h, backgroundColor: p.color }, style]}
    />
  );
}

export function Confetti() {
  const reduce = useReducedMotion();
  if (reduce) return null;
  return (
    <View pointerEvents="none" style={styles.box} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      {CONFETTI_PIECES.map((p, i) => (
        <ConfettiPiece key={i} p={p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: { position: 'absolute', top: 60, left: 0, width: 390, height: 330, overflow: 'hidden' },
  piece: { position: 'absolute', top: 0 },
});
