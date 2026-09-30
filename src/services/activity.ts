import { Chain, CHAINS } from "../config/chains";
import { KNOWN_TOKENS } from "../config/tokens";
import { ActivityCategory, ActivityItem, ActivityKind } from "../data/demoWallet";
import { fmtAmount, usd } from "./format";
import { getEthPrice, getTokenPrices } from "./prices";
import { rpc } from "./rpc";

const TRANSFER_TOPIC = "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const ZERO = "0x0000000000000000000000000000000000000000";
const PER_CHAIN = 20;
const MAX_ITEMS = 40;

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

export type ActivityResult = { items: ActivityItem[]; errors: string[] };

const addr = (topic: string) => "0x" + topic.slice(-40).toLowerCase();
const short = (a: string) => `${a.slice(0, 4)}…${a.slice(-3)}`;
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

const metaCache = new Map<string, { symbol: string; decimals: number }>();
const tokenMeta = async (chain: Chain, address: string) => {
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

/** Newest transactions for the wallet from the QuickNode Token & NFT API v2 add-on. */
const listTransactions = async (chain: Chain, wallet: string): Promise<RawTx[]> => {
    const res = await rpc<{ paginatedItems: any[] }>(chain.rpcUrl, "qn_getTransactionsByAddress", [{ address: wallet, page: 1, perPage: PER_CHAIN }]);
    return (res.paginatedItems ?? []).map(t => ({
        hash: t.transactionHash, from: t.fromAddress?.toLowerCase(), to: t.toAddress?.toLowerCase() ?? null,
        value: t.value ?? "0", blockTimestamp: t.blockTimestamp, status: t.status,
    }));
};

const dayLabel = (d: Date, now: Date) => {
    const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((startOf(now) - startOf(d)) / 86400000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
};
const timeLabel = (d: Date, now: Date) => {
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
            return { kind: "approve", category: "Transfers", title: "Approved", meta: `Spending access for ${PROTOCOLS[spender] ?? short(spender)} · ${chain.name}`, usd: null, sign: "", tile: TILE.neutral };
        }
        if (to === LIDO && ethValue > 0) {
            const got = tokIn[0];
            return { kind: "stake", category: "DeFi", title: "Staked", meta: `${fmt(null, ethValue)} → ${got ? meta(got.token).symbol : "stETH"} · Lido`, usd: worth(null, ethValue), sign: "", tile: TILE.stake };
        }
        if (tokIn.length && (tokOut.length || ethValue > 0)) {
            const out = tokOut[0] ? { token: tokOut[0].token as string | null, amount: tokOut[0].amount } : { token: null, amount: ethValue };
            const got = tokIn[0];
            return { kind: "swap", category: "Swaps", title: "Swapped", meta: `${fmt(out.token, out.amount)} → ${fmt(got.token, got.amount)} · ${protocol ?? chain.name}`, usd: worth(got.token, got.amount) ?? worth(out.token, out.amount), sign: "", tile: TILE.swap };
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
    if (tokIn.length) {
        const g = tokIn[0];
        return { kind: "receive", category: "Transfers", title: "Received", meta: `${fmt(g.token, g.amount)} from ${short(g.from)}`, usd: worth(g.token, g.amount), sign: "+", tile: TILE.receive };
    }
    if (tx.to === w && ethValue > 0) {
        return { kind: "receive", category: "Transfers", title: "Received", meta: `${fmt(null, ethValue)} from ${short(tx.from)}`, usd: worth(null, ethValue), sign: "+", tile: TILE.receive };
    }
    return null;
};

const loadChain = async (chain: Chain, wallet: string, eth: number) => {
    const raw = await listTransactions(chain, wallet);
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
    const prices = await getTokenPrices(chain.cgPlatform, [...tokens]).catch(() => ({} as Record<string, { price: number }>));

    const meta = (a: string) => metaCache.get(`${chain.id}:${a}`) ?? { symbol: short(a), decimals: 18 };
    const price = (a: string | null) => (a ? prices[a]?.price ?? null : eth);
    const now = new Date();

    return ok.flatMap(({ raw: r, tx, rc }) => {
        const c = classify(chain, wallet, tx, rc, meta, price);
        if (!c) return [];
        const d = new Date(r.blockTimestamp);
        const fee = rc.effectiveGasPrice ? (Number(BigInt(rc.gasUsed)) * Number(BigInt(rc.effectiveGasPrice))) / 1e18 * eth : null;
        const amount = c.usd != null
            ? `${c.sign === "-" ? "−" : c.sign}${usd(c.usd)}`
            : fee != null ? `${usd(fee, 2)} fee` : "—";
        const item: ActivityItem & { ts: number } = {
            day: dayLabel(d, now), category: c.category, kind: c.kind, title: c.title, meta: c.meta, amount,
            amountTone: c.sign === "+" ? "positive" : c.usd != null ? "ink" : "secondary",
            time: timeLabel(d, now), tile: c.tile, ts: d.getTime(),
            ...(rc.status === "0x0" ? { status: "failed" as const } : {}),
        };
        return [item];
    });
};

export const loadActivity = async (wallet: string): Promise<ActivityResult> => {
    const eth = (await getEthPrice()).price;
    const settled = await Promise.allSettled(CHAINS.map(c => loadChain(c, wallet, eth)));
    const errors = settled.flatMap((r, i) => (r.status === "rejected" ? [`${CHAINS[i].name}: ${r.reason?.message ?? r.reason}`] : []));
    const items = settled
        .flatMap(r => (r.status === "fulfilled" ? r.value : []))
        .sort((a, b) => (b as any).ts - (a as any).ts)
        .slice(0, MAX_ITEMS);
    return { items, errors };
};
