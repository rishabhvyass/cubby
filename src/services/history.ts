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
    const top = [...holdings].sort((a, b) => b.value - a.value).slice(0, TOP_N);
    const series = await Promise.all(top.map(async h => {
        const platform = CHAINS.find(c => c.id === h.chain)!.cgPlatform;
        const prices = await getHistory(h.address ? { platform, address: h.address } : { native: true }, DAYS[range]);
        return { h, prices };
    }));

    const len = Math.min(...series.map(s => s.prices.length));
    const points = Array.from({ length: len }, (_, i) =>
        series.reduce((sum, { h, prices }) => sum + h.amount * prices[prices.length - len + i][1], 0));

    const contributions = series.map(({ h, prices }) => ({
        symbol: h.symbol,
        delta: h.amount * (prices[prices.length - 1][1] - prices[prices.length - len][1]),
    })).sort((a, b) => b.delta - a.delta);

    const change = points[len - 1] - points[0];
    return { points, change, changePct: points[0] ? (change / points[0]) * 100 : 0, contributions };
};
