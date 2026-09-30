import { useState } from "react";
import { Pressable, ScrollView, Share, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, Sticker } from "../../art/Art";
import type { StickerName } from "../../art/svgs";
import { BackgroundMesh } from "../../components/BackgroundMesh";
import { TactileButton } from "../../components/TactileButton";
import { stickerBook } from "../../data/demoWallet";
import { Confetti } from "../../motion/Confetti";
import { usePop, useRise, useWobble } from "../../motion/motion";
import { useTheme } from "../../theme/useTheme";

export type MilestoneSpec = { sticker: StickerName; headline: string; body: string };

// Stickers already in the book before a new one lands (demo: 5 of 12).
const BASE_BOOK: StickerName[] = ["hello", "backed_up", "steady", "explorer", "first_yield"];

/** Full-screen unlock moment. Celebrates care and milestones only, never trades or price moves. */
const Milestone = ({ spec, onClose }: { spec: MilestoneSpec; onClose: () => void }) => {
    const insets = useSafeAreaInsets();
    const { palette: p } = useTheme();
    const [added, setAdded] = useState(false);
    const pop = usePop();
    const wobble = useWobble(3200);
    const smallPop = usePop(1200, 600);
    const rise = useRise(200);
    const rise2 = useRise(300);

    const book = BASE_BOOK.includes(spec.sticker) ? BASE_BOOK : [...BASE_BOOK, spec.sticker];

    return (
        <BackgroundMesh backgroundColor={p.bg} lineColor={p.text} lineOpacity={0.05} style={styles.root}>
            <Confetti />
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
                <View style={styles.top}>
                    <Pressable style={[styles.back, { backgroundColor: p.surface, borderColor: p.border }]} onPress={onClose} accessibilityRole="button" accessibilityLabel="Close">
                        <Icon name="back" size={22} color={p.text} />
                    </Pressable>
                    <View style={[styles.pill, { backgroundColor: p.accent, borderColor: p.buttonEdge }]}>
                        <Text style={[styles.pillText, { color: p.onAccent }]}>New sticker</Text>
                    </View>
                </View>

                <Animated.View style={[styles.hero, pop]} accessibilityLabel={`New sticker: ${spec.headline.replace("\n", " ")}`}>
                    <Animated.View style={wobble}><Sticker name={spec.sticker} height={200} /></Animated.View>
                </Animated.View>

                <Animated.View style={rise}>
                    <Text style={[styles.headline, { color: p.text }]}>{spec.headline}</Text>
                    <Text style={[styles.body, { color: p.textSecondary }]}>{spec.body}</Text>
                </Animated.View>

                <Animated.View style={[{ marginTop: 28, gap: 12 }, rise2]}>
                    <TactileButton title={added ? "Added ✓" : "Add to sticker book"} onPress={() => { setAdded(true); setTimeout(onClose, 500); }} />
                    <TactileButton
                        title="Share card"
                        variant="secondary"
                        onPress={() => Share.share({ message: `I just earned the "${spec.headline.replace("\n", " ")}" sticker in Cubby.` })}
                    />
                </Animated.View>

                <View style={[styles.book, { backgroundColor: p.surface, borderColor: p.border }]}>
                    <View style={styles.bookHead}>
                        <Text style={[styles.bookTitle, { color: p.text }]}>Sticker book</Text>
                        <Text style={[styles.bookCount, { color: p.textSecondary }]}>{book.length} of {stickerBook.total}</Text>
                    </View>
                    <View style={styles.strip}>
                        {book.map(name => {
                            const isNew = name === spec.sticker && !BASE_BOOK.includes(name);
                            return isNew
                                ? <Animated.View key={name} style={smallPop}><Sticker name={name} height={46} /></Animated.View>
                                : <Sticker key={name} name={name} height={46} />;
                        })}
                    </View>
                    <Text style={[styles.note, { color: p.textSecondary }]}>{stickerBook.footnote}</Text>
                </View>
            </ScrollView>
        </BackgroundMesh>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
    back: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    pill: { borderWidth: 2, borderRadius: 22, paddingHorizontal: 18, height: 44, justifyContent: "center", boxShadow: "0 3px 0 #0A0A0A" },
    pillText: { fontSize: 16, fontWeight: "700" },
    hero: { alignItems: "center", marginTop: 40, marginBottom: 24 },
    headline: { fontSize: 50, fontWeight: "700", letterSpacing: -2.2, lineHeight: 52, textAlign: "center" },
    body: { fontSize: 19, lineHeight: 28, textAlign: "center", marginTop: 14 },
    book: { borderWidth: 1, borderRadius: 28, padding: 20, marginTop: 28 },
    bookHead: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
    bookTitle: { fontSize: 20, fontWeight: "700" },
    bookCount: { fontSize: 16 },
    strip: { flexDirection: "row", gap: 12, alignItems: "center", marginTop: 14, flexWrap: "wrap" },
    note: { fontSize: 15, lineHeight: 22, marginTop: 14 },
});

export default Milestone;
