import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { isFresh, key, peek, readCache, TTL, writeCache } from "../services/cache";
import { loadPortfolio, Portfolio } from "../services/portfolio";

type PortfolioState = {
    address: string;
    label?: string;
    portfolio: Portfolio | null;
    error: string | null;
    /** true while fresh data is loading behind already-visible cached data */
    refreshing: boolean;
    /** Reload balances (e.g. after a swap). */
    refresh: () => void;
};

const Ctx = createContext<PortfolioState | null>(null);

/** Loads the watched wallet once so Home, Assets and Universe share the same data. Shows cached data instantly. */
export const PortfolioProvider = ({ address, label, children }: { address: string; label?: string; children: React.ReactNode }) => {
    const k = key.portfolio(address);
    const [portfolio, setPortfolio] = useState<Portfolio | null>(() => peek<Portfolio>(k)?.value ?? null);
    const [error, setError] = useState<string | null>(null);
    const [refreshing, setRefreshing] = useState(false);
    const [nonce, setNonce] = useState(0);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            const cached = await readCache<Portfolio>(k);
            if (cancelled) return;
            if (cached) setPortfolio(cached.value);
            if (nonce === 0 && isFresh(cached, TTL.portfolio)) return; // recent enough: no network at all
            setRefreshing(true);
            try {
                const p = await loadPortfolio(address);
                if (cancelled) return;
                writeCache(k, p);
                setPortfolio(p);
                setError(null);
            } catch (e: any) {
                if (!cancelled && !cached) setError(e.message); // keep showing cached data if a refresh fails
            } finally {
                if (!cancelled) setRefreshing(false);
            }
        })();
        return () => { cancelled = true; };
    }, [address, nonce, k]);

    const refresh = useCallback(() => setNonce(n => n + 1), []);
    return <Ctx.Provider value={{ address, label, portfolio, error, refreshing, refresh }}>{children}</Ctx.Provider>;
};

export const usePortfolio = () => {
    const v = useContext(Ctx);
    if (!v) throw new Error("usePortfolio must be used inside PortfolioProvider");
    return v;
};
