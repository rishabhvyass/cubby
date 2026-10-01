import { Chain } from "../config/chains";
import { KNOWN_TOKENS } from "../config/tokens";
import { Holding } from "./portfolio";
import { rpc } from "./rpc";

export const NATIVE = "0x0000000000000000000000000000000000000000";

export type SwapToken = {
    chain: Chain;
    address: string | null;   // null = native ETH
    symbol: string;
    name: string;
    decimals: number;
    balance: number;
    price: number | null;     // USD, when known
};

export type SwapQuote = {
    toAmount: number;         // human units, expected
    toAmountMin: number;      // after slippage
    fromUsd: number | null;
    toUsd: number | null;
    gasUsd: number | null;
    tool: string;             // route provider, e.g. "1inch"
    approvalAddress: string | null;
    tx: { to: string; data: string; value: string; gasLimit?: string; chainId: number };
};

const LIFI = "https://li.quest/v1";
const FEE_BUFFER_ETH = 0.003; // keep some ETH for gas when swapping the "max" of the native token

/** Tokens you can swap on a chain: native ETH, the known tokens, and anything else you hold that is priced. */
export const tokensFor = (chain: Chain, holdings: Holding[]): SwapToken[] => {
    const mine = holdings.filter(h => h.chain === chain.id);
    const find = (addr: string | null) => mine.find(h => (h.address ?? null) === (addr ? addr.toLowerCase() : null));
    const tokens: SwapToken[] = [];
    const nat = find(null);
    tokens.push({ chain, address: null, symbol: "ETH", name: "Ethereum", decimals: 18, balance: nat?.amount ?? 0, price: nat?.price ?? null });
    const seen = new Set<string>();
    for (const t of KNOWN_TOKENS[chain.id]) {
        const h = find(t.address);
        seen.add(t.address.toLowerCase());
        tokens.push({ chain, address: t.address, symbol: t.symbol, name: t.name, decimals: t.decimals, balance: h?.amount ?? 0, price: h?.price ?? null });
    }
    for (const h of mine) {
        if (!h.address || seen.has(h.address)) continue; // already listed
        tokens.push({ chain, address: h.address, symbol: h.symbol, name: h.name, decimals: 18, balance: h.amount, price: h.price });
    }
    // held tokens first, then the rest
    return tokens.sort((a, b) => Number(b.balance * (b.price ?? 0) > 0) - Number(a.balance * (a.price ?? 0) > 0) || b.balance * (b.price ?? 0) - a.balance * (a.price ?? 0));
};

export const maxSpendable = (t: SwapToken) => (t.address ? t.balance : Math.max(0, t.balance - FEE_BUFFER_ETH));

/** "1.25" -> raw integer units, without floating point drift. */
export const toRaw = (value: string, decimals: number): bigint => {
    const v = value.trim();
    if (!/^\d*\.?\d*$/.test(v) || v === "" || v === ".") return 0n;
    const [whole, frac = ""] = v.split(".");
    return BigInt(whole || "0") * 10n ** BigInt(decimals) + BigInt((frac + "0".repeat(decimals)).slice(0, decimals) || "0");
};

const fromRaw = (raw: string | bigint, decimals: number) => Number(BigInt(raw)) / 10 ** decimals;

export class NoRouteError extends Error {}

export const getQuote = async (from: SwapToken, to: SwapToken, amountRaw: bigint, wallet: string, slippage = 0.005, signal?: AbortSignal): Promise<SwapQuote> => {
    const qs = new URLSearchParams({
        fromChain: String(from.chain.chainId), toChain: String(to.chain.chainId),
        fromToken: from.address ?? NATIVE, toToken: to.address ?? NATIVE,
        fromAmount: amountRaw.toString(), fromAddress: wallet, slippage: String(slippage),
    });
    const res = await fetch(`${LIFI}/quote?${qs}`, { signal });
    const json: any = await res.json().catch(() => ({}));
    if (!res.ok || !json.estimate) {
        const msg = String(json.message ?? `Quote failed (${res.status})`);
        if (res.status === 404 || /no available quotes|no route/i.test(msg)) throw new NoRouteError("No route found for this pair and amount.");
        throw new Error(msg);
    }
    const e = json.estimate;
    const t = json.transactionRequest;
    return {
        toAmount: fromRaw(e.toAmount, to.decimals),
        toAmountMin: fromRaw(e.toAmountMin, to.decimals),
        fromUsd: e.fromAmountUSD ? Number(e.fromAmountUSD) : null,
        toUsd: e.toAmountUSD ? Number(e.toAmountUSD) : null,
        gasUsd: (e.gasCosts ?? []).reduce((s: number, g: any) => s + Number(g.amountUSD ?? 0), 0) || null,
        tool: json.toolDetails?.name ?? json.tool ?? "best route",
        approvalAddress: from.address ? e.approvalAddress ?? null : null,
        tx: { to: t.to, data: t.data, value: t.value ?? "0x0", gasLimit: t.gasLimit, chainId: t.chainId },
    };
};

// ---- on-chain helpers (read through our own RPC; writes go through the user's wallet) ----------------------------------
const pad = (addr: string) => addr.slice(2).toLowerCase().padStart(64, "0");

export const readAllowance = async (chain: Chain, token: string, owner: string, spender: string): Promise<bigint> => {
    const raw = await rpc<string>(chain.rpcUrl, "eth_call", [{ to: token, data: "0xdd62ed3e" + pad(owner) + pad(spender) }, "latest"]);
    return raw && raw !== "0x" ? BigInt(raw) : 0n;
};

/** approve(spender, amount): exactly the amount being swapped, never unlimited. */
export const approveData = (spender: string, amount: bigint) => "0x095ea7b3" + pad(spender) + amount.toString(16).padStart(64, "0");

export const hex = (n: number | bigint) => "0x" + n.toString(16);

export const explorerTx = (chain: Chain, hash: string) =>
    `${chain.id === "ethereum" ? "https://etherscan.io" : chain.id === "base" ? "https://basescan.org" : "https://arbiscan.io"}/tx/${hash}`;

export const explorerAddress = (chain: Chain, addr: string) =>
    `${chain.id === "ethereum" ? "https://etherscan.io" : chain.id === "base" ? "https://basescan.org" : "https://arbiscan.io"}/address/${addr}`;

/** Polls until the transaction is mined. Resolves true on success, false when it reverted. */
export const waitForReceipt = async (chain: Chain, hash: string, timeoutMs = 180000): Promise<boolean> => {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
        try {
            const rc = await rpc<{ status: string } | null>(chain.rpcUrl, "eth_getTransactionReceipt", [hash]);
            if (rc) return rc.status === "0x1";
        } catch { /* keep polling */ }
        await new Promise<void>(r => setTimeout(() => r(), 3000));
    }
    throw new Error("Still pending. Check your wallet or the block explorer.");
};
