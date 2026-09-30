import { useEffect, useMemo, useState } from "react";
import { Pressable, StyleSheet, Text, useWindowDimensions, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle } from "react-native-svg";
import { Icon } from "../../art/Art";
import { easeOut, useFloat, useRise } from "../../motion/motion";
import { AssetGroup, groupBySymbol } from "../../services/assets";
import { fmtAmount, fmtDelta, usd, usdCompact } from "../../services/format";
import { usePortfolio } from "../../state/portfolio";
import { assetPalette, Palette } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

// Stage geometry from the design (390×520, centre 195,260). Slots are ordered biggest → smallest,
// so a bigger share always gets a bigger planet.
const STAGE = { w: 390, h: 520, cx: 195, cy: 260 };
const SLOTS = [
    { x: -110, y: -60, d: 108 },
    { x: -100, y: 132, d: 86 },
    { x: 0, y: -172, d: 74 },
    { x: 118, y: -52, d: 66 },
    { x: 112, y: 136, d: 62 },
];
const COLORS = [assetPalette.eth, assetPalette.usdc, assetPalette.btc, assetPalette.nft, assetPalette.defi];
const INK = "#0A0A0A";
const ZOOM = 2.5;

type Planet = {
    key: string; name: string; color: string; x: number; y: number; d: number;
    value: number; amount: number | null; symbol: string; change24h: number | null; share: number;
};

const buildPlanets = (groups: AssetGroup[], total: number): Planet[] => {
    const top = groups.slice(0, 4);
    const rest = groups.slice(4);
    const items: Omit<Planet, "x" | "y" | "d" | "color">[] = top.map(g => ({
        key: g.symbol, name: g.name, value: g.value, amount: g.amount, symbol: g.symbol, change24h: g.change24h, share: g.value / (total || 1),
    }));
    if (rest.length) {
        const value = rest.reduce((s, r) => s + r.value, 0);
        items.push({ key: "OTHER", name: "Everything else", value, amount: null, symbol: `+${rest.length}`, change24h: null, share: value / (total || 1) });
    }
    return items.map((it, i) => ({ ...it, ...SLOTS[i], color: COLORS[i] }));
};

const PlanetView = ({ planet, index, focus, palette, onPress }: {
    planet: Planet; index: number; focus: string | null; palette: Palette; onPress: () => void;
}) => {
    const float = useFloat({ durationMs: 4600 + index * 800 });
    const opacity = useSharedValue(1);
    useEffect(() => {
        opacity.value = withTiming(focus && focus !== planet.key ? 0 : 1, { duration: 500 });
    }, [focus]); // eslint-disable-line react-hooks/exhaustive-deps
    const fade = useAnimatedStyle(() => ({ opacity: opacity.value }));
    const edge = palette.buttonEdge;
    return (
        <Animated.View
            pointerEvents={focus ? "none" : "auto"}
            style={[{ position: "absolute", left: STAGE.cx + planet.x - planet.d / 2, top: STAGE.cy + planet.y - planet.d / 2, width: planet.d, height: planet.d }, fade]}
        >
            <Animated.View style={float}>
                <Pressable
                    onPress={onPress}
                    accessibilityRole="button"
                    accessibilityLabel={`Fly into ${planet.name}, ${usdCompact(planet.value)}`}
                    style={{ width: planet.d, height: planet.d }}
                >
                    <View style={{ position: "absolute", top: 6, width: planet.d, height: planet.d, borderRadius: planet.d / 2, backgroundColor: edge }} />
                    <View style={[styles.planet, { width: planet.d, height: planet.d, borderRadius: planet.d / 2, backgroundColor: planet.color, borderColor: edge }]}>
                        <Text style={[styles.planetName, { fontSize: planet.d > 80 ? 17 : 14 }]} numberOfLines={1}>{planet.symbol}</Text>
                        <Text style={[styles.planetValue, { fontSize: planet.d > 80 ? 16 : 13 }]}>{usdCompact(planet.value)}</Text>
                    </View>
                </Pressable>
            </Animated.View>
        </Animated.View>
    );
};

const Universe = ({ onBack, onOpenAssets }: { onBack: () => void; onOpenAssets: () => void }) => {
    const insets = useSafeAreaInsets();
    const { width } = useWindowDimensions();
    const { palette } = useTheme();
    const { portfolio } = usePortfolio();
    const [focusKey, setFocusKey] = useState<string | null>(null);

    const total = portfolio?.total ?? 0;
    const planets = useMemo(() => (portfolio ? buildPlanets(groupBySymbol(portfolio.holdings), total) : []), [portfolio, total]);
    const focus = planets.find(p => p.key === focusKey) ?? null;

    // Stage zoom: translate so the focused planet is scaled up around the stage centre.
    const tx = useSharedValue(0);
    const ty = useSharedValue(0);
    const sc = useSharedValue(1);
    const dim = useSharedValue(1);
    useEffect(() => {
        const cfg = { duration: 900, easing: easeOut };
        tx.value = withTiming(focus ? -focus.x * ZOOM : 0, cfg);
        ty.value = withTiming(focus ? -focus.y * ZOOM - 110 : 0, cfg);
        sc.value = withTiming(focus ? ZOOM : 1, cfg);
        dim.value = withTiming(focus ? 0.06 : 1, { duration: 500 });
    }, [focus]); // eslint-disable-line react-hooks/exhaustive-deps
    const stageStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }, { translateY: ty.value }, { scale: sc.value }] }));
    const dimStyle = useAnimatedStyle(() => ({ opacity: dim.value }));

    const rise = useRise(200);
    const sheetRise = useRise(0);
    const stageTop = insets.top + 76;
    const left = (width - STAGE.w) / 2;

    return (
        <View style={[styles.root, { backgroundColor: palette.bg }]}>
            <View style={[styles.header, { top: insets.top + 8 }]}>
                <Pressable
                    onPress={focus ? () => setFocusKey(null) : onBack}
                    style={[styles.back, { backgroundColor: palette.surface, borderColor: palette.border }]}
                    accessibilityRole="button"
                    accessibilityLabel={focus ? "Back to orbit" : "Back"}
                >
                    <Icon name="back" size={22} color={palette.text} />
                </Pressable>
                <View style={[styles.titlePill, { backgroundColor: palette.surface, borderColor: palette.border }]}>
                    <Text style={[styles.titleText, { color: palette.text }]}>Universe</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <Animated.View style={[{ position: "absolute", top: stageTop, left, width: STAGE.w, height: STAGE.h }, stageStyle]}>
                <Animated.View style={[StyleSheet.absoluteFill, dimStyle]} pointerEvents="none">
                    <Svg width={STAGE.w} height={STAGE.h} viewBox={`0 0 ${STAGE.w} ${STAGE.h}`}>
                        <Circle cx={STAGE.cx} cy={STAGE.cy} r={232} stroke={palette.border} strokeWidth={1.5} fill="none" />
                        <Circle cx={STAGE.cx} cy={STAGE.cy} r={168} stroke={palette.border} strokeWidth={1.5} strokeDasharray="3 6" fill="none" />
                        <Circle cx={STAGE.cx} cy={STAGE.cy} r={104} stroke={palette.border} strokeWidth={1.5} fill="none" />
                    </Svg>
                </Animated.View>

                <Animated.View style={[styles.centerWrap, { left: STAGE.cx - 65, top: STAGE.cy - 65 }, dimStyle]} pointerEvents="none">
                    <View style={[styles.centerShadow, { backgroundColor: palette.accent }]} />
                    <View style={[styles.center, { backgroundColor: INK }]}>
                        <Text style={styles.centerValue} numberOfLines={1} adjustsFontSizeToFit>{portfolio ? usdCompact(total) : "—"}</Text>
                        <Text style={styles.centerLabel}>Net worth</Text>
                    </View>
                </Animated.View>

                {planets.map((p, i) => (
                    <PlanetView key={p.key} planet={p} index={i} focus={focusKey} palette={palette} onPress={() => setFocusKey(p.key)} />
                ))}
            </Animated.View>

            {focus ? (
                <Animated.View style={[styles.sheet, { backgroundColor: palette.surface, borderColor: palette.border, bottom: insets.bottom + 16 }, sheetRise]}>
                    <View style={styles.sheetTop}>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.sheetName, { color: palette.text }]}>{focus.name}</Text>
                            <Text style={[styles.sheetMeta, { color: palette.textSecondary }]}>
                                {focus.amount != null ? `${fmtAmount(focus.amount)} ${focus.symbol}` : "Smaller holdings combined"}
                            </Text>
                        </View>
                        <View style={{ alignItems: "flex-end" }}>
                            <Text style={[styles.sheetValue, { color: palette.text }]}>{usd(focus.value, 2)}</Text>
                            <Text style={[styles.sheetMeta, { color: palette.textSecondary }]}>{fmtDelta(focus.change24h).text}</Text>
                        </View>
                    </View>
                    <Text style={[styles.sheetShare, { color: palette.textSecondary }]}>{(focus.share * 100).toFixed(1)}% of total</Text>
                    <Pressable style={[styles.openBtn, { backgroundColor: palette.accent, borderColor: palette.buttonEdge }]} onPress={onOpenAssets} accessibilityRole="button">
                        <Text style={[styles.openText, { color: palette.onAccent }]}>Open {focus.symbol}</Text>
                    </Pressable>
                    <Pressable style={styles.backOrbit} onPress={() => setFocusKey(null)} accessibilityRole="button">
                        <Text style={[styles.backOrbitText, { color: palette.text }]}>Back to orbit</Text>
                    </Pressable>
                </Animated.View>
            ) : (
                <Animated.View style={[styles.caption, { bottom: insets.bottom + 48 }, rise]}>
                    <Text style={[styles.captionTitle, { color: palette.text }]}>Your wealth, in orbit.</Text>
                    <Text style={[styles.captionBody, { color: palette.textSecondary }]}>Bigger planet, bigger share. Tap one to fly in.</Text>
                </Animated.View>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, overflow: "hidden" },
    header: { position: "absolute", left: 20, right: 20, flexDirection: "row", alignItems: "center", justifyContent: "space-between", zIndex: 5 },
    back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    titlePill: { borderWidth: 1, borderRadius: 22, paddingHorizontal: 26, height: 44, justifyContent: "center" },
    titleText: { fontSize: 18, fontWeight: "700" },
    planet: { borderWidth: 3, alignItems: "center", justifyContent: "center", paddingHorizontal: 4 },
    planetName: { fontWeight: "800", color: INK },
    planetValue: { fontWeight: "600", color: INK },
    centerWrap: { position: "absolute", width: 130, height: 130 },
    centerShadow: { position: "absolute", top: 6, width: 130, height: 130, borderRadius: 65 },
    center: { width: 130, height: 130, borderRadius: 65, alignItems: "center", justifyContent: "center", paddingHorizontal: 14 },
    centerValue: { fontSize: 26, fontWeight: "700", color: "#F5F5F5", letterSpacing: -0.5 },
    centerLabel: { fontSize: 13, color: "#A3A39C", marginTop: 4 },
    caption: { position: "absolute", left: 24, right: 24, alignItems: "center" },
    captionTitle: { fontSize: 30, fontWeight: "700", letterSpacing: -1, textAlign: "center" },
    captionBody: { fontSize: 16, marginTop: 8, textAlign: "center" },
    sheet: { position: "absolute", left: 20, right: 20, borderWidth: 1, borderRadius: 28, padding: 20 },
    sheetTop: { flexDirection: "row", alignItems: "flex-start", gap: 12 },
    sheetName: { fontSize: 22, fontWeight: "700" },
    sheetValue: { fontSize: 20, fontWeight: "700" },
    sheetMeta: { fontSize: 14, marginTop: 4 },
    sheetShare: { fontSize: 14, marginTop: 10 },
    openBtn: { marginTop: 16, borderWidth: 2, borderRadius: 27, height: 54, alignItems: "center", justifyContent: "center" },
    openText: { fontSize: 17, fontWeight: "700" },
    backOrbit: { alignItems: "center", justifyContent: "center", height: 44, marginTop: 6 },
    backOrbitText: { fontSize: 15, fontWeight: "600" },
});

export default Universe;
