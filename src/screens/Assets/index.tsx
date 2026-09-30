import { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChainIcon, TokenIcon } from "../../art/CryptoIcon";
import { AccountHeader } from "../../components/AccountHeader";
import { CHAINS } from "../../config/chains";
import { fmtAmount, fmtDelta, usd } from "../../services/format";
import { usePortfolio } from "../../state/portfolio";
import { Palette, radius } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

const DUST_USD = 1;
const KINDS = ["Tokens", "NFTs", "DeFi"] as const;

const Assets = () => {
    const insets = useSafeAreaInsets();
    const { scheme, palette } = useTheme();
    const s = useMemo(() => createStyles(palette), [palette]);
    const { portfolio, error } = usePortfolio();
    const [kind, setKind] = useState<(typeof KINDS)[number]>("Tokens");
    const [chain, setChain] = useState<string>("all");
    const [showDust, setShowDust] = useState(false);

    const chainName = CHAINS.find(c => c.id === chain)?.name;
    const inChain = useMemo(
        () => (portfolio?.holdings ?? [])
            .filter(h => chain === "all" || h.chain === chain)
            .sort((a, b) => b.value - a.value),
        [portfolio, chain],
    );
    const dust = inChain.filter(h => h.value < DUST_USD);
    const rows = showDust ? inChain : inChain.filter(h => h.value >= DUST_USD);
    const total = inChain.reduce((sum, h) => sum + h.value, 0);

    return (
        <ScrollView contentContainerStyle={[s.scroll, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>
            <AccountHeader />

            <View style={s.titleRow}>
                <Text style={s.title}>Assets</Text>
                <Text style={s.total}>{portfolio ? usd(total, 2) : "—"}</Text>
            </View>

            <View style={s.segmented}>
                {KINDS.map(k => (
                    <Pressable key={k} style={[s.seg, k === kind && s.segOn]} onPress={() => setKind(k)} accessibilityRole="button" accessibilityState={{ selected: k === kind }}>
                        <Text style={[s.segText, k === kind && s.segTextOn]}>{k}</Text>
                    </Pressable>
                ))}
            </View>

            {kind !== "Tokens" ? (
                <View style={s.empty}>
                    <Text style={s.emptyTitle}>{kind} are coming soon</Text>
                    <Text style={s.emptyBody}>Tokens are live today. {kind} will show up here once they're supported.</Text>
                </View>
            ) : (
                <>
                    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.chips} style={s.chipScroll}>
                        {[{ id: "all", name: "All" }, ...CHAINS].map(c => {
                            const on = c.id === chain;
                            return (
                                <Pressable key={c.id} onPress={() => setChain(c.id)} style={[s.chip, on && s.chipOn]} accessibilityRole="button" accessibilityState={{ selected: on }}>
                                    <Text style={[s.chipText, on && s.chipTextOn]}>{c.name}</Text>
                                </Pressable>
                            );
                        })}
                    </ScrollView>

                    {error && <Text style={s.error}>Couldn't load wallet: {error}</Text>}
                    {!portfolio && !error && <ActivityIndicator style={{ marginTop: 24 }} />}

                    {portfolio && inChain.length === 0 && (
                        <View style={s.empty}>
                            <Text style={s.emptyTitle}>Nothing on {chainName ?? "this wallet"} yet</Text>
                            <Text style={s.emptyBody}>Anything you bridge or receive there shows up here on its own.</Text>
                        </View>
                    )}

                    {rows.map((h, i) => {
                        const d = fmtDelta(h.change24h);
                        const chainInfo = CHAINS.find(c => c.id === h.chain)!;
                        return (
                            <View key={`${h.chain}-${h.address ?? "native"}`} style={[s.row, i === rows.length - 1 && { borderBottomWidth: 0 }]}>
                                <View style={s.iconWrap}>
                                    <TokenIcon symbol={h.symbol} size={46} dark={scheme === "dark"} />
                                    <View style={s.chainBadge}><ChainIcon chain={chainInfo.name} size={20} dark={scheme === "dark"} /></View>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={s.name} numberOfLines={1}>{h.name}</Text>
                                    <Text style={s.balance} numberOfLines={1}>{fmtAmount(h.amount)} {h.symbol}</Text>
                                </View>
                                <View style={s.right}>
                                    <Text style={s.value}>{usd(h.value, 2)}</Text>
                                    <View style={[s.delta, s[d.tone]]}>
                                        <Text style={[s.deltaText, s[`${d.tone}Text` as const]]}>{d.text}</Text>
                                    </View>
                                </View>
                            </View>
                        );
                    })}

                    {dust.length > 0 && (
                        <View style={s.dust}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.dustTitle}>{showDust ? `Showing ${dust.length} tiny tokens` : `${dust.length} tiny tokens hidden`}</Text>
                                <Text style={s.dustBody}>Dust and unverified airdrops. Often scams.</Text>
                            </View>
                            <Switch
                                value={showDust}
                                onValueChange={setShowDust}
                                trackColor={{ true: palette.accent, false: palette.surface2 }}
                                accessibilityLabel="Show tiny tokens"
                            />
                        </View>
                    )}
                </>
            )}
        </ScrollView>
    );
};

const createStyles = (p: Palette) => StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingBottom: 130 },
    titleRow: { flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", marginTop: 26 },
    title: { fontSize: 46, fontWeight: "700", letterSpacing: -1.9, color: p.text },
    total: { fontSize: 20, fontWeight: "700", color: p.text, marginBottom: 8, fontVariant: ["tabular-nums"] },
    segmented: { flexDirection: "row", backgroundColor: p.surface2, borderRadius: radius.control + 6, padding: 5, marginTop: 18 },
    seg: { flex: 1, alignItems: "center", paddingVertical: 12, borderRadius: radius.control },
    segOn: { backgroundColor: p.surface },
    segText: { fontSize: 16, fontWeight: "600", color: p.textSecondary },
    segTextOn: { color: p.text },
    chipScroll: { marginHorizontal: -20 },
    chips: { gap: 10, paddingHorizontal: 20, paddingVertical: 16 },
    chip: { backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: radius.chip + 6, paddingHorizontal: 20, height: 44, justifyContent: "center" },
    chipOn: { backgroundColor: p.text, borderColor: p.text },
    chipText: { fontSize: 16, fontWeight: "600", color: p.text },
    chipTextOn: { color: p.bg },
    row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: p.border },
    iconWrap: { width: 50, height: 50 },
    chainBadge: { position: "absolute", right: -4, bottom: -4 },
    name: { fontSize: 18, fontWeight: "700", color: p.text },
    balance: { fontSize: 15, color: p.textSecondary, marginTop: 2 },
    right: { alignItems: "flex-end", gap: 6 },
    value: { fontSize: 18, fontWeight: "700", color: p.text, fontVariant: ["tabular-nums"] },
    delta: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
    up: { backgroundColor: p.positiveTint },
    down: { backgroundColor: p.negativeTint },
    flat: { backgroundColor: p.neutralTint },
    deltaText: { fontSize: 14, fontWeight: "700" },
    upText: { color: p.positive },
    downText: { color: p.negative },
    flatText: { color: p.textSecondary },
    dust: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 24, padding: 18, marginTop: 20 },
    dustTitle: { fontSize: 18, fontWeight: "700", color: p.text },
    dustBody: { fontSize: 14, color: p.textSecondary, marginTop: 4 },
    empty: { alignItems: "center", paddingVertical: 48, paddingHorizontal: 24 },
    emptyTitle: { fontSize: 20, fontWeight: "700", color: p.text, textAlign: "center" },
    emptyBody: { fontSize: 15, color: p.textSecondary, textAlign: "center", marginTop: 8, lineHeight: 22 },
    error: { color: p.negative, fontSize: 14, marginTop: 16 },
});

export default Assets;
