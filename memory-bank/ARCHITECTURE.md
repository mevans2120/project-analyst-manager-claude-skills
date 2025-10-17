# Architecture Documentation

## System Overview

The Project Analyst & Manager system consists of two complementary Claude Code skills designed to automate project management tasks across multiple repositories.

## Architecture Principles

1. **Separation of Concerns**: Read operations (Analyzer) are completely separated from write operations (Manager)
2. **Stateful Tracking**: All processed items are tracked to prevent duplicate operations
3. **Human-in-the-Loop**: Reports and suggestions are generated for human review before major changes
4. **Progressive Enhancement**: Phased implementation allows for gradual feature addition

## Component Architecture

### Project Analyzer (Read-Only Skill)

```
┌─────────────────────────────────────┐
│         Project Analyzer            │
├─────────────────────────────────────┤
│  Inputs:                            │
│  - Repository files                 │
│  - GitHub API (issues, PRs)         │
│  - Planning documents               │
├─────────────────────────────────────┤
│  Processing:                        │
│  - Parse TODOs from code            │
│  - Extract tasks from markdown      │
│  - Map specs to implementation      │
│  - Identify gaps                    │
├─────────────────────────────────────┤
│  Outputs:                           │
│  - Gap analysis report              │
│  - Implementation status            │
│  - Suggested issues                 │
└─────────────────────────────────────┘
```

### Project Manager (Write Operations Skill)

```
┌─────────────────────────────────────┐
│         Project Manager             │
├─────────────────────────────────────┤
│  Inputs:                            │
│  - Analyzer reports                 │
│  - User confirmations               │
│  - Configuration settings           │
├─────────────────────────────────────┤
│  Processing:                        │
│  - Duplicate detection              │
│  - Issue creation                   │
│  - Document organization            │
│  - Report generation                │
├─────────────────────────────────────┤
│  Outputs:                           │
│  - GitHub issues                    │
│  - Organized docs                   │
│  - Progress reports                 │
│  - Updated state file               │
└─────────────────────────────────────┘
```

## Data Flow

```
Repository Files → Analyzer → Gap Report → Manager → GitHub Issues
                      ↓                       ↓
                 Planning Docs            State File
                                             ↓
                                    Duplicate Detection
```

## State Management

### Project State File (`.project-state.json`)

Tracks:
- Processed TODOs (by file path and line number)
- Created issues (by title and timestamp)
- Document moves (source → destination)
- Last scan timestamp per file

### Memory Bank Integration

- **Automated Tracking** (`.claude-memory/`): Session data, patterns, recent changes
- **Human Documentation** (`memory-bank/`): Progress logs, architecture decisions, current status

## GitHub Integration Strategy

### Authentication
- Environment variable: `GITHUB_TOKEN`
- Fallback to GitHub CLI (`gh`) authentication

### Issue Creation Logic
1. Check state file for existing issues
2. Perform fuzzy matching on titles (>80% similarity)
3. Verify against open GitHub issues
4. Create with structured labels
5. Update state file

### Label Taxonomy
```
Category:       feature | bug | documentation | refactor
Priority:       priority-high | priority-medium | priority-low
Status:         ready | in-progress | blocked | needs-review
Source:         from-todo | from-spec | from-gap
```

## Configuration Schema

```json
{
  "repositories": [{
    "name": "string",
    "owner": "string",
    "planningPaths": ["array", "of", "paths"],
    "archiveAfterDays": "number"
  }],
  "github": {
    "defaultLabels": ["array"],
    "issueTitlePrefix": "string"
  },
  "reporting": {
    "schedule": "daily|weekly",
    "outputPath": "string"
  }
}
```

## Error Handling

1. **GitHub API Failures**: Retry with exponential backoff
2. **Duplicate Detection**: Log warnings, skip creation
3. **File Access Issues**: Report in error log, continue processing
4. **Invalid Configuration**: Fail fast with clear error message

## Performance Considerations

- Batch GitHub API calls to avoid rate limits
- Cache file parsing results for 24 hours
- Process repositories in parallel where possible
- Limit issue creation to 50 per run to allow review

## Security Considerations

- Never commit GitHub tokens
- Sanitize file paths in reports
- Validate all user inputs
- Use read-only access where possible

## Future Extensibility

The architecture supports future additions:
- Web dashboard interface
- Slack/Discord notifications
- Custom issue templates
- Machine learning for better duplicate detection
- Integration with CI/CD pipelines