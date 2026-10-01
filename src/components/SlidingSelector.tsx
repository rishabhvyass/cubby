import { useEffect, useState } from "react";
import { Pressable, ScrollView, StyleProp, StyleSheet, Text, View, ViewStyle } from "react-native";
import Animated, {
    interpolateColor, useAnimatedStyle, useReducedMotion, useSharedValue, withSpring, withTiming,
} from "react-native-reanimated";
import { haptic, springs } from "../motion/springs";
import { Palette } from "../theme/tokens";

/** Float index driven by a spring: re-targets from the live value, so quick taps never restart. */
const useSlide = (index: number) => {
    const reduced = useReducedMotion();
    const idx = useSharedValue(index);
    useEffect(() => {
        idx.value = reduced ? index : withSpring(index, springs.snappy);
    }, [index]); // eslint-disable-line react-hooks/exhaustive-deps
    return idx;
};

const SegLabel = ({ text, i, idx, active, inactive, textStyle }: {
    text: string; i: number; idx: { value: number }; active: string; inactive: string; textStyle?: object;
}) => {
    // Colour follows the indicator: it flips as the pill passes under the label.
    const style = useAnimatedStyle(() => {
        const a = Math.max(0, 1 - Math.abs(idx.value - i));
        return { color: interpolateColor(a, [0, 1], [inactive, active]) };
    });
    return <Animated.Text style={[styles.segText, textStyle, style]}>{text}</Animated.Text>;
};

/** Equal-width segmented control with one pill that slides between options. */
export const SlidingSegmented = ({ options, value, onChange, trackColor, pillColor, activeColor, inactiveColor, style, pad = 5, height = 44, radius = 24, textStyle }: {
    options: readonly string[]; value: string; onChange: (v: string) => void;
    trackColor: string; pillColor: string; activeColor: string; inactiveColor: string;
    style?: StyleProp<ViewStyle>; pad?: number; height?: number; radius?: number; textStyle?: object;
}) => {
    const [w, setW] = useState(0);
    const index = Math.max(0, options.indexOf(value));
    const idx = useSlide(index);
    const segW = w ? (w - pad * 2) / options.length : 0;
    const pill = useAnimatedStyle(() => ({ transform: [{ translateX: idx.value * segW }] }));

    return (
        <View
            style={[{ backgroundColor: trackColor, borderRadius: radius + pad, padding: pad, flexDirection: "row" }, style]}
            onLayout={e => setW(e.nativeEvent.layout.width)}
            accessibilityRole="tablist"
        >
            {segW > 0 && (
                <Animated.View
                    pointerEvents="none"
                    style={[{ position: "absolute", top: pad, left: pad, width: segW, height, borderRadius: radius, backgroundColor: pillColor }, pill]}
                />
            )}
            {options.map((o, i) => (
                <Pressable
                    key={o}
                    style={{ flex: 1, height, alignItems: "center", justifyContent: "center" }}
                    onPress={() => { if (o !== value) { haptic.select(); onChange(o); } }}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: o === value }}
                >
                    <SegLabel text={o} i={i} idx={idx} active={activeColor} inactive={inactiveColor} textStyle={textStyle} />
                </Pressable>
            ))}
        </View>
    );
};

type Box = { x: number; w: number };

const ChipLabel = ({ text, on, active, inactive }: { text: string; on: boolean; active: string; inactive: string }) => {
    const p = useSharedValue(on ? 1 : 0);
    useEffect(() => { p.value = withTiming(on ? 1 : 0, { duration: 200 }); }, [on]); // eslint-disable-line react-hooks/exhaustive-deps
    const style = useAnimatedStyle(() => ({ color: interpolateColor(p.value, [0, 1], [inactive, active]) }));
    return <Animated.Text style={[styles.chipText, style]}>{text}</Animated.Text>;
};

/**
 * Horizontally scrolling chips with a single selection pill that glides (and resizes) to the chosen chip.
 * Two identical rows share one layout: the lower one draws chip backgrounds + borders and is measured, the
 * upper one holds the tappable labels, and the pill sits between them.
 */
export const SlidingChips = ({ options, value, onChange, p, height = 44 }: {
    options: { id: string; label: string }[]; value: string; onChange: (id: string) => void; p: Palette; height?: number;
}) => {
    const reduced = useReducedMotion();
    const [boxes, setBoxes] = useState<Record<string, Box>>({});
    const x = useSharedValue(0);
    const w = useSharedValue(0);
    const ready = useSharedValue(0);
    const target = boxes[value];

    useEffect(() => {
        if (!target) return;
        if (!ready.value || reduced) {
            x.value = target.x; w.value = target.w; ready.value = 1;
        } else {
            x.value = withSpring(target.x, springs.snappy);
            w.value = withSpring(target.w, springs.snappy);
        }
    }, [target?.x, target?.w]); // eslint-disable-line react-hooks/exhaustive-deps

    const pill = useAnimatedStyle(() => ({ width: w.value, opacity: ready.value, transform: [{ translateX: x.value }] }));
    const chip = { height, paddingHorizontal: 20, justifyContent: "center" as const, borderRadius: 26 };

    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll} contentContainerStyle={styles.chipContent}>
            <View>
                {/* lower row: backgrounds, measured */}
                <View style={styles.chipRow}>
                    {options.map(o => (
                        <View
                            key={o.id}
                            style={[chip, { backgroundColor: p.surface, borderWidth: 1, borderColor: p.border }]}
                            onLayout={e => {
                                const { x: cx, width } = e.nativeEvent.layout;
                                setBoxes(prev => (prev[o.id]?.x === cx && prev[o.id]?.w === width ? prev : { ...prev, [o.id]: { x: cx, w: width } }));
                            }}
                        >
                            <Text style={[styles.chipText, { opacity: 0 }]}>{o.label}</Text>
                        </View>
                    ))}
                </View>
                <Animated.View pointerEvents="none" style={[styles.chipPill, { height, backgroundColor: p.text }, pill]} />
                {/* upper row: tappable labels */}
                <View style={[styles.chipRow, StyleSheet.absoluteFill]}>
                    {options.map(o => (
                        <Pressable
                            key={o.id}
                            style={chip}
                            onPress={() => { if (o.id !== value) { haptic.select(); onChange(o.id); } }}
                            accessibilityRole="button"
                            accessibilityState={{ selected: o.id === value }}
                        >
                            <ChipLabel text={o.label} on={o.id === value} active={p.bg} inactive={p.text} />
                        </Pressable>
                    ))}
                </View>
            </View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    segText: { fontSize: 16, fontWeight: "600" },
    chipScroll: { marginHorizontal: -20 },
    chipContent: { paddingHorizontal: 20, paddingVertical: 16 },
    chipRow: { flexDirection: "row", gap: 10 },
    chipPill: { position: "absolute", left: 0, top: 0, borderRadius: 26 },
    chipText: { fontSize: 16, fontWeight: "600" },
});
