import { Platform } from "react-native";

// iOS resolves custom fonts by PostScript name, Android by file name.
export const DOTO = Platform.select({ ios: "Doto-Black", default: "Doto_900Black" }) as string;
