import { Chain } from "./chains";

/** Spenders we recognise by name. Anything else is labelled "Unknown contract · unverified". */
export const SPENDER_NAMES: Record<string, string> = {
    "0x000000000022d473030f116ddee9f6b43ac78ba3": "Permit2",
    "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad": "Uniswap",
    "0x66a9893cc07d91d95644aedd05d03f95e1dba8af": "Uniswap",
    "0xe592427a0aece92de3edee1f18e0157c05861564": "Uniswap",
    "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45": "Uniswap",
    "0x7a250d5630b4cf539739df2c5dacb4c659f2488d": "Uniswap",
    "0x6ff5693b99212da76ad316178a184ab56d299b43": "Uniswap",
    "0xa51afafe0263b40edaef0df8781ea9aa03e381a3": "Uniswap",
    "0x2626664c2603336e57b271c5c0b26f421741e481": "Uniswap",
    "0x1111111254eeb25477b68fb85ed929f73a960582": "1inch",
    "0x111111125421ca6dc452d289314280a0f8842a65": "1inch",
    "0xdef1c0ded9bec7f1a1670819833240f027b25eff": "0x",
    "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2": "Aave",
    "0xa238dd80c259a72e81d7e4664a9801593f98d1c5": "Aave",
    "0x794a61358d6845594f94dc1db02a252b5b4814ad": "Aave",
    "0xc873fecbd354f5a56e00e710b90ef4201db2448d": "Camelot",
    "0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43": "Aerodrome",
    "0xae7ab96520de3a18e5e111b5eaab095312d7fe84": "Lido",
};

/** Spenders whose allowance we check directly on each chain (against the known-token list). */
export const SCAN_SPENDERS: Record<Chain["id"], string[]> = {
    ethereum: [
        "0x000000000022d473030f116ddee9f6b43ac78ba3", "0x3fc91a3afd70395cd496c647d5a6cc9d4b2b7fad",
        "0x66a9893cc07d91d95644aedd05d03f95e1dba8af", "0xe592427a0aece92de3edee1f18e0157c05861564",
        "0x111111125421ca6dc452d289314280a0f8842a65", "0x87870bca3f3fd6335c3f4ce8392d69350b4fa4e2",
    ],
    base: [
        "0x000000000022d473030f116ddee9f6b43ac78ba3", "0x6ff5693b99212da76ad316178a184ab56d299b43",
        "0x2626664c2603336e57b271c5c0b26f421741e481", "0xcf77a3ba9a5ca399b7c97c74d54e5b1beb874e43",
        "0xa238dd80c259a72e81d7e4664a9801593f98d1c5",
    ],
    arbitrum: [
        "0x000000000022d473030f116ddee9f6b43ac78ba3", "0xa51afafe0263b40edaef0df8781ea9aa03e381a3",
        "0x68b3465833fb72a70ecdf485e0e4c7bd8665fc45", "0xc873fecbd354f5a56e00e710b90ef4201db2448d",
        "0x794a61358d6845594f94dc1db02a252b5b4814ad",
    ],
};
