import { KNOWN_TOKENS } from "../config/tokens";

const CG = "https://api.coingecko.com/api/v3";

const sleep = (ms: number) => new Promise<void>(r => setTimeout(() => r(), ms));

// CoinGecko's free tier throttles hard (429 or a plain "Throttled" body), so retry with backoff.
export const cgGet = async (path: string, retries = 3) => {
    for (let attempt = 0; ; attempt++) {
        const res = await fetch(CG + path);
        const text = await res.text();
        if (res.ok && !/throttled/i.test(text)) return JSON.parse(text);
        if (attempt >= retries) throw new Error(`CoinGecko HTTP ${res.status}`);
        await sleep(1000 * 2 ** attempt);
    }
};

export type Quote = { price: number; change24h: number | null };

const CACHE_MS = 60_000;
let quotesCache: { at: number; value: Promise<Record<string, Quote>> } | null = null;

const coinbaseSpot = async (sym: string): Promise<number | null> => {
    try {
        const res = await fetch(`https://api.coinbase.com/v2/prices/${sym}-USD/spot`);
        return Number((await res.json()).data.amount);
    } catch {
        return null;
    }
};

/**
 * Prices for ETH and every known token in ONE CoinGecko request (keyed by CoinGecko id), cached for a minute.
 * If CoinGecko is throttling, falls back to Coinbase spot prices (no 24h change).
 */
export const getKnownQuotes = (ids: { cgId: string; cb: string }[]): Promise<Record<string, Quote>> => {
    if (quotesCache && Date.now() - quotesCache.at < CACHE_MS) return quotesCache.value;
    const unique = [...new Map([{ cgId: "ethereum", cb: "ETH" }, ...ids].map(i => [i.cgId, i])).values()];
    const value = (async () => {
        try {
            const data = await cgGet(`/simple/price?ids=${unique.map(u => u.cgId).join(",")}&vs_currencies=usd&include_24hr_change=true`);
            const out: Record<string, Quote> = {};
            for (const u of unique) if (data[u.cgId]) out[u.cgId] = { price: data[u.cgId].usd, change24h: data[u.cgId].usd_24h_change ?? null };
            if (Object.keys(out).length) return out;
        } catch { /* fall through to Coinbase */ }
        const out: Record<string, Quote> = {};
        await Promise.all(unique.map(async u => {
            const price = await coinbaseSpot(u.cb);
            if (price != null) out[u.cgId] = { price, change24h: null };
        }));
        if (!Object.keys(out).length) throw new Error("No price source available");
        return out;
    })();
    quotesCache = { at: Date.now(), value };
    value.catch(() => { quotesCache = null; });
    return value;
};

/** USD quote per contract address (lowercased) on one CoinGecko platform. */
export const getTokenPrices = async (platform: string, addresses: string[]): Promise<Record<string, Quote>> => {
    if (!addresses.length) return {};
    const data = await cgGet(`/simple/token_price/${platform}?contract_addresses=${addresses.join(",")}&vs_currencies=usd&include_24hr_change=true`);
    const out: Record<string, Quote> = {};
    for (const [addr, v] of Object.entries<any>(data)) out[addr.toLowerCase()] = { price: v.usd, change24h: v.usd_24h_change ?? null };
    return out;
};

/** Price history [timestampMs, usd][] for ETH or a token contract. */
export const getHistory = async (
    ref: { native: true } | { platform: string; address: string },
    days: number | "max",
): Promise<[number, number][]> => {
    const path = "native" in ref
        ? `/coins/ethereum/market_chart?vs_currency=usd&days=${days}`
        : `/coins/${ref.platform}/contract/${ref.address}/market_chart?vs_currency=usd&days=${days}`;
    return (await cgGet(path)).prices;
};

export const ALL_KNOWN = Object.values(KNOWN_TOKENS).flat().map(t => ({ cgId: t.cgId, cb: t.cb }));

/** ETH price (and 24h change) from the shared batched quote request. */
export const getEthPrice = async (): Promise<Quote> => (await getKnownQuotes(ALL_KNOWN)).ethereum;
