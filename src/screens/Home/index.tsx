import React, { useEffect, useMemo, useState } from "react";
import { PressableScale } from "../../components/PressableScale";
import { ActivityIndicator, StatusBar, ScrollView, StyleProp, Text, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { createStyles } from "./style";
import { splitDollars } from "../../motion/motion";
import { useTheme } from "../../theme/useTheme";
import { assetPalette } from "../../theme/tokens";
import { ChainIcon, TokenIcon } from "../../art/CryptoIcon";
import { CubbyForScore, Icon, Sticker, UniverseCardArt } from "../../art/Art";
import { usePortfolio } from "../../state/portfolio";
import EmptyWallet from "./EmptyWallet";
import { useHealth } from "../../state/health";
import { Chart, buildPaths } from "../../components/PriceChart";
import { isFresh, key, peek, TTL, writeCache } from "../../services/cache";
import { STICKER_SLOTS } from "../../services/stickers";
import { SlidingSegmented } from "../../components/SlidingSelector";
import { AccountHeader } from "../../components/AccountHeader";
import { History, loadHistory, RangeKey } from "../../services/history";

const RANGES: RangeKey[] = ["1D", "1W", "1M", "3M", "1Y", "ALL"];
const PALETTE = [assetPalette.eth, assetPalette.usdc, assetPalette.btc, assetPalette.nft, assetPalette.defi];
const OTHER_COLOR = assetPalette.defi;

const usd = (n: number, digits = 0) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

const RiseView = ({ style, children }: { delay?: number; style?: StyleProp<ViewStyle>; children: React.ReactNode }) => (
    <View style={style}>{children}</View>
);

const Home = ({ onOpenUniverse, onOpenSwap, onOpenRecap, onOpenHealth, onOpenStickers, onWatchAddress }: {
    onOpenUniverse: () => void; onOpenSwap: () => void; onOpenRecap: () => void; onOpenHealth: () => void; onOpenStickers: () => void; onWatchAddress: () => void;
}) => {
    const insets = useSafeAreaInsets();
    const { scheme, palette } = useTheme();
    const styles = useMemo(() => createStyles(palette), [palette]);
    const { portfolio, error, address } = usePortfolio();
    const { health, stickers, recap } = useHealth();
    const earned = stickers.filter(x => x.earned).length;
    const [range, setRange] = useState<RangeKey>("1W");
    const [history, setHistory] = useState<History | null>(null);

    // Chart history is cached per account and range, so switching accounts or ranges shows it instantly.
    useEffect(() => {
        if (!portfolio?.holdings.length) return;
        const hk = key.history(address, range);
        const cached = peek<History>(hk);
        setHistory(cached?.value ?? null);
        if (isFresh(cached, TTL.history)) return;
        let cancelled = false;
        loadHistory(portfolio.holdings, range)
            .then(h => { writeCache(hk, h); if (!cancelled) setHistory(h); })
            .catch(e => console.warn("[history]", e));
        return () => { cancelled = true; };
    }, [portfolio, range, address]);

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
                    <View style={{ flex: 1 }} />
                    <PressableScale onPress={onOpenSwap} scale={0.94} style={styles.swapBtn} accessibilityRole="button" accessibilityLabel="Swap tokens">
                        <Icon name="swap" size={16} color={palette.onAccent} />
                        <Text style={styles.swapText}>Swap</Text>
                    </PressableScale>
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
                    {recap && (
                        <PressableScale onPress={onOpenRecap} accessibilityRole="button">
                            <Text style={styles.storyLink}>Watch your recap →</Text>
                        </PressableScale>
                    )}
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

                {health && (
                    <PressableScale style={[styles.card, styles.cubbyCard]} onPress={onOpenHealth} accessibilityRole="button" accessibilityLabel={`Cubby is at level ${health.level}. Health ${health.score}`}>
                        <View style={styles.cubbyIcon}><CubbyForScore score={health.score} height={52} /></View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.cubbyTitle}>Cubby is at level {health.level}</Text>
                            <Text style={styles.cubbyMeta}>
                                Health {health.score} · {health.score >= 90 ? "top level reached" : `${90 - health.score} points to Level 4`}
                            </Text>
                            <View style={styles.dots}>
                                {Array.from({ length: 10 }).map((_, i) => (
                                    <View key={i} style={[styles.dot, i >= Math.round(health.score / 10) && { opacity: 0.2 }]} />
                                ))}
                                <Text style={styles.dotsText}>{health.score}/100</Text>
                            </View>
                        </View>
                    </PressableScale>
                )}

                <RiseView delay={280} style={styles.twoCol}>
                    <PressableScale style={[styles.card, styles.tile]} onPress={onOpenUniverse} accessibilityRole="button" accessibilityLabel="Universe. Fly through your assets">
                        <View style={styles.tileArt}><UniverseCardArt width={72} /></View>
                        <Text style={styles.tileTitle}>Universe</Text>
                        <Text style={styles.tileDesc}>Fly through your assets</Text>
                    </PressableScale>
                    <PressableScale style={[styles.card, styles.tile]} onPress={onOpenStickers} accessibilityRole="button" accessibilityLabel={`Sticker book, ${earned} of ${STICKER_SLOTS} collected`}>
                        <View style={[styles.tileArt, { flexDirection: "row", gap: 4 }]}>
                            {stickers.filter(x => x.earned).slice(0, 2).map(x => <Sticker key={x.name} name={x.name} height={40} />)}
                        </View>
                        <Text style={styles.tileTitle}>Sticker book</Text>
                        <Text style={styles.tileDesc}>{earned} of {STICKER_SLOTS} collected</Text>
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
