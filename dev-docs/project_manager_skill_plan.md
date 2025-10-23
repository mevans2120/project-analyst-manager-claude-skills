# Project Manager Skills - Development Plan

## Overview
Create two complementary skills for Claude Code to automate project management tasks:
- **Project Analyzer** (read-only): Analyzes code, documentation, and GitHub state
- **Project Manager** (write operations): Creates issues, organizes docs, generates reports

## Target Repositories (Pilot)
- `codymd-hacknback-main`
- `care-tracker-mobile`

## Architecture

### Skill 1: Project Analyzer (Read-Only)
**Purpose**: Gather intelligence about project state without making changes

**Core Functions**:
1. Scan repository structure and identify planning documents
2. Parse planning docs for requirements, features, and tasks
3. Analyze codebase to determine implementation status
4. Query GitHub API for existing issues and PRs
5. Identify gaps between planned and implemented features
6. Detect duplicate or related issues
7. Generate analysis reports

### Skill 2: Project Manager (Write Operations)
**Purpose**: Take action based on analyzer output

**Core Functions**:
1. Create GitHub issues from identified gaps
2. Reorganize documentation (move to `/docs`, archive old files)
3. Update issue status and labels
4. Generate progress dashboards
5. Maintain project state file for tracking

## Progressive Implementation Phases

### Phase 1: Basic Analysis & Issue Creation (Week 1-2)
**Project Analyzer v0.1**:
- [x] Locate all markdown files in repo
- [x] Identify TODO comments in code
- [x] Parse basic task lists from markdown (- [ ] format)
- [x] Check for existing GitHub issues
- [x] Generate simple gap analysis report

**Project Manager v0.1**:
- [x] Create issues from TODOs and task lists
- [x] Apply basic labels (bug, feature, documentation)
- [x] Maintain `.project-state.json` to track processed items
- [x] Generate daily markdown report

### Phase 2: Smart Documentation & Implementation Tracking (Week 3-4)
**Project Analyzer v0.2**:
- [ ] Parse planning docs for specifications and requirements
- [ ] Map specifications to actual code implementation
- [ ] Identify partially implemented features
- [ ] Analyze code structure and dependencies
- [ ] Calculate implementation percentage for features

**Project Manager v0.2**:
- [ ] Reorganize docs (move to proper folders, archive old content)
- [ ] Create issues with implementation details and code references
- [ ] Link related issues
- [ ] Update existing issues with progress

### Phase 3: Advanced Features & Dashboard (Week 5-6)
**Project Analyzer v0.3**:
- [ ] Cross-repository dependency analysis
- [ ] Sprint/milestone planning suggestions
- [ ] Technical debt identification
- [ ] Code quality metrics integration

**Project Manager v0.3**:
- [ ] Interactive dashboard generation
- [ ] Milestone creation and management
- [ ] Project board automation
- [ ] Weekly sprint planning suggestions

## GitHub Integration Recommendations

### Authentication Setup
```bash
# Use environment variable (easiest approach)
export GITHUB_TOKEN="your_personal_access_token"
```
Store in `.env` file for persistence.

### Issue Labels Structure
```yaml
Categories:
  - feature: New functionality
  - bug: Something isn't working
  - documentation: Documentation improvements
  - refactor: Code improvement without functionality change
  - infrastructure: DevOps, build, CI/CD

Priority:
  - priority-high: Critical for current sprint
  - priority-medium: Important but not urgent
  - priority-low: Nice to have

Status:
  - in-progress: Currently being worked on
  - blocked: Waiting on dependency
  - ready: Ready to implement
  - needs-review: Implementation needs verification

Source:
  - from-todo: Created from TODO comment
  - from-spec: Created from specification doc
  - from-gap: Identified implementation gap
```

### Project Board Setup
For managing 2-3 concurrent projects, I recommend:

1. **Single Board Approach** (Simpler):
   - One project board per repository
   - Columns: Backlog → Ready → In Progress → Review → Done
   - Use labels to distinguish feature areas

2. **Multi-Project Board** (More powerful):
   - One board spanning both repositories
   - Swimlanes by project or repository
   - Automated card movement based on issue/PR status

### Milestone Strategy
- Monthly milestones for regular releases
- Feature-based milestones for major initiatives
- "Debt & Cleanup" milestone for ongoing maintenance

## Document Organization Structure
```
/docs
  /planning
    - roadmap.md
    - features.md
    - requirements.md
  /archive
    /2024
    /2025
  /specs
    - api-spec.md
    - ui-spec.md
  /reports
    - daily-progress.md
    - implementation-status.md
```

## Configuration File Format
```json
{
  "repositories": [
    {
      "name": "codymd-hacknback-main",
      "owner": "your-username",
      "planningPaths": ["docs", "memory-bank"],
      "archiveAfterDays": 60
    },
    {
      "name": "care-tracker-mobile",
      "owner": "your-username",
      "planningPaths": ["docs"],
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

## Smart Filtering Logic
```python
# Pseudo-code for duplicate detection
def is_duplicate_issue(new_issue_title, existing_issues):
    # Check exact title match
    # Check fuzzy string matching (>80% similarity)
    # Check if keywords overlap significantly
    # Check if code references are the same
    return similarity_score > threshold

def is_already_implemented(spec_requirement, codebase):
    # Parse requirement for key functions/classes
    # Search codebase for implementations
    # Check if tests exist for the feature
    # Verify documentation exists
    return implementation_complete
```

## Daily Report Format
```markdown
# Project Status Report - [Date]

## Summary
- Active Issues: X
- Completed Today: Y
- New Issues Created: Z

## Progress by Repository

### codymd-hacknback-main
- Implementation Coverage: 75%
- Open Issues: 12
- Completed Features: [List]

### care-tracker-mobile
- Implementation Coverage: 60%
- Open Issues: 8
- Completed Features: [List]

## New Issues Created
1. [Issue Title] - [Link]
   - Source: TODO in file.js:42
   - Priority: High

## Completed Items
1. [Feature Name] - [Issue Link]

## Blocked Items
1. [Issue Title] - Waiting on: [Dependency]

## Upcoming Priorities
1. [High priority items for tomorrow]
```

## Success Metrics
- Reduction in "hidden" TODOs by 90%
- All planning docs organized within 1 week
- 100% of specifications tracked as issues
- Daily time saved: 30-45 minutes
- Zero duplicate issues created

## Next Steps
1. Review and approve this plan
2. Create initial SKILL.md files for both skills
3. Implement Phase 1 (basic analysis and issue creation)
4. Test with pilot repositories
5. Iterate based on feedback
