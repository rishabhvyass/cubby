import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../art/Art";
import { PressableScale } from "./PressableScale";
import { setThemePref, ThemePref, useThemePref } from "../theme/themePreference";
import { useTheme } from "../theme/useTheme";

const OPTIONS: { key: ThemePref; label: string; hint: string }[] = [
    { key: "system", label: "System", hint: "Match your phone" },
    { key: "light", label: "Light", hint: "Paper and lime" },
    { key: "dark", label: "Dark", hint: "Easy on the eyes" },
];

export const ThemeSheet = ({ visible, onClose }: { visible: boolean; onClose: () => void }) => {
    const insets = useSafeAreaInsets();
    const { palette: p } = useTheme();
    const pref = useThemePref();

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
            <View style={styles.overlay}>
                <Pressable style={{ flex: 1 }} onPress={onClose} accessibilityLabel="Close appearance" />
                <View style={[styles.sheet, { backgroundColor: p.bg, paddingBottom: insets.bottom + 16 }]}>
                    <View style={[styles.handle, { backgroundColor: p.border }]} />
                    <Text style={[styles.title, { color: p.text }]}>Appearance</Text>
                    {OPTIONS.map(o => {
                        const on = pref === o.key;
                        return (
                            <PressableScale
                                key={o.key}
                                onPress={() => { setThemePref(o.key); onClose(); }}
                                accessibilityRole="radio"
                                accessibilityState={{ checked: on }}
                                style={[styles.row, { backgroundColor: p.surface, borderColor: on ? p.text : p.border, borderWidth: on ? 2 : 1 }]}
                            >
                                <View style={{ flex: 1 }}>
                                    <Text style={[styles.label, { color: p.text }]}>{o.label}</Text>
                                    <Text style={[styles.hint, { color: p.textSecondary }]}>{o.hint}</Text>
                                </View>
                                <View style={[styles.radio, { borderColor: on ? p.text : p.border, backgroundColor: on ? p.accent : "transparent" }]}>
                                    {on && <Icon name="check" size={14} color={p.onAccent} />}
                                </View>
                            </PressableScale>
                        );
                    })}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)", justifyContent: "flex-end" },
    sheet: { borderTopLeftRadius: 32, borderTopRightRadius: 32, paddingHorizontal: 20, paddingTop: 12 },
    handle: { alignSelf: "center", width: 36, height: 4, borderRadius: 2, marginBottom: 16 },
    title: { fontSize: 26, fontWeight: "700", letterSpacing: -0.8, marginBottom: 14 },
    row: { flexDirection: "row", alignItems: "center", borderRadius: 16, padding: 16, marginBottom: 10 },
    label: { fontSize: 17, fontWeight: "700" },
    hint: { fontSize: 14, marginTop: 2 },
    radio: { width: 26, height: 26, borderRadius: 13, borderWidth: 1.5, alignItems: "center", justifyContent: "center" },
});
