# Product Roadmap Dashboard

**A feature-first, priority-driven project tracking dashboard**

## Quick Start

1. **Open the dashboard**:
   ```bash
   open dashboard/index.html
   ```
   Or double-click `index.html` in Finder

2. **Bookmark it** in your browser for quick access

3. **Update weekly** by editing `data.js` (2 minutes)

That's it!

---

## How to Update (Weekly)

### When You Start a New Feature

**Example**: Starting WebFetcher

Edit `data.js`:

```javascript
// 1. Move from nextUp to inProgress
inProgress: [
  {
    id: "shared-webfetcher",
    name: "WebFetcher - Static HTML Analysis",
    category: "Shared Library",
    priority: "P0",
    progress: 0,  // Start at 0%
    blockers: [],
    value: "Foundation for all web viewing",
    notes: "Building core fetch and AI analysis capabilities"
  }
],

// 2. Remove from nextUp
nextUp: [
  // Remove the WebFetcher entry
  {
    id: "shared-playwright", // This is now first in nextUp
    // ...
  }
],

// 3. Also add to current array
current: [
  {
    id: "shared-webfetcher",
    name: "WebFetcher - Static HTML Analysis",
    category: "Shared Library",
    priority: "P0",
    progress: 0,
    blockers: [],
    value: "Foundation for all web viewing",
    notes: "Building core fetch and AI analysis capabilities"
  }
],
```

Save and refresh browser.

### As You Make Progress

**Example**: WebFetcher is 40% done

Edit `data.js`:

```javascript
current: [
  {
    id: "shared-webfetcher",
    name: "WebFetcher - Static HTML Analysis",
    category: "Shared Library",
    priority: "P0",
    progress: 40,  // Update progress
    blockers: [],
    value: "Foundation for all web viewing",
    notes: "fetch() working, added AI analysis, 15 tests passing"
  }
],
```

Save and refresh browser.

### When You Finish a Feature

**Example**: WebFetcher is done!

Edit `data.js`:

```javascript
// 1. Move from inProgress to shipped
shipped: [
  {
    id: "shared-webfetcher",
    name: "WebFetcher - Static HTML Analysis",
    category: "Shared Library",
    shippedDate: "2025-11-01",  // Add ship date
    value: "Foundation for all web viewing - 25 tests passing"
  },
  // ...other shipped features
],

// 2. Remove from inProgress
inProgress: [],  // Now empty

// 3. Remove from current
current: [],  // Ready for next feature!
```

Save and refresh browser.

### Adding a New Feature

**Example**: Discovered a new feature to build

Edit `data.js`:

```javascript
backlog: [
  {
    id: "new-feature-id",  // Use kebab-case
    name: "Descriptive Feature Name",
    category: "Planner",  // or Analyzer, Manager, Shared Library, etc.
    priority: "P2",  // P0 (critical), P1 (high), P2 (medium), P3 (low)
    dependencies: ["other-feature-id"],  // What must be done first
    value: "Why this matters - what value it provides"
  },
  // ...other backlog features
]
```

Save and refresh browser.

---

## Dashboard Sections Explained

### 1. 🚀 Current
**What it shows**: The feature(s) you're actively building RIGHT NOW

**When to update**:
- Start: Move feature from nextUp to current
- Progress: Update the `progress` field (0-100)
- Finish: Move to shipped

**Tip**: Keep only 1-2 features in current. Focus!

### 2. 📦 All Features
**What it shows**: All features organized by status

**Categories**:
- ✅ **Shipped**: Done, in production
- 🏗️ **In Progress**: Currently building
- 🔜 **Next Up**: Ready to start (no blockers)
- 📋 **Backlog**: Future work

**Tip**: Drag features between categories by editing data.js

### 3. ⚡ Priority Queue
**What it shows**: What to work on next, in priority order

**When to update**:
- Weekly review of priorities
- When dependencies change
- When new blockers appear

**Tip**: This answers "What should I work on next?"

### 4. 🎬 Quick Actions
**What it shows**: Links to important resources

**Customize**: Edit the links in index.html if needed

---

## File Structure

```
dashboard/
├── index.html    # Dashboard UI (rarely changes)
├── data.js       # Your data (update weekly)
└── README.md     # This file
```

**What to edit**: Almost always just `data.js`

**What NOT to edit**: `index.html` (unless you want to customize the UI)

---

## Data Structure Reference

### Feature Object

```javascript
{
  id: "unique-kebab-case-id",           // Required: Unique identifier
  name: "Human Readable Feature Name",  // Required: What shows in UI
  category: "Planner",                  // Required: Planner, Analyzer, Manager, Shared Library, etc.
  priority: "P0",                       // Optional: P0, P1, P2, P3
  dependencies: ["other-feature-id"],   // Optional: What must be done first
  value: "Why this matters",            // Optional but recommended

  // For in-progress features only:
  progress: 40,                         // Optional: 0-100
  blockers: ["Issue #123"],             // Optional: What's blocking progress
  notes: "Current status details"       // Optional: Free-form notes

  // For shipped features only:
  shippedDate: "2025-11-01"            // Required for shipped: When completed
}
```

### Priority Levels

- **P0**: Critical - blocks other work
- **P1**: High - important features
- **P2**: Medium - nice to have
- **P3**: Low - future enhancements

### Categories

Use these standard categories:
- `Shared Library` - Shared web viewer components
- `Planner` - Project Planner features
- `Analyzer` - Project Analyzer features
- `Manager` - Project Manager features
- `Integration` - Cross-skill features
- `Design` - Design/planning work
- `Infrastructure` - DevOps, tooling, etc.

---

## Common Workflows

### Weekly Review (Monday, 5 minutes)

1. **Check current**: How much progress?
   - Update `progress` field
   - Update `notes` with status

2. **Finish features**: Any features done?
   - Move to `shipped`
   - Add `shippedDate`

3. **Start next**: What's next?
   - Check priority queue
   - Move from `nextUp` to `current`

4. **Adjust priorities**: Anything change?
   - Reorder `priorityQueue`
   - Update `dependencies`

Save, refresh, done!

### Feature Lifecycle

```
Idea
  ↓
Add to backlog
  ↓
Move to nextUp (when dependencies met)
  ↓
Move to current (when starting work)
  ↓
Update progress as you build (0%, 20%, 40%, 60%, 80%, 100%)
  ↓
Move to shipped (when complete)
```

---

## Tips & Best Practices

### Focus
- ✅ Keep 1-2 features in `current` max
- ✅ Finish before starting new ones
- ❌ Don't spread across too many features

### Dependencies
- ✅ List dependencies clearly
- ✅ Only move to `nextUp` when dependencies are in `shipped`
- ✅ Use `priorityQueue` to plan order

### Progress Updates
- ✅ Update weekly (or when milestones hit)
- ✅ Be honest about progress
- ❌ Don't obsess over exact percentages

### Priorities
- ✅ Use P0 for critical blockers
- ✅ Use P1 for must-haves
- ✅ Use P2-P3 for nice-to-haves
- ❌ Don't make everything P0

### Value Statements
- ✅ Explain WHY this matters
- ✅ What problem does it solve?
- ✅ Who benefits?
- ❌ Don't just describe WHAT it does

---

## Customization

### Change Colors

Edit the `<style>` section in `index.html`:

```css
/* Primary color (currently blue) */
--primary: #58a6ff;

/* Success color (currently green) */
--success: #3fb950;

/* Warning color (currently orange) */
--warning: #d29922;

/* Danger color (currently red) */
--danger: #f85149;
```

### Add Sections

Add new sections in `index.html` after the existing sections:

```html
<!-- 5. YOUR NEW SECTION -->
<div class="section">
  <h2>🎨 Your Section</h2>
  <div id="your-section"></div>
</div>
```

Then add rendering logic in the `<script>` tag.

### Change Layout

Modify the CSS grid, flexbox, or spacing in the `<style>` section.

---

## Troubleshooting

### Dashboard shows "Loading..."
- **Problem**: JavaScript not loading
- **Fix**: Make sure `data.js` is in the same folder as `index.html`

### Features not showing
- **Problem**: Syntax error in `data.js`
- **Fix**: Check browser console (F12) for errors
- **Common**: Missing comma, extra comma, unclosed brackets

### Styles look broken
- **Problem**: Browser cache
- **Fix**: Hard refresh (Cmd+Shift+R on Mac, Ctrl+Shift+R on Windows)

### Need to reset
- **Problem**: Messed up data.js
- **Fix**: Git restore: `git checkout dashboard/data.js`

---

## Future Enhancements

When you feel pain from not having these, add them:

### Auto-Generate from Git
```bash
npm run dashboard:update
# Reads git log, updates shipped dates
```

### Export to JSON
```bash
npm run dashboard:export
# Creates roadmap.json for other tools
```

### Use Planner to Manage Itself
```bash
planner dashboard --live
# Dashboard becomes a Planner feature
```

But not now. Keep it simple until you need more.

---

## Philosophy

**This dashboard follows these principles**:

1. **Features > Time** - Focus on what's built, not when
2. **Priority > Schedule** - Focus on what matters most
3. **Value > Velocity** - Focus on impact, not speed
4. **Simple > Complex** - Two files, manual updates, no build
5. **Flexible > Rigid** - Adapt as AI changes timelines

**The Rule**: Only add features when you feel actual pain from not having them.

---

## Questions?

- **How often should I update?** Weekly is fine. Daily if you want.
- **What if I don't know progress %?** Guess! 0% = started, 50% = halfway, 100% = done
- **Can I track time?** You can, but we don't recommend it. Focus on features.
- **Should I add every tiny task?** No. Only features that provide user value.
- **What if estimates are wrong?** That's fine! This isn't about estimates.

Remember: This is a roadmap, not a schedule. Ship when ready, not by deadline.
