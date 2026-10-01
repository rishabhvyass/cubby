import { Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AccountHeader } from "../components/AccountHeader";
import { useTheme } from "../theme/useTheme";

/** Placeholder for tabs that don't have a real data source yet. */
const ComingSoon = ({ title, body }: { title: string; body: string }) => {
    const insets = useSafeAreaInsets();
    const { palette: p } = useTheme();
    return (
        <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: insets.top + 8 }}>
            <AccountHeader />
            <Text style={{ fontSize: 46, fontWeight: "700", letterSpacing: -1.9, color: p.text, marginTop: 22 }}>{title}</Text>
            <Text style={{ fontSize: 17, lineHeight: 25, color: p.textSecondary, marginTop: 12 }}>{body}</Text>
        </View>
    );
};

export default ComingSoon;
