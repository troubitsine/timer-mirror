# Feature Development Workflow

## Prerequisites
- [ ] Serena MCP configured and connected
- [ ] Context7 MCP available 
- [ ] Working directory: `/Users/ivan/timer-mirror`

## Step-by-Step Process

### 1. Feature Planning (PRD Creation)

**File**: `/tasks/prd-[feature-name].md`

```markdown
# [Feature Name] PRD

## Problem Statement
- What user problem does this solve?
- Why is this important for Timer-Mirror users?

## Solution Overview  
- High-level approach
- How it fits into existing timer/camera workflow

## Requirements

### Functional Requirements
- [ ] Core functionality
- [ ] User interactions
- [ ] Edge cases

### Technical Requirements
- [ ] Performance impact on timer accuracy
- [ ] Camera/media integration needs
- [ ] Mobile device compatibility
- [ ] Browser support requirements

### UI/UX Requirements
- [ ] Follow frosted glass design system
- [ ] Mobile-first responsive design
- [ ] Accessibility considerations

## Implementation Approach

### Component Analysis
Use Serena to understand existing patterns:
```bash
serena get_symbols_overview src/components
serena find_symbol "RelatedComponent" --include-body=false
```

### Integration Points
- How does this connect to Timer system?
- Any camera/media capture interactions?
- Routing changes needed?

## Success Criteria
- [ ] Measurable user outcomes
- [ ] Performance benchmarks
- [ ] Cross-browser/device testing criteria
```

### 2. Task Breakdown

**File**: `/tasks/tasks-prd-[feature-name].md`

```markdown
## Relevant Files

- `src/components/[NewComponent].tsx` - Main component implementation
- `src/components/[NewComponent].test.tsx` - Unit tests
- `src/lib/[utility].ts` - Supporting utilities if needed
- `src/components/ui/[baseComponent].tsx` - Base UI component if extending

### Notes
- Follow frosted glass styling patterns from existing components
- Use Serena's symbol-based editing for precise modifications
- Test camera integration on multiple devices

## Tasks

- [ ] 1.0 Research & Analysis
  - [ ] 1.1 Use Serena to analyze existing similar components
  - [ ] 1.2 Identify reusable patterns and utilities
  - [ ] 1.3 Document integration points
  
- [ ] 2.0 Component Development
  - [ ] 2.1 Create component structure with TypeScript types
  - [ ] 2.2 Implement core functionality
  - [ ] 2.3 Apply frosted glass styling patterns
  - [ ] 2.4 Add responsive mobile support
  
- [ ] 3.0 Integration
  - [ ] 3.1 Connect to timer system if needed
  - [ ] 3.2 Integrate with camera/media capture if needed
  - [ ] 3.3 Update routing/navigation if needed
  
- [ ] 4.0 Testing & Polish
  - [ ] 4.1 Write unit tests
  - [ ] 4.2 Test on multiple browsers
  - [ ] 4.3 Test on mobile devices
  - [ ] 4.4 Performance testing with timer running
  
- [ ] 5.0 Documentation & Cleanup
  - [ ] 5.1 Update CLAUDE.md if needed
  - [ ] 5.2 Add component to design system docs
  - [ ] 5.3 Clean up console logs and debug code
```

### 3. Implementation Process

#### Phase 1: Analysis
```bash
# Start with project overview
serena onboarding

# Analyze relevant components
serena get_symbols_overview src/components
serena find_symbol "ExistingComponent" --include-body=false

# Check for similar patterns
serena search_for_pattern "specific-pattern" --scope=src
```

#### Phase 2: Development
```bash
# Create component using symbol-based editing
serena create_text_file src/components/NewComponent.tsx "component-content"

# Add tests
serena create_text_file src/components/NewComponent.test.tsx "test-content"

# Update integration points
serena find_referencing_symbols src/components/RelatedComponent.tsx
```

#### Phase 3: Testing
```bash
# Run development checks
npm run dev         # Test in browser
npm run lint        # Code quality
npm run build       # TypeScript compilation
npm test           # Unit tests (if available)
```

#### Phase 4: Quality Assurance
- [ ] Visual review matches frosted glass patterns
- [ ] Mobile responsiveness verified
- [ ] Camera integration works (if applicable)
- [ ] Timer accuracy maintained
- [ ] Performance acceptable
- [ ] Cross-browser testing completed

### 4. Commit Process

```bash
# Stage changes
git add .

# Conventional commit with detailed messages
git commit -m "feat: add [feature-name] component" \
           -m "- Implements core functionality" \
           -m "- Follows frosted glass design patterns" \
           -m "- Includes mobile responsive design" \
           -m "- Related to PRD-[feature-name]"
```

## Common Patterns for Timer-Mirror

### Frosted Glass Button
```typescript
const Button = ({ variant = 'primary', ...props }) => {
  const variants = {
    primary: "bg-white/75 hover:bg-white/65 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:to-black/20 before:rounded-full text-black/70 backdrop-blur-md rounded-full inner-stroke-white-20-sm",
    secondary: "bg-gradient-to-b from-white/50 to-neutral-100/50 backdrop-blur-sm inner-stroke-white-10-sm shadow-sm rounded-full"
  }
  
  return <button className={cn(variants[variant], props.className)} {...props} />
}
```

### Camera Integration Hook
```typescript
const useCameraFeature = () => {
  // Follow patterns from src/lib/mediaCapture.ts
  // Handle permissions gracefully
  // Provide mobile fallbacks
}
```

### Mobile-First Responsive
```typescript
// Use existing patterns from components
className="px-3 sm:px-6 py-3 sm:py-3" // Smaller padding on mobile
className="text-sm sm:text-base"       // Smaller text on mobile
```

## Troubleshooting

### Common Issues
1. **Serena tools not available**: Restart Claude Code, accept trust dialogs
2. **Styling not matching**: Reference existing components for exact patterns
3. **Camera not working**: Test permissions and browser compatibility
4. **Mobile issues**: Test on actual devices, not just browser dev tools

### Quick Fixes
```bash
# Restart development server
npm run dev

# Clear cache issues
rm -rf node_modules/.vite && npm run dev

# Check for TypeScript errors
npm run build
```