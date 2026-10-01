# Cubby — smooth, iOS-native "butter" animation guide

How to make every interaction in Cubby feel like a first-party iOS app: instant response, no dropped frames, motion that follows your finger and never fights it.
Read with `ANIMATIONS.md` (what animates where) and `TAB_BAR_ANIMATION.md` (the worked example). Code: `src/motion/springs.ts`, `src/motion/AnimatedNumber.tsx`, `src/motion/motion.ts`.

Labels: **DESIGNED** = from the boards. **RECOMMENDED** = my choice to reach the iOS feel. The boards only specify the CSS timings in `ANIMATIONS.md`; this guide upgrades them to native-feeling springs and adds the gesture, performance and navigation rules the boards can't show.

---

## 0. The 12 rules (print these)

1. **Springs, not tweens, for anything the user touches.** A tween has a fixed end time; a spring has momentum and can be interrupted. iOS is springs everywhere.
2. **Respond on touch-DOWN**, not on release. Visual feedback within one frame (≤ 16 ms).
3. **Interruptible always.** Re-target a shared value; never reset it, never queue. Velocity carries over.
4. **UI thread only.** Reanimated shared values + worklets. No `setState` per frame, no `runOnJS` per frame.
5. **Animate `transform` and `opacity`.** Layout props (`width`, `height`, `top`) only on tiny views, and never in lists.
6. **Direct manipulation:** while dragging, the object tracks the finger 1:1. On release, spring to rest **using the finger's release velocity**.
7. **Small movement, big feel.** 8–16 px translations, 0.96–0.98 press scale. Overshoot ≤ 6% (except stickers).
8. **Enter slower than exit.** Exit ≈ 0.7× the enter duration.
9. **Stagger ≤ 40 ms per item, ≤ 8 items.** Everything after the first screenful appears without animation.
10. **Use native navigation** (UINavigationController via native-stack): swipe-back, parallax and sheets come free and are *exactly* iOS.
11. **Haptics at commit moments only** (selection change, success), never per frame.
12. **Verify on a real iPhone, Release build, ProMotion on.** The simulator and Debug builds lie.

---

## 1. What the iOS feel is made of

| Ingredient | In practice |
|---|---|
| **Continuity** | Objects never teleport or restart. A new tap in mid-flight bends the existing motion |
| **Momentum** | Releasing a drag continues with the finger's velocity (`withDecay`, `withSpring({ velocity })`) |
| **Rubber-banding** | Dragging past a limit resists progressively, then springs back (`rubberBand()` helper) |
| **Physical response** | Press-down shrinks/sinks immediately; release springs back with a hair of overshoot |
| **Hierarchy of motion** | The thing you touched moves most; context (background, siblings) moves least or just fades |
| **Quiet money, playful edges** | Balances, deltas, rows: calm, no bounce. Stickers, mascot, milestones: `bouncy` and confetti (design rule) |
| **Restraint** | No motion without a cause. Loops only on decorative art |

---

## 2. Springs (RECOMMENDED vocabulary, `src/motion/springs.ts`)

Defined the way Apple does: **response** (speed) and **damping fraction** (1 = no bounce). Converted for Reanimated: `stiffness = (2π/response)²`, `damping = 4π·fraction/response`, `mass = 1`.

| Name | Response | Damping | stiffness / damping | Feel | Use it for |
|---|---|---|---|---|---|
| `smooth` | 0.50 | 1.00 | 158 / 25.1 | Silky, no bounce | Moving panels, hide/show, cards re-ordering, default chrome |
| `snappy` | 0.42 | 0.86 | 224 / 25.7 | Quick, tiny settle | **Tab bar pill**, segmented/chip indicators, toggles |
| `bouncy` | 0.50 | 0.70 | 158 / 17.6 | Playful | Stickers, mascot level-up, celebratory pops **only** |
| `gentle` | 0.60 | 1.00 | 110 / 20.9 | Slow, soft | Big surfaces: Universe zoom, full-screen reveals |
| `press` | 0.22 | 0.90 | 816 / 51.4 | Instant | Press-down / press-up scale and sink |
| `interactive` | 0.15 | 0.86 | 1755 / 72.0 | Tight follower | Following a finger while dragging (SwiftUI `interactiveSpring`) |
| `sheet` | 0.45 | 0.92 | 195 / 25.7 | Settling | Bottom sheet / tray after a drag |
| `standard` | 0.50 | 0.825 | 158 / 20.7 | Apple's default `.spring()` | Anything unspecified |

```ts
import { spring, springs } from '@/src/motion/springs';
x.value = spring(1, 'snappy');                     // helper
x.value = withSpring(1, springs.snappy);           // or directly
x.value = spring(0, 'sheet', event.velocityY);     // hand the release velocity to the spring
```
Thresholds are preset (`restDisplacementThreshold .01`, `restSpeedThreshold .5`), so a spring stops cleanly instead of "settling" invisibly for a second.

The design's own spring token (`damping 18, stiffness 200` ≈ response .44, fraction .64) is bouncier than UI chrome should be. Keep it only for sticker settle; use `snappy`/`smooth` elsewhere.

---

## 3. Timing curves and durations (for things nobody is touching)

| Token | Value | Use |
|---|---|---|
| `curves.easeOut` | cubic-bezier(.22, 1, .36, 1) (**DESIGNED**, default) | Entrances, fades, bars filling |
| `curves.easeInOut` | cubic-bezier(.42, 0, .58, 1) | Symmetric moves with no touch |
| `curves.easeIn` | cubic-bezier(.5, 0, .75, 0) | Exits (leaving accelerates away) |
| `curves.draw` | cubic-bezier(.65, 0, .35, 1) (**DESIGNED**) | Chart line draw |

| Size of change | Duration |
|---|---|
| Micro (colour, opacity, press) | 100–150 ms |
| Small (chip, badge, row) | 200–250 ms |
| Medium (card, sheet content) | 300–350 ms |
| Large (screen-level reveal) | 400–500 ms |
| Hero / celebratory | 700 ms+ (design: rise 700, pop 700, draw 1500, count-up 1300) |
| Exit | 0.7 × the enter |

---

## 4. Touch: make it feel instant

**Press feedback (every tappable).**
- Scale to **0.97** (cards, rows) or **0.92** (icon buttons) on touch-down with `springs.press`; back on release/cancel.
- Tactile buttons (design): sink **3 px** + hard shadow collapses (`usePressSink`, now spring-based).
- Do it in `onPressIn`. If the press is on a scroll view, RN delays `onPressIn` slightly to see if it's a scroll: keep it (that's the iOS behaviour) and don't add extra `delayPressIn`.
- Highlight rows with a **surface2 flash**, not an opacity dip to 0.5 (looks Android-y).

**Hit targets.** ≥ 44 pt everywhere (48 on the tab bar), `hitSlop` for icons.

**Drag with velocity handoff (pattern).**
```tsx
const y = useSharedValue(0);
const pan = Gesture.Pan()
  .onUpdate((e) => {
    // 1:1 inside bounds, rubber-band beyond
    y.value = e.translationY < 0 ? rubberBand(e.translationY, 600) : e.translationY;
  })
  .onEnd((e) => {
    const shouldClose = e.translationY > 120 || e.velocityY > 900;
    y.value = withSpring(shouldClose ? 600 : 0, { ...springs.sheet, velocity: e.velocityY });
    if (shouldClose) runOnJS(close)();
  });
```
`rubberBand(offset, dimension, c = 0.55)` is Apple's UIScrollView formula.

**Gestures run on the UI thread** with `react-native-gesture-handler` (`Gesture.Tap/Pan/LongPress`). Prefer them over `PanResponder` for anything draggable.

---

## 5. Cubby catalogue upgraded to the native feel

| Element | Design (CSS) | Native-feel implementation (RECOMMENDED) |
|---|---|---|
| **Tab bar pill** | static boards | `FloatingTabBar`: one float `pos`, `snappy` spring. See `TAB_BAR_ANIMATION.md` |
| **Range control** `1D 1W 1M…` | bg/colour 240 ms | One ink indicator (`translateX` + `width`) springing with `snappy` under the labels; label colour cross-fades (same trick as the tab pill). Haptic `select` |
| **Chain / activity chips** | bg 240 ms | Same press scale; selected fill cross-fade 200 ms `easeOut`. Haptic `select` |
| **Card / section enter** | rise .7s | `entering={FadeInDown.duration(500).easing(curves.easeOut)}` or `useRise`; translateY **12–16**, opacity. Only on first mount |
| **List rows enter** | stagger 40 ms | First 8 rows: delay `index*40`; later rows: none. Don't re-animate when the list re-renders or a cell recycles |
| **List changes** (filter chips, revoke) | none | `Animated.FlatList itemLayoutAnimation={LinearTransition.springify().damping(24).stiffness(220)}`. Items slide to their new place; exits `FadeOut.duration(150)` |
| **Net-worth count-up** | 1.3 s easeOutQuart | `<AnimatedDollars/>` (UI-thread text). Tabular numerals so digits don't jitter. Start after the first frame |
| **Range change on Home** | instant | Number cross-fades 150 ms (not a re-count); chart morphs path 350 ms `easeInOut` (Skia path interpolation, or fade-swap with SVG) |
| **Chart draw** | 1.5 s dash | `useDrawProps` (SVG) is fine for a single path. For butter + touch scrubbing, move to `@shopify/react-native-skia` |
| **Universe fly-in** | .9 s ease | `gentle` spring on a single stage `transform` (translate+scale); non-focused planets fade 300 ms; haptic `soft` when focus lands. Back = same spring reversed |
| **Planet float** | loops 4.6 s+ | `withRepeat` sine, **transform only**; pause when the screen isn't focused (`useIsFocused`) |
| **Sticker pop / unlock** | pop .7 s | `bouncy` spring on scale 0.6→1 + rotate −8→0; haptic `success`; confetti starts at pop peak |
| **Health score bar** | width .7 s | Animate `scaleX` from the left (set `transformOrigin: 'left'` or translate trick) with `smooth`, not width, if it sits in a list |
| **Revoke → row settles** | opacity/bg .4 s | Row opacity→.6 + tint cross-fade 250 ms, check icon `pop`, score number ticks with a 300 ms count, haptic `success`; row doesn't move |
| **Level change** (mascot) | none | Old mascot scales 1→0.9 & fades 150 ms; new one `bouncy` pop; haptic `success` |
| **Screen push** (Asset detail etc.) | n/a | native-stack `slide_from_right` (the real iOS push + swipe-back). Don't hand-roll |
| **Modal screens** (Recap, Milestone) | n/a | `presentation: 'fullScreenModal'` with `animation: 'fade_from_bottom'` or a custom slide-up; swipe-to-dismiss for Recap |
| **Sheets** (Universe detail, filters) | n/a | `presentation: 'formSheet'` with `sheetAllowedDetents: [0.4, 1]` → real iOS sheet with detents and grabber. Custom: `Gesture.Pan` + `springs.sheet` |
| **Recap stories** | segments .4 s | Tap right/left to advance; progress bar 5 s linear per card (pause on press-and-hold, iOS Stories style); card transition = cross-fade 250 ms + 12 px translate |
| **Skeleton** | shimmer 1.4 s | `useShimmer` (transform on a gradient). Cross-fade skeleton → content 250 ms; never pop |
| **Pull to refresh** | n/a | Native `RefreshControl` (iOS spinner). Don't build a custom one |
| **Large title / header collapse** | n/a | `useAnimatedScrollHandler` / `useScrollViewOffset`: title scale 1→0.8, opacity, translate interpolated from scroll offset (clamped); no springs, it's scroll-linked |
| **Toast / banner** | n/a | Slides from top 16 px + fade, `smooth` spring in, 0.7× out; auto-dismiss 3 s; swipe up to dismiss |
| **Empty state nudge** | nudge 1.2 s | Keep loop; stop when screen loses focus; reduced motion: none |
| **Keyboard (Paste address)** | n/a | `react-native-keyboard-controller` so the sheet follows the keyboard frame-for-frame |

---

## 6. Recipes (copy-paste)

**Spring button press**
```tsx
function Pressy({ children, onPress }: { children: React.ReactNode; onPress: () => void }) {
  const s = useSharedValue(0);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: 1 - s.value * 0.03 }] }));
  return (
    <Pressable
      onPressIn={() => { s.value = withSpring(1, springs.press); }}
      onPressOut={() => { s.value = withSpring(0, springs.press); }}
      onPress={() => { haptic.tap(); onPress(); }}
    >
      <Animated.View style={style}>{children}</Animated.View>
    </Pressable>
  );
}
```

**Segmented control indicator** (same idea as the tab pill)
```tsx
const idx = useSharedValue(0);                      // float index
const ind = useAnimatedStyle(() => ({
  width: segW,                                      // constant width per segment
  transform: [{ translateX: idx.value * (segW + gap) }],
}));
const select = (i: number) => { haptic.select(); idx.value = withSpring(i, springs.snappy); onChange(i); };
```

**Row entering (first 8 only, first mount only)**
```tsx
<Animated.View entering={index < 8 && firstMount ? FadeInDown.delay(index * 40).duration(450).easing(curves.easeOut) : undefined} />
```

**Hero number**
```tsx
<AnimatedDollars value={24821.42} dollarStyle={styles.doto62} centsStyle={styles.doto30} />
```

**Scroll-linked header**
```tsx
const y = useSharedValue(0);
const onScroll = useAnimatedScrollHandler((e) => { y.value = e.contentOffset.y; });
const title = useAnimatedStyle(() => ({
  opacity: interpolate(y.value, [0, 60], [1, 0], Extrapolation.CLAMP),
  transform: [{ translateY: interpolate(y.value, [0, 60], [0, -8], Extrapolation.CLAMP) }],
}));
```

**Interrupt-safe toggle** (never do `sv.value = 0; sv.value = withSpring(1)`; the reset is the glitch)
```tsx
sv.value = withSpring(open ? 1 : 0, springs.smooth);   // re-target only
```

---

## 7. Navigation transitions (use the platform)

- **Stack:** `expo-router` `Stack` / `@react-navigation/native-stack`. Native push, native interactive swipe-back, native large titles. `animation: 'default'` on iOS is the real thing. Do not use the JS stack.
- **Tabs:** tab content cross-fades (`animation: 'fade'`, ~180 ms); the tab pill is the motion.
- **Modals:** `presentation: 'modal'` (card-style sheet with the iOS parallax) for Connect wallet; `'fullScreenModal'` for Recap/Milestone; `'formSheet'` + detents for small sheets.
- **Shared-element feel** (Universe planet → Assets): don't use a shared transition library. Zoom the planet (spring), then push; the cross-fade hides the seam. RECOMMENDED.
- Keep transitions **< 400 ms** and never block input while they play.

---

## 8. Performance rules (the real "butter")

Frame budget: **16.6 ms at 60 Hz, 8.3 ms at 120 Hz**. The UI thread must stay under it; the JS thread should be idle while animating.

| Do | Don't |
|---|---|
| Reanimated shared values + `useAnimatedStyle` / `useAnimatedProps` | `setState`, `Animated` JS-driven values, or `runOnJS` inside a frame loop |
| Animate `transform`, `opacity` | Animate `width/height/top/left` on large trees or in lists |
| `Animated.FlatList` / `FlashList` with stable `keyExtractor`, memoized rows | Re-creating row components or inline objects each render |
| One shared value driving many derived styles (the tab bar pattern) | Many independent timers that must stay in sync |
| Pre-render icons/SVG once; memoize `SvgXml` for animated screens | Re-parsing big SVG strings per render (the mascot SVGs are ~15–19 KB: convert the ones that animate to components with SVGR / `react-native-svg-transformer`, or render once and animate the wrapper `View`) |
| Pause loops when the screen isn't focused or the app is backgrounded | Infinite loops on screens that aren't visible |
| Pre-load fonts and images before the first animated frame | Layout shifts when fonts load mid-animation |
| Keep worklets small; precompute constants outside | `console.log`, big array allocations, or closures over large objects in worklets |
| `shadow*` on a static wrapper | Animating shadow radius/opacity every frame |
| Use Skia for charts that scrub/morph with touch | Re-drawing 100s of SVG nodes at 60 fps |

**Known soft spots in this kit (and the fix):**
- `useCountUp` (motion.ts) re-renders React each frame → use **`AnimatedDollars`** (UI thread). Kept only for tests.
- `FloatingTabBar` animates **width** on 5 small views. Fine on all current iPhones. If you ever see JS-thread hitches on old devices, switch to fixed-width slots (sized for the widest label) and animate only the pill (`translateX` + `width`) plus the label opacity.
- Stickers are `SvgXml` pixel art with 400+ `<rect>`s. Fine static or with a wrapper transform; avoid animating the SVG's internals.
- Confetti: 26 `Animated.View`s with transform+opacity. OK. Don't raise the count above ~60 without Skia.

---

## 9. Device and build setup for 120 Hz butter

1. **ProMotion:** iPhone Pro models need `CADisableMinimumFrameDurationOnPhone = true` in Info.plist, or animations are capped at 60 fps. Expo: `app.json → expo.ios.infoPlist: { "CADisableMinimumFrameDurationOnPhone": true }`.
2. **Hermes** on (default), **New Architecture (Fabric)** on, latest Reanimated (3.16+ / 4.x) with its Babel plugin last in `plugins`.
3. **Release / production build** (`npx expo run:ios --configuration Release` or EAS) when judging feel. Debug builds run the JS thread 3–10× slower and make everything look janky.
4. Test on the **oldest phone you support** (e.g. iPhone 11/12) and a ProMotion phone. Turn on **Low Power Mode** too (caps to 30/60 Hz).
5. Profiling: Perf Monitor (shake menu → UI fps and JS fps both ~60/120 while animating), Xcode Instruments → Core Animation, React DevTools Profiler (no re-renders during an animation).

---

## 10. Reduce Motion and accessibility

Design rule: **fades only, confetti becomes a static sticker, haptics still confirm.**
- Every hook checks `useReducedMotion()`. In reduced mode: no translate/scale/rotate/loops; entrances are 200 ms opacity fades; springs become instant sets or short fades; count-up shows the final number.
- iOS "Prefer Cross-Fade Transitions": use `animation: 'fade'` for stack/modal transitions when `useReducedMotion()`.
- Never convey state by motion alone (the tab pill also changes label + colour; deltas have `▲▼—`).
- Don't autoplay anything > 5 s without a pause (Recap pauses on press-and-hold).
- Screen-reader users: announce changes that animation implies (`AccessibilityInfo.announceForAccessibility('Revoked')`).

## 11. Haptics map (RECOMMENDED; `haptic.*` in springs.ts)

| Moment | Call |
|---|---|
| Button / row tap | `haptic.tap()` Light impact (on commit) |
| Tab / chip / range / segmented change | `haptic.select()` selection tick |
| Revoke confirmed, sticker unlocked, level up, milestone | `haptic.success()` |
| Failed action (swap failed, connect failed) | `haptic.error()` |
| Drag crossing a snap/detent, Universe planet focus | `haptic.soft()` |
| Count-up, scrolling, chart scrubbing | none (scrub: `selectionAsync` per data point max once per 60 ms) |

---

## 12. "Butter test" QA (do all on device)

1. **Touch-down test:** tap-and-hold every button: reaction visible before you lift.
2. **Interrupt test:** tap tab 1→4 then 2 mid-flight; open/close a sheet rapidly; no jump, no stuck state.
3. **Velocity test:** flick a sheet down hard vs. slowly: both settle naturally; flick Universe nodes.
4. **Rubber-band test:** drag a sheet up past its limit: resists, springs back.
5. **Scroll test:** scroll Home fast with the count-up still running: no hitch.
6. **Cold open:** Home count-up + chart draw + card stagger at once: still 60/120 fps.
7. **Low-end test:** oldest supported phone, Release build.
8. **Reduce Motion test:** everything fades, nothing slides, haptics still fire.
9. **Dark/light switch mid-animation:** no flash.
10. **Background/foreground:** loops pause and resume without a jump.
11. **Font scaling (largest):** nothing clips during animation.
12. **Eyeball slow-mo:** record the screen at 60/120 fps and step through frames: no frame where two elements overlap incorrectly (e.g. ink icon on black).

## 13. Anti-patterns (don't)

- Linear easing for UI (except spinners/shimmer). Easing that starts fast and ends with a hard stop on a touched object.
- Bounce on money, deltas, tab bar, lists. Bounce only on stickers/mascot.
- Animating on release instead of touch-down.
- Resetting a shared value before animating it.
- `setTimeout` choreography, `Animated.sequence` chains that can't be interrupted.
- Staggering 30 rows; re-animating rows every re-render.
- Different durations/curves per screen. Use the tokens.
- Custom page transitions that replace the native stack's swipe-back.
- Animating something just because you can.

## 14. Migration map: what to swap in `motion.ts` / screens

| Old (design CSS / first pass) | New |
|---|---|
| `usePressSink` 120 ms tween | now `springs.press` (already done in this kit) |
| `useCountUp` (JS thread) | `AnimatedDollars` |
| `useTimingTo` for chips / segmented | a `pos` float with `springs.snappy` (see recipes) |
| `motion.spring {damping 18, stiffness 200}` | `springs.smooth` for chrome, `springs.bouncy` for stickers |
| Universe `.9s ease-out` | `springs.gentle` |
| Health bar `width .7s` | `scaleX` + `springs.smooth` |
| Stack/tab custom transitions | native-stack + `animation: 'fade'` on tabs |
| Loops that never pause | stop on blur / background |
