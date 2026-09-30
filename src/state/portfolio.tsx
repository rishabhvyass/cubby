import React, { createContext, useContext, useEffect, useState } from "react";
import { loadPortfolio, Portfolio } from "../services/portfolio";

type PortfolioState = {
    address: string;
    label?: string;
    portfolio: Portfolio | null;
    error: string | null;
};

const Ctx = createContext<PortfolioState | null>(null);

/** Loads the watched wallet once so Home, Assets and Universe share the same data. */
export const PortfolioProvider = ({ address, label, children }: { address: string; label?: string; children: React.ReactNode }) => {
    const [portfolio, setPortfolio] = useState<Portfolio | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        loadPortfolio(address)
            .then(p => !cancelled && setPortfolio(p))
            .catch(e => !cancelled && setError(e.message));
        return () => { cancelled = true; };
    }, [address]);

    return <Ctx.Provider value={{ address, label, portfolio, error }}>{children}</Ctx.Provider>;
};

export const usePortfolio = () => {
    const v = useContext(Ctx);
    if (!v) throw new Error("usePortfolio must be used inside PortfolioProvider");
    return v;
};
