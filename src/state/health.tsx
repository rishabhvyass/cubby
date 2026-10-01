import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Health, loadHealth } from "../services/health";
import { computeStickers, Sticker } from "../services/stickers";
import { buildRecap, Recap } from "../services/recap";
import { isFresh, key, peek, readCache, TTL, writeCache } from "../services/cache";
import { useActivity } from "./activity";
import { usePortfolio } from "./portfolio";

type HealthState = { health: Health | null; loading: boolean; stickers: Sticker[]; recap: Recap | null };
const Ctx = createContext<HealthState>({ health: null, loading: true, stickers: [], recap: null });

/** Real health, stickers and recap, derived from the portfolio and activity already loaded. */
export const HealthProvider = ({ children }: { children: React.ReactNode }) => {
    const { address, portfolio } = usePortfolio();
    const { data, fresh } = useActivity();
    const k = key.health(address);
    const [health, setHealth] = useState<Health | null>(() => peek<Health>(k)?.value ?? null);
    const [loading, setLoading] = useState(() => !peek(k));

    const portfolioRef = useRef(portfolio);
    portfolioRef.current = portfolio;
    const hasPortfolio = !!portfolio;

    // 1) show the last known health right away (memory or disk)
    useEffect(() => {
        let cancelled = false;
        readCache<Health>(k).then(c => { if (!cancelled && c) { setHealth(h => h ?? c.value); setLoading(false); } });
        return () => { cancelled = true; };
    }, [k]);

    // 2) recompute only from FRESH activity, and only when the cached result is stale (~150 allowance calls)
    useEffect(() => {
        if (!data || !fresh || !hasPortfolio) return;
        let cancelled = false;
        (async () => {
            const cached = await readCache<Health>(k);
            if (cancelled || isFresh(cached, TTL.health)) { if (!cancelled) setLoading(false); return; }
            try {
                const h = await loadHealth(address, data.items, data.meta, portfolioRef.current);
                if (cancelled) return;
                writeCache(k, h);
                setHealth(h);
            } catch (e) {
                console.warn("[health]", e);
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, [address, data, fresh, hasPortfolio, k]);

    const stickers = useMemo(() => computeStickers(portfolio, data?.items ?? [], health), [portfolio, data, health]);
    const recap = useMemo(() => (data ? buildRecap(data.items, health) : null), [data, health]);
    return <Ctx.Provider value={{ health, loading, stickers, recap }}>{children}</Ctx.Provider>;
};

export const useHealth = () => useContext(Ctx);
