import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon, Sticker as StickerArt } from "../../art/Art";
import type { StickerName } from "../../art/svgs";
import { PressableScale } from "../../components/PressableScale";
import { STICKER_SLOTS } from "../../services/stickers";
import { useHealth } from "../../state/health";
import { useTheme } from "../../theme/useTheme";

/** Earned stickers are real (derived from wallet facts); locked ones show how to earn them. */
const StickerBook = ({ onBack, onOpen }: { onBack: () => void; onOpen: (name: StickerName) => void }) => {
    const insets = useSafeAreaInsets();
    const { palette: p } = useTheme();
    const { stickers } = useHealth();
    const earned = stickers.filter(s => s.earned).length;
    const empty = Array.from({ length: Math.max(0, STICKER_SLOTS - stickers.length) });

    return (
        <View style={[styles.root, { backgroundColor: p.bg }]}>
            <ScrollView contentContainerStyle={{ paddingTop: insets.top + 8, paddingBottom: insets.bottom + 32, paddingHorizontal: 20 }} showsVerticalScrollIndicator={false}>
                <View style={styles.top}>
                    <Pressable style={[styles.back, { backgroundColor: p.surface, borderColor: p.border }]} onPress={onBack} accessibilityRole="button" accessibilityLabel="Back">
                        <Icon name="back" size={22} color={p.text} />
                    </Pressable>
                </View>
                <Text style={[styles.title, { color: p.text }]}>Sticker book</Text>
                <Text style={[styles.sub, { color: p.textSecondary }]}>{earned} of {STICKER_SLOTS} collected</Text>

                <View style={styles.grid}>
                    {stickers.map(s => (
                        <PressableScale
                            key={s.name}
                            disabled={!s.earned}
                            onPress={() => onOpen(s.name)}
                            style={[styles.cell, { backgroundColor: p.surface, borderColor: p.border }]}
                            accessibilityRole="button"
                            accessibilityLabel={s.earned ? `${s.title}, earned` : `${s.title}, locked. ${s.how}`}
                        >
                            <View style={[styles.art, !s.earned && { opacity: 0.18 }]}><StickerArt name={s.name} height={64} /></View>
                            <Text style={[styles.name, { color: p.text }]}>{s.title}</Text>
                            <Text style={[styles.how, { color: p.textSecondary }]}>{s.earned ? "Earned" : s.how}</Text>
                        </PressableScale>
                    ))}
                    {empty.map((_, i) => (
                        <View key={`e${i}`} style={[styles.cell, styles.slot, { borderColor: p.border }]}>
                            <Text style={[styles.q, { color: p.textSecondary }]}>?</Text>
                            <Text style={[styles.how, { color: p.textSecondary }]}>Coming later</Text>
                        </View>
                    ))}
                </View>
                <Text style={[styles.note, { color: p.textSecondary }]}>
                    Stickers celebrate care and milestones, never trades or price moves. They're earned from your real wallet, never bought.
                </Text>
            </ScrollView>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1 },
    top: { flexDirection: "row" },
    back: { width: 48, height: 48, borderRadius: 24, borderWidth: 1, alignItems: "center", justifyContent: "center" },
    title: { fontSize: 46, fontWeight: "700", letterSpacing: -1.9, marginTop: 18 },
    sub: { fontSize: 17, marginTop: 6 },
    grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 22 },
    cell: { width: "47.8%", borderWidth: 1, borderRadius: 24, padding: 16, alignItems: "center", minHeight: 170 },
    slot: { borderStyle: "dashed", justifyContent: "center", gap: 6 },
    art: { height: 72, alignItems: "center", justifyContent: "center" },
    name: { fontSize: 17, fontWeight: "700", marginTop: 10, textAlign: "center" },
    how: { fontSize: 13, marginTop: 4, textAlign: "center", lineHeight: 18 },
    q: { fontSize: 36, fontWeight: "700", opacity: 0.4 },
    note: { fontSize: 14, lineHeight: 21, marginTop: 24 },
});

export default StickerBook;
