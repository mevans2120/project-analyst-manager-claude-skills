---
name: project-manager
description: Creates GitHub issues from TODOs, applies smart labels, generates reports, and manages project state. Use this when the user wants to create issues from a TODO analysis, generate project reports, or manage GitHub issue creation automation.
---

# Project Manager Skill

Automates GitHub issue creation from TODOs, applies intelligent labeling, prevents duplicates, and generates comprehensive project reports.

## When to Use This Skill

Invoke this skill when the user:
- Wants to create GitHub issues from TODOs or task lists
- Needs to bulk-create issues for pending work items
- Asks for project status reports or summaries
- Wants to prevent duplicate issue creation
- Requests automated issue labeling based on TODO types
- Needs daily/weekly project management reports
- Has run project-analyzer and wants to act on the results

## How It Works

The Project Manager:
- **Creates GitHub issues**: Uses Octokit API to create issues from TODO items
- **Smart labeling**: Auto-applies labels based on TODO type and priority
- **Duplicate prevention**: SHA256-based state tracking prevents duplicate issues
- **Report generation**: Creates markdown reports with statistics and summaries
- **Dry-run mode**: Preview changes before creating actual issues

## Prerequisites

Before using this skill, ensure:
1. GitHub authentication is configured: `export GITHUB_TOKEN="your_token"` or `gh auth login`
2. Configuration file exists at `project-manager/project-manager.config.json`
3. User has specified the target repository (owner/name)

## Instructions

### Step 1: Verify Prerequisites

Check if GitHub token is set and configuration exists:

```bash
# Check if GitHub token is available
if [ -z "$GITHUB_TOKEN" ]; then
  # Check if gh CLI is authenticated
  if ! gh auth status >/dev/null 2>&1; then
    echo "GitHub authentication required. Please run: gh auth login"
    exit 1
  fi
fi

# Check for config file
cd "/Users/michaelevans/project-suite-claude-skills/project-manager"
if [ ! -f "project-manager.config.json" ]; then
  echo "Configuration file needed. Would you like me to create one?"
fi
```

### Step 2: Determine Operation Type

Identify what the user wants to do:
- **Create issues**: From project-analyzer output or TODO list
- **Generate report**: Daily/weekly status report
- **View statistics**: Show issue creation stats
- **Summary**: Generate summary report

### Step 3: Execute the Appropriate Command

Navigate to project-manager and run the corresponding command:

```bash
cd "/Users/michaelevans/project-suite-claude-skills/project-manager"

# Create issues from analyzer output (DRY RUN FIRST!)
npm run manage create-issues -- -i <input.json> --dry-run
# If dry run looks good, run for real:
npm run manage create-issues -- -i <input.json>

# Generate daily report
npm run manage report

# View statistics
npm run manage stats

# Generate summary report
npm run manage summary -o summary.md
```

### Step 4: Review and Present Results

After execution:
1. Read any generated reports
2. Summarize issues created (count, types, priorities)
3. Show any errors or skipped items
4. Present next steps to the user

### Step 5: Offer Follow-up Actions

Suggest logical next steps:
- "View the created issues on GitHub?"
- "Generate a report for your team?"
- "Run this again tomorrow to catch new TODOs?"

## Common Operations

### Operation 1: Create Issues from Analysis

**Prerequisites**: JSON output from project-analyzer

```bash
# Always dry-run first!
npm run manage create-issues -- -i todos.json --dry-run

# Review output, then create for real
npm run manage create-issues -- -i todos.json

# With custom config
npm run manage create-issues -- -i todos.json -c my-config.json
```

### Operation 2: Generate Reports

```bash
# Daily report (auto-dated)
npm run manage report

# For specific date
npm run manage report -- -d 2025-10-20

# Summary report (last 30 days)
npm run manage summary -- -d 30 -o summary.md
```

### Operation 3: View Statistics

```bash
# Show all-time stats
npm run manage stats

# Stats for last 30 days
npm run manage stats -- -d 30
```

## Configuration

### Creating a Configuration File

If configuration doesn't exist, offer to create one:

```json
{
  "github": {
    "owner": "<username>",
    "repo": "<repository>",
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
    "REFACTOR": ["refactor", "priority-medium"]
  }
}
```

Ask the user for:
- GitHub repository owner (username or organization)
- Repository name
- Any custom label preferences

### Customizing Labels

The label system automatically maps TODO types to GitHub labels:
- `TODO` → `feature`, `priority-medium`
- `FIXME`/`BUG` → `bug`, `priority-high`
- `HACK` → `tech-debt`, `priority-low`
- `OPTIMIZE` → `enhancement`, `priority-low`
- `REFACTOR` → `refactor`, `priority-medium`

Additional auto-applied labels:
- `auto-created` - All automatically created issues
- `from-todo` - Sourced from TODO comment
- `from-code` - From code file
- `from-markdown` - From markdown file

## Examples

### Example 1: Full Workflow from Analysis to Issues

**User**: "I analyzed my project and found TODOs. Can you create GitHub issues for them?"

**Response**:
1. Verify project-analyzer output exists (JSON file)
2. Check GitHub authentication
3. Ensure project-manager config exists for target repo
4. Run dry-run: `npm run manage create-issues -- -i todos.json --dry-run`
5. Show user what will be created
6. Ask for confirmation
7. Create issues: `npm run manage create-issues -- -i todos.json`
8. Report results (e.g., "Created 15 issues: 5 bugs, 10 features")
9. Offer to generate a report

### Example 2: Daily Project Report

**User**: "Generate a project status report"

**Response**:
1. Navigate to project-manager directory
2. Run: `npm run manage report`
3. Read the generated report from `docs/reports/daily-status-YYYY-MM-DD.md`
4. Summarize key metrics:
   - Total TODOs processed
   - Issues created vs skipped
   - Priority breakdown
   - Top files with TODOs
5. Present report to user

### Example 3: First-Time Setup

**User**: "Set up issue creation for my repository"

**Response**:
1. Ask for GitHub repository details (owner/name)
2. Create project-manager.config.json with user's details
3. Verify GitHub token: `gh auth status`
4. If not authenticated: Guide through `gh auth login`
5. Run a dry-run test with sample TODO
6. Confirm everything works
7. Document the setup for team

## State Management

The project-manager maintains a `.project-state.json` file to track processed TODOs and prevent duplicates:

```json
{
  "lastUpdated": "2025-10-20T10:30:00.000Z",
  "processedTodos": [
    {
      "hash": "abc123...",
      "content": "Implement feature X",
      "file": "src/app.ts",
      "line": 42,
      "issueNumber": 123,
      "issueUrl": "https://github.com/owner/repo/issues/123",
      "status": "created"
    }
  ],
  "metadata": {
    "totalProcessed": 15,
    "totalIssuesCreated": 12
  }
}
```

**Important**: Never delete this file unless intentionally resetting state!

## Integration with Project Analyzer

Typical workflow combining both skills:

1. **User asks to analyze project** → Invoke project-analyzer skill
2. Project-analyzer saves output as JSON
3. **User asks to create issues** → Invoke project-manager skill
4. Project-manager reads analyzer JSON and creates issues
5. Generate report showing what was created

## Safety Features

### Dry-Run Mode
**Always** run with `--dry-run` first to preview:
- Shows exactly what issues will be created
- Displays labels that will be applied
- No actual GitHub API calls made
- Safe to run multiple times

### Duplicate Detection
- SHA256 hash of TODO content, file, and line number
- State file tracks all processed items
- Automatically skips items already processed
- Prevents creating duplicate issues

### Error Handling
- Failed issue creations are logged
- State is saved even on partial failures
- Retry logic for network issues
- Clear error messages

## Report Formats

### Daily Report
```markdown
# Daily Project Manager Report
**Date:** 2025-10-20

## Summary
- Total TODOs Processed: 5
- Issues Created: 4
- Issues Failed: 0
- Issues Skipped: 1 (duplicate)

### By Priority
| Priority | Count |
|----------|-------|
| High     | 2     |
| Medium   | 2     |

## Issues Created
### 🔴 Fix authentication bug
**Issue:** [#123](https://github.com/owner/repo/issues/123)
**File:** `src/auth.ts:42`
```

### Summary Report
- Aggregates multiple days
- Shows trends
- Completion statistics
- Top files with most TODOs

## Troubleshooting

### "GitHub token not found"
```bash
# Option 1: Export token
export GITHUB_TOKEN="ghp_your_token_here"

# Option 2: Use gh CLI
gh auth login
```

### "Config file not found"
```bash
cd project-manager
cp project-manager.config.example.json project-manager.config.json
# Edit with your repository details
```

### "Duplicate issues being created"
- Verify `.project-state.json` exists and is valid
- Check that state file isn't gitignored or deleted
- Ensure file paths are consistent

### "Permission denied"
- Ensure GitHub token has `repo` scope permissions
- Verify you have write access to the repository
- Check repository owner/name in config is correct

## Technical Details

- **Location**: `/Users/michaelevans/project-suite-claude-skills/project-manager/`
- **Language**: TypeScript/Node.js
- **Dependencies**: @octokit/rest, commander
- **API**: GitHub REST API v3
- **Rate Limits**: Respects GitHub API rate limits
- **Performance**: ~50-100 issues/second (API limited)

## Best Practices

1. **Always dry-run first** - Preview before creating issues
2. **Start small** - Test with a few TODOs before bulk creation
3. **Customize labels** - Adjust label mappings for your team's workflow
4. **Regular reports** - Generate reports weekly for team standup
5. **Clean state** - Don't delete state file unless resetting
6. **Team coordination** - Share config in git so team uses same labels

## Tips for Success

- Run project-analyzer with completion analysis first to reduce noise
- Create issues in batches (not all at once) to avoid overwhelming the team
- Use meaningful issue title prefixes to distinguish auto-created issues
- Review the daily report to catch any issues with automation
- Customize labels to match your existing GitHub workflow
