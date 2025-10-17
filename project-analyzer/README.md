# Project Analyzer

A powerful, read-only Claude Code skill that analyzes repositories to identify TODOs, track implementation gaps, and provide comprehensive project insights.

## Features

### Phase 1 (Current Implementation)
- **TODO Scanner**: Identifies TODO, FIXME, HACK, BUG, and other task markers in code
- **Markdown Task Detection**: Finds unchecked tasks in markdown files (`- [ ]`)
- **Multiple Output Formats**: JSON, Markdown, CSV, GitHub Issues format
- **State Tracking**: Track processed TODOs to identify new items
- **Gitignore Support**: Respects `.gitignore` patterns
- **Flexible Filtering**: Filter by priority, type, file patterns
- **Repository Statistics**: Analyze codebase metrics

## Installation

```bash
cd project-analyzer
npm install
npm run build
```

## Usage

### Command Line Interface

```bash
# Basic scan of current directory
npx ts-node src/cli.ts scan

# Scan specific directory
npx ts-node src/cli.ts scan /path/to/repo

# Output to file with markdown format
npx ts-node src/cli.ts scan -f markdown -o report.md

# Group by priority
npx ts-node src/cli.ts scan -f markdown -g priority

# Track state and show only new TODOs
npx ts-node src/cli.ts scan --state-file .project-state.json --only-new

# Generate comprehensive report
npx ts-node src/cli.ts report -o ./reports

# Show repository statistics
npx ts-node src/cli.ts stats
```

### Programmatic API

```typescript
import { ProjectAnalyzer } from './project-analyzer';

// Create analyzer instance
const analyzer = new ProjectAnalyzer('/path/to/repo', {
  useGitignore: true,
  includeCompleted: false
});

// Scan for TODOs
const result = await analyzer.scan();
console.log(`Found ${result.summary.totalTodos} TODOs`);

// Get formatted output
const markdown = await analyzer.scanAndFormat('markdown', {
  groupBy: 'priority'
});

// Get only new TODOs
const newTodos = await analyzer.getNewTodos('.project-state.json');

// Get summary only
const summary = await analyzer.getSummary();
```

## Supported Patterns

### Code Comments
- `TODO:` - General tasks (medium priority)
- `FIXME:` - Bugs to fix (high priority)
- `BUG:` - Known bugs (high priority)
- `HACK:` - Temporary workarounds (low priority)
- `OPTIMIZE:` - Performance improvements (low priority)
- `REFACTOR:` - Code improvements (medium priority)
- `NOTE:` - Important notes (low priority)
- `XXX:` - Attention needed (medium priority)

### Markdown
- `- [ ]` - Unchecked task items
- `## TODO` - TODO sections
- `Action Item:` - Explicit action items
- `[TBD]`, `[WIP]` - Incomplete markers

## Supported File Types

### Code Files
JavaScript, TypeScript, Python, Java, Go, Rust, Ruby, PHP, C/C++, C#, Swift, Kotlin, Scala, R, Shell scripts, and more.

### Documentation
Markdown, reStructuredText, plain text files.

### Configuration
JSON, YAML, XML, HTML.

## Output Formats

### JSON
```json
{
  "todos": [
    {
      "type": "TODO",
      "content": "Implement user authentication",
      "file": "src/auth.ts",
      "line": 42,
      "priority": "medium",
      "category": "code"
    }
  ],
  "summary": {
    "totalTodos": 25,
    "byPriority": {
      "high": 5,
      "medium": 15,
      "low": 5
    }
  }
}
```

### Markdown
```markdown
# TODO Scan Report

## Summary
- High Priority: 5
- Medium Priority: 15
- Low Priority: 5

## TODOs

### src/auth.ts
- [TODO] Implement user authentication (line 42)
```

### GitHub Issues
Formatted for easy conversion to GitHub issues with appropriate labels and metadata.

### CSV
Spreadsheet-compatible format for analysis in Excel or Google Sheets.

## Configuration

### CLI Options

| Option | Description | Default |
|--------|-------------|---------|
| `-f, --format` | Output format (json, markdown, github, csv) | markdown |
| `-o, --output` | Output file path | stdout |
| `-g, --group-by` | Group results by (file, priority, type, none) | file |
| `--include` | Include file patterns (glob) | **/* |
| `--exclude` | Exclude file patterns (glob) | [] |
| `--no-gitignore` | Don't use .gitignore | false |
| `--include-completed` | Include completed tasks | false |
| `--state-file` | Path to state file | .project-state.json |
| `--only-new` | Only show new TODOs | false |

## State Tracking

The analyzer can maintain state to track which TODOs have been processed:

```bash
# First scan - saves state
npx ts-node src/cli.ts scan --state-file .project-state.json

# Subsequent scan - shows only new TODOs
npx ts-node src/cli.ts scan --state-file .project-state.json --only-new
```

State file structure:
```json
{
  "lastUpdated": "2024-01-01T00:00:00Z",
  "processedTodos": [
    {
      "id": "todo-123456-0",
      "hash": "abc123...",
      "type": "TODO",
      "content": "..."
    }
  ]
}
```

## Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run specific test file
npm test patterns.test.ts
```

## Development

### Project Structure
```
project-analyzer/
├── src/
│   ├── core/
│   │   ├── patterns.ts      # TODO pattern definitions
│   │   └── scanner.ts       # Core scanning logic
│   ├── utils/
│   │   └── fileTraversal.ts # File system utilities
│   ├── formatters/
│   │   └── outputFormatter.ts # Output formatting
│   ├── cli.ts               # Command-line interface
│   └── index.ts             # Main entry point
├── tests/
│   ├── patterns.test.ts
│   └── scanner.test.ts
├── package.json
├── tsconfig.json
├── jest.config.js
└── README.md
```

### Adding New Patterns

To add new TODO patterns, edit `src/core/patterns.ts`:

```typescript
export const CODE_PATTERNS: TodoPattern[] = [
  // Add your pattern here
  {
    name: 'CUSTOM',
    regex: /\/\/\s*CUSTOM:?\s*(.+)$/gmi,
    priority: 'medium',
    category: 'code'
  }
];
```

### Extending File Support

To support new file types, update `shouldScanFile()` in `src/core/patterns.ts`:

```typescript
const scannable = [
  // ... existing extensions
  'newext'  // Add your extension
];
```

## Roadmap

### Phase 2 (Planned)
- Specification mapping and gap analysis
- Implementation tracking
- Smart documentation parsing
- Real-time file watching
- Integration with Project Manager skill

### Phase 3 (Future)
- Dashboard generation
- Sprint planning automation
- Progress tracking
- Team analytics

## Integration with Project Manager

This analyzer is designed to work with the Project Manager skill for full automation:

1. Analyzer scans and identifies TODOs
2. Manager creates GitHub issues from new TODOs
3. State tracking prevents duplicates
4. Reports track progress over time

## License

MIT

## Contributing

Contributions are welcome! Please ensure:
- All tests pass
- Code follows TypeScript best practices
- New features include tests
- Documentation is updated