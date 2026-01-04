# Plan: Smooth Spring Transitions for Aspect Ratio Switching

## Problem Statement
When switching between aspect ratios (16:9, 1:1, 9:16) in the Share dialog, the background and images resize instantly without animation. We want smooth spring-like transitions.

## Current State

### 1. Preview Container (`ShareSessionButton.tsx:688-691`)
```tsx
<div
  ref={previewContainerRef}
  className="relative mx-auto overflow-hidden"
  style={previewStyle}  // ← Direct width/height, no transition
>
```
- `previewStyle` recalculates via `useMemo` when `aspectRatio` changes
- Dimensions applied instantly via inline styles

### 2. Background (`ShareSessionButton.tsx:693-699`)
```tsx
<div
  ref={previewRef}
  className={cn("w-full h-full ...", selectedBackground?.className)}
  style={selectedBackground?.style}
>
```
- Background fills container at 100% width/height
- Will naturally follow container animation

### 3. CardStack (`CardStack.tsx:58`)
```tsx
const widthPercentage = { "16:9": 0.45, "1:1": 0.7, "9:16": 0.75 }[aspectRatio];
```
- Card widths change based on aspect ratio
- Already uses Framer Motion for card animations
- Width changes are instant (not animated)

### 4. ShareSessionGridView (`ShareSessionGridView.tsx:415-428`)
```tsx
<motion.div
  style={{ width: cardWidthPx ? `${cardWidthPx}px` : undefined }}
  initial={{ scale: 0.8 }}
  animate={{ scale: 1 }}  // ← Only animates scale, not width
>
```
- `cardWidthPx` recalculated on container resize
- Width changes are instant

---

## Implementation Plan

### Step 1: Animate Preview Container Size
**File:** `ShareSessionButton.tsx`

Convert the preview container from a regular `div` to `motion.div` and animate dimensions:

```tsx
import { motion } from "framer-motion";

// Replace the previewContainerRef div with:
<motion.div
  ref={previewContainerRef}
  className="relative mx-auto overflow-hidden"
  animate={{
    width: previewDimensions.width,
    height: previewDimensions.height,
  }}
  transition={{
    type: "spring",
    stiffness: 300,
    damping: 30,
  }}
  style={{
    maxWidth: "100%",
    maxHeight: previewDimensions.maxPreviewHeight,
  }}
>
```

**Rationale:** Framer Motion's `animate` prop handles smooth interpolation between values. Spring physics provide natural-feeling motion.

### Step 2: Animate CardStack Card Widths
**File:** `CardStack.tsx`

The cards use percentage-based widths. When `widthPercentage` changes, animate it:

```tsx
// Change from:
style={{
  width: `${CARD_W_PERCENT}%`,
  ...
}}

// To:
animate={{
  width: `${CARD_W_PERCENT}%`,
}}
transition={{
  type: "spring",
  stiffness: 300,
  damping: 28,
}}
style={{
  aspectRatio: CARD_AR,
  // ... other static styles
}}
```

### Step 3: Animate ShareSessionGridView Card Width
**File:** `ShareSessionGridView.tsx`

Convert the card width from inline style to animated property:

```tsx
// Change from:
<motion.div
  style={{ width: cardWidthPx ? `${cardWidthPx}px` : undefined }}
  animate={{ scale: 1 }}
>

// To:
<motion.div
  animate={{
    width: cardWidthPx ?? 300,
    scale: 1,
  }}
  transition={{
    type: "spring",
    stiffness: 300,
    damping: 28,
  }}
>
```

### Step 4: Handle Layout Shift Gracefully
When animating container size, the internal content should also animate smoothly. Consider adding `layout` prop to child motion components:

```tsx
<motion.div layout>
  {/* Children will animate position changes */}
</motion.div>
```

---

## Spring Parameters

Consistent spring values across all animations:
- **stiffness: 300** - Responsive but not snappy
- **damping: 28-30** - Minimal overshoot
- **bounce: 0** (or omit) - Professional feel without bouncing

These match the existing `AnimatedTabs` spring settings (`bounce: 0.2, duration: 0.3`).

---

## Files to Modify

1. **`ShareSessionButton.tsx`**
   - Add `motion` import from framer-motion
   - Convert preview container to `motion.div`
   - Move width/height from `style` to `animate`

2. **`CardStack.tsx`**
   - Convert card width from `style` to `animate`
   - Add transition spring config

3. **`ShareSessionGridView.tsx`**
   - Move `cardWidthPx` from `style.width` to `animate.width`
   - Add transition spring config

---

## Testing Checklist

- [ ] Switch 16:9 → 1:1 → 9:16 in Share dialog
- [ ] Verify smooth container resize animation
- [ ] Verify cards inside animate their size changes
- [ ] Check no layout jumps or glitches
- [ ] Test on mobile (should still work, just different sizes)
- [ ] Verify export/download still captures correct dimensions (animations complete before capture)

---

## Risks & Mitigations

1. **Export might capture mid-animation frame**
   - Mitigation: Export already uses cloned DOM, should be unaffected
   - If needed, add small delay before export or use `onAnimationComplete`

2. **Performance on low-end devices**
   - Mitigation: Springs are GPU-accelerated via transforms
   - Width/height animations may be slightly heavier than transform-only

3. **Content reflow during animation**
   - Mitigation: Use `layout` prop on children if needed
   - Or use `layoutId` for shared element transitions
