import AsyncStorage from "@react-native-async-storage/async-storage";
import { CHAINS } from "../config/chains";

/**
 * Stale-while-revalidate cache. Screens render the last known data immediately (from memory, or from disk
 * after an app restart) and refresh in the background, so switching accounts feels instant.
 * Chain objects hold private RPC URLs, so they are stored as just their id and revived on read.
 */
export const TTL = { portfolio: 60_000, activity: 120_000, health: 300_000, history: 300_000 } as const;

type Entry<T> = { at: number; value: T };
const mem = new Map<string, Entry<unknown>>();
const PREFIX = "cubby.cache.v1:";

const replacer = (_k: string, v: unknown) =>
    v && typeof v === "object" && "rpcUrl" in (v as object) ? { __chain: (v as { id: string }).id } : v;
const reviver = (_k: string, v: any) =>
    v && typeof v === "object" && "__chain" in v ? CHAINS.find(c => c.id === v.__chain) ?? v : v;

/** Instant, synchronous read of what's already in memory. */
export const peek = <T,>(key: string): Entry<T> | null => (mem.get(key) as Entry<T> | undefined) ?? null;

export const isFresh = (e: Entry<unknown> | null, ttl: number) => !!e && Date.now() - e.at < ttl;

/** Memory first, then disk (survives app restarts). */
export const readCache = async <T,>(key: string): Promise<Entry<T> | null> => {
    const hit = peek<T>(key);
    if (hit) return hit;
    try {
        const raw = await AsyncStorage.getItem(PREFIX + key);
        if (!raw) return null;
        const entry = JSON.parse(raw, reviver) as Entry<T>;
        mem.set(key, entry);
        return entry;
    } catch {
        return null;
    }
};

export const writeCache = <T,>(key: string, value: T) => {
    const entry: Entry<T> = { at: Date.now(), value };
    mem.set(key, entry);
    AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry, replacer)).catch(() => {});
};

/** Forget everything cached for an account (when it's removed). */
export const clearAccountCache = async (address: string) => {
    const a = address.toLowerCase();
    for (const k of [...mem.keys()]) if (k.includes(a)) mem.delete(k);
    try {
        const keys = await AsyncStorage.getAllKeys();
        await Promise.all(keys.filter(k => k.startsWith(PREFIX) && k.includes(a)).map(k => AsyncStorage.removeItem(k)));
    } catch { /* ignore */ }
};

export const key = {
    portfolio: (a: string) => `portfolio:${a.toLowerCase()}`,
    activity: (a: string) => `activity:${a.toLowerCase()}`,
    health: (a: string) => `health:${a.toLowerCase()}`,
    history: (a: string, range: string) => `history:${a.toLowerCase()}:${range}`,
    local: (a: string) => `activity-local:${a.toLowerCase()}`,
    token: (id: string, days: string | number) => `token:${id}:${days}`,
};
