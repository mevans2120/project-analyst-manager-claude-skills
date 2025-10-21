# Project Planner - Quick Reference Card

**Version:** 1.0 | **Status:** Design Phase

---

## CLI Commands

### Initialization & Discovery

```bash
# Interactive project initialization (blue sky)
planner init [path]

# Auto-discover features from existing code
planner discover [path] [options]
  -f, --frameworks <list>      Comma-separated frameworks (react,express)
  -m, --min-confidence <num>   Minimum confidence % (default: 50)
  -o, --output <file>          Output CSV path

# Review discovered features interactively
planner review [options]
  -i, --input <file>           Input CSV path
```

### Feature Management

```bash
# List features with filters
planner list [options]
  -s, --status <status>        Filter by status (planned/in-progress/implemented)
  -p, --priority <priority>    Filter by priority (P0/P1/P2/P3)
  -c, --category <category>    Filter by category
  --format <format>            Output format (table/json/csv)

# Add feature manually (interactive)
planner add [options]
  -n, --name <name>            Feature name
  -d, --description <desc>     Feature description
  -p, --priority <priority>    Priority (P0-P3)

# Edit existing feature
planner edit <id>

# Remove feature
planner remove <id>
```

### Analysis & Export

```bash
# Gap analysis report
planner analyze-gaps [options]
  -o, --output <file>          Output file path

# Export roadmap
planner export-roadmap [options]
  -f, --format <format>        Output format (markdown/html/json)
  -o, --output <file>          Output file path

# Generate elevator pitch
planner generate-pitch [path]

# Sync with Analyzer/Manager
planner sync
```

---

## CSV Schema

```csv
id,name,description,status,priority,category,timeline,owner,parent_id,implementation_files,implementation_confidence,created_at,updated_at,detected_by,notes
```

### Field Reference

| Field | Type | Values | Example |
|-------|------|--------|---------|
| `status` | enum | planned, in-progress, implemented, deprecated | `implemented` |
| `priority` | enum | P0, P1, P2, P3 | `P0` |
| `implementation_confidence` | number | 0-100 | `85` |
| `detected_by` | enum | manual, auto-discovery, analyzer, import | `auto-discovery` |
| `implementation_files` | string | Semicolon-separated paths | `src/auth/login.ts;src/auth/session.ts` |

---

## Typical Workflows

### Blue Sky Project

```bash
planner init ~/new-app                           # Initialize
planner export-roadmap -f markdown               # Export roadmap
manager create-issues --from-planner             # Create GitHub issues
# ... build features ...
analyzer scan ~/new-app --check-features         # Check progress
```

### Existing Codebase

```bash
planner discover ~/existing-app                  # Auto-discover
planner review                                   # Review findings
planner analyze-gaps                             # Find gaps
manager create-issues --from-unimplemented       # Create issues for gaps
```

### Ongoing Tracking

```bash
analyzer scan ~/app --check-features             # Update implementation status
analyzer detect-completion ~/app                 # Find completed features
manager report --include-features                # Progress report
planner export-roadmap -f html                   # Stakeholder roadmap
```

---

## Integration Points

### With Project Analyzer

**Before:**
```bash
analyzer scan ~/app
# Output: Found 50 TODOs
```

**After:**
```bash
analyzer scan ~/app --check-features
# Output:
#   Found 50 TODOs
#   Feature check: 18/21 implemented (86%)
#   Missing: OAuth integration (P1)
```

### With Project Manager

**Before:**
```bash
manager create-issues --from-todos
# Creates issues for all TODOs
```

**After:**
```bash
manager create-issues --from-unimplemented
# Creates issues only for planned-but-missing features
```

---

## Key Concepts

### Feature Status Lifecycle

```
planned → in-progress → implemented
   ↓
deprecated (if removed)
```

### Priority Levels

- **P0**: Critical, blocking (must have for launch)
- **P1**: High priority (should have soon)
- **P2**: Medium priority (could have later)
- **P3**: Low priority (won't have this iteration)

### Confidence Scoring (Auto-Discovery)

- **90-100%**: Very high (multiple signals, tests, docs)
- **70-89%**: High (code signals + naming consistency)
- **50-69%**: Medium (single signal or ambiguous)
- **<50%**: Low (filtered out by default)

---

## Feature Detection Signals

### React

- Routes: `<Route path="/dashboard" />`
- Components: `<ShoppingCart />`, `<UserProfile />`
- Feature flags: `if (features.darkMode)`

### Express

- API endpoints: `app.post('/api/orders')`
- Services: `class PaymentService`
- Database models: `class Order extends Model`

### Config

- Env vars: `STRIPE_API_KEY=...`
- Feature flags: `"darkMode": true`

### Documentation

- README sections: `## Features`
- Changelog: `### v2.1.0 - Added CSV export`
- Tests: `describe('Shopping cart')`

---

## Common Options

### Discovery Options

```bash
--frameworks react,express    # Specify frameworks
--min-confidence 70            # Only high-confidence
--exclude "node_modules/*"     # Skip patterns
```

### Export Formats

```bash
--format markdown              # Human-readable docs
--format html                  # Interactive timeline
--format json                  # Programmatic access
--format csv                   # Universal export
```

---

## File Locations

```
<project-root>/
├── .project-planner/
│   ├── features.csv           # Feature registry (THE source of truth)
│   ├── state.json             # Planner state
│   └── backups/               # Auto-backups
├── docs/
│   └── roadmap.md             # Exported roadmap (version controlled)
└── .gitignore
    # Add: .project-planner/state.json
```

---

## Templates

### Available Templates

- **saas-app**: Auth, dashboard, billing, collaboration
- **ecommerce**: Catalog, cart, checkout, payments
- **api-backend**: Auth, rate limiting, webhooks
- **mobile-app**: Onboarding, profiles, notifications

### Usage

```bash
planner init --template saas-app
# Creates registry pre-filled with common SaaS features
```

---

## Performance

- **Scan Speed**: ~1000 files/second
- **Registry Size**: Supports 1000+ features
- **Accuracy**: 70% (Phase 1) → 85% (Phase 2) → 90% (Phase 3)

---

## Troubleshooting

### Low accuracy in discovery

```bash
# Increase confidence threshold
planner discover --min-confidence 80

# Review and refine
planner review
```

### CSV parsing errors

```bash
# Validate CSV
planner list --format json
# If errors, check for unescaped quotes or line breaks
```

### Integration not working

```bash
# Check state files exist
ls .project-planner/
ls .project-analyzer/
ls .project-state.json

# Re-sync
planner sync
```

---

## Best Practices

1. **Version control**: Commit `features.csv` to track evolution
2. **Regular updates**: Run `analyzer --check-features` weekly
3. **Review discoveries**: Always review auto-discovered features
4. **Start simple**: Begin with high-confidence (80%+) only
5. **Export roadmaps**: Generate stakeholder reports monthly

---

## API (Programmatic Usage)

```typescript
import { FeatureRegistry, DiscoveryEngine } from 'project-planner';

// Load registry
const registry = new FeatureRegistry('.project-planner/features.csv');
await registry.load();

// Query features
const unimplemented = await registry.getByStatus('planned');
const critical = await registry.getByPriority('P0');

// Auto-discover
const discovery = new DiscoveryEngine();
const features = await discovery.discover({
  rootPath: './my-app',
  minConfidence: 70
});

// Add features
await registry.addFeature({
  name: 'User authentication',
  description: 'Allow users to log in...',
  status: 'planned',
  priority: 'P0',
  // ...
});

// Save
await registry.save();
```

---

## Support

- **Full Documentation**: [PROJECT-PLANNER-DESIGN.md](../PROJECT-PLANNER-DESIGN.md)
- **Technical Spec**: [TECHNICAL-SPEC.md](./TECHNICAL-SPEC.md)
- **Quick Start**: [.claude/skills/QUICKSTART.md](../.claude/skills/QUICKSTART.md)

---

**Quick Tip**: Start with `planner discover` if you have existing code, or `planner init` for new projects!
