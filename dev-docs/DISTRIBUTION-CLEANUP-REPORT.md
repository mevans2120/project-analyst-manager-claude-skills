# Distribution Cleanup Report

**Date**: 2025-10-22
**Purpose**: Prepare package for public distribution
**Status**: Critical issues identified

---

## Executive Summary

The repository contains significant artifacts from a previous "hybrid-memory-bank-plugin" project that must be cleaned up before distribution. The root package.json and several directories are incorrectly named and contain personal development tools not intended for distribution.

---

## Critical Issues

### 1. Root package.json - INCORRECT PROJECT NAME

**File**: `/package.json`
**Issue**: Claims to be "hybrid-memory-bank-plugin" but this is a project management suite

```json
{
  "name": "hybrid-memory-bank-plugin",  // ❌ WRONG
  "version": "0.2.0",
  "description": "Hybrid memory system for Claude Code..." // ❌ WRONG
}
```

**Impact**: High - Confuses users about what this package actually does
**Action Required**: Update or remove (see recommendation below)

---

### 2. Entire /src Directory - LEFTOVER FROM PREVIOUS PROJECT

**Directory**: `/src/`
**Contents**:
- `/src/hooks/` - hybrid-memory-bank hooks
- `/src/commands/` - hybrid-memory-bank commands
- `/src/lib/memoryStore.js` - hybrid-memory-bank library
- `/src/index.js` - hybrid-memory-bank entry point

**Issue**: This entire directory is from the previous hybrid-memory-bank project
**Impact**: Critical - 45MB+ of irrelevant code in distribution
**Action Required**: DELETE entire directory

---

### 3. /.claude/hooks/ Directory - PERSONAL DEVELOPMENT TOOLS

**Directory**: `/.claude/hooks/`
**Contents**:
- `package.json` - also named "hybrid-memory-bank-plugin"
- `sessionStart.js`, `postToolUse.js`, `preToolUse.js`
- `userPromptSubmit.js.disabled`
- `wrapper.js`

**Issue**: These are personal development hooks, not part of the distributed skills
**References**: Hooks try to call `/src/hooks/sessionStart.js` which shouldn't exist in distribution

**Impact**: Medium - Confuses users, adds unnecessary files
**Action Required**: DELETE entire directory (or add to .gitignore)

---

### 4. /shared/web-viewer/ Directory - DUPLICATE/UNUSED CODE

**Directory**: `/shared/web-viewer/`
**Size**: 45MB (with node_modules)
**Issue**:
- Has its own package.json as `@project-management-suite/web-viewer`
- Contains 24 tests and full implementation
- NOT imported by any skill code (verified via grep)
- May be leftover from development or experimental feature

**Usage Check**:
```bash
# No imports found of @project-management-suite/web-viewer
# Only @project-suite/shared is used
```

**Impact**: Medium - Adds 45MB to distribution unnecessarily
**Action Required**: REMOVE or document if needed for future Phase 2+

---

### 5. /memory-bank/ Directory - REFERENCES OLD PROJECT

**Directory**: `/memory-bank/`
**Files**:
- `progress.md` - contains references to "hybrid-memory-bank"
- `CURRENT.md` - contains references to "hybrid-memory-bank"

**Issue**: Memory bank files reference the old project name
**Impact**: Low - Confusing but not breaking
**Action Required**: Clean up references or remove files

---

## Package.json Analysis

### Packages That Need Updates

#### 1. Root /package.json - MAJOR UPDATE NEEDED
```json
// Current (WRONG):
{
  "name": "hybrid-memory-bank-plugin",
  "description": "Hybrid memory system..."
}

// Should be:
{
  "name": "project-suite-claude-skills",
  "description": "Production-ready Claude Code skills for automated project management",
  "keywords": [
    "claude-code",
    "project-management",
    "github-issues",
    "todo-analyzer",
    "feature-discovery"
  ]
}
```

#### 2. /.claude/hooks/package.json - DELETE
Same incorrect name and description as root.

---

## Dependency Analysis

### Packages with Correct Dependencies

#### /shared/package.json ✅
```json
{
  "name": "@project-suite/shared",
  "dependencies": {
    "cheerio": "^1.0.0-rc.12",      // HTML parsing
    "node-fetch": "^2.7.0",          // HTTP requests
    "playwright": "^1.56.1",         // Browser automation
    "turndown": "^7.1.2"             // HTML to Markdown
  }
}
```
**Status**: All dependencies are essential and used.

#### /project-analyzer/package.json ✅
```json
{
  "dependencies": {
    "@project-suite/shared": "file:../shared",  // Local shared lib
    "commander": "^11.1.0",                      // CLI
    "glob": "^10.3.10",                          // File matching
    "ignore": "^5.3.0",                          // .gitignore parsing
    "playwright": "^1.56.1"                      // Website analysis
  }
}
```
**Status**: All dependencies are essential.
**Note**: Duplicate playwright dependency (also in shared) - consider peer dependency.

#### /project-manager/package.json ✅
```json
{
  "dependencies": {
    "@octokit/rest": "^20.0.2",              // GitHub API
    "@project-suite/shared": "file:../shared",
    "commander": "^11.1.0"                   // CLI
  }
}
```
**Status**: All dependencies are essential.

#### /project-planner/package.json ✅
```json
{
  "dependencies": {
    "@project-suite/shared": "file:../shared",
    "commander": "^11.1.0",
    "csv-parse": "^5.5.3",                   // CSV parsing
    "csv-stringify": "^6.4.5"                // CSV generation
  }
}
```
**Status**: All dependencies are essential.

#### /dashboard/package.json ✅
```json
{
  "dependencies": {
    "lit": "^3.1.0",                         // Web components
    "lucide-static": "^0.546.0"              // Icons
  }
}
```
**Status**: All dependencies are essential.

---

### Playwright Duplication Issue

**Problem**: Playwright (300MB+ installed) appears in 3 package.json files:
- `/shared/package.json` - playwright@^1.56.1
- `/project-analyzer/package.json` - playwright@^1.56.1
- `/shared/web-viewer/package.json` - playwright@^1.56.1

**Impact**: Potential for version conflicts and disk space waste
**Recommendation**: Consider making playwright a peer dependency in shared, or document that it's required globally

---

## Files/Directories to Remove

### Critical Removals (Must Remove)

1. **Entire /src/ directory** - 100% leftover from hybrid-memory-bank
   ```bash
   rm -rf src/
   ```

2. **/.claude/hooks/** - Personal development tools
   ```bash
   rm -rf .claude/hooks/
   ```

3. **/shared/web-viewer/** - Unused duplicate implementation (45MB)
   ```bash
   rm -rf shared/web-viewer/
   ```

4. **Root package.json** - Option A: Update completely OR Option B: Remove
   ```bash
   # Option A: Update name/description (recommended if monorepo)
   # Option B: Remove if not needed
   rm package.json package-lock.json
   ```

---

### Recommended Additions to .gitignore

```gitignore
# Personal development tools
.claude/hooks/

# Old project artifacts
src/

# Experimental/unused code
shared/web-viewer/

# Root package files if monorepo structure not needed
/package.json
/package-lock.json
```

---

## Security Concerns

### 1. Playwright Browsers
- Playwright downloads 300MB+ of browser binaries
- Install script runs `npx playwright install chromium --with-deps`
- **Concern**: Users might not want/need full browser installation
- **Recommendation**: Document this clearly, make it optional, or use playwright-core for lighter install

### 2. File References
- No hardcoded secrets or API keys found ✅
- No personal file paths in distributed code ✅
- Author name "Michael Evans" in some package.json files (acceptable)

### 3. package-lock.json Files
- All lock files present (8 total)
- **Recommendation**: Keep lock files for reproducible builds

---

## Package Metadata Issues

### Missing Author Information

Several package.json files have empty author fields:
- `/shared/package.json` - `"author": ""`
- `/project-analyzer/package.json` - `"author": ""`
- `/project-manager/package.json` - `"author": ""`
- `/project-planner/package.json` - `"author": ""`

**Recommendation**: Add consistent author information or organization name

### Inconsistent Naming

- Root: `hybrid-memory-bank-plugin` ❌
- Shared: `@project-suite/shared` ✅
- Web-viewer: `@project-management-suite/web-viewer` ❌ (inconsistent scope)
- Analyzer: `project-analyzer` ✅
- Manager: `project-manager` ✅
- Planner: `project-planner` ✅
- Dashboard: `project-management-dashboard` ⚠️ (inconsistent naming)

**Recommendation**: Standardize on either:
- Scoped: `@project-suite/analyzer`, `@project-suite/manager`, etc.
- Unscoped: `project-analyzer`, `project-manager`, etc.

---

## Recommendations Summary

### Immediate Actions (Before Distribution)

1. **Delete entire /src/ directory**
   - Contains 100% leftover hybrid-memory-bank code
   - Not referenced by any skill

2. **Delete /.claude/hooks/ directory**
   - Personal development hooks
   - References non-existent /src/ files

3. **Delete /shared/web-viewer/ directory**
   - Not used by any skill
   - Adds 45MB unnecessarily
   - Can be re-added in Phase 2 if needed

4. **Update or remove root package.json**
   - Current name/description is completely wrong
   - Either update to reflect monorepo OR remove if not needed

5. **Clean memory-bank files**
   - Remove or update references to "hybrid-memory-bank"

### Package.json Updates

6. **Standardize package naming**
   - Use consistent scoping (@project-suite/*)
   - Update dashboard to match naming convention

7. **Add author information**
   - Fill in empty author fields
   - Use consistent format across all packages

8. **Document Playwright requirement**
   - Large dependency (300MB+)
   - Make installation optional or document clearly

### Nice-to-Have Improvements

9. **Consolidate playwright dependencies**
   - Consider peer dependency pattern
   - Document version requirements

10. **Update .gitignore**
    - Add removed directories to prevent re-addition
    - Add development-specific patterns

---

## Proposed File Structure After Cleanup

```
project-suite-claude-skills/
├── .claude/
│   └── skills/           # Skill definitions only
├── shared/               # Shared library (keep)
├── project-analyzer/     # Analyzer skill (keep)
├── project-manager/      # Manager skill (keep)
├── project-planner/      # Planner skill (keep)
├── dashboard/            # Dashboard UI (keep)
├── .gitignore           # Updated
├── install.sh           # Keep
├── README.md            # Keep
├── CLAUDE.md            # Keep
├── CONVENTIONS.md       # Keep
└── DISTRIBUTION-PLAN.md # Keep
```

**Removed**:
- /src/ (entire directory)
- /.claude/hooks/ (entire directory)
- /shared/web-viewer/ (entire directory)
- Root package.json (or updated)

**Total Size Reduction**: ~50MB+
**Complexity Reduction**: Removes 3 major source of confusion

---

## Testing After Cleanup

After making these changes, verify:

1. **Build succeeds**:
   ```bash
   cd shared && npm install && npm run build
   cd project-analyzer && npm install && npm run build
   cd project-manager && npm install && npm run build
   cd project-planner && npm install && npm run build
   ```

2. **Tests pass**:
   ```bash
   cd shared && npm test
   cd project-analyzer && npm test
   cd project-manager && npm test
   cd project-planner && npm test
   ```

3. **Install script works**:
   ```bash
   ./install.sh
   ```

4. **Skills are accessible**:
   ```bash
   ls -la ~/.claude/skills/project-analyzer/
   ls -la ~/.claude/skills/project-manager/
   ls -la ~/.claude/skills/project-planner/
   ```

---

## Distribution Checklist

- [ ] Delete /src/ directory
- [ ] Delete /.claude/hooks/ directory
- [ ] Delete /shared/web-viewer/ directory
- [ ] Update or remove root package.json
- [ ] Update package.json author fields
- [ ] Standardize package naming
- [ ] Update .gitignore
- [ ] Clean memory-bank references
- [ ] Test full build process
- [ ] Test installation script
- [ ] Verify all tests pass (90/90)
- [ ] Update README if needed
- [ ] Create distribution tag/release

---

## Risk Assessment

### Low Risk Changes
- Deleting /src/ - not referenced anywhere
- Deleting /.claude/hooks/ - personal dev tools
- Updating package.json metadata - cosmetic

### Medium Risk Changes
- Deleting /shared/web-viewer/ - might be needed for future features
- Standardizing package names - requires testing imports

### High Risk Changes
- Consolidating playwright dependencies - could break builds

---

## Conclusion

The repository contains significant artifacts from a previous "hybrid-memory-bank-plugin" project that must be removed before distribution. The core project-suite code is clean and well-structured, but the distribution package needs cleanup to avoid confusion and reduce size.

**Estimated cleanup time**: 30 minutes
**Estimated testing time**: 15 minutes
**Total effort**: ~45 minutes

**Priority**: HIGH - Current state will confuse users and misrepresent the project

---

**Next Steps**: Review this report and approve cleanup actions, or request specific changes to the recommendations.
