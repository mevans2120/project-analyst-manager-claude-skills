// dashboard/data.js
// Update this file to reflect current project status

const productRoadmap = {
  "project": {
    "name": "Project Management Suite",
    "code": "PM",
    "status": "active",
    "phase": "Phase 0 Complete ✅ - Building Phase 1"
  },
  "current": [],
  "features": {
    "shipped": [
      {
        "id": "design-planner",
        "name": "Project Planner - Complete Design",
        "category": "Design",
        "phase": "Planning",
        "shippedDate": "2025-10-21",
        "value": "6 comprehensive documents (~34,000 words) covering feature registry, code discovery, and web-based discovery"
      },
      {
        "id": "design-shared-web",
        "name": "Shared Web Viewing Architecture",
        "category": "Design",
        "phase": "Planning",
        "shippedDate": "2025-10-21",
        "value": "Unified library design eliminating code duplication across all skills"
      },
      {
        "id": "design-analyzer-web",
        "name": "Analyzer Web Verification Design",
        "category": "Design",
        "phase": "Planning",
        "shippedDate": "2025-10-21",
        "value": "3-tier verification strategy (URL, functionality, API) for production validation"
      },
      {
        "id": "design-manager-screenshots",
        "name": "Manager Screenshot Documentation Design",
        "category": "Design",
        "phase": "Planning",
        "shippedDate": "2025-10-21",
        "value": "Visual documentation system with multi-viewport capture and AI analysis"
      },
      {
        "id": "integrated-roadmap",
        "name": "Integrated Implementation Roadmap",
        "category": "Planning",
        "phase": "Planning",
        "shippedDate": "2025-10-21",
        "value": "12-15 week implementation plan with parallel workstreams and 225+ planned tests"
      },
      {
        "id": "analyzer-v15",
        "name": "Analyzer v1.5 - Enhanced Feature Detection",
        "category": "Analyzer",
        "phase": "Phase 2",
        "shippedDate": "2025-10-21",
        "value": "Context-aware descriptions, configuration validation, contextual explanations - 99% accuracy on feature detection"
      },
      {
        "id": "manager-v10",
        "name": "Manager v1.0 - GitHub Issue Creation",
        "category": "Manager",
        "phase": "Phase 3",
        "shippedDate": "2025-10-17",
        "value": "Automated GitHub issue creation with smart labeling and duplicate prevention"
      },
      {
        "id": "analyzer-v10",
        "name": "Analyzer v1.0 - TODO Scanner",
        "category": "Analyzer",
        "phase": "Phase 2",
        "shippedDate": "2025-10-17",
        "value": "Scans 20+ file types for TODOs, FIXMEs, BUGs with 1000 files/sec performance"
      },
      {
        "id": "shared-webfetcher",
        "number": 1,
        "name": "WebFetcher - Static HTML Analysis",
        "category": "Shared Library",
        "phase": "Phase 0",
        "shippedDate": "2025-10-22",
        "value": "Foundation for all web viewing - 7 tests passing, fetch & analyze HTML with AI"
      },
      {
        "id": "planner-registry",
        "number": 3,
        "name": "CSV Feature Registry",
        "category": "Planner",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Single source of truth for features - 17 tests passing, full CRUD with dependency tracking"
      },
      {
        "id": "shared-playwright",
        "number": 2,
        "name": "PlaywrightDriver - Browser Automation",
        "category": "Shared Library",
        "phase": "Phase 0",
        "shippedDate": "2025-10-22",
        "value": "Complete browser automation - Chromium/Firefox/WebKit, auth, screenshots, network monitoring (400+ lines)"
      },
      {
        "id": "shared-screenshot",
        "number": 4,
        "name": "ScreenshotCapture - Multi-viewport Screenshots",
        "category": "Shared Library",
        "phase": "Phase 0",
        "shippedDate": "2025-10-22",
        "value": "Multi-viewport screenshots with comparison, scroll sequences, and file management (300+ lines)"
      },
      {
        "id": "planner-code-discovery",
        "number": 7,
        "name": "Code-Based Feature Discovery",
        "category": "Planner",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Analyze React routes, Express endpoints, components, and configs to discover features (400+ lines)"
      },
      {
        "id": "shared-network",
        "number": 5,
        "name": "NetworkMonitor - Enhanced API Discovery",
        "category": "Shared Library",
        "phase": "Phase 0",
        "shippedDate": "2025-10-22",
        "value": "Track API calls, discover patterns, export reports - network traffic analysis (300+ lines)"
      },
      {
        "id": "shared-extractors",
        "number": 6,
        "name": "Feature Extractors Suite",
        "category": "Shared Library",
        "phase": "Phase 0",
        "shippedDate": "2025-10-22",
        "value": "FeatureExtractor + FunctionalityChecker + VisualAnalyzer - complete extraction suite (400+ lines)"
      },
      {
        "id": "dashboard-test-status",
        "number": 18,
        "name": "Test Status Dashboard Tab",
        "category": "Dashboard",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Complete test monitoring - Jest reporter, CLI, web UI, 60 tests passing, real-time filtering & auto-refresh"
      },
      {
        "id": "dashboard-vite-setup",
        "number": 19,
        "name": "Vite + Lit Infrastructure Setup",
        "category": "Dashboard",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Modern dev environment with HMR working, TypeScript configured, project structure created - running on http://localhost:5173"
      },
      {
        "id": "dashboard-component-architecture",
        "number": 20,
        "name": "TypeScript Component Architecture",
        "category": "Dashboard",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Complete type system (40+ types), BaseComponent with lifecycle hooks, reactive StateService, error handling, async helpers - fully type-safe"
      },
      {
        "id": "dashboard-component-library",
        "number": 21,
        "name": "Reusable Component Library",
        "category": "Dashboard",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "8 production-ready components with Lucide icons: stat-card, badge, button, loading, error, search-input, filter-bar, icon - equal card heights, interactive showcase"
      },
      {
        "id": "dashboard-roadmap-migration",
        "number": 22,
        "name": "Migrate Roadmap View to Lit",
        "category": "Dashboard",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Interactive roadmap with real-time search, filtering (category/phase/priority), feature cards, responsive grid - loads data.js dynamically"
      },
      {
        "id": "dashboard-file-watcher",
        "number": 25,
        "name": "File System Watcher for Auto-Sync",
        "category": "Dashboard",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Auto-reload dashboard when data.js changes - polls every 1s, dispatches custom events, 170 lines of TypeScript"
      },
      {
        "id": "dashboard-skill-actions",
        "number": 26,
        "name": "Dashboard Actions → Skill Invocations",
        "category": "Dashboard",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "UI buttons trigger Claude skills - 'Run Analysis' button downloads action JSON, shows instructions, complete action type system with 5 action types"
      },
      {
        "id": "dashboard-action-queue",
        "number": 27,
        "name": "Action Queue System",
        "category": "Dashboard",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Queue system for dashboard → Claude communication - monitors .dashboard-actions/ directory, displays pending/processing/completed/failed actions, filter and cancel support"
      },
      {
        "id": "dashboard-live-updates",
        "number": 28,
        "name": "Real-Time Skill Output Display",
        "category": "Dashboard",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Stream skill execution progress to dashboard - terminal output display, progress bars, real-time updates, auto-scroll, color-coded log levels"
      },
      {
        "id": "planner-roadmap-export",
        "number": 9,
        "name": "Roadmap Export (Markdown/HTML)",
        "category": "Planner",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Generate visual roadmaps for stakeholders - Markdown with progress bars, HTML with dark theme styling, JSON export, grouping by phase/category/priority"
      },
      {
        "id": "planner-web-discovery",
        "number": 8,
        "name": "Web-Based Feature Discovery",
        "category": "Planner",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Discover features by analyzing live websites - extracts from navigation/content/interactions, AI-powered analysis, multi-viewport screenshots, API endpoint discovery (470+ lines)"
      },
      {
        "id": "analyzer-verification",
        "number": 10,
        "name": "Production Verification (3-tier)",
        "category": "Analyzer",
        "phase": "Phase 2",
        "shippedDate": "2025-10-22",
        "value": "Verify features work in production - Tier 1: URL verification, Tier 2: Functionality testing, Tier 3: API validation, staging comparison support (750+ lines)"
      },
      {
        "id": "manager-screenshots",
        "number": 12,
        "name": "Screenshot Documentation for Issues",
        "category": "Manager",
        "phase": "Phase 3",
        "shippedDate": "2025-10-22",
        "value": "Attach visual evidence to GitHub issues - code snippets, UI elements, full-page screenshots with GitHub upload support (560+ lines)"
      },
      {
        "id": "manager-multi-viewport",
        "number": 13,
        "name": "Multi-Viewport Screenshot Capture",
        "category": "Manager",
        "phase": "Phase 3",
        "shippedDate": "2025-10-22",
        "value": "Multi-viewport screenshots (mobile/tablet/desktop) with responsive comparison tables in GitHub issues - leverages shared ScreenshotCapture library"
      },
      {
        "id": "manager-visual-comparison",
        "number": 14,
        "name": "Before/After Visual Comparison",
        "category": "Manager",
        "phase": "Phase 3",
        "shippedDate": "2025-10-22",
        "value": "Visual regression detection with before/after screenshots, diff percentage calculation, side-by-side comparison tables"
      },
      {
        "id": "manager-ui-scan",
        "number": 15,
        "name": "Automated UI Bug Detection",
        "category": "Manager",
        "phase": "Phase 3",
        "shippedDate": "2025-10-22",
        "value": "AI-powered UI scanning - detects accessibility issues, layout problems, broken images, missing alt text - auto-generates bug TODOs for issue creation"
      },
      {
        "id": "analyzer-deployment-verify",
        "number": 11,
        "name": "Deployment Verification Workflow",
        "category": "Analyzer",
        "phase": "Phase 2",
        "shippedDate": "2025-10-22",
        "value": "Compare staging vs production environments - deployment readiness assessment, risk analysis, pre-deployment checklists, difference detection (350+ lines)"
      },
      {
        "id": "integration-workflow",
        "number": 16,
        "name": "Complete Planner → Analyzer → Manager Workflow",
        "category": "Integration",
        "phase": "Integration",
        "shippedDate": "2025-10-22",
        "value": "End-to-end workflow: Feature discovery (web + code) → Production verification → Deployment assessment → Issue creation - orchestrates all three skills for complete automation (350+ lines)"
      },
      {
        "id": "dashboard-tests-migration",
        "number": 23,
        "name": "Migrate Tests View to Lit",
        "category": "Dashboard",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Fully reactive Lit components - pm-tests-view (365 lines) with real-time search/filtering, pm-test-card component, integrated with test data service"
      },
      {
        "id": "dashboard-spa-routing",
        "number": 24,
        "name": "SPA Routing & Navigation",
        "category": "Dashboard",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Client-side routing with pm-nav and pm-app - hash-based navigation (#tests, #queue), no page reloads, active tab highlighting, responsive design"
      },
      {
        "id": "dashboard-action-buttons",
        "number": 29,
        "name": "Specific Action Buttons with Real Payloads",
        "category": "Dashboard",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "4 skill action buttons with proper payloads: Analyze TODOs, Create Issues, Export Roadmap, Verify Production - complete PM skill integration"
      },
      {
        "id": "dashboard-live",
        "number": 17,
        "name": "Live Interactive Dashboard",
        "category": "Dashboard",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Real-time project dashboard with auto-updates - includes file watcher (PM-25), real-time skill output (PM-28), action queue (PM-27), SPA routing (PM-24), and interactive filtering"
      },
      {
        "id": "dashboard-drag-drop",
        "number": 30,
        "name": "Drag & Drop Feature Reordering",
        "category": "Dashboard",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Drag features between backlog/nextUp/inProgress sections with dependency validation - visual feedback, state persistence, prevent invalid moves"
      },
      {
        "id": "dashboard-state-persistence",
        "number": 31,
        "name": "LocalStorage State Persistence",
        "category": "Dashboard",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Save dashboard changes to localStorage - persist drag-drop changes, reset to original data.js, change indicators"
      },
      {
        "id": "test-jest-config",
        "number": 49,
        "name": "Fix Jest/TypeScript Configuration",
        "category": "Testing",
        "phase": "Phase 0",
        "shippedDate": "2025-10-22",
        "value": "Root jest.config.js with projects configuration - all TypeScript tests compile correctly, 10/10 test suites passing, 140 tests passing"
      },
      {
        "id": "test-shared-playwright",
        "number": 50,
        "name": "Tests: PlaywrightDriver (PM-2)",
        "category": "Testing",
        "phase": "Phase 0",
        "shippedDate": "2025-10-22",
        "value": "Comprehensive PlaywrightDriver tests - 38 passing tests covering initialization, navigation, screenshots, cookies, network monitoring, error handling, viewport options, real-world scenarios"
      },
      {
        "id": "test-shared-screenshot",
        "number": 51,
        "name": "Tests: ScreenshotCapture (PM-4)",
        "category": "Testing",
        "phase": "Phase 0",
        "shippedDate": "2025-10-22",
        "value": "Complete ScreenshotCapture test suite - 26 passing tests covering multi-viewport capture, scroll sequences, screenshot comparison, file operations, browser lifecycle, and error handling"
      },
      {
        "id": "test-shared-network",
        "number": 52,
        "name": "Tests: NetworkMonitor (PM-5)",
        "category": "Testing",
        "phase": "Phase 0",
        "shippedDate": "2025-10-22",
        "value": "Comprehensive NetworkMonitor tests - 33 passing tests covering network monitoring, API pattern discovery, endpoint filtering, data export (JSON/Markdown), body capture, URL filtering, and summary generation"
      },
      {
        "id": "test-shared-extractors",
        "number": 53,
        "name": "Tests: Feature Extractors Suite (PM-6)",
        "category": "Testing",
        "phase": "Phase 0",
        "shippedDate": "2025-10-22",
        "value": "Complete Feature Extractors test suite - 32 passing tests for FeatureExtractor, FunctionalityChecker, and VisualAnalyzer covering UI/API/visual extraction, functionality verification, element analysis, and error handling"
      },
      {
        "id": "test-planner-code-discovery",
        "number": 54,
        "name": "Tests: Code-Based Feature Discovery (PM-7)",
        "category": "Testing",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Comprehensive CodeDiscovery test suite - 21 passing tests covering React routes, Express endpoints, component analysis, config parsing, glob patterns, comment extraction, confidence scoring, and error handling"
      },
      {
        "id": "test-planner-roadmap-export",
        "number": 56,
        "name": "Tests: Roadmap Export (PM-9)",
        "category": "Testing",
        "phase": "Phase 1",
        "shippedDate": "2025-10-22",
        "value": "Complete RoadmapExporter test suite - 48 passing tests covering Markdown/HTML/JSON export, grouping by phase/category/priority/status, progress bars, dependency chains, formatting consistency, and edge cases"
      }
    ],
    "inProgress": [],
    "nextUp": [],
    "backlog": [
      {
        "id": "analyzer-completion-detection",
        "number": 32,
        "name": "Analyzer - Completion Detection Enhancement",
        "category": "Analyzer",
        "phase": "Phase 2",
        "dependencies": ["analyzer-v15"],
        "value": "Enhanced TODO completion analysis - git commit correlation, 95%+ confidence scoring, archived file detection, bulk cleanup suggestions"
      },
      {
        "id": "analyzer-spec-parsing",
        "number": 33,
        "name": "Analyzer - Specification Document Parsing",
        "category": "Analyzer",
        "phase": "Phase 2",
        "dependencies": ["analyzer-v15"],
        "value": "Parse markdown specifications and planning docs - extract requirements, map to implemented features, calculate implementation percentages"
      },
      {
        "id": "analyzer-gap-analysis",
        "number": 34,
        "name": "Analyzer - Implementation Gap Analysis",
        "category": "Analyzer",
        "phase": "Phase 2",
        "dependencies": ["analyzer-spec-parsing"],
        "value": "Identify gaps between planned and implemented features - confidence-based feature detection, spec vs code mapping, gap reports"
      },
      {
        "id": "manager-issue-updates",
        "number": 35,
        "name": "Manager - Update Existing Issues",
        "category": "Manager",
        "phase": "Phase 3",
        "dependencies": ["manager-v10"],
        "value": "Update GitHub issues when TODOs change - detect modifications, update descriptions, add comments, close when completed"
      },
      {
        "id": "manager-issue-linking",
        "number": 36,
        "name": "Manager - Automatic Issue Linking",
        "category": "Manager",
        "phase": "Phase 3",
        "dependencies": ["manager-v10"],
        "value": "Link related issues automatically - detect dependencies in TODO comments, create parent/child relationships, cross-reference similar issues"
      },
      {
        "id": "manager-doc-reorganization",
        "number": 37,
        "name": "Manager - Documentation Auto-Reorganization",
        "category": "Manager",
        "phase": "Phase 3",
        "dependencies": ["manager-v10"],
        "value": "Automatically reorganize planning documents - archive by date, organize by status, maintain documentation index, detect stale docs"
      },
      {
        "id": "planner-feature-validation",
        "number": 38,
        "name": "Planner - Advanced Feature Validation",
        "category": "Planner",
        "phase": "Phase 1",
        "dependencies": ["planner-registry"],
        "value": "Validate feature definitions - check dependencies exist, detect circular dependencies, validate implementation estimates, consistency checks"
      },
      {
        "id": "planner-import-export",
        "number": 39,
        "name": "Planner - Import/Export Enhancements",
        "category": "Planner",
        "phase": "Phase 1",
        "dependencies": ["planner-registry"],
        "value": "Enhanced import/export - GitHub Projects import, Jira CSV import, custom field mapping, batch operations, undo/redo support"
      },
      {
        "id": "shared-visual-analyzer",
        "number": 40,
        "name": "Shared Library - Enhanced Visual Analyzer",
        "category": "Shared Library",
        "phase": "Phase 0",
        "dependencies": ["shared-extractors"],
        "value": "AI-powered visual analysis improvements - OCR for text extraction, UI component classification, color scheme analysis, responsive design validation"
      },
      {
        "id": "shared-auth-handler",
        "number": 41,
        "name": "Shared Library - Authentication Handler",
        "category": "Shared Library",
        "phase": "Phase 0",
        "dependencies": ["shared-playwright"],
        "value": "Handle authentication for protected pages - cookie persistence, OAuth flow support, session management, multi-tenant support"
      },
      {
        "id": "shared-rate-limiter",
        "number": 42,
        "name": "Shared Library - Smart Rate Limiter",
        "category": "Shared Library",
        "phase": "Phase 0",
        "dependencies": ["shared-webfetcher"],
        "value": "Intelligent rate limiting - adaptive throttling, API quota management, retry with exponential backoff, respect robots.txt"
      },
      {
        "id": "dashboard-burndown-charts",
        "number": 43,
        "name": "Dashboard - Burndown Charts & Metrics",
        "category": "Dashboard",
        "phase": "Phase 3",
        "dependencies": ["dashboard-live"],
        "value": "Visual progress tracking - burndown/burnup charts, velocity calculations, completion trends, estimated completion dates, exportable metrics"
      },
      {
        "id": "dashboard-tech-debt-tracker",
        "number": 44,
        "name": "Dashboard - Technical Debt Tracker",
        "category": "Dashboard",
        "phase": "Phase 3",
        "dependencies": ["dashboard-live"],
        "value": "Track and visualize technical debt - categorize HACKs/FIXMEs, debt severity scoring, refactoring priorities, debt trend analysis"
      },
      {
        "id": "dashboard-sprint-planning",
        "number": 45,
        "name": "Dashboard - Sprint Planning Assistant",
        "category": "Dashboard",
        "phase": "Phase 3",
        "dependencies": ["dashboard-live", "dashboard-drag-drop"],
        "value": "Automated sprint planning - capacity planning, feature point estimation, dependency-aware scheduling, sprint commitment tracking"
      },
      {
        "id": "integration-ci-cd",
        "number": 46,
        "name": "Integration - CI/CD Pipeline Integration",
        "category": "Integration",
        "phase": "Integration",
        "dependencies": ["integration-workflow"],
        "value": "Integrate with CI/CD pipelines - GitHub Actions workflows, pre-commit hooks, automated PR checks, deployment verification triggers"
      },
      {
        "id": "integration-notifications",
        "number": 47,
        "name": "Integration - Slack/Discord Notifications",
        "category": "Integration",
        "phase": "Integration",
        "dependencies": ["integration-workflow"],
        "value": "Real-time notifications - Slack/Discord webhooks, digest summaries, @mention integration, custom notification rules"
      },
      {
        "id": "integration-multi-repo",
        "number": 48,
        "name": "Integration - Multi-Repository Coordination",
        "category": "Integration",
        "phase": "Integration",
        "dependencies": ["integration-workflow"],
        "value": "Coordinate across multiple repositories - cross-repo dependency tracking, shared component analysis, monorepo support, dependency graphs"
      },
      {
        "id": "test-planner-web-discovery",
        "number": 55,
        "name": "Tests: Web-Based Feature Discovery (PM-8)",
        "category": "Testing",
        "phase": "Phase 1",
        "priority": "P1",
        "dependencies": ["test-jest-config", "planner-web-discovery"],
        "value": "Tests for WebDiscovery - live website analysis, navigation extraction, AI-powered feature detection (target: 15+ tests) - SKIPPED: WebDiscovery needs rewrite"
      },
      {
        "id": "test-analyzer-verification",
        "number": 57,
        "name": "Tests: Production Verification (PM-10)",
        "category": "Testing",
        "phase": "Phase 2",
        "priority": "P1",
        "dependencies": ["test-jest-config", "analyzer-verification"],
        "value": "Tests for ProductionVerifier - 3-tier verification (URL/functionality/API), staging comparison, test coverage (target: 25+ tests)"
      },
      {
        "id": "test-analyzer-deployment",
        "number": 58,
        "name": "Tests: Deployment Verification Workflow (PM-11)",
        "category": "Testing",
        "phase": "Phase 2",
        "priority": "P1",
        "dependencies": ["test-jest-config", "analyzer-deployment-verify"],
        "value": "Tests for DeploymentWorkflow - staging vs production comparison, risk analysis, readiness checks (target: 15+ tests)"
      },
      {
        "id": "test-manager-screenshots",
        "number": 59,
        "name": "Tests: Screenshot Documentation (PM-12)",
        "category": "Testing",
        "phase": "Phase 3",
        "priority": "P2",
        "dependencies": ["test-jest-config", "manager-screenshots"],
        "value": "Tests for screenshot documentation - code snippet capture, UI element screenshots, GitHub upload (target: 10+ tests)"
      },
      {
        "id": "test-manager-multi-viewport",
        "number": 60,
        "name": "Tests: Multi-Viewport Screenshot Capture (PM-13)",
        "category": "Testing",
        "phase": "Phase 3",
        "priority": "P2",
        "dependencies": ["test-jest-config", "manager-multi-viewport"],
        "value": "Tests for multi-viewport screenshots - mobile/tablet/desktop capture, comparison tables (target: 8+ tests)"
      },
      {
        "id": "test-manager-visual-comparison",
        "number": 61,
        "name": "Tests: Before/After Visual Comparison (PM-14)",
        "category": "Testing",
        "phase": "Phase 3",
        "priority": "P2",
        "dependencies": ["test-jest-config", "manager-visual-comparison"],
        "value": "Tests for visual comparison - diff calculation, regression detection, side-by-side comparison (target: 10+ tests)"
      },
      {
        "id": "test-manager-ui-scan",
        "number": 62,
        "name": "Tests: Automated UI Bug Detection (PM-15)",
        "category": "Testing",
        "phase": "Phase 3",
        "priority": "P2",
        "dependencies": ["test-jest-config", "manager-ui-scan"],
        "value": "Tests for UI scanning - accessibility checks, layout validation, broken image detection (target: 12+ tests)"
      },
      {
        "id": "test-integration-workflow",
        "number": 63,
        "name": "Tests: Complete Integration Workflow (PM-16)",
        "category": "Testing",
        "phase": "Integration",
        "priority": "P1",
        "dependencies": ["test-jest-config", "integration-workflow"],
        "value": "Integration tests for end-to-end workflow - discovery → verification → issue creation (target: 15+ tests)"
      },
      {
        "id": "test-dashboard-components",
        "number": 64,
        "name": "Tests: Dashboard Lit Components (PM-17-31)",
        "category": "Testing",
        "phase": "Phase 1",
        "priority": "P2",
        "dependencies": ["test-jest-config"],
        "value": "Component tests for pm-roadmap, pm-feature-card, pm-action-queue, pm-skill-output - render tests, interaction tests, state management (target: 30+ tests)"
      },
      {
        "id": "test-analyzer-completion",
        "number": 65,
        "name": "Tests: Completion Detection (Analyzer v1.5)",
        "category": "Testing",
        "phase": "Phase 2",
        "priority": "P1",
        "dependencies": ["test-jest-config", "analyzer-v15"],
        "value": "Tests for completion detection - git commit correlation, confidence scoring, archived file detection (target: 15+ tests)"
      },
      {
        "id": "test-manager-state",
        "number": 66,
        "name": "Tests: Manager State Tracker & Label Manager",
        "category": "Testing",
        "phase": "Phase 3",
        "priority": "P1",
        "dependencies": ["test-jest-config", "manager-v10"],
        "value": "Fix and enhance existing tests - stateTracker.test.ts, labelManager.test.ts, issueCreator.test.ts currently failing (target: all passing + 10 new)"
      },
      {
        "id": "test-e2e-suite",
        "number": 67,
        "name": "End-to-End Test Suite",
        "category": "Testing",
        "phase": "Integration",
        "priority": "P2",
        "dependencies": ["test-jest-config"],
        "value": "E2E tests using Playwright - full workflows from dashboard → skill execution → GitHub issue creation (target: 10+ scenarios)"
      },
      {
        "id": "test-coverage-reporting",
        "number": 68,
        "name": "Test Coverage Reporting & CI Integration",
        "category": "Testing",
        "phase": "Integration",
        "priority": "P2",
        "dependencies": ["test-jest-config"],
        "value": "Set up code coverage reporting with Istanbul/NYC, integrate with CI/CD, enforce minimum coverage thresholds (target: 80%+ coverage)"
      }
    ]
  }
};

// Auto-calculate stats
productRoadmap.stats = {
  shipped: productRoadmap.features.shipped.length,
  inProgress: productRoadmap.features.inProgress.length,
  nextUp: productRoadmap.features.nextUp.length,
  backlog: productRoadmap.features.backlog.length,
  total: productRoadmap.features.shipped.length +
         productRoadmap.features.inProgress.length +
         productRoadmap.features.nextUp.length +
         productRoadmap.features.backlog.length
};
