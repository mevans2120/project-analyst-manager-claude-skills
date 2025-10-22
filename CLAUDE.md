# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains **three production-ready Claude Code skills** for automated project management with an interactive dashboard:

1. **Project Analyzer** - Discovers features from code, web applications, and production environments. Performs verification, visual testing, and deployment validation.
2. **Project Manager** - Manages complete feature lifecycle from planning to production. Creates/updates feature registry, generates roadmaps, manages GitHub issues with visual documentation.
3. **Project Planner** - Plans and organizes features with dependency tracking, phase management, and roadmap generation in multiple formats.

**Status**: Production Ready ✅ | 222 tests passing | 40+ features shipped | Interactive dashboard at localhost:5173

## Interactive Dashboard

The Project Suite includes an interactive React dashboard for real-time feature management:

**Location**: `dashboard/`
**URL**: http://localhost:5173 (when running)
**Launch**: `cd dashboard && npm run dev`

**Features**:
- Roadmap tab with drag & drop feature organization
- Tests tab showing verification results
- Action queue for live skill execution monitoring
- Search & filter by category, phase, priority
- Real-time updates from skill execution

**Integration**: Dashboard communicates with skills via `.dashboard-actions/` action queue. Users can trigger skill operations from the dashboard, and results stream back in real-time.

## Project Conventions

**IMPORTANT**: This project follows strict naming and organizational conventions documented in `CONVENTIONS.md`.

When working on this project, you MUST:
- Follow the file naming pattern: `[COMPONENT]-[TYPE]-[KEY-DETAILS]-[DATE].md`
- Use UPPERCASE for all documentation filenames
- Include creation date in `YYYY-MM-DD` format
- Never include time estimates in filenames
- Move superseded documents to `archive/` folder
- Use descriptive names that indicate content without opening the file

**Before creating or renaming any files, consult `CONVENTIONS.md` for the complete standards.**

## Project Structure

The project is production ready with 40+ shipped features:

```
project-analyzer/           # Feature discovery & verification ✅
├── src/core/              # Scanner, patterns, completion detection
├── src/formatters/        # Output formatting (JSON, Markdown, CSV)
├── src/utils/             # File traversal, git integration
└── tests/                 # 18 tests, all passing

project-manager/           # Feature lifecycle management ✅
├── src/core/              # Issue creator, state tracker
├── src/utils/             # GitHub client, label manager
├── src/formatters/        # Report generation
└── tests/                 # 40 tests, all passing

project-planner/           # Feature planning & roadmaps ✅
├── src/                   # Registry, roadmap generation
├── data/                  # Feature registry (CSV)
└── tests/                 # 73 tests, all passing

shared/                    # Shared libraries ✅
├── src/core/              # PlaywrightDriver, ScreenshotCapture, NetworkMonitor
│                          # FeatureExtractor, FunctionalityChecker, VisualAnalyzer
├── tests/                 # 91 tests, all passing
└── dist/                  # Compiled JavaScript

dashboard/                 # Interactive dashboard ✅
├── src/                   # React components, state management
├── public/                # Static assets
└── data.js                # Feature data source

.claude/skills/            # Claude Code integration ✅
├── project-analyzer/      # Feature discovery skill
├── project-manager/       # Feature lifecycle skill
├── project-planner/       # Feature planning skill (gitignored copy)
└── QUICKSTART.md          # User guide

.dashboard-actions/        # Action queue for dashboard-skill communication
```

## Using the Skills

The skills are located in `.claude/skills/` and are automatically available to Claude Code.

### How to Invoke

Simply ask Claude naturally - the skills are model-invoked:

**Feature Discovery**:
- "Discover features in this codebase"
- "Analyze the production website for features"
- "Find all UI and API features"
- "Verify features work in production"

**Feature Management**:
- "Add this feature to the registry"
- "Generate a roadmap for stakeholders"
- "Create GitHub issues from the backlog"
- "Track feature progress"

**Feature Planning**:
- "Plan the next sprint"
- "Show feature dependencies"
- "Export roadmap as HTML"
- "What's ready to ship?"

**Dashboard Operations**:
- "Launch the dashboard"
- "What features are in the dashboard?"
- User can also click buttons in dashboard to trigger skill operations

See `.claude/skills/QUICKSTART.md` for detailed usage examples and workflows.

## Implemented Features (40+ Shipped)

### Project Analyzer Skill
Located: `project-analyzer/`

**Core Capabilities**:
- ✅ **Feature Discovery** (PM-7, PM-8): Analyze code structure (React routes, Express endpoints, components) and live websites (navigation, forms, interactions)
- ✅ **Production Verification** (PM-10): 3-tier verification (URL accessibility, functionality testing, API validation)
- ✅ **Visual Testing** (PM-12-15): Multi-viewport screenshots, before/after comparison, UI bug detection
- ✅ **Deployment Validation** (PM-11): Compare staging vs production environments
- ✅ **TODO Scanning** (PM-1): Find TODOs, FIXMEs, BUGs in 20+ file types
- ✅ **Completion Analysis** (PM-1.5): Identify likely-completed tasks with confidence scoring

**How to Use**:
Ask Claude to "discover features" or "verify production" - Claude will invoke the skill automatically and display results in dashboard.

### Project Manager Skill
Located: `project-manager/`

**Core Capabilities**:
- ✅ **Feature Registry** (PM-3): CRUD operations, dependency tracking, status management (CSV-based single source of truth)
- ✅ **Roadmap Generation** (PM-9): Export Markdown/HTML/JSON roadmaps with grouping and progress bars
- ✅ **GitHub Issue Management** (PM-1, PM-35, PM-36): Create/update issues, smart labeling, duplicate prevention, automatic linking
- ✅ **Visual Documentation** (PM-12-15): Screenshot capture, multi-viewport testing, visual comparison, UI bug detection with GitHub upload
- ✅ **Reporting & Analytics**: Daily reports, summary reports, progress tracking

**How to Use**:
Ask Claude to "create issues" or "generate roadmap" - Claude will handle GitHub authentication, configuration, and execution. Results visible in dashboard.

### Project Planner Skill
Located: `project-planner/`

**Core Capabilities**:
- ✅ **Feature Registry Management**: Read/write CSV registry with dependency tracking
- ✅ **Roadmap Export**: Generate beautiful Markdown, HTML, or JSON roadmaps
- ✅ **Grouping & Filtering**: By phase, category, priority, or status
- ✅ **Progress Tracking**: Calculate completion percentages and velocity
- ✅ **Dependency Validation**: Detect circular dependencies, validate prerequisites

**How to Use**:
Ask Claude to "export roadmap" or "validate dependencies" - Claude will read the registry and generate requested output.

## Shared Libraries

Located: `shared/`

**Components**:
- ✅ **PlaywrightDriver** (PM-2): Chromium/Firefox/WebKit browser automation with network logging
- ✅ **ScreenshotCapture** (PM-4): Multi-viewport screenshots, comparison, full-page capture
- ✅ **NetworkMonitor** (PM-5): API endpoint discovery, pattern recognition, traffic analysis
- ✅ **FeatureExtractor** (PM-6): UI/API/visual element discovery and categorization
- ✅ **FunctionalityChecker** (PM-17): Verify forms, buttons, interactions work correctly
- ✅ **VisualAnalyzer** (PM-18): Color palette extraction, layout analysis, component detection

**Usage**: All three skills import and use these shared libraries for browser automation, feature discovery, and visual testing.

## GitHub Integration

The skills work with GitHub CLI or environment variable:

```bash
# Option 1: GitHub CLI (recommended)
gh auth login

# Option 2: Environment variable
export GITHUB_TOKEN="your_personal_access_token"
```

**Configuration**: `project-manager/project-manager.config.json`
- Repository details (owner, repo)
- Label mappings (type → GitHub labels)
- Screenshot settings (enabled, viewports, upload)
- Reporting schedule and output path

## Feature Registry

The feature registry is the single source of truth for all features:

**Location**: `project-planner/data/feature-registry.csv`

**Format**:
```csv
id,name,category,phase,status,priority,description,dependencies,tags
PM-1,User Login,Auth,Phase 1,shipped,P0,Email/password authentication,PM-15,security;mvp
PM-2,Dashboard,UI,Phase 1,shipped,P1,Interactive feature management,PM-1,ui;react
```

**Status Values**: `backlog`, `next-up`, `in-progress`, `ready-to-ship`, `shipped`

**Operations**:
- **Add**: project-manager adds features from discovery results
- **Update**: Dashboard drag & drop updates status; CLI updates via registry commands
- **Read**: project-planner exports roadmaps; dashboard displays all features
- **Delete**: Rarely used; features usually marked as `shipped` instead

## Dashboard Integration

The dashboard provides interactive feature management:

**Workflow**:
1. User opens dashboard at localhost:5173
2. Views features in Roadmap tab (drag & drop between backlog/nextUp/inProgress)
3. Clicks "Analyze Repository" or "Create Issues" button
4. Dashboard creates action file in `.dashboard-actions/`
5. Claude detects action, invokes appropriate skill
6. Skill executes, streams output back to dashboard
7. Dashboard updates with results (new features, issue links, etc.)

**Action Queue**: `.dashboard-actions/` contains JSON files representing user actions. Claude monitors this directory and processes actions automatically.

## Key Architecture Details

### Implementation Notes

1. **Feature Discovery**: Analyzer extracts features from React routes, Express endpoints, web navigation, form elements, API calls
2. **Duplicate Prevention**: SHA256 hashing prevents duplicate issues; registry uses unique IDs (PM-1, PM-2, etc.)
3. **Production Verification**: 3-tier verification ensures features work (URL → functionality → API)
4. **Visual Testing**: Multi-viewport screenshots (mobile/tablet/desktop) with comparison and diff analysis
5. **Safety**: Always runs dry-run first before creating GitHub issues
6. **State Management**: `.project-state.json` tracks all processed items to prevent duplicates
7. **Performance**: Analyzer processes ~1000 files/sec; screenshot capture ~1 sec/viewport

### Test Coverage

- **Total**: 222 tests across 13 suites, all passing
- **project-analyzer**: 18 tests (scanner, formatters, completion analysis)
- **project-manager**: 40 tests (issue creation, labeling, reporting)
- **project-planner**: 73 tests (registry, roadmap generation, validation)
- **shared**: 91 tests (PlaywrightDriver, ScreenshotCapture, NetworkMonitor, FeatureExtractor, FunctionalityChecker, VisualAnalyzer)

### Common Workflows

**Workflow 1: Complete Feature Discovery & Management**
```
1. Discover features from code (project-analyzer)
2. Add discovered features to registry (project-manager)
3. Generate roadmap for stakeholders (project-planner)
4. Verify features in production (project-analyzer)
5. Create GitHub issues for gaps (project-manager)
6. Track progress in dashboard
7. Generate weekly status reports (project-manager)
```

**Workflow 2: Production Deployment Check**
```
1. Verify production deployment (project-analyzer PM-10)
2. Compare staging vs production (project-analyzer PM-11)
3. Run visual regression tests (project-manager PM-14)
4. Scan for UI bugs (project-manager PM-15)
5. Review risk assessment in dashboard
6. Create issues for bugs found (project-manager)
```

**Workflow 3: Dashboard-Driven Management**
```
1. User opens dashboard at localhost:5173
2. Drags feature from backlog to nextUp
3. Clicks "Create Issue" button
4. Claude detects action, invokes project-manager
5. Manager creates GitHub issue with screenshots
6. Dashboard updates feature card with issue link
```

## Production Capabilities

### 3-Tier Production Verification

**Tier 1 - URL Verification**:
- Check if feature URLs are accessible (HTTP 200)
- Measure response time
- Verify SSL certificates

**Tier 2 - Functionality Testing**:
- Verify forms submit correctly
- Check buttons are responsive
- Test user interactions and workflows

**Tier 3 - API Validation**:
- Test API endpoints respond correctly
- Verify response data structure and content
- Check authentication and authorization flows

**Usage**: Ask Claude to "run full 3-tier verification on https://production-url.com"

### Visual Testing Capabilities

- **Multi-Viewport Screenshots**: Mobile (375x667), Tablet (768x1024), Desktop (1920x1080)
- **Screenshot Comparison**: Before/after with pixel diff and percentage
- **UI Bug Detection**: Automated accessibility scanning and layout issue detection
- **Full-Page Capture**: Scrolling screenshots for long pages
- **GitHub Upload**: Attach screenshots directly to GitHub issues

**Usage**: Ask Claude to "capture screenshots of feature X" or "create issue with screenshots"

### Roadmap Generation

**Formats**:
- **Markdown**: Progress bars, tables, grouped by phase/category/priority
- **HTML**: Dark-themed, responsive, stakeholder-ready presentation
- **JSON**: Structured data for integrations and custom dashboards

**Grouping Options**: By phase, category, priority, or status
**Filtering**: By status, phase, priority, category

**Usage**: Ask Claude to "generate HTML roadmap grouped by phase"

## Target Repositories

The skills can work with any repository. Initial pilot implementations:
- `codymd-hacknback-main`
- `care-tracker-mobile`
- This repository itself (dogfooding)

## Configuration Structure

The project-manager expects a configuration file:

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

## Development Guidelines

When working on this project:

1. **Testing**: Always write tests for new features. Run `npm test` before committing.
2. **Shared Libraries**: New browser automation features go in `shared/src/core/`
3. **Skill Definitions**: Update `.claude/skills/*/skill.md` when adding capabilities
4. **Dashboard Data**: Update `dashboard/data.js` when features are shipped
5. **Documentation**: Follow CONVENTIONS.md for file naming
6. **Feature IDs**: Use PM-X format (PM-1, PM-2, etc.) for all features

## Support and Troubleshooting

**Common Issues**:
- "GitHub authentication required" → Run `gh auth login` or set `GITHUB_TOKEN`
- "Config not found" → Copy `project-manager.config.example.json` to `project-manager.config.json`
- "Playwright not installed" → Run `npx playwright install`
- "Dashboard not loading" → Check `cd dashboard && npm run dev` and port 5173

**Resources**:
- Skill documentation: `.claude/skills/*/skill.md`
- Quick start guide: `.claude/skills/QUICKSTART.md`
- Component READMEs: `project-*/README.md`
- Dashboard: http://localhost:5173 (when running)
