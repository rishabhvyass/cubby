import { QUICKNODE_URLS } from "./env";

export type Chain = {
    id: "ethereum" | "base" | "arbitrum";
    name: string;
    chip: string;
    rpcUrl: string;
    cgPlatform: string; // CoinGecko asset platform id
};

export const CHAINS: Chain[] = [
    { id: "ethereum", name: "Ethereum", chip: "ETH", rpcUrl: QUICKNODE_URLS.ethereum, cgPlatform: "ethereum" },
    { id: "base", name: "Base", chip: "BA", rpcUrl: QUICKNODE_URLS.base, cgPlatform: "base" },
    { id: "arbitrum", name: "Arbitrum", chip: "AR", rpcUrl: QUICKNODE_URLS.arbitrum, cgPlatform: "arbitrum-one" },
];
