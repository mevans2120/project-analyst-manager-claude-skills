# Installing Project Analyst & Manager Skills

These skills are currently installed in this project's `.claude/skills/` directory, which means they're only available when working within this project.

## Option 1: Use Globally (Recommended)

To make these skills available in **all** your Claude Code sessions (so you can analyze any project):

```bash
# Copy skills to your personal Claude directory
cp -r .claude/skills/project-analyzer ~/.claude/skills/
cp -r .claude/skills/project-manager ~/.claude/skills/
```

**After copying**, the skills will be available everywhere!

## Option 2: Keep Project-Local

Leave the skills in `.claude/skills/` - they'll only work when Claude Code is opened in this project directory.

## Verifying Installation

### For Personal Skills (Global)
```bash
ls -la ~/.claude/skills/
# You should see:
# project-analyzer/
# project-manager/
```

### For Project Skills (Local)
```bash
ls -la .claude/skills/
# You should see:
# project-analyzer/
# project-manager/
```

## Using the Skills

Once installed, just ask Claude naturally:

- "Analyze the TODOs in this project"
- "Find all FIXMEs in ~/my-other-project"
- "Create GitHub issues from these TODOs"
- "Which TODOs are already completed?"

Claude will automatically invoke the appropriate skill based on your request!

## Skill Locations

Both skills are installed in:
- **Project**: `.claude/skills/` (available only in this project)
- **Personal** (after copying): `~/.claude/skills/` (available everywhere)

The actual analyzer and manager tools are located at:
- `/Users/michaelevans/project-suite-claude-skills/project-analyzer/`
- `/Users/michaelevans/project-suite-claude-skills/project-manager/`

## Output Locations

### Project Analyzer
Saves scan results to the **project being analyzed**:
```
<analyzed-project>/
  .project-analyzer/
    ├── scans/
    │   └── scan-2025-10-20.md
    └── state.json
```

### Project Manager
Uses configuration from `project-manager/project-manager.config.json` and saves state to the target repository's `.project-manager/` directory (or as configured).

## Requirements

- Node.js 18+ installed
- Dependencies installed in both tool directories:
  ```bash
  cd project-analyzer && npm install
  cd ../project-manager && npm install
  ```

## Troubleshooting

### Skills not appearing
1. Check that SKILL.md files exist and have proper YAML frontmatter
2. Restart Claude Code session
3. Verify paths in SKILL.md match your installation

### "npm not found" errors
- Ensure Node.js is installed: `node --version`
- Install dependencies: `npm install` in each tool directory

### "Permission denied" errors
- Check file permissions
- Ensure you have write access to output directories

## Updating Skills

To update the skills after changes:

```bash
# Update personal skills
cp -r .claude/skills/project-analyzer ~/.claude/skills/
cp -r .claude/skills/project-manager ~/.claude/skills/
```

## Uninstalling

### Remove Personal Skills
```bash
rm -rf ~/.claude/skills/project-analyzer
rm -rf ~/.claude/skills/project-manager
```

### Remove Project Skills
```bash
rm -rf .claude/skills/project-analyzer
rm -rf .claude/skills/project-manager
```

## For Team Members

If you're part of a team using this repository:

1. **Pull the latest changes** to get the `.claude/skills/` directory
2. **Copy to personal directory** (see Option 1 above)
3. **Install dependencies** in the tool directories
4. **Configure GitHub auth** for project-manager: `gh auth login`

That's it! The skills will work for you too.
