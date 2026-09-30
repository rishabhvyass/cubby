import { useEffect, useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Cubby, Icon, Sticker } from "../../art/Art";
import { TokenIcon } from "../../art/CryptoIcon";
import { AccountHeader } from "../../components/AccountHeader";
import GroundShadow from "../../components/GroundShadow";
import { TactileButton } from "../../components/TactileButton";
import { approvalsSummary, checkup, nextLevelText, streak } from "../../data/demoWallet";
import { easeOut, useFloat, usePop, useRise, useWobble } from "../../motion/motion";
import { useHealth } from "../../state/health";
import { DOTO } from "../../theme/fonts";
import { labelForScore, levelForScore, Palette } from "../../theme/tokens";
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

const Health = ({ onOpenMilestone }: { onOpenMilestone: () => void }) => {
    const insets = useSafeAreaInsets();
    const { scheme, palette: p } = useTheme();
    const s = useMemo(() => createStyles(p), [p]);
    const { approvals, revoked, score, unlockedCleanSweep, revoke } = useHealth();
    const level = levelForScore(score);
    const summary = approvalsSummary(revoked);
    const riseA = useRise(0), riseB = useRise(60);

    return (
        <ScrollView contentContainerStyle={[s.scroll, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>
            <AccountHeader />
            <Text style={s.title}>Health</Text>

            {unlockedCleanSweep && (
                <Pressable style={[s.unlock, { backgroundColor: p.accent, borderColor: p.buttonEdge }]} onPress={onOpenMilestone} accessibilityRole="button" accessibilityLabel="New sticker unlocked, Clean sweep. View">
                    <Sticker name="clean_sweep" height={44} />
                    <View style={{ flex: 1 }}>
                        <Text style={[s.unlockKicker, { color: p.onAccent }]}>New sticker unlocked</Text>
                        <Text style={[s.unlockTitle, { color: p.onAccent }]}>Clean sweep</Text>
                    </View>
                    <Text style={[s.unlockCta, { color: p.onAccent }]}>View →</Text>
                </Pressable>
            )}

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
                    <Text style={s.barText}>{nextLevelText(score)}</Text>
                    <Text style={s.barText}>{score} / 100</Text>
                </View>
                <ScoreBar score={score} p={p} />
            </Animated.View>

            <Animated.View style={[s.card, s.streak, riseB]}>
                <Sticker name="steady" height={44} />
                <View style={{ flex: 1 }}>
                    <Text style={s.streakTitle}>{streak.label}</Text>
                    <View style={s.squares}>
                        {Array.from({ length: streak.weeks }).map((_, i) => <View key={i} style={s.square} />)}
                    </View>
                </View>
            </Animated.View>

            <Text style={s.section}>Checkup</Text>
            {checkup.map(t => (
                <View key={t} style={s.checkRow}>
                    <View style={[s.checkIcon, { backgroundColor: p.positiveTint }]}><Icon name="check" size={16} color={p.positive} /></View>
                    <Text style={s.checkText}>{t}</Text>
                </View>
            ))}
            <View style={[s.checkRow, { borderBottomWidth: 1 }]}>
                <View style={[s.checkIcon, { backgroundColor: summary.left ? p.cautionTint : p.positiveTint }]}>
                    {summary.left
                        ? <Text style={{ fontSize: 15, fontWeight: "800", color: p.caution }}>!</Text>
                        : <Icon name="check" size={16} color={p.positive} />}
                </View>
                <Text style={s.checkText}>{summary.text}</Text>
            </View>

            <Text style={[s.section, { marginTop: 32 }]}>Token approvals</Text>
            <Text style={s.approvalsIntro}>
                Apps you've allowed to move your tokens. "Unlimited" means all of them. Revoking opens your wallet to sign.
            </Text>

            {approvals.map(a => {
                const done = revoked.has(a.id);
                const risky = a.risky && !done;
                return (
                    <View
                        key={a.id}
                        style={[
                            s.approval,
                            risky && { backgroundColor: p.negativeTint, borderColor: p.negative, borderWidth: 2 },
                            done && { opacity: 0.6 },
                        ]}
                    >
                        {risky ? <Flag><TokenIcon symbol={a.token} size={44} dark={scheme === "dark"} fallbackColor={a.color} /></Flag>
                               : <TokenIcon symbol={a.token} size={44} dark={scheme === "dark"} fallbackColor={a.color} />}
                        <View style={{ flex: 1 }}>
                            <Text style={s.spender}>{a.spender}</Text>
                            <Text style={[s.approvalMeta, risky && { color: p.negative }]}>{done ? "Revoked ✓" : a.meta}</Text>
                        </View>
                        {!done && (
                            <TactileButton
                                title="Revoke"
                                variant="outline"
                                accent={risky}
                                onPress={() => revoke(a.id)}
                                style={{ paddingHorizontal: 16 }}
                            />
                        )}
                    </View>
                );
            })}
            <Text style={s.footnote}>Prototype: tapping Revoke simulates a signed revocation. Health data here is demo data.</Text>
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
    unlock: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 2, borderRadius: 24, padding: 14, marginTop: 16 },
    unlockKicker: { fontSize: 13, fontWeight: "600" },
    unlockTitle: { fontSize: 20, fontWeight: "700", letterSpacing: -0.4 },
    unlockCta: { fontSize: 16, fontWeight: "700" },
});

export default Health;
