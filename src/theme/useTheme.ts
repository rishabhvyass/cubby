import { useColorScheme } from "react-native";
import { Palette, palettes, Scheme } from "./tokens";

/** Follows the system light/dark setting. */
export const useTheme = (): { scheme: Scheme; palette: Palette } => {
    const scheme: Scheme = useColorScheme() === "dark" ? "dark" : "light";
    return { scheme, palette: palettes[scheme] };
};
