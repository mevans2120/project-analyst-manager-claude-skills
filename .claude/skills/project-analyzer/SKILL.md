---
name: project-analyzer
description: Analyzes repositories to identify TODOs, FIXMEs, tasks, and implementation gaps. Use this when the user wants to scan a codebase for pending work, analyze task completion, or understand what needs to be done in a project.
---

# Project Analyzer Skill

Automatically scans repositories to identify pending work items, analyze task completion rates, and provide insights into project status.

## When to Use This Skill

Invoke this skill when the user:
- Wants to find all TODOs, FIXMEs, or task markers in a codebase
- Needs a report of pending work items in a repository
- Asks to analyze task completion or progress
- Wants to understand what work remains in a project
- Requests a scan of markdown task lists (`- [ ]` items)
- Needs to identify likely-completed tasks (cleanup analysis)

## How It Works

The Project Analyzer scans repositories for:
- **Code comments**: TODO, FIXME, BUG, HACK, OPTIMIZE, REFACTOR, NOTE, XXX
- **Markdown tasks**: Unchecked task items (`- [ ]`), TODO sections
- **Completion markers**: Checked boxes (`[x]`), strikethrough, completed tasks
- **Archive detection**: Identifies tasks in archived/deprecated files

## Instructions

### Step 1: Determine the Repository Path

Ask the user which repository to analyze if not specified. Default to the current working directory if appropriate.

### Step 2: Choose Analysis Type

Determine what type of analysis is needed:
- **Standard scan**: Find all active TODOs and tasks
- **Completion analysis**: Identify likely-completed tasks to reduce noise
- **Priority scan**: Group results by priority level

### Step 3: Run the Analyzer

Execute the project-analyzer CLI tool:

```bash
cd "/Users/michaelevans/project-analyst-manager-Claude skills/project-analyzer"

# Standard scan (JSON output)
npm run analyze -- -p <repository-path> -o output.json --format json

# Standard scan (Markdown report)
npm run analyze -- -p <repository-path> -o report.md --format markdown

# Completion analysis (find likely-completed tasks)
npx ts-node src/cli.ts cleanup <repository-path> -f summary

# Detailed completion report
npx ts-node src/cli.ts cleanup <repository-path> -f markdown -o cleanup-report.md
```

### Step 4: Process and Present Results

Read the output file and present findings to the user in a clear, actionable format:
- Summarize total TODOs/tasks found
- Highlight high-priority items
- Group by file or priority as appropriate
- For completion analysis, report how many tasks are likely complete

### Step 5: Offer Next Steps

Suggest logical follow-up actions:
- "Would you like me to create GitHub issues from these TODOs?" (triggers project-manager skill)
- "Should I focus on high-priority items only?"
- "Would you like a cleanup analysis to identify completed tasks?"

## Common Options

### Output Formats
- `--format json`: Structured JSON for automation
- `--format markdown`: Human-readable markdown report
- `--format csv`: Spreadsheet-compatible output

### Grouping Options
- `-g priority`: Group by priority (high/medium/low)
- `-g file`: Group by source file (default)
- `-g type`: Group by TODO type (TODO, FIXME, etc.)

### Filtering Options
- `--include <pattern>`: Only scan files matching pattern
- `--exclude <pattern>`: Skip files matching pattern
- `--min-confidence <number>`: For cleanup, minimum confidence level (0-100)

## Examples

### Example 1: Quick Project Scan

**User**: "Can you analyze the TODOs in my project?"

**Response**:
1. Navigate to project-analyzer directory
2. Run: `npm run analyze -- -p ~/user-project -f markdown -o scan.md`
3. Read and summarize scan.md
4. Present findings grouped by priority
5. Offer to create GitHub issues

### Example 2: Completion Analysis

**User**: "I have a lot of old TODOs. Can you help me find which ones are already done?"

**Response**:
1. Navigate to project-analyzer directory
2. Run: `npx ts-node src/cli.ts cleanup ~/user-project -f markdown -o cleanup.md`
3. Read cleanup.md
4. Report completion statistics (e.g., "194 TODOs are likely completed")
5. Suggest reviewing high-confidence items for cleanup

### Example 3: High-Priority Focus

**User**: "What are the most critical issues in the codebase?"

**Response**:
1. Navigate to project-analyzer directory
2. Run: `npm run analyze -- -p ~/user-project -f markdown -g priority`
3. Extract high-priority items
4. Present only high-priority TODOs and FIXMEs
5. Offer to create issues for critical items

## Output Interpretation

### Standard Scan Output
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

### Completion Analysis Output
- **Very High Confidence (90-100%)**: Safe to mark as complete
- **High Confidence (70-89%)**: Review recommended
- **Medium Confidence (50-69%)**: Verify status
- **Active (<30%)**: Treat as active task

## Integration with Project Manager

After analyzing, you can chain to the project-manager skill:
1. Save analysis output as JSON
2. Pass to project-manager for GitHub issue creation
3. Generate reports and tracking

## Technical Details

- **Location**: `/Users/michaelevans/project-analyst-manager-Claude skills/project-analyzer/`
- **Language**: TypeScript/Node.js
- **Dependencies**: commander, glob, ignore
- **Performance**: ~1000 files/second
- **Supported file types**: 20+ languages (JS, TS, Python, Java, Go, etc.)

## Error Handling

If the analyzer fails:
1. Check the repository path is valid
2. Ensure npm dependencies are installed (`npm install`)
3. Verify the project is built (`npm run build`)
4. Check for permission issues on the target directory

## Report Storage Best Practices

When analyzing a repository, organize reports for easy access and version control:

### Recommended Structure

```
<repository-root>/
├── docs/
│   └── reports/
│       ├── README.md                  # Usage guide
│       ├── todo-summary-2025-10-20.md # Quick stats (version controlled)
│       ├── todo-analysis-2025-10-20.md # Full details (version controlled)
│       ├── todo-summary-2025-10-21.md # Next day's scan
│       └── ...
└── .project-analyzer/                 # Hidden state directory
    ├── state.json                     # Gitignored (changes frequently)
    └── scans/                         # Gitignored (dated archives)
        ├── scan-2025-10-20.md
        └── ...
```

### Setup Commands

```bash
# Create reports directory
mkdir -p <repo-path>/docs/reports

# Generate dated reports (date automatically added to filenames)
npx ts-node src/cli.ts scan <repo-path> -o <repo-path>/docs/reports/todo-analysis.md -f markdown -g priority
# Creates: todo-analysis-2025-10-20.md

npx ts-node src/cli.ts scan <repo-path> -o <repo-path>/docs/reports/todo-summary.md -f summary
# Creates: todo-summary-2025-10-20.md

# Add to .gitignore
echo "# Project Analyzer (state changes frequently, reports are tracked)" >> <repo-path>/.gitignore
echo ".project-analyzer/state.json" >> <repo-path>/.gitignore
echo ".project-analyzer/scans/" >> <repo-path>/.gitignore
```

**Note:** The analyzer automatically adds the current date (YYYY-MM-DD) to output filenames unless the filename already contains a date pattern. This makes it easy to track historical analyses while keeping commands simple.

### Why This Structure?

- **Easy to find**: Reports live in `docs/reports/` alongside other documentation
- **Version controlled**: Track TODO progress over time via git history
- **No bloat**: State files are gitignored, only meaningful summaries are tracked
- **Dated filenames**: Each analysis has a unique date stamp for easy tracking
- **Professional**: Follows common documentation conventions

### Report README Template

Create `<repo>/docs/reports/README.md` with:
- Links to latest reports
- Instructions for updating
- Explanation of report contents
- Last updated timestamp

## Tips for Best Results

- Run completion analysis on old projects with lots of historical TODOs
- Use priority grouping when presenting to users - they care most about high priority
- Combine with project-manager skill for end-to-end automation
- For large repos, consider using `--exclude node_modules` to speed up scanning
- Store reports in `docs/reports/` for easy access and version control
