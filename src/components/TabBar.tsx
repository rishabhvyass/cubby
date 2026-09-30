import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../art/Art";
import { useTheme } from "../theme/useTheme";

export const TABS = [
    { key: "home", label: "Home" },
    { key: "assets", label: "Assets" },
    { key: "activity", label: "Activity" },
    { key: "health", label: "Health" },
] as const;
export type TabKey = (typeof TABS)[number]["key"];

/** Floating tab bar: the active tab grows a label. */
export const TabBar = ({ active, onChange }: { active: TabKey; onChange: (k: TabKey) => void }) => {
    const insets = useSafeAreaInsets();
    const { palette } = useTheme();
    return (
        <View style={[styles.wrap, { bottom: insets.bottom + 12 }]} pointerEvents="box-none">
            <View style={[styles.pill, { backgroundColor: palette.bar }]}>
                {TABS.map(t => {
                    const on = t.key === active;
                    return (
                        <Pressable
                            key={t.key}
                            onPress={() => onChange(t.key)}
                            accessibilityRole="tab"
                            accessibilityLabel={t.label}
                            accessibilityState={{ selected: on }}
                            style={on ? [styles.active, { backgroundColor: palette.accent }] : styles.item}
                        >
                            <Icon name={t.key} size={22} color={on ? palette.onAccent : "#D8D8D0"} />
                            {on && <Text style={[styles.label, { color: palette.onAccent }]}>{t.label}</Text>}
                        </Pressable>
                    );
                })}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    wrap: { position: "absolute", left: 0, right: 0, alignItems: "center" },
    pill: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 40, padding: 8 },
    active: { flexDirection: "row", alignItems: "center", gap: 8, borderRadius: 30, paddingHorizontal: 20, height: 48 },
    item: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
    label: { fontSize: 16, fontWeight: "700" },
});
