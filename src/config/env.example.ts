// Copy to env.ts (git-ignored) and paste your QuickNode HTTP endpoints.
// Each chain needs its own endpoint. Enable the "Token and NFT API v2" add-on
// (qn_getWalletTokenBalance) on them to get ERC-20 balances.
export const QUICKNODE_URLS = {
    ethereum: "https://YOUR-NAME.quiknode.pro/YOUR-TOKEN/",
    base: "https://YOUR-NAME.base-mainnet.quiknode.pro/YOUR-TOKEN/",
    arbitrum: "https://YOUR-NAME.arbitrum-mainnet.quiknode.pro/YOUR-TOKEN/",
};

// Free project ID from https://dashboard.reown.com (needed to connect wallet apps like MetaMask).
export const REOWN_PROJECT_ID = "YOUR_REOWN_PROJECT_ID";
