import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ChainIcon, TokenIcon } from "../art/CryptoIcon";
import { fmtAmount, usd } from "../services/format";
import { SwapToken } from "../services/swap";
import { useTheme } from "../theme/useTheme";
import { PressableScale } from "./PressableScale";

/** Bottom sheet to pick a token. Held tokens are listed first. */
export const TokenSheet = ({ visible, tokens, exclude, onPick, onClose }: {
    visible: boolean; tokens: SwapToken[]; exclude?: SwapToken; onPick: (t: SwapToken) => void; onClose: () => void;
}) => {
    const insets = useSafeAreaInsets();
    const { scheme, palette: p } = useTheme();
    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close token list" />
                <View style={[styles.sheet, { backgroundColor: p.bg, paddingBottom: insets.bottom + 16 }]}>
                    <View style={[styles.handle, { backgroundColor: p.border }]} />
                    <Text style={[styles.title, { color: p.text }]}>Choose a token</Text>
                    <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
                        {tokens.map(t => {
                            const same = exclude && exclude.symbol === t.symbol && exclude.address === t.address;
                            const value = t.price != null ? t.balance * t.price : null;
                            return (
                                <PressableScale
                                    key={`${t.chain.id}-${t.address ?? "native"}`}
                                    scale={0.98}
                                    disabled={!!same}
                                    onPress={() => { onPick(t); onClose(); }}
                                    style={[styles.row, { backgroundColor: p.surface, borderColor: p.border, opacity: same ? 0.4 : 1 }]}
                                    accessibilityRole="button"
                                    accessibilityLabel={`${t.name}${t.balance ? `, you have ${fmtAmount(t.balance)}` : ""}`}
                                >
                                    <View style={{ width: 44, height: 44 }}>
                                        <TokenIcon symbol={t.symbol} size={44} dark={scheme === "dark"} />
                                        <View style={styles.badge}><ChainIcon chain={t.chain.name} size={18} dark={scheme === "dark"} /></View>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.sym, { color: p.text }]}>{t.symbol}</Text>
                                        <Text style={[styles.name, { color: p.textSecondary }]} numberOfLines={1}>{t.name}</Text>
                                    </View>
                                    {t.balance > 0 && (
                                        <View style={{ alignItems: "flex-end" }}>
                                            <Text style={[styles.bal, { color: p.text }]}>{fmtAmount(t.balance)}</Text>
                                            {value != null && <Text style={[styles.name, { color: p.textSecondary }]}>{usd(value, 2)}</Text>}
                                        </View>
                                    )}
                                </PressableScale>
                            );
                        })}
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
    sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 12 },
    handle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, marginBottom: 16 },
    title: { fontSize: 24, fontWeight: "700", letterSpacing: -0.7, marginBottom: 14 },
    row: { flexDirection: "row", alignItems: "center", gap: 14, borderWidth: 1, borderRadius: 18, padding: 12, marginBottom: 8 },
    badge: { position: "absolute", right: -4, bottom: -4 },
    sym: { fontSize: 17, fontWeight: "700" },
    name: { fontSize: 13, marginTop: 2 },
    bal: { fontSize: 16, fontWeight: "700", fontVariant: ["tabular-nums"] },
});
