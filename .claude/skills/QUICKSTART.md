# Quick Start: Project Suite Claude Skills

Three production-ready Claude Code skills for automated project management with interactive dashboard integration.

## Skills Available

### 1. `project-analyzer`
Discovers features from code, web applications, and production environments. Verifies implementations, performs visual testing, and validates deployments.

**Invoke by asking Claude**:
- "Discover features in this codebase"
- "Analyze the production website for features"
- "Verify features work in staging"
- "Run visual regression tests"
- "Compare staging vs production"

### 2. `project-manager`
Manages complete feature lifecycle from planning to production. Creates/updates feature registry, generates roadmaps, manages GitHub issues with visual documentation, and produces reports.

**Invoke by asking Claude**:
- "Add this feature to the registry"
- "Generate a roadmap for stakeholders"
- "Create GitHub issues from the backlog"
- "Track feature progress"
- "Generate weekly status report"

### 3. `project-planner`
Plans and organizes features with dependency tracking, phase management, and priority scoring. Exports roadmaps in multiple formats.

**Invoke by asking Claude**:
- "Plan the next sprint"
- "Show feature dependencies"
- "Export roadmap as HTML"
- "What's ready to ship?"

## Interactive Dashboard

The Project Suite includes an interactive dashboard for real-time feature management:

```bash
cd dashboard
npm run dev
# Open http://localhost:5173
```

### Dashboard Features
- **Roadmap Tab**: View/edit features with drag & drop organization
- **Tests Tab**: See verification results and test coverage
- **Action Queue**: Monitor skill execution in real-time
- **Search & Filter**: Find features by category, phase, priority
- **Live Updates**: Real-time feature status and progress tracking

### Dashboard Workflow
```
1. User opens dashboard at localhost:5173
2. Views features in interactive cards
3. Clicks "Analyze Repository" or "Create Issues"
4. Dashboard creates action in .dashboard-actions/
5. Claude detects action, invokes appropriate skill
6. Results stream back to dashboard in real-time
7. Dashboard updates with new feature data/issue links
```

## First-Time Setup

### For All Skills

1. **Install Dependencies**
   ```bash
   # Install all packages
   cd project-analyzer && npm install && npm run build
   cd ../project-manager && npm install && npm run build
   cd ../project-planner && npm install && npm run build
   cd ../shared && npm install && npm run build
   cd ../dashboard && npm install
   ```

2. **Install Playwright** (for web testing)
   ```bash
   npx playwright install
   ```

### For GitHub Integration

1. **GitHub Authentication**
   ```bash
   # Option 1: Use gh CLI (recommended)
   gh auth login

   # Option 2: Export token
   export GITHUB_TOKEN="your_personal_access_token"
   ```

2. **Create Configuration**
   ```bash
   cd project-manager
   cp project-manager.config.example.json project-manager.config.json
   ```

   Edit `project-manager.config.json` with your repository details:
   - `owner`: Your GitHub username or organization
   - `repo`: Repository name

## Usage Examples

### Example 1: Complete Feature Discovery & Management

```
You: "Discover features in this codebase"
Claude: [Invokes project-analyzer to scan code structure]
        [Finds 25 features from React routes, Express endpoints, components]
        [Displays in dashboard]

You: "Add these to the feature registry"
Claude: [Invokes project-manager to add features to registry]
        [Updates dashboard with feature cards]

You: "Generate a roadmap for stakeholders"
Claude: [Invokes project-planner to export HTML roadmap]
        [Creates beautiful dark-themed roadmap grouped by phase]
```

### Example 2: Production Verification

```
You: "Verify our features work in production"
Claude: [Invokes project-analyzer with production URL]
        [Runs 3-tier verification: URL, functionality, API]
        [Streams results to dashboard Tests tab]

You: "Create issues for any failures"
Claude: [Invokes project-manager with verification results]
        [Creates GitHub issues with screenshots]
        [Links issues back to feature registry]
```

### Example 3: Feature Release Management

```
You: "What features are ready to ship?"
Claude: [Invokes project-planner to analyze registry]
        [Shows features with status "ready-to-ship"]

You: "Generate release notes"
Claude: [Invokes project-manager to create release report]
        [Exports markdown with feature details, screenshots]

You: "Verify in staging before deployment"
Claude: [Invokes project-analyzer to compare staging vs production]
        [Runs visual regression tests]
        [Generates deployment readiness checklist]
```

### Example 4: Dashboard-Driven Workflow

```
You: [Opens dashboard at localhost:5173]
     [Drags feature from backlog to nextUp]
     [Clicks "Create Issue" button]

Claude: [Detects dashboard action]
        [Invokes project-manager]
        [Creates GitHub issue with screenshots]
        [Dashboard updates feature card with issue link]

You: [Clicks "Generate Roadmap" in dashboard]

Claude: [Invokes project-planner]
        [Exports HTML roadmap]
        [Dashboard displays success message]
```

### Example 5: Visual Testing & Documentation

```
You: "Capture screenshots of the login page for all viewports"
Claude: [Invokes project-manager with screenshot capture]
        [Captures mobile, tablet, desktop views]
        [Saves to screenshots/ directory]

You: "Create an issue with these screenshots"
Claude: [Invokes project-manager create-issue-with-screenshots]
        [Uploads screenshots to GitHub]
        [Creates issue with visual documentation]
```

## Skills Architecture

```
.claude/skills/
├── project-analyzer/
│   └── skill.md              # Feature discovery & verification skill
├── project-manager/
│   ├── skill.md              # Feature lifecycle & issue management skill
│   └── config.example.json   # Configuration template
├── project-planner/
│   └── skill.md              # Feature planning & roadmap skill
└── QUICKSTART.md             # This file

dashboard/
├── src/                      # React dashboard source
├── public/                   # Static assets
└── package.json              # Dashboard dependencies

.dashboard-actions/           # Action queue for skill invocation
```

## How It Works

### Behind the Scenes

1. **Model-Invoked**: Claude automatically uses these skills based on your requests
2. **Dashboard Integration**: Skills communicate with dashboard via action queue
3. **No Manual Commands**: Just ask naturally - Claude decides when to invoke
4. **Chained Execution**: Skills work together (discover → verify → create issues → report)
5. **Real-Time Updates**: Dashboard streams live output from skill execution

### What Claude Does

**When you ask to discover features**:
1. Determines analysis type (code, web, or both)
2. Invokes project-analyzer skill
3. Runs feature extraction (UI, API, visual elements)
4. Updates dashboard with discovered features
5. Suggests next steps (verify, create issues, etc.)

**When you ask to create issues**:
1. Checks GitHub authentication
2. Verifies configuration
3. Invokes project-manager skill
4. Runs dry-run first (safety)
5. Creates issues with screenshots if requested
6. Updates feature registry with issue links
7. Streams results to dashboard

**When you ask to generate roadmap**:
1. Invokes project-planner skill
2. Reads feature registry
3. Generates roadmap in requested format (Markdown/HTML/JSON)
4. Optionally groups by phase, category, or priority
5. Updates dashboard with export path

## Complete Workflows

### Workflow 1: From Discovery to Production
```
1. Discover features from code (project-analyzer)
2. Add to feature registry (project-manager)
3. Generate roadmap for stakeholders (project-planner)
4. Verify features in production (project-analyzer)
5. Create GitHub issues for gaps (project-manager)
6. Track progress in dashboard
7. Generate weekly status reports (project-manager)
```

### Workflow 2: Feature Release
```
1. Update feature statuses to "ready-to-ship" (project-manager)
2. Generate release roadmap (project-planner)
3. Verify features in staging (project-analyzer)
4. Create visual documentation with screenshots (project-manager)
5. Generate deployment checklist (project-planner)
6. Update GitHub issues with production URLs (project-manager)
7. Generate release notes (project-manager)
```

### Workflow 3: Issue Automation with Screenshots
```
1. Scan UI for bugs (project-analyzer)
2. Capture screenshots of each bug (project-manager)
3. Create GitHub issues with visual evidence (project-manager)
4. Apply smart labels (bug, priority, component)
5. Link related issues automatically
6. Generate bug report for team (project-manager)
```

## Tips for Best Results

1. **Use the Dashboard**: Interactive visualization makes feature management easier
2. **Start with Discovery**: Run analyzer on code and web to establish baseline
3. **Verify in Production**: 3-tier verification ensures features actually work
4. **Attach Screenshots**: Visual documentation improves issue clarity
5. **Chain Skills**: "Discover features, verify them, then create issues for gaps"
6. **Safety First**: Claude always runs dry-run before creating issues
7. **Multi-Viewport Testing**: Capture mobile/tablet/desktop for responsive features

## Troubleshooting

### "GitHub authentication required"
- Run: `gh auth login` or set `GITHUB_TOKEN`

### "Config not found"
- Copy example config: `cp project-manager/project-manager.config.example.json project-manager/project-manager.config.json`
- Edit with your repository details

### "Playwright not installed"
- Run: `npx playwright install`
- This downloads Chromium, Firefox, and WebKit browsers

### "Dashboard not loading"
- Check: `cd dashboard && npm run dev`
- Ensure port 5173 is available
- Clear browser cache and reload

### Skills not activating
- Check `.claude/skills/` directory exists
- Verify skill.md files have proper YAML frontmatter
- Restart Claude Code session

## Advanced Usage

### Custom Label Mappings
Edit `project-manager/project-manager.config.json`:
```json
"labels": {
  "feature": ["feature", "priority-medium"],
  "bug": ["bug", "priority-high"],
  "auth": ["authentication", "security"]
}
```

### Screenshot Configuration
```json
"screenshots": {
  "enabled": true,
  "outputDir": "./screenshots",
  "uploadToGitHub": true,
  "viewports": ["mobile", "tablet", "desktop"]
}
```

### Filtering & Grouping
Ask Claude to:
- "Generate roadmap grouped by phase"
- "Show only high-priority features"
- "Export backlog as JSON"
- "Filter features by category 'Auth'"

### Bulk Operations
- "Discover features from all my repositories"
- "Create issues for all backlog features"
- "Verify all features in production"
- "Generate monthly summary reports"

## Feature Registry

The feature registry is a CSV-based single source of truth:

```csv
id,name,category,phase,status,priority,description,dependencies,tags
PM-1,User Login,Auth,Phase 1,shipped,P0,Email/password authentication,PM-15,security;mvp
PM-2,Dashboard,UI,Phase 1,in-progress,P1,Main dashboard view,PM-1,ui;analytics
```

**Status Values**: `backlog`, `next-up`, `in-progress`, `ready-to-ship`, `shipped`

**Operations**:
- Add: `project-manager` adds features from discovery
- Update: Dashboard drag & drop updates status
- Read: `project-planner` exports roadmaps
- Delete: Rarely used, features usually marked shipped

## Production Verification (3-Tier)

**Tier 1 - URL Verification**:
- Check if feature URLs are accessible
- Verify HTTP 200 status
- Measure response time

**Tier 2 - Functionality Testing**:
- Verify forms submit correctly
- Check buttons are responsive
- Test user interactions

**Tier 3 - API Validation**:
- Test API endpoints
- Verify response data
- Check authentication flows

Ask Claude: "Run full 3-tier verification on production"

## Visual Testing Capabilities

- **Multi-Viewport Screenshots**: Mobile (375x667), Tablet (768x1024), Desktop (1920x1080)
- **Screenshot Comparison**: Before/after with diff percentage
- **UI Bug Detection**: Automated accessibility scanning
- **Full-Page Capture**: Scrolling screenshots for long pages
- **GitHub Upload**: Attach screenshots directly to issues

## Roadmap Formats

**Markdown**:
```markdown
# Project Roadmap

## Phase 1 (5 features)
Progress: ████████░░ 80% (4/5 complete)

### ✅ User Login (PM-1)
**Status**: Shipped | **Priority**: P0
Email/password authentication with JWT tokens
```

**HTML**: Dark-themed, responsive, stakeholder-ready

**JSON**: Structured data for integrations and custom dashboards

## Support

- Check skill.md files for detailed instructions:
  - `.claude/skills/project-analyzer/skill.md`
  - `.claude/skills/project-manager/skill.md`
  - `.claude/skills/project-planner/skill.md`
- Review component READMEs for technical details
- Use dashboard for interactive exploration
- See main project documentation in project root
