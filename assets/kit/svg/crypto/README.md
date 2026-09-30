# Real crypto logos

26 SVGs in three folders: `tokens/` (16), `chains/` (6), `wallets/` (4). All are valid XML, no fonts, no embedded images, no duplicate ids.

| Folder | Files |
|---|---|
| `tokens/` | eth, usdc, usdt, btc, wbtc, sol, pol, arb, op, uni, aave, ldo, 1inch, dai, link, grail |
| `chains/` | ethereum, base, arbitrum, solana, polygon, optimism |
| `wallets/` | metamask, walletconnect, coinbase, phantom |

**Source:** `@web3icons/core` v4 (MIT licence), "branded" variant (the plain logo mark). `wbtc`, `arb` and `base` use the "background" variant because their plain mark is white and would vanish on a light tile; those three are full-bleed and fill the whole badge. Exact origin of each file: `sources.json`.
**Trademarks:** the logos belong to their projects. Using them to identify an asset inside a portfolio app is normal practice; don't use them to imply endorsement.

## Which logo for what (already wired in `src/art/CryptoIcon.tsx`)
- `WETH` → eth · `WBTC` → wbtc · `cbBTC` → btc · `USDC.e` → usdc · `MATIC` → pol
- `stETH` / `wstETH` → **Lido (ldo)** logo. web3icons has no stETH mark; change in `TOKEN_ALIASES` if you source one.
- Protocols: Uniswap → uni · Aave → aave · Lido → ldo · 1inch → 1inch · **Camelot → grail** (the GRAIL token mark, used as a stand-in for the protocol).
- NFT / "Collectibles" / "+3 Other": no logo. The component falls back to the original design's monogram on an asset-palette tile.

## Missing on purpose
No logo for any token outside this list. For the long tail, load the logo URL from your data provider (Alchemy/Zerion/CoinGecko return one) and show the monogram tile until it loads. Never recolour or add text over a logo.

## Add more
Copy the SVG into the right folder, then regenerate `src/art/cryptoSvgs.ts` (one entry per file, key = file name) and add an alias in `CryptoIcon.tsx` if needed. More logos: `npm i @web3icons/core` (thousands of tokens, networks, wallets, exchanges).
