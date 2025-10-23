---
name: project-manager
description: Manages complete feature lifecycle from planning to production. Creates/updates features in registry, generates roadmaps, manages GitHub issues with screenshots and visual documentation, and produces comprehensive reports. Use this for feature management, roadmap generation, issue automation, and project tracking.
---

# Project Manager Skill

Manages the complete feature lifecycle: feature registry, roadmap generation, visual documentation, GitHub issue management, and project reporting.

## When to Use This Skill

Invoke this skill when the user:
- **Feature Management**: Needs to add, update, or track features in the registry
- **Roadmap Generation**: Wants to create visual roadmaps (Markdown/HTML/JSON)
- **GitHub Integration**: Needs to create or update GitHub issues from features/TODOs
- **Visual Documentation**: Wants to attach screenshots to issues or features
- **Issue Automation**: Needs bulk issue creation with smart labeling
- **Project Reports**: Wants daily/weekly status reports or summaries
- **Feature Tracking**: Needs to track feature status, dependencies, progress
- **Dashboard Integration**: Wants to trigger actions from the interactive dashboard

## Core Capabilities

### 1. Feature Registry Management (PM-3)
- **CRUD Operations**: Create, read, update, delete features
- **Dependency Tracking**: Manage feature dependencies, detect circular deps
- **Status Management**: Track features through planning → development → shipped
- **Single Source of Truth**: CSV-based registry with full history
- **T-Shirt Sizing**: Track implementation effort using token-based estimates

### 2. Roadmap Generation (PM-9)
- **Markdown Export**: Beautiful roadmaps with progress bars and tables
- **HTML Export**: Dark-themed, responsive HTML roadmaps for stakeholders
- **JSON Export**: Structured data for integrations and dashboards
- **Grouping Options**: By phase, category, priority, or status

### 3. GitHub Issue Management
- **Create Issues** (PM-1): From features, TODOs, or analysis results
- **Update Issues** (PM-35): Auto-update when features change
- **Smart Labeling**: Auto-apply labels based on type, priority, category
- **Duplicate Prevention**: SHA256-based state tracking
- **Issue Linking** (PM-36): Automatic parent/child relationships

### 4. Visual Documentation (PM-12-15)
- **Screenshot Capture**: Code snippets, UI elements, full pages
- **Multi-Viewport** (PM-13): Mobile, tablet, desktop screenshots
- **Visual Comparison** (PM-14): Before/after with diff analysis
- **UI Bug Detection** (PM-15): Automated accessibility scanning
- **GitHub Upload**: Attach visual evidence to issues

### 5. Reporting & Analytics
- **Daily Reports**: Automated status reports with statistics
- **Summary Reports**: 30-day aggregated summaries
- **Progress Tracking**: Feature completion rates, velocity
- **Export Formats**: Markdown, JSON, CSV

## Integration with Dashboard

The manager integrates with the interactive dashboard at `http://localhost:5173`:

1. **Feature Registry**: View/edit features in interactive cards
2. **Drag & Drop**: Move features between backlog/nextUp/inProgress
3. **Action Triggers**: Click buttons to generate roadmaps, create issues
4. **Live Updates**: Real-time feature status updates
5. **Visual Tracking**: See progress bars, statistics, trends

### Dashboard Workflow
```
User clicks "Create Issues" in dashboard
→ Dashboard creates action in .dashboard-actions/
→ Claude detects action, invokes manager skill
→ Manager creates GitHub issues with screenshots
→ Results stream back to dashboard in real-time
→ Dashboard updates feature cards with issue links
```

## Instructions

### Step 1: Verify Prerequisites

Check GitHub authentication and configuration:

```bash
# Check GitHub token
if [ -z "$GITHUB_TOKEN" ]; then
  if ! gh auth status >/dev/null 2>&1; then
    echo "Please run: gh auth login"
    exit 1
  fi
fi

# Verify config exists
cd "{{INSTALL_DIR}}/project-manager"
if [ ! -f "project-manager.config.json" ]; then
  echo "Config needed. Creating from template..."
  cp project-manager.config.example.json project-manager.config.json
fi
```

### Step 2: Feature Registry Operations

#### Add/Update Features
```bash
cd "{{INSTALL_DIR}}/project-planner"

# Add a new feature
npx ts-node src/cli.ts registry add \
  --name "User Authentication" \
  --category "Auth" \
  --phase "Phase 1" \
  --status "planning" \
  --description "Login/signup with email and password"

# Update feature status
npx ts-node src/cli.ts registry update PM-42 --status "in-progress"

# List all features
npx ts-node src/cli.ts registry list --status backlog

# Get feature by ID
npx ts-node src/cli.ts registry get PM-42
```

#### Manage Dependencies
```bash
# Add dependency
npx ts-node src/cli.ts registry add-dependency PM-42 PM-15

# Check for circular dependencies
npx ts-node src/cli.ts registry validate-dependencies

# View dependency graph
npx ts-node src/cli.ts registry graph -o dependency-graph.md
```

#### T-Shirt Sizing for Effort Estimation

The Project Suite uses token-based effort estimation instead of traditional time/team size estimates. This approach aligns with Claude's capabilities and provides more accurate scoping.

**Size Categories:**

| Size | Token Estimate | Example Task |
|------|---------------|--------------|
| **XS** | 50k tokens | Bug fix, config change, simple implementation |
| **S** | 100k tokens | Feature implementation, small test suite |
| **M** | 200k tokens | Large test suite, complex feature |
| **L** | 400k tokens | Full module implementation |
| **XL** | >400k tokens | Must be broken down into smaller features |

**Sizing Guidelines:**
- Code complexity and lines to write
- Test coverage requirements
- Integration points and dependencies
- Documentation needs
- Configuration and setup

**Best Practices:**
- Features sized XL should be decomposed into multiple smaller features
- Most features should fall in the S-M range (100k-200k tokens)
- XS features are good for quick wins and bug fixes
- L features may need multiple implementation sessions

**Add sizing when creating features:**
```bash
npx ts-node src/cli.ts registry add \
  --name "User Authentication" \
  --category "Auth" \
  --size "M" \
  --token-estimate 200000 \
  --description "Login/signup with email and password"
```

### Step 3: Generate Roadmaps

```bash
cd "{{INSTALL_DIR}}/project-planner"

# Generate Markdown roadmap
npx ts-node src/cli.ts export roadmap \
  --format markdown \
  --group-by phase \
  -o roadmap.md

# Generate HTML roadmap for stakeholders
npx ts-node src/cli.ts export roadmap \
  --format html \
  --group-by category \
  -o roadmap.html

# Generate JSON for dashboard
npx ts-node src/cli.ts export roadmap \
  --format json \
  -o roadmap.json

# Grouped by priority
npx ts-node src/cli.ts export roadmap \
  --format markdown \
  --group-by priority \
  --filter-status "backlog,in-progress" \
  -o priority-roadmap.md
```

### Step 4: Create GitHub Issues

#### From Features
```bash
cd "{{INSTALL_DIR}}/project-manager"

# Create issues from feature registry
npx ts-node src/cli.ts create-issues \
  --from-registry \
  --status "backlog" \
  --dry-run  # Always dry-run first!

# Create for real
npx ts-node src/cli.ts create-issues \
  --from-registry \
  --status "backlog"
```

#### From Analysis Results
```bash
# Create issues from analyzer output (TODOs, bugs, features)
npm run manage create-issues -- -i analysis-results.json --dry-run

# With screenshots
npm run manage create-issues -- -i analysis-results.json --screenshots

# Review and create
npm run manage create-issues -- -i analysis-results.json
```

### Step 5: Visual Documentation

```bash
cd "{{INSTALL_DIR}}/project-manager"

# Capture screenshots for feature
npx ts-node src/cli.ts capture-screenshots \
  --feature PM-42 \
  --url https://staging.example.com/login \
  --viewports mobile,tablet,desktop

# Create issue with screenshots
npx ts-node src/cli.ts create-issue-with-screenshots \
  --feature PM-42 \
  --url https://staging.example.com/login

# Scan for UI bugs and create issues
npx ts-node src/cli.ts scan-and-create-issues \
  --url https://staging.example.com \
  --auto-screenshot
```

### Step 6: Generate Reports

```bash
cd "{{INSTALL_DIR}}/project-manager"

# Daily status report
npm run manage report

# Summary report (last 30 days)
npm run manage summary -- -d 30 -o summary-report.md

# Statistics
npm run manage stats

# Feature progress report
npx ts-node src/cli.ts report feature-progress -o progress.md
```

### Step 7: Dashboard Integration

#### Launch Dashboard
```bash
cd dashboard
npm run dev
# Open http://localhost:5173
```

#### Trigger Manager Actions from Dashboard
1. **From Roadmap Tab**: Click "Create Issues" → Triggers manager to create issues
2. **From Feature Cards**: Click "Generate Roadmap" → Creates roadmap export
3. **From Action Queue**: Monitor manager execution in real-time
4. **Drag & Drop**: Move features → Auto-updates registry via manager

## Common Workflows

### Workflow 1: Complete Feature Lifecycle
```
1. Discover features (use project-analyzer skill)
2. Add discovered features to registry (manager)
3. Generate roadmap for stakeholders (manager)
4. Verify features in production (use project-analyzer skill)
5. Create GitHub issues for gaps (manager)
6. Track progress in dashboard
7. Generate weekly status reports (manager)
```

### Workflow 2: Feature Release Management
```
1. Update feature statuses to "ready-to-ship"
2. Generate release roadmap
3. Verify features in staging (use project-analyzer)
4. Create visual documentation with screenshots
5. Generate deployment checklist
6. Update GitHub issues with production URLs
7. Generate release notes
```

### Workflow 3: Issue Automation with Screenshots
```
1. Scan UI for bugs (use project-analyzer)
2. Capture screenshots of each bug
3. Create GitHub issues with visual evidence
4. Apply smart labels (bug, priority, component)
5. Link related issues automatically
6. Generate bug report for team
```

### Workflow 4: Dashboard-Driven Workflow
```
1. User opens dashboard at localhost:5173
2. Views features in Roadmap tab
3. Drags feature from backlog to nextUp
4. Clicks "Create Issue" button
5. Manager creates GitHub issue automatically
6. Dashboard updates with issue link
7. User clicks "Generate Roadmap"
8. Manager exports HTML roadmap
9. Dashboard displays success message
```

## Configuration

### Manager Config Structure
```json
{
  "github": {
    "owner": "username",
    "repo": "repository",
    "defaultLabels": ["auto-created"],
    "issueTitlePrefix": "[PM]"
  },
  "stateFile": ".project-state.json",
  "reporting": {
    "outputPath": "docs/reports",
    "schedule": "daily"
  },
  "labels": {
    "TODO": ["feature", "priority-medium"],
    "FIXME": ["bug", "priority-high"],
    "BUG": ["bug", "priority-high"],
    "feature": ["feature", "priority-medium"]
  },
  "screenshots": {
    "enabled": true,
    "outputDir": "./screenshots",
    "uploadToGitHub": true,
    "viewports": ["mobile", "tablet", "desktop"]
  }
}
```

### Customizing Labels
Labels are automatically applied based on:
- **Feature category**: `auth` → `authentication` label
- **Priority**: `high` → `priority-high` label
- **Type**: `bug` → `bug` label, `feature` → `feature` label
- **Phase**: `Phase 1` → `phase-1` label
- **Source**: Auto-adds `from-registry`, `from-todo`, or `from-analyzer`

## Output Formats

### Feature Registry (CSV)
```csv
id,name,category,phase,status,priority,size,tokenEstimate,description,dependencies,tags
PM-42,User Login,Auth,Phase 1,in-progress,P0,S,100000,"Email/password authentication",PM-15,"security,mvp"
PM-43,Dashboard,UI,Phase 1,backlog,P1,M,200000,"Main dashboard view",PM-42,"ui,analytics"
```

### Roadmap (Markdown)
```markdown
# Project Roadmap

## Phase 1 (5 features)
Progress: ████████░░ 80% (4/5 complete)
**Effort**: 500k tokens (2 S, 2 M, 1 L)

### ✅ User Login (PM-42)
**Status**: Shipped | **Priority**: P0 | **Size**: S (100k tokens)
Email/password authentication with JWT tokens

### 🚧 Dashboard (PM-43)
**Status**: In Progress | **Priority**: P1 | **Size**: M (200k tokens)
Main dashboard with analytics and charts
```

### GitHub Issue Template
```markdown
# User Login

## Description
Email/password authentication with JWT tokens

## Details
- **Category**: Auth
- **Phase**: Phase 1
- **Priority**: P0
- **Size**: S (100k tokens)
- **Dependencies**: PM-15 (Authentication Service)

## Effort Estimate
**T-Shirt Size**: S
**Token Estimate**: 100,000 tokens
**Complexity**: Feature implementation with small test suite

## Screenshots
### Desktop View
![Desktop](screenshots/login-desktop.png)

### Mobile View
![Mobile](screenshots/login-mobile.png)

## Implementation Notes
- JWT with 24-hour expiration
- Password hashing with bcrypt
- Rate limiting on login endpoint

---
*Auto-generated by Project Manager*
*Feature ID: PM-42*
```

## Examples

### Example 1: Generate Stakeholder Roadmap

**User**: "Create a roadmap for our Q1 features to share with stakeholders"

**Response**:
1. Navigate to project-planner
2. Run: `npx ts-node src/cli.ts export roadmap --format html --group-by phase --filter-phase "Phase 1" -o Q1-roadmap.html`
3. Open Q1-roadmap.html in browser
4. Present: "Generated HTML roadmap with 15 Phase 1 features, grouped by category"
5. Offer: "Would you like me to create GitHub issues for these features?"

### Example 2: Feature with Visual Documentation

**User**: "Create a GitHub issue for the login feature with screenshots"

**Response**:
1. Check feature exists in registry: PM-42
2. Capture multi-viewport screenshots
3. Create GitHub issue with screenshots attached
4. Link issue back to feature registry
5. Update dashboard with issue link
6. Report: "Created issue #156 with 3 screenshots (mobile, tablet, desktop)"

### Example 3: Bulk Issue Creation from Dashboard

**User** (clicks "Create Issues" button in dashboard):

**Response**:
1. Dashboard creates action file
2. Manager detects action
3. Reads features marked "backlog" from registry
4. Runs dry-run, streams output to dashboard
5. User reviews in dashboard
6. Manager creates 12 GitHub issues
7. Dashboard updates feature cards with issue links
8. Display success: "Created 12 issues for backlog features"

## Dashboard Features

### Roadmap Tab
- **Interactive Cards**: Click to view/edit features
- **Drag & Drop**: Move between backlog/nextUp/inProgress
- **Search & Filter**: Find features by category, phase, priority
- **Action Buttons**: "Create Issues", "Generate Roadmap", "Export"
- **Progress Bars**: Visual tracking of phase/category completion

### Action Queue Tab
- **Live Output**: Stream manager execution in real-time
- **Action History**: See past operations
- **Status Indicators**: Pending, processing, completed, failed
- **Cancel Actions**: Stop long-running operations

### Tests Tab
- **Test Coverage**: See feature test status
- **Verification Results**: Production verification status
- **Visual Tests**: Screenshot comparisons

## State Management

The manager maintains state in `.project-state.json`:
```json
{
  "lastUpdated": "2025-10-22T14:30:00.000Z",
  "processedItems": [
    {
      "hash": "abc123",
      "type": "feature",
      "featureId": "PM-42",
      "issueNumber": 156,
      "issueUrl": "https://github.com/owner/repo/issues/156",
      "status": "created",
      "createdAt": "2025-10-22T14:30:00.000Z"
    }
  ],
  "metadata": {
    "totalFeatures": 40,
    "totalIssuesCreated": 25,
    "totalScreenshots": 75
  }
}
```

**Important**: Never delete this file - it prevents duplicate issue creation!

## Safety Features

### Dry-Run Mode
Always preview changes before committing:
- Shows exactly what will be created/updated
- No actual GitHub API calls
- Safe to run multiple times
- Review output before proceeding

### Duplicate Detection
- SHA256 hash prevents duplicate issues
- Checks registry for existing features
- Compares with state file
- Warns before creating duplicates

### Dependency Validation
- Detects circular dependencies
- Validates dependency existence
- Warns about missing prerequisites
- Suggests resolution order

## Error Handling

Common errors and solutions:
1. **GitHub token not found**: Run `gh auth login` or set `GITHUB_TOKEN`
2. **Config not found**: Created from template automatically
3. **Registry not found**: Initialize with `npx ts-node src/cli.ts registry init`
4. **Circular dependencies**: Run `registry validate-dependencies` to identify
5. **Screenshot capture fails**: Ensure Playwright installed: `npx playwright install`

## Integration with Project Analyzer

Complete workflow combining both skills:
1. **Analyzer discovers** features from code/web/TODOs
2. **Manager adds** discovered features to registry
3. **Analyzer verifies** features in production
4. **Manager creates** GitHub issues for gaps/bugs
5. **Manager generates** roadmap and reports
6. **Dashboard displays** complete feature status

## Tips for Best Results

- **Use dashboard** for interactive feature management
- **Start with dry-run** before bulk operations
- **Generate roadmaps weekly** to track progress
- **Attach screenshots** to UI-related issues
- **Link dependencies** to show feature relationships
- **Customize labels** to match your team's workflow
- **Regular reports** keep stakeholders informed
- **Validate dependencies** before marking features ready
- **Multi-viewport screenshots** for responsive features
- **Chain with analyzer** for complete automation
