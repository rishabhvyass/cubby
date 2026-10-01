import { useMemo } from "react";
import { CUBBY_TABS, FloatingTabBar, TabDef } from "./FloatingTabBar";
import { useTheme } from "../theme/useTheme";

export const TABS = [
    { key: "home", label: "Home" },
    { key: "assets", label: "Assets" },
    { key: "activity", label: "Activity" },
    { key: "health", label: "Health" },
] as const;
export type TabKey = (typeof TABS)[number]["key"];

const DEFS: TabDef[] = CUBBY_TABS.map((t, i) => ({ ...t, name: TABS[i].key }));
const routes = TABS.map(t => ({ key: t.key, name: t.key }));

/** Adapts Main's tab state to the kit's FloatingTabBar (which expects React Navigation props). */
export const TabBar = ({ active, onChange, hidden }: { active: TabKey; onChange: (k: TabKey) => void; hidden?: boolean }) => {
    const { scheme } = useTheme();
    const navigation = useMemo(() => ({
        emit: () => ({ defaultPrevented: false }),
        navigate: (name: string) => onChange(name as TabKey),
    }), [onChange]);
    return (
        <FloatingTabBar
            tabs={DEFS}
            scheme={scheme}
            hidden={hidden}
            state={{ index: TABS.findIndex(t => t.key === active), routes }}
            navigation={navigation}
        />
    );
};
