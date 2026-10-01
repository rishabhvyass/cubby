import { Chain, CHAINS } from "../config/chains";
import { SCAN_SPENDERS, SPENDER_NAMES } from "../config/spenders";
import { KNOWN_TOKENS } from "../config/tokens";
import { ActivityRecord, metaCache, short, tokenMeta } from "./activity";
import { Portfolio } from "./portfolio";
import { rpc } from "./rpc";
import { levelForScore } from "../theme/tokens";

export type Approval = {
    id: string;
    chain: Chain;
    token: string;           // contract
    symbol: string;
    spender: string;
    spenderName: string | null;
    verified: boolean;
    unlimited: boolean;
    approvedTs: number | null;
    risky: boolean;          // unlimited + unrecognised spender
    points: number;          // health points lost
};

export type CheckRow = { id: string; text: string; ok: boolean };

export type Health = {
    score: number;
    level: 1 | 2 | 3 | 4;
    approvals: Approval[];
    checks: CheckRow[];
    since: number | null;    // first transaction on any chain
    totalTx: number;
};

const UNLIMITED = 1n << 200n;

const readAllowance = async (chain: Chain, token: string, owner: string, spender: string): Promise<bigint> => {
    const data = "0xdd62ed3e" + owner.slice(2).toLowerCase().padStart(64, "0") + spender.slice(2).toLowerCase().padStart(64, "0");
    const raw = await rpc<string>(chain.rpcUrl, "eth_call", [{ to: token, data }, "latest"]);
    return raw && raw !== "0x" ? BigInt(raw) : 0n;
};

const penalty = (unlimited: boolean, verified: boolean) => (unlimited ? (verified ? 3 : 12) : verified ? 0 : 4);

export const revokeUrl = (wallet: string, chain: Chain) => `https://revoke.cash/address/${wallet}?chainId=${chain.chainId}`;

/** Real health: current token approvals (verified on-chain), wallet mix and recent failures. */
export const loadHealth = async (
    wallet: string, records: ActivityRecord[], meta: Record<string, { ok: boolean; totalItems: number; firstTs: number | null }>, portfolio: Portfolio | null,
): Promise<Health> => {
    // candidate (chain, token, spender) pairs: our own approve() calls + known spenders on known tokens
    const pairs = new Map<string, { chain: Chain; token: string; spender: string; ts: number | null }>();
    const add = (chain: Chain, token: string, spender: string, ts: number | null) => {
        const key = `${chain.id}:${token}:${spender}`;
        const cur = pairs.get(key);
        if (!cur || (ts != null && (cur.ts == null || ts > cur.ts))) pairs.set(key, { chain, token, spender, ts });
    };
    for (const r of records) {
        if (r.approval && !r.approval.revoke) add(CHAINS.find(c => c.id === r.chain)!, r.approval.token, r.approval.spender, r.ts);
    }
    for (const chain of CHAINS) {
        for (const t of KNOWN_TOKENS[chain.id]) for (const sp of SCAN_SPENDERS[chain.id]) add(chain, t.address.toLowerCase(), sp, null);
    }

    const checked = await Promise.all([...pairs.values()].map(async p => {
        try {
            const allowance = await readAllowance(p.chain, p.token, wallet, p.spender);
            return allowance > 0n ? { ...p, allowance } : null;
        } catch {
            return null;
        }
    }));
    const live = checked.filter((x): x is NonNullable<typeof x> => !!x);
    await Promise.all(live.map(p => tokenMeta(p.chain, p.token)));

    const approvals: Approval[] = live.map(p => {
        const name = SPENDER_NAMES[p.spender] ?? null;
        const verified = name != null;
        const unlimited = p.allowance >= UNLIMITED;
        return {
            id: `${p.chain.id}:${p.token}:${p.spender}`,
            chain: p.chain, token: p.token,
            symbol: metaCache.get(`${p.chain.id}:${p.token}`)?.symbol ?? short(p.token),
            spender: p.spender, spenderName: name, verified, unlimited, approvedTs: p.ts,
            risky: unlimited && !verified, points: penalty(unlimited, verified),
        };
    }).sort((a, b) => Number(b.risky) - Number(a.risky) || b.points - a.points);

    const score = Math.max(0, 100 - approvals.reduce((s, a) => s + a.points, 0));

    // checkup rows, all derived from real data
    const checks: CheckRow[] = [];
    const unlimitedCount = approvals.filter(a => a.unlimited).length;
    checks.push({
        id: "approvals",
        ok: unlimitedCount === 0,
        text: unlimitedCount === 0 ? "No unlimited approvals left" : `${unlimitedCount} unlimited approval${unlimitedCount > 1 ? "s" : ""} to review`,
    });
    if (portfolio && portfolio.total > 0) {
        const withValue = portfolio.byChain.filter(c => c.value > 0).length;
        const bySymbol = new Map<string, number>();
        portfolio.holdings.forEach(h => bySymbol.set(h.symbol, (bySymbol.get(h.symbol) ?? 0) + h.value));
        const [topSym, topVal] = [...bySymbol.entries()].sort((a, b) => b[1] - a[1])[0];
        const share = topVal / portfolio.total;
        checks.push(share < 0.7
            ? { id: "mix", ok: true, text: `Healthy mix across ${withValue} chain${withValue === 1 ? "" : "s"}` }
            : { id: "mix", ok: false, text: `${topSym} is ${(share * 100).toFixed(0)}% of your wallet` });
    }
    const weekAgo = Date.now() - 30 * 86400000;
    const failed = records.filter(r => r.status === "failed" && r.ts >= weekAgo).length;
    checks.push({ id: "failed", ok: failed === 0, text: failed === 0 ? "No failed transactions lately" : `${failed} failed transaction${failed > 1 ? "s" : ""} lately` });

    const firsts = Object.values(meta).map(m => m.firstTs).filter((t): t is number => t != null);
    return {
        score, level: levelForScore(score), approvals, checks,
        since: firsts.length ? Math.min(...firsts) : null,
        totalTx: Object.values(meta).reduce((s, m) => s + m.totalItems, 0),
    };
};
