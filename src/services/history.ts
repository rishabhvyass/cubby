import { Holding } from "./portfolio";
import { getHistory } from "./prices";
import { CHAINS } from "../config/chains";

export type RangeKey = "1D" | "1W" | "1M" | "3M" | "1Y" | "ALL";
const DAYS: Record<RangeKey, number | "max"> = { "1D": 1, "1W": 7, "1M": 30, "3M": 90, "1Y": 365, "ALL": "max" };
const TOP_N = 5;

export type History = {
    points: number[]; // portfolio USD value over time
    change: number;
    changePct: number;
    contributions: { symbol: string; delta: number }[];
};

/**
 * Approximates history by valuing TODAY's holdings at past prices (no transfers
 * are replayed), so the chart shows price performance, not true past balances.
 * Only the top holdings by value are fetched to stay inside CoinGecko rate limits.
 */
export const loadHistory = async (holdings: Holding[], range: RangeKey): Promise<History> => {
    // Same asset on several chains (ETH, USDC…) shares one price series, so merge by symbol first.
    const bySymbol = new Map<string, { ref: Holding; amount: number; value: number }>();
    for (const h of holdings) {
        const cur = bySymbol.get(h.symbol);
        if (cur) { cur.amount += h.amount; cur.value += h.value; }
        else bySymbol.set(h.symbol, { ref: h, amount: h.amount, value: h.value });
    }
    const top = [...bySymbol.values()].sort((a, b) => b.value - a.value).slice(0, TOP_N);
    const series = await Promise.all(top.map(async ({ ref, amount }) => {
        const platform = CHAINS.find(c => c.id === ref.chain)!.cgPlatform;
        const prices = await getHistory(ref.address ? { platform, address: ref.address } : { native: true }, DAYS[range]);
        return { symbol: ref.symbol, amount, prices };
    }));

    const len = Math.min(...series.map(s => s.prices.length));
    const points = Array.from({ length: len }, (_, i) =>
        series.reduce((sum, { amount, prices }) => sum + amount * prices[prices.length - len + i][1], 0));

    const contributions = series.map(({ symbol, amount, prices }) => ({
        symbol,
        delta: amount * (prices[prices.length - 1][1] - prices[prices.length - len][1]),
    })).sort((a, b) => b.delta - a.delta);

    const change = points[len - 1] - points[0];
    return { points, change, changePct: points[0] ? (change / points[0]) * 100 : 0, contributions };
};
