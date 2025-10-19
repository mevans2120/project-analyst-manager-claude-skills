# Project Manager - Quick Start Guide

This guide will help you get started with Project Manager in 5 minutes.

## Prerequisites

- Node.js 18+ installed
- GitHub account with a repository
- GitHub Personal Access Token with `repo` permissions

## Step 1: Installation

```bash
cd project-manager
npm install
npm run build
```

## Step 2: Set Up GitHub Authentication

Create a GitHub Personal Access Token:
1. Go to GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic)
2. Click "Generate new token (classic)"
3. Select scopes: `repo` (full control of private repositories)
4. Generate and copy the token

Set the token as an environment variable:

```bash
export GITHUB_TOKEN="ghp_your_token_here"
```

## Step 3: Create Configuration File

Create `project-manager.config.json` in your project root:

```bash
cp project-manager.config.example.json project-manager.config.json
```

Edit the file with your repository details:

```json
{
  "github": {
    "owner": "your-github-username",
    "repo": "your-repository-name",
    "defaultLabels": ["auto-created"],
    "issueTitlePrefix": "[PM]"
  },
  "stateFile": ".project-state.json",
  "reporting": {
    "outputPath": "docs/reports",
    "schedule": "daily"
  }
}
```

## Step 4: Test with Dry Run

First, get some TODOs from Project Analyzer:

```bash
cd ../project-analyzer
npm run analyze -- -p /path/to/your/repo -o ../analyzer-output.json --format json
```

Then create issues in dry-run mode to preview:

```bash
cd ../project-manager
npm run manage create-issues -- -i ../analyzer-output.json --dry-run
```

You should see output like:

```
Found 15 TODOs in analyzer output.
Processing 15 new TODOs...
[DRY RUN] Would create issue: Implement user authentication
  Labels: feature, priority-medium, auto-created, from-todo, from-code
  File: src/auth.ts:42

--- Results ---
Total processed: 15
Issues created: 15
Issues failed: 0
Issues skipped: 0
```

## Step 5: Create Real Issues

Once you're happy with the preview, remove `--dry-run`:

```bash
npm run manage create-issues -- -i ../analyzer-output.json
```

This will:
- Create GitHub issues for each TODO
- Apply appropriate labels
- Save state to prevent duplicates
- Display results

## Step 6: Generate Report

Generate a daily report:

```bash
npm run manage report
```

This creates a markdown report at `docs/reports/YYYY-MM-DD-daily-report.md`.

## Step 7: View Statistics

Check your progress:

```bash
npm run manage stats
```

Output:

```
--- Project Manager Statistics ---
Period: Last 7 days

Total processed: 15
Issues created: 15
Issues failed: 0
Issues skipped: 0

By Priority:
  High: 3
  Medium: 10
  Low: 2

By Type:
  TODO: 10
  FIXME: 3
  BUG: 2
```

## Common Workflows

### Daily TODO Processing

```bash
# 1. Analyze repository
cd project-analyzer
npm run analyze -- -p /path/to/repo -o todos.json --format json

# 2. Create issues from new TODOs
cd ../project-manager
npm run manage create-issues -- -i ../todos.json

# 3. Generate daily report
npm run manage report
```

### Weekly Summary

```bash
npm run manage summary -- -d 7 -o weekly-summary.md
cat weekly-summary.md
```

### Check for Duplicates

The state tracker automatically prevents duplicates. To see what's been processed:

```bash
cat .project-state.json | jq '.processedTodos | length'
```

## Troubleshooting

### "GitHub token not found"

Make sure you've exported the token:

```bash
echo $GITHUB_TOKEN  # Should show your token
```

### "Configuration file not found"

Create the config file:

```bash
cp project-manager.config.example.json project-manager.config.json
```

Then edit it with your repository details.

### Issues not being created

1. Verify token has correct permissions
2. Check repository owner/name in config
3. Review any error messages in the output

### "No new TODOs to process"

This means all TODOs in the input have already been processed. Check:

```bash
npm run manage stats
```

To force reprocessing, delete the state file:

```bash
rm .project-state.json
```

## Next Steps

- Customize label mappings in config file
- Set up automated daily runs with cron/GitHub Actions
- Integrate with CI/CD pipeline
- Explore the full README for advanced usage

## Tips

1. **Always use dry-run first** to preview changes
2. **Keep state file in version control** (add to .gitignore)
3. **Review reports regularly** to track progress
4. **Customize labels** to match your workflow
5. **Archive old reports** periodically

## Example GitHub Action

Create `.github/workflows/todo-management.yml`:

```yaml
name: TODO Management

on:
  schedule:
    - cron: '0 9 * * *'  # Daily at 9 AM
  workflow_dispatch:

jobs:
  process-todos:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Install dependencies
        run: |
          cd project-analyzer && npm install
          cd ../project-manager && npm install

      - name: Analyze TODOs
        run: |
          cd project-analyzer
          npm run analyze -- -p ../ -o ../todos.json --format json

      - name: Create GitHub Issues
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
        run: |
          cd project-manager
          npm run manage create-issues -- -i ../todos.json

      - name: Generate Report
        run: |
          cd project-manager
          npm run manage report

      - name: Commit Report
        run: |
          git config user.name "TODO Bot"
          git config user.email "bot@example.com"
          git add docs/reports/ .project-state.json
          git commit -m "Update TODO management [skip ci]" || true
          git push
```

## Support

For issues or questions:
- Check the full README.md
- Review test files for usage examples
- Check the TypeScript types for API reference
