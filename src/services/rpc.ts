// QuickNode plans rate-limit requests per second, so calls go through a small per-endpoint queue
// and rate-limited (HTTP 429) calls are retried with backoff instead of failing the whole screen.
const MAX_CONCURRENT = 4;
const MAX_RETRIES = 4;

type Slot = { running: number; waiting: (() => void)[] };
const slots = new Map<string, Slot>();

const acquire = async (url: string) => {
    const slot = slots.get(url) ?? { running: 0, waiting: [] };
    slots.set(url, slot);
    if (slot.running >= MAX_CONCURRENT) await new Promise<void>(res => slot.waiting.push(res));
    slot.running++;
    return () => {
        slot.running--;
        slot.waiting.shift()?.();
    };
};

const sleep = (ms: number) => new Promise<void>(r => setTimeout(() => r(), ms));

export const rpc = async <T>(url: string, method: string, params: unknown): Promise<T> => {
    for (let attempt = 0; ; attempt++) {
        const release = await acquire(url);
        let res: Response;
        try {
            res = await fetch(url, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
            });
        } finally {
            release();
        }
        if (res.status === 429 && attempt < MAX_RETRIES) {
            await sleep(400 * 2 ** attempt);
            continue;
        }
        if (!res.ok) throw new Error(`${method} failed: HTTP ${res.status}`);
        const json = await res.json();
        if (json.error) {
            // Some plans return rate limits as a JSON-RPC error instead of an HTTP status.
            if (/rate|limit|too many/i.test(json.error.message ?? "") && attempt < MAX_RETRIES) {
                await sleep(400 * 2 ** attempt);
                continue;
            }
            throw new Error(`${method}: ${json.error.message}`);
        }
        return json.result as T;
    }
};
