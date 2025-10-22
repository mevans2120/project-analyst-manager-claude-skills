---
name: project-analyzer
description: Discovers and analyzes features across code, web applications, and production environments. Identifies features from code structure, live websites, TODOs, and verifies production deployments. Use this for feature discovery, production verification, visual testing, and deployment validation.
---

# Project Analyzer Skill

Automatically discovers features from multiple sources (code, web, TODOs), verifies production implementations, performs visual testing, and validates deployments.

## When to Use This Skill

Invoke this skill when the user:
- **Feature Discovery**: Wants to discover what features exist in a codebase or web application
- **Code Analysis**: Needs to analyze React routes, Express endpoints, or component structure
- **Web Analysis**: Wants to discover features by analyzing a live website
- **Production Verification**: Needs to verify features work in production (3-tier verification)
- **Visual Testing**: Wants to capture screenshots or perform visual regression testing
- **Deployment Validation**: Needs to compare staging vs production environments
- **TODO Analysis**: Wants to find pending work items (TODOs, FIXMEs, task lists)
- **Completion Analysis**: Needs to identify likely-completed tasks for cleanup

## Core Capabilities

### 1. Feature Discovery
- **Code-Based Discovery** (PM-7): Analyze React routes, Express endpoints, components, configs
- **Web-Based Discovery** (PM-8): Analyze live websites for navigation, forms, features
- **TODO Scanning** (PM-1): Find TODO comments, task markers, markdown task lists
- **Completion Detection** (PM-1.5): Identify likely-completed tasks with confidence scoring

### 2. Production Verification (PM-10)
- **Tier 1 - URL Verification**: Check if feature URLs are accessible (200 status)
- **Tier 2 - Functionality Testing**: Verify forms, buttons, interactions work
- **Tier 3 - API Validation**: Test API endpoints, verify responses, check data flow

### 3. Visual Testing
- **Screenshot Capture** (PM-12): Code snippets, UI elements, full-page screenshots
- **Multi-Viewport** (PM-13): Mobile, tablet, desktop responsive testing
- **Visual Comparison** (PM-14): Before/after screenshots with diff analysis
- **UI Bug Detection** (PM-15): Automated accessibility and layout issue detection

### 4. Deployment Validation (PM-11)
- **Staging vs Production**: Compare environments for differences
- **Risk Assessment**: Identify potential deployment risks
- **Readiness Checks**: Pre-deployment validation checklists

## Integration with Dashboard

The analyzer integrates with the interactive dashboard at `http://localhost:5173`:

1. **View Analysis Results**: Real-time feature lists, verification status, test results
2. **Trigger Actions**: Click "Run Analysis" button to invoke analyzer from dashboard
3. **Monitor Progress**: Live output streaming shows analyzer execution in real-time
4. **Review Features**: Interactive cards show discovered features with details

### Dashboard Workflow
```
User clicks "Analyze Repository" in dashboard
→ Dashboard creates action in .dashboard-actions/
→ Claude detects action, invokes analyzer skill
→ Analyzer runs, streams output to dashboard
→ Results displayed in interactive feature cards
→ User can then trigger verification or issue creation
```

## Instructions

### Step 1: Determine Analysis Type

Ask the user what type of analysis is needed:
- **Discover features**: From code, web, or TODOs
- **Verify production**: Check if features work in production
- **Visual testing**: Screenshots, responsive testing, comparisons
- **Deployment check**: Staging vs production validation
- **TODO scan**: Find pending work items

### Step 2: Feature Discovery

#### Option A: Code-Based Discovery
```bash
cd "/Users/michaelevans/project-suite-claude-skills/project-planner"

# Analyze React/Node.js codebase
npx ts-node src/cli.ts discover code <repository-path> -o features.csv

# This analyzes:
# - React Router routes
# - Express endpoints
# - Component structure
# - Configuration files
```

#### Option B: Web-Based Discovery
```bash
cd "/Users/michaelevans/project-suite-claude-skills/project-planner"

# Analyze live website
npx ts-node src/cli.ts discover web <url> -o features.csv

# This analyzes:
# - Navigation structure
# - Forms and interactions
# - Visual elements
# - API endpoints (via network monitoring)
```

#### Option C: TODO Scanning
```bash
cd "/Users/michaelevans/project-suite-claude-skills/project-analyzer"

# Standard TODO scan
npm run analyze -- -p <repository-path> -o todos.json --format json

# Completion analysis (find likely-completed TODOs)
npx ts-node src/cli.ts cleanup <repository-path> -f markdown -o cleanup-report.md
```

### Step 3: Production Verification

```bash
cd "/Users/michaelevans/project-suite-claude-skills/project-analyzer"

# Tier 1: URL verification
npx ts-node src/cli.ts verify <production-url> --tier 1 -o verification.json

# Tier 2: Functionality testing
npx ts-node src/cli.ts verify <production-url> --tier 2 -o functionality-test.json

# Tier 3: API validation
npx ts-node src/cli.ts verify <production-url> --tier 3 -o api-validation.json

# All tiers
npx ts-node src/cli.ts verify <production-url> --all-tiers -o complete-verification.json
```

### Step 4: Visual Testing

```bash
cd "/Users/michaelevans/project-suite-claude-skills/project-manager"

# Multi-viewport screenshots
npx ts-node src/cli.ts screenshot <url> --viewports mobile,tablet,desktop -o screenshots/

# Before/after comparison
npx ts-node src/cli.ts compare <before-url> <after-url> -o comparison-report.md

# UI bug scan
npx ts-node src/cli.ts scan-ui <url> -o ui-bugs.json
```

### Step 5: Deployment Validation

```bash
cd "/Users/michaelevans/project-suite-claude-skills/project-analyzer"

# Compare staging vs production
npx ts-node src/cli.ts compare-deployment \
  --staging <staging-url> \
  --production <production-url> \
  -o deployment-diff.md
```

### Step 6: Present Results and Integrate with Dashboard

After analysis:
1. Read and summarize the output files
2. Present key findings to user
3. If dashboard is running, results are automatically visible
4. Suggest next actions (verification, issue creation, etc.)

## Dashboard Integration Details

### Launching Dashboard
```bash
cd dashboard
npm run dev
# Dashboard available at http://localhost:5173
```

### Dashboard Features
- **Roadmap Tab**: View all discovered features in interactive cards
- **Tests Tab**: See verification results and test coverage
- **Action Queue**: Monitor analyzer execution in real-time
- **Search & Filter**: Find specific features by category, phase, or priority
- **Drag & Drop**: Organize features between backlog/nextUp/inProgress

### Action Flow
1. **User triggers from dashboard**: Clicks "Analyze Repository" button
2. **Action file created**: Dashboard writes JSON to `.dashboard-actions/`
3. **Skill invoked**: Claude detects action file and invokes analyzer
4. **Live updates**: Analyzer streams output back to dashboard
5. **Results displayed**: Features appear in dashboard immediately

## Common Workflows

### Workflow 1: Complete Feature Discovery
```
1. Discover features from code (PM-7)
2. Discover features from web (PM-8)
3. Verify features in production (PM-10)
4. View results in dashboard
5. Create GitHub issues for missing features (use project-manager skill)
```

### Workflow 2: Production Deployment Check
```
1. Verify production deployment (PM-10)
2. Compare staging vs production (PM-11)
3. Run visual regression tests (PM-14)
4. Scan for UI bugs (PM-15)
5. Review risk assessment in dashboard
6. Create issues for bugs found (use project-manager skill)
```

### Workflow 3: Legacy TODO Cleanup
```
1. Scan repository for TODOs
2. Run completion analysis
3. Review high-confidence completed items
4. Generate cleanup report
5. Create issues for active TODOs only
```

## Output Formats

### Feature Discovery Output (CSV)
```csv
id,name,category,phase,status,description,source
F-1,User Login,Authentication,Phase 1,implemented,User authentication with email/password,code
F-2,Dashboard,UI,Phase 1,implemented,Main dashboard view,web
F-3,API Rate Limiting,Backend,Phase 2,planned,Rate limit API endpoints,todo
```

### Verification Output (JSON)
```json
{
  "url": "https://example.com",
  "tier1": {
    "urlAccessible": true,
    "statusCode": 200,
    "responseTime": "245ms"
  },
  "tier2": {
    "functional": true,
    "formsWork": true,
    "buttonsResponsive": true
  },
  "tier3": {
    "apiEndpoints": 5,
    "allResponding": true,
    "dataValid": true
  }
}
```

### Visual Testing Output (Markdown)
```markdown
# Visual Comparison Report

## Summary
- **Difference**: 2.3%
- **Verdict**: Minor visual changes detected

## Screenshots
| Before | After |
|--------|-------|
| ![Before](before.png) | ![After](after.png) |

**Changes Detected**:
- Button color changed
- Layout shifted 5px
```

## Examples

### Example 1: Discover Features from Web Application

**User**: "Analyze the features on our production website"

**Response**:
1. Navigate to project-planner
2. Run: `npx ts-node src/cli.ts discover web https://example.com -o features.csv`
3. Open dashboard to view discovered features
4. Present summary: "Found 25 features: 15 navigation items, 7 forms, 3 API endpoints"
5. Offer: "Would you like me to verify these features work correctly?"

### Example 2: Production Verification Before Deployment

**User**: "We're about to deploy. Can you verify everything works in staging?"

**Response**:
1. Run Tier 1-3 verification on staging URL
2. Compare staging vs current production
3. Run visual regression tests
4. Generate deployment readiness report
5. Present in dashboard with risk assessment
6. Recommend: "3 features need attention before deployment"

### Example 3: Complete Feature Audit

**User**: "I want a complete audit of our application"

**Response**:
1. Discover features from code (PM-7)
2. Discover features from web (PM-8)
3. Find features mentioned in TODOs (PM-1)
4. Verify discovered features in production (PM-10)
5. Generate comprehensive report
6. Display in interactive dashboard
7. Create issues for unimplemented features (use project-manager skill)

## Technical Details

- **Location**: `/Users/michaelevans/project-suite-claude-skills/`
  - `project-analyzer/` - TODO scanning, completion analysis
  - `project-planner/` - Feature discovery (code & web)
  - `project-manager/` - Visual testing, screenshots
- **Language**: TypeScript/Node.js
- **Browser**: Playwright (Chromium/Firefox/WebKit)
- **Performance**:
  - Code scan: ~1000 files/second
  - Web analysis: ~2-5 seconds per page
  - Screenshot capture: ~1 second per viewport

## Error Handling

If analysis fails:
1. **Repository not found**: Verify path exists
2. **Website unreachable**: Check URL and network
3. **Browser errors**: Ensure Playwright browsers installed: `npx playwright install`
4. **Permission denied**: Check file/directory permissions
5. **Dependencies missing**: Run `npm install` in relevant directory

## Integration with Project Manager

After analyzing, chain to project-manager skill:
1. Analyzer discovers/verifies features
2. Manager creates GitHub issues for gaps
3. Manager generates roadmaps and reports
4. Dashboard displays complete feature lifecycle

## Tips for Best Results

- **Start with code discovery** to establish baseline of what exists
- **Verify in production** to ensure features actually work
- **Use visual testing** for UI-heavy features
- **Run completion analysis** on old projects to reduce TODO noise
- **Use dashboard** for interactive exploration and team collaboration
- **Chain skills** for complete workflows (discover → verify → create issues)
- **Multi-viewport testing** catches responsive design issues early
