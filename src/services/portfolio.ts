import { Chain, CHAINS } from "../config/chains";
import { getEthPrice, getTokenPrices } from "./prices";
import { rpc } from "./rpc";

export type Holding = {
    chain: Chain["id"];
    symbol: string;
    name: string;
    address: string | null; // null = native ETH
    amount: number;
    price: number;
    value: number;
};

export type Portfolio = {
    holdings: Holding[];
    total: number;
    byChain: { chain: Chain; value: number }[];
};

const MAX_TOKENS_PER_CHAIN = 50;

const toAmount = (raw: string, decimals: number) => Number(BigInt(raw)) / 10 ** decimals;

const fetchChain = async (chain: Chain, wallet: string, ethPrice: number): Promise<Holding[]> => {
    const wei = await rpc<string>(chain.rpcUrl, "eth_getBalance", [wallet, "latest"]);
    const holdings: Holding[] = [{
        chain: chain.id, symbol: "ETH", name: "Ethereum", address: null,
        amount: toAmount(wei, 18), price: ethPrice, value: toAmount(wei, 18) * ethPrice,
    }];

    // Token API v2 add-on; if it isn't enabled we still show native balances.
    try {
        const res = await rpc<{ result: any[] }>(chain.rpcUrl, "qn_getWalletTokenBalance", { wallet, perPage: MAX_TOKENS_PER_CHAIN });
        const tokens = (res.result ?? []).filter(t => t.totalBalance && t.totalBalance !== "0");
        const prices = await getTokenPrices(chain.cgPlatform, tokens.map(t => t.address.toLowerCase()));
        for (const t of tokens) {
            const price = prices[t.address.toLowerCase()];
            if (!price) continue; // unpriced/spam tokens are skipped
            const amount = toAmount(t.totalBalance, Number(t.decimals));
            holdings.push({
                chain: chain.id, symbol: t.symbol, name: t.name, address: t.address.toLowerCase(),
                amount, price, value: amount * price,
            });
        }
    } catch (e) {
        console.warn(`[portfolio] token balances unavailable on ${chain.id}:`, e);
    }
    return holdings;
};

export const loadPortfolio = async (wallet: string): Promise<Portfolio> => {
    const ethPrice = await getEthPrice();
    const results = await Promise.all(CHAINS.map(c => fetchChain(c, wallet, ethPrice)));
    const holdings = results.flat().filter(h => h.value >= 0.01);
    const byChain = CHAINS.map((chain, i) => ({
        chain,
        value: results[i].reduce((s, h) => s + h.value, 0),
    }));
    return { holdings, total: holdings.reduce((s, h) => s + h.value, 0), byChain };
};
