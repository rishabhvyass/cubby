import { QUICKNODE_URLS } from "./env";

export type Chain = {
    id: "ethereum" | "base" | "arbitrum";
    name: string;
    chip: string;
    rpcUrl: string;
    cgPlatform: string; // CoinGecko asset platform id
    chainId: number;
};

export const CHAINS: Chain[] = [
    { id: "ethereum", name: "Ethereum", chip: "ETH", rpcUrl: QUICKNODE_URLS.ethereum, cgPlatform: "ethereum", chainId: 1 },
    { id: "base", name: "Base", chip: "BA", rpcUrl: QUICKNODE_URLS.base, cgPlatform: "base", chainId: 8453 },
    { id: "arbitrum", name: "Arbitrum", chip: "AR", rpcUrl: QUICKNODE_URLS.arbitrum, cgPlatform: "arbitrum-one", chainId: 42161 },
];
