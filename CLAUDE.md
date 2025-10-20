# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains **two production-ready Claude Code skills** for automated project management:

1. **Project Analyzer** - A read-only skill that analyzes repositories to identify TODOs, specifications, and implementation gaps
2. **Project Manager** - A write-operations skill that creates GitHub issues, organizes documentation, and generates reports

**Status**: Phase 1 & 1.5 Complete ✅ | 55 tests passing | Production ready

## Project Structure

The project has completed Phase 1 implementation:

- **Phase 1**: ✅ Basic analysis and issue creation from TODOs and task lists (COMPLETE)
- **Phase 1.5**: ✅ Completion analysis to identify likely-completed tasks (COMPLETE)
- **Phase 2**: 🔜 Smart documentation parsing and implementation tracking (PLANNED)
- **Phase 3**: 🔜 Advanced features including dashboards and sprint planning (PLANNED)

## Using the Skills

The skills are located in `.claude/skills/` and are automatically available to Claude Code.

### How to Invoke

Simply ask Claude naturally - the skills are model-invoked:
- "Analyze the TODOs in this project"
- "Find all FIXMEs and bugs in the codebase"
- "Create GitHub issues from these TODOs"
- "Generate a project status report"

See `.claude/skills/QUICKSTART.md` for detailed usage examples.

## Implemented Features

### Project Analyzer Skill (Phase 1 + 1.5)
Located: `project-analyzer/`

**Capabilities**:
- ✅ Scan code for TODOs, FIXMEs, BUGs, HACKs, etc. in 20+ file types
- ✅ Parse markdown task lists (`- [ ]` items)
- ✅ Multiple output formats (JSON, Markdown, CSV, GitHub Issues)
- ✅ Completion analysis - identifies likely-completed tasks
- ✅ Respects .gitignore patterns
- ✅ State tracking for incremental updates
- ✅ Performance: ~1000 files/second

**How to Use**:
Ask Claude to "analyze TODOs" or "run completion analysis" - Claude will invoke the skill automatically.

### Project Manager Skill (Phase 1)
Located: `project-manager/`

**Capabilities**:
- ✅ Create GitHub issues from TODO analysis via Octokit API
- ✅ Smart label management (auto-detects types, priorities)
- ✅ SHA256-based duplicate prevention
- ✅ Daily markdown reports with statistics
- ✅ Dry-run mode for safe previewing
- ✅ State tracking in `.project-state.json`

**How to Use**:
Ask Claude to "create issues from TODOs" or "generate a report" - Claude will handle GitHub authentication, configuration, and execution.

## GitHub Integration

The skills are designed to work with the following authentication method:
```bash
export GITHUB_TOKEN="your_personal_access_token"
```

## Target Repositories

The initial pilot implementation targets:
- `codymd-hacknback-main`
- `care-tracker-mobile`

## Configuration Structure

The skills expect a configuration file with this structure:
```json
{
  "repositories": [
    {
      "name": "repository-name",
      "owner": "username",
      "planningPaths": ["docs", "memory-bank"],
      "archiveAfterDays": 60
    }
  ],
  "github": {
    "defaultLabels": ["auto-created"],
    "issueTitlePrefix": "[PM]"
  },
  "reporting": {
    "schedule": "daily",
    "outputPath": "docs/reports"
  }
}
```

## Document Organization

When implementing document reorganization features, use this structure:
```
/docs
  /planning     - Active planning documents
  /archive      - Old/completed planning docs organized by year
  /specs        - Technical specifications
  /reports      - Generated status reports
```

## Key Architecture Details

### Code Organization
```
project-analyzer/           # Read-only analysis (Phase 1 + 1.5 ✅)
├── src/core/              # Scanner, patterns, completion detection
├── src/formatters/        # Output formatting
├── src/utils/             # File traversal, git integration
└── tests/                 # 18 tests, all passing

project-manager/           # Write operations (Phase 1 ✅)
├── src/core/              # Issue creator, state tracker
├── src/utils/             # GitHub client, label manager
├── src/formatters/        # Report generation
└── tests/                 # 40 tests, all passing

.claude/skills/            # Claude Code integration ✅
├── project-analyzer/      # Analyzer skill definition
├── project-manager/       # Manager skill definition
└── QUICKSTART.md          # Usage guide
```

### Implementation Notes

1. **Duplicate Prevention**: SHA256 hashing of TODO content + file + line prevents duplicates
2. **Completion Detection**: 90%+ confidence when TODOs are in archived files or have completion markers
3. **Safety**: Always runs dry-run first before creating GitHub issues
4. **State Management**: `.project-state.json` tracks all processed items
5. **Performance**: Analyzer processes ~1000 files/sec; Manager limited by GitHub API

## Future Development (Phase 2+)

When implementing Phase 2 features:
- Parse specification documents to map planned vs implemented features
- Calculate implementation percentages
- Generate gap analysis reports
- Link related issues and create parent/child relationships
- Reorganize documentation automatically