import React, { useEffect, useMemo, useState } from "react";
import { PressableScale } from "../../components/PressableScale";
import { ActivityIndicator, StatusBar, ScrollView, StyleProp, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Circle, Defs, LinearGradient, Path, Stop } from "react-native-svg";
import { createStyles } from "./style";
import { splitDollars } from "../../motion/motion";
import { useTheme } from "../../theme/useTheme";
import { assetPalette, Palette } from "../../theme/tokens";
import { ChainIcon, TokenIcon } from "../../art/CryptoIcon";
import { Sticker, UniverseCardArt } from "../../art/Art";
import { usePortfolio } from "../../state/portfolio";
import EmptyWallet from "./EmptyWallet";
import { SlidingSegmented } from "../../components/SlidingSelector";
import { AccountHeader } from "../../components/AccountHeader";
import { History, loadHistory, RangeKey } from "../../services/history";

const RANGES: RangeKey[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];
const PALETTE = [assetPalette.eth, assetPalette.usdc, assetPalette.btc, assetPalette.nft, assetPalette.defi];
const OTHER_COLOR = assetPalette.defi;

const usd = (n: number, digits = 0) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

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

const RiseView = ({ style, children }: { delay?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) => (
    <View style={style}>{children}</View>
);

const Chart = ({ line, area, last, p }: { line: string; area: string; last: { x: number; y: number }; p: Palette }) => (
    <Svg width="100%" height={CHART_H} viewBox={`0 0 ${CHART_W} ${CHART_H}`}>
        <Defs>
            <LinearGradient id="fill" x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={p.accent} stopOpacity={0.55} />
                <Stop offset="1" stopColor={p.accent} stopOpacity={0.05} />
            </LinearGradient>
        </Defs>
        <Path d={area} fill="url(#fill)" />
        <Path d={line} stroke={p.text} strokeWidth={2.5} fill="none" strokeLinejoin="round" strokeLinecap="round" />
        <Circle cx={last.x} cy={last.y} r={5} fill={p.accent} stroke={p.text} strokeWidth={2} />
    </Svg>
);

const Home = ({ onOpenUniverse, onWatchAddress }: { onOpenUniverse: () => void; onWatchAddress: () => void }) => {
    const insets = useSafeAreaInsets();
    const { scheme, palette } = useTheme();
    const styles = useMemo(() => createStyles(palette), [palette]);
    const { portfolio, error } = usePortfolio();
    const [range, setRange] = useState<RangeKey>("1W");
    const [history, setHistory] = useState<History | null>(null);

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
        const rows = top.map((t, i) => ({ chip: t.symbol, name: t.name, value: t.value, color: PALETTE[i] }));
        if (rest.length) rows.push({ chip: `+${rest.length}`, name: "Other", value: rest.reduce((s, r) => s + r.value, 0), color: OTHER_COLOR });
        return rows;
    }, [portfolio]);

    const total = portfolio?.total ?? 0;
    const { dollars, cents } = splitDollars(total);
    const up = (history?.change ?? 0) >= 0;
    const rangeLabel = range === "1D" ? "today" : range === "ALL" ? "all time" : `over ${range}`;
    const gains = (history?.contributions ?? []).filter(c => c.delta > 0).slice(0, 3);
    const gainTotal = gains.reduce((s, g) => s + g.delta, 0);
    const lead = history?.contributions[0];

    if (portfolio && portfolio.holdings.length === 0) {
        return <EmptyWallet onWatchAddress={onWatchAddress} />;
    }

    return (
        <View style={styles.root}>
            <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />
            <ScrollView
                contentContainerStyle={[styles.scroll, { paddingTop: insets.top + 8 }]}
                showsVerticalScrollIndicator={false}
            >
                <AccountHeader />

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
                    <Chart line={line} area={area} last={last} p={palette} />
                </View>

                <SlidingSegmented
                    options={RANGES}
                    value={range}
                    onChange={r => setRange(r as RangeKey)}
                    trackColor={palette.surface2}
                    pillColor={palette.text}
                    activeColor={palette.bg}
                    inactiveColor={palette.textSecondary}
                    height={40}
                    radius={20}
                    style={{ marginTop: 20 }}
                    textStyle={{ fontSize: 14 }}
                />

                <RiseView delay={120} style={styles.story}>
                    <View style={styles.storyTag}>
                        <Sticker name="hello" height={22} />
                        <Text style={styles.storyTagText}>{range === "1W" ? "This week's story" : range === "1D" ? "Today's story" : range === "ALL" ? "All-time story" : `Your ${range} story`}</Text>
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
                        <TokenIcon symbol={a.chip} size={34} dark={scheme === "dark"} fallbackColor={a.color} />
                        <Text style={styles.assetName}>{a.name}</Text>
                        <Text style={styles.assetValue}>{usd(a.value)}</Text>
                        <Text style={styles.assetPct}>{((a.value / (total || 1)) * 100).toFixed(1)}%</Text>
                    </RiseView>
                ))}

                <RiseView delay={280} style={styles.twoCol}>
                    <PressableScale style={[styles.card, styles.tile]} onPress={onOpenUniverse} accessibilityRole="button" accessibilityLabel="Universe. Fly through your assets">
                        <View style={styles.tileArt}><UniverseCardArt width={72} /></View>
                        <Text style={styles.tileTitle}>Universe</Text>
                        <Text style={styles.tileDesc}>Fly through your assets</Text>
                    </PressableScale>
                </RiseView>

                <View style={styles.sectionRow}>
                    <Text style={styles.sectionTitle}>Across chains</Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chains}>
                    {(portfolio?.byChain ?? []).filter(c => c.value > 0).map(({ chain: c, value }) => (
                        <View key={c.id} style={styles.chain}>
                            <ChainIcon chain={c.name} size={36} dark={scheme === "dark"} />
                            <View>
                                <Text style={styles.chainName}>{c.name}</Text>
                                <Text style={styles.chainValue}>{usd(value)}</Text>
                            </View>
                        </View>
                    ))}
                </ScrollView>
            </ScrollView>

        </View>
    );
};

export default Home;
