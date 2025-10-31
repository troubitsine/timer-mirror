# Timer-Mirror Development Guide

Motto: "Small, clear, safe steps - always grounded in real docs."

## Project Overview

Timer-Mirror is a focus timer that enhances productivity through visual reflection - showing users their reflection like a mirror while capturing session moments for a rewarding highlight reel.

### Architecture
- **React 18 + TypeScript** with Vite for fast development
- **Media Pipeline**: WebRTC camera/screen capture → automatic photo/screenshot collection → animated session montage
- **Cross-Platform**: Desktop (screen + webcam capture) and mobile (webcam only) with adaptive UI
- **Privacy-First**: All media processing happens locally

### Core Components
- `home.tsx` - Main app with mirrored webcam background
- `TimerCard.tsx` - Timer interface and media capture coordination  
- `CameraFeed.tsx` - Camera permissions and video display
- `mediaCapture.ts` - Screen/webcam capture logic with scheduling
- `SessionMontage.tsx` - Animated photo spiral for session completion reward

## Development Principles

### Code Quality Standards
- **Files ≤ 300 LOC** - Keep modules single-purpose and reviewable
- **Brief file headers** - Include where, what, why for every file
- **Centralized config** - Runtime tunables in config files, no magic numbers
- **Clear over clever** - Prefer simplicity and explicit code

### Workflow
1. **Plan**: Share short plan before major edits; prefer small, reviewable diffs
2. **Read**: Identify and read all relevant files fully before changing anything  
3. **Verify**: Use context7 to confirm external APIs; re-read affected code after edits
4. **Implement**: Keep scope tight; write modular, single-purpose changes
5. **Reflect**: Fix at root cause; consider adjacent risks to prevent regressions

### Documentation Strategy
- **Context7 first**: Use `@context7 "library-name API"` to fetch current docs before coding
- **Comment rationale**: Include assumptions, trade-offs, and non-obvious logic
- **Escalate uncertainty**: Tell user when confidence < 80%; ask questions over guessing

## Project-Specific Patterns

### Media Capture Workflow
The app uses a sophisticated capture pipeline:
1. **Initialization** - `initializeMediaCapture()` sets up webcam + screen streams (desktop only)
2. **Scheduling** - `scheduleCaptures()` takes 4-12 photos/screenshots throughout session
3. **Session End** - All captured media feeds into `SessionMontage` for animated reward

**Critical Considerations**:
- Camera permissions must be handled gracefully (mobile Safari, Chrome policies)
- Screen capture fails gracefully on mobile/denied permissions
- Performance impact on timer accuracy during capture operations

### Frosted Glass Design System
All UI follows consistent frosted glass aesthetic:

```css
/* Primary interactive elements */
bg-white/75 hover:bg-white/65 before:absolute before:inset-0 
before:bg-gradient-to-b before:from-transparent before:to-black/20 
before:rounded-full text-black/70 backdrop-blur-md rounded-full 
inner-stroke-white-20-sm

/* Container elements */  
bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm 
inner-stroke-white-10-sm shadow-sm rounded-full

/* Dark variants */
bg-neutral-900/75 before:bg-gradient-to-b before:from-white/20 
before:to-transparent text-white/85 backdrop-blur-md
```

**Key patterns**: `backdrop-blur-*`, opacity backgrounds (`/75`), `before:` overlays, `inner-stroke-*` borders, `rounded-full` shapes

### File Structure
```
src/
├── components/
│   ├── ui/              # Radix UI base components
│   ├── home.tsx         # Main app with mirror background
│   ├── TimerCard.tsx    # Timer + capture coordination
│   ├── CameraFeed.tsx   # Camera handling + permissions
│   └── SessionMontage.tsx # Highlight reel of working session
├── lib/
│   ├── mediaCapture.ts  # Core capture logic
│   ├── deviceDetection.ts # Mobile/desktop capability detection
│   └── useDynamicBackground.ts # Color extraction for montages
└── types/
    └── supabase.ts      # Legacy type definitions
```

## Development Workflows

### Feature Development
1. **Read existing code** - Understand patterns before changing
2. **Check dependencies** - Use context7 for library docs, verify APIs
3. **Mobile considerations** - Test camera permissions, screen limitations
4. **Performance testing** - Verify timer accuracy during media operations

### Quality Checks
```bash
npm run lint           # ESLint + TypeScript
npm run build          # Compilation verification  
npm run dev            # Test camera/screen capture
```

### Testing Strategy
**Manual Testing Required** (no automated tests for media APIs):
- [ ] Camera permissions: granted/denied states
- [ ] Screen capture: Chrome/Firefox/Safari differences  
- [ ] Mobile: camera orientation, iOS Safari quirks
- [ ] Performance: timer accuracy during heavy capture operations
- [ ] Memory: long sessions with frequent captures

### Git Workflow
```bash
# Conventional commits with specific changes
git commit -m "feat: improve camera permission handling" \
           -m "- Add Safari-specific permission checks" \
           -m "- Graceful fallback for denied permissions" \
           -m "- Better error messaging for users"
```

## Camera/Media Development Notes

### Browser Compatibility
- **Chrome**: Full screen capture support
- **Firefox**: Screen capture with user gesture required
- **Safari**: Camera only, no screen capture API
- **Mobile**: Camera permissions vary by OS/browser

### Performance Considerations
- Screen capture adds ~100KB per screenshot
- Webcam photos ~50KB each  
- Timer precision critical - capture operations run async
- Memory cleanup required for long sessions

### Common Issues
- iOS Safari camera orientation changes
- Chrome screen capture permission resets
- Firefox requires user interaction for screen capture
- Mobile browsers aggressively pause background tabs

## Component Development

### Before Creating New Components
1. Check `src/components/ui/` for existing Radix primitives
2. Review similar components for frosted glass patterns
3. Verify `tailwind.config.js` has needed design tokens
4. Follow established pattern: forwardRef + variants + cn() utility

### Example Component Structure
```typescript
// Brief header: Custom button with frosted glass styling
import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface ButtonProps {
  variant?: 'primary' | 'secondary'
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: "bg-white/75 hover:bg-white/65 backdrop-blur-md rounded-full",
      secondary: "bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm"
    }
    
    return (
      <button
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      />
    )
  }
)
```

## Troubleshooting

### Camera Issues
- Check browser permissions in settings
- Test different browsers (Safari limitations)
- Verify HTTPS (required for camera access)

### Performance Issues  
- Monitor timer drift during capture operations
- Check memory usage with long sessions
- Verify capture scheduling doesn't block UI

### Build Issues
```bash
npm run build          # Check TypeScript compilation
npm run lint           # Verify code standards
```

---

**Key Reminders**: Always use context7 for external docs, keep changes minimal and reversible, test camera functionality across browsers, maintain frosted glass design consistency, and escalate when uncertain.