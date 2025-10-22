# Project Conventions

**Purpose**: Standards for file naming, folder structure, and project organization.

**Audience**: Contributors and maintainers working on the Project Management Suite skills.

---

## File Naming Conventions

### Pattern

```
[COMPONENT]-[TYPE]-[KEY-DETAILS]-[DATE].md

Examples:
- PROJECT-MANAGEMENT-SUITE-INTEGRATED-IMPLEMENTATION-PLAN-2025-10-21.md
- PLANNER-SKILL-COMPREHENSIVE-DESIGN-2025-10-20.md
- DASHBOARD-DESIGN-FEATURE-FIRST-2025-10-21.md
- ANALYZER-SKILL-VERIFICATION-STRATEGY-2025-10-22.md
```

### Components

**[COMPONENT]** - What the document is about:
- `PROJECT-MANAGEMENT-SUITE` - The entire suite (all skills)
- `PLANNER-SKILL` - Project Planner skill
- `ANALYZER-SKILL` - Project Analyzer skill
- `MANAGER-SKILL` - Project Manager skill
- `SHARED-LIBRARY` - Shared web viewing library
- `DASHBOARD` - Product roadmap dashboard

**[TYPE]** - Type of document:
- `DESIGN` - Design document
- `IMPLEMENTATION-PLAN` - Implementation/development plan
- `DOCUMENTATION-INDEX` - Navigation/index doc
- `EXECUTIVE-SUMMARY` - High-level summary
- `API-REFERENCE` - API documentation
- `USER-GUIDE` - End-user guide
- `ARCHITECTURE` - Architecture/technical design

**[KEY-DETAILS]** - Distinguishing information (optional):
- Use descriptive terms that make the file unique
- Examples: `COMPREHENSIVE`, `FEATURE-FIRST`, `INTEGRATED`, `3-TIER-VERIFICATION`
- Keep concise (1-3 words max)

**[DATE]** - Creation date in `YYYY-MM-DD` format:
- Always use ISO 8601 date format: `2025-10-21`
- Represents when the document was created
- Does NOT change when document is updated (use git history for that)

### Rules

1. **UPPERCASE** - All filenames use UPPERCASE for consistency
2. **Hyphens** - Use hyphens (`-`) to separate words, no underscores
3. **No time estimates** - Never include time estimates in filenames (e.g., "12-15-weeks")
   - Reason: Estimates are always wrong, especially with AI assistance
   - Time information can be in the document content, not the filename
4. **Descriptive** - Filename should clearly indicate content without opening file
5. **No version numbers** - Use git history for versioning, not filenames like `v1`, `v2`

---

## Folder Structure

### Root Directory

```
/
├── PROJECT-MANAGEMENT-SUITE-*.md     # Suite-wide documentation
├── PLANNER-SKILL-*.md                # Planner skill docs
├── ANALYZER-SKILL-*.md               # Analyzer skill docs
├── MANAGER-SKILL-*.md                # Manager skill docs
├── DASHBOARD-*.md                    # Dashboard documentation
├── CONVENTIONS.md                    # This file
├── CLAUDE.md                         # Claude Code instructions
├── README.md                         # Project overview
├── archive/                          # Superseded/old documents
├── dashboard/                        # Dashboard implementation
├── project-analyzer/                 # Analyzer skill source
├── project-manager/                  # Manager skill source
├── .claude/                          # Claude Code configuration
└── ...
```

### Archive Folder

**Purpose**: Store superseded or old documents that are no longer current but have historical value.

**When to archive**:
- Document has been replaced by a newer version
- Approach/design was tried but abandoned
- Historical reference material

**Examples**:
- `archive/ROADMAP-INITIAL-3-PHASES-2025-10-20.md` (replaced by integrated plan)
- `archive/DASHBOARD-DESIGN-TIME-BASED-2025-10-21.md` (replaced by feature-first)

**Rules**:
- Keep original filename and date
- Do NOT rename to add "OLD" or "ARCHIVED" - the folder indicates status
- Add a note at the top of the archived file explaining why it was archived

---

## Git Commit Messages

### Format

```
Short summary (50 chars max)

Longer explanation if needed. Explain WHAT and WHY, not HOW.
The code shows the HOW.

- Bullet points are fine
- Keep lines under 72 characters

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Rules

1. **Present tense** - "Add feature" not "Added feature"
2. **Imperative mood** - "Fix bug" not "Fixes bug"
3. **Concise summary** - First line under 50 characters
4. **Explain why** - Body explains the motivation for the change
5. **Claude attribution** - Always include Claude Code attribution footer

---

## Code Organization

### TypeScript/JavaScript

**File naming**:
- `camelCase.ts` for implementation files
- `PascalCase.ts` for classes/components
- `kebab-case.test.ts` for test files

**Examples**:
- `webFetcher.ts` - Core implementation
- `FeatureExtractor.ts` - Class definition
- `web-fetcher.test.ts` - Tests

### Directory structure

```
src/
├── core/           # Core functionality
├── utils/          # Utility functions
├── formatters/     # Output formatters
├── types/          # TypeScript types
└── __tests__/      # Tests (if not co-located)
```

---

## Documentation

### Markdown Style

1. **Headers** - Use `#` syntax, not underlines
2. **Code blocks** - Always specify language: \`\`\`typescript
3. **Links** - Use descriptive text: `[see the guide](link)` not `click here`
4. **Lists** - Use `-` for bullets, `1.` for numbered
5. **Emphasis** - `**bold**` for important, `*italic*` for emphasis
6. **Code mentions** - Use backticks for `code`, filenames, commands

### Document Structure

Every major design document should have:

```markdown
# Title

**Status**: Draft | Design Complete | Implemented
**Date**: YYYY-MM-DD
**Author**: Name or "Claude Code"

---

## Executive Summary
(What is this? Why does it matter?)

## Overview
(High-level explanation)

## Detailed Design
(Technical details)

## Implementation Plan
(How to build it)

## Testing Strategy
(How to verify it works)

## Future Enhancements
(What comes next)
```

---

## Dashboard Data Conventions

### Feature Objects

When adding features to `dashboard/data.js`:

```javascript
{
  id: "kebab-case-id",              // Unique identifier
  number: 1,                         // Feature number (sequential, used for references)
  name: "Human Readable Name",       // What shows in UI
  category: "Category Name",         // Planner, Analyzer, Manager, etc.
  phase: "Phase X",                  // Phase 0, Phase 1, Phase 2, etc.
  priority: "P0",                    // P0, P1, P2, P3
  dependencies: ["other-id"],        // What must be done first (use IDs, dashboard converts to numbers)
  value: "Why this matters",         // Business value

  // For in-progress only:
  progress: 40,                      // 0-100
  blockers: ["Issue #123"],          // What's blocking
  notes: "Current status"            // Free-form notes

  // For shipped only:
  shippedDate: "2025-10-21"         // YYYY-MM-DD
}
```

### Feature Numbering

Features are numbered sequentially starting from 1:
- **Next Up**: #1-3 (features ready to start)
- **Backlog**: #4-17 (features not yet ready)
- **Future features**: Continue numbering from last backlog item

**Purpose**: Feature numbers allow easy reference in discussions and dependency tracking.

**Example**: "Feature #2 depends on #1" is clearer than "PlaywrightDriver depends on shared-webfetcher"

**Rules**:
- Numbers are permanent - don't renumber when features move between sections
- When adding new features, assign the next available number
- Dependencies use IDs in the data, but dashboard displays as numbers (#1, #5, etc.)

### Phase Names

Use these standard phase names:
- `Planning` - Design and planning work
- `Phase 0` - Shared Library Foundation
- `Phase 1` - Project Planner
- `Phase 2` - Analyzer Enhancement
- `Phase 3` - Manager Enhancement
- `Integration` - Cross-skill workflows
- `Future` - Post-launch features

### Priority Levels

- `P0` - Critical, blocks other work
- `P1` - High priority, important features
- `P2` - Medium priority, nice to have
- `P3` - Low priority, future enhancements

---

## Testing Conventions

### Test File Naming

- Co-locate tests: `webFetcher.ts` → `webFetcher.test.ts`
- Or use `__tests__/` directory
- Use `.test.ts` suffix, not `.spec.ts`

### Test Structure

```typescript
describe('ComponentName', () => {
  describe('methodName', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

---

## When in Doubt

1. **Look at existing files** - Follow established patterns
2. **Ask for clarification** - Better to ask than guess
3. **Document your decision** - If you make a new pattern, document it here
4. **Keep it simple** - Favor clarity over cleverness

---

## Updating This Document

**When to update**:
- New patterns emerge
- Existing conventions prove problematic
- Team agrees on new standards

**How to update**:
1. Propose changes in a PR with rationale
2. Get team consensus (or user approval)
3. Update this document
4. Update `CLAUDE.md` reference if needed
5. Migrate existing files if necessary (use `git mv` to preserve history)

---

## Questions?

If something isn't covered here or seems unclear, that's a sign we should update this document. Please propose additions or clarifications!
