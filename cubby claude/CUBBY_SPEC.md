# Cubby — product & build spec

> Source of truth for building Cubby in Claude Code. Everything here comes from the Cubby design canvas (V2 light + dark boards, V2 design system, and the older V1 "NEXUS" boards).
> Labels used below:
> **DESIGNED** = exists on a board, copy is verbatim. **RECOMMENDATION** = not in the design; a suggested choice. **NOT DESIGNED** = gap you must fill with the smallest sensible option and log in `DECISIONS.md`.

---

## 1. What Cubby is

Cubby is a **minimal-and-fun, view-only, on-chain portfolio tracker** for mobile (React Native). You connect a wallet, or just watch an address, and Cubby shows everything you own across chains in one calm place: net worth, where it sits, what happened, and how *healthy* the wallet is.

It is named after its mascot, **Cubby the vault**: a voxel vault that holds everything you own. Cubby gets stronger as the wallet gets safer, so security has something to look forward to.

**Tagline:** *Your wealth, on-chain.* — "Every asset, every chain. One calm place to see it all."
**Personality:** clear where money is, playful at the edges. Sentence case, tabular numbers, one accent colour (lime).

### Design principles (DESIGNED)
1. **Clarity where money is.** Balances, changes and transactions stay quiet: sentence case, tabular numbers, one accent. When stakes are high, the delight is how fast you understand.
2. **Rarer moment, more joy.** Onboarding, milestones, recaps and empty states get Cubby, stickers and confetti. Home gets only a count-up and a chart that draws itself.
3. **Celebrate care, not trades.** Rewards go to security wins, check-ins and time on-chain. Nothing ever cheers a price move, a swap or a bigger balance.

**Where the fun lives:** every open = number counts up, chart draws in, story card explains the week. Weekly = health check-in, streak square, Cubby's level. Monthly = recap story on a full-lime screen with dot-matrix totals. Rare = onboarding, milestones, sticker unlocks, empty states, Universe.

### Hard "never" list
No confetti on price gains · no leaderboards · no buy/sell nudges · no streaks tied to money · no daily streaks (weeks only) · no asking for a seed phrase · Cubby never signs anything itself.

---

## 2. Scope: what exactly we build

| Bucket | Screens / features | Status |
|---|---|---|
| **MVP (build this)** | Welcome · Connect wallet · Home · Universe · Assets (Tokens tab + chain filter) · Activity · Health (+ approvals + revoke) · Milestone/sticker unlock · Sticker book · Empty (new wallet) · Monthly recap · Light + dark | DESIGNED (V2) |
| **MVP data states** | Loading skeleton, new wallet, pending tx, failed tx, per-chain empty, dust hidden | DESIGNED (States board + V2) |
| **Backlog: designed in V1 "NEXUS" style, needs a Cubby restyle** | Asset detail (per-token page) · Transaction detail · NFTs tab · DeFi tab · Ask your portfolio (AI Q&A) · Wallet profile/settings · Disconnected / network error / unsupported chain / very large portfolio states | DESIGNED (V1), **not yet restyled** |
| **Not designed** | Sticker book screen (locked-slot look) · 5 of the 12 stickers · notifications · onboarding permission prompts · share-card export · real chart path generation · settings beyond the V1 list | NOT DESIGNED |

The V1 boards (dark, uppercase, "NEXUS" branding) predate Cubby. Use them for **content and structure only**; restyle with Cubby tokens, sentence case and the Cubby voice.

---

## 3. Navigation map

```
Welcome ──(Connect wallet)──► Connect ──► Home
   └──(Look around with a demo wallet)──────────► Home (demo data)

Floating tab bar (4 tabs, active tab grows a label):
  Home · Assets · Activity · Health

Home
  ├─ story card CTA  "Watch your September recap →"  ──► Recap
  ├─ "All assets" / allocation rows                  ──► Assets
  ├─ Cubby level card                                ──► Health
  ├─ Universe card   "Fly through your assets"       ──► Universe ──(tap planet)──► zoomed planet ──"Open ETH"──► Assets
  └─ Sticker book card "5 of 12 collected"           ──► Sticker book (NOT DESIGNED)

Activity ──"Watch recap"──► Recap
Health   ──revoke risky approval──► Milestone (sticker "Clean sweep")   [RECOMMENDATION: designed unlock card exists on Health]
Anywhere ──time-based/rule-based milestone──► Milestone (e.g. "One year on-chain")
Empty wallet: "Receive" / "Watch address"
```
Recap and Milestone are full-screen, modal-style. The tab bar hides on Welcome, Connect, Recap, Milestone.

---

## 4. Design system → code map

All values live in `src/theme/tokens.ts`.

**Colour (light):** bg `#F4F4EF`, surface `#FFFFFF`, surface2 `#EDEDE6`, text `#0A0A0A`, secondary `#5C5C56`, accent `#B8FF4A`, positive `#2E6600`, negative `#C22A2A`, caution `#8A5300`, tints `#E4F5C8 / #FBE3E1 / #FFF0D6`, tab bar `#0A0A0A`.
**Colour (dark):** bg `#050505`, surface `#111111`, surface2 `#1A1A1A`, bar `#161616`, text `#F5F5F5`, secondary `#8F8F8F`, positive `#B8FF4A`, negative `#FF6B6B`, caution `#FFB84A`, tints are the same hues at 12% alpha, border `rgba(255,255,255,0.09)`.
**Asset palette (planets, tiles, chart marks only, always ink text on top):** ETH `#B8FF4A` · USDC `#8FC4FF` · BTC `#FFC94A` · NFT/POL `#FF9A9A` · DeFi/SOL `#E8E4FF`.
**Type:** Geist (UI), Geist Mono (addresses, block numbers), Doto 900 (headline numerals only). Scale: numeral 62, display 46 (Geist 650), title 36/20, body 16/1.5. `numeralFace` prop can A/B `dot-matrix` vs `geist`.
**Shape:** cards radius 28–30, tiles 20, chips 20, pills 999, buttons 27, 44pt min hit target (tab 48, button 54).
**Buttons are tactile:** hard offset shadow (primary 4px, secondary 3px); on press the button sinks 3px and the shadow collapses.
**Backdrop:** graph-paper grid, 26px cells, line `rgba(10,10,10,0.045)` (light).
**Status chips:** sign or icon plus word, never colour alone: `▲ 5.45%`, `▼ 2.40%`, `— 0.00%`, `● Pending`, `✕ Failed`.
**Streak** is shown in weeks, so a busy week never breaks it.

---

## 5. Screens (DESIGNED, V2)

Each screen exists in light and dark. Copy is verbatim; `{…}` are dynamic values. Demo values are in `src/data/demoWallet.ts`.

### 5.1 Welcome
- Cubby mark + wordmark "cubby". Headline **"Your wealth, / on-chain."** Body: "Every asset, every chain. One calm place to see it all."
- Primary **Connect wallet**; secondary text link **Look around with a demo wallet**. Footnote: "View-only. We never ask for your seed phrase."
- Floating stickers drift (float). Rise-in on load.

### 5.2 Connect a wallet
- Title "Connect a wallet", sub "View-only. Disconnect whenever you like."
- Radio list (single select, default WalletConnect): **MetaMask** (Browser & mobile) · **WalletConnect** (600+ wallets) · **Coinbase Wallet** (Smart wallet ready) · **Phantom** (Solana & EVM). Each has a coloured monogram tile. Selected row: 2px ink border, surface2 fill, lime dot with tick.
- Divider "or just watch an address" → input placeholder "ENS, SNS or wallet address" + **Paste** button.
- Primary CTA label follows the selection: "Continue with {pickedName}".
- First successful connection awards sticker **Hello**.

### 5.3 Home
Header: wallet name (e.g. `rishabh.eth`) + pill **"Live on 5 chains"**.
1. **Net worth hero** — Doto numeral `$24,821` with `.42` smaller. Counts up 0→value in 1.3s on every open.
2. **Delta line** — `▲ $1,284.31 · 5.45% this week` (sign glyph + amount + percent + range caption).
3. **Range control** — segmented `1D 1W 1M 3M 1Y ALL` (default 1W). Changes delta, caption and chart.
4. **Chart** — smooth line, ink 2px stroke, lime gradient area, end dot with a pulsing ring. Draws itself on load.
5. **"This week's story"** card — headline "ETH carried your week." Body "It made $842 of your $1,284 gain. You didn't add any new money. Prices did the work." Attribution chips `ETH +$842 · BTC +$281 · NFTs +$161`. CTA "Watch your September recap →".
6. **"Where it sits"** — allocation rows (ETH 50.0%, USDC 23.4%, BTC 12.9%, NFT 8.8%, +3 Other 4.9%) with asset-palette dots/tiles and a link **All assets**.
7. **Cubby level card** — mascot at current level. "Cubby is at level 3" · "Health 82 · 1 quick fix to Level 4" · streak square "12 wks".
8. **Universe card** — "Universe · Fly through your assets" with the orbit art (slow spin).
9. **Sticker book card** — "5 of 12 collected".
10. **"Across chains"** — Ethereum $11,240 · Base $4,120 · Arbitrum $3,860 · Solana $3,191 · Polygon $2,410.
11. Floating tab bar.
Cards enter with rise + 40ms stagger.

### 5.4 Universe
- Title "Universe", header total `$24.8K` "Net worth".
- Copy: **"Your wealth, in orbit."** / "Bigger planet, bigger share. Tap one to fly in."
- Five planets sized by share (BTC 74, ETH 108, NFT 66, USDC 86, DeFi 62 px) around a centre; each floats on its own period; centre + rings decorate.
- Tap a planet → stage zooms (2.5×) to it, others fade out, a detail sheet appears: name, value, balance, delta, "{share} of total", button **Open {K}**, and **Back to orbit**.
- Planet aria label: "Fly into {name}, {value}".

### 5.5 Assets
- Header "Assets", total for the current filter, tabs: **Tokens** · **NFTs · 24** · **DeFi · 3** (NFTs and DeFi tabs = backlog).
- Chain chips: All, Ethereum, Base, Arbitrum, Solana, Polygon, Optimism (single select; total recomputes).
- Row: chain-monogram tile in asset colour, symbol + name, balance (`2.91 ETH`), USD value, delta chip with sign glyph.
- **Empty per chain:** "Nothing on {chain} yet" / "Anything you bridge or receive there shows up here on its own."
- **Dust footer:** "14 tiny tokens hidden" / "Dust and unverified airdrops. Often scams." (tap to reveal — RECOMMENDATION for the interaction.)

### 5.6 Activity
- Header "Activity". A monthly card strip: **"Your month, in 3 cards"** · "September on-chain" · **Watch recap** → Recap.
- Filter chips: All, Swaps, Transfers, NFTs, DeFi.
- Grouped by day (Today, Yesterday, Sep 10…). Row: icon tile (swap/send/receive/mint/stake icons), title, meta line, amount (ink, `+` positive, secondary for fees), time.
- **Pending:** `● Pending` chip in caution tint; title "Sending". **Failed:** `✕ Failed` chip in negative tint; meta "Price moved. Your USDC is safe."

### 5.7 Health
- Header "Health". **Health score** in Doto (e.g. 82), label + level: "Good · Level 3", next line "8 points to Level 4" (or "Top level reached. Crown earned."), progress bar `{score} / 100`.
- Mascot at the current level. **"12-week check-in streak."**
- **Sticker unlock card** appears when a risky approval is revoked: "New sticker unlocked — Clean sweep · View →".
- **Checkup** rows: "No suspicious transactions" · "Healthy mix across 5 chains" · approvals summary row (`!` caution or `✓` positive): "{n} unlimited approvals to review" / "No unlimited approvals left".
- **Token approvals** section: "Apps you've allowed to move your tokens. "Unlimited" means all of them. Revoking opens your wallet to sign."
  Row: token tile, spender, meta (e.g. `0x4f…c21 · unverified · unlimited`), **Revoke** button.
  The risky one (unknown contract) has a red border/tint, a wobbling flag and a lime Revoke button. Revoked rows dim to 60% and show a check + "Revoked".
- Prototype note: tapping Revoke simulated a signed revoke. In the real app, Revoke opens the wallet to sign; only after confirmation does the row flip.

### 5.8 Milestone (sticker unlock)
- Full-screen celebration + confetti. Label "New sticker", big sticker (pop-in, then a gentle wobble).
- Headline **"One year / on-chain."** Body "Your first transaction was on Sep 23, 2025. Five chains and 412 transactions later, here you are."
- Buttons **Add to sticker book** (primary), **Share card** (secondary). Below: "Sticker book · 6 of 12". Footnote "Stickers celebrate care and milestones, never trades or price moves."

### 5.9 Empty (new wallet)
- Net worth shows `$0` `.00`. Title **"Nothing here yet. That's fine."** Body "Receive funds on any of 6 chains, or watch a wallet you're curious about. Cubby fills up on its own."
- Buttons **Receive** (primary, animated nudging arrow), **Watch address**. Cubby level-1 art.

### 5.10 Monthly recap ("September 2026")
Story format on a **full-lime screen** with dot-matrix numbers. 3 cards, top progress segments, tap **Next** (last card shows **Replay**), Back goes to the previous card.
1. "You made **38** transactions across 4 chains." · Most used **Uniswap** · Fees paid **$41.20**.
2. **Busiest day** "Saturday, Sep 14" · "9 transactions. Mostly swaps on Base." · mini timeline Sep 1 / Sep 14 / Sep 30. *(Copy note: the board's weekday doesn't match the real calendar date. When generating from data, compute the weekday.)*
3. **Best move of the month** — "Cubby got stronger. You revoked 3 old approvals and moved from Level 2 to Level 3. That's the kind of thing we like to celebrate."

---

## 6. Backlog screens (V1 "NEXUS" content, restyle for Cubby)

| Screen | Content to keep |
|---|---|
| **Asset detail** (ETH) | Chain label, price/holding hero `$12,421.42`, `2.91 ETH`, delta `▲ +$842.31 +8.21%`, range control, chart, "Your holding": Balance, Current price ($4,268), Average cost ($3,842), Unrealized P&L (+$1,239); Activity list with "See all". |
| **Transaction detail** | Status chip CONFIRMED, type SWAP, "You paid 0.42 ETH → You got 1,790 USDC", plain-language sentence ("You swapped 0.42 ETH for 1,790 USDC on Uniswap. Rate: 1 ETH = 4,262 USDC. Network fee was $3.42."), Protocol, Network, Network fee ($3.42 · 0.0008 ETH), Time, Block (23,821,921), Transaction hash (0x82f…91ac), **View on explorer**. |
| **NFTs** | Est. value + count ("24 NFTs · 6 collections"), collection rows with floor-value estimate (Pudgy Penguins #421 $2,180, Azuki #1821 $1,240, Chromatic Field #07 $610, Genesis Pass #1290 $420, "20 more across 4 collections"). Note: "Estimates use collection floor prices." Artwork loads from the NFT service. |
| **DeFi** | Total in DeFi $8,421, Blended APY 6.41%, Earned this month +$45.02; positions: Aave (Lending, Ethereum, $4,821, 4.8%, health factor 2.14), Uniswap (Liquidity, Base, $2,120, 12.4%, in range), Lido (Staking, Ethereum, $1,480, 3.1%, 0.35 stETH). Risk label (Low/Medium). Cubby does not recommend protocols. Awards sticker **First yield**. |
| **Ask your portfolio** | Chat-style Q&A grounded in holdings and 7-day prices. Suggested prompts: "How diversified am I?", "How much ETH did I buy this month?", "Show my DeFi positions", "Why did my portfolio increase this week?". Answer card with breakdown ("Almost entirely price moves. You made no deposits."). Follow-ups: See trades, Compare to last week, What if ETH drops 10%? Footer "From your holdings and 7-day prices". |
| **Wallet profile / settings** | Wallet name + address, Copy address, Switch wallet, Connected networks with sync status (Ethereum, Base, Polygon, Arbitrum, Solana synced; Optimism "No assets yet"), Settings: Manage wallets, Notifications, Security, Currency (USD), Appearance, Privacy ("Hide balances"), **Disconnect wallet**. |

### Data states board (V1, apply to Cubby)
1 Loading (skeleton mirrors layout, cached value first) · 2 New wallet · 3 Disconnected ("Wallet disconnected", last known value, Reconnect) · 4 Network error ("Base isn't responding", stale balances, total may be off by up to $4,120, Retry now) · 5 Unsupported chain ("Scroll isn't supported yet", excluded from total, Request support) · 6 No NFTs · 7 No DeFi ("Nothing deployed") · 8 No history · 9 Pending tx ("Totals update only after confirmation. Pending amounts are labelled, never silently counted.") · 10 Failed tx ("Your USDC never left. Fee paid: $0.01.") · 11 Very large portfolio (>9 digits → compact hero `$1.28B`, exact value one line below) · 12 Zero & dust balances (hidden by default).

---

## 7. Health, level and sticker rules

**Health score** (0–100). Demo model: base **82**; each unlimited approval you revoke restores points — unknown/unverified contract **+8**, others **+2** each (1inch, Camelot, Uniswap in the demo). Label: **Good** < 90, **Great** ≥ 90, **Excellent** ≥ 94. *(Only these three labels are designed. Below 80 the code returns a placeholder "Fair": NOT DESIGNED, confirm copy.)*
**Real scoring is a RECOMMENDATION:** approvals (unlimited, unverified spender, unused age), suspicious-tx checks, chain/asset diversification, seed-backup confirmation, weekly check-in.

**Cubby level** follows the score: L1 **< 60**, L2 **60–79**, L3 **80–89**, L4 **≥ 90** (gold crown). Next-level text: "{90 − score} points to Level 4".

**Stickers** — pixel art, die-cut white edge, earned never bought. 7 designed, book has 12 slots:

| Sticker | Unlock rule |
|---|---|
| Hello | Connect a first wallet |
| Clean sweep | Revoke a risky approval |
| Backed up | Confirm a seed backup *(mechanism NOT DESIGNED; Cubby never sees seeds, so this is a self-attestation)* |
| Steady | 12 weekly check-ins |
| One year | A year on-chain |
| Explorer | Assets on 5 chains |
| First yield | First DeFi position |
| (5 more slots) | NOT DESIGNED |

The Milestone screen is the unlock moment. The sticker-book screen and its locked-slot look are NOT DESIGNED.

---

## 8. Data model (RECOMMENDATION — types mirror `src/data/demoWallet.ts`)

```ts
Wallet { id, name (ENS/SNS/short address), address, chains: ChainName[], connectedVia | 'watch' }
Holding { symbol, name, chain, balance, usd, usdChange{range→abs,pct}, kind: 'token'|'nft'|'defi', color }
NetWorthSeries { range: '1D'|'1W'|'1M'|'3M'|'1Y'|'ALL', points: [t, usd][] }
Activity { id, kind: swap|send|receive|mint|stake, status: confirmed|pending|failed, title, meta, amountUsd, feeUsd, ts, category, hash, chain }
Approval { id, token, spender, spenderVerified, unlimited, lastUsedDays, riskPoints }
Health { score, level, checkup[], approvals[], streakWeeks }
StickerState { name, unlockedAt | null }
Recap { month, txCount, chainCount, mostUsedProtocol, feesUsd, busiestDay{date,count,summary}, bestMove }
```
"This week's story" and the recap are **derived** from holdings deltas and activity (price effect vs. new money). Never invent narrative that the data doesn't support.

## 9. Services (RECOMMENDATION — all undecided)

| Concern | Suggested | Notes |
|---|---|---|
| Wallet connect | WalletConnect / Reown AppKit; Phantom deep link for Solana | Read-only session; also "watch address" (ENS/SNS resolve) |
| Balances + history | Alchemy / Zerion / Helius (Solana) | Multi-chain aggregate; cache last value |
| Prices + charts | CoinGecko or provider's price API | Range series 1D→ALL |
| NFTs | Provider NFT API, floor price estimates | Backlog |
| Approvals | Provider allowance APIs or on-chain `Approval` logs | Revoke = wallet tx the user signs |
| Storage | Secure storage for wallet list; local DB for cache + sticker state | No keys ever stored |
Put each behind an interface (`PortfolioService`, `PriceService`, `ActivityService`, `ApprovalService`) and start with the demo implementation.

## 10. Copy & voice
Plain, warm, short. Sentence case. Explain in one line what happened and what it means for the user's money. Reassure on failure ("Your USDC is safe."). Never hype. Never say "moon", "gains", "winning".

## 11. Accessibility
- Contrast (WCAG 2.2): light text 17.9:1, secondary 6.1:1, positive 6.3:1, negative 5.2:1, caution 5.7:1; dark text 18.7:1.
- Status never colour-only. 44pt targets. Labels on planets ("Fly into {name}, {value}"), revoke buttons ("Revoke {who} access to {token}"), radio rows (`checked` state).
- Reduce Motion: fades only, confetti → static sticker, count-up shows final number, haptics remain.
- Support Dynamic Type; Doto numerals must not clip (use `adjustsFontSizeToFit` for very large values / compact notation above 9 digits).

## 12. Build milestones & definition of done

| # | Milestone | Done when |
|---|---|---|
| 0 | Scaffold | Expo TS strict app, fonts loaded, `ThemeProvider` (light/dark/system), tab shell + floating tab bar, demo data wired |
| 1 | Components | Card, Button (press-sink + haptic), Chip, Segmented, StatusChip, Row, TabBar, ProgressBar, Skeleton |
| 2 | Welcome + Connect + Empty | Copy verbatim, Hello sticker, demo-wallet entry |
| 3 | Home | Count-up, range switch, drawn chart, story card, allocation, level card, chains, Universe + sticker cards |
| 4 | Assets + Activity | Chain filter, dust footer, empty per chain, category filter, pending/failed rows |
| 5 | Health | Score, level, approvals list, revoke flow, sticker unlock card |
| 6 | Universe | Planets, zoom, detail sheet, back to orbit |
| 7 | Milestone + Recap + Sticker book | Confetti, pop-in, recap stories, book screen (design it) |
| 8 | Real data | Wallet connect, balances, prices, activity, approvals behind the service interfaces; loading / error / disconnected states |
| 9 | Polish | Dark-mode audit, reduce-motion audit, a11y pass, haptics, perf |
| 10 | Backlog | Asset detail, Tx detail, NFTs, DeFi, Ask, Profile |

**Definition of done (every screen):** spec copy verbatim · light + dark · all states · listed animations + reduced-motion path · tokens only · 44pt targets · screen-reader labels · no rule in §1 "never" list violated.

## 13. Open decisions (log these, don't block)
Data provider · wallet-connect stack · real health-score formula · "Fair" label copy · 5 remaining stickers · sticker-book screen · notifications · share-card export format · whether Solana is native in v1 · monetisation (none designed) · chart data resolution per range.
