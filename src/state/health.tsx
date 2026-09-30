import React, { createContext, useCallback, useContext, useMemo, useState } from "react";
import { approvals, Approval, cleanSweepUnlocked, healthScore } from "../data/demoWallet";

type HealthState = {
    approvals: Approval[];
    revoked: ReadonlySet<string>;
    score: number;
    unlockedCleanSweep: boolean;
    revoke: (id: string) => void;
};

const Ctx = createContext<HealthState | null>(null);

/**
 * Health is DEMO data for now (kit's demoWallet): there's no approvals/activity provider wired yet.
 * `revoke` only simulates a signed revoke, as the design prototype does. A real revoke must open the
 * user's wallet to sign; Cubby never signs for them.
 */
export const HealthProvider = ({ children }: { children: React.ReactNode }) => {
    const [revoked, setRevoked] = useState<ReadonlySet<string>>(new Set());
    const revoke = useCallback((id: string) => setRevoked(prev => new Set(prev).add(id)), []);
    const value = useMemo<HealthState>(() => ({
        approvals,
        revoked,
        score: healthScore(revoked),
        unlockedCleanSweep: cleanSweepUnlocked(revoked),
        revoke,
    }), [revoked, revoke]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useHealth = () => {
    const v = useContext(Ctx);
    if (!v) throw new Error("useHealth must be used inside HealthProvider");
    return v;
};
