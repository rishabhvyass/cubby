import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CubbyForScore, Icon, Sticker } from "../../art/Art";
import { BackgroundMesh } from "../../components/BackgroundMesh";
import { TactileButton } from "../../components/TactileButton";
import { recap } from "../../data/demoWallet";
import { useRise } from "../../motion/motion";
import { DOTO } from "../../theme/fonts";

const LIME = "#B8FF4A";
const INK = "#0A0A0A";

const Segment = ({ state }: { state: "done" | "active" | "todo" }) => {
    const w = useSharedValue(state === "todo" ? 0 : 1);
    useEffect(() => { w.value = withTiming(state === "todo" ? 0 : 1, { duration: 400 }); }, [state]); // eslint-disable-line react-hooks/exhaustive-deps
    const fill = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
    return (
        <View style={styles.segTrack}>
            <Animated.View style={[styles.segFill, fill]} />
        </View>
    );
};

const CardBody = ({ index }: { index: number }) => {
    const rise = useRise(0);
    const card = recap.cards[index];
    return (
        <Animated.View style={[styles.body, rise]}>
            {card.kind === "count" && (
                <>
                    <Text style={styles.lead}>{card.lead}</Text>
                    <Text style={styles.big} numberOfLines={1} adjustsFontSizeToFit>{card.big}</Text>
                    <Text style={styles.tail}>{card.tail}</Text>
                    <View style={styles.tiles}>
                        <View style={styles.tile}><Text style={styles.tileLabel}>Most used</Text><Text style={styles.tileValue}>{card.mostUsed}</Text></View>
                        <View style={styles.tile}><Text style={styles.tileLabel}>Fees paid</Text><Text style={styles.tileValue}>{card.feesPaid}</Text></View>
                    </View>
                </>
            )}
            {card.kind === "busiest" && (
                <>
                    <Text style={styles.lead}>{card.title}</Text>
                    <Text style={styles.bigText}>{card.day}</Text>
                    <Text style={[styles.big, { fontSize: 96, lineHeight: 104 }]} numberOfLines={1} adjustsFontSizeToFit>{card.date}</Text>
                    <Text style={styles.tail}>{card.body}</Text>
                    <View style={styles.timeline}>
                        <View style={styles.timelineLine} />
                        {card.axis.map((a, i) => (
                            <View key={a} style={[styles.timelineStop, i === 1 && { alignItems: "center" }, i === 2 && { alignItems: "flex-end" }]}>
                                <View style={[styles.dot, i === 1 && { width: 18, height: 18, borderRadius: 9 }]} />
                                <Text style={styles.axis}>{a}</Text>
                            </View>
                        ))}
                    </View>
                </>
            )}
            {card.kind === "best" && (
                <>
                    <Text style={styles.lead}>{card.title}</Text>
                    <View style={{ alignItems: "center", marginVertical: 12 }}><CubbyForScore score={82} height={120} /></View>
                    <Text style={styles.bigText}>{card.headline}</Text>
                    <Text style={styles.tail}>{card.body}</Text>
                </>
            )}
        </Animated.View>
    );
};

/** Full-lime story: 3 cards, tap Next / Back. DEMO data (kit's `recap`) until derived from real activity. */
const Recap = ({ onClose }: { onClose: () => void }) => {
    const insets = useSafeAreaInsets();
    const [i, setI] = useState(0);
    const last = i === recap.cards.length - 1;

    return (
        <BackgroundMesh backgroundColor={LIME} lineColor={INK} lineOpacity={0.08} style={styles.root}>
            <View style={{ paddingTop: insets.top + 8, paddingHorizontal: 20, flex: 1 }}>
                <View style={styles.segments}>
                    {recap.cards.map((_, k) => <Segment key={k} state={k < i ? "done" : k === i ? "active" : "todo"} />)}
                </View>
                <View style={styles.header}>
                    <View style={styles.month}>
                        <Sticker name="one_year" height={40} />
                        <Text style={styles.monthText}>{recap.month}</Text>
                    </View>
                    <Pressable style={styles.close} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close recap">
                        <Icon name="close" size={22} color={LIME} />
                    </Pressable>
                </View>

                <CardBody key={i} index={i} />

                <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                    <Pressable
                        style={[styles.back, i === 0 && { opacity: 0.35 }]}
                        disabled={i === 0}
                        onPress={() => setI(x => Math.max(0, x - 1))}
                        accessibilityRole="button"
                        accessibilityLabel="Previous card"
                    >
                        <Icon name="back" size={24} color={INK} />
                    </Pressable>
                    <TactileButton
                        title={last ? "Replay" : "Next"}
                        variant="ink"
                        onPress={() => (last ? setI(0) : setI(x => x + 1))}
                        style={{ flex: 1 }}
                    />
                </View>
            </View>
        </BackgroundMesh>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    segments: { flexDirection: "row", gap: 6 },
    segTrack: { flex: 1, height: 5, borderRadius: 3, backgroundColor: "rgba(10,10,10,0.18)", overflow: "hidden" },
    segFill: { height: 5, backgroundColor: INK },
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 16 },
    month: { flexDirection: "row", alignItems: "center", gap: 10 },
    monthText: { fontSize: 18, fontWeight: "700", color: INK },
    close: { width: 44, height: 44, borderRadius: 22, backgroundColor: INK, alignItems: "center", justifyContent: "center" },
    body: { flex: 1, paddingTop: 40 },
    lead: { fontSize: 22, fontWeight: "700", color: INK },
    big: { fontFamily: DOTO, fontSize: 150, lineHeight: 160, color: INK, marginTop: 8 },
    bigText: { fontSize: 44, fontWeight: "700", letterSpacing: -1.6, color: INK, marginTop: 8 },
    tail: { fontSize: 32, fontWeight: "700", letterSpacing: -1, lineHeight: 36, color: INK, marginTop: 8 },
    tiles: { flexDirection: "row", gap: 12, marginTop: 28 },
    tile: { flex: 1, backgroundColor: INK, borderRadius: 28, padding: 20 },
    tileLabel: { fontSize: 15, color: "#A3A39C" },
    tileValue: { fontSize: 24, fontWeight: "700", color: "#FFFFFF", marginTop: 6 },
    timeline: { marginTop: 36, flexDirection: "row", justifyContent: "space-between" },
    timelineLine: { position: "absolute", left: 6, right: 6, top: 8, height: 3, backgroundColor: INK, opacity: 0.4 },
    timelineStop: { gap: 8 },
    dot: { width: 14, height: 14, borderRadius: 7, backgroundColor: INK },
    axis: { fontSize: 14, fontWeight: "600", color: INK },
    footer: { flexDirection: "row", alignItems: "center", gap: 14 },
    back: { width: 58, height: 58, borderRadius: 29, borderWidth: 2, borderColor: INK, alignItems: "center", justifyContent: "center" },
});

export default Recap;
