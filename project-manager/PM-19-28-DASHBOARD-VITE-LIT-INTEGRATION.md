# PM-19 to PM-28: Dashboard Vite + Lit Migration with AI Integration

**Status**: Planning
**Phase**: Phase 1
**Priority**: P0 (Foundation for interactive dashboard)
**Created**: 2025-10-22

## Overview

Transform the static HTML dashboard into a **bi-directional interface** between users and Claude Code skills using Vite + Lit + TypeScript. The dashboard will not only display project state but also trigger and monitor skill executions in real-time.

## Architecture: Dashboard ↔ Claude Skills Integration

### Communication Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Dashboard (Browser)                       │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Vite + Lit Components (TypeScript)                    │ │
│  │  - Roadmap View                                        │ │
│  │  - Test Status View                                    │ │
│  │  - Feature Editor                                      │ │
│  │  - Action Buttons (Run Analysis, Create Issues, etc.) │ │
│  └─────────────────┬──────────────────────────────────────┘ │
│                    │                                         │
│         ┌──────────▼──────────┐                             │
│         │  File Watcher       │                             │
│         │  (watches changes)  │                             │
│         └──────────┬──────────┘                             │
│                    │                                         │
└────────────────────┼─────────────────────────────────────────┘
                     │
         ┌───────────▼────────────┐
         │    File System         │
         │                        │
         │  Read:                 │
         │  - data.js             │
         │  - .test-status/       │
         │  - features.csv        │
         │  - .skill-output/      │
         │                        │
         │  Write:                │
         │  - .dashboard-actions/ │
         └───────────┬────────────┘
                     │
┌────────────────────▼─────────────────────────────────────────┐
│                 Claude Code Session                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Action Queue Watcher                                  │ │
│  │  (monitors .dashboard-actions/)                        │ │
│  └─────────────────┬──────────────────────────────────────┘ │
│                    │                                         │
│         ┌──────────▼──────────┐                             │
│         │  Skill Dispatcher   │                             │
│         │  - project-analyzer │                             │
│         │  - project-manager  │                             │
│         │  - project-planner  │                             │
│         └──────────┬──────────┘                             │
│                    │                                         │
│         ┌──────────▼──────────┐                             │
│         │  Output Writer      │                             │
│         │  - Updates data.js  │                             │
│         │  - Writes logs to   │                             │
│         │    .skill-output/   │                             │
│         └─────────────────────┘                             │
└──────────────────────────────────────────────────────────────┘
```

## Feature Breakdown

### PM-19: Vite + Lit Infrastructure Setup ⭐

**Dependencies**: None
**Effort**: 2-3 hours
**Tests**: 0 (infrastructure)

**Deliverables**:
- Vite project setup with TypeScript
- Lit library integration
- Hot module replacement (HMR) working
- Dev server running on `http://localhost:5173`
- Production build configuration

**File Structure**:
```
dashboard/
├── package.json
├── vite.config.ts
├── tsconfig.json
├── index.html (entry point)
├── src/
│   ├── main.ts
│   ├── components/
│   ├── styles/
│   └── types/
└── dist/ (build output)
```

**Commands**:
- `npm run dev` - Start dev server with HMR
- `npm run build` - Build for production
- `npm run preview` - Preview production build

---

### PM-20: TypeScript Component Architecture ⭐

**Dependencies**: PM-19
**Effort**: 3-4 hours
**Tests**: 5 tests

**Deliverables**:
- Base component classes
- Reactive state management
- TypeScript interfaces for all data structures
- Component lifecycle patterns

**Core Types**:
```typescript
// types/roadmap.ts
interface Feature {
  id: string;
  number: number;
  name: string;
  category: string;
  phase: string;
  priority?: string;
  dependencies?: string[];
  value: string;
  shippedDate?: string;
}

interface RoadmapData {
  project: ProjectInfo;
  features: {
    shipped: Feature[];
    inProgress: Feature[];
    nextUp: Feature[];
    backlog: Feature[];
  };
  stats: RoadmapStats;
}

// types/tests.ts
interface TestResult {
  testId: string;
  name: string;
  suite: string;
  package: string;
  file: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: TestError;
}

interface TestSummary {
  lastUpdated: string;
  packages: Record<string, PackageTestStatus>;
  overall: OverallTestStatus;
}

// types/actions.ts
interface DashboardAction {
  id: string;
  type: 'analyze' | 'create-issues' | 'update-feature' | 'run-tests';
  timestamp: string;
  payload: any;
  status: 'pending' | 'processing' | 'completed' | 'failed';
}
```

**Base Component**:
```typescript
import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';

@customElement('pm-base')
export class BaseComponent extends LitElement {
  static styles = css`
    :host {
      display: block;
      color: var(--text-color, #c9d1d9);
    }
  `;

  @property({ type: Boolean }) loading = false;
  @state() protected error: string | null = null;

  protected handleError(error: Error) {
    this.error = error.message;
    console.error(error);
  }

  protected clearError() {
    this.error = null;
  }
}
```

**Tests**:
- Component lifecycle tests
- State management tests
- Type validation tests

---

### PM-21: Reusable Component Library

**Dependencies**: PM-20
**Effort**: 4-5 hours
**Tests**: 15 tests

**Components**:

1. **`<pm-stat-card>`** - Statistics display
2. **`<pm-feature-card>`** - Feature display with actions
3. **`<pm-filter-bar>`** - Multi-criteria filtering
4. **`<pm-search-input>`** - Debounced search
5. **`<pm-test-item>`** - Test result display
6. **`<pm-button>`** - Action buttons
7. **`<pm-badge>`** - Status/category badges
8. **`<pm-modal>`** - Modal dialogs
9. **`<pm-loading>`** - Loading states
10. **`<pm-error>`** - Error displays

**Example Component**:
```typescript
@customElement('pm-stat-card')
export class StatCard extends BaseComponent {
  @property({ type: String }) label = '';
  @property({ type: Number }) value = 0;
  @property({ type: String }) status: 'success' | 'warning' | 'error' | 'neutral' = 'neutral';
  @property({ type: String }) icon = '';

  static styles = [
    BaseComponent.styles,
    css`
      .stat-card {
        background: var(--card-bg, #161b22);
        padding: 20px;
        border-radius: 6px;
        border: 1px solid var(--border-color, #30363d);
        text-align: center;
      }
      .stat-number {
        font-size: 32px;
        font-weight: bold;
        margin-bottom: 5px;
      }
      .stat-number.success { color: #3fb950; }
      .stat-number.warning { color: #d29922; }
      .stat-number.error { color: #f85149; }
    `
  ];

  render() {
    return html`
      <div class="stat-card">
        ${this.icon ? html`<span class="icon">${this.icon}</span>` : ''}
        <div class="stat-number ${this.status}">${this.value}</div>
        <div class="stat-label">${this.label}</div>
      </div>
    `;
  }
}
```

---

### PM-22: Migrate Roadmap View to Lit

**Dependencies**: PM-21
**Effort**: 5-6 hours
**Tests**: 10 tests

**Components**:
- `<pm-roadmap-view>` - Main container
- `<pm-feature-section>` - Shipped/In Progress/Next Up/Backlog sections
- `<pm-feature-list>` - Feature list with filtering
- `<pm-dependency-graph>` - Visual dependency display

**Features**:
- Live filtering by category, phase, priority
- Search by feature name/ID
- Expand/collapse sections
- Feature detail modals
- Dependency highlighting

---

### PM-23: Migrate Tests View to Lit

**Dependencies**: PM-21
**Effort**: 4-5 hours
**Tests**: 8 tests

**Components**:
- `<pm-tests-view>` - Main container
- `<pm-test-stats>` - Overall statistics
- `<pm-test-list>` - Filterable test list
- `<pm-test-filters>` - Package/status/search filters

**Features**:
- Real-time updates via file watcher
- Expandable error details
- Package filtering
- Status filtering
- Search

---

### PM-24: SPA Routing & Navigation

**Dependencies**: PM-22, PM-23
**Effort**: 3-4 hours
**Tests**: 5 tests

**Router**:
```typescript
import { Router } from '@vaadin/router';

const routes = [
  { path: '/', component: 'pm-roadmap-view' },
  { path: '/tests', component: 'pm-tests-view' },
  { path: '/features/:id', component: 'pm-feature-detail' },
  { path: '/actions', component: 'pm-action-queue' },
];

const outlet = document.getElementById('outlet');
const router = new Router(outlet);
router.setRoutes(routes);
```

**Navigation**:
```typescript
@customElement('pm-nav')
export class Navigation extends BaseComponent {
  render() {
    return html`
      <nav>
        <a href="/">Roadmap</a>
        <a href="/tests">Tests</a>
        <a href="/actions">Actions</a>
      </nav>
    `;
  }
}
```

---

### PM-25: File System Watcher for Auto-Sync ⭐

**Dependencies**: PM-19
**Effort**: 3-4 hours
**Tests**: 8 tests

**Purpose**: Watch files for changes and auto-reload dashboard state without manual refresh.

**Implementation**:
```typescript
// src/services/FileWatcher.ts
import { EventTarget } from '@lit-labs/task';

export class FileWatcher extends EventTarget {
  private watchedFiles = new Map<string, number>();
  private pollInterval = 1000; // 1 second
  private intervalId: number | null = null;

  watch(files: string[]) {
    files.forEach(file => {
      this.watchedFiles.set(file, Date.now());
    });

    if (!this.intervalId) {
      this.start();
    }
  }

  private async start() {
    this.intervalId = setInterval(async () => {
      for (const [file, lastModified] of this.watchedFiles) {
        try {
          const response = await fetch(file, { method: 'HEAD' });
          const newModified = new Date(
            response.headers.get('Last-Modified') || ''
          ).getTime();

          if (newModified > lastModified) {
            this.watchedFiles.set(file, newModified);
            this.dispatchEvent(new CustomEvent('file-changed', {
              detail: { file }
            }));
          }
        } catch (error) {
          console.error(`Error checking ${file}:`, error);
        }
      }
    }, this.pollInterval);
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

// Usage in components
const watcher = new FileWatcher();
watcher.watch([
  '/dashboard/data.js',
  '/.test-status/summary.json',
  '/.skill-output/latest.json'
]);

watcher.addEventListener('file-changed', (e) => {
  const { file } = e.detail;
  if (file === '/dashboard/data.js') {
    this.reloadRoadmap();
  } else if (file.includes('test-status')) {
    this.reloadTests();
  } else if (file.includes('skill-output')) {
    this.updateSkillStatus();
  }
});
```

**Watched Files**:
- `dashboard/data.js` - Roadmap data
- `.test-status/summary.json` - Test status
- `.test-status/latest.json` - Test details
- `.skill-output/latest.json` - Latest skill execution
- `.dashboard-actions/*.json` - Action queue status

---

### PM-26: Dashboard Actions → Skill Invocations ⭐

**Dependencies**: PM-20, planner-registry
**Effort**: 5-6 hours
**Tests**: 12 tests

**Purpose**: Allow dashboard UI to trigger Claude skills by writing action requests to file system.

**Action Queue Format**:
```typescript
// .dashboard-actions/ACTION_ID.json
interface ActionRequest {
  id: string;
  type: 'analyze' | 'create-issues' | 'update-feature' | 'run-tests' | 'discover-web';
  timestamp: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  payload: {
    // Type-specific payload
  };
  result?: {
    success: boolean;
    message?: string;
    data?: any;
  };
}
```

**Example Actions**:

1. **Run Analysis**:
```json
{
  "id": "action_20251022_143022_analyze",
  "type": "analyze",
  "timestamp": "2025-10-22T14:30:22.123Z",
  "status": "pending",
  "payload": {
    "repoPath": "/path/to/repo",
    "options": {
      "includeCompleted": true
    }
  }
}
```

2. **Create Issues**:
```json
{
  "id": "action_20251022_143145_issues",
  "type": "create-issues",
  "timestamp": "2025-10-22T14:31:45.456Z",
  "status": "pending",
  "payload": {
    "inputFile": ".project-analyzer/scan.json",
    "dryRun": false
  }
}
```

3. **Update Feature**:
```json
{
  "id": "action_20251022_143300_update",
  "type": "update-feature",
  "timestamp": "2025-10-22T14:33:00.789Z",
  "status": "pending",
  "payload": {
    "featureId": "planner-web-discovery",
    "updates": {
      "status": "in-progress"
    }
  }
}
```

**Dashboard Component**:
```typescript
@customElement('pm-action-button')
export class ActionButton extends BaseComponent {
  @property({ type: String }) action = '';
  @property({ type: Object }) payload = {};
  @state() private actionId: string | null = null;

  private async createAction() {
    const action: ActionRequest = {
      id: `action_${Date.now()}_${this.action}`,
      type: this.action as any,
      timestamp: new Date().toISOString(),
      status: 'pending',
      payload: this.payload
    };

    this.actionId = action.id;

    // Write to file system via local endpoint or direct file write
    await this.writeAction(action);

    // Start polling for status
    this.pollActionStatus();
  }

  private async writeAction(action: ActionRequest) {
    // Option 1: If running local dev server with file write capability
    await fetch('/api/actions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(action)
    });

    // Option 2: User downloads JSON and places in .dashboard-actions/
    // Show modal with JSON and instructions
  }

  private pollActionStatus() {
    const interval = setInterval(async () => {
      const status = await this.checkActionStatus(this.actionId!);

      if (status === 'completed' || status === 'failed') {
        clearInterval(interval);
        this.dispatchEvent(new CustomEvent('action-complete', {
          detail: { actionId: this.actionId, status }
        }));
      }
    }, 2000);
  }

  render() {
    return html`
      <button @click=${this.createAction}>
        ${this.action === 'analyze' ? '🔍 Run Analysis' : ''}
        ${this.action === 'create-issues' ? '📝 Create Issues' : ''}
      </button>
    `;
  }
}
```

---

### PM-27: Action Queue System

**Dependencies**: PM-26
**Effort**: 4-5 hours
**Tests**: 10 tests

**Claude Code Integration**:

Create a hook or background process that monitors `.dashboard-actions/`:

```typescript
// .claude/hooks/dashboard-actions-watcher.ts
import * as fs from 'fs';
import * as path from 'path';
import { watch } from 'chokidar';

const ACTIONS_DIR = '.dashboard-actions';

export function startActionWatcher() {
  const watcher = watch(ACTIONS_DIR, {
    persistent: true,
    ignoreInitial: false
  });

  watcher.on('add', async (filePath) => {
    const actionFile = path.join(process.cwd(), filePath);
    const action = JSON.parse(fs.readFileSync(actionFile, 'utf-8'));

    if (action.status === 'pending') {
      await processAction(action, actionFile);
    }
  });
}

async function processAction(action: ActionRequest, filePath: string) {
  // Update status to processing
  action.status = 'processing';
  fs.writeFileSync(filePath, JSON.stringify(action, null, 2));

  try {
    let result;

    switch (action.type) {
      case 'analyze':
        result = await runAnalyzer(action.payload);
        break;
      case 'create-issues':
        result = await runManager(action.payload);
        break;
      case 'update-feature':
        result = await updateFeatureInRegistry(action.payload);
        break;
      case 'run-tests':
        result = await runTests(action.payload);
        break;
    }

    action.status = 'completed';
    action.result = { success: true, data: result };
  } catch (error: any) {
    action.status = 'failed';
    action.result = { success: false, message: error.message };
  }

  fs.writeFileSync(filePath, JSON.stringify(action, null, 2));
}
```

**Action Queue UI**:
```typescript
@customElement('pm-action-queue')
export class ActionQueue extends BaseComponent {
  @state() private actions: ActionRequest[] = [];

  connectedCallback() {
    super.connectedCallback();
    this.loadActions();
    this.watchActions();
  }

  private async loadActions() {
    // Load all actions from .dashboard-actions/
    const response = await fetch('/.dashboard-actions/');
    const files = await response.json();

    this.actions = await Promise.all(
      files.map(file => fetch(`/.dashboard-actions/${file}`).then(r => r.json()))
    );
  }

  render() {
    return html`
      <div class="action-queue">
        <h2>Action Queue</h2>
        ${this.actions.map(action => html`
          <div class="action-item ${action.status}">
            <span class="action-type">${action.type}</span>
            <span class="action-status">${action.status}</span>
            <span class="action-time">${new Date(action.timestamp).toLocaleString()}</span>
            ${action.result ? html`
              <div class="action-result">
                ${action.result.success ? '✅' : '❌'}
                ${action.result.message || ''}
              </div>
            ` : ''}
          </div>
        `)}
      </div>
    `;
  }
}
```

---

### PM-28: Real-Time Skill Output Display

**Dependencies**: PM-25
**Effort**: 4-5 hours
**Tests**: 8 tests

**Purpose**: Stream skill execution progress to dashboard in real-time.

**Output Format**:
```typescript
// .skill-output/SKILL_NAME_TIMESTAMP.json
interface SkillOutput {
  skillName: 'project-analyzer' | 'project-manager' | 'project-planner';
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed';
  progress?: {
    current: number;
    total: number;
    message: string;
  };
  output: {
    logs: string[];
    results: any;
  };
  error?: string;
}
```

**Live Output Component**:
```typescript
@customElement('pm-skill-output')
export class SkillOutput extends BaseComponent {
  @property({ type: String }) skillName = '';
  @state() private output: SkillOutput | null = null;

  connectedCallback() {
    super.connectedCallback();
    this.watchOutput();
  }

  private watchOutput() {
    const watcher = new FileWatcher();
    watcher.watch([`/.skill-output/${this.skillName}_*.json`]);

    watcher.addEventListener('file-changed', async (e) => {
      const response = await fetch(e.detail.file);
      this.output = await response.json();
    });
  }

  render() {
    if (!this.output) return html`<div>No output yet...</div>`;

    return html`
      <div class="skill-output">
        <h3>${this.skillName}</h3>
        <div class="status ${this.output.status}">${this.output.status}</div>

        ${this.output.progress ? html`
          <progress value="${this.output.progress.current}" max="${this.output.progress.total}"></progress>
          <span>${this.output.progress.message}</span>
        ` : ''}

        <div class="logs">
          ${this.output.output.logs.map(log => html`<div>${log}</div>`)}
        </div>

        ${this.output.error ? html`
          <div class="error">${this.output.error}</div>
        ` : ''}
      </div>
    `;
  }
}
```

---

## Integration Example: Complete Workflow

### User Clicks "Run Analysis" Button

1. **Dashboard** (`pm-action-button`) writes action request:
   ```
   .dashboard-actions/action_20251022_143022_analyze.json
   ```

2. **Claude Code** (action watcher hook) detects new file:
   - Reads action request
   - Updates status to "processing"
   - Invokes `project-analyzer` skill

3. **Analyzer Skill** writes progress:
   ```
   .skill-output/project-analyzer_20251022_143022.json
   ```
   Updates with:
   - Files scanned: 245/1000
   - TODOs found: 127

4. **Dashboard** (file watcher) detects updates:
   - Shows live progress bar
   - Streams log output
   - Updates in real-time

5. **Analyzer Completes**:
   - Writes final results to `.project-analyzer/scan.json`
   - Updates action status to "completed"
   - Dashboard shows ✅ and option to "Create Issues"

6. **User Clicks "Create Issues"**:
   - Dashboard writes new action request
   - Manager skill processes
   - Issues created on GitHub
   - Dashboard updates roadmap

---

## Testing Strategy

### Unit Tests (60+ tests total)

- **Component Tests**: Render, props, events, slots
- **State Management**: Reactivity, updates, persistence
- **File Watcher**: Change detection, polling, error handling
- **Action System**: Queue, status updates, error handling
- **Integration**: End-to-end action workflows

### Example Test:
```typescript
import { fixture, html, expect } from '@open-wc/testing';
import '../src/components/pm-stat-card';

describe('pm-stat-card', () => {
  it('renders with correct value and status', async () => {
    const el = await fixture(html`
      <pm-stat-card
        label="Total Tests"
        value="60"
        status="success">
      </pm-stat-card>
    `);

    expect(el.shadowRoot!.querySelector('.stat-number')!.textContent).to.equal('60');
    expect(el.shadowRoot!.querySelector('.stat-number')!.classList.contains('success')).to.be.true;
  });

  it('updates reactively when value changes', async () => {
    const el = await fixture(html`<pm-stat-card value="10"></pm-stat-card>`);

    el.value = 20;
    await el.updateComplete;

    expect(el.shadowRoot!.querySelector('.stat-number')!.textContent).to.equal('20');
  });
});
```

---

## Success Criteria

1. ✅ Dev server runs with HMR
2. ✅ All components type-safe with TypeScript
3. ✅ Dashboard auto-reloads when data changes
4. ✅ UI actions write to `.dashboard-actions/`
5. ✅ Claude Code processes actions and updates status
6. ✅ Real-time skill output streams to dashboard
7. ✅ Routing works without page reloads
8. ✅ 60+ tests passing
9. ✅ Production build under 100KB gzipped

---

## Timeline Estimate

| Feature | Effort | Dependencies |
|---------|--------|--------------|
| PM-19: Vite Setup | 2-3h | None |
| PM-20: Architecture | 3-4h | PM-19 |
| PM-21: Components | 4-5h | PM-20 |
| PM-22: Roadmap | 5-6h | PM-21 |
| PM-23: Tests | 4-5h | PM-21 |
| PM-24: Routing | 3-4h | PM-22, PM-23 |
| PM-25: File Watcher | 3-4h | PM-19 |
| PM-26: Actions | 5-6h | PM-20 |
| PM-27: Queue | 4-5h | PM-26 |
| PM-28: Live Output | 4-5h | PM-25 |

**Total**: 37-47 hours (~1 week of focused work)

---

## Next Steps

1. **PM-19**: Set up Vite + Lit infrastructure
2. **PM-20**: Create TypeScript component architecture
3. **PM-25**: Implement file watcher (parallel with PM-20)
4. **PM-21**: Build component library
5. **PM-22 & PM-23**: Migrate views (parallel)
6. **PM-26**: Implement action buttons
7. **PM-27**: Build action queue system
8. **PM-28**: Add live output display
9. **PM-24**: Add routing (final polish)

Ready to start with PM-19?
