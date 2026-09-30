const CG = "https://api.coingecko.com/api/v3";

const get = async (path: string) => {
    const res = await fetch(CG + path);
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    return res.json();
};

export type Quote = { price: number; change24h: number | null };

let lastEth: Quote | null = null;

// CoinGecko's free tier rate-limits often, so fall back to Coinbase's public spot price (no 24h change).
export const getEthPrice = async (): Promise<Quote> => {
    try {
        const d = (await get("/simple/price?ids=ethereum&vs_currencies=usd&include_24hr_change=true")).ethereum;
        lastEth = { price: d.usd, change24h: d.usd_24h_change ?? null };
    } catch {
        try {
            const res = await fetch("https://api.coinbase.com/v2/prices/ETH-USD/spot");
            lastEth = { price: Number((await res.json()).data.amount), change24h: lastEth?.change24h ?? null };
        } catch (e) {
            if (!lastEth) throw e;
        }
    }
    return lastEth as Quote;
};

/** USD quote per contract address (lowercased) on one CoinGecko platform. */
export const getTokenPrices = async (platform: string, addresses: string[]): Promise<Record<string, Quote>> => {
    if (!addresses.length) return {};
    const data = await get(`/simple/token_price/${platform}?contract_addresses=${addresses.join(",")}&vs_currencies=usd&include_24hr_change=true`);
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
    return (await get(path)).prices;
};
