import { Chain, CHAINS } from "../config/chains";
import { KNOWN_TOKENS } from "../config/tokens";
import { getEthPrice, getTokenPrices, Quote } from "./prices";
import { rpc } from "./rpc";

export type Holding = {
    chain: Chain["id"];
    symbol: string;
    name: string;
    address: string | null; // null = native ETH
    amount: number;
    price: number;
    value: number;
    change24h: number | null; // percent
};

export type Portfolio = {
    holdings: Holding[];
    total: number;
    byChain: { chain: Chain; value: number }[];
};

const MAX_TOKENS_PER_CHAIN = 50;

const toAmount = (raw: string, decimals: number) => Number(BigInt(raw)) / 10 ** decimals;

const fetchChain = async (chain: Chain, wallet: string, eth: Quote): Promise<Holding[]> => {
    const wei = await rpc<string>(chain.rpcUrl, "eth_getBalance", [wallet, "latest"]);
    const holdings: Holding[] = [{
        chain: chain.id, symbol: "ETH", name: "Ethereum", address: null,
        amount: toAmount(wei, 18), price: eth.price, value: toAmount(wei, 18) * eth.price, change24h: eth.change24h,
    }];

    // Prefer the Token API add-on (finds every token); fall back to balanceOf on known tokens.
    let tokens: { symbol: string; name: string; address: string; amount: number }[];
    try {
        const res = await rpc<{ result: any[] }>(chain.rpcUrl, "qn_getWalletTokenBalance", { wallet, perPage: MAX_TOKENS_PER_CHAIN });
        tokens = (res.result ?? [])
            .filter(t => t.totalBalance && t.totalBalance !== "0")
            .map(t => ({ symbol: t.symbol, name: t.name, address: t.address.toLowerCase(), amount: toAmount(t.totalBalance, Number(t.decimals)) }));
    } catch {
        const data = "0x70a08231" + wallet.slice(2).toLowerCase().padStart(64, "0"); // balanceOf(address)
        const reads = await Promise.all(KNOWN_TOKENS[chain.id].map(async t => {
            try {
                const raw = await rpc<string>(chain.rpcUrl, "eth_call", [{ to: t.address, data }, "latest"]);
                return { symbol: t.symbol, name: t.name, address: t.address.toLowerCase(), amount: toAmount(raw === "0x" ? "0x0" : raw, t.decimals) };
            } catch {
                return null;
            }
        }));
        tokens = reads.filter((t): t is NonNullable<typeof t> => !!t && t.amount > 0);
    }

    try {
        const prices = await getTokenPrices(chain.cgPlatform, tokens.map(t => t.address));
        for (const t of tokens) {
            const quote = prices[t.address];
            if (!quote) continue; // unpriced/spam tokens are skipped
            holdings.push({
                chain: chain.id, symbol: t.symbol, name: t.name, address: t.address,
                amount: t.amount, price: quote.price, value: t.amount * quote.price, change24h: quote.change24h,
            });
        }
    } catch (e) {
        console.warn(`[portfolio] token prices unavailable on ${chain.id}:`, e);
    }
    return holdings;
};

export const loadPortfolio = async (wallet: string): Promise<Portfolio> => {
    const ethPrice = await getEthPrice();
    const settled = await Promise.allSettled(CHAINS.map(c => fetchChain(c, wallet, ethPrice)));
    settled.forEach((r, i) => r.status === "rejected" && console.warn(`[portfolio] ${CHAINS[i].id} failed:`, r.reason));
    if (settled.every(r => r.status === "rejected")) {
        throw (settled[0] as PromiseRejectedResult).reason;
    }
    const results = settled.map(r => (r.status === "fulfilled" ? r.value : []));
    const holdings = results.flat().filter(h => h.value >= 0.01);
    const byChain = CHAINS.map((chain, i) => ({
        chain,
        value: results[i].reduce((s, h) => s + h.value, 0),
    }));
    return { holdings, total: holdings.reduce((s, h) => s + h.value, 0), byChain };
};
