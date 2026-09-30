import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from "react-native";
import { useTheme } from "../theme/useTheme";

type Variant = "primary" | "secondary" | "outline" | "ink";

/** Tactile button: hard offset shadow; on press it sinks and the shadow collapses. */
export const TactileButton = ({ title, onPress, variant = "primary", style, accent = false, disabled }: {
    title: string;
    onPress: () => void;
    variant?: Variant;
    style?: StyleProp<ViewStyle>;
    /** outline buttons turn lime (used for the risky Revoke). */
    accent?: boolean;
    disabled?: boolean;
}) => {
    const { palette } = useTheme();
    const edge = palette.buttonEdge;
    const base: ViewStyle =
        variant === "primary" ? { backgroundColor: palette.accent, borderColor: edge, borderWidth: 2, height: 54, shadow: 4 } as any
        : variant === "ink" ? { backgroundColor: "#0A0A0A", borderColor: "#0A0A0A", borderWidth: 2, height: 54, shadow: 4 } as any
        : variant === "outline" ? { backgroundColor: accent ? palette.accent : palette.surface, borderColor: edge, borderWidth: 2, height: 44, shadow: 3 } as any
        : { backgroundColor: palette.surface, borderColor: palette.border, borderWidth: 1, height: 54, shadow: 0 } as any;
    const { shadow, ...box } = base as any;
    const textColor = variant === "ink" ? palette.accent : variant === "primary" || accent ? palette.onAccent : palette.text;
    const shadowColor = variant === "ink" ? "rgba(10,10,10,0.35)" : edge;

    return (
        <Pressable
            onPress={onPress}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={title}
            style={({ pressed }) => [
                styles.btn,
                box,
                shadow ? { boxShadow: pressed ? `0 0 0 ${shadowColor}` : `0 ${shadow}px 0 ${shadowColor}`, transform: [{ translateY: pressed ? shadow : 0 }] } : null,
                disabled && { opacity: 0.5 },
                style,
            ]}
        >
            <Text style={[styles.text, { color: textColor }, variant === "outline" && { fontSize: 15 }]}>{title}</Text>
        </Pressable>
    );
};

const styles = StyleSheet.create({
    btn: { borderRadius: 27, alignItems: "center", justifyContent: "center", paddingHorizontal: 20 },
    text: { fontSize: 17, fontWeight: "700" },
});
