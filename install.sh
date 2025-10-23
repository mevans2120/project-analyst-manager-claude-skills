#!/bin/bash
set -e

echo "🚀 Installing Project Suite Claude Skills..."
echo ""

# Check prerequisites
echo "🔍 Checking prerequisites..."
if ! command -v node >/dev/null 2>&1; then
    echo "❌ Node.js is required but not installed."
    echo "   Install from: https://nodejs.org/"
    exit 1
fi

if ! command -v npm >/dev/null 2>&1; then
    echo "❌ npm is required but not installed."
    exit 1
fi

echo "✅ Node.js $(node --version) found"
echo "✅ npm $(npm --version) found"
echo ""

# Get current directory
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
INSTALL_DIR="${HOME}/.project-suite"
SKILLS_DIR="${HOME}/.claude/skills"

echo "📦 Installing dependencies and building..."
echo "   This may take a minute..."
echo ""

# Build shared library first
cd "${REPO_DIR}/shared"
npm install --silent >/dev/null 2>&1
npm run build --silent >/dev/null 2>&1
echo "✓ shared library built"

# Build project-analyzer
cd "${REPO_DIR}/project-analyzer"
npm install --silent >/dev/null 2>&1
npm run build --silent >/dev/null 2>&1
echo "✓ project-analyzer built"

# Build project-manager
cd "${REPO_DIR}/project-manager"
npm install --silent >/dev/null 2>&1
npm run build --silent >/dev/null 2>&1
echo "✓ project-manager built"

# Build project-planner
cd "${REPO_DIR}/project-planner"
npm install --silent >/dev/null 2>&1
npm run build --silent >/dev/null 2>&1
echo "✓ project-planner built"

echo ""
echo "🌐 Installing Playwright browsers (this may take 2-3 minutes)..."
cd "${REPO_DIR}"
npx playwright install chromium --with-deps >/dev/null 2>&1 || {
    echo "⚠️  Playwright browser install failed, but continuing..."
    echo "   You can install later with: npx playwright install chromium"
}
echo "✓ Playwright ready"
echo ""

# Create install directory
echo "📁 Installing to ${INSTALL_DIR}..."
mkdir -p "${INSTALL_DIR}"

# Copy compiled tools
cp -r "${REPO_DIR}/shared/dist" "${INSTALL_DIR}/shared"
cp -r "${REPO_DIR}/shared/node_modules" "${INSTALL_DIR}/shared/"
echo "✓ shared library installed"

cp -r "${REPO_DIR}/project-analyzer/dist" "${INSTALL_DIR}/analyzer"
cp -r "${REPO_DIR}/project-analyzer/node_modules" "${INSTALL_DIR}/analyzer/"
echo "✓ analyzer installed"

cp -r "${REPO_DIR}/project-manager/dist" "${INSTALL_DIR}/manager"
cp -r "${REPO_DIR}/project-manager/node_modules" "${INSTALL_DIR}/manager/"
echo "✓ manager installed"

cp -r "${REPO_DIR}/project-planner/dist" "${INSTALL_DIR}/planner"
cp -r "${REPO_DIR}/project-planner/node_modules" "${INSTALL_DIR}/planner/"
echo "✓ planner installed"

echo ""
echo "✨ Installing skills to ${SKILLS_DIR}..."
mkdir -p "${SKILLS_DIR}/project-analyzer"
mkdir -p "${SKILLS_DIR}/project-manager"
mkdir -p "${SKILLS_DIR}/project-planner"

# Copy and update skill definitions
# Replace hardcoded path with installed location
sed "s|/Users/michaelevans/project-suite-claude-skills|${INSTALL_DIR}|g" \
    "${REPO_DIR}/.claude/skills/project-analyzer/SKILL.md" > "${SKILLS_DIR}/project-analyzer/SKILL.md"
echo "✓ project-analyzer skill installed"

sed "s|/Users/michaelevans/project-suite-claude-skills|${INSTALL_DIR}|g" \
    "${REPO_DIR}/.claude/skills/project-manager/SKILL.md" > "${SKILLS_DIR}/project-manager/SKILL.md"
echo "✓ project-manager skill installed"

sed "s|/Users/michaelevans/project-suite-claude-skills|${INSTALL_DIR}|g" \
    "${REPO_DIR}/.claude/skills/project-planner/SKILL.md" > "${SKILLS_DIR}/project-planner/SKILL.md"
echo "✓ project-planner skill installed"

# Copy install and quickstart docs
cp "${REPO_DIR}/.claude/skills/INSTALL.md" "${SKILLS_DIR}/"
cp "${REPO_DIR}/.claude/skills/QUICKSTART.md" "${SKILLS_DIR}/"

echo ""
echo "✅ Installation complete!"
echo ""
echo "📚 Skills installed to: ${SKILLS_DIR}"
echo "🛠️  Tools installed to: ${INSTALL_DIR}"
echo ""
echo "🎯 Try it out:"
echo "   1. Open Claude Code in any project"
echo "   2. Ask: 'Analyze the TODOs in this project'"
echo "   3. Ask: 'Analyze the design files in ./designs'"
echo "   4. Ask: 'Discover features from my React code'"
echo ""
echo "📖 Documentation: ${SKILLS_DIR}/QUICKSTART.md"
echo ""
echo "🎉 Happy analyzing!"
