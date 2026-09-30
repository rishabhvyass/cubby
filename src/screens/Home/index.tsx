import React, { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, StatusBar, Pressable, ScrollView, StyleProp, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { createStyles } from "./style";
import { useTheme } from "../../theme/useTheme";
import { assetPalette, Palette } from "../../theme/tokens";
import Animated, { useAnimatedProps, useSharedValue, withDelay, withTiming } from "react-native-reanimated";
import { AnimatedCircle, AnimatedPath, easeOut, splitDollars, useCountUp, usePulseProps, useDrawProps, useRise } from "../../motion/motion";
import { CubbyForScore, CubbyMark, Icon, Sticker, UniverseCardArt } from "../../art/Art";
import { loadPortfolio, Portfolio } from "../../services/portfolio";
import { History, loadHistory, RangeKey } from "../../services/history";

const RANGES: RangeKey[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];
const PALETTE = [assetPalette.eth, assetPalette.usdc, assetPalette.btc, assetPalette.nft, assetPalette.defi];
const OTHER_COLOR = assetPalette.defi;

const usd = (n: number, digits = 0) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

const CHART_W = 350;
const CHART_H = 150;

const buildPaths = (data: number[]) => {
    const min = Math.min(...data);
    const max = Math.max(...data);
    const pts = data.map((v, i) => ({
        x: (i / (data.length - 1)) * (CHART_W - 10),
        y: 8 + (1 - (v - min) / (max - min || 1)) * (CHART_H - 20),
    }));
    const line = pts.map((p, i) => `${i ? "L" : "M"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
    const area = `${line} L${pts[pts.length - 1].x},${CHART_H} L0,${CHART_H} Z`;
    return { line, area, last: pts[pts.length - 1] };
};

const DASH = 3000; // longer than any path we generate, so the draw reveals it all

const RiseView = ({ delay = 0, style, children }: { delay?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) => {
    const rise = useRise(delay);
    return <Animated.View style={[style, rise]}>{children}</Animated.View>;
};

// Line draws, then area fades in (0.7s), end dot fades in (1.4s), ring pulses from 1.6s.
// Remounted (via key) whenever the data or range changes so the choreography replays.
const Chart = ({ line, area, last, p }: { line: string; area: string; last: { x: number; y: number }; p: Palette }) => {
    const areaOp = useSharedValue(0);
    const dotOp = useSharedValue(0);
    useEffect(() => {
        areaOp.value = withDelay(700, withTiming(1, { duration: 900, easing: easeOut }));
        dotOp.value = withDelay(1400, withTiming(1, { duration: 900, easing: easeOut }));
    }, []); // eslint-disable-line react-hooks/exhaustive-deps
    const areaProps = useAnimatedProps(() => ({ opacity: areaOp.value }));
    const dotProps = useAnimatedProps(() => ({ opacity: dotOp.value }));
    const drawProps = useDrawProps(100, 1500, DASH);
    const pulseProps = usePulseProps();
    return (
        <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
            <Defs>
                <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                    <Stop offset="0" stopColor={p.accent} stopOpacity={0.55} />
                    <Stop offset="1" stopColor={p.accent} stopOpacity={0.05} />
                </LinearGradient>
            </Defs>
            <AnimatedPath d={area} fill="url(#fill)" animatedProps={areaProps} />
            <AnimatedPath
                d={line} stroke={p.text} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round"
                strokeDasharray={DASH} animatedProps={drawProps}
            />
            <AnimatedCircle cx={last.x} cy={last.y} r={5} fill={p.accent} stroke={p.text} strokeWidth={2} animatedProps={dotProps} />
            <AnimatedCircle cx={last.x} cy={last.y} fill="none" stroke={p.text} strokeWidth={1.5} animatedProps={pulseProps} />
        </Svg>
    );
};

const Home = ({ route }: any) => {
    const insets = useSafeAreaInsets();
    const { scheme, palette } = useTheme();
    const styles = useMemo(() => createStyles(palette), [palette]);
    const { address, label } = route.params as { address: string; label?: string };
    const [range, setRange] = useState<RangeKey>("1W");
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [history, setHistory] = useState<History | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        loadPortfolio(address)
            .then(p => !cancelled && setPortfolio(p))
            .catch(e => !cancelled && setError(e.message));
        return () => { cancelled = true; };
    }, [address]);

    useEffect(() => {
        if (!portfolio?.holdings.length) return;
        let cancelled = false;
        setHistory(null);
        loadHistory(portfolio.holdings, range)
            .then(h => !cancelled && setHistory(h))
            .catch(e => console.warn("[history]", e));
        return () => { cancelled = true; };
    }, [portfolio, range]);

    const { line, area, last } = useMemo(() => buildPaths(history?.points ?? [0, 0]), [history]);

    // Top 4 assets by value (merged across chains) + "Other".
    const assets = useMemo(() => {
        if (!portfolio) return [];
        const bySymbol = new Map<string, { symbol: string; name: string; value: number }>();
        for (const h of portfolio.holdings) {
            const cur = bySymbol.get(h.symbol) ?? { symbol: h.symbol, name: h.name, value: 0 };
            cur.value += h.value;
            bySymbol.set(h.symbol, cur);
        }
        const sorted = [...bySymbol.values()].sort((a, b) => b.value - a.value);
        const top = sorted.slice(0, 4);
        const rest = sorted.slice(4);
        const rows = top.map((t, i) => ({ chip: t.symbol.slice(0, 4), name: t.name, value: t.value, color: PALETTE[i] }));
        if (rest.length) rows.push({ chip: `+${rest.length}`, name: "Other", value: rest.reduce((s, r) => s + r.value, 0), color: OTHER_COLOR });
        return rows;
    }, [portfolio]);

    const total = portfolio?.total ?? 0;
    const counted = useCountUp(total);
    const { dollars, cents } = splitDollars(counted);
    const up = (history?.change ?? 0) >= 0;
    const rangeLabel = range === "1D" ? "today" : range === "ALL" ? "all time" : `over ${range}`;
    const gains = (history?.contributions ?? []).filter(c => c.delta > 0).slice(0, 3);
    const gainTotal = gains.reduce((s, g) => s + g.delta, 0);
    const lead = history?.contributions[0];

    return (
        <View style={styles.root}>
            <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.header}>
                    <View style={styles.account}>
                        <CubbyMark size={40} />
                        <Text style={styles.accountName}>{label ?? short(address)}</Text>
                        <Icon name="chevron_down" size={16} color={palette.textSecondary} />
                    </View>
                    <View style={styles.badge}><Sticker name="hello" height={30} /></View>
                </View>

                {error && <Text style={styles.errorText}>Couldn't load wallet: {error}</Text>}
                {!portfolio && !error && <ActivityIndicator style={{ marginTop: 16 }} />}

                <View style={styles.netRow}>
                    <Text style={styles.netLabel}>Net worth</Text>
                    <View style={styles.liveDot} />
                    <Text style={styles.netLabel}>Live on {portfolio?.byChain.filter(c => c.value > 0).length ?? 0} chains</Text>
                </View>
                <View style={styles.netValueRow}>
                    <Text style={styles.netValue} numberOfLines={1} adjustsFontSizeToFit>{portfolio ? dollars : "—"}</Text>
                    {portfolio && <Text style={styles.netCents}>{cents}</Text>}
                </View>
                <View style={styles.deltaRow}>
                    <View style={styles.deltaPill}>
                        <Text style={styles.deltaText}>{history ? `${up ? "▲" : "▼"} ${usd(Math.abs(history.change), 2)} · ${Math.abs(history.changePct).toFixed(2)}%` : "…"}</Text>
                    </View>
                    <Text style={styles.deltaWeek}>{rangeLabel}</Text>
                </View>

                <View style={styles.chart}>
                    <Chart key={`${range}-${history?.points.length ?? 0}`} line={line} area={area} last={last} p={palette} />
                </View>

                <RiseView delay={60} style={styles.ranges}>
                    {RANGES.map(r => (
                        <Pressable
                            key={r}
                            style={[styles.range, r === range && styles.rangeActive]}
                            onPress={() => setRange(r)}
                        >
                            <Text style={[styles.rangeText, r === range && styles.rangeTextActive]}>{r}</Text>
                        </Pressable>
                    ))}
                </RiseView>

                <RiseView delay={120} style={styles.story}>
                    <View style={styles.storyTag}>
                        <Sticker name="hello" height={22} />
                        <Text style={styles.storyTagText}>This week's story</Text>
                    </View>
                    <Text style={styles.storyTitle}>
                        {lead && lead.delta > 0 ? `${lead.symbol} carried your ${range === "1W" ? "week" : "run"}.` : "Quiet stretch."}
                    </Text>
                    <Text style={styles.storyBody}>
                        {history && lead && lead.delta > 0
                            ? `It made ${usd(lead.delta)} of your ${usd(Math.abs(history.change))} ${up ? "gain" : "move"} ${rangeLabel}. Prices did the work.`
                            : "Nothing moved much in this window."}
                    </Text>
                    <View style={styles.storyBar}>
                        {gains.map((g, i) => (
                            <View key={g.symbol} style={{ flex: g.delta / (gainTotal || 1), backgroundColor: PALETTE[i] }} />
                        ))}
                    </View>
                    <View style={styles.storyLegend}>
                        {gains.map(g => (
                            <Text key={g.symbol} style={styles.storyLegendText}>{g.symbol} +{usd(g.delta)}</Text>
                        ))}
                    </View>
                </RiseView>

                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Where it sits</Text>
                    <Text style={styles.sectionLink}>All assets</Text>
                </View>
                <View style={styles.allocBar}>
                    {assets.map(a => (
                        <View key={a.chip} style={{ flex: a.value, backgroundColor: a.color, borderRadius: 6 }} />
                    ))}
                </View>
                {assets.map((a, i) => (
                    <RiseView key={a.chip} delay={160 + i * 40} style={[styles.assetRow, i === assets.length - 1 && { borderBottomWidth: 0 }]}>
                        <View style={[styles.assetChip, { backgroundColor: a.color }]}>
                            <Text style={styles.assetChipText}>{a.chip}</Text>
                        </View>
                        <Text style={styles.assetName}>{a.name}</Text>
                        <Text style={styles.assetValue}>{usd(a.value)}</Text>
                        <Text style={styles.assetPct}>{((a.value / (total || 1)) * 100).toFixed(1)}%</Text>
                    </RiseView>
                ))}

                <RiseView delay={240} style={[styles.card, styles.cubbyCard]}>
                    <View style={styles.cubbyIcon}><CubbyForScore score={82} height={52} /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.cubbyTitle}>Cubby is at level 3</Text>
                        <Text style={styles.cubbyMeta}>Health 82 · 1 quick fix to Level 4</Text>
                        <View style={styles.dots}>
                            {Array.from({ length: 12 }).map((_, i) => <View key={i} style={styles.dot} />)}
                            <Text style={styles.dotsText}>12 wks</Text>
                        </View>
                    </View>
                </RiseView>

                <RiseView delay={280} style={styles.twoCol}>
                    <View style={[styles.card, styles.tile]}>
                        <View style={styles.tileArt}><UniverseCardArt width={72} /></View>
                        <Text style={styles.tileTitle}>Universe</Text>
                        <Text style={styles.tileDesc}>Fly through your assets</Text>
                    </View>
                    <View style={[styles.card, styles.tile]}>
                        <View style={[styles.tileArt, { flexDirection: "row", gap: 4 }]}>
                            <Sticker name="clean_sweep" height={40} />
                            <Sticker name="backed_up" height={40} />
                        </View>
                        <Text style={styles.tileTitle}>Sticker book</Text>
                        <Text style={styles.tileDesc}>5 of 12 collected</Text>
                    </View>
                </RiseView>

                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Across chains</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chains}>
                    {(portfolio?.byChain ?? []).filter(c => c.value > 0).map(({ chain: c, value }) => (
                        <View key={c.id} style={styles.chain}>
                            <View style={styles.chainChip}><Text style={styles.chainChipText}>{c.chip}</Text></View>
                            <View>
                                <Text style={styles.chainName}>{c.name}</Text>
                                <Text style={styles.chainValue}>{usd(value)}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </ScrollView>

            <View style={[styles.nav, { bottom: insets.bottom + 12 }]} pointerEvents="box-none">
                <View style={styles.navPill}>
                    <View style={styles.navActive}>
                        <Icon name="home" size={22} color={palette.onAccent} />
                        <Text style={styles.navActiveText}>Home</Text>
                    </View>
                    {(["assets", "activity", "health"] as const).map(n => (
                        <Pressable key={n} style={styles.navItem} accessibilityLabel={n}>
                            <Icon name={n} size={22} color="#D8D8D0" />
                        </Pressable>
                    ))}
                </View>
            </View>
        </View>
    );
};

export default Home;
