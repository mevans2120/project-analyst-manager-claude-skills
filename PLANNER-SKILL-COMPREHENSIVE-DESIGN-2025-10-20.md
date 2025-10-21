# Project Planner Skill - Comprehensive Design Document

**Version:** 1.0
**Date:** 2025-10-20
**Status:** Design Phase
**Author:** Claude Code Strategy & Planning Team

---

## Executive Summary

The **Project Planner** is the third and foundational skill in the project management suite. It fills a critical gap by enabling the entire toolchain to work with both **blue sky projects** (new, from scratch) and **existing codebases** (reverse-engineered features). This skill creates the "source of truth" feature list that informs what the Analyzer should look for and what the Manager should track.

### Key Capabilities
- **Product Understanding**: Extract/generate elevator pitch and product goals
- **Feature Discovery**: Identify features from existing code OR define new features from scratch
- **Feature Catalog**: Maintain structured CSV feature registry with status tracking
- **Bidirectional Workflow**: Support both forward (planning to code) and reverse (code to planning) workflows

### Strategic Value
Currently, the suite is limited to **reactive** management (finding TODOs in existing code). Project Planner enables **proactive** management by establishing what features SHOULD exist, enabling gap analysis, implementation tracking, and true project planning.

---

## Table of Contents

1. [Problem Statement & Motivation](#problem-statement--motivation)
2. [Research Findings](#research-findings)
3. [Technical Approach](#technical-approach)
4. [CSV Schema & Data Structure](#csv-schema--data-structure)
5. [Feature Discovery Methodology](#feature-discovery-methodology)
6. [Integration Architecture](#integration-architecture)
7. [Implementation Roadmap](#implementation-roadmap)
8. [Example Workflows](#example-workflows)
9. [Risk Assessment & Mitigation](#risk-assessment--mitigation)

---

## Problem Statement & Motivation

### Current Limitations

The existing skills operate in a **reactive mode only**:
- **Analyzer**: "What TODOs exist in the code?"
- **Manager**: "Create issues for those TODOs"

They cannot answer:
- "What features SHOULD this product have?"
- "Is feature X implemented yet?"
- "What's the gap between planned and actual implementation?"
- "What are our product priorities?"

### The Missing Link

For **blue sky projects**, there is no TODO yet—the planning happens BEFORE code exists. The toolchain needs:

1. A way to capture product vision and feature specifications
2. A structured registry of planned features
3. The ability to track "planned" vs "implemented" status
4. Integration with Analyzer (to detect implementations) and Manager (to create planning issues)

### Success Criteria

Project Planner succeeds when:
- ✅ Teams can define a product roadmap BEFORE writing code
- ✅ Analyzer can check if planned features are implemented
- ✅ Manager can create tracking issues for unimplemented features
- ✅ Existing projects can be reverse-engineered into a feature catalog
- ✅ The CSV feature registry becomes the single source of truth

---

## Research Findings

### 1. Reverse Engineering Best Practices (2024)

Based on research into modern reverse engineering methodologies:

**Key Techniques:**
- **Static Analysis**: Examine code structure, patterns, and architecture without execution
- **Dynamic Analysis**: Observe runtime behavior (less applicable for feature extraction)
- **Business Rule Extraction**: Identify domain logic, workflows, and decision points
- **Architectural Analysis**: Map component dependencies, data flows, and system boundaries

**Applied to Feature Discovery:**
- Analyze route handlers (web apps) to identify user-facing features
- Parse component hierarchies (React, Vue) to understand UI capabilities
- Examine database schemas to infer data-driven features
- Review API endpoints to map external integrations
- Scan configuration files for feature flags and toggles

### 2. Feature Tracking Schema Patterns (2024)

Research into product roadmap templates revealed common patterns:

**Essential Attributes:**
- Feature name/title (user-facing description)
- Status (planned, in-progress, implemented, deprecated)
- Priority (P0/critical, P1/high, P2/medium, P3/low)
- Timeline/Quarter (Q1 2025, Q2 2025, etc.)
- Owner/Team assignment
- Parent/child relationships (epics → features → tasks)
- Implementation metadata (files, PRs, commits)

**CSV Schema Best Practices:**
- Use consistent enum values for status and priority
- Include both human-readable names and machine IDs
- Support hierarchical relationships via parent_id
- Track confidence scores for auto-detected features
- Maintain audit trail (created_at, updated_at, detected_by)

### 3. Product Documentation Analysis

**Elevator Pitch Generation:**
While no tools exist that auto-generate elevator pitches from code, we can:
- Extract README.md description sections
- Parse package.json "description" fields
- Analyze landing page copy (index.html, marketing pages)
- Infer from project naming and domain
- Use AI assistance to synthesize findings into concise pitch

**Product Goals & KPIs:**
- Extract from planning documents (docs/, memory-bank/)
- Parse OKR documents and roadmaps
- Identify metrics tracking code (analytics, monitoring)
- Infer from business logic (e-commerce → sales, SaaS → subscriptions)

---

## Technical Approach

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    PROJECT PLANNER                           │
│                                                              │
│  ┌────────────────┐      ┌──────────────────┐              │
│  │  Discovery     │      │  Planning        │              │
│  │  Engine        │      │  Engine          │              │
│  │  (Reverse Eng) │      │  (Blue Sky)      │              │
│  └────────────────┘      └──────────────────┘              │
│           │                       │                         │
│           └───────────┬───────────┘                         │
│                       ▼                                     │
│              ┌─────────────────┐                            │
│              │  Feature        │                            │
│              │  Registry       │                            │
│              │  (CSV Master)   │                            │
│              └─────────────────┘                            │
│                       │                                     │
│         ┌─────────────┼─────────────┐                       │
│         ▼             ▼             ▼                       │
│    Analyzer      Manager      Reports/Export               │
└─────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. Discovery Engine (Reverse Engineering Mode)

**Purpose**: Extract features from existing codebase

**Methodology**:
```typescript
interface FeatureSignal {
  type: 'route' | 'component' | 'api' | 'database' | 'config';
  file: string;
  name: string;
  confidence: number; // 0-100
  metadata: Record<string, any>;
}

class DiscoveryEngine {
  // Scan for feature signals
  async scanCodebase(rootPath: string): Promise<FeatureSignal[]>;

  // Cluster signals into features
  clusterSignals(signals: FeatureSignal[]): Feature[];

  // Generate human-readable descriptions
  describeFeature(feature: Feature): string;
}
```

**Detection Strategies**:

1. **Web Application Features**:
   - Route patterns: `app.get('/users/:id', ...)` → "User profile viewing"
   - React components: `<UserDashboard />` → "User dashboard"
   - API endpoints: `POST /api/orders` → "Order creation"

2. **Backend Features**:
   - Database models: `class Order extends Model` → "Order management"
   - Service classes: `PaymentService.processCharge()` → "Payment processing"
   - Queue jobs: `EmailNotificationJob` → "Email notifications"

3. **Infrastructure Features**:
   - Config flags: `ENABLE_DARK_MODE=true` → "Dark mode theme"
   - Environment vars: `STRIPE_API_KEY` → "Stripe payment integration"
   - Docker services: `redis`, `postgres` → "Caching", "Database"

4. **Documentation-Based Features**:
   - README sections: "## Authentication" → "User authentication"
   - Changelog entries: "Added export to CSV" → "CSV export"
   - Test descriptions: `describe('Shopping cart', ...)` → "Shopping cart"

**Confidence Scoring**:
- **High (80-100%)**: Multiple signals in multiple files + documentation
- **Medium (50-79%)**: Code signals + naming consistency
- **Low (20-49%)**: Single signal or ambiguous naming
- **Very Low (<20%)**: Filtered out as noise

#### 2. Planning Engine (Blue Sky Mode)

**Purpose**: Interactive feature definition for new projects

**Methodology**:
```typescript
interface PlanningSession {
  productVision: string;
  elevatorPitch: string;
  targetAudience: string;
  coreGoals: string[];
  features: Feature[];
}

class PlanningEngine {
  // Interactive prompts to gather product vision
  async initializeProject(): Promise<PlanningSession>;

  // AI-assisted feature brainstorming
  async generateFeatureSuggestions(vision: string): Promise<Feature[]>;

  // Create initial feature registry
  async createRegistry(session: PlanningSession): Promise<void>;
}
```

**Interactive Flow**:
1. **Vision Gathering**: Prompt for elevator pitch, goals, audience
2. **Feature Brainstorming**: Suggest common features for product type
3. **Prioritization**: Help user assign priorities (MoSCoW method)
4. **Timeline Planning**: Map features to quarters/milestones
5. **CSV Generation**: Create initial feature registry

**Templates by Project Type**:
- **SaaS Web App**: Auth, dashboard, billing, user management, etc.
- **E-commerce**: Product catalog, cart, checkout, inventory, etc.
- **Mobile App**: Onboarding, profiles, notifications, settings, etc.
- **API/Backend**: Authentication, rate limiting, webhooks, versioning, etc.

#### 3. Feature Registry (CSV Master)

**Purpose**: Single source of truth for all product features

**Implementation**: CSV file with well-defined schema (see next section)

**Operations**:
```typescript
class FeatureRegistry {
  // CRUD operations
  async addFeature(feature: Feature): Promise<void>;
  async updateFeature(id: string, updates: Partial<Feature>): Promise<void>;
  async getFeature(id: string): Promise<Feature>;
  async getAllFeatures(): Promise<Feature[]>;

  // Queries
  async getByStatus(status: FeatureStatus): Promise<Feature[]>;
  async getByPriority(priority: Priority): Promise<Feature[]>;
  async getUnimplemented(): Promise<Feature[]>;

  // Analysis
  async getImplementationStats(): Promise<ImplementationStats>;
  async detectImplementation(feature: Feature): Promise<boolean>;
}
```

**Storage Location**: `<project>/.project-planner/features.csv`

**Versioning**: Track in git to see feature evolution over time

---

## CSV Schema & Data Structure

### Schema Definition

```csv
id,name,description,status,priority,category,timeline,owner,parent_id,implementation_files,implementation_confidence,created_at,updated_at,detected_by,notes
```

### Field Specifications

| Field | Type | Required | Description | Example Values |
|-------|------|----------|-------------|----------------|
| `id` | string | Yes | Unique identifier (auto-generated) | `feature-001`, `feat-abc123` |
| `name` | string | Yes | Short feature name (3-8 words) | "User authentication", "CSV export" |
| `description` | string | Yes | Detailed description (1-3 sentences) | "Allow users to log in with email/password, support OAuth providers (Google, GitHub), include password reset flow" |
| `status` | enum | Yes | Implementation status | `planned`, `in-progress`, `implemented`, `deprecated` |
| `priority` | enum | Yes | Feature priority | `P0` (critical), `P1` (high), `P2` (medium), `P3` (low) |
| `category` | string | No | Feature category/epic | "Authentication", "Payments", "Admin" |
| `timeline` | string | No | Target quarter/date | "Q1 2025", "2025-03-15", "v2.0" |
| `owner` | string | No | Team/person responsible | "Backend Team", "@alice" |
| `parent_id` | string | No | Parent feature ID (for hierarchy) | `feature-parent-123` |
| `implementation_files` | string | No | Semicolon-separated file paths | `src/auth/login.ts;src/auth/oauth.ts` |
| `implementation_confidence` | number | No | Confidence % (0-100) | `85` (high confidence it's implemented) |
| `created_at` | ISO date | Yes | When feature was added | `2025-10-20T10:30:00Z` |
| `updated_at` | ISO date | Yes | Last modification | `2025-10-21T14:45:00Z` |
| `detected_by` | enum | Yes | How feature was added | `manual`, `auto-discovery`, `analyzer` |
| `notes` | string | No | Additional context | "Waiting on design approval" |

### Enum Values

**Status**:
- `planned`: Feature is defined but not started
- `in-progress`: Development has begun
- `implemented`: Feature is complete and deployed
- `deprecated`: Feature removed or replaced

**Priority**:
- `P0`: Critical/blocking (must have)
- `P1`: High priority (should have)
- `P2`: Medium priority (could have)
- `P3`: Low priority (won't have this iteration)

**Detected By**:
- `manual`: User manually added via CLI/interactive mode
- `auto-discovery`: Discovered by reverse engineering scan
- `analyzer`: Detected by integration with Project Analyzer
- `import`: Imported from external roadmap tool

### Example CSV

```csv
id,name,description,status,priority,category,timeline,owner,parent_id,implementation_files,implementation_confidence,created_at,updated_at,detected_by,notes
feat-001,User authentication,"Allow users to log in with email/password credentials. Support password reset via email. Include session management with JWT tokens.",implemented,P0,Authentication,Q1 2025,Backend Team,,src/auth/login.ts;src/auth/session.ts;src/auth/jwt.ts,95,2025-01-15T10:00:00Z,2025-10-20T14:30:00Z,auto-discovery,"OAuth planned for Q2"
feat-002,OAuth integration,"Support OAuth login via Google and GitHub providers. Allow account linking with existing email/password accounts.",planned,P1,Authentication,Q2 2025,Backend Team,feat-001,,,2025-10-20T14:45:00Z,2025-10-20T14:45:00Z,manual,"Blocked on legal review"
feat-003,User profile management,"Allow users to view and edit their profile information including name, email, avatar, and bio. Support avatar upload to S3.",implemented,P1,User Management,Q1 2025,Frontend Team,,src/components/UserProfile.tsx;src/api/profile.ts,88,2025-01-20T11:00:00Z,2025-10-20T14:30:00Z,auto-discovery,
feat-004,Dark mode theme,"Provide light/dark theme toggle with persistence to user preferences. Apply theme across all UI components.",in-progress,P2,UI/UX,Q1 2025,Frontend Team,,src/theme/darkMode.ts;src/components/ThemeToggle.tsx,65,2025-02-01T09:00:00Z,2025-10-20T14:30:00Z,auto-discovery,"70% of components styled"
feat-005,Payment processing,"Integrate Stripe for credit card payments. Support subscription billing and one-time purchases. Include webhook handling for payment events.",planned,P0,Payments,Q2 2025,Backend Team,,,0,2025-10-20T15:00:00Z,2025-10-20T15:00:00Z,manual,"Critical for revenue launch"
feat-006,CSV data export,"Allow users to export their data to CSV format. Support filtering by date range and data type. Stream large exports to avoid memory issues.",planned,P3,Data Export,Q3 2025,Backend Team,,,0,2025-10-20T15:05:00Z,2025-10-20T15:05:00Z,manual,
feat-007,Admin dashboard,"Provide admin-only dashboard for managing users, viewing analytics, and performing bulk operations. Include role-based access control.",implemented,P1,Admin,Q1 2025,Full Stack Team,,src/admin/Dashboard.tsx;src/api/admin.ts;src/middleware/rbac.ts,92,2025-01-10T08:00:00Z,2025-10-20T14:30:00Z,auto-discovery,
```

### CSV Best Practices

1. **Escaping**: Use double quotes for descriptions with commas: `"Feature A, B, and C"`
2. **Line Breaks**: Avoid line breaks in descriptions; use semicolons for lists
3. **File Paths**: Use forward slashes, semicolon-separated: `path/one.ts;path/two.ts`
4. **Dates**: Always ISO 8601 format: `2025-10-20T14:30:00Z`
5. **Empty Fields**: Leave blank (no null/undefined strings)

---

## Feature Discovery Methodology

### How to Identify Features from Code

**Definition of a "Feature"**: A discrete, user-facing capability that provides value. Features answer "What can the user DO?" not "How is it built?"

#### Detection Signals by Framework

##### React/Vue/Angular (Frontend)

**Signal 1: Route Definitions**
```typescript
// React Router example
<Route path="/dashboard" component={Dashboard} />
<Route path="/profile/:id" component={UserProfile} />
<Route path="/settings" component={Settings} />

// Inferred features:
// - "Dashboard view" (implemented, src/pages/Dashboard.tsx)
// - "User profile viewing" (implemented, src/pages/UserProfile.tsx)
// - "Settings management" (implemented, src/pages/Settings.tsx)
```

**Signal 2: Major Components**
```typescript
// Components that represent features
<ShoppingCart />       → "Shopping cart"
<CheckoutFlow />       → "Checkout process"
<PaymentForm />        → "Payment processing"
<NotificationCenter /> → "Notification system"
```

**Signal 3: Feature Flags**
```typescript
if (featureFlags.darkMode) {
  // Inferred: "Dark mode theme" (status: in-progress or implemented)
}
```

##### Express/FastAPI/Django (Backend)

**Signal 1: API Endpoints**
```typescript
// Express example
app.post('/api/auth/login', ...)    → "User authentication"
app.get('/api/users/:id', ...)      → "User profile retrieval"
app.post('/api/orders', ...)        → "Order creation"
app.get('/api/analytics', ...)      → "Analytics dashboard"
```

**Signal 2: Service Classes**
```typescript
class PaymentService {
  processPayment() { ... }    → "Payment processing"
  refundOrder() { ... }       → "Refund management"
}

class EmailService {
  sendWelcomeEmail() { ... }  → "Welcome email notifications"
  sendInvoice() { ... }       → "Invoice email delivery"
}
```

**Signal 3: Database Models**
```typescript
// Sequelize/TypeORM example
class Order extends Model { ... }      → "Order management"
class Subscription extends Model { ... } → "Subscription management"
class Review extends Model { ... }      → "User reviews"
```

##### Configuration Files

**Signal 1: Environment Variables**
```bash
STRIPE_API_KEY=...        → "Stripe payment integration"
AWS_S3_BUCKET=...         → "S3 file storage"
SENDGRID_API_KEY=...      → "SendGrid email service"
GOOGLE_OAUTH_CLIENT_ID=...→ "Google OAuth login"
```

**Signal 2: Feature Flags**
```json
{
  "features": {
    "darkMode": true,         → "Dark mode theme" (implemented)
    "exportCSV": false,       → "CSV export" (planned or disabled)
    "twoFactorAuth": true     → "Two-factor authentication" (implemented)
  }
}
```

##### Documentation Files

**Signal 1: README Sections**
```markdown
## Features
- User authentication with JWT
- Real-time notifications via WebSockets
- CSV data export
- Dark mode theme

// Each becomes a feature with status: implemented or planned
```

**Signal 2: Changelog**
```markdown
### v2.1.0
- Added CSV export functionality
- Improved dark mode support

// Inferred: "CSV export" and "Dark mode theme" are implemented
```

**Signal 3: Test Descriptions**
```typescript
describe('Shopping Cart', () => {
  it('adds items to cart', ...)
  it('calculates total with tax', ...)
})

// Inferred: "Shopping cart" feature exists (high confidence: 85%)
```

#### Clustering Algorithm

**Problem**: Raw signals are too granular (e.g., "login", "logout", "password reset" are all "authentication")

**Solution**: Cluster related signals into higher-level features

```typescript
interface FeatureCluster {
  primaryName: string;
  signals: FeatureSignal[];
  confidence: number;
  files: string[];
}

function clusterSignals(signals: FeatureSignal[]): FeatureCluster[] {
  // 1. Group by semantic similarity (NLP or keyword matching)
  //    - "login", "logout", "session" → "Authentication"
  //    - "cart", "checkout", "payment" → "E-commerce checkout flow"

  // 2. Calculate cluster confidence
  //    - More signals = higher confidence
  //    - Documentation mention = +20% confidence
  //    - Test coverage = +15% confidence

  // 3. Generate human-readable description
  //    - Extract common verbs/nouns
  //    - Use AI to synthesize concise description

  return clusters;
}
```

**Example Clustering**:
```
Raw signals:
- src/auth/login.ts (route: /login)
- src/auth/logout.ts (route: /logout)
- src/auth/session.ts (class: SessionManager)
- src/auth/jwt.ts (utility: generateToken)
- tests/auth.test.ts (describe: 'Authentication')

Clustered feature:
{
  id: "feat-001",
  name: "User authentication",
  description: "Allow users to log in and out using email/password credentials. Manage user sessions with JWT tokens. Support password reset via email.",
  status: "implemented",
  priority: "P0",
  category: "Authentication",
  implementation_files: "src/auth/login.ts;src/auth/logout.ts;src/auth/session.ts;src/auth/jwt.ts",
  implementation_confidence: 95,
  detected_by: "auto-discovery"
}
```

#### Verbosity Guidelines

**Question**: How verbose should feature descriptions be?

**Answer**: **Moderately verbose** (1-3 sentences, 20-60 words)

**Examples**:

❌ **Too Vague**: "User auth"

❌ **Too Technical**: "Implement JWT-based stateless authentication with RS256 signing, refresh token rotation, and Redis session store with 15-minute TTL"

✅ **Just Right**: "Allow users to log in with email/password credentials. Support password reset via email. Include session management with JWT tokens."

**Guidelines**:
- **First sentence**: What the user can DO (user-facing capability)
- **Second sentence**: Key details or variations (e.g., "Support OAuth providers")
- **Third sentence**: Technical context if needed (e.g., "Uses JWT for session management")
- **Audience**: Product manager or non-technical stakeholder
- **Test**: Would a PM understand this without reading code?

---

## Integration Architecture

### Integration with Project Analyzer

**Flow 1: Feature Implementation Detection**

```
1. Project Planner creates feature registry (features.csv)
2. Project Analyzer scans codebase for TODOs
3. Analyzer cross-references TODOs with feature registry
4. Analyzer updates feature.status if implementation detected
5. Report shows: "Feature X: 80% implemented (4/5 TODOs complete)"
```

**Implementation**:
```typescript
// Analyzer enhancement
class FeatureDetector {
  async detectFeatureImplementation(
    feature: Feature,
    codebase: string
  ): Promise<ImplementationStatus> {
    // Check if files mentioned in feature exist
    const filesExist = await this.checkFiles(feature.implementation_files);

    // Scan for relevant code patterns
    const patterns = this.generatePatternsForFeature(feature);
    const matches = await this.scanForPatterns(codebase, patterns);

    // Check for related TODOs (absence = likely implemented)
    const relatedTodos = await this.findRelatedTodos(feature);

    // Calculate confidence score
    const confidence = this.calculateConfidence(filesExist, matches, relatedTodos);

    return {
      implemented: confidence > 70,
      confidence,
      evidence: { filesExist, matches, relatedTodos }
    };
  }
}
```

**Example**:
```bash
# User workflow
$ planner create-registry ~/my-app  # Creates features.csv from code
$ analyzer scan ~/my-app --check-features  # Detects which features are implemented
$ manager create-issues --from-unimplemented  # Creates issues for planned-but-missing features
```

### Integration with Project Manager

**Flow 2: Issue Creation from Feature Gaps**

```
1. Project Planner identifies unimplemented features (status: planned)
2. Project Manager creates GitHub issues for each gap
3. Issues are labeled: "feature-request", "planned", "priority-P0", etc.
4. When feature is implemented, close issues and update registry
```

**Implementation**:
```typescript
// Manager enhancement
class FeatureIssueCreator {
  async createIssuesForPlannedFeatures(
    registry: FeatureRegistry,
    githubConfig: GithubConfig
  ): Promise<IssueCreationResult> {
    const unimplemented = await registry.getByStatus('planned');

    const issues = unimplemented.map(feature => ({
      title: `[Feature] ${feature.name}`,
      body: this.formatFeatureIssue(feature),
      labels: this.determineLabels(feature),
      milestone: this.findMilestone(feature.timeline)
    }));

    return await this.createIssues(issues);
  }

  private formatFeatureIssue(feature: Feature): string {
    return `
## Feature Description
${feature.description}

## Priority
${feature.priority}

## Timeline
${feature.timeline}

## Category
${feature.category}

## Acceptance Criteria
- [ ] Core functionality implemented
- [ ] Unit tests written
- [ ] Documentation updated
- [ ] Code review approved

**Source**: Project Planner (${feature.detected_by})
**Created**: ${feature.created_at}
`;
  }
}
```

### Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                      USER WORKFLOWS                              │
└─────────────────────────────────────────────────────────────────┘
                                │
                    ┌───────────┴────────────┐
                    ▼                        ▼
          ┌──────────────────┐     ┌──────────────────┐
          │  Blue Sky Mode   │     │  Existing Code   │
          │  (New Project)   │     │  (Reverse Eng)   │
          └──────────────────┘     └──────────────────┘
                    │                        │
                    ▼                        ▼
          ┌──────────────────────────────────────────┐
          │       PROJECT PLANNER                     │
          │  - Interactive planning                   │
          │  - Feature discovery                      │
          │  - Registry creation                      │
          └──────────────────────────────────────────┘
                    │
                    ▼
          ┌──────────────────────────────────────────┐
          │     .project-planner/features.csv         │
          │     (Single Source of Truth)              │
          └──────────────────────────────────────────┘
                    │
          ┌─────────┴──────────┬───────────────────┐
          ▼                    ▼                   ▼
┌────────────────────┐ ┌──────────────────┐ ┌──────────────────┐
│ PROJECT ANALYZER   │ │ PROJECT MANAGER  │ │ REPORTS/EXPORT   │
│ - Detect impl.     │ │ - Create issues  │ │ - Gap analysis   │
│ - Update status    │ │ - Track progress │ │ - Roadmap view   │
│ - Find TODOs       │ │ - Label mgmt     │ │ - Status summary │
└────────────────────┘ └──────────────────┘ └──────────────────┘
```

### State Management

**New State File**: `.project-planner/state.json`

```json
{
  "lastUpdated": "2025-10-20T14:30:00Z",
  "registryPath": ".project-planner/features.csv",
  "projectMetadata": {
    "elevatorPitch": "A project management tool that helps teams track TODOs and features",
    "productGoals": [
      "Reduce planning overhead by 50%",
      "Increase feature delivery predictability",
      "Enable data-driven roadmap decisions"
    ],
    "targetAudience": "Software development teams using GitHub",
    "projectType": "SaaS Web App"
  },
  "discoveryMetadata": {
    "lastScan": "2025-10-20T14:30:00Z",
    "filesScanned": 1247,
    "featuresDiscovered": 23,
    "averageConfidence": 78
  },
  "integration": {
    "analyzerEnabled": true,
    "managerEnabled": true,
    "lastAnalyzerSync": "2025-10-20T14:30:00Z",
    "lastManagerSync": "2025-10-19T10:00:00Z"
  }
}
```

**Integration with Existing State**:
- Analyzer: `.project-analyzer/state.json` (keeps existing structure)
- Manager: `.project-state.json` (keeps existing structure)
- Planner: `.project-planner/state.json` (new, links to others)

**Cross-Skill Communication**:
```typescript
interface CrossSkillState {
  // Planner → Analyzer
  featureRegistry: string; // Path to features.csv

  // Analyzer → Planner
  implementationUpdates: {
    featureId: string;
    newStatus: FeatureStatus;
    confidence: number;
  }[];

  // Planner → Manager
  unimplementedFeatures: Feature[];

  // Manager → Planner
  createdIssues: {
    featureId: string;
    issueNumber: number;
    issueUrl: string;
  }[];
}
```

---

## Implementation Roadmap

### Phase 1: Core Functionality (MVP)

**Estimated Time**: 2-3 weeks
**Goal**: Basic feature registry with manual entry and auto-discovery

**Deliverables**:
1. ✅ CSV schema definition and validation
2. ✅ CLI for manual feature entry
3. ✅ Basic auto-discovery for React/Express apps
4. ✅ Simple clustering algorithm (keyword-based)
5. ✅ Feature registry CRUD operations
6. ✅ Export to markdown roadmap view

**Success Criteria**:
- User can create feature registry for new project
- User can scan existing codebase and get ~70% accuracy
- CSV is human-readable and git-friendly

**Tech Stack**:
- TypeScript/Node.js (consistent with existing skills)
- `commander` for CLI (already used)
- `papaparse` for CSV parsing
- `glob` + `ignore` for file traversal (already used)

**File Structure**:
```
project-planner/
├── src/
│   ├── core/
│   │   ├── registry.ts          # Feature registry operations
│   │   ├── discovery.ts         # Auto-discovery engine
│   │   ├── clustering.ts        # Signal clustering
│   │   └── planning.ts          # Interactive planning mode
│   ├── detectors/
│   │   ├── react.ts             # React-specific detection
│   │   ├── express.ts           # Express-specific detection
│   │   ├── config.ts            # Config file detection
│   │   └── documentation.ts     # README/changelog parsing
│   ├── formatters/
│   │   ├── csv.ts               # CSV export/import
│   │   ├── markdown.ts          # Roadmap markdown
│   │   └── json.ts              # JSON export
│   ├── utils/
│   │   ├── fileAnalysis.ts      # AST parsing helpers
│   │   ├── nlp.ts               # Simple NLP (keyword extraction)
│   │   └── confidence.ts        # Confidence scoring
│   ├── types/
│   │   └── index.ts             # Type definitions
│   ├── cli.ts                   # CLI entry point
│   └── index.ts                 # Programmatic API
├── tests/
│   ├── discovery.test.ts
│   ├── clustering.test.ts
│   ├── registry.test.ts
│   └── fixtures/                # Sample codebases for testing
├── templates/
│   ├── saas-app.csv             # Pre-filled feature templates
│   ├── ecommerce.csv
│   └── api-backend.csv
├── package.json
├── tsconfig.json
└── README.md
```

### Phase 2: Integration & Intelligence

**Estimated Time**: 2-3 weeks
**Goal**: Integrate with Analyzer and Manager, improve detection accuracy

**Deliverables**:
1. ✅ Analyzer integration (feature implementation detection)
2. ✅ Manager integration (issue creation from gaps)
3. ✅ Improved clustering with AI assistance
4. ✅ Multi-framework support (Vue, Angular, Django, FastAPI)
5. ✅ Gap analysis reports
6. ✅ Feature hierarchy (epics → features → tasks)

**Success Criteria**:
- Auto-discovery accuracy reaches 85%+
- Analyzer can update feature status automatically
- Manager creates well-formatted feature issues
- Gap analysis shows what's missing

**New Components**:
```typescript
// Analyzer enhancement
interface FeatureImplementationDetector {
  checkImplementation(feature: Feature, codebase: string): Promise<ImplementationStatus>;
  updateRegistry(results: ImplementationStatus[]): Promise<void>;
}

// Manager enhancement
interface FeatureIssueManager {
  createIssuesForGaps(registry: FeatureRegistry): Promise<IssueCreationResult>;
  linkIssuesToFeatures(issues: GitHubIssue[], features: Feature[]): Promise<void>;
}

// Gap analysis
interface GapAnalyzer {
  compareFeatures(planned: Feature[], implemented: Feature[]): GapReport;
  generatePriorityMatrix(): PriorityMatrix;
  suggestNextActions(): Recommendation[];
}
```

### Phase 3: Advanced Features

**Estimated Time**: 3-4 weeks
**Goal**: Polish, automation, and advanced analytics

**Deliverables**:
1. ✅ AI-powered elevator pitch generation
2. ✅ Automatic KPI extraction from analytics code
3. ✅ Interactive roadmap dashboard (HTML export)
4. ✅ Import from external tools (Jira, Linear, Asana)
5. ✅ Automated status sync (CI/CD integration)
6. ✅ Historical trend analysis (feature velocity)

**Success Criteria**:
- Can generate elevator pitch from README + code analysis
- Roadmap dashboard is shareable with stakeholders
- Feature status updates automatically on deploy
- Trend analysis shows velocity and completion rates

**Advanced Components**:
```typescript
// AI-powered description generation
interface AIDescriptionGenerator {
  generateElevatorPitch(codebase: string, docs: string): Promise<string>;
  generateFeatureDescription(signals: FeatureSignal[]): Promise<string>;
  extractProductGoals(docs: string): Promise<string[]>;
}

// External integrations
interface ExternalImporter {
  importFromJira(jiraUrl: string, apiKey: string): Promise<Feature[]>;
  importFromLinear(linearKey: string): Promise<Feature[]>;
  importFromAsana(asanaToken: string): Promise<Feature[]>;
}

// Analytics
interface FeatureAnalytics {
  calculateVelocity(registry: FeatureRegistry, days: number): number;
  predictCompletionDate(feature: Feature): Date;
  identifyBottlenecks(): Bottleneck[];
}
```

### Phased Rollout Summary

| Phase | Duration | Focus | Key Metrics |
|-------|----------|-------|-------------|
| Phase 1 | 2-3 weeks | Core registry + basic discovery | 70% detection accuracy, CSV created |
| Phase 2 | 2-3 weeks | Integration + accuracy | 85% accuracy, Analyzer/Manager integration |
| Phase 3 | 3-4 weeks | Polish + automation | AI pitch generation, dashboard, imports |
| **Total** | **7-10 weeks** | **Production-ready** | **90%+ accuracy, full automation** |

---

## Example Workflows

### Workflow 1: Blue Sky Project (New from Scratch)

**Scenario**: Team is starting a new SaaS project for task management

**Steps**:
```bash
# 1. Initialize project planning
$ planner init ~/new-saas-app

? What is your product's elevator pitch?
> "A simple, fast task management app for small teams that focuses on clarity and speed over complex features."

? What are your core product goals? (comma-separated)
> "Increase team productivity by 30%, Reduce task tracking time by 50%, Enable async collaboration"

? Who is your target audience?
> "Small software teams (5-15 people) who find Jira too complex"

? Select project type:
> SaaS Web App

# 2. AI generates feature suggestions based on responses
Suggested features:
- User authentication (OAuth + email/password)
- Task board with columns (To Do, In Progress, Done)
- Task creation and editing
- Team member invitations
- Real-time collaboration (WebSocket updates)
- Mobile-responsive design
- Dark mode theme
- CSV export
- Integrations (Slack, GitHub)
- Analytics dashboard

? Which features are must-haves for v1.0? (select with space, enter when done)
> [x] User authentication
> [x] Task board with columns
> [x] Task creation and editing
> [x] Team member invitations
> [x] Real-time collaboration
> [x] Mobile-responsive design
> [ ] Dark mode theme
> [ ] CSV export
> [ ] Integrations
> [ ] Analytics dashboard

# 3. Feature registry created
✅ Created .project-planner/features.csv with 6 features
✅ Created .project-planner/state.json
✅ Added roadmap template to docs/ROADMAP.md

# 4. View the feature list
$ planner list --status planned

6 planned features:
  P0  User authentication               [Q1 2025] Authentication
  P0  Task board with columns           [Q1 2025] Core Features
  P0  Task creation and editing         [Q1 2025] Core Features
  P1  Team member invitations           [Q1 2025] Collaboration
  P1  Real-time collaboration           [Q2 2025] Collaboration
  P2  Mobile-responsive design          [Q1 2025] UI/UX

# 5. Export roadmap for stakeholders
$ planner export-roadmap --format markdown --output docs/ROADMAP.md

✅ Roadmap exported to docs/ROADMAP.md

# 6. Create GitHub issues for v1.0 features
$ manager create-issues --from-planner --milestone "v1.0"

Dry run preview:
  Would create 6 issues:
  - [Feature] User authentication (#assigned to: Backend Team)
  - [Feature] Task board with columns (#assigned to: Frontend Team)
  ...

? Create these issues? (y/n) y

✅ Created 6 GitHub issues
✅ Updated .project-state.json
✅ Updated feature registry with issue links
```

**Result**: Team has a clear roadmap, GitHub issues for tracking, and a CSV registry that serves as the source of truth.

---

### Workflow 2: Existing Codebase (Reverse Engineering)

**Scenario**: Team has an existing e-commerce app but no formal feature list

**Steps**:
```bash
# 1. Scan existing codebase
$ planner discover ~/ecommerce-app

Scanning codebase...
  Files scanned: 1,247
  Signals detected: 387
  Clustering signals...

✅ Discovered 23 features with 78% average confidence

Top features found:
  95% confidence  User authentication          (6 files, documented, tested)
  92% confidence  Product catalog              (8 files, documented, tested)
  88% confidence  Shopping cart                (5 files, documented, tested)
  85% confidence  Checkout process             (7 files, documented, tested)
  82% confidence  Payment processing (Stripe)  (4 files, documented)
  ...

# 2. Review and edit discoveries
$ planner review

Feature: User authentication
  Description: "Allow users to log in with email/password. Support password reset via email. Include session management with JWT tokens."
  Files: src/auth/login.ts, src/auth/session.ts, src/auth/jwt.ts
  Confidence: 95%

? Is this correct? (y/n/edit) y
? What is the status?
> implemented

Feature: OAuth integration
  Description: "Support OAuth login via Google and GitHub providers."
  Files: (none detected)
  Confidence: 35%

? Is this correct? (y/n/edit) n
? Keep or discard?
> discard (too low confidence)

# 3. Auto-save reviewed features
✅ Saved 21 features to .project-planner/features.csv
✅ Discarded 2 low-confidence signals

# 4. Generate elevator pitch from code
$ planner generate-pitch ~/ecommerce-app

Analyzing codebase and documentation...
  - README.md
  - package.json
  - Landing page (index.html)
  - Feature list (21 features)

Generated elevator pitch:
"An e-commerce platform that enables small businesses to sell products online with integrated Stripe payments, inventory management, and customer reviews."

? Use this pitch? (y/n/edit) y

✅ Updated .project-planner/state.json

# 5. Generate gap analysis
$ planner analyze-gaps

Gap Analysis Report:
  Total features: 21
  Implemented: 18 (86%)
  In progress: 2 (9%)
  Planned: 1 (5%)

Missing high-priority features:
  P0  Two-factor authentication       [Planned for Q2 2025]

In-progress features:
  P1  Advanced search filtering       [65% complete, 2 related TODOs]
  P2  Product recommendations         [40% complete, 5 related TODOs]

? Create GitHub issues for missing features? (y/n) y

# 6. Export roadmap
$ planner export-roadmap --format html --output docs/roadmap.html

✅ Interactive roadmap saved to docs/roadmap.html
✅ Open in browser: file:///Users/me/ecommerce-app/docs/roadmap.html
```

**Result**: Team now has a complete feature inventory, gap analysis, and can track implementation progress.

---

### Workflow 3: Integration with Analyzer & Manager

**Scenario**: Track feature implementation progress over time

**Steps**:
```bash
# 1. Start with feature registry (from Workflow 1 or 2)
$ planner list --status in-progress

2 features in progress:
  P1  Advanced search filtering       [Q1 2025] (65% complete)
  P2  Product recommendations         [Q2 2025] (40% complete)

# 2. Run analyzer to check implementation status
$ analyzer scan ~/ecommerce-app --check-features

Scanning for TODOs and feature implementation...
  Files scanned: 1,247
  TODOs found: 23
  Features checked: 21

Feature implementation updates:
  ✅ Advanced search filtering: 80% → 90% (+10%)
     - Evidence: New files added (src/search/filters.ts)
     - Remaining TODOs: 1 (down from 2)

  ⚠️  Product recommendations: 40% → 40% (no change)
     - TODOs: 5 remaining
     - No new implementation detected

? Update feature registry with new implementation %? (y/n) y

✅ Updated .project-planner/features.csv
✅ Advanced search filtering: 90% complete

# 3. Check if any features are complete
$ analyzer detect-completion ~/ecommerce-app

Completion detection:
  ✅ Advanced search filtering: LIKELY COMPLETE (90% confidence)
     - All related TODOs marked complete
     - Tests passing
     - No recent related commits

? Update status to "implemented"? (y/n) y

✅ Feature "Advanced search filtering" marked as implemented
✅ Closing related GitHub issue #42

# 4. Generate progress report
$ manager report --include-features

Project Manager Report (2025-10-20)

Feature Implementation Progress:
  Total features: 21
  Completed this week: 1
  In progress: 1
  Velocity: 0.5 features/week

Recently Completed:
  ✅ Advanced search filtering (completed 2025-10-20)

Still In Progress:
  ⏳ Product recommendations (40% complete, 5 TODOs remaining)

Next Actions:
  - Focus on Product recommendations (P2, Q2 2025)
  - Consider starting Two-factor authentication (P0, Q2 2025)

? Generate stakeholder summary? (y/n) y

✅ Stakeholder summary saved to docs/reports/feature-progress-2025-10-20.md
```

**Result**: Automated tracking of feature implementation, status updates, and stakeholder reporting.

---

## Risk Assessment & Mitigation

### Technical Risks

#### Risk 1: Auto-Discovery Accuracy

**Risk**: Feature detection from code may be inaccurate, leading to false positives/negatives

**Likelihood**: High (70%)
**Impact**: Medium (confusing reports, manual cleanup needed)

**Mitigation Strategies**:
1. **Confidence Scoring**: Always show confidence % and allow user review
2. **Interactive Review Mode**: CLI prompts user to confirm discoveries
3. **Manual Override**: Easy editing of auto-discovered features
4. **Incremental Approach**: Start with high-confidence detections (80%+), expand gradually
5. **Test-Driven**: Build comprehensive test suite with diverse codebases

**Residual Risk**: Low (manageable with review process)

---

#### Risk 2: Framework/Language Coverage

**Risk**: Initial version only supports React + Express, limiting applicability

**Likelihood**: Medium (50%)
**Impact**: Medium (reduced adoption by Vue/Angular/Django users)

**Mitigation Strategies**:
1. **Extensible Architecture**: Plugin-based detector system
2. **Phased Rollout**: Start with React + Express (covers 60% of use cases)
3. **Community Contributions**: Open-source detector plugins
4. **Documentation**: Clear guide for adding new framework detectors
5. **Fallback**: Generic detection (routes, components) works across frameworks

**Residual Risk**: Low (expansion path is clear)

---

#### Risk 3: CSV as Primary Storage

**Risk**: CSV may be fragile (manual editing breaks parsing, merge conflicts)

**Likelihood**: Medium (40%)
**Impact**: Low (recoverable, but annoying)

**Mitigation Strategies**:
1. **Validation**: Strict CSV validation on load with helpful error messages
2. **Git-Friendly**: Use consistent quoting and escaping
3. **Backup**: Auto-backup before updates (.csv.backup)
4. **Alternative Formats**: Also support JSON export for complex scenarios
5. **Migration Path**: Can switch to SQLite in Phase 3 if CSV proves limiting

**Residual Risk**: Very Low (CSV is well-understood and widely supported)

---

#### Risk 4: Integration Complexity

**Risk**: Coordinating state across three skills (Planner, Analyzer, Manager) is complex

**Likelihood**: Medium (50%)
**Impact**: High (bugs, data inconsistency, user confusion)

**Mitigation Strategies**:
1. **Clear Contracts**: Well-defined interfaces between skills
2. **State Isolation**: Each skill has own state file, linked by references
3. **Idempotency**: Operations can be safely re-run
4. **Versioning**: State files include schema version for migrations
5. **Testing**: Integration tests across all three skills

**Residual Risk**: Medium (requires careful design and testing)

---

### Product Risks

#### Risk 5: User Adoption - Too Manual

**Risk**: If auto-discovery accuracy is low, users abandon tool due to manual effort

**Likelihood**: Medium (40%)
**Impact**: High (poor adoption, negative feedback)

**Mitigation Strategies**:
1. **Optimize for High-Confidence**: Show only 80%+ confidence by default
2. **Batch Review**: Allow bulk accept/reject of discoveries
3. **Templates**: Provide pre-filled registries for common project types
4. **Progressive Enhancement**: Start with manual entry, add discovery later
5. **Quick Wins**: Focus on easiest detections first (routes, components)

**Residual Risk**: Low (with careful UX design)

---

#### Risk 6: Value Proposition Unclear

**Risk**: Users don't understand why they need a feature registry (vs. just GitHub issues)

**Likelihood**: Low (30%)
**Impact**: Medium (slow adoption)

**Mitigation Strategies**:
1. **Clear Documentation**: Explain use cases and benefits prominently
2. **Demo Videos**: Show real workflow examples
3. **Quick Start**: Pre-configured examples users can run immediately
4. **ROI Messaging**: "Reduce planning overhead by 50%", "See gaps in 5 minutes"
5. **Integration Benefits**: Highlight how it powers Analyzer and Manager

**Residual Risk**: Very Low (value is clear once users try it)

---

### Operational Risks

#### Risk 7: Maintenance Burden

**Risk**: Keeping up with framework changes (React 19, Next.js updates) is costly

**Likelihood**: High (80%)
**Impact**: Medium (stale detection patterns)

**Mitigation Strategies**:
1. **Community**: Open-source to leverage community contributions
2. **Generic Patterns**: Prefer generic detection over framework-specific when possible
3. **Deprecation Warnings**: Alert users when detectors are outdated
4. **Versioned Detectors**: Support multiple framework versions concurrently
5. **Quarterly Reviews**: Scheduled updates to detection patterns

**Residual Risk**: Medium (ongoing maintenance required)

---

### Risk Priority Matrix

```
Impact ▲
High    │  Risk 4 (Integration)      Risk 5 (Adoption)
        │  ▲                          ▲
Medium  │  Risk 1 (Accuracy)  Risk 2 (Coverage)  Risk 6 (Value)  Risk 7 (Maintenance)
        │  ▲                  ▲                   ▲               ▲
Low     │  Risk 3 (CSV)
        │  ▲
        └──────────────────────────────────────────────► Likelihood
           Low        Medium        High
```

**Mitigation Priority**:
1. **Highest**: Risk 4 (Integration), Risk 5 (Adoption)
2. **High**: Risk 1 (Accuracy), Risk 7 (Maintenance)
3. **Medium**: Risk 2 (Coverage), Risk 6 (Value)
4. **Low**: Risk 3 (CSV)

---

## Appendix

### A. Recommended Libraries

**Core Dependencies**:
- `commander` - CLI framework (already used)
- `papaparse` - CSV parsing/generation (robust, handles edge cases)
- `glob` + `ignore` - File traversal (already used)
- `@babel/parser` - AST parsing for JavaScript/TypeScript
- `fast-xml-parser` - Parse HTML/XML for landing page analysis
- `js-yaml` - Parse YAML config files

**Optional (Phase 3)**:
- `openai` - AI-powered description generation
- `marked` - Markdown parsing for README analysis
- `natural` - Simple NLP for keyword extraction
- `better-sqlite3` - SQLite storage (if CSV proves limiting)

### B. CLI Design

**Main Commands**:
```bash
planner init [path]                      # Interactive project initialization
planner discover [path]                  # Auto-discover features from code
planner review                           # Review and edit discovered features
planner list [--status] [--priority]     # List features with filters
planner add                              # Manually add a feature
planner edit <id>                        # Edit a feature
planner remove <id>                      # Remove a feature
planner export-roadmap [--format]        # Export roadmap (md/html/json)
planner analyze-gaps                     # Gap analysis report
planner generate-pitch [path]            # Generate elevator pitch
planner import <file>                    # Import from Jira/Linear/CSV
planner sync                             # Sync with Analyzer/Manager
```

**Example Usage**:
```bash
# Blue sky project
planner init ~/my-new-app
planner add --name "User auth" --priority P0 --timeline "Q1 2025"
planner export-roadmap --format markdown

# Existing codebase
planner discover ~/existing-app
planner review
planner analyze-gaps
planner sync  # Update Analyzer and Manager with feature list
```

### C. Success Metrics

**Phase 1 Success Criteria**:
- [ ] 70%+ detection accuracy on test codebases
- [ ] CSV registry created in <2 minutes (manual or auto)
- [ ] User can export markdown roadmap
- [ ] 10+ test cases passing

**Phase 2 Success Criteria**:
- [ ] 85%+ detection accuracy
- [ ] Analyzer integration: feature status updates automatically
- [ ] Manager integration: issue creation from gaps works
- [ ] Gap analysis report is actionable

**Phase 3 Success Criteria**:
- [ ] 90%+ detection accuracy
- [ ] AI-generated elevator pitch matches human expectations
- [ ] Roadmap dashboard is shareable
- [ ] Import from Jira/Linear works
- [ ] Adoption by 5+ teams (internal or open-source)

### D. Open Questions

**Question 1**: Should features support sub-features (hierarchy)?

**Recommendation**: YES, but Phase 2. Use `parent_id` field.

**Rationale**: Many features are actually epics (e.g., "Payments" → "Stripe integration", "Refunds", "Invoices")

---

**Question 2**: Should we auto-generate GitHub issues for ALL planned features?

**Recommendation**: NO, only on user request. Avoid issue spam.

**Rationale**: Some features are far future (Q4 2026), no need to create issues yet.

---

**Question 3**: How to handle feature deprecation?

**Recommendation**: Status = "deprecated", keep in registry for history.

**Rationale**: Helps understand product evolution, informs future decisions.

---

**Question 4**: Should we support multiple projects in one registry?

**Recommendation**: NO, one registry per project. Multi-project in Phase 3.

**Rationale**: Keeps things simple, most users manage one project at a time.

---

**Question 5**: What if auto-discovery finds 100+ features?

**Recommendation**: Show only high-confidence (80%+) by default, filter by `--min-confidence`.

**Rationale**: Avoids overwhelming user, allows gradual refinement.

---

## Conclusion

The **Project Planner** skill completes the project management suite by enabling **proactive planning** alongside the existing **reactive management** capabilities. By supporting both blue sky projects and reverse-engineered feature catalogs, it becomes the foundational "source of truth" that powers the entire toolchain.

### Key Innovations

1. **Bidirectional Workflow**: Works forward (planning → code) and backward (code → planning)
2. **CSV-First Design**: Simple, git-friendly, human-editable format
3. **AI-Assisted Discovery**: Reduces manual effort while maintaining accuracy
4. **Tight Integration**: Seamlessly connects Analyzer and Manager
5. **Progressive Enhancement**: Start simple, add sophistication incrementally

### Next Steps

1. **Design Review**: Gather feedback on this document from stakeholders
2. **Prototype**: Build Phase 1 MVP (2-3 weeks)
3. **User Testing**: Test with 2-3 pilot projects
4. **Iterate**: Refine based on feedback
5. **Phase 2 & 3**: Expand based on validated learnings

### Success Vision

In 6 months, teams using the full suite can:
- Define a product roadmap in 10 minutes (Planner)
- Track implementation progress automatically (Analyzer)
- Create and manage issues without manual effort (Manager)
- Generate stakeholder reports with one command
- Make data-driven roadmap decisions based on velocity and gaps

**The result**: 50% reduction in planning overhead, predictable feature delivery, and a single source of truth for product development.

---

**Document Status**: ✅ Design Complete, Ready for Review
**Version**: 1.0
**Last Updated**: 2025-10-20
