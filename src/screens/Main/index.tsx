import { useMemo, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import { TabBar, TabKey } from "../../components/TabBar";
import { PortfolioProvider } from "../../state/portfolio";
import { createStyles } from "../Home/style";
import { useTheme } from "../../theme/useTheme";
import Assets from "../Assets";
import Home from "../Home";
import Universe from "../Universe";
import Activity from "../Activity";
import Health from "../Health";
import Milestone, { MilestoneSpec } from "../Milestone";
import Recap from "../Recap";
import { HealthProvider } from "../../state/health";

/** Tab shell. Tabs stay mounted once opened so switching back doesn't refetch or replay animations. */
const CLEAN_SWEEP: MilestoneSpec = {
    sticker: "clean_sweep",
    headline: "Clean\nsweep.",
    body: "You revoked an unknown contract's access to your tokens. Cubby just got a little stronger.",
};

const Main = ({ route, navigation }: any) => {
    const { address, label } = route.params as { address: string; label?: string };
    const { scheme, palette } = useTheme();
    const [tab, setTab] = useState<TabKey>("home");
    const [opened, setOpened] = useState<Set<TabKey>>(new Set(["home"]));
    const [overlay, setOverlay] = useState<"universe" | "recap" | "milestone" | null>(null);
    // Reuse Home's palette-based root style for the background.
    const rootStyle = useMemo(() => createStyles(palette).root, [palette]);

    const go = (k: TabKey) => {
        setOpened(prev => new Set(prev).add(k));
        setTab(k);
        setOverlay(null);
    };

    return (
        <PortfolioProvider address={address} label={label}>
            <HealthProvider>
            <View style={rootStyle}>
                <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />
                {opened.has("home") && <View style={[styles.fill, tab !== "home" && styles.hidden]}><Home onOpenUniverse={() => setOverlay("universe")} onOpenRecap={() => setOverlay("recap")} onWatchAddress={() => navigation.navigate("ConnectWallet")} /></View>}
                {opened.has("assets") && <View style={[styles.fill, tab !== "assets" && styles.hidden]}><Assets /></View>}
                {opened.has("activity") && <View style={[styles.fill, tab !== "activity" && styles.hidden]}><Activity onOpenRecap={() => setOverlay("recap")} /></View>}
                {opened.has("health") && <View style={[styles.fill, tab !== "health" && styles.hidden]}><Health onOpenMilestone={() => setOverlay("milestone")} /></View>}

                {!overlay && <TabBar active={tab} onChange={go} />}

                {overlay && (
                    <View style={StyleSheet.absoluteFill}>
                        {overlay === "universe" && <Universe onBack={() => setOverlay(null)} onOpenAssets={() => go("assets")} />}
                        {overlay === "recap" && <Recap onClose={() => setOverlay(null)} />}
                        {overlay === "milestone" && <Milestone spec={CLEAN_SWEEP} onClose={() => setOverlay(null)} />}
                    </View>
                )}
            </View>
            </HealthProvider>
        </PortfolioProvider>
    );
};

const styles = StyleSheet.create({
    fill: { flex: 1 },
    hidden: { display: "none" },
    soon: { flex: 1, paddingHorizontal: 20 },
});

export default Main;
