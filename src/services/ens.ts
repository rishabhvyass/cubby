import { keccak_256 } from "@noble/hashes/sha3.js";
import { utf8ToBytes } from "@noble/hashes/utils.js";
import { CHAINS } from "../config/chains";
import { rpc } from "./rpc";

const ENS_REGISTRY = "0x00000000000C2E074eC69A0dFb2997BA6C7d2e1e";
const hex = (b: Uint8Array) => Array.from(b, x => x.toString(16).padStart(2, "0")).join("");

const namehash = (name: string) => {
    let node = new Uint8Array(32);
    for (const label of name.toLowerCase().split(".").reverse()) {
        const buf = new Uint8Array(64);
        buf.set(node);
        buf.set(keccak_256(utf8ToBytes(label)), 32);
        node = keccak_256(buf);
    }
    return hex(node);
};

const call = (url: string, to: string, data: string) =>
    rpc<string>(url, "eth_call", [{ to, data }, "latest"]);

const toAddress = (word: string) => "0x" + word.slice(-40);
const isZero = (word: string) => /^0x0*$/.test(word);

export const isAddress = (s: string) => /^0x[0-9a-fA-F]{40}$/.test(s);

/** Resolves an ENS name (e.g. vitalik.eth) to an address via the Ethereum QuickNode endpoint. */
export const resolveEns = async (name: string): Promise<string> => {
    const url = CHAINS[0].rpcUrl;
    const node = namehash(name);
    const resolver = await call(url, ENS_REGISTRY, "0x0178b8bf" + node); // resolver(bytes32)
    if (isZero(resolver)) throw new Error(`No ENS record for ${name}`);
    const addr = await call(url, toAddress(resolver), "0x3b3b57de" + node); // addr(bytes32)
    if (isZero(addr)) throw new Error(`${name} has no address set`);
    return toAddress(addr);
};

export const resolveInput = async (input: string): Promise<string> => {
    const v = input.trim();
    if (isAddress(v)) return v;
    if (v.includes(".")) return resolveEns(v);
    throw new Error("Enter a 0x address or an ENS name");
};
