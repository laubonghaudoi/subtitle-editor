# Subtitle Editor — Color & Shape System Refactor (implementation spec)

Self-contained spec for refactoring the app's colors and shape language into one
coherent, neo-brutalist system. No prior context needed. Visual reference mockups
live at repo root: `_btn_preview.html` (full before/after) and `_btn_variants.html`
(button studies) — open in a browser.

---

## 1. Goals / principles

The app currently runs **four uncoordinated palettes**: (1) track data
amber/blue/crimson/green, (2) toolbar buttons yellow/blue/plum, (3) ~12 ad-hoc
state colors, (4) waveform mint/cyan/red. Blue means ~6 different things; greens
appear 4×; grays mix slate/gray/neutral/mauve; shape uses 7 radius values, soft
shadows, and split-brain borders (2px ink structural vs 1px gray controls).

Target system — **four roles**:

| Role | Color | Used for |
|------|-------|----------|
| Foundation | slate + **ink borders** (black / white) | bg, surfaces, text, all dividers |
| Accent | **iris / indigo** | non-semantic interaction: links, focus ring, playing-row, editing fields, drop zones, waveform playhead, find-replace "Replace" button |
| Semantic verbs | green / amber / red | add=green, merge=amber, delete=red (universal action verbs); save=teal |
| Track data | brightened yellow / blue / red / green | track tabs, waveform regions, labels, load dialog, bulk-offset (data identity) |

Shape: **flat (no shadows)**, ink borders everywhere, radius 2px (controls) / 4px (containers).

---

## 2. Palette values

Reference (raw hex). The repo maps Radix steps to Tailwind classes in
`app/globals.css` `@theme` as: `-50→step1, -100→step2, -200→step3, -300→step4,
-400→step5, -500→step6, -600→step7, -700→step8, -800→step9, -900→step10,
-950→step12`. **Note: step 11 (the ideal text step) is NOT exposed as a Tailwind
class** — for link/accent text use the CSS var directly (see §3).

**Accent — iris**: solid `--iris-9 #5b5bd6` (`bg-iris-800`), hover `--iris-10 #5151cd`
(`bg-iris-900`), tint `--iris-4 #e6e7ff` (`bg-iris-300`) / `--iris-3 #f0f1fe`
(`bg-iris-200`), ring `--iris-8 #9b9ef0` (`border-iris-700`), text `--iris-11 #5753c6`.

**Save — teal**: solid `--teal-9 #12a594` (`bg-teal-800`), hover `--teal-10 #0d9b8a` (`bg-teal-900`).

**Destructive — red**: solid `--red-9 #e5484d` (`bg-red-800`), tint `--red-3` (`bg-red-200`), text `--red-11 #ce2c31`.

**Semantic verbs** (light tint chips: tint bg + colored text + colored border):
- add = green: bg `green-200`, text `green-11 #218358`, border `green-800`
- merge = amber: bg `amber-200`, text `amber-11 #ab6400`, border `amber-800`
- delete = red: bg `red-200`, text `red-11`, border `red-800`

**Track data — NEW brightened quartet (use BLACK text on all four).** These are
tuned values (not raw Radix steps) chosen so black text clears WCAG AAA:

| Track | New hex | Black-text contrast | (was, white text) |
|-------|---------|--------------------|-------------------|
| T1 yellow | `#ffc83d` | 13.6:1 | `#ffba18` @ 1.7:1 ✗ |
| T2 blue | `#4dabf7` | 8.5:1 | `#0588f0` @ 3.6:1 ✗ |
| T3 red | `#ff6b6b` | 7.6:1 | `#df3478` @ 4.3:1 ✗ |
| T4 green | `#51cf66` | 10.5:1 | `#2b9a66` @ 3.6:1 ✗ |

T3 red (`#ff6b6b`, bright coral) stays distinct from destructive delete-red
(`#e5484d`, deeper) by depth + treatment (solid vs tint chip).

---

## 3. `app/globals.css`

**Radius** — collapse to 2px controls / 4px containers. In the `@theme` block,
set radius so `rounded-lg`=4px (dialogs/popovers/toasts), `rounded-md`/`rounded-sm`=2px (buttons/inputs/menus):
```css
--radius: 0.25rem;            /* 4px — containers (rounded-lg) */
--radius-md: 0.125rem;        /* 2px — controls (override the calc) */
--radius-sm: 0.125rem;        /* 2px */
```
Keep `rounded-full` only for the slider track and switch thumb.

**Accent text token** (since step-11 isn't mapped) — add under `@theme`:
```css
--color-accent-ink: var(--iris-11);   /* light: #5753c6, dark: #b1a9ff */
```
…and use `text-accent-ink` for links/accent text. (Or use arbitrary value
`text-[color:var(--iris-11)]` per-site.)

**Borders** — `--border` is already ink (`black` / `white`). The work is removing
gray border overrides in components (see §4); no token change needed.

**Shadows** — flat. No token; remove `shadow-*` utilities in components (§5).

---

## 4. Color changes — file by file

> Buttons get `border-2 border-black dark:border-white rounded-xs` added (hard
> ink border + 2px corner) on top of the fill swaps below.

| File:line | Current | New |
|-----------|---------|-----|
| `components/app-header/load-srt.tsx:136` (Load Subtitles trigger) | `text-black bg-yellow-900 hover:bg-yellow-800 dark:bg-amber-800 dark:hover:bg-amber-900 rounded-sm` | `text-white bg-iris-800 hover:bg-iris-900 rounded-xs border-2 border-black dark:border-white` |
| `components/app-header/app-header.tsx:215` (Load Media) | `text-white dark:text-black bg-blue-800 hover:bg-blue-700 dark:bg-sky-800 dark:hover:bg-sky-900 rounded-sm` | `text-white bg-iris-800 hover:bg-iris-900 rounded-xs border-2 border-black dark:border-white` |
| `components/app-header/save-srt.tsx:76` (Save) | `text-white bg-plum-800 hover:bg-plum-900 rounded-sm` | `text-white bg-teal-800 hover:bg-teal-900 rounded-xs border-2 border-black dark:border-white` |
| `components/app-header/save-srt.tsx:102,110,118,126` (download btns) | `bg-slate-950 hover:bg-mauve-900 … rounded-sm` | `bg-slate-950 hover:bg-slate-800 … rounded-xs` (drop mauve) |
| `app/faq/page.tsx` (14 links) | `text-blue-800 hover:text-blue-900` | `text-accent-ink hover:underline` |
| `components/subtitle/track-tabs.tsx:58,75`, `components/subtitle/subtitle-list-empty.tsx:19,32`, `components/video-player.tsx:253` | `hover:text-blue-800` | `hover:text-accent-ink` |
| `subtitle-item.tsx` row **hover** | `hover:bg-yellow-200` | 🔒 **LOCKED** — `var(--iris-4)` (`#e6e7ff` / `#262a65`), the iris accent, same family as the edit fields. Set as `--subtitle-row-hover-bg` on `.subtitle-row` in globals.css; applied by `.subtitle-row:hover`. |
| `subtitle-item.tsx` **playing** row (`.subtitle-row[data-current="true"]`) | `bg-sky-400` | 🔒 **LOCKED** — active **track color**: bg `getTrackColor(activeTrackIndex, 0.22)` (set inline as `--subtitle-row-current-bg`) + **bold 4px left bar** `getTrackHandleColor(activeTrackIndex)` via `box-shadow: inset 4px 0 0 var(--subtitle-row-current-bar)` — **left bar only**, no top/right/bottom box. |
| `components/subtitle/subtitle-time-fields.tsx:118,169` (editing inputs) | `bg-blue-300` | `bg-iris-200 border border-iris-700` |
| `components/subtitle/subtitle-item-text-editor.tsx:67` (editing textarea) | `bg-blue-300` | `bg-iris-200` |
| `components/subtitle/subtitle-time-fields.tsx:53,66,76` (invalid time) | `bg-orange-200 text-red-700` | `bg-red-200 text-red-950` |
| `subtitle-item-merge-actions.tsx` **add** | `bg-grass-300 text-grass-800` (borderless, grass) | **green bordered chip** (see "Inline action chips" below). Unify grass→green. |
| `subtitle-item-merge-actions.tsx` **merge** | `bg-amber-200 text-amber-800` (borderless; `text-amber-800`=`--amber-9` bright yellow = low contrast) | **amber bordered chip** (see below) — fixes the text contrast |
| `subtitle-item-delete-button.tsx` **delete** | `bg-red-300 text-red-800` (borderless) | **red bordered chip** (see below) |
| `components/find-replace/table.tsx:58` (match highlight) | `bg-red-500 text-white` | `bg-amber-200 text-amber-950` |
| `components/find-replace/table.tsx:101` (replace highlight) | `bg-green-500 text-white` | `bg-green-200 text-green-950` |
| `components/find-replace/index.tsx:267` (Replace btn) | `bg-slate-800 hover:bg-slate-600 dark:bg-slate-100…` | `bg-iris-800 hover:bg-iris-900 text-white` |
| `app/[locale]/page.tsx:382` (subtitle drop zone) | `bg-yellow-50` | `bg-iris-100` |
| `app/[locale]/page.tsx:438` (media drop zone) | `bg-blue-50` | `bg-iris-100` |

### Inline action chips (delete / add / merge) — bordered tint chips
🔒 The mockup's "Inline actions & highlights" panel shows these as small
**bordered** chips — tint background + readable **hue-11** text + **hue-9** border
— NOT borderless fills (GPT's first pass shipped them borderless and with
low-contrast text). Apply one consistent treatment, roughly
`px-2 py-1 rounded-xs border text-sm`:

| Verb | bg | text | border |
|------|----|------|--------|
| Delete | `bg-red-200` (`--red-3`) | `text-[color:var(--red-11)]` `#ce2c31` | `border-red-800` (`--red-9`) |
| Add (green) | `bg-green-200` (`--green-3`) | `text-[color:var(--green-11)]` `#218358` | `border-green-800` (`--green-9`) |
| Merge (amber) | `bg-amber-200` (`--amber-3`) | `text-[color:var(--amber-11)]` `#ab6400` | `border-amber-700` (`--amber-8` — `--amber-9` is too light for a border) |
| Disabled | `bg-slate-200` | `text-slate-900` | `border-slate-700` |

- **Why the arbitrary value for text:** this repo's `@theme` maps `-50…-950` to Radix steps 1–10 + 12 but **skips step 11**, so `text-{hue}-11` doesn't exist. Use `text-[color:var(--{hue}-11)]`.
- Radix **step-3 bg + step-11 text** is contrast-safe in BOTH light and dark (the Radix vars are theme-aware), so the same classes work for dark mode — no `dark:` overrides needed.
- **Highlights** (find/replace) are already correct: match = `bg-amber-200 text-amber-950`, replace = `bg-green-200 text-green-950`. Drop zones = `bg-iris-100`. ✅

### Track colors — `lib/track-colors.ts`
Replace `TRACK_BASE_COLORS` with the brightened quartet (set light = dark = the
new hex; `resolveTokenColor` accepts raw hex):
```ts
const TRACK_BASE_COLORS: TrackBaseColor[] = [
  { tokenLight: "#ffc83d", tokenDark: "#ffc83d", fallback: "#ffc83d" }, // T1 yellow
  { tokenLight: "#4dabf7", tokenDark: "#4dabf7", fallback: "#4dabf7" }, // T2 blue
  { tokenLight: "#ff6b6b", tokenDark: "#ff6b6b", fallback: "#ff6b6b" }, // T3 red
  { tokenLight: "#51cf66", tokenDark: "#51cf66", fallback: "#51cf66" }, // T4 green
];
```
**Text on track fills = BLACK, always.** Two call sites assume white:
- `components/subtitle/track-tabs.tsx:98`: change `const color = isActive ? "#ffffff" : "#111827";` → `isActive ? "#000000" : "#111827";`
- `components/bulk-offset/controls.tsx:92` (`activeToggleStyle.color`) and `:322` (apply button `color`): change `"#fff"` → `"#000"`.
- `getReadableTextColor` in `lib/track-colors.ts:151` has `threshold = 0.65`; `#ffc83d` luminance ≈ 0.63 would wrongly return white. Either lower the default threshold to ~0.45, or (simpler) hardcode black for track-colored UI as above. Verify the load-srt dialog track buttons (`getTrackButtonStyle`) render black text.

### Waveform — `components/waveform-visualizer/index.tsx`
Ambient muted-steel duotone (NOT flat gray) + warm playhead. These are theme-aware
(the component computes light/dark via the `theme` ternary at lines ~54-57).
- `:56` `waveColor` (unplayed) → muted steel-blue: light `#b6c2d4`, dark `#39434f`.
- `:57` `progressColor` (played) → deeper steel: light `#74869f`, dark `#586a82`.
- `:103` `cursorColor: "#b91c1c"` → warm dark-orange playhead: light `#e8590c`, dark `#ff7a30`. Make it theme-aware like `waveColor` (move it out of the static `useWavesurfer` options into a theme ternary, or `useEffect`/`setOptions`). A single `#e8590c` for both modes also works if simpler. (Warm playhead is the editor convention; distinct from delete-red `#e5484d`.)
- `:121` Hover `lineColor: "#ff0000"` → `#e8590c` (or match the playhead); `labelBackground: "#555"` may stay.
- Region fills/handles already use `getTrackHandleColor`/`getTrackColor` → update automatically from `track-colors.ts`.
- Rationale: low-chroma steel reads ambient yet still lets the saturated track regions pop. (Alternative if you want it closer to the old mint→blue: `waveColor` light `#a9e1d7` / dark `#173f3a`, `progressColor` light `#3ba0c0` / dark `#2789a6` — more atmospheric but the blue/green regions compete slightly.)

---

## 5. Shape sweep — borders, radius, shadows

Apply across `components/ui/*` primitives + a few app components.

**Remove soft shadows** (flat): delete `shadow-sm` / `shadow-xs` / `shadow-md` /
`shadow-lg` from: `ui/button.tsx` (variants), `ui/dialog.tsx:45`,
`ui/alert-dialog.tsx:39`, `ui/dropdown-menu.tsx:50,68`, `ui/toast.tsx:28`,
`ui/input.tsx:11`, `ui/textarea.tsx:12`, `ui/checkbox.tsx`, `ui/slider.tsx:23`,
`ui/switch.tsx:21`, `ui/select` if present. (Existing `shadow-none` sites are fine.)

**Ink borders** — replace soft gray borders with ink:
- `ui/button.tsx:17` outline variant `border-input` → `border-2 border-foreground`
- `ui/input.tsx:11`, `ui/textarea.tsx:12`, `ui/toggle.tsx:16`: `border-input` → `border-2 border-foreground`
- `components/custom-controls.tsx:170` `border-gray-300 dark:border-white/30` → `border-foreground`
- `components/app-header/load-srt.tsx:158` `border-neutral-500` → `border-foreground`
- Search for remaining `border-input`, `border-neutral-*`, `border-gray-*` → ink.

**Radius** — after the globals.css change, sweep stray classes: `rounded`,
`rounded-lg`, `rounded-md` on *controls* (buttons/inputs/menu items) → `rounded-xs`
(2px); leave containers (dialog/popover/toast) at `rounded-md`/`rounded-lg` (now 4px).
Keep `rounded-full` only on slider track + switch.

---

## 6. Rollout order (verify after each)

1. **`app/globals.css`** — radius values + `--color-accent-ink`.
2. **Buttons + links** (§4 rows 1–6). Visual check the toolbar.
3. **`lib/track-colors.ts` + track text** (§4 track section) — check tabs/waveform/bulk-offset contrast.
4. **List + state colors** (subtitle-item, time-fields, text-editor, drop zones).
5. **Inline verbs + find/replace** (grass→green unify, highlights, Replace btn).
6. **Waveform chrome** (wave/progress/cursor/hover).
7. **Shape sweep** (§5) across `ui/*` + custom-controls.

## 7. Verification checklist
- [ ] Active track tabs: black text, legible on all 4 (esp. yellow). Inactive tabs legible.
- [ ] No `border-input` / `border-neutral-*` / `border-gray-*` left (`git grep`).
- [ ] No soft `shadow-(sm|xs|md|lg)` left in `components/ui` (`git grep`).
- [ ] Blue no longer appears as link/selection/editing color (only Track 2 + media if applicable).
- [ ] Delete=red, Add=green, Merge=amber preserved; find=amber / replace=green.
- [ ] Save button = teal; Load buttons = iris; all three have 2px ink borders.
- [ ] Dialogs/dropdowns/toasts: 4px corners, ink border, no shadow.
- [ ] Light + dark both checked.
