import { useEffect } from "react";
import { Linking, StyleSheet, Text, View } from "react-native";
import Animated, {
    FadeInDown, interpolate, useAnimatedStyle, useReducedMotion, useSharedValue, withDelay, withSpring, withTiming,
} from "react-native-reanimated";
import { Icon } from "../../art/Art";
import { TokenIcon } from "../../art/CryptoIcon";
import { PressableScale } from "../../components/PressableScale";
import { TactileButton } from "../../components/TactileButton";
import { easeOut, useCountUp } from "../../motion/motion";
import { springs } from "../../motion/springs";
import { fmtAmount, usd } from "../../services/format";
import { explorerTx, SwapQuote, SwapToken } from "../../services/swap";
import { Palette } from "../../theme/tokens";

const row = (i: number) => FadeInDown.delay(650 + i * 90).springify().damping(24).stiffness(200);

/**
 * Calm confirmation (no confetti: Cubby never celebrates trades).
 * Your token eases toward the one you received, a ring breathes out once, a check settles in, then the details rise in.
 */
export const SwapSuccess = ({ pay, receive, payAmount, quote, hash, p, dark, onDone, onViewActivity }: {
    pay: SwapToken; receive: SwapToken; payAmount: string; quote: SwapQuote | null; hash: string | null;
    p: Palette; dark: boolean; onDone: () => void; onViewActivity?: () => void;
}) => {
    const reduced = useReducedMotion();
    const glide = useSharedValue(reduced ? 1 : 0);
    const ring = useSharedValue(reduced ? 1 : 0);
    const check = useSharedValue(reduced ? 1 : 0);
    const line = useSharedValue(reduced ? 1 : 0);

    useEffect(() => {
        if (reduced) return;
        glide.value = withSpring(1, springs.gentle);
        line.value = withDelay(120, withTiming(1, { duration: 520, easing: easeOut }));
        ring.value = withDelay(380, withTiming(1, { duration: 1100, easing: easeOut }));
        check.value = withDelay(520, withSpring(1, springs.snappy));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    const payStyle = useAnimatedStyle(() => ({
        opacity: interpolate(glide.value, [0, 1], [1, 0.45]),
        transform: [{ translateX: interpolate(glide.value, [0, 1], [-30, 0]) }, { scale: interpolate(glide.value, [0, 1], [1, 0.82]) }],
    }));
    const lineStyle = useAnimatedStyle(() => ({ transform: [{ scaleX: line.value }], opacity: line.value }));
    const recvStyle = useAnimatedStyle(() => ({
        opacity: interpolate(glide.value, [0, 0.6, 1], [0, 1, 1]),
        transform: [{ translateX: interpolate(glide.value, [0, 1], [34, 0]) }, { scale: interpolate(glide.value, [0, 1], [0.7, 1]) }],
    }));
    const ringStyle = useAnimatedStyle(() => ({
        opacity: interpolate(ring.value, [0, 0.15, 1], [0, 0.9, 0]),
        transform: [{ scale: interpolate(ring.value, [0, 1], [0.85, 1.9]) }],
    }));
    const checkStyle = useAnimatedStyle(() => ({ opacity: check.value, transform: [{ scale: interpolate(check.value, [0, 1], [0.3, 1]) }] }));

    const out = useCountUp(quote?.toAmount ?? 0, 1000);
    const rate = quote && Number(payAmount) > 0 ? quote.toAmount / Number(payAmount) : null;

    return (
        <View style={styles.wrap}>
            <View style={styles.stage}>
                <Animated.View style={payStyle}><TokenIcon symbol={pay.symbol} size={52} dark={dark} /></Animated.View>
                <Animated.View style={[styles.line, { backgroundColor: p.text }, lineStyle]} />
                <View style={{ width: 84, height: 84, alignItems: "center", justifyContent: "center" }}>
                    <Animated.View pointerEvents="none" style={[styles.ring, { borderColor: p.accent }, ringStyle]} />
                    <Animated.View style={recvStyle}><TokenIcon symbol={receive.symbol} size={76} dark={dark} /></Animated.View>
                    <Animated.View style={[styles.check, { backgroundColor: p.accent, borderColor: p.buttonEdge }, checkStyle]}>
                        <Icon name="check" size={16} color={p.onAccent} />
                    </Animated.View>
                </View>
            </View>

            <Animated.Text entering={row(-4)} style={[styles.title, { color: p.text }]}>Swapped</Animated.Text>
            <Animated.Text entering={row(-3)} style={[styles.amountOut, { color: p.text }]}>
                +{fmtAmount(out)} {receive.symbol}
            </Animated.Text>
            <Animated.Text entering={row(-2)} style={[styles.amountIn, { color: p.textSecondary }]}>
                from {fmtAmount(Number(payAmount))} {pay.symbol}{quote?.toUsd != null ? ` · ${usd(quote.toUsd, 2)}` : ""}
            </Animated.Text>

            <Animated.View entering={row(0)} style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }]}>
                <Detail label="Rate" value={rate ? `1 ${pay.symbol} ≈ ${fmtAmount(rate)} ${receive.symbol}` : "—"} p={p} />
                <Detail label="Network fee" value={quote?.gasUsd != null ? `~${usd(quote.gasUsd, 2)}` : "—"} p={p} />
                <Detail label="Route" value={quote ? `via ${quote.tool}` : "—"} p={p} last />
            </Animated.View>

            {hash && (
                <Animated.View entering={row(1)}>
                    <PressableScale onPress={() => Linking.openURL(explorerTx(pay.chain, hash)).catch(() => {})} accessibilityRole="link">
                        <Text style={[styles.link, { color: p.text }]}>View on explorer ↗</Text>
                    </PressableScale>
                </Animated.View>
            )}

            <Animated.View entering={row(2)} style={styles.buttons}>
                {onViewActivity && <TactileButton title="View activity" onPress={onViewActivity} />}
                <TactileButton title="Done" variant="secondary" onPress={onDone} />
            </Animated.View>
        </View>
    );
};

const Detail = ({ label, value, p, last }: { label: string; value: string; p: Palette; last?: boolean }) => (
    <View style={[styles.detailRow, !last && { borderBottomWidth: 1, borderBottomColor: p.border }]}>
        <Text style={{ fontSize: 15, color: p.textSecondary }}>{label}</Text>
        <Text style={{ fontSize: 15, fontWeight: "600", color: p.text, fontVariant: ["tabular-nums"] }}>{value}</Text>
    </View>
);

const styles = StyleSheet.create({
    wrap: { alignItems: "center", paddingTop: 36 },
    stage: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, height: 110 },
    line: { width: 54, height: 3, borderRadius: 2, opacity: 0.2 },
    ring: { position: "absolute", width: 84, height: 84, borderRadius: 42, borderWidth: 3 },
    check: { position: "absolute", right: -2, bottom: -2, width: 30, height: 30, borderRadius: 15, borderWidth: 2, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 38, fontWeight: "700", letterSpacing: -1.4, marginTop: 14 },
    amountOut: { fontSize: 34, fontWeight: "700", letterSpacing: -1, marginTop: 6, fontVariant: ["tabular-nums"] },
    amountIn: { fontSize: 16, marginTop: 6 },
    card: { alignSelf: "stretch", borderWidth: 1, borderRadius: 24, paddingHorizontal: 18, marginTop: 26 },
    detailRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 13 },
    link: { fontSize: 16, fontWeight: "600", marginTop: 18 },
    buttons: { alignSelf: "stretch", gap: 12, marginTop: 24 },
});
