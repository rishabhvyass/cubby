import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { isFresh, key, peek, readCache, TTL, writeCache } from "../services/cache";
import { ActivityRecord, ActivityResult, dayLabel, loadActivity, timeLabel } from "../services/activity";

type ActivityState = {
    /** Indexed history merged with transactions made from Cubby (shown instantly, before any indexer catches up). */
    data: ActivityResult | null;
    /** true once this data was loaded (or recently re-validated) from the network, not just the cache */
    fresh: boolean;
    /** Adds a transaction made in-app (e.g. a swap) so it appears in Activity immediately. */
    addLocal: (r: ActivityRecord) => void;
    updateLocal: (hash: string, patch: Partial<ActivityRecord>) => void;
    /** Reload history from the network, ignoring the cache. */
    refresh: () => void;
};
const Ctx = createContext<ActivityState>({ data: null, fresh: false, addLocal: () => {}, updateLocal: () => {}, refresh: () => {} });

/** Loads the wallet's activity once so Activity, Health, Recap and Stickers all read the same records. Cached. */
export const ActivityProvider = ({ address, children }: { address: string; children: React.ReactNode }) => {
    const k = key.activity(address);
    const lk = key.local(address);
    const [loaded, setLoaded] = useState<ActivityResult | null>(() => peek<ActivityResult>(k)?.value ?? null);
    const [locals, setLocals] = useState<ActivityRecord[]>(() => peek<ActivityRecord[]>(lk)?.value ?? []);
    const [fresh, setFresh] = useState(() => isFresh(peek(k), TTL.activity));
    const [nonce, setNonce] = useState(0);
    const first = useRef(true);

    useEffect(() => { readCache<ActivityRecord[]>(lk).then(c => { if (c) setLocals(c.value); }); }, [lk]);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const cached = await readCache<ActivityResult>(k);
            if (cancelled) return;
            if (cached) { setLoaded(cached.value); setFresh(isFresh(cached, TTL.activity)); }
            const forced = !first.current || nonce > 0;
            first.current = false;
            if (!forced && isFresh(cached, TTL.activity)) return;
            try {
                const r = await loadActivity(address);
                if (cancelled) return;
                // never replace good cached data with an all-failed result
                if (r.items.length || !cached) { writeCache(k, r); setLoaded(r); }
                setFresh(true);
            } catch (e: any) {
                if (!cancelled && !cached) setLoaded({ items: [], errors: [String(e?.message ?? e)], meta: {} });
            }
        })();
        return () => { cancelled = true; };
    }, [address, k, nonce]);

    const addLocal = useCallback((r: ActivityRecord) => {
        setLocals(prev => { const next = [r, ...prev.filter(x => x.hash !== r.hash)].slice(0, 40); writeCache(lk, next); return next; });
    }, [lk]);
    const updateLocal = useCallback((hash: string, patch: Partial<ActivityRecord>) => {
        setLocals(prev => { const next = prev.map(x => (x.hash === hash ? { ...x, ...patch } : x)); writeCache(lk, next); return next; });
    }, [lk]);
    const refresh = useCallback(() => setNonce(n => n + 1), []);

    // Merge: the indexer's record wins once it has the same transaction; local ones fill the gap until then.
    const data = useMemo<ActivityResult | null>(() => {
        if (!loaded && !locals.length) return null;
        const base = loaded ?? { items: [], errors: [], meta: {} };
        const known = new Set(base.items.map(i => i.hash));
        const now = new Date();
        const mine = locals.filter(l => !known.has(l.hash)).map(l => ({ ...l, day: dayLabel(new Date(l.ts), now), time: timeLabel(new Date(l.ts), now) }));
        return { ...base, items: [...mine, ...base.items].sort((a, b) => b.ts - a.ts) };
    }, [loaded, locals]);

    return <Ctx.Provider value={{ data, fresh, addLocal, updateLocal, refresh }}>{children}</Ctx.Provider>;
};

export const useActivity = () => useContext(Ctx);
