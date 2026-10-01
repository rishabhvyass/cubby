import { Chain, CHAINS } from "../config/chains";
import { KNOWN_TOKENS } from "../config/tokens";
import { fmtAmount, usd } from "./format";
import { ALL_KNOWN, getKnownQuotes, getTokenPrices } from "./prices";
import { rpc } from "./rpc";

export type ActivityCategory = "Swaps" | "Transfers" | "NFTs" | "DeFi";
export type ActivityKind = "swap" | "send" | "receive" | "mint" | "stake" | "approve" | "contract";
export type ActivityItem = {
    day: string;
    category: ActivityCategory;
    kind: ActivityKind;
    title: string;
    meta: string;
    amount: string;
    amountTone: "ink" | "positive" | "secondary";
    time: string;
    tile: string;
    status?: "pending" | "failed";
};
/** An activity row plus the facts other screens (Recap, Health, Stickers) derive from. */
export type ActivityRecord = ActivityItem & {
    hash: string;
    chain: Chain["id"];
    ts: number;
    protocol: string | null;
    feeUsd: number | null;
    usd: number | null;
    /** set when this transaction was an ERC-20 approve() call from the wallet */
    approval?: { token: string; spender: string; unlimited: boolean; revoke: boolean };
};
export type ChainMeta = { ok: boolean; totalItems: number; firstTs: number | null };
export type ActivityResult = { items: ActivityRecord[]; errors: string[]; meta: Record<string, ChainMeta> };

export const activityFilters = ["All", "Swaps", "Transfers", "NFTs", "DeFi"] as const;

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO = "0x0000000000000000000000000000000000000000";
const PER_CHAIN = 100;   // list size per chain (add-on max per page)
const ENRICH_MAX = 30;   // newest candidates we read receipts for

const APPROVE = "0x095ea7b3";
const LIDO = "0xae7ab96520de3a18e5e111b5eaab095312d7fe84";

// Router → protocol label. Lowercase.
const PROTOCOLS: Record<string, string> = {
    "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad": "Uniswap",
    "0x66a9893cc07d91d95644aedd05d03f95e1dba8af": "Uniswap",
    "0xe592427a0aece92de3edee1f18e0157c05861564": "Uniswap",
    "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": "Uniswap",
    "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": "Uniswap",
    "0x6ff5693b99212da76ad316178a184ab56d299b43": "Uniswap",
    "0xa51afafe0263b40edaef0df8781ea9aa03e381a3": "Uniswap",
    "0x1111111254eeb25477b68fb85ed929f73a960582": "1inch",
    "0x111111125421ca6dc452d289314280a0f8842a65": "1inch",
    "0xdef1c0ded9bec7f1a1670819833240f027b25eff": "0x",
    "0xae7ab96520de3a18e5e111b5eaab095312d7fe84": "Lido",
};

type RawTx = { hash: string; from: string; to: string | null; value: string; blockTimestamp: string; status?: string };
type Tx = { hash: string; from: string; to: string | null; input: string; value: string };
type Log = { address: string; topics: string[]; data: string };
type Receipt = { status: string; gasUsed: string; effectiveGasPrice?: string; logs: Log[] };


const addr = (topic: string) => "0x" + topic.slice(-40).toLowerCase();
export const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-3)}`;
const num = (hex: string, decimals: number) => Number(BigInt(hex)) / 10 ** decimals;

const call = (chain: Chain, to: string, data: string) => rpc<string>(chain.rpcUrl, "eth_call", [{ to, data }, "latest"]);

const decodeString = (hex: string): string => {
    if (!hex || hex === "0x") return "";
    try {
        const b = hex.slice(2);
        if (b.length === 64) return (b.match(/../g) ?? []).map(h => String.fromCharCode(parseInt(h, 16))).join("").replace(/\0/g, ""); // bytes32 symbols
        const len = parseInt(b.slice(64, 128), 16);
        const bytes = b.slice(128, 128 + len * 2);
        return decodeURIComponent(bytes.replace(/../g, "%$&"));
    } catch {
        return "";
    }
};

export const metaCache = new Map<string, { symbol: string; decimals: number }>();
export const tokenMeta = async (chain: Chain, address: string) => {
    const key = `${chain.id}:${address}`;
    const hit = metaCache.get(key);
    if (hit) return hit;
    const known = KNOWN_TOKENS[chain.id].find(t => t.address.toLowerCase() === address);
    let meta = known ? { symbol: known.symbol, decimals: known.decimals } : null;
    if (!meta) {
        try {
            const [sym, dec] = await Promise.all([call(chain, address, "0x95d89b41"), call(chain, address, "0x313ce567")]);
            meta = { symbol: decodeString(sym) || short(address), decimals: Number(BigInt(dec)) };
        } catch {
            meta = { symbol: short(address), decimals: 18 };
        }
    }
    metaCache.set(key, meta);
    return meta;
};

/** Newest transactions for the wallet from the QuickNode Token & NFT API v2 add-on (response shape verified on Ethereum). */
const listTransactions = async (chain: Chain, wallet: string) => {
    const res = await rpc<{ paginatedItems: any[]; totalItems: number }>(chain.rpcUrl, "qn_getTransactionsByAddress", [{ address: wallet, page: 1, perPage: PER_CHAIN }]);
    const items: RawTx[] = (res.paginatedItems ?? []).map(t => ({
        hash: t.transactionHash, from: t.fromAddress?.toLowerCase(), to: t.toAddress?.toLowerCase() ?? null,
        value: t.value ?? "0", blockTimestamp: t.blockTimestamp, status: t.status,
    }));
    return { items, totalItems: res.totalItems ?? items.length };
};

/** Date of the wallet's very first transaction on a chain (the add-on pages newest-first, up to 100k items). */
const firstTimestamp = async (chain: Chain, wallet: string, totalItems: number): Promise<number | null> => {
    if (!totalItems || totalItems > 100000) return null;
    try {
        const res = await rpc<{ paginatedItems: any[] }>(chain.rpcUrl, "qn_getTransactionsByAddress", [{ address: wallet, page: totalItems, perPage: 1 }]);
        const t = res.paginatedItems?.[0]?.blockTimestamp;
        return t ? new Date(t).getTime() : null;
    } catch {
        return null;
    }
};

export const dayLabel = (d: Date, now: Date) => {
    const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((startOf(now) - startOf(d)) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
export const timeLabel = (d: Date, now: Date) => {
    const mins = Math.round((now.getTime() - d.getTime()) / 60000);
    if (dayLabel(d, now) === "Today") {
        if (mins < 1) return "now";
        if (mins < 60) return `${mins}m ago`;
        return `${Math.floor(mins / 60)}h ago`;
    }
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
};

const TILE = { swap: "#8FC4FF", receive: "#B8FF4A", mint: "#FF9A9A", stake: "#E8E4FF", neutral: "#EDEDE6" } as const;

type Classified = {
    kind: ActivityKind; category: ActivityCategory; title: string; meta: string;
    usd: number | null; sign: "+" | "-" | ""; tile: string;
    protocol?: string | null; approval?: ActivityRecord["approval"];
};

/** Turns one transaction + receipt into an activity row. Pure apart from the price lookups passed in. */
export const classify = (
    chain: Chain, wallet: string, tx: Tx, rc: Receipt,
    meta: (a: string) => { symbol: string; decimals: number },
    price: (a: string | null) => number | null,
): Classified | null => {
    const w = wallet.toLowerCase();
    const outgoing = tx.from === w;
    const ethValue = num(tx.value || "0x0", 18);
    const to = tx.to ?? "";
    const protocol = PROTOCOLS[to];
    const failed = rc.status === "0x0";

    const erc20 = rc.logs.filter(l => l.topics[0] === TRANSFER_TOPIC && l.topics.length === 3);
    const nft = rc.logs.filter(l => l.topics[0] === TRANSFER_TOPIC && l.topics.length === 4);
    const tokIn = erc20.filter(l => addr(l.topics[2]) === w).map(l => ({ token: l.address.toLowerCase(), from: addr(l.topics[1]), amount: num(l.data, meta(l.address.toLowerCase()).decimals) }));
    const tokOut = erc20.filter(l => addr(l.topics[1]) === w).map(l => ({ token: l.address.toLowerCase(), to: addr(l.topics[2]), amount: num(l.data, meta(l.address.toLowerCase()).decimals) }));
    const worth = (token: string | null, amount: number) => { const p = price(token); return p == null ? null : p * amount; };
    const fmt = (token: string | null, amount: number) => `${fmtAmount(amount)} ${token ? meta(token).symbol : "ETH"}`;

    if (failed) {
        return { kind: "swap", category: "Swaps", title: protocol ? "Swap" : "Transaction", meta: "Didn't go through. Your funds are safe.", usd: null, sign: "", tile: TILE.neutral };
    }

    const nftIn = nft.find(l => addr(l.topics[2]) === w);
    if (outgoing && nftIn && addr(nftIn.topics[1]) === ZERO) {
        return { kind: "mint", category: "NFTs", title: "Minted", meta: `${short(nftIn.address)} #${BigInt(nftIn.topics[3]).toString()} · ${chain.name}`, usd: null, sign: "", tile: TILE.mint };
    }

    if (outgoing) {
        if (tx.input.startsWith(APPROVE) && !tokIn.length && !tokOut.length) {
            const spender = "0x" + tx.input.slice(34, 74);
            const amountHex = "0x" + tx.input.slice(74, 138);
            const zero = /^0x0*$/.test(amountHex);
            const unlimited = !zero && BigInt(amountHex) >= (1n << 200n);
            return {
                kind: "approve", category: "Transfers", title: zero ? "Revoked" : "Approved",
                meta: `${zero ? "Removed spending access for" : "Spending access for"} ${PROTOCOLS[spender] ?? short(spender)} · ${chain.name}`,
                usd: null, sign: "", tile: TILE.neutral, protocol: PROTOCOLS[spender] ?? null,
                approval: { token: to, spender, unlimited, revoke: zero },
            };
        }
        if (to === LIDO && ethValue > 0) {
            const got = tokIn[0];
            return { kind: "stake", category: "DeFi", title: "Staked", meta: `${fmt(null, ethValue)} → ${got ? meta(got.token).symbol : "stETH"} · Lido`, usd: worth(null, ethValue), sign: "", tile: TILE.stake, protocol: "Lido" };
        }
        if (tokIn.length && (tokOut.length || ethValue > 0)) {
            const out = tokOut[0] ? { token: tokOut[0].token as string | null, amount: tokOut[0].amount } : { token: null, amount: ethValue };
            const got = tokIn[0];
            return { kind: "swap", category: "Swaps", title: "Swapped", meta: `${fmt(out.token, out.amount)} → ${fmt(got.token, got.amount)} · ${protocol ?? chain.name}`, usd: worth(got.token, got.amount) ?? worth(out.token, out.amount), sign: "", tile: TILE.swap, protocol: protocol ?? null };
        }
        if (tokOut.length && !tokIn.length) {
            const o = tokOut[0];
            return { kind: "send", category: "Transfers", title: "Sent", meta: `${fmt(o.token, o.amount)} to ${short(o.to)} · ${chain.name}`, usd: worth(o.token, o.amount), sign: "-", tile: TILE.neutral };
        }
        if (ethValue > 0 && !erc20.length) {
            return { kind: "send", category: "Transfers", title: "Sent", meta: `${fmt(null, ethValue)} to ${short(to)} · ${chain.name}`, usd: worth(null, ethValue), sign: "-", tile: TILE.neutral };
        }
        return { kind: "contract", category: "Transfers", title: "Contract call", meta: `${protocol ?? short(to)} · ${chain.name}`, usd: null, sign: "", tile: TILE.neutral };
    }

    // Someone else's transaction that paid us.
    if (tokIn.length && (worth(tokIn[0].token, tokIn[0].amount) ?? 1) >= 0.01) {
        const g = tokIn[0];
        return { kind: "receive", category: "Transfers", title: "Received", meta: `${fmt(g.token, g.amount)} from ${short(g.from)}`, usd: worth(g.token, g.amount), sign: "+", tile: TILE.receive };
    }
    if (tx.to === w && ethValue > 0 && (worth(null, ethValue) ?? 1) >= 0.01) { // ignore dust
        return { kind: "receive", category: "Transfers", title: "Received", meta: `${fmt(null, ethValue)} from ${short(tx.from)}`, usd: worth(null, ethValue), sign: "+", tile: TILE.receive };
    }
    return null;
};

const loadChain = async (chain: Chain, wallet: string, eth: number, quotes: Record<string, { price: number }>): Promise<{ records: ActivityRecord[]; meta: ChainMeta }> => {
    const w = wallet.toLowerCase();
    const { items: listed, totalItems } = await listTransactions(chain, wallet);
    const [firstTs] = await Promise.all([firstTimestamp(chain, wallet, totalItems)]);

    // Skip unsolicited zero-value incoming transactions (airdrop spam): they carry nothing to classify.
    const raw = listed.filter(r => r.from === w || (r.value && BigInt(r.value) > 0n)).slice(0, ENRICH_MAX);
    const detailed = await Promise.all(raw.map(async r => {
        const [tx, rc] = await Promise.all([
            rpc<any>(chain.rpcUrl, "eth_getTransactionByHash", [r.hash]),
            rpc<Receipt>(chain.rpcUrl, "eth_getTransactionReceipt", [r.hash]),
        ]);
        return tx && rc ? { raw: r, tx: { hash: r.hash, from: tx.from.toLowerCase(), to: tx.to?.toLowerCase() ?? null, input: tx.input ?? "0x", value: tx.value ?? "0x0" } as Tx, rc } : null;
    }));
    const ok = detailed.filter((d): d is NonNullable<typeof d> => !!d);

    const tokens = new Set<string>();
    ok.forEach(d => d.rc.logs.forEach(l => { if (l.topics[0] === TRANSFER_TOPIC && l.topics.length === 3) tokens.add(l.address.toLowerCase()); }));
    await Promise.all([...tokens].map(t => tokenMeta(chain, t)));
    const knownByAddr = new Map(KNOWN_TOKENS[chain.id].map(t => [t.address.toLowerCase(), t.cgId]));
    const prices: Record<string, { price: number }> = {};
    const unfamiliar: string[] = [];
    tokens.forEach(t => { const id = knownByAddr.get(t); if (id && quotes[id]) prices[t] = quotes[id]; else unfamiliar.push(t); });
    if (unfamiliar.length) Object.assign(prices, await getTokenPrices(chain.cgPlatform, unfamiliar).catch(() => ({})));

    const meta = (a: string) => metaCache.get(`${chain.id}:${a}`) ?? { symbol: short(a), decimals: 18 };
    const price = (a: string | null) => (a ? prices[a]?.price ?? null : eth);
    const now = new Date();

    const records = ok.flatMap(({ raw: r, tx, rc }) => {
        const c = classify(chain, wallet, tx, rc, meta, price);
        if (!c) return [];
        const d = new Date(r.blockTimestamp);
        const fee = rc.effectiveGasPrice ? (Number(BigInt(rc.gasUsed)) * Number(BigInt(rc.effectiveGasPrice))) / 1e18 * eth : null;
        const amount = c.usd != null
            ? `${c.sign === "-" ? "−" : c.sign}${usd(c.usd)}`
            : fee != null ? `${usd(fee, 2)} fee` : "—";
        const rec: ActivityRecord = {
            day: dayLabel(d, now), category: c.category, kind: c.kind, title: c.title, meta: c.meta, amount,
            amountTone: c.sign === "+" ? "positive" : c.usd != null ? "ink" : "secondary",
            time: timeLabel(d, now), tile: c.tile, ts: d.getTime(),
            hash: r.hash, chain: chain.id, protocol: c.protocol ?? null, feeUsd: fee, usd: c.usd,
            ...(c.approval ? { approval: c.approval } : {}),
            ...(rc.status === "0x0" ? { status: "failed" as const } : {}),
        };
        return [rec];
    });
    return { records, meta: { ok: true, totalItems, firstTs } };
};

export const loadActivity = async (wallet: string): Promise<ActivityResult> => {
    const quotes = await getKnownQuotes(ALL_KNOWN);
    const eth = quotes.ethereum.price;
    const settled = await Promise.allSettled(CHAINS.map(c => loadChain(c, wallet, eth, quotes)));
    const errors = settled.flatMap((r, i) => (r.status === "rejected" ? [`${CHAINS[i].name}: ${r.reason?.message ?? r.reason}`] : []));
    const meta: Record<string, ChainMeta> = {};
    settled.forEach((r, i) => { meta[CHAINS[i].id] = r.status === "fulfilled" ? r.value.meta : { ok: false, totalItems: 0, firstTs: null }; });
    const items = settled
        .flatMap(r => (r.status === "fulfilled" ? r.value.records : []))
        .sort((a, b) => b.ts - a.ts);
    return { items, errors, meta };
};
