# Timer-Mirror Development Guide

## Project Overview

Timer-Mirror is a React + TypeScript productivity timer application with advanced camera capture and session tracking capabilities. Built with Vite, Tailwind CSS, and a comprehensive UI component library (Radix UI).

### Key Features
- **Timer Management**: Countdown timers with task naming
- **Media Capture**: Screen recording and webcam photo capture during sessions
- **Session Sharing**: Generate shareable session montages with visual summaries
- **Cross-platform**: Optimized for both desktop and mobile devices
- **Real-time Processing**: Live camera feeds and dynamic backgrounds

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS with custom design system
- **UI Components**: Radix UI primitives with custom frosted glass styling
- **Media**: WebRTC API for camera/screen capture
- **Build Tools**: SWC for fast compilation
- **Development**: Tempo Labs integration (legacy), ESLint

## AI Assistant Setup & Tools

### Required Tools

#### 1. Context7 MCP (Always Available)
Context7 provides access to up-to-date documentation and code examples.

**Installation**: Already configured via SSE transport
```bash
# Context7 is pre-configured and should be available
claude mcp list  # Verify context7 is connected
```

**Usage**: Reference external libraries and documentation
```bash
# Example: Get React documentation
@context7 "react hooks useEffect"
```

#### 2. Serena MCP (Project Analysis & Code Intelligence)
Serena provides advanced code analysis, symbol-based editing, and project intelligence.

**Setup Process** (CRITICAL - Do this every time):
```bash
# 1. Ensure you're in the project directory
cd /Users/ivan/timer-mirror

# 2. Configure Serena for this specific project
claude mcp add serena -- /Users/ivan/.local/bin/uvx --from git+https://github.com/oraios/serena serena start-mcp-server --context ide-assistant --project $(pwd)

# 3. Verify connection
claude mcp list  # Should show serena as ✓ Connected

# 4. IMPORTANT: Accept trust dialog when prompted
# The first time you use Serena tools, Claude Code will ask for permission
```

**Available Serena Tools**:
- `get_symbols_overview` - Analyze code structure
- `find_symbol` - Locate specific functions/classes
- `find_referencing_symbols` - Find code dependencies
- `onboarding` - Project structure analysis
- `list_dir` - Enhanced directory listing
- `search_for_pattern` - Advanced code search
- Symbol-based editing tools for precise modifications

**When Serena Tools Aren't Available**:
If you see "No such tool available" errors:
1. Check `claude mcp list` - should show "✓ Connected"
2. Restart Claude Code: `claude restart`
3. Accept any trust dialogs that appear
4. Verify project scope matches current directory

### Best Practices for AI Assistant Usage

1. **Always Use Context7** for external library documentation
2. **Always Use Serena** for codebase analysis before making changes
3. **Start with Project Overview** using `onboarding` tool
4. **Symbol-first Analysis** - use overview tools before reading entire files
5. **Verify Setup** - Check MCP status if tools aren't working

## Development Workflows

### Feature Development Workflow

Following the [ai-dev-tasks methodology](https://github.com/snarktank/ai-dev-tasks):

#### 1. Product Requirements Document (PRD) Creation
```bash
# Use the ai-dev-tasks structure for new features
# Create: /tasks/prd-[feature-name].md
```

**Template Structure**:
```markdown
# Feature Name PRD

## Problem Statement
[Clear description of user problem]

## Solution Overview
[High-level approach]

## Requirements
### Functional Requirements
- [ ] Requirement 1
- [ ] Requirement 2

### Technical Requirements
- [ ] Performance criteria
- [ ] Browser compatibility
- [ ] Mobile responsiveness

## Implementation Notes
### Timer-Mirror Specific Considerations
- Camera permissions and WebRTC compatibility
- Screen capture API limitations
- Mobile device constraints
- Performance impact on real-time processing

## Success Criteria
[Measurable outcomes]
```

#### 2. Task Generation from PRD
```bash
# Generate detailed implementation tasks
# Create: /tasks/tasks-prd-[feature-name].md
```

**Task Structure**:
```markdown
## Relevant Files
- `src/components/[Component].tsx` - Main component
- `src/lib/[utility].ts` - Utility functions  
- `src/components/[Component].test.tsx` - Tests

## Tasks
- [ ] 1.0 Component Development
  - [ ] 1.1 Create component structure
  - [ ] 1.2 Implement core functionality
  - [ ] 1.3 Add TypeScript types
- [ ] 2.0 Integration
  - [ ] 2.1 Connect to existing timer system
  - [ ] 2.2 Update routing if needed
- [ ] 3.0 Testing & Quality
  - [ ] 3.1 Write unit tests
  - [ ] 3.2 Test camera integration
  - [ ] 3.3 Mobile compatibility testing
```

#### 3. Implementation Process
```bash
# Use systematic approach
# Process tasks iteratively with verification
```

**Implementation Steps**:
1. **Project Analysis**: Use Serena's `onboarding` tool
2. **Symbol Overview**: Use `get_symbols_overview` for relevant directories
3. **Dependency Analysis**: Use `find_referencing_symbols` for integration points
4. **Implement**: Make changes using symbol-based editing tools
5. **Test**: Run test suite with `npm test`
6. **Build**: Verify with `npm run build`
7. **Commit**: Use conventional commit format

### Code Review & Quality Assurance

#### Pre-Implementation Analysis
```bash
# Always analyze before changing
serena get_symbols_overview src/components
serena find_symbol "ComponentName" --include-body=false
serena find_referencing_symbols src/components/Component.tsx:10:5
```

#### Quality Checks
```bash
# Run quality tools
npm run lint          # ESLint checks
npm run build         # TypeScript compilation
npm test              # Run test suite

# Manual checks specific to Timer-Mirror:
# 1. Camera permission handling
# 2. Mobile device compatibility  
# 3. Screen capture functionality
# 4. Performance with real-time processing
```

#### Git Workflow
```bash
# Conventional commits with ai-dev-tasks format
git add .
git commit -m "feat: add camera capture controls" \
           -m "- Implements start/stop recording" \
           -m "- Adds permission error handling" \
           -m "- Related to T123 in PRD"
```

### Project-Specific Workflows

#### Camera/Media Feature Development
**Special Considerations**:
- Test on multiple browsers (Chrome, Firefox, Safari)
- Verify mobile device camera access
- Test screen capture permissions
- Performance impact on timer accuracy

**Testing Checklist**:
- [ ] Camera permissions granted/denied states
- [ ] Screen capture in different browsers
- [ ] Mobile camera orientation handling
- [ ] Background processing during timer sessions
- [ ] Memory usage with long recording sessions

#### UI Component Development
**Pattern**: Custom frosted glass styling with Radix UI base components

**Analysis Process**:
1. Check `src/components/ui/` for base Radix UI components
2. Review existing components for frosted glass patterns
3. Check `tailwind.config.js` for design tokens
4. Check `tempo.config.json` for typography system
5. Follow established custom styling patterns

**Frosted Glass Design System**:
The project uses a consistent frosted glass aesthetic with these key patterns:

**Primary Button/Interactive Elements**:
```css
className="bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/70 backdrop-blur-md flex items-center gap-1 rounded-full inner-stroke-white-20-sm"
```

**Secondary/Container Elements**:
```css
className="bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm p-[0px] inner-stroke-white-10-sm shadow-sm rounded-full"
```

**Dark Mode Variants**:
```css
className="bg-neutral-900/75 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:rounded-full text-white/85 backdrop-blur-md"
```

**Component Template**:
```typescript
// Follow existing frosted glass patterns
import { forwardRef } from "react"
import { cn } from "@/lib/utils"

interface ComponentProps {
  variant?: 'primary' | 'secondary' | 'dark'
  // Define props
}

const Component = forwardRef<HTMLElement, ComponentProps>(
  ({ className, variant = 'primary', ...props }, ref) => {
    const variants = {
      primary: "bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/70 backdrop-blur-md rounded-full inner-stroke-white-20-sm",
      secondary: "bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm inner-stroke-white-10-sm shadow-sm rounded-full",
      dark: "bg-neutral-900/75 before:absolute before:inset-0 before:bg-gradient-to-b before:from-white/20 before:to-transparent before:rounded-full text-white/85 backdrop-blur-md rounded-full inner-stroke-white-20-sm"
    }
    
    return (
      <div
        ref={ref}
        className={cn(variants[variant], className)}
        {...props}
      />
    )
  }
)
Component.displayName = "Component"
```

**Key Styling Patterns to Match**:
- `backdrop-blur-md` or `backdrop-blur-sm` for frosted glass effect
- `bg-white/75` type opacity for translucent backgrounds
- `before:` pseudo-elements for gradient overlays
- `inner-stroke-white-*` for inner borders (custom utility)
- `rounded-full` for pill-shaped elements
- Consistent hover states with opacity changes

#### Performance Optimization
**Focus Areas**:
- Real-time camera processing
- Timer accuracy during background tasks
- Memory management for media capture
- Mobile device optimization

**Analysis Tools**:
```bash
# Use Serena to find performance bottlenecks
serena search_for_pattern "useEffect.*timer" --scope=src
serena find_referencing_symbols src/lib/mediaCapture.ts
```

## Troubleshooting

### Serena MCP Issues
**Problem**: "No such tool available" errors
**Solutions**:
1. Check MCP status: `claude mcp list`
2. Verify project path in configuration
3. Restart Claude Code: `claude restart`
4. Accept trust dialogs when prompted
5. Ensure running from `/Users/ivan/timer-mirror` directory

### Context7 Issues
**Problem**: Context7 documentation not loading
**Solutions**:
1. Check internet connection
2. Verify SSE transport: `claude mcp get context7`
3. Try alternative search terms

### Camera/Media Issues
**Common Development Issues**:
- Browser security restrictions
- Mobile device limitations
- Screen capture API differences
- Permission handling edge cases

**Testing Commands**:
```bash
# Test in development server
npm run dev

# Test production build
npm run build && npm run preview
```

## File Structure Reference

```
timer-mirror/
├── src/
│   ├── components/
│   │   ├── ui/              # Base Radix UI components
│   │   ├── TimerCard.tsx    # Main timer component
│   │   ├── CameraFeed.tsx   # Camera integration
│   │   ├── SessionMontage.tsx # Session visualization
│   │   └── home.tsx         # Main app component
│   ├── lib/
│   │   ├── mediaCapture.ts  # Camera/screen capture logic
│   │   ├── deviceDetection.ts # Device capability detection
│   │   └── utils.ts         # Utility functions
│   └── types/
│       └── supabase.ts      # Type definitions (legacy)
├── public/
│   └── onboarding/          # Onboarding illustrations
├── tempo.config.json        # Typography system
├── tailwind.config.js       # Design tokens
└── package.json            # Dependencies and scripts
```

## Commands Reference

### Development
```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### AI Assistant Commands
```bash
# MCP Management
claude mcp list                    # Check server status
claude mcp get serena             # Serena details
claude restart                   # Restart Claude Code

# Context7 Usage
@context7 "react typescript best practices"

# Serena Usage (when available)
serena onboarding                 # Project analysis
serena get_symbols_overview src/  # Code structure
```

## Notes for Future AI Assistants

1. **Setup is Critical**: Always verify Serena and Context7 are working before starting
2. **Project-Specific**: This is a media-intensive React app with real-time requirements
3. **Design System**: Follow the established frosted glass aesthetic - match existing patterns!
4. **Testing Requirements**: Camera/media features need manual testing across devices
5. **Performance Matters**: Timer accuracy and media processing are core to user experience
6. **Mobile-First**: Always consider mobile device limitations and capabilities
7. **Styling Consistency**: Reference existing components for frosted glass patterns before creating new UI

---

*This guide should be the first thing any AI assistant reads when working on timer-mirror. Always verify tool availability before proceeding with development tasks.*