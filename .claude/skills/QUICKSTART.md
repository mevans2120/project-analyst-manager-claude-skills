# Quick Start: Project Analyzer & Manager Skills

Two Claude Code skills are now available for automated project management:

## Skills Available

### 1. `project-analyzer`
Scans repositories for TODOs, tasks, and completion analysis.

**Invoke by asking Claude**:
- "Analyze the TODOs in my project"
- "What tasks are pending in this codebase?"
- "Find all FIXMEs and bugs"
- "Which TODOs are already completed?"

### 2. `project-manager`
Creates GitHub issues, applies labels, and generates reports.

**Invoke by asking Claude**:
- "Create GitHub issues from these TODOs"
- "Generate a project status report"
- "Set up issue automation for my repository"

## First-Time Setup

### For Project Analyzer
No setup needed! Just ask Claude to analyze a repository.

### For Project Manager

1. **GitHub Authentication**
   ```bash
   # Option 1: Use gh CLI (recommended)
   gh auth login

   # Option 2: Export token
   export GITHUB_TOKEN="your_personal_access_token"
   ```

2. **Create Configuration**
   ```bash
   cd project-manager
   cp project-manager.config.example.json project-manager.config.json
   ```

   Edit `project-manager.config.json` with your repository details:
   - `owner`: Your GitHub username or organization
   - `repo`: Repository name

3. **Install Dependencies** (if not already done)
   ```bash
   cd project-analyzer && npm install && npm run build
   cd ../project-manager && npm install && npm run build
   ```

## Usage Examples

### Example 1: Complete Workflow

```
You: "Analyze the TODOs in my codebase"
Claude: [Uses project-analyzer skill to scan and report]

You: "Create GitHub issues for the high-priority items"
Claude: [Uses project-manager skill to create issues]

You: "Generate a summary report"
Claude: [Uses project-manager skill to create report]
```

### Example 2: Cleanup Old TODOs

```
You: "I have lots of old TODOs. Which ones are likely completed?"
Claude: [Uses project-analyzer completion analysis]

You: "Show me the high-confidence completed items"
Claude: [Presents 90%+ confidence items from cleanup report]
```

### Example 3: Daily Automation

```
You: "Set up daily TODO tracking for my repository"
Claude: [Sets up config, explains automation workflow]

You: "Run today's analysis"
Claude: [Analyzes, creates issues, generates report]
```

## Skills Architecture

```
.claude/skills/
├── project-analyzer/
│   └── SKILL.md              # Analyzer skill definition
├── project-manager/
│   ├── SKILL.md              # Manager skill definition
│   └── config.example.json   # Configuration template
└── QUICKSTART.md             # This file
```

## How It Works

### Behind the Scenes

1. **Model-Invoked**: Claude automatically uses these skills based on your requests
2. **No Manual Commands**: Just ask naturally - Claude decides when to invoke
3. **Chained Execution**: Skills can work together (analyze → create issues → report)

### What Claude Does

When you ask to analyze TODOs:
1. Determines repository path
2. Invokes project-analyzer skill
3. Runs the TypeScript CLI tool
4. Parses and presents results
5. Suggests next steps

When you ask to create issues:
1. Checks GitHub authentication
2. Verifies configuration
3. Invokes project-manager skill
4. Runs dry-run first (safety)
5. Creates issues and reports results

## Tips for Best Results

1. **Be Specific**: "Analyze TODOs in ~/my-project" vs "analyze stuff"
2. **Chain Requests**: "Analyze the repo, then create issues for high-priority items"
3. **Safety First**: Claude always runs dry-run before creating issues
4. **Review Output**: Check what Claude finds before bulk operations

## Troubleshooting

### "GitHub authentication required"
- Run: `gh auth login` or set `GITHUB_TOKEN`

### "Config not found"
- Copy example config: `cp project-manager/project-manager.config.example.json project-manager/project-manager.config.json`
- Edit with your repository details

### "npm dependencies missing"
- Run: `npm install` in both `project-analyzer/` and `project-manager/`

### Skills not activating
- Check `.claude/skills/` directory exists
- Verify SKILL.md files have proper YAML frontmatter
- Restart Claude Code session

## Advanced Usage

### Custom Label Mappings
Edit `project-manager/project-manager.config.json`:
```json
"labels": {
  "TODO": ["your-custom-label", "priority-medium"],
  "FIXME": ["critical-bug", "priority-critical"]
}
```

### Filtering Analysis
Ask Claude to:
- "Only scan TypeScript files for TODOs"
- "Find high-priority items only"
- "Exclude archived directories"

### Bulk Operations
- "Analyze all repositories in ~/projects"
- "Create issues for everything above medium priority"
- "Generate weekly summary reports"

## What's Next

These skills implement **Phase 1** of the project plan. Future enhancements:
- Specification mapping (Phase 2)
- Gap analysis and implementation tracking
- Sprint planning integration
- Interactive dashboards

## Support

- Check skill SKILL.md files for detailed instructions
- Review project-analyzer/README.md for analyzer details
- Review project-manager/README.md for manager details
- See main project documentation in project root
