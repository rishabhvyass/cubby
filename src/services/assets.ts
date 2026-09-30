import { Holding } from "./portfolio";

export type AssetGroup = { symbol: string; name: string; amount: number; value: number; change24h: number | null };

/** Merges holdings of the same symbol across chains, biggest first. 24h change is value-weighted. */
export const groupBySymbol = (holdings: Holding[]): AssetGroup[] => {
    const map = new Map<string, AssetGroup & { weighted: number; weightedValue: number }>();
    for (const h of holdings) {
        const g = map.get(h.symbol) ?? { symbol: h.symbol, name: h.name, amount: 0, value: 0, change24h: null, weighted: 0, weightedValue: 0 };
        g.amount += h.amount;
        g.value += h.value;
        if (h.change24h != null) { g.weighted += h.change24h * h.value; g.weightedValue += h.value; }
        map.set(h.symbol, g);
    }
    return [...map.values()]
        .map(({ weighted, weightedValue, ...g }) => ({ ...g, change24h: weightedValue ? weighted / weightedValue : null }))
        .sort((a, b) => b.value - a.value);
};
