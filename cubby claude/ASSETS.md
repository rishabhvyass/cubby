# Cubby — asset index

All art was extracted **byte-for-byte** from the design boards. 37 SVG files, each valid XML. Two ways to use them:

- **In React Native:** `import { Cubby, Sticker, Icon, CubbyMark, ChartShape, UniverseCardArt } from './src/art/Art'` (renders the SVG strings in `src/art/svgs.ts` with `react-native-svg`).
- **As files:** `assets/svg/**` (web, docs, marketing, share cards). `assets/preview.html` / `assets/preview.png` show everything on one sheet. `assets/manifest.json` maps every file to a description.

`src/art/svgs.ts` is generated from `assets/svg/`. Keys use underscores (`clean_sweep`, `arrow_right`, `cubby_mark_currentcolor`, `universe_card_art`); mascot keys are `1`–`4` and chart keys are the range (`'1W'`).

Do **not** redraw these. If you need a new sticker or icon, match the existing style and add it to `assets/svg/` + regenerate `svgs.ts`.

---

## 1. Mascot — Cubby the vault (`assets/svg/mascot/`)

A voxel vault, 61×80 (level 4: 61×93 because of the crown). Level follows the **Health score**.

| File | Level | Score range | Notes |
|---|---|---|---|
| `cubby-level-1.svg` | 1 | < 60 | Neutral grey accent |
| `cubby-level-2.svg` | 2 | 60–79 | Amber accent |
| `cubby-level-3.svg` | 3 | 80–89 | Lime accent |
| `cubby-level-4.svg` | 4 | ≥ 90 | Lime accent + gold crown |

Levels 1–3 share the same body; the accent colour changes. Level 4 adds the crown.
```tsx
<Cubby level={3} height={80} />
<CubbyForScore score={82} height={120} />   // picks the level via levelForScore()
```
Where: Welcome (float 6s), Home level card, Health hero, Empty wallet (level 1 art recommended), Recap best-move card. Animation: `useFloat` + `usePop` when the level changes.

---

## 2. Stickers (`assets/svg/stickers/`)

Pixel art on a die-cut white edge, drawn on a pixel grid with `shape-rendering="crispEdges"`. **Earned, never bought.** They celebrate care and milestones, never trades or price moves.

| Key (code) | File | Natural size | Title | Unlock rule |
|---|---|---|---|---|
| `hello` | `hello.svg` | 85×90 | Hello | Connect a first wallet |
| `clean_sweep` | `clean-sweep.svg` | 90×100 | Clean sweep | Revoke a risky approval |
| `backed_up` | `backed-up.svg` | 83.6×61.6 | Backed up | Confirm a seed backup |
| `steady` | `steady.svg` | 85×85 | Steady | 12 weekly check-ins |
| `one_year` | `one-year.svg` | 87.4×87.4 | One year | A year on-chain |
| `explorer` | `explorer.svg` | 80×68 | Explorer | Assets on 5 chains |
| `first_yield` | `first-yield.svg` | 67.2×91.2 | First yield | First DeFi position |

Visual motif of each (as it appears in the preview sheet): coin, shield, key, heart, star, planet, bolt. Match by file name, not by motif.

The sticker book has **12 slots**; only these 7 are designed. The other 5 and the locked-slot look are **NOT DESIGNED**.

```tsx
<Sticker name="clean_sweep" height={100} />       // natural size
<Sticker name="one_year" height={87.4 * 2} />      // 2× keeps pixels crisp
stickerMeta.steady                                 // { title, how }
```
Rules: no smoothing or blur; scale by integer multiples where possible; only tilt by the design's own amounts (`useFloat` tilt, `useWobble`).

---

## 3. Icons (`assets/svg/icons/`) — 18, 24×24, `currentColor`

Stroke icons (2px, round caps) except `play`, which is a filled glyph. Colour with the `color` prop.

| Group | Names |
|---|---|
| Tab bar | `home`, `assets`, `activity`, `health` |
| Navigation | `back`, `arrow-right`, `chevron-down`, `close` |
| Direction / delta | `arrow-up`, `arrow-down` |
| Status | `check`, `lock` |
| Activity kinds | `swap`, `receive`, `send`, `mint`, `stake` |
| Media | `play` (recap / replay) |

```tsx
<Icon name="swap" size={22} color={palette.text} />   // key uses underscore form for multiword: 'arrow_right', 'chevron_down'
```
Activity-kind → icon: swap→`swap`, send→`send`, receive→`receive`, mint→`mint`, stake→`stake`.
Icons are never the *only* carrier of status; pair with text or the `▲ ▼ — ● ✕ ✓` glyphs.

---

## 4. Brand (`assets/svg/brand/`)

| File | Use |
|---|---|
| `cubby-mark.svg` | Cube logo, lime top face (44×44 box, 24 viewBox). Welcome header, app icon base |
| `cubby-mark-currentcolor.svg` | Single-colour version, follows `color`. Renders all-ink; use where a mono mark is required |

```tsx
<CubbyMark size={26} />            // full colour
<CubbyMark size={26} mono color="#F5F5F5" />
```
Wordmark is set in type: lowercase **cubby**, Geist. The app icon and launch screen are **NOT DESIGNED** beyond the mark. The design's social avatar uses the cube on lime.

---

## 5. Chart shapes (`assets/svg/chart/net-worth-{1D,1W,1M,3M,1Y,ALL}.svg`)

342×150 reference drawings of the Home net-worth chart: smooth bezier line (ink, 2px), lime gradient area beneath, end dot. They show what each range should *look like*.

```tsx
<ChartShape range="1W" width={342} />
```
In the real app, **build the path from price data** (map points to the 342×150 box, smooth with a monotone cubic/catmull-rom, close the area to the baseline) and animate with `useDrawProps` + `useFade` + `usePulseProps` (see `ANIMATIONS.md`). Real path generation is NOT DESIGNED.

---

## 6. Misc

| File | Use |
|---|---|
| `misc/universe-card-art.svg` (72×56) | Planet-and-orbit art on the Home "Universe" card. Rotates slowly (`useSpin`, 18s) |

Universe planets themselves are plain circles in code (asset-palette fills, ink labels), not SVG files. Positions and sizes: `universe` in `src/data/demoWallet.ts`.

---

## 7. Palette used by art (see `assetPalette` in tokens)

| Asset | Hex | Used for |
|---|---|---|
| ETH | `#B8FF4A` (lime) | planet, tile, allocation dot |
| USDC | `#8FC4FF` | ″ |
| BTC | `#FFC94A` | ″ |
| NFT / POL | `#FF9A9A` | ″ |
| DeFi / SOL | `#E8E4FF` | ″ |

Always put ink (`#0A0A0A`) text on these fills. Never use them as small text on light backgrounds.

---

## 8. Fonts (not bundled — install from Google Fonts packages)

| Role | Font | Where |
|---|---|---|
| UI | **Geist** (400/500/600; the design's 650 maps to `600` on RN) | Everything |
| Mono | **Geist Mono** | Addresses (`0x4f…c21`), block numbers, hashes |
| Numerals | **Doto** 900 | Net worth, health score, recap stats **only** |

`npx expo install @expo-google-fonts/geist @expo-google-fonts/geist-mono @expo-google-fonts/doto expo-font`

---

## 9. Not included / not designed
Sticker slots 8–12 · locked-sticker style · app icon & splash · notification art · share-card template · per-token logos (the design uses coloured monogram tiles, e.g. `ETH`, `BA`, `AR`, `SO`, `PO`, `M`, `W`, `C`, `P`) · NFT artwork (comes from the NFT provider) · Ask/AI illustrations.
