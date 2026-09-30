export const rpc = async <T>(url: string, method: string, params: unknown): Promise<T> => {
    const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
    });
    if (!res.ok) throw new Error(`${method} failed: HTTP ${res.status}`);
    const json = await res.json();
    if (json.error) throw new Error(`${method}: ${json.error.message}`);
    return json.result as T;
};
