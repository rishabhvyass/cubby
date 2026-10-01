import { createAppKit, type Storage } from "@reown/appkit-react-native";
import { EthersAdapter } from "@reown/appkit-ethers-react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { arbitrum, base, mainnet } from "viem/chains";
import { REOWN_PROJECT_ID } from "./env";

export const WALLET_CONNECT_READY = !!REOWN_PROJECT_ID && !REOWN_PROJECT_ID.startsWith("YOUR_");

/** AppKit needs a JSON-aware storage; reuse the app's AsyncStorage. */
const storage: Storage = {
    getKeys: async () => [...(await AsyncStorage.getAllKeys())],
    getEntries: async <T,>() => {
        const keys = await AsyncStorage.getAllKeys();
        const map = await AsyncStorage.getMany([...keys]);
        return Object.entries(map).map(([k, v]) => [k, v ? (JSON.parse(v) as T) : undefined] as [string, T]);
    },
    getItem: async <T,>(key: string) => {
        const v = await AsyncStorage.getItem(key);
        return v ? (JSON.parse(v) as T) : undefined;
    },
    setItem: async <T,>(key: string, value: T) => { await AsyncStorage.setItem(key, JSON.stringify(value)); },
    removeItem: async (key: string) => { await AsyncStorage.removeItem(key); },
};

/** null until a Reown project ID is configured, so the rest of the app still runs. */
export const appKit = WALLET_CONNECT_READY
    ? createAppKit({
        projectId: REOWN_PROJECT_ID,
        networks: [mainnet, base, arbitrum],
        defaultNetwork: mainnet,
        adapters: [new EthersAdapter()],
        storage,
        metadata: {
            name: "Cubby",
            description: "A calm place to see your on-chain wealth",
            url: "https://cubby.app",
            icons: ["https://cubby.app/icon.png"],
            redirect: { native: "cubby://" },
        },
    })
    : null;
