# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This repository contains the development plan and implementation for two complementary Claude Code skills designed to automate project management tasks:

1. **Project Analyzer** - A read-only skill that analyzes repositories to identify TODOs, specifications, and implementation gaps
2. **Project Manager** - A write-operations skill that creates GitHub issues, organizes documentation, and generates reports

## Project Structure

The project is currently in planning phase with a phased implementation approach:

- **Phase 1**: Basic analysis and issue creation from TODOs and task lists
- **Phase 2**: Smart documentation parsing and implementation tracking
- **Phase 3**: Advanced features including dashboards and sprint planning

## Key Development Tasks

### When implementing the Project Analyzer skill:
- Focus on read-only operations that scan markdown files, code comments, and GitHub state
- Parse TODO comments in various formats (TODO:, FIXME:, - [ ], etc.)
- Map specifications in planning documents to actual code implementations
- Generate gap analysis reports comparing planned vs implemented features

### When implementing the Project Manager skill:
- Create GitHub issues using the GitHub CLI (`gh` command) or API
- Apply structured labels (feature, bug, priority levels, status indicators)
- Maintain a `.project-state.json` file to track processed items and avoid duplicates
- Generate daily markdown reports in `docs/reports/` directory

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

## Implementation Priorities

1. Start with Phase 1 basic functionality before adding advanced features
2. Ensure duplicate detection logic is robust to avoid creating redundant issues
3. Maintain clear separation between read-only analyzer and write-capable manager
4. Generate human-readable reports that provide actionable insights
5. Track all processed items to enable incremental updates without duplication