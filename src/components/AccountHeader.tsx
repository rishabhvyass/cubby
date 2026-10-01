import { PressableScale } from "./PressableScale";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { CubbyMark, Icon, Sticker } from "../art/Art";
import { usePortfolio } from "../state/portfolio";
import { useTheme } from "../theme/useTheme";
import { ThemeSheet } from "./ThemeSheet";

export const short = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;

export const AccountHeader = () => {
    const { palette } = useTheme();
    const { address, label } = usePortfolio();
    const [themeOpen, setThemeOpen] = useState(false);
    return (
        <View style={styles.header}>
            <View style={styles.account}>
                <CubbyMark size={40} />
                <Text style={[styles.name, { color: palette.text }]}>{label ?? short(address)}</Text>
                <Icon name="chevron_down" size={16} color={palette.textSecondary} />
            </View>
            <PressableScale
                onPress={() => setThemeOpen(true)}
                accessibilityRole="button"
                accessibilityLabel="Appearance"
                style={[styles.badge, { borderColor: palette.accent, backgroundColor: palette.surface }]}
            >
                <Sticker name="hello" height={30} />
            </PressableScale>
            <ThemeSheet visible={themeOpen} onClose={() => setThemeOpen(false)} />
        </View>
    );
};

const styles = StyleSheet.create({
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
    account: { flexDirection: "row", alignItems: "center", gap: 10 },
    name: { fontSize: 17, fontWeight: "700" },
    badge: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, alignItems: "center", justifyContent: "center" },
});
