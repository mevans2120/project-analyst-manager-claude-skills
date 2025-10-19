# Project Manager

A write-operations skill that creates GitHub issues from TODOs, applies smart labels, tracks state to prevent duplicates, and generates daily reports.

## Features

- **GitHub Issue Creator**: Automatically creates issues from TODOs identified by Project Analyzer
- **Smart Label Manager**: Auto-detects issue types and applies appropriate labels
- **State Tracker**: Maintains state to prevent duplicate issue creation
- **Report Generator**: Creates daily markdown reports with statistics and summaries
- **CLI Interface**: Easy-to-use command-line interface for all operations

## Installation

```bash
cd project-manager
npm install
npm run build
```

## Configuration

Create a `project-manager.config.json` file in your project root:

```json
{
  "github": {
    "owner": "your-username",
    "repo": "your-repository",
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
    "HACK": ["tech-debt", "priority-low"],
    "OPTIMIZE": ["enhancement", "priority-low"],
    "REFACTOR": ["refactor", "priority-medium"],
    "NOTE": ["documentation", "priority-low"],
    "XXX": ["needs-review", "priority-medium"]
  }
}
```

## Authentication

Set your GitHub token as an environment variable:

```bash
export GITHUB_TOKEN="your_personal_access_token"
```

Or configure the `gh` CLI:

```bash
gh auth login
```

## Usage

### CLI Commands

#### Create Issues from Analyzer Output

```bash
npm run manage create-issues -- -i analyzer-output.json

# With custom config
npm run manage create-issues -- -i analyzer-output.json -c my-config.json

# Dry run (preview without creating issues)
npm run manage create-issues -- -i analyzer-output.json --dry-run
```

#### Generate Daily Report

```bash
npm run manage report

# For specific date
npm run manage report -- -d 2025-10-18

# With custom config
npm run manage report -- -c my-config.json
```

#### Show Statistics

```bash
npm run manage stats

# For specific time period
npm run manage stats -- -d 30

# With custom config
npm run manage stats -- -c my-config.json
```

#### Run Full Workflow

Analyze repository, create issues, and generate report in one command:

```bash
npm run manage run -- -r /path/to/repository

# Dry run
npm run manage run -- -r /path/to/repository --dry-run

# With custom config
npm run manage run -- -r /path/to/repository -c my-config.json
```

#### Generate Summary Report

```bash
npm run manage summary

# For specific time period
npm run manage summary -- -d 30

# Save to file
npm run manage summary -- -o summary-report.md
```

### Programmatic Usage

```typescript
import { ProjectManager, loadConfig } from 'project-manager';
import { TodoItem } from 'project-manager/types';

// Load configuration
const config = loadConfig('project-manager.config.json');

// Create manager instance
const manager = new ProjectManager(config);

// Process TODOs
const todos: TodoItem[] = [
  {
    type: 'TODO',
    content: 'Implement feature X',
    file: 'src/app.ts',
    line: 42,
    priority: 'medium',
    category: 'code',
    rawText: '// TODO: Implement feature X'
  }
];

const result = await manager.processTodos(todos, {
  checkDuplicates: true,
  dryRun: false
});

console.log(`Created ${result.created.length} issues`);

// Generate report
const { reportPath } = manager.generateReport();
console.log(`Report saved to: ${reportPath}`);
```

### Integration with Project Analyzer

```typescript
import { ProjectAnalyzer } from 'project-analyzer';
import { ProjectManager, loadConfig } from 'project-manager';

// Analyze repository
const analyzer = new ProjectAnalyzer('/path/to/repo', {
  excludeArchives: true,
  includeCompleted: false
});

const scanResult = await analyzer.scan();

// Process TODOs and create issues
const config = loadConfig('project-manager.config.json');
const manager = new ProjectManager(config);

const result = await manager.processTodos(scanResult.todos);

// Generate report
manager.generateReport();
```

## Label System

The Project Manager automatically applies labels based on TODO type and priority:

### Type-Based Labels

- `TODO` → `feature`, `priority-medium`
- `FIXME` → `bug`, `priority-high`
- `BUG` → `bug`, `priority-high`
- `HACK` → `tech-debt`, `priority-low`
- `OPTIMIZE` → `enhancement`, `priority-low`
- `REFACTOR` → `refactor`, `priority-medium`
- `NOTE` → `documentation`, `priority-low`
- `XXX` → `needs-review`, `priority-medium`

### Priority Labels

- `priority-high` (red)
- `priority-medium` (yellow)
- `priority-low` (green)

### Source Labels

- `from-todo` - Created from TODO comment
- `from-code` - Sourced from code file
- `from-markdown` - Sourced from markdown file
- `auto-created` - Automatically generated

## State Management

The Project Manager maintains a `.project-state.json` file to track processed TODOs:

```json
{
  "lastUpdated": "2025-10-18T10:30:00.000Z",
  "processedTodos": [
    {
      "hash": "abc123...",
      "content": "Implement feature X",
      "file": "src/app.ts",
      "line": 42,
      "type": "TODO",
      "priority": "medium",
      "processedAt": "2025-10-18T10:30:00.000Z",
      "issueUrl": "https://github.com/owner/repo/issues/123",
      "issueNumber": 123,
      "status": "created"
    }
  ],
  "metadata": {
    "totalProcessed": 15,
    "totalIssuesCreated": 12
  }
}
```

## Report Format

Daily reports are generated in markdown format:

```markdown
# Daily Project Manager Report
**Date:** 2025-10-18

## Summary

- **Total TODOs Processed:** 5
- **Issues Created:** 4
- **Issues Failed:** 0
- **Issues Skipped:** 1

### By Priority

| Priority | Count |
|----------|-------|
| High     | 2     |
| Medium   | 2     |
| Low      | 0     |

### By Type

| Type   | Count |
|--------|-------|
| TODO   | 2     |
| FIXME  | 2     |

## Issues Created

### 🔴 Fix critical bug in authentication
**Issue:** [#123](https://github.com/owner/repo/issues/123)
**File:** `src/auth.ts:42`
**Type:** FIXME
**Priority:** high
```

## Development

### Running Tests

```bash
npm test

# With coverage
npm test -- --coverage

# Watch mode
npm test -- --watch
```

### Building

```bash
npm run build
```

### Type Checking

```bash
npx tsc --noEmit
```

## API Reference

### ProjectManager

Main class for managing project operations.

#### Constructor

```typescript
constructor(config: ProjectManagerConfig)
```

#### Methods

- `processTodos(todos: TodoItem[], options?)`: Process TODOs and create GitHub issues
- `generateReport(date?: string)`: Generate and save daily report
- `generateSummary(daysBack?: number)`: Generate summary report
- `getState()`: Get current state
- `reloadState()`: Reload state from file
- `saveState()`: Save current state

### Functions

- `loadConfig(configPath: string)`: Load configuration from file
- `createProjectManager(config: ProjectManagerConfig)`: Factory function to create manager

## Error Handling

The Project Manager handles errors gracefully:

- **GitHub API errors**: Logged and tracked in state as failed
- **Configuration errors**: Thrown at initialization
- **State file errors**: Creates new state if file is corrupted
- **Duplicate detection**: Skips creating duplicate issues

## Best Practices

1. **Use dry-run mode** to preview changes before creating issues
2. **Enable duplicate checking** to avoid creating redundant issues
3. **Review failed issues** in reports and address errors
4. **Clean up old state entries** periodically using the cleanup function
5. **Customize labels** to match your project's workflow
6. **Generate reports regularly** to track progress

## Troubleshooting

### Issues not being created

- Verify GitHub token has correct permissions
- Check that repository owner/name in config is correct
- Review error messages in failed issues section of report

### Duplicate issues being created

- Ensure duplicate checking is enabled
- Verify state file is being saved and loaded correctly
- Check that TODO hashes are being generated consistently

### Labels not appearing

- Ensure GitHub token has permission to create labels
- Check that label names are valid (1-50 characters)
- Review label creation errors in console output

## License

MIT
