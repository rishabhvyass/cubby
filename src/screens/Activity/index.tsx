import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from "react-native";
import Animated from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Icon } from "../../art/Art";
import { SlidingChips } from "../../components/SlidingSelector";
import { AccountHeader } from "../../components/AccountHeader";
import { activityFilters, ActivityItem, loadActivity } from "../../services/activity";
import { usePortfolio } from "../../state/portfolio";
import { useRow } from "../../motion/motion";
import { Palette, radius } from "../../theme/tokens";
import { useTheme } from "../../theme/useTheme";

const NEUTRAL_TILE = "#EDEDE6";

const Row = ({ item, index, last, p, s }: { item: ActivityItem; index: number; last: boolean; p: Palette; s: ReturnType<typeof createStyles> }) => {
    const row = useRow(index);
    const neutral = item.tile === NEUTRAL_TILE;
    const amountColor = item.amountTone === "positive" ? p.positive : item.amountTone === "secondary" ? p.textSecondary : p.text;
    return (
        <Animated.View style={[s.row, last && { borderBottomWidth: 0 }, row]}>
            <View style={[s.tile, { backgroundColor: neutral ? p.surface2 : item.tile }]}>
                <Icon name={item.kind === "approve" ? "lock" : item.kind === "contract" ? "activity" : item.kind} size={22} color={neutral ? p.text : "#0A0A0A"} />
            </View>
            <View style={{ flex: 1 }}>
                <View style={s.titleRow}>
                    <Text style={s.rowTitle}>{item.title}</Text>
                    {item.status === "pending" && (
                        <View style={[s.chip, { backgroundColor: p.cautionTint }]}><Text style={[s.chipText, { color: p.caution }]}>● Pending</Text></View>
                    )}
                    {item.status === "failed" && (
                        <View style={[s.chip, { backgroundColor: p.negativeTint }]}><Text style={[s.chipText, { color: p.negative }]}>✕ Failed</Text></View>
                    )}
                </View>
                <Text style={s.meta} numberOfLines={2}>{item.meta}</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
                <Text style={[s.amount, { color: amountColor }]}>{item.amount}</Text>
                <Text style={s.time}>{item.time}</Text>
            </View>
        </Animated.View>
    );
};

const Activity = () => {
    const insets = useSafeAreaInsets();
    const { palette: p } = useTheme();
    const s = useMemo(() => createStyles(p), [p]);
    const { address } = usePortfolio();
    const [items, setItems] = useState<ActivityItem[] | null>(null);
    const [errors, setErrors] = useState<string[]>([]);
    const [filter, setFilter] = useState<(typeof activityFilters)[number]>("All");

    useEffect(() => {
        let cancelled = false;
        loadActivity(address)
            .then(r => { if (!cancelled) { setItems(r.items); setErrors(r.errors); } })
            .catch(e => { if (!cancelled) { setItems([]); setErrors([String(e.message ?? e)]); } });
        return () => { cancelled = true; };
    }, [address]);

    const shown = (items ?? []).filter(a => filter === "All" || a.category === filter);
    const days = [...new Set(shown.map(i => i.day))];
    const needsAddon = errors.some(e => /not enabled|does not exist|not available/i.test(e));

    return (
        <ScrollView contentContainerStyle={[s.scroll, { paddingTop: insets.top + 8 }]} showsVerticalScrollIndicator={false}>
            <AccountHeader />
            <Text style={s.title}>Activity</Text>

            <SlidingChips
                options={activityFilters.map(f => ({ id: f, label: f }))}
                value={filter}
                onChange={f => setFilter(f as (typeof activityFilters)[number])}
                p={p}
            />

            {days.map(day => {
                const group = shown.filter(i => i.day === day);
                return (
                    <View key={day}>
                        <Text style={s.day}>{day}</Text>
                        {group.map((it, i) => <Row key={`${day}-${i}`} item={it} index={i} last={false} p={p} s={s} />)}
                    </View>
                );
            })}
            {items === null && <ActivityIndicator style={{ marginTop: 32 }} />}
            {items !== null && shown.length === 0 && (
                <View style={s.emptyBox}>
                    <Text style={s.emptyTitle}>{needsAddon ? "Activity needs one more switch" : "Nothing here yet"}</Text>
                    <Text style={s.emptyBody}>
                        {needsAddon
                            ? "Turn on the Token and NFT API add-on for your QuickNode endpoints to see this wallet's history."
                            : filter === "All" ? "New transactions on Ethereum, Base and Arbitrum will show up here on their own." : `No ${filter.toLowerCase()} yet.`}
                    </Text>
                </View>
            )}
            {items !== null && errors.length > 0 && !needsAddon && (
                <Text style={s.footnote}>Some chains couldn't load: {errors.join(" · ")}</Text>
            )}
            {items !== null && items.length > 0 && <Text style={s.footnote}>Amounts and fees are estimated at today's prices.</Text>}
        </ScrollView>
    );
};

const createStyles = (p: Palette) => StyleSheet.create({
    scroll: { paddingHorizontal: 20, paddingBottom: 130 },
    title: { fontSize: 46, fontWeight: "700", letterSpacing: -1.9, color: p.text, marginTop: 22 },
    recap: { flexDirection: "row", backgroundColor: p.accent, borderWidth: 2, borderColor: p.buttonEdge, borderRadius: 28, padding: 20, marginTop: 18, minHeight: 150, boxShadow: `0 4px 0 ${p.buttonEdge}` },
    recapKicker: { fontSize: 15, fontWeight: "600", color: p.onAccent },
    recapTitle: { fontSize: 34, fontWeight: "700", letterSpacing: -1.2, lineHeight: 36, color: p.onAccent, marginTop: 6, maxWidth: 190 },
    watch: { flexDirection: "row", alignItems: "center", gap: 10, marginTop: 14 },
    play: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#0A0A0A", alignItems: "center", justifyContent: "center" },
    watchText: { fontSize: 16, fontWeight: "700", color: p.onAccent },
    stickerA: { position: "absolute", right: 16, top: 12 },
    stickerB: { position: "absolute", right: 60, bottom: 12 },
    chipScroll: { marginHorizontal: -20 },
    chips: { gap: 10, paddingHorizontal: 20, paddingVertical: 18 },
    filter: { backgroundColor: p.surface, borderWidth: 1, borderColor: p.border, borderRadius: radius.chip + 6, paddingHorizontal: 20, height: 44, justifyContent: "center" },
    filterOn: { backgroundColor: p.text, borderColor: p.text },
    filterText: { fontSize: 16, fontWeight: "600", color: p.text },
    filterTextOn: { color: p.bg },
    day: { fontSize: 15, fontWeight: "600", color: p.textSecondary, marginTop: 14, marginBottom: 4 },
    row: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: p.border },
    tile: { width: 48, height: 48, borderRadius: 14, alignItems: "center", justifyContent: "center" },
    titleRow: { flexDirection: "row", alignItems: "center", gap: 8 },
    rowTitle: { fontSize: 18, fontWeight: "700", color: p.text },
    chip: { borderRadius: 12, paddingHorizontal: 9, paddingVertical: 3 },
    chipText: { fontSize: 13, fontWeight: "700" },
    meta: { fontSize: 14, color: p.textSecondary, marginTop: 3, lineHeight: 19 },
    amount: { fontSize: 18, fontWeight: "700", fontVariant: ["tabular-nums"] },
    time: { fontSize: 14, color: p.textSecondary, marginTop: 3 },
    emptyBox: { alignItems: "center", paddingVertical: 40, paddingHorizontal: 24 },
    emptyTitle: { fontSize: 20, fontWeight: "700", color: p.text, textAlign: "center" },
    emptyBody: { fontSize: 15, lineHeight: 22, color: p.textSecondary, textAlign: "center", marginTop: 8 },
    footnote: { fontSize: 13, color: p.textSecondary, marginTop: 20 },
});

export default Activity;
