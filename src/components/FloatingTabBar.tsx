/**
 * Cubby floating tab bar — geometry copied from the design (V2 boards), motion designed for an iOS "butter" feel.
 * Full spec and rationale: docs/TAB_BAR_ANIMATION.md
 *
 * DESIGN (measured from the boards)
 *   bar:     centered pill, bottom 20, padding 6, gap 4, radius 30, bg palette.bar (#0A0A0A light / #161616 dark),
 *            shadow 0 12 32 rgba(0,0,0,.18)
 *   item:    48 high. Inactive = 48×48 round, icon 21px in palette.tabInactive.
 *            Active = lime pill, padding 0 16 0 14, gap 8, icon 20px in ink + label 13px / 650 in ink.
 *
 * MOTION (this file)
 *   ONE shared value `pos` (a float index, e.g. 1.37 = 37% of the way from tab 1 to tab 2) drives everything:
 *   item widths, the lime pill, icon cross-fade, label reveal. Because everything derives from `pos`,
 *   tapping a third tab mid-flight just re-targets the spring: no restart, velocity is kept (interruptible).
 *   Spring = `snappy` (response .42, damping .86). Runs entirely on the UI thread.
 *
 * USE with expo-router / React Navigation:
 *   <Tabs tabBar={(props) => <FloatingTabBar {...props} tabs={CUBBY_TABS} />} screenOptions={{ headerShown: false }} />
 * Give screens bottom padding of TAB_BAR_CLEARANCE + safe-area bottom so content scrolls under the bar cleanly.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { LayoutChangeEvent, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Extrapolation,
  SharedValue,
  interpolate,
  useAnimatedStyle,
  useDerivedValue,
  useReducedMotion,
  useSharedValue,
  withSequence,
  withSpring,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '../art/Art';
import type { IconName } from '../art/svgs';
import { fonts, palettes, type Scheme } from '../theme/tokens';
import { haptic, springs } from '../motion/springs';

// ---------- geometry (design values) ----------------------------------------------------------------------------
export const TAB = {
  pad: 6,
  gap: 4,
  height: 48,
  inactiveWidth: 48,
  activePadLeft: 14,
  activePadRight: 16,
  iconActive: 20,
  iconInactive: 21,
  labelGap: 8,
  barRadius: 30,
  itemRadius: 24,
  labelSize: 13,
} as const;

/** Total bar height = padding + item. Add this + the bar's bottom offset + ~16 to scroll content's bottom padding. */
export const TAB_BAR_HEIGHT = TAB.pad * 2 + TAB.height; // 60
export const TAB_BAR_CLEARANCE = TAB_BAR_HEIGHT + 20 + 16; // bar + design bottom offset + breathing room

export type TabDef = { name: string; label: string; icon: IconName };

/** Cubby's four tabs. `name` must match your route names (expo-router: 'index', 'assets', 'activity', 'health'). */
export const CUBBY_TABS: TabDef[] = [
  { name: 'index', label: 'Home', icon: 'home' },
  { name: 'assets', label: 'Assets', icon: 'assets' },
  { name: 'activity', label: 'Activity', icon: 'activity' },
  { name: 'health', label: 'Health', icon: 'health' },
];

/** Structural subset of @react-navigation/bottom-tabs `BottomTabBarProps`, so it plugs straight into <Tabs tabBar>. */
export type TabBarNavProps = {
  state: { index: number; routes: ReadonlyArray<{ key: string; name: string; params?: object }> };
  navigation: {
    emit: (e: { type: 'tabPress'; target: string; canPreventDefault: true }) => { defaultPrevented: boolean };
    navigate: (name: string, params?: object) => void;
  };
};

type Props = TabBarNavProps & {
  tabs?: TabDef[];
  scheme?: Scheme;
  /** Slide the bar away (Recap, Milestone, keyboard…). Animated with a spring. */
  hidden?: boolean;
  /** Called when the already-active tab is tapped again (scroll to top, etc.). */
  onReselect?: (name: string) => void;
};

// ---------- worklet geometry --------------------------------------------------------------------------------------
/** Width of item i for a float position. a = how "active" the item is (1 on its own index, 0 one step away). */
function itemWidth(i: number, pos: number, activeW: number[]) {
  'worklet';
  const a = Math.max(0, 1 - Math.abs(pos - i));
  return TAB.inactiveWidth + a * (activeW[i] - TAB.inactiveWidth);
}

/** Left edge of item i (x inside the bar). */
function itemLeft(i: number, pos: number, activeW: number[]) {
  'worklet';
  let left = TAB.pad;
  for (let j = 0; j < i; j++) left += itemWidth(j, pos, activeW) + TAB.gap;
  return left;
}

/**
 * The lime pill = linear blend between the rects of the two items the float position sits between.
 * At every integer position it equals the active item's rect exactly; in between it slides and morphs smoothly.
 */
function pillRect(pos: number, activeW: number[], n: number) {
  'worklet';
  const p = Math.min(Math.max(pos, 0), n - 1);
  const k = Math.max(0, Math.min(Math.floor(p), n - 2));
  const f = n > 1 ? p - k : 0;
  const wk = itemWidth(k, p, activeW);
  const wk1 = n > 1 ? itemWidth(k + 1, p, activeW) : wk;
  return { left: itemLeft(k, p, activeW) + f * (wk + TAB.gap), width: wk * (1 - f) + wk1 * f };
}

// ---------- component ---------------------------------------------------------------------------------------------
export function FloatingTabBar({ state, navigation, tabs = CUBBY_TABS, scheme = 'light', hidden = false, onReselect }: Props) {
  const palette = palettes[scheme];
  const insets = useSafeAreaInsets();
  const reduced = useReducedMotion();
  const n = tabs.length;

  // route name -> tab index (so extra routes in the navigator don't break the bar)
  const items = useMemo(
    () => tabs.map((t) => ({ tab: t, route: state.routes.find((r) => r.name === t.name) })).filter((x) => x.route),
    [tabs, state.routes],
  );
  const activeName = state.routes[state.index]?.name;
  const activeIndex = Math.max(0, items.findIndex((x) => x.tab.name === activeName));

  // measured label widths -> active item widths (fallback estimate until measured)
  const [labelW, setLabelW] = useState<number[]>(() => tabs.map((t) => Math.ceil(t.label.length * 7.4)));
  const activeW = useSharedValue<number[]>(labelW.map((w) => TAB.activePadLeft + TAB.iconActive + TAB.labelGap + w + TAB.activePadRight));
  useEffect(() => {
    activeW.value = labelW.map((w) => TAB.activePadLeft + TAB.iconActive + TAB.labelGap + w + TAB.activePadRight);
  }, [labelW, activeW]);

  // THE shared value: float index of the active tab.
  const pos = useSharedValue(activeIndex);
  const goTo = useCallback(
    (i: number) => {
      pos.value = reduced ? i : withSpring(i, springs.snappy);
    },
    [pos, reduced],
  );
  // keep in sync when navigation changes from elsewhere (deep link, back, programmatic)
  useEffect(() => {
    goTo(activeIndex);
  }, [activeIndex, goTo]);

  // show / hide
  const shown = useSharedValue(hidden ? 0 : 1);
  useEffect(() => {
    shown.value = reduced ? (hidden ? 0 : 1) : withSpring(hidden ? 0 : 1, springs.smooth);
  }, [hidden, reduced, shown]);

  const bottom = Math.max(insets.bottom - 6, 16) + (insets.bottom > 0 ? 0 : 4);
  const hideDistance = TAB_BAR_HEIGHT + bottom + 24;

  const barStyle = useAnimatedStyle(() => {
    const w = activeW.value;
    let total = TAB.pad * 2 + TAB.gap * (n - 1);
    for (let i = 0; i < n; i++) total += itemWidth(i, pos.value, w);
    return {
      width: total,
      opacity: interpolate(shown.value, [0, 0.6, 1], [0, 1, 1], Extrapolation.CLAMP),
      transform: [{ translateY: (1 - shown.value) * hideDistance }],
    };
  });

  const pillStyle = useAnimatedStyle(() => {
    const r = pillRect(pos.value, activeW.value, n);
    return { width: r.width, transform: [{ translateX: r.left }] };
  });

  const onMeasure = useCallback((i: number, e: LayoutChangeEvent) => {
    const w = Math.ceil(e.nativeEvent.layout.width);
    setLabelW((prev) => (prev[i] === w ? prev : prev.map((v, j) => (j === i ? w : v))));
  }, []);

  const press = useCallback(
    (i: number) => {
      const it = items[i];
      if (!it?.route) return;
      const focused = i === activeIndex;
      const event = navigation.emit({ type: 'tabPress', target: it.route.key, canPreventDefault: true });
      if (focused) {
        onReselect?.(it.tab.name);
        return;
      }
      if (!event.defaultPrevented) {
        haptic.select(); // fire on commit, not on touch-down
        goTo(i); // optimistic: start the spring this frame, don't wait for navigation state
        navigation.navigate(it.route.name, it.route.params);
      }
    },
    [items, activeIndex, navigation, onReselect, goTo],
  );

  return (
    <View pointerEvents="box-none" style={[styles.wrap, { bottom }]}>
      <Animated.View
        role="tablist"
        accessibilityLabel="Primary"
        style={[
          styles.bar,
          { backgroundColor: palette.bar },
          Platform.OS === 'ios' ? styles.shadowIos : styles.shadowAndroid,
          barStyle,
        ]}
      >
        <Animated.View pointerEvents="none" style={[styles.pill, { backgroundColor: palette.accent }, pillStyle]} />
        {items.map((it, i) => (
          <TabItem
            key={it.tab.name}
            index={i}
            count={n}
            tab={it.tab}
            pos={pos}
            activeW={activeW}
            focused={i === activeIndex}
            inactiveColor={palette.tabInactive}
            inkColor={palette.onAccent}
            onPress={press}
            reduced={reduced}
          />
        ))}
      </Animated.View>

      {/* hidden text used to measure label widths with the real font (not announced, not visible) */}
      <View pointerEvents="none" accessibilityElementsHidden importantForAccessibility="no-hide-descendants" style={styles.measureBox}>
        {items.map((it, i) => (
          <Text key={it.tab.name} maxFontSizeMultiplier={1.15} style={styles.label} onLayout={(e) => onMeasure(i, e)}>
            {it.tab.label}
          </Text>
        ))}
      </View>
    </View>
  );
}

// ---------- one tab -----------------------------------------------------------------------------------------------
type ItemProps = {
  index: number;
  count: number;
  tab: TabDef;
  pos: SharedValue<number>;
  activeW: SharedValue<number[]>;
  focused: boolean;
  inactiveColor: string;
  inkColor: string;
  onPress: (i: number) => void;
  reduced: boolean;
};

function TabItem({ index, count, tab, pos, activeW, focused, inactiveColor, inkColor, onPress, reduced }: ItemProps) {
  const pressed = useSharedValue(0);
  const pop = useSharedValue(1);

  // tiny icon "pop" when this tab becomes active (Apple-style selection confirmation)
  useEffect(() => {
    if (focused && !reduced) pop.value = withSequence(withSpring(1.14, springs.press), withSpring(1, springs.bouncy));
  }, [focused, reduced, pop]);

  const itemStyle = useAnimatedStyle(() => ({ width: itemWidth(index, pos.value, activeW.value) }));
  const a = (p: number) => {
    'worklet';
    return Math.max(0, 1 - Math.abs(p - index));
  };

  const iconBox = useAnimatedStyle(() => ({
    transform: [{ scale: pop.value * (1 - pressed.value * 0.1) }],
  }));
  // Icon colour follows the PILL, not time: the ink icon only shows where lime is under it, the grey one everywhere else.
  // So as the pill slides past, each icon flips colour exactly when it is uncovered. No flash, no invisible-ink moment.
  const coverage = useDerivedValue(() => {
    const w = activeW.value;
    const r = pillRect(pos.value, w, count);
    const cx = itemLeft(index, pos.value, w) + TAB.inactiveWidth / 2;
    const half = TAB.iconActive / 2;
    const overlap = Math.min(cx + half, r.left + r.width) - Math.max(cx - half, r.left);
    return Math.min(1, Math.max(0, overlap / TAB.iconActive));
  });
  const inactiveIcon = useAnimatedStyle(() => ({ opacity: 1 - coverage.value }));
  const activeIcon = useAnimatedStyle(() => ({ opacity: coverage.value }));
  // label appears AFTER the pill has started to widen: fade from 40% → 100%, with a small slide
  const labelStyle = useAnimatedStyle(() => {
    const k = a(pos.value);
    return {
      opacity: interpolate(k, [0.4, 1], [0, 1], Extrapolation.CLAMP),
      transform: [{ translateX: interpolate(k, [0, 1], [-6, 0], Extrapolation.CLAMP) }],
    };
  });

  return (
    <Animated.View style={[styles.item, itemStyle]}>
      <Pressable
        role="tab"
        accessibilityLabel={tab.label}
        accessibilityState={{ selected: focused }}
        onPressIn={() => {
          pressed.value = withSpring(1, springs.press);
        }}
        onPressOut={() => {
          pressed.value = withSpring(0, springs.press);
        }}
        onPress={() => onPress(index)}
        hitSlop={4}
        style={StyleSheet.absoluteFill}
      >
        <Animated.View style={[styles.iconBox, iconBox]} pointerEvents="none">
          <Animated.View style={[styles.iconLayer, inactiveIcon]}>
            <Icon name={tab.icon} size={TAB.iconInactive} color={inactiveColor} />
          </Animated.View>
          <Animated.View style={[styles.iconLayer, activeIcon]}>
            <Icon name={tab.icon} size={TAB.iconActive} color={inkColor} />
          </Animated.View>
        </Animated.View>
        <Animated.Text numberOfLines={1} maxFontSizeMultiplier={1.15} style={[styles.label, styles.activeLabel, { color: inkColor }, labelStyle]}>
          {tab.label}
        </Animated.Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrap: { position: 'absolute', left: 0, right: 0, alignItems: 'center' },
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: TAB.gap,
    padding: TAB.pad,
    height: TAB_BAR_HEIGHT,
    borderRadius: TAB.barRadius,
  },
  shadowIos: { shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 16, shadowOffset: { width: 0, height: 12 } },
  shadowAndroid: { elevation: 12 },
  // pill sits behind the items; its left edge is driven by translateX so it never triggers layout
  pill: { position: 'absolute', left: 0, top: TAB.pad, height: TAB.height, borderRadius: TAB.itemRadius },
  item: { height: TAB.height, borderRadius: TAB.itemRadius, overflow: 'hidden' },
  // both icons share one centre so the cross-fade doesn't shift: x centre ≈ 24
  iconBox: { position: 'absolute', left: 0, top: 0, width: TAB.inactiveWidth, height: TAB.height, alignItems: 'center', justifyContent: 'center' },
  iconLayer: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  label: { fontFamily: fonts.ui, fontSize: TAB.labelSize, fontWeight: '600' /* design: 650 */ },
  activeLabel: { position: 'absolute', left: TAB.activePadLeft + TAB.iconActive + TAB.labelGap, top: 0, height: TAB.height, lineHeight: TAB.height },
  measureBox: { position: 'absolute', opacity: 0, left: -1000 },
});
