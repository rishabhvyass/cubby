import React, { useEffect, useMemo, useState } from "react";
import { StatusBar, StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { TabBar, TabKey, TABS } from "../../components/TabBar";
import { PortfolioProvider } from "../../state/portfolio";
import { useAccounts } from "../../state/accounts";
import { ActivityProvider } from "../../state/activity";
import { createStyles } from "../Home/style";
import { useTheme } from "../../theme/useTheme";
import Assets from "../Assets";
import Home from "../Home";
import Universe from "../Universe";
import Activity from "../Activity";
import Health from "../Health";
import Milestone from "../Milestone";
import Recap from "../Recap";
import Swap from "../Swap";
import TokenDetail from "../TokenDetail";
import type { Holding } from "../../services/portfolio";
import StickerBook from "../StickerBook";
import { HealthProvider, useHealth } from "../../state/health";
import type { StickerName } from "../../art/svgs";

/** One tab's screen. Tabs stay mounted once opened; inactive ones are hidden. */
const TabPane = ({ active, children }: { active: boolean; children: React.ReactNode }) => (
    <View style={[styles.fill, !active && styles.hidden]}>{children}</View>
);

/** Tab shell. Tabs stay mounted once opened so switching back doesn't refetch or replay animations. */
type Overlay = { kind: "universe" } | { kind: "swap"; initial?: { chainId: string; symbol: string; address: string | null } } | { kind: "token"; holding: Holding } | { kind: "recap" } | { kind: "stickers" } | { kind: "milestone"; sticker: StickerName } | null;

const MainBody = ({ navigation }: { navigation: any }) => {
    const { scheme, palette } = useTheme();
    const { stickers } = useHealth();
    const [tab, setTab] = useState<TabKey>("home");
    const [opened, setOpened] = useState<Set<TabKey>>(new Set(["home"]));
    const [overlay, setOverlay] = useState<Overlay>(null);
    // Reuse Home's palette-based root style for the background.
    const rootStyle = useMemo(() => createStyles(palette).root, [palette]);

    const go = (k: TabKey) => {
        setOpened(prev => new Set(prev).add(k));
        setTab(k);
        setOverlay(null);
    };
    const milestone = overlay?.kind === "milestone" ? stickers.find(x => x.name === overlay.sticker) : undefined;

    return (
        <View style={rootStyle}>
            <StatusBar barStyle={scheme === "dark" ? "light-content" : "dark-content"} />
            {TABS.map(t => opened.has(t.key) && (
                <TabPane key={t.key} active={tab === t.key}>
                    {t.key === "home" && (
                        <Home
                            onOpenUniverse={() => setOverlay({ kind: "universe" })}
                            onOpenSwap={() => setOverlay({ kind: "swap" })}
                            onOpenRecap={() => setOverlay({ kind: "recap" })}
                            onOpenHealth={() => go("health")}
                            onOpenStickers={() => setOverlay({ kind: "stickers" })}
                            onWatchAddress={() => navigation.navigate("ConnectWallet")}
                        />
                    )}
                    {t.key === "assets" && <Assets onOpenToken={h => setOverlay({ kind: "token", holding: h })} />}
                    {t.key === "activity" && <Activity onOpenRecap={() => setOverlay({ kind: "recap" })} />}
                    {t.key === "health" && <Health onOpenStickers={() => setOverlay({ kind: "stickers" })} />}
                </TabPane>
            ))}

            <TabBar active={tab} onChange={go} hidden={!!overlay} />

            {overlay && (
                <Animated.View key={overlay.kind} style={StyleSheet.absoluteFill} entering={FadeIn.duration(280)} exiting={FadeOut.duration(200)}>
                    {overlay.kind === "universe" && <Universe onBack={() => setOverlay(null)} onOpenAssets={() => go("assets")} />}
                    {overlay.kind === "swap" && <Swap initial={overlay.initial} onBack={() => setOverlay(null)} onViewActivity={() => go("activity")} />}
                    {overlay.kind === "token" && (
                        <TokenDetail
                            holding={overlay.holding}
                            onBack={() => setOverlay(null)}
                            onSwap={h => setOverlay({ kind: "swap", initial: { chainId: h.chain, symbol: h.symbol, address: h.address } })}
                        />
                    )}
                    {overlay.kind === "recap" && <Recap onClose={() => setOverlay(null)} />}
                    {overlay.kind === "stickers" && <StickerBook onBack={() => setOverlay(null)} onOpen={name => setOverlay({ kind: "milestone", sticker: name })} />}
                    {overlay.kind === "milestone" && milestone && (
                        <Milestone
                            spec={{ sticker: milestone.name, headline: milestone.headline, body: milestone.body }}
                            onClose={() => setOverlay({ kind: "stickers" })}
                        />
                    )}
                </Animated.View>
            )}
        </View>
    );
};

const Main = ({ navigation }: any) => {
    const { active } = useAccounts();

    // No account left (removed the last one): back to the welcome screen.
    useEffect(() => {
        if (!active) navigation.reset({ index: 0, routes: [{ name: "Welcome" }] });
    }, [active, navigation]);
    if (!active) return null;

    // key = address: switching accounts remounts every provider and screen with fresh state
    return (
        <PortfolioProvider key={active.id} address={active.address} label={active.label}>
            <ActivityProvider address={active.address}>
                <HealthProvider>
                    <MainBody navigation={navigation} />
                </HealthProvider>
            </ActivityProvider>
        </PortfolioProvider>
    );
};

const styles = StyleSheet.create({
    fill: { flex: 1 },
    hidden: { display: "none" },
    soon: { flex: 1, paddingHorizontal: 20 },
});

export default Main;
