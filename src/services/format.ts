export const usd = (n: number, digits = 0) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: digits, maximumFractionDigits: digits });

/** $24.8K, $1.28M — for tight spaces (planets). */
export const usdCompact = (n: number) => {
    if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
    if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
    if (n >= 1e3) return `$${(n / 1e3).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
};

export const fmtAmount = (n: number) =>
    n.toLocaleString("en-US", { maximumFractionDigits: n >= 1000 ? 0 : n >= 1 ? 2 : 4 });

/** Sign glyph + percent, never colour alone: ▲ 8.21% / ▼ 2.40% / — 0.00% */
export const fmtDelta = (pct: number | null) => {
    if (pct == null) return { text: "—", tone: "flat" as const };
    if (Math.abs(pct) < 0.005) return { text: "— 0.00%", tone: "flat" as const };
    return pct > 0
        ? { text: `▲ ${pct.toFixed(2)}%`, tone: "up" as const }
        : { text: `▼ ${Math.abs(pct).toFixed(2)}%`, tone: "down" as const };
};
