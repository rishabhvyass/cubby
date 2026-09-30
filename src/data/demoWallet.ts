/**
 * Demo wallet ("rishabh.eth") — every number below is copied from the design boards so the
 * app renders exactly like the mockups before any real data provider is wired in.
 * Use it for: "Look around with a demo wallet" on the welcome screen, Storybook, tests.
 *
 * Replace with real data behind the same TYPES. Keep the types stable, swap the source.
 */
import { assetPalette } from '../theme/tokens';
import type { StickerName } from '../art/svgs';

export type Range = '1D' | '1W' | '1M' | '3M' | '1Y' | 'ALL';
export type Trend = 'up' | 'flat' | 'down';
export type ChainName = 'Ethereum' | 'Base' | 'Arbitrum' | 'Solana' | 'Polygon' | 'Optimism';

export const wallet = {
  name: 'rishabh.eth',
  netWorth: 24821.42,
  chainCount: 5,
  /** "Live on 5 chains" pill under the name */
  liveLabel: 'Live on 5 chains',
} as const;

/** Net-worth change per range: [absolute, percent, caption]. Shown as "▲ $1,284.31 · 5.45% this week". */
export const rangeDelta: Record<Range, { abs: string; pct: string; label: string }> = {
  '1D': { abs: '$212.40', pct: '0.86%', label: 'today' },
  '1W': { abs: '$1,284.31', pct: '5.45%', label: 'this week' },
  '1M': { abs: '$2,941.08', pct: '13.44%', label: 'this month' },
  '3M': { abs: '$4,102.55', pct: '19.80%', label: 'past 3 months' },
  '1Y': { abs: '$9,880.12', pct: '66.13%', label: 'this year' },
  ALL: { abs: '$14,321.42', pct: '136.39%', label: 'all time' },
};
export const ranges: Range[] = ['1D', '1W', '1M', '3M', '1Y', 'ALL'];
export const defaultRange: Range = '1W';

/** Home → "This week's story" card */
export const weekStory = {
  title: 'ETH carried your week.',
  body: "It made $842 of your $1,284 gain. You didn't add any new money. Prices did the work.",
  chips: [
    { label: 'ETH', amount: '+$842' },
    { label: 'BTC', amount: '+$281' },
    { label: 'NFTs', amount: '+$161' },
  ],
  cta: 'Watch your September recap →',
} as const;

/** Home → "Where it sits" allocation */
export const allocation = [
  { sym: 'ETH', name: 'Ethereum', value: '$12,421', pct: '50.0%', color: assetPalette.eth },
  { sym: 'USDC', name: 'USD Coin', value: '$5,820', pct: '23.4%', color: assetPalette.usdc },
  { sym: 'BTC', name: 'Bitcoin', value: '$3,200', pct: '12.9%', color: assetPalette.btc },
  { sym: 'NFT', name: 'Collectibles', value: '$2,180', pct: '8.8%', color: assetPalette.nft },
  { sym: '+3', name: 'Other', value: '$1,200', pct: '4.9%', color: assetPalette.defi },
] as const;

/** Home → "Across chains" */
export const chains = [
  { mono: 'ETH', name: 'Ethereum', value: '$11,240' },
  { mono: 'BA', name: 'Base', value: '$4,120' },
  { mono: 'AR', name: 'Arbitrum', value: '$3,860' },
  { mono: 'SO', name: 'Solana', value: '$3,191' },
  { mono: 'PO', name: 'Polygon', value: '$2,410' },
] as const;

/** Assets screen → Tokens tab. Render the logo with <TokenIcon symbol={row.sym} /> and the chain badge with <ChainIcon chain={row.chain} />. `delta` string already carries the sign glyph (▲ ▼ —). Status is never colour-only. */
export type AssetRow = {
  sym: string;
  name: string;
  chain: ChainName;
  chainMono: string;
  balance: string;
  usd: string;
  usdValue: number;
  delta: string;
  trend: Trend;
  color: string;
};
export const assets: AssetRow[] = [
  { sym: 'ETH', name: 'Ethereum', chain: 'Ethereum', chainMono: 'ETH', balance: '2.91 ETH', usd: '$12,421.42', usdValue: 12421.42, delta: '▲ 8.21%', trend: 'up', color: assetPalette.eth },
  { sym: 'USDC', name: 'USD Coin', chain: 'Base', chainMono: 'BA', balance: '5,820 USDC', usd: '$5,820.00', usdValue: 5820, delta: '— 0.00%', trend: 'flat', color: assetPalette.usdc },
  { sym: 'BTC', name: 'Bitcoin', chain: 'Arbitrum', chainMono: 'AR', balance: '0.031 WBTC', usd: '$3,200.00', usdValue: 3200, delta: '▲ 4.12%', trend: 'up', color: assetPalette.btc },
  { sym: 'SOL', name: 'Solana', chain: 'Solana', chainMono: 'SO', balance: '4.62 SOL', usd: '$860.00', usdValue: 860, delta: '▼ 2.40%', trend: 'down', color: assetPalette.defi },
  { sym: 'POL', name: 'Polygon', chain: 'Polygon', chainMono: 'PO', balance: '1,210 POL', usd: '$340.00', usdValue: 340, delta: '▲ 1.08%', trend: 'up', color: assetPalette.nft },
];
export const chainFilters: Array<'All' | ChainName> = ['All', 'Ethereum', 'Base', 'Arbitrum', 'Solana', 'Polygon', 'Optimism'];
export const assetTabs = { tokens: 'Tokens', nfts: 'NFTs · 24', defi: 'DeFi · 3' } as const;
export const dust = { count: 14, title: '14 tiny tokens hidden', body: 'Dust and unverified airdrops. Often scams.' } as const;
/** Per-chain empty state copy (e.g. Optimism has no rows) */
export const chainEmpty = (chain: string) => ({
  title: `Nothing on ${chain} yet`,
  body: 'Anything you bridge or receive there shows up here on its own.',
});

/** Activity screen */
export type ActivityCategory = 'Swaps' | 'Transfers' | 'NFTs' | 'DeFi';
export type ActivityKind = 'swap' | 'send' | 'receive' | 'mint' | 'stake' | 'approve' | 'contract';
export type ActivityItem = {
  day: string;
  category: ActivityCategory;
  kind: ActivityKind;
  title: string;
  meta: string;
  amount: string;
  amountTone: 'ink' | 'positive' | 'secondary';
  time: string;
  tile: string;
  /** Pending and Failed carry an icon + word, never colour alone */
  status?: 'pending' | 'failed';
};
export const activity: ActivityItem[] = [
  { day: 'Today', category: 'Swaps', kind: 'swap', title: 'Swapped', meta: '0.42 ETH → 1,790 USDC · Uniswap', amount: '$1,790', amountTone: 'ink', time: '2h ago', tile: assetPalette.usdc },
  { day: 'Today', category: 'Transfers', kind: 'send', title: 'Sending', meta: '500 USDC to 0x92…F12 · Base', amount: '−$500', amountTone: 'ink', time: 'now', tile: '#EDEDE6', status: 'pending' },
  { day: 'Yesterday', category: 'Transfers', kind: 'receive', title: 'Received', meta: '0.42 ETH from 0x82…A91', amount: '+$1,790', amountTone: 'positive', time: '18:42', tile: assetPalette.eth },
  { day: 'Yesterday', category: 'NFTs', kind: 'mint', title: 'Minted', meta: 'Chromatic Field #07 · Base', amount: '$3.10 fee', amountTone: 'secondary', time: '11:05', tile: assetPalette.nft },
  { day: 'Yesterday', category: 'Swaps', kind: 'swap', title: 'Swap', meta: 'Price moved. Your USDC is safe.', amount: '$0.01 fee', amountTone: 'secondary', time: '09:20', tile: '#EDEDE6', status: 'failed' },
  { day: 'Sep 10', category: 'DeFi', kind: 'stake', title: 'Staked', meta: '0.35 ETH → stETH · Lido', amount: '$1,480', amountTone: 'ink', time: '08:02', tile: assetPalette.defi },
];
export const activityFilters = ['All', 'Swaps', 'Transfers', 'NFTs', 'DeFi'] as const;

/** Health screen */
export type Approval = {
  id: string;
  token: string;
  color: string;
  spender: string;
  meta: string;
  risky?: boolean;
  /** health points restored by revoking */
  points: number;
};
export const healthBase = 82;
export const approvals: Approval[] = [
  { id: 'u', token: 'USDT', color: assetPalette.nft, spender: 'Unknown contract', meta: '0x4f…c21 · unverified · unlimited', risky: true, points: 8 },
  { id: 'o', token: 'WETH', color: assetPalette.eth, spender: '1inch', meta: 'Unused for 214 days · unlimited', points: 2 },
  { id: 'c', token: 'ARB', color: assetPalette.usdc, spender: 'Camelot', meta: 'Unused for 96 days · unlimited', points: 2 },
  { id: 'n', token: 'USDC', color: assetPalette.defi, spender: 'Uniswap', meta: 'Used 2h ago · unlimited', points: 2 },
];
export const checkup = ['No suspicious transactions', 'Healthy mix across 5 chains'] as const;

/** Pure helpers replicating the Health board's logic. `revoked` = set of approval ids. */
export function healthScore(revoked: ReadonlySet<string>): number {
  return healthBase + approvals.reduce((s, a) => s + (revoked.has(a.id) ? a.points : 0), 0);
}
export function approvalsSummary(revoked: ReadonlySet<string>) {
  const left = approvals.filter((a) => !revoked.has(a.id)).length;
  return {
    left,
    text: left === 0 ? 'No unlimited approvals left' : `${left} unlimited approval${left > 1 ? 's' : ''} to review`,
    icon: left === 0 ? '✓' : '!',
  };
}
export function nextLevelText(score: number) {
  return score >= 90 ? 'Top level reached. Crown earned.' : `${90 - score} points to Level 4`;
}
/** Sticker "Clean sweep" unlocks when the risky (unknown-contract) approval is revoked. */
export const cleanSweepUnlocked = (revoked: ReadonlySet<string>) => revoked.has('u');

/** Stickers earned in the demo: home says "5 of 12 collected"; the milestone flow adds "One year" -> 6 of 12. */
export const stickerBook = {
  total: 12,
  demoCollectedOnHome: 5,
  afterMilestone: 6,
  designed: ['hello', 'clean_sweep', 'backed_up', 'steady', 'one_year', 'explorer', 'first_yield'] as StickerName[],
  footnote: 'Stickers celebrate care and milestones, never trades or price moves.',
} as const;
export const streak = { weeks: 12, label: '12-week check-in streak' } as const;

/** Universe (planet map). x/y are offsets from the stage centre (195, 260); d = planet diameter. */
export const universe = [
  { k: 'BTC', x: 0, y: -172, d: 74, color: assetPalette.btc, short: '$3.2K', name: 'Bitcoin', value: '$3,200.00', balance: '0.031 BTC', delta: '▲ 4.12%', share: '12.9%' },
  { k: 'ETH', x: -110, y: -60, d: 108, color: assetPalette.eth, short: '$12.4K', name: 'Ethereum', value: '$12,421.42', balance: '2.91 ETH', delta: '▲ 8.21%', share: '50.0%' },
  { k: 'NFT', x: 118, y: -52, d: 66, color: assetPalette.nft, short: '$2.2K', name: 'Collectibles', value: '$2,180.00', balance: '24 NFTs', delta: '▲ 7.98%', share: '8.8%' },
  { k: 'USDC', x: -100, y: 132, d: 86, color: assetPalette.usdc, short: '$5.8K', name: 'USD Coin', value: '$5,820.00', balance: '5,820 USDC', delta: '— 0.00%', share: '23.4%' },
  { k: 'DEFI', x: 112, y: 136, d: 62, color: assetPalette.defi, short: '$1.2K', name: 'DeFi & other', value: '$1,200.00', balance: '3 positions', delta: '▲ 1.20%', share: '4.9%' },
] as const;
export const universeStageCenter = { x: 195, y: 260 } as const;

/** Connect-a-wallet list (default selection: WalletConnect). View-only. `id` is also the WalletIcon key: <WalletIcon id={w.id} />. */
export const connectWallets = [
  { id: 'metamask', mono: 'M', name: 'MetaMask', sub: 'Browser & mobile', tile: assetPalette.btc },
  { id: 'walletconnect', mono: 'W', name: 'WalletConnect', sub: '600+ wallets', tile: assetPalette.usdc },
  { id: 'coinbase', mono: 'C', name: 'Coinbase Wallet', sub: 'Smart wallet ready', tile: assetPalette.defi },
  { id: 'phantom', mono: 'P', name: 'Phantom', sub: 'Solana & EVM', tile: assetPalette.eth },
] as const;

/** Monthly recap ("September 2026") — three story cards, tap to advance, last button says "Replay". */
export const recap = {
  month: 'September 2026',
  cards: [
    { kind: 'count', lead: 'You made', big: '38', tail: 'transactions across 4 chains.', mostUsed: 'Uniswap', feesPaid: '$41.20' },
    // NOTE: the board copy says "Saturday, Sep 14" — verify weekday against the real date when computing from data.
    { kind: 'busiest', title: 'Busiest day', day: 'Saturday,', date: 'Sep 14', body: '9 transactions. Mostly swaps on Base.', axis: ['Sep 1', 'Sep 14', 'Sep 30'] },
    { kind: 'best', title: 'Best move of the month', headline: 'Cubby got stronger.', body: 'You revoked 3 old approvals and moved from Level 2 to Level 3. That\'s the kind of thing we like to celebrate.' },
  ],
} as const;

/** Milestone screen ("One year on-chain.") */
export const milestone = {
  sticker: 'one_year' as StickerName,
  headline: 'One year on-chain.',
  body: 'Your first transaction was on Sep 23, 2025. Five chains and 412 transactions later, here you are.',
  primary: 'Add to sticker book',
  secondary: 'Share card',
} as const;

/** Empty (brand new) wallet */
export const emptyWallet = {
  netWorth: '$0.00',
  title: "Nothing here yet. That's fine.",
  body: 'Receive funds on any of 6 chains, or watch a wallet you\'re curious about. Cubby fills up on its own.',
  primary: 'Receive',
  secondary: 'Watch address',
} as const;

/** Welcome */
export const welcome = {
  headline: ['Your wealth,', 'on-chain.'],
  body: 'Every asset, every chain. One calm place to see it all.',
  primary: 'Connect wallet',
  secondary: 'Look around with a demo wallet',
  footnote: 'View-only. We never ask for your seed phrase.',
} as const;
