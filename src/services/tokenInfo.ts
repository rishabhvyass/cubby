import { Chain } from "../config/chains";
import { KNOWN_TOKENS } from "../config/tokens";
import { isFresh, key, peek, readCache, writeCache } from "./cache";
import { cgGet } from "./prices";

export type TokenInfo = {
    id: string;
    name: string;
    symbol: string;
    rank: number | null;
    price: number | null;
    change24h: number | null;
    marketCap: number | null;
    volume24h: number | null;
    circulating: number | null;
    totalSupply: number | null;
    maxSupply: number | null;
    high24h: number | null;
    low24h: number | null;
    ath: number | null;
    athChangePct: number | null;
    athDate: string | null;
};

export type TokenRef = { chain: Chain; address: string | null; symbol: string };

const TTL = 5 * 60_000;
const n = (v: unknown): number | null => (typeof v === "number" && Number.isFinite(v) ? v : null);

/** CoinGecko id for a token we know; native ETH is "ethereum". Unknown tokens are looked up by contract. */
export const coinIdFor = (t: TokenRef): string | null => {
    if (!t.address) return "ethereum";
    return KNOWN_TOKENS[t.chain.id].find(k => k.address.toLowerCase() === t.address!.toLowerCase())?.cgId ?? null;
};

const QS = "localization=false&tickers=false&community_data=false&developer_data=false&sparkline=false";

/** Market data for a token (cached for 5 minutes; returns the last copy if CoinGecko is throttling). */
export const loadTokenInfo = async (t: TokenRef): Promise<TokenInfo> => {
    const id = coinIdFor(t);
    const ck = key.token(id ?? `${t.chain.id}:${t.address}`, "info");
    const cached = await readCache<TokenInfo>(ck);
    if (cached && isFresh(cached, TTL)) return cached.value;
    try {
        const d = id
            ? await cgGet(`/coins/${id}?${QS}`)
            : await cgGet(`/coins/${t.chain.cgPlatform}/contract/${t.address}?${QS}`);
        const m = d.market_data ?? {};
        const info: TokenInfo = {
            id: d.id, name: d.name, symbol: String(d.symbol ?? t.symbol).toUpperCase(), rank: n(d.market_cap_rank),
            price: n(m.current_price?.usd), change24h: n(m.price_change_percentage_24h),
            marketCap: n(m.market_cap?.usd), volume24h: n(m.total_volume?.usd),
            circulating: n(m.circulating_supply), totalSupply: n(m.total_supply), maxSupply: n(m.max_supply),
            high24h: n(m.high_24h?.usd), low24h: n(m.low_24h?.usd),
            ath: n(m.ath?.usd), athChangePct: n(m.ath_change_percentage?.usd), athDate: m.ath_date?.usd ?? null,
        };
        writeCache(ck, info);
        return info;
    } catch (e) {
        if (cached) return cached.value;
        throw e;
    }
};

export const peekTokenInfo = (t: TokenRef): TokenInfo | null => {
    const id = coinIdFor(t);
    return peek<TokenInfo>(key.token(id ?? `${t.chain.id}:${t.address}`, "info"))?.value ?? null;
};
