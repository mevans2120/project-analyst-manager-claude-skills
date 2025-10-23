# Project Analyst & Manager - Demo Guide

This guide demonstrates the complete workflow using both skills together.

## Prerequisites

Before starting:
- Both projects installed and built
- GitHub token set: `export GITHUB_TOKEN="your_token"`
- Config file created in project-manager

## Demo 1: Basic TODO to Issue Workflow

### Step 1: Analyze a Repository

```bash
cd project-analyzer

# Analyze this repository itself
npm run analyze -- -p ../ -o ../demo-output.json --format json

# Expected output:
# Scanning repository: /path/to/project-suite-claude-skills
# Found 8 files to scan
# Scanning complete: Found X TODOs
# Output saved to: ../demo-output.json
```

### Step 2: Preview the TODOs

```bash
# View as markdown for human reading
npm run analyze -- -p ../ --format markdown

# Or view the JSON structure
cat ../demo-output.json | jq '.summary'
```

Expected output:
```json
{
  "totalTodos": 5,
  "byPriority": {
    "high": 1,
    "medium": 3,
    "low": 1
  },
  "byType": {
    "TODO": 3,
    "FIXME": 1,
    "NOTE": 1
  }
}
```

### Step 3: Create Issues (Dry Run)

```bash
cd ../project-manager

# First, let's preview what issues would be created
npm run manage create-issues -- -i ../demo-output.json --dry-run

# Expected output:
# Found 5 TODOs in analyzer output.
# Processing 5 new TODOs...
# [DRY RUN] Would create issue: Implement feature X
#   Labels: feature, priority-medium, auto-created, from-todo, from-code
#   File: src/app.ts:42
# ...
#
# --- Results ---
# Total processed: 5
# Issues created: 5
# Issues failed: 0
# Issues skipped: 0
```

### Step 4: Create Real Issues

```bash
# Remove --dry-run to create actual issues
npm run manage create-issues -- -i ../demo-output.json

# Expected output:
# Found 5 TODOs in analyzer output.
# Processing 5 new TODOs...
# Created issue #123: Implement feature X
# Created issue #124: Fix authentication bug
# Created issue #125: Refactor database layer
# ...
#
# --- Results ---
# Total processed: 5
# Issues created: 5
# Issues failed: 0
# Issues skipped: 0
#
# State saved to: .project-state.json
```

### Step 5: Generate Report

```bash
npm run manage report

# Expected output:
# Report generated successfully!
# Location: docs/reports/2025-10-18-daily-report.md
```

View the report:
```bash
cat docs/reports/2025-10-18-daily-report.md
```

### Step 6: View Statistics

```bash
npm run manage stats

# Expected output:
# --- Project Manager Statistics ---
# Period: Last 7 days
#
# Total processed: 5
# Issues created: 5
# Issues failed: 0
# Issues skipped: 0
#
# By Priority:
#   High: 1
#   Medium: 3
#   Low: 1
#
# By Type:
#   TODO: 3
#   FIXME: 1
#   NOTE: 1
#
# Recent activity: 5 TODOs processed
```

## Demo 2: Duplicate Detection

### Step 1: Run Analysis Again

```bash
cd ../project-analyzer
npm run analyze -- -p ../ -o ../demo-output-2.json --format json
```

### Step 2: Try Creating Issues Again

```bash
cd ../project-manager
npm run manage create-issues -- -i ../demo-output-2.json

# Expected output:
# Found 5 TODOs in analyzer output.
# No new TODOs to process.
```

All TODOs were already processed, so no duplicates are created!

### Step 3: Check State File

```bash
cat .project-state.json | jq '.metadata'

# Expected output:
# {
#   "totalProcessed": 5,
#   "totalIssuesCreated": 5,
#   "lastReportDate": "2025-10-18"
# }
```

## Demo 3: Completion Analysis

### Step 1: Run Completion Report

```bash
cd ../project-analyzer
npm run analyze -- --completion-report -p ../

# Expected output:
# Scanning repository: /path/to/project-suite-claude-skills
# Analyzing completion patterns...
#
# === Completion Summary ===
# Total Active TODOs: 5
# Total Completed TODOs: 3
# Completion Rate: 37.5%
#
# === Completed TODOs ===
# 1. Implement basic scanning [COMPLETED]
#    - File: src/scanner.ts:10
#    - Completed by: Moving to archive/old-todos.md
#
# 2. Add tests for patterns [COMPLETED]
#    - File: tests/patterns.test.ts:5
#    - Completed by: Checked off in README.md
```

### Step 2: Export Completion Data

```bash
npm run analyze -- --completion-report -p ../ -o completion.json --format json

cat completion.json | jq '.completionSummary'
```

## Demo 4: Advanced Filtering

### Step 1: High Priority Only

```bash
cd ../project-analyzer

# Analyze but output markdown showing only high priority
npm run analyze -- -p ../ --format markdown | grep -A 3 "Priority: high"
```

### Step 2: Specific File Types

```bash
# Only scan TypeScript files
npm run analyze -- -p ../ --format markdown | grep "\.ts:" | head -10
```

### Step 3: Generate Summary Report

```bash
cd ../project-manager

# Generate weekly summary
npm run manage summary -- -d 7

# Or save to file
npm run manage summary -- -d 7 -o weekly-summary.md
cat weekly-summary.md
```

## Demo 5: Real-World Workflow

This demonstrates a typical daily workflow:

### Morning: Analyze New TODOs

```bash
#!/bin/bash
# morning-todo-check.sh

echo "Starting daily TODO analysis..."

# 1. Analyze repository
cd project-analyzer
npm run analyze -- -p /path/to/your/project -o daily-todos.json --format json

# 2. Create issues from new TODOs
cd ../project-manager
npm run manage create-issues -- -i ../daily-todos.json

# 3. Generate daily report
npm run manage report

# 4. Show statistics
npm run manage stats

echo "Done! Check docs/reports/ for today's report."
```

Make it executable:
```bash
chmod +x morning-todo-check.sh
./morning-todo-check.sh
```

### Weekly: Generate Summary

```bash
#!/bin/bash
# weekly-summary.sh

echo "Generating weekly summary..."

cd project-manager
npm run manage summary -- -d 7 -o weekly-summary-$(date +%Y-%m-%d).md

echo "Summary saved to weekly-summary-$(date +%Y-%m-%d).md"
```

## Demo 6: Integration Testing

### Test the Complete Pipeline

```bash
#!/bin/bash
# integration-test.sh

set -e  # Exit on error

echo "=== Integration Test ==="
echo

# Step 1: Analyze
echo "Step 1: Analyzing repository..."
cd project-analyzer
npm run analyze -- -p . -o ../test-todos.json --format json > /dev/null
echo "✓ Analysis complete"

# Step 2: Create issues (dry run)
echo "Step 2: Creating issues (dry run)..."
cd ../project-manager
npm run manage create-issues -- -i ../test-todos.json --dry-run > /dev/null
echo "✓ Issues preview complete"

# Step 3: Generate report (will be empty for dry run)
echo "Step 3: Generating report..."
npm run manage report > /dev/null
echo "✓ Report generated"

# Step 4: Show stats
echo "Step 4: Statistics..."
npm run manage stats

echo
echo "=== Integration Test Complete ==="
```

## Demo 7: Custom Label Configuration

### Step 1: Customize Labels

Edit `project-manager.config.json`:

```json
{
  "labels": {
    "TODO": ["feature", "priority-medium", "needs-planning"],
    "FIXME": ["bug", "priority-high", "urgent"],
    "HACK": ["tech-debt", "priority-low", "code-quality"],
    "OPTIMIZE": ["performance", "priority-medium"]
  }
}
```

### Step 2: Create Issues with Custom Labels

```bash
cd project-manager
npm run manage create-issues -- -i ../demo-output.json --dry-run

# You'll see custom labels applied:
# [DRY RUN] Would create issue: Implement feature X
#   Labels: feature, priority-medium, needs-planning, auto-created, from-todo
```

## Demo 8: Error Handling

### Simulate Network Error

```bash
# Unset GitHub token to simulate error
unset GITHUB_TOKEN

cd project-manager
npm run manage create-issues -- -i ../demo-output.json

# Expected output:
# Error: GitHub token not found. Please set GITHUB_TOKEN environment variable...
```

### Restore and Retry

```bash
export GITHUB_TOKEN="your_token"
npm run manage create-issues -- -i ../demo-output.json

# Now it works!
```

## Expected Results

After running these demos, you should have:

1. ✅ Created GitHub issues for all TODOs
2. ✅ Generated daily reports in `docs/reports/`
3. ✅ State file tracking all processed TODOs
4. ✅ No duplicate issues created
5. ✅ Labels correctly applied
6. ✅ Statistics showing progress

## Verification

Verify everything worked:

```bash
# Check GitHub issues were created
gh issue list --label auto-created

# Check state file
cat project-manager/.project-state.json | jq '.metadata'

# Check reports directory
ls -lh project-manager/docs/reports/

# Check test results
cd project-analyzer && npm test
cd ../project-manager && npm test
```

## Cleanup (Optional)

To clean up demo data:

```bash
# Remove demo output files
rm demo-output.json demo-output-2.json completion.json test-todos.json

# Reset state file (WARNING: This will allow recreating all issues)
rm project-manager/.project-state.json

# Remove demo reports (optional)
rm -rf project-manager/docs/reports/*
```

## Next Steps

1. Try on your own repository
2. Set up daily automation with cron or GitHub Actions
3. Customize labels and configuration
4. Explore advanced filtering options
5. Integrate into your development workflow

## Tips for Success

1. **Always dry-run first**: Use `--dry-run` to preview before creating issues
2. **Keep state file**: Don't delete `.project-state.json` or you'll get duplicates
3. **Review reports**: Check daily reports to track progress
4. **Customize labels**: Adjust labels to match your workflow
5. **Use completion analysis**: Track which TODOs are getting done

## Troubleshooting

### Issue: No TODOs found
- Ensure you're pointing to correct directory
- Check .gitignore isn't excluding files
- Verify files have supported extensions

### Issue: Duplicate issues
- Check state file exists and is valid
- Ensure you're using same config file
- Verify TODO hashes are being generated

### Issue: GitHub API errors
- Check token permissions
- Verify repository name is correct
- Check rate limits (5000/hour)

## Support

For more information:
- Project Analyzer: `project-analyzer/README.md`
- Project Manager: `project-manager/README.md`
- Quick Start: `project-manager/QUICKSTART.md`
- Implementation: `project-manager/IMPLEMENTATION.md`

---

**Happy TODO Management!** 🚀
