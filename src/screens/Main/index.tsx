import React, { useMemo, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { TabBar, TabKey, TABS } from "../../components/TabBar";
import { PortfolioProvider } from "../../state/portfolio";
import { createStyles } from "../Home/style";
import { useTheme } from "../../theme/useTheme";
import Assets from "../Assets";
import Home from "../Home";
import Universe from "../Universe";
import Activity from "../Activity";
import ComingSoon from "../ComingSoon";

/** One tab's screen. Tabs stay mounted once opened; inactive ones are hidden. */
const TabPane = ({ active, children }: { active: boolean; children: React.ReactNode }) => (
    <View style={[styles.fill, !active && styles.hidden]}>{children}</View>
);

/** Tab shell. Tabs stay mounted once opened so switching back doesn't refetch or replay animations. */
const Main = ({ route, navigation }: any) => {
    const { address, label } = route.params as { address: string; label?: string };
    const { scheme, palette } = useTheme();
    const [tab, setTab] = useState<TabKey>("home");
    const [opened, setOpened] = useState<Set<TabKey>>(new Set(["home"]));
    const [overlay, setOverlay] = useState<"universe" | null>(null);
    // Reuse Home's palette-based root style for the background.
    const rootStyle = useMemo(() => createStyles(palette).root, [palette]);

    const go = (k: TabKey) => {
        setOpened(prev => new Set(prev).add(k));
        setTab(k);
        setOverlay(null);
    };

    return (
        <PortfolioProvider address={address} label={label}>
                        <View style={rootStyle}>
                <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />
                {TABS.map(t => opened.has(t.key) && (
                    <TabPane key={t.key} active={tab === t.key}>
                        {t.key === "home" && <Home onOpenUniverse={() => setOverlay("universe")} onWatchAddress={() => navigation.navigate("ConnectWallet")} />}
                        {t.key === "assets" && <Assets />}
                        {t.key === "activity" && <Activity />}
                        {t.key === "health" && <ComingSoon title="Health" body="Token approvals and wallet health checks will show up here once they have a live data source." />}
                    </TabPane>
                ))}

                <TabBar active={tab} onChange={go} hidden={!!overlay} />

                {overlay && (
                    <Animated.View
                        key={overlay}
                        style={StyleSheet.absoluteFill}
                        entering={FadeIn.duration(280)}
                        exiting={FadeOut.duration(200)}
                    >
                        {overlay === "universe" && <Universe onBack={() => setOverlay(null)} onOpenAssets={() => go("assets")} />}
                                                                    </Animated.View>
                )}
            </View>
        </PortfolioProvider>
    );
};

const styles = StyleSheet.create({
    fill: { flex: 1 },
    hidden: { display: "none" },
    soon: { flex: 1, paddingHorizontal: 20 },
});

export default Main;
