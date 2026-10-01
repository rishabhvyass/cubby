import type { StickerName } from "../art/svgs";
import { ActivityRecord } from "./activity";
import { Health } from "./health";
import { Portfolio } from "./portfolio";

export const STICKER_SLOTS = 12;

export type Sticker = {
    name: StickerName;
    title: string;
    how: string;
    earned: boolean;
    /** Celebration copy, only for earned stickers */
    headline: string;
    body: string;
};

const fmtDate = (ms: number) => new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/**
 * Stickers are earned from real wallet facts, never from trades or price moves.
 * Two designed stickers need data we don't have yet (weekly check-ins, a self-attested backup)
 * so they stay locked rather than being faked.
 */
export const computeStickers = (portfolio: Portfolio | null, records: ActivityRecord[], health: Health | null): Sticker[] => {
    const chainsWithAssets = portfolio ? portfolio.byChain.filter(c => c.value > 0).length : 0;
    const revokes = records.filter(r => r.approval?.revoke).length;
    const yearOn = health?.since != null && Date.now() - health.since >= 365 * 86400000;
    const yielding = records.some(r => r.protocol === "Lido") || !!portfolio?.holdings.some(h => /^(st|wst)ETH$/i.test(h.symbol));

    return [
        {
            name: "hello", title: "Hello", how: "Connect a first wallet", earned: !!portfolio,
            headline: "Hello,\nCubby.", body: "You're watching your first wallet. Everything you own, in one calm place.",
        },
        {
            name: "clean_sweep", title: "Clean sweep", how: "Revoke an old approval", earned: revokes > 0,
            headline: "Clean\nsweep.", body: `You've revoked ${revokes} token approval${revokes === 1 ? "" : "s"}. Fewer apps can move your tokens now.`,
        },
        {
            name: "explorer", title: "Explorer", how: "Hold assets on every chain Cubby tracks", earned: chainsWithAssets >= 3,
            headline: "Explorer.", body: `You hold assets on ${chainsWithAssets} chains. That's the whole map.`,
        },
        {
            name: "one_year", title: "One year", how: "A year on-chain", earned: yearOn,
            headline: "One year\non-chain.",
            body: health?.since ? `Your first transaction was on ${fmtDate(health.since)}. ${health.totalTx.toLocaleString("en-US")} transactions later, here you are.` : "A year on-chain.",
        },
        {
            name: "first_yield", title: "First yield", how: "Hold or stake in DeFi", earned: yielding,
            headline: "First\nyield.", body: "You have assets working in DeFi. Cubby doesn't recommend protocols, it just notices.",
        },
        { name: "steady", title: "Steady", how: "12 weekly check-ins", earned: false, headline: "Steady.", body: "" },
        { name: "backed_up", title: "Backed up", how: "Confirm a seed backup", earned: false, headline: "Backed up.", body: "" },
    ];
};
