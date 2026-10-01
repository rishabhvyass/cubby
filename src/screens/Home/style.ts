import { Platform, StyleSheet } from "react-native";
import { Palette } from "../../theme/tokens";

// iOS resolves fonts by PostScript name, Android by file name.
const DOTO = Platform.select({ ios: "Doto-Black", default: "Doto_900Black" });

export const createStyles = (p: Palette) => StyleSheet.create({
    root: { flex: 1, backgroundColor: p.bg },
    scroll: { paddingHorizontal: 20, paddingBottom: 130 },

    // header
    header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: 8 },
    account: { flexDirection: "row", alignItems: "center", gap: 10 },
    avatar: { width: 40, height: 40, borderRadius: 12, backgroundColor: p.text, alignItems: "center", justifyContent: "center" },
    avatarFace: { width: 22, height: 16, borderRadius: 4, backgroundColor: p.accent },
    accountName: { fontSize: 17, fontWeight: "700", color: p.text },
    chevron: { fontSize: 12, color: p.textSecondary },
    badge: { width: 44, height: 44, borderRadius: 22, borderWidth: 3, borderColor: p.accent, backgroundColor: p.surface, alignItems: "center", justifyContent: "center" },
    badgeText: { fontSize: 20 },

    errorText: { color: p.negative, fontSize: 14, marginTop: 16 },

    // net worth
    netRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 22 },
    netLabel: { fontSize: 15, color: p.textSecondary },
    liveDot: { width: 9, height: 9, borderRadius: 5, backgroundColor: p.accent, borderWidth: 1.5, borderColor: p.positive },
    netValueRow: { flexDirection: "row", alignItems: "flex-end", marginTop: 6 },
    netValue: { flexShrink: 1, fontFamily: DOTO, fontSize: 62, letterSpacing: -1.2, color: p.text },
    netCents: { fontFamily: DOTO, fontSize: 30, color: p.textSecondary, marginBottom: 8, marginLeft: 2 },
    deltaRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 6 },
    deltaPill: { backgroundColor: p.positiveTint, borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
    deltaText: { fontSize: 14, fontWeight: "700", color: p.positive },
    swapBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: p.accent, borderWidth: 2, borderColor: p.buttonEdge, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 7 },
    swapText: { fontSize: 14, fontWeight: "700", color: p.onAccent },
    deltaWeek: { fontSize: 14, color: p.textSecondary },

    chart: { marginTop: 18 },

    // range selector
    ranges: { flexDirection: "row", backgroundColor: p.surface2, borderRadius: 24, padding: 5, marginTop: 20 },
    range: { flex: 1, alignItems: "center", paddingVertical: 10, borderRadius: 20 },
    rangeActive: { backgroundColor: p.text },
    rangeText: { fontSize: 14, fontWeight: "600", color: p.textSecondary },
    rangeTextActive: { color: p.bg },

    // story
    story: { backgroundColor: p.bar, borderWidth: 1, borderColor: p.border, borderRadius: 28, padding: 20, marginTop: 24 },
    storyTag: { flexDirection: "row", alignItems: "center", gap: 8 },
    storyTagText: { fontSize: 13, color: p.storyMuted },
    storyTitle: { fontSize: 28, fontWeight: "700", letterSpacing: -0.8, color: "#F5F5F5", marginTop: 14 },
    storyBody: { fontSize: 15, lineHeight: 22, color: p.storyMuted, marginTop: 8 },
    storyBar: { flexDirection: "row", height: 10, borderRadius: 5, overflow: "hidden", gap: 4, marginTop: 18 },
    storyLegend: { flexDirection: "row", gap: 16, marginTop: 10 },
    storyLegendText: { fontSize: 12, color: p.storyMuted },
    storyLink: { fontSize: 15, fontWeight: "700", color: "#F5F5F5", marginTop: 18 },

    // allocation
    sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 32 },
    sectionTitle: { fontSize: 22, fontWeight: "700", letterSpacing: -0.5, color: p.text },
    sectionLink: { fontSize: 15, color: p.textSecondary },
    allocBar: { flexDirection: "row", height: 12, gap: 4, marginTop: 14 },
    assetRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: p.border },
    assetChip: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
    assetChipText: { fontSize: 9, fontWeight: "700", color: p.onAccent },
    assetName: { flex: 1, fontSize: 17, fontWeight: "500", color: p.text, marginLeft: 14 },
    assetValue: { fontSize: 17, fontWeight: "700", color: p.text },
    assetPct: { width: 56, textAlign: "right", fontSize: 14, color: p.textSecondary },

    // cubby
    card: { backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 24, padding: 18 },
    cubbyCard: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 26 },
    cubbyIcon: { width: 64, height: 64, borderRadius: 16, backgroundColor: p.surface2, alignItems: "center", justifyContent: "center" },
    cubbyTitle: { fontSize: 18, fontWeight: "700", color: p.text },
    cubbyMeta: { fontSize: 14, color: p.textSecondary, marginTop: 4 },
    dots: { flexDirection: "row", alignItems: "center", gap: 3, marginTop: 10 },
    dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: p.accent, borderWidth: 1, borderColor: p.positive },
    dotsText: { fontSize: 12, fontWeight: "600", color: p.text, marginLeft: 6 },
    twoCol: { flexDirection: "row", gap: 12, marginTop: 12 },
    tile: { flex: 1, minHeight: 160, justifyContent: "flex-end" },
    tileArt: { position: "absolute", top: 16, left: 18 },
    tileTitle: { fontSize: 18, fontWeight: "700", color: p.text },
    tileDesc: { fontSize: 14, color: p.textSecondary, marginTop: 2 },

    // chains
    chains: { gap: 10, paddingVertical: 14, paddingRight: 20 },
    chain: { flexDirection: "row", alignItems: "center", gap: 10, backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: 30, paddingVertical: 8, paddingLeft: 8, paddingRight: 18 },
    chainChip: { width: 36, height: 36, borderRadius: 18, backgroundColor: p.surface2, alignItems: "center", justifyContent: "center" },
    chainChipText: { fontSize: 11, fontWeight: "700", color: p.text },
    chainName: { fontSize: 13, color: p.textSecondary },
    chainValue: { fontSize: 16, fontWeight: "700", color: p.text },

    // bottom nav
    nav: { position: "absolute", left: 0, right: 0, alignItems: "center" },
    navPill: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: p.bar, borderRadius: 40, padding: 8 },
    navActive: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: p.accent, borderRadius: 30, paddingHorizontal: 20, paddingVertical: 14 },
    navActiveText: { fontSize: 16, fontWeight: "700", color: p.onAccent },
    navItem: { width: 48, height: 48, alignItems: "center", justifyContent: "center" },
    navGlyph: { fontSize: 20, color: p.text },
});
