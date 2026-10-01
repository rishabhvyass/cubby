import AsyncStorage from "@react-native-async-storage/async-storage";
import { clearAccountCache } from "../services/cache";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";

export type Account = {
    id: string;                      // lowercase address
    address: string;
    label?: string;                  // ENS name the user typed, or a custom name
    kind: "watch" | "wallet";        // watch = view-only; wallet = connected through a wallet app
    connector?: string;              // e.g. "metamask" when kind === "wallet"
    addedAt: number;
};

type AccountsState = {
    ready: boolean;
    accounts: Account[];
    active: Account | null;
    /** Adds (or updates) an account and makes it the active one. */
    addAccount: (a: Omit<Account, "id" | "addedAt">) => Account;
    /** Marks an existing account as connected through a wallet app, without switching to it. */
    linkWallet: (address: string, connector?: string) => void;
    switchTo: (id: string) => void;
    removeAccount: (id: string) => void;
    rename: (id: string, label: string) => void;
};

const KEY = "cubby.accounts.v1";
type Saved = { accounts: Account[]; activeId: string | null };

const Ctx = createContext<AccountsState | null>(null);

/** Saved accounts survive app restarts. If storage is unavailable we keep running in memory. */
export const AccountsProvider = ({ children }: { children: React.ReactNode }) => {
    const [ready, setReady] = useState(false);
    const [accounts, setAccounts] = useState<Account[]>([]);
    const [activeId, setActiveId] = useState<string | null>(null);
    const loaded = useRef(false);

    useEffect(() => {
        (async () => {
            try {
                const raw = await AsyncStorage.getItem(KEY);
                if (raw) {
                    const saved = JSON.parse(raw) as Saved;
                    if (Array.isArray(saved.accounts)) {
                        setAccounts(saved.accounts);
                        setActiveId(saved.accounts.some(a => a.id === saved.activeId) ? saved.activeId : saved.accounts[0]?.id ?? null);
                    }
                }
            } catch (e) {
                console.warn("[accounts] could not read storage:", (e as Error).message);
            } finally {
                loaded.current = true;
                setReady(true);
            }
        })();
    }, []);

    useEffect(() => {
        if (!loaded.current) return;
        AsyncStorage.setItem(KEY, JSON.stringify({ accounts, activeId } satisfies Saved))
            .catch(e => console.warn("[accounts] could not save:", (e as Error).message));
    }, [accounts, activeId]);

    const addAccount = useCallback<AccountsState["addAccount"]>(input => {
        const id = input.address.toLowerCase();
        const next: Account = { ...input, id, addedAt: Date.now() };
        setAccounts(prev => {
            const existing = prev.find(a => a.id === id);
            if (!existing) return [...prev, next];
            // keep the original add date; a connected wallet upgrades a watch-only entry; keep a custom label
            return prev.map(a => a.id === id ? { ...a, ...input, label: input.label ?? a.label, kind: input.kind === "wallet" ? "wallet" : a.kind } : a);
        });
        setActiveId(id);
        return next;
    }, []);

    const linkWallet = useCallback((address: string, connector?: string) => {
        const id = address.toLowerCase();
        setAccounts(prev => prev.map(a => (a.id === id && (a.kind !== "wallet" || a.connector !== connector) ? { ...a, kind: "wallet", connector } : a)));
    }, []);

    const switchTo = useCallback((id: string) => setActiveId(id), []);

    const removeAccount = useCallback((id: string) => {
        clearAccountCache(id);
        setAccounts(prev => {
            const rest = prev.filter(a => a.id !== id);
            setActiveId(cur => (cur === id ? rest[0]?.id ?? null : cur));
            return rest;
        });
    }, []);

    const rename = useCallback((id: string, label: string) => {
        setAccounts(prev => prev.map(a => (a.id === id ? { ...a, label: label.trim() || undefined } : a)));
    }, []);

    const value = useMemo<AccountsState>(() => ({
        ready, accounts, active: accounts.find(a => a.id === activeId) ?? null, addAccount, linkWallet, switchTo, removeAccount, rename,
    }), [ready, accounts, activeId, addAccount, linkWallet, switchTo, removeAccount, rename]);

    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useAccounts = () => {
    const v = useContext(Ctx);
    if (!v) throw new Error("useAccounts must be used inside AccountsProvider");
    return v;
};
