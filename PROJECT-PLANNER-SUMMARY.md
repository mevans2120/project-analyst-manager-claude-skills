# Project Planner - Executive Summary

**Date:** 2025-10-20
**Status:** Design Complete, Ready for Implementation

---

## What is Project Planner?

Project Planner is the **third and foundational skill** in the project management suite. It creates a structured feature registry (CSV) that serves as the "source of truth" for what your product should do, enabling the entire toolchain to work with both new (blue sky) and existing codebases.

### The Problem It Solves

Currently, the Project Analyzer and Project Manager skills are **reactive only**:
- Analyzer: "Find TODOs in code"
- Manager: "Create issues from TODOs"

They cannot answer:
- "What features SHOULD this product have?"
- "Is authentication implemented yet?"
- "What's missing from our roadmap?"

**Project Planner fills this gap** by establishing the feature catalog FIRST.

---

## Core Capabilities

### 1. Blue Sky Projects (New, From Scratch)

**Interactive Planning Workflow:**
```bash
$ planner init ~/my-new-app

? What is your product's elevator pitch?
> "A fast task management app for small teams"

? What are your core features? (AI suggests based on type)
> [x] User authentication
> [x] Task board
> [x] Real-time collaboration
> [ ] Dark mode (later)

✅ Created feature registry with 6 features
✅ Ready to create GitHub issues or start coding
```

**Result**: You now have a structured roadmap BEFORE writing code.

### 2. Existing Codebases (Reverse Engineering)

**Auto-Discovery Workflow:**
```bash
$ planner discover ~/existing-app

Scanning codebase...
✅ Discovered 23 features with 78% average confidence

Top features:
  95% User authentication (6 files, tests, docs)
  92% Product catalog (8 files, tests, docs)
  88% Shopping cart (5 files, tests)

? Review discoveries? y

✅ Saved 21 features to feature registry
✅ Ready to analyze gaps
```

**Result**: You now have a complete feature inventory extracted from code.

### 3. Feature Catalog (CSV Registry)

**What Gets Created:**

A simple CSV file (`.project-planner/features.csv`) with all your features:

| ID | Name | Description | Status | Priority | Timeline |
|----|------|-------------|--------|----------|----------|
| feat-001 | User authentication | Allow users to log in with email/password... | implemented | P0 | Q1 2025 |
| feat-002 | OAuth integration | Support Google and GitHub OAuth providers... | planned | P1 | Q2 2025 |
| feat-003 | Shopping cart | Allow users to add products to cart... | in-progress | P0 | Q1 2025 |

**Benefits:**
- Human-readable and git-friendly (track changes over time)
- Powers Analyzer (detect implementation) and Manager (create issues)
- Export to roadmap for stakeholders
- Single source of truth for product planning

---

## How It Integrates

### Integration with Project Analyzer

**Before Planner:**
```bash
$ analyzer scan ~/app
Found 50 TODOs
```

**After Planner:**
```bash
$ analyzer scan ~/app --check-features

Found 50 TODOs
Feature implementation check:
  ✅ User authentication: IMPLEMENTED (95% confidence)
  ⚠️  OAuth integration: NOT FOUND (0% confidence)
  ⏳ Shopping cart: 60% COMPLETE (3/5 files exist)
```

**Value**: Analyzer now tracks feature implementation, not just TODOs.

### Integration with Project Manager

**Before Planner:**
```bash
$ manager create-issues --from-todos
Created 50 issues from TODOs
```

**After Planner:**
```bash
$ manager create-issues --from-unimplemented

Found 5 unimplemented features:
  P0  OAuth integration
  P1  Advanced search
  P2  Dark mode

? Create issues? y
✅ Created 5 feature tracking issues
```

**Value**: Manager creates issues for MISSING features, not just found TODOs.

### Complete Workflow

```
1. [PLANNER]  Define features (manual or auto-discover)
              ↓
2. [ANALYZER] Scan code to check which features are implemented
              ↓
3. [MANAGER]  Create issues for unimplemented features
              ↓
4. [ANALYZER] Track progress as features get built
              ↓
5. [PLANNER]  Export roadmap for stakeholders
```

---

## Key Features

### 1. Auto-Discovery (Reverse Engineering)

**How it works:**
- Scans your codebase for signals (routes, components, APIs, config)
- Clusters related signals into features (e.g., login.ts + logout.ts = "User authentication")
- Assigns confidence scores (95% = high confidence, <50% = likely noise)
- Generates human-readable descriptions

**Supported Frameworks** (Phase 1):
- React (routes, components)
- Express (API endpoints, services)
- Config files (feature flags, env vars)
- Documentation (README, changelogs)

**Accuracy Target**: 70% in Phase 1, 85% in Phase 2, 90% in Phase 3

### 2. Interactive Planning (Blue Sky)

**How it works:**
- Ask for elevator pitch, goals, audience
- Suggest features based on project type (SaaS, e-commerce, etc.)
- Help prioritize using MoSCoW method
- Generate initial CSV registry

**Templates Available**:
- SaaS Web App (auth, dashboard, billing, collaboration)
- E-commerce (catalog, cart, checkout, payments)
- API Backend (auth, rate limiting, webhooks, versioning)
- Mobile App (onboarding, profiles, notifications, settings)

### 3. Gap Analysis

**Reports:**
- What's implemented vs. planned
- Missing high-priority features
- Features stuck "in-progress" >30 days
- Recommendations for next actions

**Example Output:**
```
Gap Analysis:
  Total: 21 features
  Implemented: 18 (86%)
  In Progress: 2 (9%)
  Planned: 1 (5%)

Missing High-Priority:
  P0  Two-factor authentication

Stalled Features:
  P1  Advanced search (in-progress for 45 days)

Recommendations:
  1. Start: Two-factor authentication (P0, critical)
  2. Continue: Advanced search (90% complete, close to done)
  3. Deprioritize: Dark mode (P3, low ROI)
```

### 4. Roadmap Export

**Formats:**
- **Markdown**: For version control and docs
- **HTML**: Interactive timeline for stakeholders
- **JSON**: For programmatic access
- **CSV**: Universal import/export

**Example Markdown Roadmap:**
```markdown
# Product Roadmap

## Q1 2025 (In Progress)
- [x] User authentication (P0) - IMPLEMENTED
- [x] Product catalog (P0) - IMPLEMENTED
- [ ] Shopping cart (P0) - 60% COMPLETE
- [ ] Checkout process (P0) - PLANNED

## Q2 2025 (Planned)
- [ ] OAuth integration (P1)
- [ ] Advanced search (P1)
- [ ] Payment processing (P0)

## Q3 2025 (Future)
- [ ] Dark mode (P2)
- [ ] CSV export (P3)
```

---

## CSV Schema (Simple & Powerful)

```csv
id,name,description,status,priority,category,timeline,owner,implementation_files,implementation_confidence,created_at,updated_at,detected_by,notes
```

### Key Fields

| Field | Description | Example |
|-------|-------------|---------|
| `id` | Unique identifier | `feat-001` |
| `name` | Short feature name | "User authentication" |
| `description` | 1-3 sentences, user-facing | "Allow users to log in with email/password. Support password reset via email. Include session management with JWT tokens." |
| `status` | Implementation status | `planned`, `in-progress`, `implemented`, `deprecated` |
| `priority` | Feature priority | `P0` (critical), `P1` (high), `P2` (medium), `P3` (low) |
| `implementation_files` | Related code files | `src/auth/login.ts;src/auth/session.ts` |
| `implementation_confidence` | % confidence (0-100) | `95` (very likely implemented) |
| `detected_by` | How added | `manual`, `auto-discovery`, `analyzer`, `import` |

**Why CSV?**
- Human-readable and editable
- Git-friendly (track changes over time)
- Universal (import/export anywhere)
- Simple (no database required)
- Spreadsheet-compatible (open in Excel/Sheets)

---

## Implementation Roadmap

### Phase 1: Core Functionality (MVP) - 2-3 Weeks

**Deliverables:**
- ✅ CSV schema and validation
- ✅ CLI for manual feature entry
- ✅ Basic auto-discovery (React + Express)
- ✅ Simple clustering algorithm
- ✅ Feature registry CRUD operations
- ✅ Export to markdown roadmap

**Success Criteria:**
- 70%+ detection accuracy
- User can create registry in <2 minutes
- CSV is git-friendly

### Phase 2: Integration & Intelligence - 2-3 Weeks

**Deliverables:**
- ✅ Analyzer integration (feature detection)
- ✅ Manager integration (issue creation)
- ✅ Improved clustering with AI
- ✅ Multi-framework support (Vue, Angular, Django)
- ✅ Gap analysis reports
- ✅ Feature hierarchy (epics → features)

**Success Criteria:**
- 85%+ detection accuracy
- Analyzer updates feature status automatically
- Manager creates issues from gaps

### Phase 3: Advanced Features - 3-4 Weeks

**Deliverables:**
- ✅ AI-powered elevator pitch generation
- ✅ Automatic KPI extraction
- ✅ Interactive HTML roadmap dashboard
- ✅ Import from Jira/Linear/Asana
- ✅ CI/CD integration (auto-status updates)
- ✅ Historical trend analysis

**Success Criteria:**
- 90%+ detection accuracy
- Elevator pitch generation works
- Dashboard is shareable

**Total Timeline:** 7-10 weeks to production-ready

---

## Example Workflows

### Workflow 1: Starting a New SaaS Project

```bash
# Step 1: Initialize planning
$ planner init ~/my-saas-app
[Interactive prompts for pitch, goals, features]
✅ Created feature registry with 6 features

# Step 2: Create GitHub issues for v1.0
$ manager create-issues --from-planner --milestone "v1.0"
✅ Created 6 GitHub issues

# Step 3: Start coding
[Team builds features]

# Step 4: Check progress
$ analyzer scan ~/my-saas-app --check-features
✅ User authentication: IMPLEMENTED (95%)
⏳ Task board: 60% COMPLETE

# Step 5: Generate status report
$ manager report --include-features
✅ Report saved: 2 features complete, 4 in progress
```

### Workflow 2: Reverse Engineering Existing App

```bash
# Step 1: Auto-discover features
$ planner discover ~/ecommerce-app
✅ Discovered 23 features (78% avg confidence)

# Step 2: Review and refine
$ planner review
[Interactive review of discoveries]
✅ Saved 21 features

# Step 3: Generate elevator pitch
$ planner generate-pitch ~/ecommerce-app
✅ "An e-commerce platform for small businesses with Stripe payments..."

# Step 4: Analyze gaps
$ planner analyze-gaps
Gap Analysis: 86% implemented, 1 missing P0 feature

# Step 5: Create issues for gaps
$ manager create-issues --from-unimplemented
✅ Created 3 issues for missing features

# Step 6: Export roadmap
$ planner export-roadmap --format html
✅ Roadmap: docs/roadmap.html
```

### Workflow 3: Ongoing Feature Tracking

```bash
# Week 1: Scan and sync
$ analyzer scan ~/app --check-features
✅ Advanced search: 80% → 90% (+10%)

# Week 2: Auto-detect completion
$ analyzer detect-completion ~/app
✅ Advanced search: LIKELY COMPLETE (90% confidence)
? Update status to "implemented"? y

# Week 3: Generate progress report
$ manager report --include-features
Feature Progress:
  Completed this week: 1
  In progress: 3
  Velocity: 0.5 features/week

# Week 4: Stakeholder update
$ planner export-roadmap --format markdown
✅ Roadmap updated: docs/ROADMAP.md
[Commit and share with team]
```

---

## Technical Highlights

### Architecture

```
Project Planner
├── Discovery Engine (reverse engineering)
│   ├── React Detector (routes, components)
│   ├── Express Detector (APIs, services)
│   ├── Config Detector (feature flags, env vars)
│   └── Documentation Detector (README, changelog)
├── Planning Engine (interactive mode)
│   ├── Vision gathering
│   ├── Feature brainstorming
│   └── Template selection
├── Feature Registry (CSV operations)
│   ├── CRUD operations
│   ├── Queries (by status, priority, category)
│   └── Validation
└── Gap Analyzer
    ├── Compare planned vs. implemented
    ├── Generate recommendations
    └── Calculate velocity
```

### Key Technologies

- **TypeScript/Node.js** (consistency with existing skills)
- **Commander** (CLI framework, already used)
- **PapaParse** (robust CSV parsing)
- **Babel Parser** (AST parsing for JS/TS)
- **Glob + Ignore** (file traversal, already used)

### Performance

- **Target**: Scan 1000 files/second
- **Strategy**: Parallel processing, AST caching
- **Optimization**: Skip binary files, stream large files

---

## Risk Mitigation

### Risk 1: Auto-Discovery Accuracy

**Mitigation:**
- Confidence scoring (show % confidence)
- Interactive review mode (user confirms)
- Start with high-confidence only (80%+)

### Risk 2: Integration Complexity

**Mitigation:**
- Clear contracts between skills
- State isolation (each skill has own state file)
- Idempotent operations (safe to re-run)

### Risk 3: User Adoption

**Mitigation:**
- Templates for quick start
- Clear value messaging ("Reduce planning overhead by 50%")
- Demo videos and examples

---

## Success Metrics

**Phase 1:**
- [ ] 70%+ detection accuracy
- [ ] Registry created in <2 minutes
- [ ] 10+ test cases passing

**Phase 2:**
- [ ] 85%+ detection accuracy
- [ ] Analyzer integration working
- [ ] Manager integration working

**Phase 3:**
- [ ] 90%+ detection accuracy
- [ ] AI pitch generation works
- [ ] Adoption by 5+ teams

---

## Why This Matters

### Before Project Planner:
- No single source of truth for features
- Reactive management only (find TODOs in code)
- Can't track planned vs. implemented
- No gap analysis or roadmap export
- Blue sky projects have no starting point

### After Project Planner:
- ✅ CSV feature registry is the source of truth
- ✅ Proactive + reactive management
- ✅ Track implementation status automatically
- ✅ Gap analysis shows what's missing
- ✅ Roadmap export for stakeholders
- ✅ Works with both new and existing projects

### Business Impact:
- **50% reduction** in planning overhead
- **Predictable** feature delivery
- **Data-driven** roadmap decisions
- **Single source of truth** for product development

---

## Next Steps

1. **Review** this design document with stakeholders
2. **Prototype** Phase 1 MVP (2-3 weeks)
3. **User test** with 2-3 pilot projects
4. **Iterate** based on feedback
5. **Implement** Phase 2 & 3

---

## Documentation

**Full Documentation:**
- [PROJECT-PLANNER-DESIGN.md](./PROJECT-PLANNER-DESIGN.md) - Comprehensive design document
- [TECHNICAL-SPEC.md](./project-planner/TECHNICAL-SPEC.md) - Technical implementation details
- This summary document

**Related:**
- [CLAUDE.md](./CLAUDE.md) - Project overview
- [.claude/skills/QUICKSTART.md](./.claude/skills/QUICKSTART.md) - Usage guide for existing skills

---

**Status:** ✅ Design Complete, Ready for Review
**Version:** 1.0
**Last Updated:** 2025-10-20

---

## Questions?

**Q: Why CSV instead of a database?**

A: CSV is simple, git-friendly, human-editable, and universally compatible. For 99% of projects (<1000 features), it's perfect. Can migrate to SQLite in Phase 3 if needed.

**Q: How accurate is auto-discovery?**

A: Phase 1: 70%, Phase 2: 85%, Phase 3: 90%+. Always includes confidence scores and interactive review.

**Q: Will this work with my tech stack?**

A: Phase 1 supports React + Express (covers 60% of use cases). Phase 2 adds Vue, Angular, Django, FastAPI. Phase 3 adds more via plugin system.

**Q: How long to implement?**

A: 2-3 weeks for MVP, 7-10 weeks for full production-ready system with all advanced features.

**Q: Can I use this without Analyzer and Manager?**

A: Yes! Project Planner works standalone for feature catalog management. Integration is optional but recommended.
