import { CHAINS } from "../config/chains";
import { ActivityRecord } from "./activity";
import { Health } from "./health";
import { usd } from "./format";

export type RecapCard =
    | { kind: "count"; lead: string; big: string; tail: string; mostUsed: string; feesPaid: string }
    | { kind: "busiest"; title: string; day: string; date: string; body: string; axis: [string, string, string] }
    | { kind: "best"; title: string; headline: string; body: string };

export type Recap = { label: string; cards: RecapCard[] };

const WINDOW_DAYS = 30;
const dayKey = (ts: number) => new Date(ts).toDateString();
const short = (ts: number) => new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
const PLURAL: Record<string, string> = { swap: "swaps", send: "transfers", receive: "transfers", mint: "mints", stake: "stakes", approve: "approvals", contract: "contract calls" };

const top = <T,>(items: T[], key: (t: T) => string | null) => {
    const counts = new Map<string, number>();
    items.forEach(i => { const k = key(i); if (k) counts.set(k, (counts.get(k) ?? 0) + 1); });
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0] ?? null;
};

/** Built only from the wallet's real recent transactions. Returns null when there's nothing to show. */
export const buildRecap = (records: ActivityRecord[], health: Health | null): Recap | null => {
    const since = Date.now() - WINDOW_DAYS * 86400000;
    const rs = records.filter(r => r.ts >= since);
    if (!rs.length) return null;

    const chains = new Set(rs.map(r => r.chain)).size;
    const fees = rs.reduce((s, r) => s + (r.feeUsd ?? 0), 0);
    const protocol = top(rs, r => r.protocol);
    const category = top(rs, r => r.category);
    const first = Math.min(...rs.map(r => r.ts));
    const last = Math.max(...rs.map(r => r.ts));

    const byDay = new Map<string, ActivityRecord[]>();
    rs.forEach(r => byDay.set(dayKey(r.ts), [...(byDay.get(dayKey(r.ts)) ?? []), r]));
    const [busyKey, busyRecords] = [...byDay.entries()].sort((a, b) => b[1].length - a[1].length)[0];
    const busyDate = new Date(busyKey);
    const kind = top(busyRecords, r => PLURAL[r.kind]);
    const where = top(busyRecords, r => CHAINS.find(c => c.id === r.chain)?.name ?? null);

    const revokes = rs.filter(r => r.approval?.revoke).length;
    const risky = health?.approvals.find(a => a.risky);
    const best: RecapCard = revokes > 0
        ? { kind: "best", title: "Best move of the month", headline: "Cubby got stronger.", body: `You revoked ${revokes} old approval${revokes > 1 ? "s" : ""}. That's the kind of thing we like to celebrate.` }
        : risky
            ? { kind: "best", title: "One thing to look at", headline: "A risky approval.", body: `An unrecognised contract still has unlimited access to your ${risky.symbol}. You can revoke it from Health.` }
            : { kind: "best", title: "Best move of the month", headline: "Nothing risky.", body: "No unrecognised app has unlimited access to your tokens. Quiet is good." };

    return {
        label: "Last 30 days",
        cards: [
            {
                kind: "count", lead: "You made", big: String(rs.length),
                tail: `transaction${rs.length === 1 ? "" : "s"} across ${chains} chain${chains === 1 ? "" : "s"}.`,
                mostUsed: protocol?.[0] ?? category?.[0] ?? "—", feesPaid: usd(fees, 2),
            },
            {
                kind: "busiest", title: "Busiest day",
                day: busyDate.toLocaleDateString("en-US", { weekday: "long" }) + ",",
                date: busyDate.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
                body: `${busyRecords.length} transaction${busyRecords.length === 1 ? "" : "s"}.${kind ? ` Mostly ${kind[0]}` : ""}${where ? ` on ${where[0]}.` : ""}`,
                axis: [short(first), short(busyDate.getTime()), short(last)],
            },
            best,
        ],
    };
};
