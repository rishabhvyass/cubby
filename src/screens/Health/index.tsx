import { useEffect, useMemo } from "react";
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Cubby, Icon, Sticker } from "../../art/Art";
import { TokenIcon } from "../../art/CryptoIcon";
import { AccountHeader } from "../../components/AccountHeader";
import GroundShadow from "../../components/GroundShadow";
import { TactileButton } from "../../components/TactileButton";
import { PressableScale } from "../../components/PressableScale";
import { Approval, revokeUrl } from "../../services/health";
import { short } from "../../services/activity";
import { STICKER_SLOTS } from "../../services/stickers";
import { usePortfolio } from "../../state/portfolio";
import { easeOut, useFloat, usePop, useRise, useWobble } from "../../motion/motion";
import { useHealth } from "../../state/health";
import { CHAINS } from "../../config/chains";
import { DOTO } from "../../theme/fonts";
import { labelForScore, Palette } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

const ScoreBar = ({ score, p }: { score: number; p: Palette }) => {
    const w = useSharedValue(0);
    useEffect(() => { w.value = withTiming(score / 100, { duration: 700, easing: easeOut }); }, [score]); // eslint-disable-line react-hooks/exhaustive-deps
    const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
    return (
        <View style={[bar.track, { backgroundColor: p.surface2 }]}>
            <Animated.View style={[bar.fill, { backgroundColor: p.accent, borderColor: p.positive }, fill]} />
        </View>
    );
};
const bar = StyleSheet.create({
    track: { height: 14, borderRadius: 7, overflow: "hidden" },
    fill: { height: 14, borderRadius: 7, borderWidth: 1.5 },
});

// Mascot pops whenever the level changes (key remounts it) and floats gently.
const Mascot = ({ level }: { level: 1 | 2 | 3 | 4 }) => {
    const pop = usePop(0, 700);
    const float = useFloat({ durationMs: 6000 });
    return (
        <Animated.View style={pop}>
            <Animated.View style={float}><Cubby level={level} height={level === 4 ? 128 : 120} /></Animated.View>
        </Animated.View>
    );
};

const Flag = ({ children }: { children: React.ReactNode }) => {
    const wobble = useWobble(1600);
    return <Animated.View style={wobble}>{children}</Animated.View>;
};

const ago = (ts: number) => {
    const d = Math.floor((Date.now() - ts) / 86400000);
    return d < 1 ? "today" : d === 1 ? "yesterday" : d < 60 ? `${d} days ago` : `${Math.floor(d / 30)} months ago`;
};
const sinceLabel = (ts: number) => new Date(ts).toLocaleDateString("en-US", { month: "short", year: "numeric" });

const Health = ({ onOpenStickers }: { onOpenStickers: () => void }) => {
    const insets = useSafeAreaInsets();
    const { scheme, palette: p } = useTheme();
    const s = useMemo(() => createStyles(p), [p]);
    const { address } = usePortfolio();
    const { health, loading, stickers } = useHealth();
    const score = health?.score ?? 0;
    const level = health?.level ?? 1;
    const earned = stickers.filter(x => x.earned).length;
    const riseA = useRise(0), riseB = useRise(60);
    const nextText = score >= 90 ? "Top level reached. Crown earned." : `${90 - score} points to Level 4`;
    const unresolved = (health?.approvals ?? []).filter(a => a.unlimited).length;

    const revoke = (a: Approval) => Linking.openURL(revokeUrl(address, a.chain)).catch(() => {});

    return (
        <ScrollView contentContainerStyle={[s.scroll, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>
            <AccountHeader />
            <Text style={s.title}>Health</Text>

            {!health ? (
                <View style={s.loading}>
                    {loading ? <ActivityIndicator /> : null}
                    <Text style={s.loadingText}>{loading ? "Checking approvals and activity…" : "Couldn't read this wallet's health."}</Text>
                </View>
            ) : (
                <>
                    <Animated.View style={[s.card, s.scoreCard, riseA]}>
                        <View style={s.scoreRow}>
                            <View style={{ flex: 1 }}>
                                <Text style={s.scoreLabel}>Health score</Text>
                                <Text style={s.scoreNum}>{score}</Text>
                                <View style={s.levelChip}>
                                    <Text style={s.levelText}>{labelForScore(score)} · Level {level}</Text>
                                </View>
                            </View>
                            <View style={s.mascot}>
                                <Mascot key={level} level={level} />
                                <GroundShadow width={120} height={14} style={{ marginTop: 6 }} />
                            </View>
                        </View>
                        <View style={s.barRow}>
                            <Text style={s.barText}>{nextText}</Text>
                            <Text style={s.barText}>{score} / 100</Text>
                        </View>
                        <ScoreBar score={score} p={p} />
                    </Animated.View>

                    <Animated.View style={[s.card, s.streak, riseB]}>
                        <Sticker name="hello" height={44} />
                        <View style={{ flex: 1 }}>
                            <Text style={s.streakTitle}>{health.since ? `On-chain since ${sinceLabel(health.since)}` : "Wallet history"}</Text>
                            <Text style={s.approvalMeta}>{health.totalTx.toLocaleString("en-US")} transactions across Ethereum, Base and Arbitrum</Text>
                        </View>
                    </Animated.View>

                    <PressableScale style={[s.unlock, { backgroundColor: p.accent, borderColor: p.buttonEdge }]} onPress={onOpenStickers} accessibilityRole="button" accessibilityLabel={`Sticker book, ${earned} of ${STICKER_SLOTS} collected`}>
                        <View style={{ flex: 1 }}>
                            <Text style={[s.unlockKicker, { color: p.onAccent }]}>Sticker book</Text>
                            <Text style={[s.unlockTitle, { color: p.onAccent }]}>{earned} of {STICKER_SLOTS} collected</Text>
                        </View>
                        <Text style={[s.unlockCta, { color: p.onAccent }]}>View →</Text>
                    </PressableScale>

                    <Text style={s.section}>Checkup</Text>
                    {health.checks.map((c, i) => (
                        <View key={c.id} style={[s.checkRow, i === health.checks.length - 1 && { borderBottomWidth: 1, borderBottomColor: p.border }]}>
                            <View style={[s.checkIcon, { backgroundColor: c.ok ? p.positiveTint : p.cautionTint }]}>
                                {c.ok
                                    ? <Icon name="check" size={16} color={p.positive} />
                                    : <Text style={{ fontSize: 15, fontWeight: "800", color: p.caution }}>!</Text>}
                            </View>
                            <Text style={s.checkText}>{c.text}</Text>
                        </View>
                    ))}

                    <Text style={[s.section, { marginTop: 32 }]}>Token approvals</Text>
                    <Text style={s.approvalsIntro}>
                        Apps you've allowed to move your tokens. "Unlimited" means all of them. Revoking opens revoke.cash, where you sign with your own wallet.
                    </Text>

                    {health.approvals.length === 0 && (
                        <Text style={s.approvalsIntro}>No active approvals found. Nice and tidy.</Text>
                    )}
                    {health.approvals.map(a => (
                        <View key={a.id} style={[s.approval, a.risky && { backgroundColor: p.negativeTint, borderColor: p.negative, borderWidth: 2 }]}>
                            {a.risky
                                ? <Flag><TokenIcon symbol={a.symbol} size={44} dark={scheme === "dark"} /></Flag>
                                : <TokenIcon symbol={a.symbol} size={44} dark={scheme === "dark"} />}
                            <View style={{ flex: 1 }}>
                                <Text style={s.spender}>{a.spenderName ?? "Unknown contract"}</Text>
                                <Text style={[s.approvalMeta, a.risky && { color: p.negative }]}>
                                    {a.symbol} · {a.chain.name} · {a.unlimited ? "unlimited" : "limited"}
                                    {a.spenderName ? "" : ` · unverified · ${short(a.spender)}`}
                                    {a.approvedTs ? ` · approved ${ago(a.approvedTs)}` : ""}
                                </Text>
                            </View>
                            <TactileButton title="Revoke" variant="outline" accent={a.risky} onPress={() => revoke(a)} style={{ paddingHorizontal: 16 }} />
                        </View>
                    ))}
                    <Text style={s.footnote}>
                        Checks your own approval history plus common apps and tokens on {CHAINS.map(c => c.name).join(", ")}. {unresolved ? `${unresolved} unlimited to review.` : ""}
                    </Text>
                </>
            )}
        </ScrollView>
    );
};

const createStyles = (p: Palette) => StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingBottom: 130 },
    title: { fontSize: 46, fontWeight: "700", letterSpacing: -1.9, color: p.text, marginTop: 22 },
    card: { backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 28 },
    scoreCard: { padding: 20, marginTop: 16 },
    scoreRow: { flexDirection: "row", alignItems: "center" },
    scoreLabel: { fontSize: 15, fontWeight: "600", color: p.textSecondary },
    scoreNum: { fontFamily: DOTO, fontSize: 88, lineHeight: 96, color: p.text, marginTop: 4 },
    levelChip: { alignSelf: "flex-start", backgroundColor: p.positiveTint, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8, marginTop: 8 },
    levelText: { fontSize: 15, fontWeight: "700", color: p.positive },
    mascot: { alignItems: "center", width: 140 },
    barRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 20, marginBottom: 10 },
    barText: { fontSize: 14, color: p.textSecondary, fontVariant: ["tabular-nums"] },
    streak: { flexDirection: "row", alignItems: "center", gap: 16, padding: 18, marginTop: 12 },
    streakTitle: { fontSize: 17, fontWeight: "700", color: p.text },
    squares: { flexDirection: "row", gap: 4, marginTop: 10 },
    square: { width: 16, height: 16, borderRadius: 4, backgroundColor: p.accent, borderWidth: 1.5, borderColor: p.positive },
    section: { fontSize: 24, fontWeight: "700", letterSpacing: -0.6, color: p.text, marginTop: 28, marginBottom: 6 },
    checkRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 16, borderTopWidth: 1, borderTopColor: p.border },
    checkIcon: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
    checkText: { fontSize: 17, color: p.text },
    approvalsIntro: { fontSize: 15, lineHeight: 22, color: p.textSecondary, marginBottom: 14 },
    approval: { flexDirection: "row", alignItems: "center", gap: 14, backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 20, padding: 14, marginBottom: 10 },
    spender: { fontSize: 18, fontWeight: "700", color: p.text },
    approvalMeta: { fontSize: 14, color: p.textSecondary, marginTop: 2, lineHeight: 19 },
    footnote: { fontSize: 13, color: p.textSecondary, marginTop: 8 },
    loading: { alignItems: "center", paddingVertical: 60, gap: 14 },
    loadingText: { fontSize: 15, color: p.textSecondary },
    unlock: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 2, borderRadius: 24, padding: 14, marginTop: 16 },
    unlockKicker: { fontSize: 13, fontWeight: "600" },
    unlockTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.4 },
    unlockCta: { fontSize: 16, fontWeight: "700" },
});

export default Health;
