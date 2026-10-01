import { useNavigation } from "@react-navigation/native";
import { useEffect, useState } from "react";
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CubbyMark, Icon } from "../art/Art";
import { isFresh, key, peek, TTL, writeCache } from "../services/cache";
import { loadPortfolio } from "../services/portfolio";
import { Account, useAccounts } from "../state/accounts";
import { useTheme } from "../theme/useTheme";
import { PressableScale } from "./PressableScale";
import { TactileButton } from "./TactileButton";

const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
const kindText = (a: Account) => (a.kind === "wallet" ? `Connected${a.connector ? ` · ${a.connector}` : ""}` : "View-only");

/** Switch between saved accounts, add another one, or remove one. Saved on this device. */
export const AccountsSheet = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    const insets = useSafeAreaInsets();
    const { palette: p } = useTheme();
    const navigation = useNavigation<any>();
    const { accounts, active, switchTo, removeAccount } = useAccounts();
    const [editing, setEditing] = useState(false);
    const [confirm, setConfirm] = useState<string | null>(null);

    // Warm other accounts' balances while the sheet is open, so tapping one switches instantly.
    useEffect(() => {
        if (!visible) return;
        let cancelled = false;
        (async () => {
            for (const a of accounts) {
                if (cancelled) return;
                if (a.id === active?.id || isFresh(peek(key.portfolio(a.address)), TTL.portfolio)) continue;
                try { writeCache(key.portfolio(a.address), await loadPortfolio(a.address)); } catch { /* best effort */ }
            }
        })();
        return () => { cancelled = true; };
    }, [visible]); // eslint-disable-line react-hooks/exhaustive-deps

    const close = () => { setEditing(false); setConfirm(null); onClose(); };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={close}>
            <View style={styles.overlay}>
                <Pressable style={{ flex: 1 }} onPress={close} accessibilityLabel="Close accounts" />
                <View style={[styles.sheet, { backgroundColor: p.bg, paddingBottom: insets.bottom + 16 }]}>
                    <View style={[styles.handle, { backgroundColor: p.border }]} />
                    <View style={styles.head}>
                        <Text style={[styles.title, { color: p.text }]}>Accounts</Text>
                        <Pressable onPress={() => { setEditing(e => !e); setConfirm(null); }} accessibilityRole="button" hitSlop={10}>
                            <Text style={[styles.edit, { color: p.textSecondary }]}>{editing ? "Done" : "Edit"}</Text>
                        </Pressable>
                    </View>

                    <ScrollView style={{ maxHeight: 360 }} showsVerticalScrollIndicator={false}>
                        {accounts.map(a => {
                            const on = a.id === active?.id;
                            const asking = confirm === a.id;
                            return (
                                <PressableScale
                                    key={a.id}
                                    scale={0.98}
                                    onPress={() => { if (!editing) { switchTo(a.id); close(); } }}
                                    accessibilityRole="radio"
                                    accessibilityState={{ checked: on }}
                                    style={[styles.row, { backgroundColor: p.surface, borderColor: on ? p.text : p.border, borderWidth: on ? 2 : 1 }]}
                                >
                                    <CubbyMark size={38} />
                                    <View style={{ flex: 1 }}>
                                        <Text style={[styles.name, { color: p.text }]} numberOfLines={1}>{a.label ?? short(a.address)}</Text>
                                        <Text style={[styles.meta, { color: p.textSecondary }]} numberOfLines={1}>{a.label ? `${short(a.address)} · ` : ""}{kindText(a)}</Text>
                                    </View>
                                    {editing ? (
                                        <Pressable
                                            onPress={() => (asking ? (setConfirm(null), removeAccount(a.id)) : setConfirm(a.id))}
                                            style={[styles.remove, { backgroundColor: p.negativeTint }]}
                                            accessibilityRole="button"
                                            accessibilityLabel={`Remove ${a.label ?? short(a.address)}`}
                                        >
                                            <Text style={[styles.removeText, { color: p.negative }]}>{asking ? "Tap to confirm" : "Remove"}</Text>
                                        </Pressable>
                                    ) : (
                                        <View style={[styles.radio, { borderColor: on ? p.text : p.border, backgroundColor: on ? p.accent : "transparent" }]}>
                                            {on && <Icon name="check" size={14} color={p.onAccent} />}
                                        </View>
                                    )}
                                </PressableScale>
                            );
                        })}
                    </ScrollView>

                    <TactileButton
                        title="Add account"
                        style={{ marginTop: 12 }}
                        onPress={() => { close(); setTimeout(() => navigation.navigate("ConnectWallet"), 280); }}
                    />
                    <Text style={[styles.note, { color: p.textSecondary }]}>Accounts are saved on this device. Watch-only accounts can't move funds.</Text>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
    sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 12 },
    handle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, marginBottom: 16 },
    head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 14 },
    title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.8 },
    edit: { fontSize: 16, fontWeight: "600" },
    row: { flexDirection: "row", alignItems: "center", gap: 14, borderRadius: 18, padding: 14, marginBottom: 10 },
    name: { fontSize: 17, fontWeight: "700" },
    meta: { fontSize: 13, marginTop: 2 },
    radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
    remove: { borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8 },
    removeText: { fontSize: 13, fontWeight: "700" },
    note: { fontSize: 13, textAlign: "center", marginTop: 14 },
});
