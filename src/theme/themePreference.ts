import { Appearance } from "react-native";
import { useSyncExternalStore } from "react";

export type ThemePref = "system" | "light" | "dark";

let pref: ThemePref = "system";
const listeners = new Set<() => void>();

/** Overrides the app's colour scheme; "system" hands control back to the phone's setting. */
export const setThemePref = (next: ThemePref) => {
    pref = next;
    Appearance.setColorScheme(next === "system" ? "unspecified" : next);
    listeners.forEach(l => l());
};

export const useThemePref = (): ThemePref =>
    useSyncExternalStore(
        cb => { listeners.add(cb); return () => { listeners.delete(cb); }; },
        () => pref,
    );
