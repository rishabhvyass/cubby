import { AppKit, AppKitProvider, useAccount, useAppKit, useProvider, useWalletInfo } from "@reown/appkit-react-native";
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef } from "react";
import { appKit, WALLET_CONNECT_READY } from "../config/appkit";
import { useAccounts } from "./accounts";

export type WalletApi = {
    /** false until a Reown project ID is set in src/config/env.ts */
    available: boolean;
    connected: boolean;
    address?: string;
    chainId?: number;
    walletName?: string;
    /** Opens the wallet picker. `onConnected` runs once when a wallet connects. */
    connect: (onConnected?: (address: string, walletName?: string) => void) => void;
    disconnect: () => Promise<void>;
    /** EIP-1193 request through the connected wallet (the user approves in their wallet app). */
    request: (method: string, params?: unknown[]) => Promise<any>;
};

const NONE: WalletApi = {
    available: false, connected: false,
    connect: () => {},
    disconnect: async () => {},
    request: async () => { throw new Error("No wallet connected"); },
};
const Ctx = createContext<WalletApi>(NONE);

const parseChainId = (c?: string) => {
    if (!c) return undefined;
    const n = Number(c.includes(":") ? c.split(":")[1] : c);
    return Number.isFinite(n) ? n : undefined;
};

const Bridge = ({ children }: { children: React.ReactNode }) => {
    const { open } = useAppKit();
    const { address, isConnected, chainId } = useAccount();
    const { provider } = useProvider();
    const { walletInfo } = useWalletInfo();
    const { linkWallet } = useAccounts();
    const pending = useRef<((address: string, name?: string) => void) | null>(null);

    // A restored session marks the matching saved account as "connected" (without switching to it).
    useEffect(() => {
        if (isConnected && address) linkWallet(address, walletInfo?.name);
    }, [isConnected, address, walletInfo?.name, linkWallet]);

    // Run the one-shot callback when the user finishes connecting.
    useEffect(() => {
        if (isConnected && address && pending.current) {
            const cb = pending.current;
            pending.current = null;
            cb(address, walletInfo?.name);
        }
    }, [isConnected, address, walletInfo?.name]);

    const connect = useCallback<WalletApi["connect"]>(cb => {
        // Already connected (session restored from an earlier connection): use it right away.
        // Opening the picker now would only show the Account panel and never fire a "new connection" event.
        if (isConnected && address) { cb?.(address, walletInfo?.name); return; }
        pending.current = cb ?? null;
        open();
    }, [open, isConnected, address, walletInfo?.name]);

    const value = useMemo<WalletApi>(() => ({
        available: true,
        connected: isConnected,
        address,
        chainId: parseChainId(chainId),
        walletName: walletInfo?.name,
        connect,
        disconnect: async () => { await appKit?.disconnect(); },
        request: async (method, params = []) => {
            if (!provider) throw new Error("No wallet connected");
            return provider.request({ method, params } as any);
        },
    }), [isConnected, address, chainId, walletInfo?.name, connect, provider]);

    return (
        <Ctx.Provider value={value}>
            {children}
        </Ctx.Provider>
    );
};

/** Wallet connection layer (Reown AppKit). Without a project ID the app still runs, view-only. */
export const WalletProvider = ({ children }: { children: React.ReactNode }) => {
    if (!WALLET_CONNECT_READY || !appKit) return <Ctx.Provider value={NONE}>{children}</Ctx.Provider>;
    return (
        <AppKitProvider instance={appKit}>
            <Bridge>
                {children}
                <AppKit />
            </Bridge>
        </AppKitProvider>
    );
};

export const useWallet = () => useContext(Ctx);
