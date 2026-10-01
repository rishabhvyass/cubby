# Cubby — floating tab bar animation

Goal: the tab bar should feel like an iOS system control: it responds the instant you touch it, the lime pill **slides and stretches like liquid**, icons change colour exactly as the pill passes under them, and you can tap another tab mid-animation without a glitch.

- Code: `src/components/FloatingTabBar.tsx` (drop-in `tabBar` for expo-router / React Navigation)
- Springs: `src/motion/springs.ts` → `springs.snappy`, `springs.press`, `springs.bouncy`, `springs.smooth`
- Visual proof: `assets/tabbar-filmstrip.png` (frames of Home → Activity, same math as the component)
- General rules behind it: `docs/SMOOTH_ANIMATION.md`

Labels: **DESIGNED** = measured from the boards. **DESIGNED (behaviour only)** = the board says "active tab grows a label" but gives no timing. **RECOMMENDED** = my choice, open to tuning. The boards are static (each tab is a separate artboard), so all *motion* below is RECOMMENDED; all *geometry* is DESIGNED.

---

## 1. Geometry (DESIGNED, measured from V2 boards, light and dark)

| Part | Value |
|---|---|
| Bar | Floating pill, centered horizontally, **bottom 20**, padding **6**, gap **4**, radius **30**, hugs its content |
| Bar colour | `palette.bar` → `#0A0A0A` light, `#161616` dark. Solid, no blur |
| Bar shadow | `0 12 32 rgba(0,0,0,.18)` → iOS `shadowRadius 16, offset (0,12), opacity .18`; Android `elevation 12` |
| Item | Height **48**, radius 24 |
| Inactive item | **48×48** circle area. Icon **21px**, colour `palette.tabInactive` → `#8F8F8A` light / `#8F8F8F` dark |
| Active item | Lime `#B8FF4A` pill. Padding **0 16 0 14**, gap **8**. Icon **20px** in ink `#0A0A0A`. Label **13px**, weight 650 (→ `600` on RN), ink |
| Tabs | Home, Assets, Activity, Health (icons `home`, `assets`, `activity`, `health`) |
| Resulting widths | Bar ≈ 260 (Home) · 268 (Assets) · 274 (Activity) · 268 (Health), estimated from label widths; the real numbers come from measuring the font at runtime. The bar **changes width** with the active tab (label length), and stays centered |
| Hit target | 48×48 minimum (+4 `hitSlop`). Active pill is the full pill width |

Constants live in `TAB` and `TAB_BAR_HEIGHT` (60) / `TAB_BAR_CLEARANCE` (96) in the component.

---

## 2. The idea: one number drives everything

A single shared value **`pos`** is the *float index* of the active tab: `0`=Home … `3`=Health, `1.37` = 37% of the way from Assets to Activity. Tapping a tab only does this:

```ts
pos.value = withSpring(targetIndex, springs.snappy);   // UI thread, keeps velocity if interrupted
```

Everything else is a pure function of `pos`, calculated on the UI thread each frame:

| Thing | Formula (worklet) |
|---|---|
| "Activeness" of item *i* | `a_i = max(0, 1 − |pos − i|)`  (1 on its own index, 0 one step away) |
| Width of item *i* | `48 + a_i · (activeWidth_i − 48)`, where `activeWidth_i = 14 + 20 + 8 + labelWidth_i + 16` |
| Bar width | `12 + 4·(n−1) + Σ width_i` (centered by the parent, so it grows/shrinks symmetrically) |
| Lime pill rect | Linear blend of the rects of the two items `pos` sits between: `left = L_k + f·(w_k + 4)`, `width = w_k·(1−f) + w_{k+1}·f` where `k = floor(pos)`, `f = pos − k`. At every integer `pos` it equals the active item's rect **exactly** |
| Icon colour | Follows the **pill**, not time: ink icon opacity = fraction of the icon covered by lime, grey icon = the rest. Each icon flips colour exactly when the pill passes it. No flash, no invisible ink-on-black moment |
| Label | Opacity `0.4 → 1` of `a_i` (it appears *after* the pill starts widening), `translateX −6 → 0`. Clipped by the item (overflow hidden) so it looks like the pill "reveals" it |

Why this feels buttery:
1. **Interruptible.** Tap Home → Health, then Assets before it lands: `pos` just gets a new target and keeps its velocity. Nothing restarts, nothing jumps.
2. **No orchestration.** No timelines, no `setTimeout`, no per-element animations that can drift apart. They can't desync because there is one clock.
3. **UI thread only.** No React re-render during the animation. The only JS work is the tap itself.
4. **Pill is a transform.** Its position uses `translateX` (no layout). Only item/bar widths use layout props (5 tiny views).

Label widths are measured once with a hidden `Text` using the real font (and capped at Dynamic Type ×1.15, `maxFontSizeMultiplier`), so the pill fits "Activity" exactly in any font.

---

## 3. Timeline: Home → Activity (a 2-step jump), `springs.snappy`

Real values from simulating the spring (`assets/tabbar-filmstrip.png`):

| t (ms) | `pos` | What you see |
|---|---|---|
| 0 | 0.00 | Pill on Home, label "Home" |
| 40 | 0.26 | Pill starts sliding right and shrinking at the left edge; Home icon turns grey as it's uncovered |
| 80 | 0.73 | Pill is mid-way, Assets icon passes under it (turns ink then grey again as pill leaves) |
| 120 | 1.18 | Pill over Assets→Activity; "Activity" label begins to reveal |
| 160 | 1.51 | Pill centred between; widest morph |
| 220 | 1.82 | Settling; label ~90% |
| 300 | 1.97 | Visually done |
| 500 | 2.005 | Overshoot ≈ 0.009 index ≈ 0.5px: imperceptible, but it is what makes it feel *alive* instead of "stopped" |

A single-step move settles in ~250 ms; a 3-step move still ~300 ms (springs scale well). Bar width eases from 260 to 274 along the way.

---

## 4. States and micro-interactions

| State | What happens | How |
|---|---|---|
| **Touch down** (any tab) | Icon scales to **0.90**, instantly | `pressed = withSpring(1, springs.press)` on `onPressIn`. Response `.22`, so it's ~120 ms, never a hard stop |
| **Touch up, cancelled** (finger slides off) | Scale returns to 1 | `onPressOut` |
| **Commit** (tap on a different tab) | `pos` springs to the tab. **Selection haptic fires now** (not on touch-down). Route navigates in the same tick | `haptic.select()`, `goTo(i)` (optimistic, doesn't wait for navigation state), `navigation.navigate` |
| **Arrive** | Active icon does a tiny pop: 1 → 1.14 (`press` spring) → 1 (`bouncy` spring) | `withSequence` on focus |
| **Re-tap the active tab** | No movement. Calls `onReselect(name)` → scroll that screen to top / pop to root. Optional: very light `haptic.tap()` | `onReselect` prop |
| **External navigation** (deep link, back, programmatic) | `pos` springs to the new focused tab, no haptic | `useEffect` on focused index |
| **Hide** (Recap, Milestone, keyboard, full-screen flows) | Bar slides down by `height + bottom + 24` and fades; spring `smooth` | `hidden` prop |
| **Show** | Reverse, same spring | `hidden={false}` |
| **App launch** | Rise-in: `hidden` true → false on first frame (≈ 450 ms) | optional |

Tab **content** transition: cross-fade only, ~180 ms (`animation: 'fade'` on the tab navigator). Don't slide screens sideways. The pill is the motion; the screen should just be calm.

---

## 5. Spring tuning (all in `springs.ts`)

`snappy` = response **0.42 s**, damping fraction **0.86** → Reanimated `stiffness ≈ 224, damping ≈ 25.7, mass 1`.

| If you want | Change |
|---|---|
| Slightly slower, more luxurious | `springFrom(0.5, 0.9)` (≈ `smooth`) |
| Quicker, more "tick" | `springFrom(0.34, 0.88)` |
| More playful (not recommended for money screens) | `springFrom(0.45, 0.75)` |
| No overshoot at all | damping fraction `1` |

Rule of thumb: **response** changes speed, **damping fraction** changes bounce. Never go below 0.75 on this bar. It sits next to numbers; keep it calm. Bounce belongs to stickers (see `springs.bouncy`).

---

## 6. Haptics

| Moment | Call |
|---|---|
| Tab change (commit) | `haptic.select()` → `Haptics.selectionAsync()` (the system "tick") |
| Re-tap active tab | `haptic.tap()` (Light impact), optional |
| Nothing on touch-down, nothing per frame, nothing on hide/show | |

Haptics still fire when Reduce Motion is on.

---

## 7. Reduce Motion (design rule: fades only, haptics still confirm)

With `useReducedMotion()` true: `pos` jumps to the index (no spring, no sliding), pill and widths change instantly, icon pop is off, show/hide is instant. Screen content keeps its cross-fade. Haptic stays.

## 8. Accessibility

- Container `role="tablist"`, each item `role="tab"` with `accessibilityLabel` = label and `accessibilityState={{ selected }}`. VoiceOver reads the label, the tab role and the selected state (verify the exact phrasing on a device; whether it adds "1 of 4" depends on the React Native version).
- Icons are decorative; the label is on the pressable. The measuring text is hidden from the accessibility tree.
- Targets ≥ 48pt. Contrast: ink on lime 16.4:1; grey icon `#8F8F8A` on `#0A0A0A` is a non-text glyph, and the active/inactive difference is **shape + label + colour** (never colour alone).
- Dynamic Type: label is capped (×1.15) because the bar is a fixed-height control. The rest of the app scales normally.

---

## 9. Integration

```tsx
// app/(tabs)/_layout.tsx  (expo-router)
import { Tabs } from 'expo-router';
import { useColorScheme } from 'react-native';
import { FloatingTabBar } from '@/src/components/FloatingTabBar';

export default function TabsLayout() {
  const scheme = useColorScheme() === 'dark' ? 'dark' : 'light';
  return (
    <Tabs
      tabBar={(props) => <FloatingTabBar {...props} scheme={scheme} />}
      screenOptions={{ headerShown: false, animation: 'fade' }}   // content cross-fades; the pill does the moving
    >
      <Tabs.Screen name="index" />      {/* Home */}
      <Tabs.Screen name="assets" />
      <Tabs.Screen name="activity" />
      <Tabs.Screen name="health" />
    </Tabs>
  );
}
```

- **Route names** must match `CUBBY_TABS[].name` (`index`, `assets`, `activity`, `health`). Pass your own `tabs` prop to rename.
- **Content clearance:** give every tab screen `paddingBottom: TAB_BAR_CLEARANCE + insets.bottom` (≈ 96 + safe area) so the last row scrolls clear of the bar. Don't set `tabBarStyle` height; the bar is absolutely positioned.
- **Safe area:** `bottom = max(insets.bottom − 6, 16)` (≈ 28 on an iPhone with a home indicator; the board's 20 had no safe area). RECOMMENDED.
- **Hide on full-screen routes:** Welcome/Connect/Recap/Milestone live outside the `(tabs)` group, or pass `hidden` from a store when they're on top.
- **Scroll to top on re-tap:** `onReselect` + `useScrollToTop(ref)` from `@react-navigation/native`, or a tiny event bus.
- **React Navigation (no expo-router):** same: `<Tab.Navigator tabBar={(p) => <FloatingTabBar {...p} />}>`. The props type is structurally compatible with `BottomTabBarProps` (type-checked in the kit build).
- Requires: `react-native-reanimated` (v3.16+ or v4), `react-native-safe-area-context`, `react-native-svg`, `expo-haptics`; New Architecture recommended.

---

## 10. Edge cases handled

| Case | Behaviour |
|---|---|
| Tap three tabs quickly (1→3→2) | Spring retargets with velocity; icon colours follow the pill; no stuck/mid state; final state exact |
| Tap the same tab while animating | Treated as re-tap → `onReselect`, spring continues |
| Navigation prevented by a `tabPress` listener | No haptic, no movement |
| Label measured late (font loads after first render) | Widths update once; if the font loads before first paint you won't see it. Preload fonts before rendering the navigator |
| Dark / light switch while animating | Colours come from `palette`; geometry unaffected |
| Extra routes in the navigator not in `tabs` | Ignored (bar only renders the tabs it knows) |
| < 2 tabs | Works (pill = the single item) |

## 11. Not covered (decide later)
- **RTL:** layout is LTR only. Mirroring (pill from the right, label left of icon) is NOT DESIGNED.
- **iPad / landscape:** bar stays the same size, centered. A sidebar on iPad is NOT DESIGNED.
- **Drag-to-scrub** (press and slide across the bar like the system tab bar, `Gesture.Pan` setting `pos` from x and springing to the nearest index on release, with `haptic.soft()` per tab crossed): RECOMMENDED next step, not implemented.
- **Badges** (e.g. a dot on Health when approvals need review): NOT DESIGNED. If added: `pop` the dot in with `springs.bouncy`, 8px, `palette.caution`, with a text/icon alternative.
- Android: shadow is `elevation`; ripple is not used (the spring press is the feedback).

## 12. Acceptance checklist (test on a real iPhone, Release build)
- [ ] 60 fps on all phones, 120 fps on ProMotion (see ProMotion note in `SMOOTH_ANIMATION.md` §9). JS thread stays idle during the animation (Perf Monitor).
- [ ] Press feedback is visible on touch-down, before release.
- [ ] 1→4, 4→1, 2→3 all end exactly (pill = item rect) and the bar is centered.
- [ ] Interrupt test: 1→3 then 2 mid-flight, no jump, no flicker, no wrong icon colour.
- [ ] Icons are never ink-on-black or grey-on-lime at rest.
- [ ] Reduce Motion: no sliding, haptic still fires.
- [ ] VoiceOver announces "Assets, tab, selected" and swiping reaches all four.
- [ ] Dynamic Type at largest: label doesn't clip or break the bar.
- [ ] Dark mode: bar `#161616`, same pill, icons `#8F8F8F`.
