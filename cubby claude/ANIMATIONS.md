# Cubby — animation catalogue

Every animation in the design, with timing, easing, where it's used, and the ready-made hook. Code: `src/motion/motion.ts` and `src/motion/Confetti.tsx`. Timings live in `motion` in `src/theme/tokens.ts`.

Principle: **the rarer the moment, the more joy.** Money screens get only a count-up and a chart that draws itself. Loops (float, wobble, nudge, spin, pulse) are for decorative art, never for balances.

> Everything is copied from the design's CSS keyframes/transitions unless marked *(RECOMMENDED)*, which means the design implies the behaviour but gives no timing.

## 1. Easing & timing tokens

| Token | Value | Use |
|---|---|---|
| `easeOut` | `cubic-bezier(.22, 1, .36, 1)` | Default for the whole app (enters, presses, chips, zoom) |
| `easeInOut` | `cubic-bezier(.65, 0, .35, 1)` | Chart line drawing |
| `easeFall` | `cubic-bezier(.3, .1, .6, 1)` | Confetti |
| `sine` (CSS `ease-in-out`) | | Loops (float, wobble, nudge) |
| `press` | 120 ms | Button sink |
| `state` | 240 ms | Chips, range control, tab label, radio rows |
| `riseRow` | 550 ms | Row entrances |
| `rise` / `pop` | 700 ms | Card entrances / sticker pop |
| `fade` | 900 ms | Slow fades |
| `draw` | 1500 ms | Chart draw-in |
| `countUp` | 1300 ms | Net-worth count-up |
| `universeZoom` | 900 ms | Planet fly-in |
| `scoreBar` | 700 ms | Health progress bar |
| `spring` | damping 18, stiffness 200 | Physical things (RECOMMENDATION for sticker settle, trays, Universe zoom if you prefer a spring over the .9s ease) |

## 2. Entrance animations (play once)

| Name (design keyframe) | Motion | Duration / easing | Where | Hook |
|---|---|---|---|---|
| **rise** (`nx-rise`) | opacity 0→1, translateY 16→0 | .7s ease-out, `both` | Cards, headings, story card, sections on every screen | `useRise(delayMs)` |
| **row** (`nx-rise` .55s) | same as rise, staggered **40 ms** per row (2nd = .04s, 3rd = .08s …) | .55s ease-out | List rows: assets, activity, approvals, chains | `useRow(index)` |
| **pop** (`nx-pop`) | scale .6→1.06→1, rotate −8°→2°→0, opacity 0→1 by 60% | .7s ease-out | Stickers, mascot, sticker-unlock card, milestone sticker | `usePop(delayMs)` |
| **pop (small)** | same, shorter | .6s, **delay 1.2s** | The newly added sticker in the Milestone screen's "Sticker book · 6 of 12" strip | `usePop(1200, 600)` |
| **fade** (`nx-fade`) | opacity 0→1 | .9s ease-out | Chart gradient area (delay .7s), chart end dot (delay 1.4s), soft fills | `useFade(delayMs)` |
| **grow** (`nx-grow`) | width 0→full, from the left | .9s ease-out, **delay .8s** | "This week's story" attribution bar segments | `useGrowWidth(target, 800)` |
| **draw** (`nx-draw`) | stroke-dashoffset 1400→0 | 1.5s `easeInOut`, delay .1s | Net-worth chart line draws itself | `useDrawProps()` on `AnimatedPath` with `strokeDasharray={1400}` |
| **count-up** | number 0→target, easeOutQuart `1-(1-k)^4` | 1.3s | Home net worth hero, on **every open**. Dollars and cents split: `$24,821` + `.42` | `useCountUp(target)` + `splitDollars(v)` |

Chart choreography on Home (in order): line draws (0.1s → 1.6s) → gradient area fades in (0.7s) → end dot fades in (1.4s) → pulse ring starts (1.6s).

## 3. Looping animations (decorative)

| Name | Motion | Period / easing | Where | Hook |
|---|---|---|---|---|
| **float** (`nx-float`) | translateY 0→−8→0; the element keeps its own tilt | Mascot **6s**; welcome stickers **5s**; Universe planets **4.6s + i×0.8s** (i = planet index) | Welcome stickers, Cubby mascot, Universe planets | `useFloat({ tiltDeg, durationMs, delayMs })` |
| **wobble** (`nx-wobble`) | rotate −4°↔4° | Health "risky" flag **1.6s**; Milestone sticker **3.2s**, ease-in-out | Health risky-approval flag; the big sticker on Milestone (after its pop-in) | `useWobble(durationMs)` |
| **nudge** (`nx-nudge`) | translateY 0→6→0 | 1.2s ease-in-out | The "receive" arrow on the Empty wallet screen | `useNudge()` |
| **spin** (`nx-spin`) | rotate 0→360° | 18s linear | Slow orbit art on the Home Universe card | `useSpin()` |
| **pulse** (`nx-pulse`) | ring radius 5→16, opacity .7→0 | 2.2s ease-out, starts at **1.6s**, infinite | Live end-dot on the Home chart | `usePulseProps()` on `AnimatedCircle` |
| **shimmer** (`nx-shimmer`) | highlight sweeps −200→+200px | 1.4s linear, infinite | Skeleton loading blocks (V1 States board; dark base `#111` → `#1C1C1C`). Light-mode colours are a RECOMMENDATION | `useShimmer()` |

## 4. Interaction transitions

| Interaction | Motion | Timing | Where | Code |
|---|---|---|---|---|
| **Button press** | Sinks **3px**, hard shadow collapses (primary shadow 4px, secondary 3px) | 120 ms ease-out | All buttons (Connect wallet, Watch address, Revoke, Receive…) | `usePressSink()` + `expo-haptics` Light impact |
| **Chip / range / segmented select** | Background + text colour cross-fade to ink/bone | 240 ms ease-out | Range control (1D…ALL), chain chips, activity filters | `useTimingTo(target, motion.state)` |
| **Radio row select** | Border 2px + fill + lime tick fade | 240 ms | Connect wallet list | same |
| **Tab bar** *(RECOMMENDED timing)* | Active tab grows a text label next to its icon (design states the behaviour, not the duration) | 240 ms | Floating tab bar | `useTimingTo` on width |
| **Health score bar** | Fill width to `{score}%` | 700 ms ease-out | Health screen; animates when a revoke raises the score | `useTimingTo(score/100, motion.scoreBar)` |
| **Approval revoked** | Row dims to 60% opacity, red tint/border → neutral, "Revoked" + check appears | 400 ms opacity + background | Health approvals | `useTimingTo(…, 400)` |
| **Level change** *(RECOMMENDED)* | Mascot swaps level art with a **pop** | 700 ms | Health / Home level card when score crosses 60/80/90 | `usePop()` on the new `<Cubby level>` |
| **Recap progress segments** | Segment width 0→100% | 400 ms | Recap top bar as cards advance | `useTimingTo(…, 400)` |
| **Universe fly-in** | Stage `translate(−x·2.5, −y·2.5 − 110) scale(2.5)` on a 390×520 stage | 900 ms ease-out (or `physicalSpring`) | Tapping a planet | `universeStage(focus)` |
| **Universe dim** | Non-focused planets opacity →0; rings/centre dim to .06 | 500 ms | Same tap; "Back to orbit" reverses | `useTimingTo(…, 500)` |
| **Detail sheet** *(RECOMMENDED)* | Rises in after the zoom | rise 700 ms | Universe detail (name, value, delta, share, Open {K}) | `useRise()` |

## 5. Celebration

**Confetti** (`nx-fall`) — Milestone screen only.
- 26 rectangular pieces, sizes 8/10/12/14 px, colours from the asset palette + ink, each with its own left offset, duration **3.3–5.16 s**, delay **0.14–2.26 s**, **2 iterations**.
- Each piece: translateY −30→340, rotate 0→320°, opacity 0→1 at 10% → 0 at 100%. Easing `easeFall`.
- Container 390×330 at top 60, `overflow: hidden`, `pointerEvents: none`, hidden from screen readers.
- Component: `<Confetti />` (data in `CONFETTI_PIECES`).
- **Never** trigger on a price gain, swap, or balance. Only: new sticker, level up, milestone.

## 6. Screen-by-screen animation checklist

| Screen | On enter | Loops | On interaction |
|---|---|---|---|
| **Welcome** | rise (headline, body, buttons stagger), pop stickers | float on stickers (5s) | button press |
| **Connect** | rise, row stagger | — | radio select 240ms, press |
| **Home** | count-up (1.3s), chart draw, area fade, dot fade, story rise, grow bar (.8s), row stagger | pulse (dot), spin (Universe card), float (mascot 6s) | range switch 240ms, press |
| **Universe** | rise title, planets pop/fade | float per planet (4.6s+i·.8) | fly-in .9s, dim .5s, back |
| **Assets** | rise, row stagger | — | chain chip 240ms |
| **Activity** | rise, row stagger by group | — | filter chip 240ms |
| **Health** | rise, score bar fill 700ms, mascot pop | wobble on risky flag (1.6s) | revoke → row settle 400ms, bar 700ms, sticker card pop, level pop |
| **Milestone** | rise, sticker pop, confetti (2 iterations), small sticker pop @1.2s | wobble on big sticker (3.2s) | press |
| **Empty** | rise, mascot pop | float, nudge on arrow (1.2s) | press |
| **Recap** | rise per card | — | segment 400ms, Next/Prev |

## 7. Reduce Motion (design rule)

> Fades only. Confetti becomes a static sticker. Haptics still confirm.

- Every hook checks `useReducedMotion()`: translate/scale/rotate are removed and loops don't start; entrances become plain opacity fades; the draw shows the finished line; count-up shows the final number at once; `<Confetti />` renders nothing (the screen already shows the static sticker); shimmer becomes a static block.
- Haptics are separate from motion and **remain**: Light impact on press, Success notification on a completed revoke, Success on milestone.
- The web/CSS design has a global `@media (prefers-reduced-motion: reduce){ * { animation: none; transition: none } }`. The RN hooks implement the softer "fades only" version.

## 8. Haptics (RECOMMENDATION — design says only that haptics confirm)
| Moment | `expo-haptics` |
|---|---|
| Any button press | `impactAsync(Light)` |
| Range / chip / tab change | `selectionAsync()` |
| Revoke confirmed | `notificationAsync(Success)` |
| Sticker unlock / milestone | `notificationAsync(Success)` |
| Failed action | `notificationAsync(Error)` |

## 9. Quick usage examples

```tsx
// Card entering with a stagger
const rise = useRise(120);
<Animated.View style={[styles.card, rise]} />

// Sticker pop, then wobble (Milestone)
const pop = usePop(); const wobble = useWobble(3200);
<Animated.View style={pop}><Animated.View style={wobble}><Sticker name="one_year" width={180} /></Animated.View></Animated.View>

// Hero number
const v = useCountUp(24821.42); const { dollars, cents } = splitDollars(v);

// Chart draw + pulse (react-native-svg)
<AnimatedPath d={path} stroke={colors.text} strokeWidth={2} fill="none" strokeDasharray={1400} animatedProps={useDrawProps()} />
<AnimatedCircle cx={342} cy={30.6} stroke={colors.text} fill="none" animatedProps={usePulseProps()} />

// Button press
const { style, shadowStyle, onPressIn, onPressOut } = usePressSink();
```
