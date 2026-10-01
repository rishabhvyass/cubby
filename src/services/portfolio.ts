import { Chain, CHAINS } from "../config/chains";
import { KNOWN_TOKENS } from "../config/tokens";
import { ALL_KNOWN, getKnownQuotes, getTokenPrices, Quote } from "./prices";
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

const MAX_TOKENS_PER_CHAIN = 100;

const toAmount = (raw: string, decimals: number) => Number(BigInt(raw)) / 10 ** decimals;

const fetchChain = async (chain: Chain, wallet: string, quotes: Record<string, Quote>): Promise<Holding[]> => {
    const eth = quotes.ethereum;
    const wei = await rpc<string>(chain.rpcUrl, "eth_getBalance", [wallet, "latest"]);
    const holdings: Holding[] = [{
        chain: chain.id, symbol: "ETH", name: "Ethereum", address: null,
        amount: toAmount(wei, 18), price: eth.price, value: toAmount(wei, 18) * eth.price, change24h: eth.change24h,
    }];

    type Tok = { symbol: string; name: string; address: string; amount: number; cgId?: string };
    const found = new Map<string, Tok>();

    // 1) Token API add-on: broad discovery (array-style params). Page 1 only; mostly unpriced airdrops get dropped later.
    try {
        const res = await rpc<{ result: any[] }>(chain.rpcUrl, "qn_getWalletTokenBalance", [{ wallet, perPage: MAX_TOKENS_PER_CHAIN }]);
        for (const t of res.result ?? []) {
            if (!t.totalBalance || t.totalBalance === "0") continue;
            const address = t.address.toLowerCase();
            found.set(address, { symbol: t.symbol, name: t.name, address, amount: toAmount(t.totalBalance, Number(t.decimals)) });
        }
    } catch (e) {
        console.log(`[portfolio] token API unavailable on ${chain.id}, using known tokens only:`, (e as Error).message);
    }

    // 2) Known tokens via balanceOf: always checked, so valuable tokens show even when the add-on is off or paged away.
    const data = "0x70a08231" + wallet.slice(2).toLowerCase().padStart(64, "0"); // balanceOf(address)
    await Promise.all(KNOWN_TOKENS[chain.id].map(async t => {
        try {
            const raw = await rpc<string>(chain.rpcUrl, "eth_call", [{ to: t.address, data }, "latest"]);
            const amount = toAmount(raw === "0x" ? "0x0" : raw, t.decimals);
            if (amount > 0) found.set(t.address.toLowerCase(), { symbol: t.symbol, name: t.name, address: t.address.toLowerCase(), amount, cgId: t.cgId });
        } catch { /* skip */ }
    }));
    const tokens = [...found.values()];

    // Known tokens are priced from the shared batched quotes; only unfamiliar tokens need a per-contract lookup.
    const unknown = tokens.filter(t => !t.cgId);
    let contractPrices: Record<string, Quote> = {};
    if (unknown.length) {
        try { contractPrices = await getTokenPrices(chain.cgPlatform, unknown.map(t => t.address)); }
        catch (e) { console.log(`[portfolio] contract prices unavailable on ${chain.id}:`, (e as Error).message); }
    }
    for (const t of tokens) {
        const quote = t.cgId ? quotes[t.cgId] : contractPrices[t.address];
        if (!quote) continue; // unpriced/spam tokens are skipped
        holdings.push({
            chain: chain.id, symbol: t.symbol, name: t.name, address: t.address,
            amount: t.amount, price: quote.price, value: t.amount * quote.price, change24h: quote.change24h,
        });
    }
    return holdings;
};

export const loadPortfolio = async (wallet: string): Promise<Portfolio> => {
    const quotes = await getKnownQuotes(ALL_KNOWN);
    const settled = await Promise.allSettled(CHAINS.map(c => fetchChain(c, wallet, quotes)));
    settled.forEach((r, i) => r.status === "rejected" && console.log(`[portfolio] ${CHAINS[i].id} failed:`, r.reason));
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
