# Cubby — instructions for Claude Code

You are building **Cubby**: a minimal-and-fun React Native app that shows a person's on-chain wealth (view-only) and celebrates *care*, never trades.
Read this file first. Everything you need is in this kit; do not invent visuals.

## Read order
1. `docs/CUBBY_SPEC.md` — what the app is, every screen, feature, state, rule, and the build scope.
2. `docs/ANIMATIONS.md` — every animation, timing, easing, where it's used, and the code that ports it.
3. `docs/ASSETS.md` — index of every SVG (mascot, stickers, icons, chart, brand) and how to render it.
4. `src/` — ready-to-use code: tokens, SVG art components, motion hooks, confetti, demo data.

## Ground rules (never break these)
- **Calm by default. Fun at the edges.** Money screens stay quiet. Delight lives in onboarding, milestones, recaps, empty states, Universe.
- **Celebrate care, not trades.** No confetti or cheering on price gains, swaps or bigger balances. No leaderboards. No buy/sell nudges. No streaks tied to money. Streaks count **weeks**, not days.
- **Use the provided art. Do not redraw** the mascot, stickers, icons or chart. Import from `src/art/Art.tsx`. Pixel-art stickers must stay crisp (no smoothing, integer scale where possible).
- **Tokens only.** Colours, radii, spacing, type and motion come from `src/theme/tokens.ts`. No hard-coded hex in screens (except via `assetPalette`).
- **Two modes from one source.** Every screen supports light and dark via `palettes.light | palettes.dark`.
- **Doto (dot-matrix) is for headline numbers only:** net worth, health score, recap stats. Never tables or body copy. Everything else is Geist / Geist Mono.
- **Lime `#B8FF4A` is never small text on a light background.** It's a fill, a marker, or a big number on dark. Asset-palette fills always carry ink text.
- **Status is never colour alone.** Always a sign or icon: `▲ ▼ —`, `● Pending`, `✕ Failed`, `✓`.
- **Reduce Motion:** fades only; confetti becomes the static sticker; haptics still confirm. All hooks in `src/motion/motion.ts` already honour `useReducedMotion`.
- **View-only.** Never ask for a seed phrase. Revoke approvals opens the user's wallet to sign; Cubby never signs for them.
- Sentence case everywhere. Tabular numerals for money. Minimum hit target 44pt.

## Stack (RECOMMENDATION — the design does not dictate it)
React Native + Expo (TypeScript strict), `react-native-svg` (`SvgXml`), `react-native-reanimated` v3+, `expo-haptics`,
`@expo-google-fonts/geist`, `@expo-google-fonts/geist-mono`, `@expo-google-fonts/doto`, `expo-router` (or React Navigation).
Data provider and wallet connection are **undecided**: see "Open decisions" in `docs/CUBBY_SPEC.md`. Build behind interfaces so they can be swapped.

## Suggested folder layout (matches this kit)
```
src/theme/tokens.ts        colours, type, radius, space, motion, level/label helpers
src/art/svgs.ts            GENERATED from assets/svg/**  (do not hand-edit)
src/art/Art.tsx            <Cubby/> <Sticker/> <Icon/> <ChartShape/> <CubbyMark/> <UniverseCardArt/>
src/motion/motion.ts       Reanimated presets (rise, pop, float, draw, count-up, press...)
src/motion/Confetti.tsx    milestone confetti (26 pieces)
src/data/demoWallet.ts     typed demo data copied from the mockups ("rishabh.eth")
assets/svg/**              source SVGs (same art, as files)
```
Add: `src/screens/*`, `src/components/*` (Card, Button, Chip, Segmented, TabBar, Row...), `src/services/*` (wallet, prices, activity).

## How to work
1. Scaffold the Expo app, install deps, load fonts, wire `ThemeProvider` from `tokens.ts`.
2. Build in the milestone order in `docs/CUBBY_SPEC.md` §12. Ship each milestone against the **demo wallet** first, then wire real data.
3. For each screen: copy strings verbatim from the spec, use the demo data types, add the animations listed for that screen.
4. Definition of done for a screen: matches spec copy, light + dark, all listed states, animations + reduced-motion path, 44pt targets, screen-reader labels.
5. If something is marked **NOT DESIGNED** or **RECOMMENDATION** in the docs, make the smallest sensible choice, note it in a `DECISIONS.md`, and keep going.

## Regenerating `svgs.ts`
`assets/svg/**` is the source of truth. If an SVG changes, rebuild `src/art/svgs.ts` (a simple script that reads each file into a string map, keyed by file name with `-` → `_`).
