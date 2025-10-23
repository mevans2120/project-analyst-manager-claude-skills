# Distribution Plan: Project Suite Claude Skills

## Goal
Make it dead simple for other developers to install and use these skills globally.

## Current Problems for Distribution

1. **Hardcoded paths** in skill definitions point to developer's local machine
2. **Source TypeScript** - users would need to build
3. **Dependencies** - npm install in 3 directories
4. **Playwright browsers** - separate install step
5. **Manual skill copying** - users need to know about `~/.claude/skills/`

## Proposed Solutions

### Option 1: NPM Package Approach (Like the Dashboard Philosophy: Simple)

**Single installable package that "just works"**

```bash
# One command to install everything globally
npx @project-suite/install

# Or if published to npm
npm install -g @project-suite/skills
```

**What this does:**
1. Copies skills to `~/.claude/skills/`
2. Installs compiled tools to `~/.project-suite/` (or `/usr/local/lib/project-suite/`)
3. Installs Playwright browsers
4. Creates symlinks so skills can find tools
5. Runs post-install verification

**Package Structure:**
```
@project-suite/skills/
├── package.json           # Single package for all three
├── install.js             # Post-install script
├── bin/                   # CLI executables (compiled)
│   ├── analyze
│   ├── plan
│   └── manage
├── skills/                # Skill definitions
│   ├── project-analyzer/
│   ├── project-manager/
│   └── project-planner/
└── lib/                   # Compiled TypeScript
    ├── analyzer/
    ├── manager/
    └── planner/
```

**Skill definitions would reference:**
```bash
# Instead of hardcoded dev path:
{{INSTALL_DIR}}/project-analyzer

# Gets replaced during install with:
~/.project-suite/analyzer
# Or user's custom install location
```

---

### Option 2: Installation Script (Dashboard-Style Simplicity)

**Single script users can curl and run**

```bash
curl -fsSL https://raw.githubusercontent.com/you/project-suite/main/install.sh | bash

# Or clone and run
git clone https://github.com/you/project-suite-claude-skills.git
cd project-suite-claude-skills
./install.sh
```

**What `install.sh` does:**
```bash
#!/bin/bash
set -e

echo "🚀 Installing Project Suite Claude Skills..."

# 1. Check prerequisites
command -v node >/dev/null 2>&1 || { echo "❌ Node.js required"; exit 1; }
command -v npm >/dev/null 2>&1 || { echo "❌ npm required"; exit 1; }

# 2. Install dependencies
echo "📦 Installing dependencies..."
cd project-analyzer && npm install && npm run build && cd ..
cd project-manager && npm install && npm run build && cd ..
cd project-planner && npm install && npm run build && cd ..

# 3. Install Playwright browsers
echo "🌐 Installing Playwright browsers..."
npx playwright install chromium

# 4. Get install location
INSTALL_DIR="${HOME}/.project-suite"
SKILLS_DIR="${HOME}/.claude/skills"

# 5. Copy compiled tools
echo "📁 Installing to ${INSTALL_DIR}..."
mkdir -p "${INSTALL_DIR}"
cp -r project-analyzer/dist "${INSTALL_DIR}/analyzer"
cp -r project-manager/dist "${INSTALL_DIR}/manager"
cp -r project-planner/dist "${INSTALL_DIR}/planner"
cp -r shared/dist "${INSTALL_DIR}/shared"

# 6. Copy skills and update paths
echo "✨ Installing skills to ${SKILLS_DIR}..."
mkdir -p "${SKILLS_DIR}"

# Update skill paths to point to installed location
sed "s|{{INSTALL_DIR}}|${INSTALL_DIR}|g" \
    .claude/skills/project-analyzer/SKILL.md > "${SKILLS_DIR}/project-analyzer/SKILL.md"

sed "s|{{INSTALL_DIR}}|${INSTALL_DIR}|g" \
    .claude/skills/project-manager/SKILL.md > "${SKILLS_DIR}/project-manager/SKILL.md"

sed "s|{{INSTALL_DIR}}|${INSTALL_DIR}|g" \
    .claude/skills/project-planner/SKILL.md > "${SKILLS_DIR}/project-planner/SKILL.md"

echo "✅ Installation complete!"
echo ""
echo "📚 Skills installed to: ${SKILLS_DIR}"
echo "🛠️  Tools installed to: ${INSTALL_DIR}"
echo ""
echo "🎯 Try it out:"
echo "   - Open Claude Code in any project"
echo "   - Ask: 'Analyze the TODOs in this project'"
echo "   - Ask: 'Analyze the design files in ./designs'"
echo ""
```

---

### Option 3: Docker Container (Over-engineered but Isolated)

```bash
docker pull project-suite/skills
docker run -v ~/.claude/skills:/skills project-suite/skills install
```

**Pros:** No Node.js requirement, isolated
**Cons:** Heavy for a skill, not "simple"

---

## Recommendation: Go With Option 2 (Installation Script)

**Why:**
1. **Dashboard philosophy:** Keep it simple, no complex tooling
2. **Transparent:** Users can read the script, understand what it does
3. **One command:** `./install.sh` or curl pipe
4. **Self-contained:** No npm registry dependency
5. **Easy to update:** `git pull && ./install.sh`

**Packaging Workflow:**

### For GitHub Release:

```bash
# 1. Create release script
./scripts/build-release.sh

# This creates:
project-suite-skills-v1.0.0.tar.gz
  ├── project-analyzer/dist/
  ├── project-manager/dist/
  ├── project-planner/dist/
  ├── shared/dist/
  ├── .claude/skills/
  ├── install.sh
  └── README.md

# 2. Users download and install:
curl -L https://github.com/you/project-suite/releases/latest/download/project-suite-skills.tar.gz | tar xz
cd project-suite-skills
./install.sh
```

---

## Additional Distribution Enhancements

### 1. Version Manager (Like nvm, rbenv)

```bash
# Install specific version
project-suite install 1.2.0

# Update to latest
project-suite update

# Uninstall
project-suite uninstall
```

### 2. Quick Install Documentation

Create `INSTALL-FOR-USERS.md`:

```markdown
# Quick Install

## One-Line Install

```bash
curl -fsSL https://project-suite.dev/install.sh | bash
```

## Manual Install

```bash
git clone https://github.com/you/project-suite-claude-skills.git
cd project-suite-claude-skills
./install.sh
```

## Verify Installation

```bash
ls ~/.claude/skills/
# Should show: project-analyzer, project-manager, project-planner
```

## First Use

1. Open Claude Code in any project
2. Ask: "Analyze the TODOs in this project"
3. Ask: "Analyze my design files in ./designs"

Done! 🎉
```

### 3. Auto-Update Checker

Add to skill definitions:

```yaml
---
name: project-analyzer
version: 1.0.0
update-check: https://api.github.com/repos/you/project-suite/releases/latest
---
```

---

## Next Steps

### Phase 1: Prepare for Distribution (30 minutes)

1. **Create `install.sh`** script
2. **Create `scripts/build-release.sh`** to package dist files
3. **Update skill paths** to use `${HOME}/.project-suite/`
4. **Test install** on a fresh machine (or VM)

### Phase 2: Polish Documentation (15 minutes)

1. **Create `INSTALL-FOR-USERS.md`** with one-line install
2. **Update main `README.md`** with quick start
3. **Add GIF demos** showing installation + usage

### Phase 3: Publish (5 minutes)

1. **Create GitHub release** with tarball
2. **Test one-line install** with GitHub release URL
3. **Share with community**

---

## What Users Will See

### Installation:
```
$ curl -fsSL https://project-suite.dev/install.sh | bash

🚀 Installing Project Suite Claude Skills...
📦 Installing dependencies...
✓ project-analyzer installed
✓ project-manager installed
✓ project-planner installed
🌐 Installing Playwright browsers...
✓ Chromium installed
📁 Installing to /Users/alice/.project-suite...
✨ Installing skills to /Users/alice/.claude/skills...
✅ Installation complete!

🎯 Try it out:
   - Open Claude Code in any project
   - Ask: 'Analyze the TODOs in this project'

$
```

### Usage:
```
alice@macbook ~/my-app $ # Open Claude Code
alice@macbook ~/my-app $ # Ask Claude naturally:

User: "Analyze the design files in ./designs and export to CSV"

Claude: [Automatically invokes project-analyzer skill]
🎨 Analyzing design files...
📁 Analyzing 5 file(s)...
✅ Found 42 features
   Average confidence: 85%
📄 Output written to: features.csv

📊 Summary by Category:
   UI Component: 15
   Navigation: 8
   Form: 6
   ...
```

---

## Comparison to Dashboard

| Aspect | Dashboard | Skills Suite |
|--------|-----------|--------------|
| **Installation** | Open HTML file | Run install.sh |
| **Dependencies** | None | Node.js, Playwright |
| **Updates** | Git pull | Git pull + ./install.sh |
| **Packaging** | Single HTML | Compiled JS + skills |
| **Distribution** | Drag & drop | Script install |
| **Philosophy** | ✅ Simple | ✅ Simple (one script) |

Both follow "keep it simple" - dashboard is simpler because it's client-side only.

---

## Open Questions

1. **Should we publish to npm?** (Pro: discoverability, Con: extra step)
2. **GitHub vs custom domain?** (Pro custom: looks pro, Con: costs money)
3. **Support Windows?** (install.sh → install.ps1 + install.bat?)
4. **Telemetry/analytics?** (Count installs? Probably no - privacy)
5. **Auto-update?** (Check for new version on skill invoke?)

---

## My Recommendation

**Start with Option 2 (install.sh) + GitHub Releases**

Then enhance based on user feedback:
- If users want npm: add npm publish
- If users want updates: add update checker
- If users want Windows: add PowerShell script

**Ship the simple version first, iterate based on real user pain.**

Just like the dashboard: solve problems you actually have, not problems you imagine.
