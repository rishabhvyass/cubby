import { Chain } from "./chains";

export type KnownToken = { symbol: string; name: string; address: string; decimals: number };

// Used when the QuickNode Token API add-on isn't enabled: balances are read
// with plain eth_call balanceOf(). Only these tokens are checked.
export const KNOWN_TOKENS: Record<Chain["id"], KnownToken[]> = {
    ethereum: [
        { symbol: "USDC", name: "USD Coin", address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", decimals: 6 },
        { symbol: "USDT", name: "Tether", address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", decimals: 6 },
        { symbol: "DAI", name: "Dai", address: "0x6B175474E89094C44Da98b954EedeAC495271d0F", decimals: 18 },
        { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599", decimals: 8 },
        { symbol: "WETH", name: "Wrapped Ether", address: "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2", decimals: 18 },
        { symbol: "stETH", name: "Lido Staked Ether", address: "0xae7ab96520DE3A18E5e111B5EaAb095312D7fE84", decimals: 18 },
        { symbol: "LINK", name: "Chainlink", address: "0x514910771AF9Ca656af840dff83E8264EcF986CA", decimals: 18 },
        { symbol: "UNI", name: "Uniswap", address: "0x1f9840a85d5aF5bf1D1762F925BDADdC4201F984", decimals: 18 },
    ],
    base: [
        { symbol: "USDC", name: "USD Coin", address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913", decimals: 6 },
        { symbol: "USDbC", name: "USD Base Coin", address: "0xd9aAEc86B65D86f6A7B5B1b0c42FFA531710b6CA", decimals: 6 },
        { symbol: "DAI", name: "Dai", address: "0x50c5725949A6F0c72E6C4a641F24049A917DB0Cb", decimals: 18 },
        { symbol: "WETH", name: "Wrapped Ether", address: "0x4200000000000000000000000000000000000006", decimals: 18 },
        { symbol: "cbBTC", name: "Coinbase Wrapped BTC", address: "0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf", decimals: 8 },
    ],
    arbitrum: [
        { symbol: "USDC", name: "USD Coin", address: "0xaf88d065e77c8cC2239327C5EDb3A432268e5831", decimals: 6 },
        { symbol: "USDT", name: "Tether", address: "0xFd086bC7CD5C481DCC9C85ebE478A1C0b69FCbb9", decimals: 6 },
        { symbol: "DAI", name: "Dai", address: "0xDA10009cBd5D07dd0CeCc66161FC93D7c9000da1", decimals: 18 },
        { symbol: "WBTC", name: "Wrapped Bitcoin", address: "0x2f2a2543B76A4166549F7aaB2e75Bef0aefC5B0f", decimals: 8 },
        { symbol: "WETH", name: "Wrapped Ether", address: "0x82aF49447D8a07e3bd95BD0d56f35241523fBab1", decimals: 18 },
        { symbol: "ARB", name: "Arbitrum", address: "0x912CE59144191C1204E64559FE8253a0e49E6548", decimals: 18 },
    ],
};
