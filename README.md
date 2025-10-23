# Project Suite Claude Skills

**Production-ready Claude Code skills for automated project management**

Analyze TODOs, extract features from designs and websites, verify production deployments, and create GitHub issues—all through natural conversation with Claude Code.

---

## What This Does

Three powerful skills that work together to automate your project management workflow:

### 🔍 **Project Analyzer**
- Scan repositories for TODOs, FIXMEs, and task lists
- Detect likely-completed tasks with confidence scoring
- Analyze design files and websites to extract feature lists
- Verify features work in production (3-tier verification)
- Generate comprehensive analysis reports

### 📋 **Project Manager**
- Create GitHub issues from TODOs automatically
- Smart label management and duplicate prevention
- Visual testing with multi-viewport screenshots
- Before/after comparison and UI bug detection
- Daily reports and state tracking

### 🗺️ **Project Planner**
- Discover features from React/Express codebases
- Extract features from live websites
- Maintain feature registry in CSV format
- Generate roadmaps grouped by phase/priority
- Track implementation status and dependencies

---

## Installation

### One-Line Install

```bash
git clone https://github.com/mevans2120/project-suite-claude-skills.git
cd project-suite-claude-skills
./install.sh
```

The installation script will:
- ✅ Check prerequisites (Node.js, npm)
- ✅ Build all packages automatically
- ✅ Install Playwright browsers
- ✅ Copy tools to `~/.project-suite/`
- ✅ Install skills to `~/.claude/skills/`
- ✅ Configure everything for global use

### Prerequisites

- **Node.js** 18+ and **npm**
- **Claude Code** ([claude.com/code](https://claude.com/code))
- **GitHub CLI** (optional, for issue creation): `gh auth login`

---

## Quick Start

After installation, just ask Claude naturally:

### Analyze TODOs
```
"Analyze the TODOs in this project"
"Find all FIXMEs and generate a cleanup report"
```

### Extract Features from Designs
```
"Analyze the design files in ./designs and export to CSV"
"Extract features from https://example.com"
```

### Verify Production
```
"Verify the login feature works in production"
"Compare staging vs production deployment"
```

### Create GitHub Issues
```
"Create GitHub issues from these TODOs"
"Generate a project status report"
```

### Discover Features from Code
```
"Discover all features in my React app"
"Generate a roadmap from the codebase"
```

Claude will automatically invoke the appropriate skill and handle everything!

---

## How It Works

The skills integrate seamlessly with Claude Code:

1. **You ask** Claude to analyze, verify, or create issues
2. **Claude invokes** the appropriate skill automatically
3. **Skills run** analysis, extraction, or verification
4. **Results appear** in your project directory
5. **Claude summarizes** findings and suggests next steps

Skills are **model-invoked**—Claude decides when to use them based on your conversation. No manual commands needed.

---

## Example Workflows

### Workflow 1: Feature Discovery Pipeline
```
1. "Analyze design files in ./designs" → Extract 42 features
2. "Discover features from my React code" → Find 38 implemented features
3. "Compare the lists and create issues for gaps" → Create 4 GitHub issues
4. "Generate a roadmap from the feature registry" → Roadmap.md created
```

### Workflow 2: Production Verification
```
1. "Analyze TODOs marked as completed" → Find 15 completed tasks
2. "Verify they work in production" → 3-tier verification runs
3. "Create issues for failed verifications" → 2 bugs found, issues created
4. "Capture screenshots of the failures" → Visual evidence attached
```

### Workflow 3: Sprint Planning
```
1. "Scan the codebase for all TODOs" → Find 67 tasks
2. "Filter high-priority items" → 12 critical tasks
3. "Create GitHub issues with labels" → Issues created with auto-labels
4. "Generate sprint report" → Status report with statistics
```

---

## Features

### Project Analyzer
- **TODO Scanning**: 20+ file types, markdown task lists, .gitignore support
- **Completion Detection**: 90%+ confidence scoring for likely-completed tasks
- **Design Analysis**: Extract features from Figma exports, wireframes, moodboards
- **Website Analysis**: Discover features from live sites via Playwright automation
- **Production Verification**: 3-tier testing (URL, functionality, API validation)
- **Output Formats**: JSON, Markdown, CSV, GitHub Issues

### Project Manager
- **Issue Creation**: SHA256-based deduplication, dry-run safety
- **Smart Labels**: Auto-detects type, priority, category from TODO content
- **Screenshots**: Code snippets, UI elements, multi-viewport, before/after
- **Visual Testing**: Responsive testing, visual regression, UI bug scanning
- **Reports**: Daily markdown reports with statistics and trends
- **State Tracking**: `.project-state.json` prevents duplicate issues

### Project Planner
- **Code Discovery**: React Router routes, Express endpoints, component analysis
- **Web Discovery**: Navigation, forms, interactions, API endpoints
- **Feature Registry**: CSV-based registry with phases, priorities, dependencies
- **Roadmap Export**: Markdown/CSV roadmaps grouped by phase or priority
- **Integration**: Links with analyzer and manager for complete workflows

---

## Configuration

### GitHub Authentication

For issue creation (project-manager):
```bash
gh auth login
# or
export GITHUB_TOKEN="your_token"
```

### Project Manager Config

Create `project-manager.config.json`:
```json
{
  "repositories": [
    {
      "name": "my-repo",
      "owner": "username",
      "planningPaths": ["docs", "planning"]
    }
  ],
  "github": {
    "defaultLabels": ["auto-created"],
    "issueTitlePrefix": "[PM]"
  }
}
```

See `.claude/skills/QUICKSTART.md` for detailed examples.

---

## Architecture

```
~/.project-suite/           # Installed tools
├── shared/                 # Playwright, network monitoring, screenshots
├── analyzer/               # TODO scanning, completion detection
├── manager/                # Issue creation, screenshots, reports
└── planner/                # Feature discovery, roadmap generation

~/.claude/skills/           # Skill definitions
├── project-analyzer/       # Analyzer skill
├── project-manager/        # Manager skill
├── project-planner/        # Planner skill
├── INSTALL.md              # Installation guide
└── QUICKSTART.md           # Usage examples
```

---

## Performance

- **Code Scanning**: ~1000 files/second
- **TODO Detection**: ~100 items/second
- **Website Analysis**: 2-5 seconds per page
- **Screenshot Capture**: ~1 second per viewport
- **Feature Extraction**: ~500 files/second

---

## Testing

All packages include comprehensive test suites:

```bash
# Test all packages
cd shared && npm test
cd project-analyzer && npm test
cd project-manager && npm test
cd project-planner && npm test

# Current status: 90/90 tests passing ✅
```

---

## Documentation

- **[INSTALL.md](.claude/skills/INSTALL.md)**: Installation and setup
- **[QUICKSTART.md](.claude/skills/QUICKSTART.md)**: Usage examples and workflows
- **[DISTRIBUTION-PLAN.md](DISTRIBUTION-PLAN.md)**: Distribution strategy and packaging
- **[CONVENTIONS.md](CONVENTIONS.md)**: File naming and organizational standards
- **[CLAUDE.md](CLAUDE.md)**: Instructions for Claude Code when working with this repo

---

## Status

**Phase 1 + 1.5: Complete** ✅
- Basic TODO scanning and issue creation
- Completion analysis with confidence scoring
- Design and website feature extraction
- Production verification (3-tier)
- Visual testing and screenshots

**Phase 2: Planned** 🔜
- Smart documentation parsing
- Implementation tracking from specs
- Gap analysis between planned vs implemented
- Parent/child issue relationships

**Phase 3: Planned** 🔜
- Interactive dashboard
- Sprint planning automation
- Team collaboration features
- Advanced analytics

---

## Contributing

This project follows strict naming conventions documented in `CONVENTIONS.md`:

- **Filename Pattern**: `[COMPONENT]-[TYPE]-[KEY-DETAILS]-[DATE].md`
- **Date Format**: `YYYY-MM-DD`
- **Archive Policy**: Move superseded docs to `archive/`

See `CONVENTIONS.md` for complete standards.

---

## Related Projects

This is part of a suite of Claude Code skills for development automation:

- **[Design Suite](https://github.com/mevans2120/design-suite-claude-skills)** - Design system management, component libraries, and design token automation
- **[Dev Suite](https://github.com/mevans2120/dev-suite-claude-skills)** - Development workflow automation, testing, and code quality tools
- **[Project Suite](https://github.com/mevans2120/project-suite-claude-skills)** (this repo) - Project management, TODOs, and issue tracking

Each suite can be installed independently or combined for comprehensive development automation.

---

## Philosophy

**Keep It Simple**

Following the dashboard philosophy:
- ✅ One-script installation
- ✅ Natural language interface (no complex commands)
- ✅ Transparent operation (you see what it does)
- ✅ Self-contained (minimal dependencies)
- ✅ Easy updates (git pull + reinstall)

Solve problems you actually have, not problems you imagine.

---

## License

MIT

---

## Acknowledgments

Built with:
- [Playwright](https://playwright.dev/) - Browser automation
- [Octokit](https://github.com/octokit/rest.js) - GitHub API
- [Commander](https://github.com/tj/commander.js) - CLI framework
- [Claude Code](https://claude.com/code) - AI-powered development

---

**Ready to automate your project management?**

```bash
./install.sh
```

Then open Claude Code in any project and start asking!
