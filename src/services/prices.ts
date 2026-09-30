const CG = "https://api.coingecko.com/api/v3";

const get = async (path: string) => {
    const res = await fetch(CG + path);
    if (!res.ok) throw new Error(`CoinGecko HTTP ${res.status}`);
    return res.json();
};

export const getEthPrice = async (): Promise<number> =>
    (await get("/simple/price?ids=ethereum&vs_currencies=usd")).ethereum.usd;

/** USD price per contract address (lowercased) on one CoinGecko platform. */
export const getTokenPrices = async (platform: string, addresses: string[]): Promise<Record<string, number>> => {
    if (!addresses.length) return {};
    const data = await get(`/simple/token_price/${platform}?contract_addresses=${addresses.join(",")}&vs_currencies=usd`);
    const out: Record<string, number> = {};
    for (const [addr, v] of Object.entries<any>(data)) out[addr.toLowerCase()] = v.usd;
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
