import Clipboard from "@react-native-clipboard/clipboard";
import { useEffect, useRef, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Cubby, Icon, Sticker } from "../../art/Art";
import { AccountHeader } from "../../components/AccountHeader";
import { BackgroundMesh } from "../../components/BackgroundMesh";
import GroundShadow from "../../components/GroundShadow";
import { TactileButton } from "../../components/TactileButton";
import { useFloat, useNudge, usePop, useRise } from "../../motion/motion";
import { usePortfolio } from "../../state/portfolio";
import { DOTO } from "../../theme/fonts";
import { useTheme } from "../../theme/useTheme";

/** Shown on Home when the watched wallet holds nothing yet. */
const EmptyWallet = ({ onWatchAddress }: { onWatchAddress: () => void }) => {
    const insets = useSafeAreaInsets();
    const { palette: p } = useTheme();
    const { address } = usePortfolio();
    const [copied, setCopied] = useState(false);
    const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const rise = useRise(0), rise2 = useRise(120);
    const pop = usePop(0, 700);
    const float = useFloat({ durationMs: 6000 });
    const floatA = useFloat({ tiltDeg: -12, durationMs: 5000 });
    const floatB = useFloat({ tiltDeg: 10, durationMs: 5000, delayMs: 700 });
    const nudge = useNudge();

    useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

    const receive = () => {
        Clipboard.setString(address);
        setCopied(true);
        timer.current = setTimeout(() => setCopied(false), 2000);
    };

    return (
        <ScrollView contentContainerStyle={{ paddingHorizontal: 20, paddingTop: insets.top + 8, paddingBottom: 130 }} showsVerticalScrollIndicator={false}>
            <AccountHeader />
            <Text style={[styles.label, { color: p.textSecondary }]}>Net worth</Text>
            <View style={styles.numRow}>
                <Text style={[styles.num, { color: p.text }]}>$0</Text>
                <Text style={[styles.cents, { color: p.textSecondary }]}>.00</Text>
            </View>

            <Animated.View style={rise}>
                <BackgroundMesh backgroundColor={p.surface} lineColor={p.text} lineOpacity={0.06} style={[styles.stage, { borderColor: p.border }]}>
                    <Animated.View style={[styles.stickerA, floatA]}><Sticker name="hello" height={54} /></Animated.View>
                    <Animated.View style={[styles.stickerB, floatB]}><Sticker name="explorer" height={40} /></Animated.View>
                    <Animated.View style={pop}>
                        <Animated.View style={float}><Cubby level={1} height={120} /></Animated.View>
                    </Animated.View>
                    <GroundShadow width={130} height={16} style={{ marginTop: 10 }} />
                </BackgroundMesh>
            </Animated.View>

            <Animated.View style={rise2}>
                <Text style={[styles.title, { color: p.text }]}>Nothing here yet. That's fine.</Text>
                <Text style={[styles.body, { color: p.textSecondary }]}>
                    Receive funds on any of 6 chains, or watch a wallet you're curious about. Cubby fills up on its own.
                </Text>
                <View style={styles.buttons}>
                    <View style={{ flex: 1.2 }}>
                        <Animated.View style={[styles.arrow, nudge]}><Icon name="arrow_down" size={22} color={p.text} /></Animated.View>
                        <TactileButton title={copied ? "Address copied ✓" : "Receive"} onPress={receive} />
                    </View>
                    <View style={{ flex: 1, justifyContent: "flex-end" }}>
                        <TactileButton title="Watch address" variant="secondary" onPress={onWatchAddress} />
                    </View>
                </View>
            </Animated.View>
        </ScrollView>
    );
};

const styles = StyleSheet.create({
    label: { fontSize: 15, marginTop: 22 },
    numRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 6 },
    num: { fontFamily: DOTO, fontSize: 62, letterSpacing: -1.2 },
    cents: { fontFamily: DOTO, fontSize: 30, marginBottom: 8, marginLeft: 2 },
    stage: { height: 230, borderRadius: 28, borderWidth: 1, marginTop: 18, alignItems: "center", justifyContent: "center", overflow: "hidden" },
    stickerA: { position: "absolute", left: 24, top: 24 },
    stickerB: { position: "absolute", right: 24, top: 40 },
    title: { fontSize: 38, fontWeight: "700", letterSpacing: -1.5, lineHeight: 40, marginTop: 28 },
    body: { fontSize: 18, lineHeight: 27, marginTop: 12 },
    buttons: { flexDirection: "row", gap: 12, marginTop: 8 },
    arrow: { marginLeft: 8, marginBottom: 4, height: 26 },
});

export default EmptyWallet;
