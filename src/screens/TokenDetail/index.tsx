import Clipboard from "@react-native-clipboard/clipboard";
import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, Linking, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../art/Art";
import { ChainIcon, TokenIcon } from "../../art/CryptoIcon";
import { Chart, buildPaths } from "../../components/PriceChart";
import { PressableScale } from "../../components/PressableScale";
import { SlidingSegmented } from "../../components/SlidingSelector";
import { TactileButton } from "../../components/TactileButton";
import { CHAINS } from "../../config/chains";
import { useRise } from "../../motion/motion";
import { isFresh, key, peek, readCache, writeCache } from "../../services/cache";
import { fmtAmount, fmtDelta, usd, usdCompact } from "../../services/format";
import { getHistory } from "../../services/prices";
import { Holding } from "../../services/portfolio";
import { explorerAddress } from "../../services/swap";
import { loadTokenInfo, peekTokenInfo, TokenInfo, TokenRef, coinIdFor } from "../../services/tokenInfo";
import { useActivity } from "../../state/activity";
import { usePortfolio } from "../../state/portfolio";
import { Palette } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

const RANGES = ["1D", "1W", "1M", "3M", "1Y"] as const;
type Range = (typeof RANGES)[number];
const DAYS: Record<Range, number> = { "1D": 1, "1W": 7, "1M": 30, "3M": 90, "1Y": 365 };
const HIST_TTL = 5 * 60_000;
const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const compact = (n: number) => n.toLocaleString("en-US", { notation: "compact", maximumFractionDigits: 2 });

const Stat = ({ label, value, sub, p, last }: { label: string; value: string; sub?: string; p: Palette; last?: boolean }) => (
    <View style={[styles.statRow, !last && { borderBottomWidth: 1, borderBottomColor: p.border }]}>
        <Text style={[styles.statLabel, { color: p.textSecondary }]}>{label}</Text>
        <View style={{ alignItems: "flex-end" }}>
            <Text style={[styles.statValue, { color: p.text }]}>{value}</Text>
            {sub ? <Text style={[styles.statSub, { color: p.textSecondary }]}>{sub}</Text> : null}
        </View>
    </View>
);

/** Everything about one token: price and chart, your position, market data, contracts and your recent activity. */
const TokenDetail = ({ holding, onBack, onSwap }: { holding: Holding; onBack: () => void; onSwap: (h: Holding) => void }) => {
    const insets = useSafeAreaInsets();
    const { scheme, palette: p } = useTheme();
    const { portfolio } = usePortfolio();
    const { data: activity } = useActivity();
    const dark = scheme === "dark";
    const chain = CHAINS.find(c => c.id === holding.chain)!;
    const ref = useMemo<TokenRef>(() => ({ chain, address: holding.address, symbol: holding.symbol }), [chain, holding.address, holding.symbol]);

    const [range, setRange] = useState<Range>("1W");
    const [info, setInfo] = useState<TokenInfo | null>(() => peekTokenInfo(ref));
    const [infoFailed, setInfoFailed] = useState(false);
    const [points, setPoints] = useState<number[] | null>(null);
    const [copied, setCopied] = useState<string | null>(null);
    const r1 = useRise(0), r2 = useRise(50), r3 = useRise(100), r4 = useRise(150);

    useEffect(() => {
        let cancelled = false;
        loadTokenInfo(ref).then(i => { if (!cancelled) { setInfo(i); setInfoFailed(false); } }).catch(() => { if (!cancelled) setInfoFailed(true); });
        return () => { cancelled = true; };
    }, [ref]);

    // chart history per range, cached
    useEffect(() => {
        let cancelled = false;
        const hk = key.token(coinIdFor(ref) ?? `${chain.id}:${holding.address}`, range);
        const cached = peek<number[]>(hk);
        setPoints(cached?.value ?? null);
        if (isFresh(cached, HIST_TTL)) return;
        (async () => {
            const disk = await readCache<number[]>(hk);
            if (cancelled) return;
            if (disk && !cached) setPoints(disk.value);
            if (isFresh(disk, HIST_TTL)) return;
            try {
                const series = await getHistory(holding.address ? { platform: chain.cgPlatform, address: holding.address } : { native: true }, DAYS[range]);
                const pts = series.map(x => x[1]);
                if (!cancelled && pts.length > 1) { writeCache(hk, pts); setPoints(pts); }
            } catch { /* keep whatever we have */ }
        })();
        return () => { cancelled = true; };
    }, [ref, range, chain, holding.address]);

    const price = info?.price ?? holding.price;
    const seriesChange = points && points.length > 1 ? ((points[points.length - 1] - points[0]) / points[0]) * 100 : null;
    const shownChange = seriesChange ?? info?.change24h ?? holding.change24h;
    const delta = fmtDelta(shownChange);

    const { line, area, last } = useMemo(() => buildPaths(points && points.length > 1 ? points : [0, 0]), [points]);

    const sameSymbol = (portfolio?.holdings ?? []).filter(h => h.symbol === holding.symbol);
    const totalValue = sameSymbol.reduce((s, h) => s + h.value, 0);
    const totalAmount = sameSymbol.reduce((s, h) => s + h.amount, 0);
    const share = portfolio?.total ? (totalValue / portfolio.total) * 100 : 0;
    const mine = (activity?.items ?? []).filter(r => r.meta.includes(holding.symbol) || r.meta.toLowerCase().includes(holding.name.toLowerCase())).slice(0, 5);

    const copy = (addr: string) => { Clipboard.setString(addr); setCopied(addr); setTimeout(() => setCopied(c => (c === addr ? null : c)), 1800); };
    const nameOf = info?.name ?? holding.name;

    return (
        <View style={[styles.root, { backgroundColor: p.bg }]}>
            <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <Pressable style={[styles.back, { backgroundColor: p.surface, borderColor: p.border }]} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
                    <Icon name="back" size={22} color={p.text} />
                </Pressable>
                <View style={[styles.titlePill, { backgroundColor: p.surface, borderColor: p.border }]}>
                    <Text style={[styles.titleText, { color: p.text }]}>{holding.symbol}</Text>
                </View>
                <View style={{ width: 44 }} />
            </View>

            <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 120 }} showsVerticalScrollIndicator={false}>
                <Animated.View style={r1}>
                    <View style={styles.hero}>
                        <View style={{ width: 64, height: 64 }}>
                            <TokenIcon symbol={holding.symbol} size={64} dark={dark} />
                            <View style={styles.heroBadge}><ChainIcon chain={chain.name} size={24} dark={dark} /></View>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={[styles.name, { color: p.text }]} numberOfLines={1}>{nameOf}</Text>
                            <Text style={[styles.sub, { color: p.textSecondary }]}>{holding.symbol}{info?.rank ? ` · Rank #${info.rank}` : ""}</Text>
                        </View>
                    </View>
                    <Text style={[styles.price, { color: p.text }]}>{usd(price, price < 1 ? 4 : 2)}</Text>
                    <View style={[styles.deltaPill, { backgroundColor: delta.tone === "up" ? p.positiveTint : delta.tone === "down" ? p.negativeTint : p.neutralTint }]}>
                        <Text style={{ fontSize: 15, fontWeight: "700", color: delta.tone === "up" ? p.positive : delta.tone === "down" ? p.negative : p.textSecondary }}>
                            {delta.text}{seriesChange != null ? ` · ${range}` : " · 24h"}
                        </Text>
                    </View>

                    <View style={{ marginTop: 18 }}>
                        {points ? <Chart line={line} area={area} last={last} p={p} id="tokfill" /> : <View style={styles.chartLoading}><ActivityIndicator /></View>}
                    </View>
                    <SlidingSegmented
                        options={RANGES} value={range} onChange={r => setRange(r as Range)}
                        trackColor={p.surface2} pillColor={p.text} activeColor={p.bg} inactiveColor={p.textSecondary}
                        height={40} radius={20} style={{ marginTop: 16 }} textStyle={{ fontSize: 14 }}
                    />
                </Animated.View>

                <Animated.View style={r2}>
                    <Text style={[styles.section, { color: p.text }]}>Your position</Text>
                    <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }]}>
                        <Stat label="Balance" value={`${fmtAmount(totalAmount)} ${holding.symbol}`} p={p} />
                        <Stat label="Value" value={usd(totalValue, 2)} p={p} />
                        <Stat label="Share of your wallet" value={`${share.toFixed(share < 1 ? 2 : 1)}%`} p={p} last={sameSymbol.length < 2} />
                        {sameSymbol.length > 1 && sameSymbol.map((h, i) => (
                            <View key={`${h.chain}-${h.address}`} style={[styles.chainRow, i === 0 && { borderTopWidth: 1, borderTopColor: p.border }]}>
                                <ChainIcon chain={CHAINS.find(c => c.id === h.chain)!.name} size={26} dark={dark} />
                                <Text style={[styles.chainName, { color: p.text }]}>{CHAINS.find(c => c.id === h.chain)!.name}</Text>
                                <Text style={[styles.statValue, { color: p.text }]}>{fmtAmount(h.amount)} · {usd(h.value, 2)}</Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>

                <Animated.View style={r3}>
                    <Text style={[styles.section, { color: p.text }]}>Market</Text>
                    <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }]}>
                        {info ? (
                            <>
                                <Stat label="Market cap" value={info.marketCap != null ? usdCompact(info.marketCap) : "—"} p={p} />
                                <Stat label="24h volume" value={info.volume24h != null ? usdCompact(info.volume24h) : "—"} p={p} />
                                <Stat label="24h range" value={info.low24h != null && info.high24h != null ? `${usd(info.low24h, 2)} – ${usd(info.high24h, 2)}` : "—"} p={p} />
                                <Stat label="Circulating supply" value={info.circulating != null ? `${compact(info.circulating)} ${holding.symbol}` : "—"} sub={info.maxSupply ? `Max ${compact(info.maxSupply)}` : undefined} p={p} />
                                <Stat label="All-time high" value={info.ath != null ? usd(info.ath, 2) : "—"} sub={info.athChangePct != null ? `${info.athChangePct.toFixed(1)}% from ATH` : undefined} p={p} last />
                            </>
                        ) : (
                            <View style={{ paddingVertical: 22, alignItems: "center", gap: 8 }}>
                                {infoFailed ? null : <ActivityIndicator />}
                                <Text style={[styles.statSub, { color: p.textSecondary, textAlign: "center" }]}>
                                    {infoFailed ? "Market data isn't available right now. Try again in a moment." : "Loading market data…"}
                                </Text>
                            </View>
                        )}
                    </View>
                </Animated.View>

                <Animated.View style={r4}>
                    <Text style={[styles.section, { color: p.text }]}>{holding.address ? "Contract" : "About this asset"}</Text>
                    <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }]}>
                        {holding.address ? (
                            sameSymbol.filter(h => h.address).map((h, i, arr) => {
                                const c = CHAINS.find(x => x.id === h.chain)!;
                                return (
                                    <View key={`${h.chain}-${h.address}`} style={[styles.contractRow, i < arr.length - 1 && { borderBottomWidth: 1, borderBottomColor: p.border }]}>
                                        <ChainIcon chain={c.name} size={26} dark={dark} />
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.statLabel, { color: p.textSecondary }]}>{c.name}</Text>
                                            <Text style={[styles.mono, { color: p.text }]}>{short(h.address!)}</Text>
                                        </View>
                                        <PressableScale onPress={() => copy(h.address!)} style={[styles.miniBtn, { backgroundColor: p.surface2 }]} accessibilityRole="button" accessibilityLabel="Copy contract address">
                                            <Text style={[styles.miniText, { color: p.text }]}>{copied === h.address ? "Copied ✓" : "Copy"}</Text>
                                        </PressableScale>
                                        <PressableScale onPress={() => Linking.openURL(explorerAddress(c, h.address!)).catch(() => {})} style={[styles.miniBtn, { backgroundColor: p.surface2 }]} accessibilityRole="link" accessibilityLabel="View on explorer">
                                            <Text style={[styles.miniText, { color: p.text }]}>Explorer ↗</Text>
                                        </PressableScale>
                                    </View>
                                );
                            })
                        ) : (
                            <Text style={[styles.statSub, { color: p.textSecondary, padding: 18, lineHeight: 20 }]}>
                                ETH is the native asset of Ethereum, Base and Arbitrum, so it has no token contract. It pays network fees on all three.
                            </Text>
                        )}
                    </View>

                    {mine.length > 0 && (
                        <>
                            <Text style={[styles.section, { color: p.text }]}>Your {holding.symbol} activity</Text>
                            <View style={[styles.card, { backgroundColor: p.surface, borderColor: p.border }]}>
                                {mine.map((r, i) => (
                                    <View key={r.hash} style={[styles.actRow, i < mine.length - 1 && { borderBottomWidth: 1, borderBottomColor: p.border }]}>
                                        <View style={{ flex: 1 }}>
                                            <Text style={[styles.statValue, { color: p.text }]}>{r.title}{r.status === "pending" ? " · Pending" : r.status === "failed" ? " · Failed" : ""}</Text>
                                            <Text style={[styles.statSub, { color: p.textSecondary }]} numberOfLines={1}>{r.meta}</Text>
                                        </View>
                                        <Text style={[styles.statSub, { color: p.textSecondary }]}>{r.day === "Today" || r.day === "Yesterday" ? r.time : r.day}</Text>
                                    </View>
                                ))}
                            </View>
                        </>
                    )}
                </Animated.View>
            </ScrollView>

            <View style={[styles.cta, { paddingBottom: insets.bottom + 12 }]} pointerEvents="box-none">
                <TactileButton title={`Swap ${holding.symbol}`} onPress={() => onSwap(holding)} />
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 6 },
    back: { width: 44, height: 44, borderRadius: 22, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    titlePill: { borderWidth: 1, borderRadius: 22, paddingHorizontal: 26, height: 44, justifyContent: "center" },
    titleText: { fontSize: 18, fontWeight: "700" },
    hero: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 16 },
    heroBadge: { position: "absolute", right: -4, bottom: -4 },
    name: { fontSize: 22, fontWeight: "700", letterSpacing: -0.5 },
    sub: { fontSize: 15, marginTop: 2 },
    price: { fontSize: 52, fontWeight: "700", letterSpacing: -2, marginTop: 18, fontVariant: ["tabular-nums"] },
    deltaPill: { alignSelf: "flex-start", borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7, marginTop: 8 },
    chartLoading: { height: 150, alignItems: "center", justifyContent: "center" },
    section: { fontSize: 22, fontWeight: "700", letterSpacing: -0.5, marginTop: 28, marginBottom: 10 },
    card: { borderWidth: 1, borderRadius: 24, paddingHorizontal: 18 },
    statRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 14 },
    statLabel: { fontSize: 15 },
    statValue: { fontSize: 16, fontWeight: "600", fontVariant: ["tabular-nums"] },
    statSub: { fontSize: 13, marginTop: 2 },
    chainRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12 },
    chainName: { flex: 1, fontSize: 15, fontWeight: "600" },
    contractRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14 },
    mono: { fontSize: 15, fontWeight: "600", marginTop: 2, fontVariant: ["tabular-nums"] },
    miniBtn: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
    miniText: { fontSize: 13, fontWeight: "700" },
    actRow: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 13 },
    cta: { position: "absolute", left: 20, right: 20, bottom: 0 },
});

export default TokenDetail;
