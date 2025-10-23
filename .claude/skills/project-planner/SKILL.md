---
name: project-planner
description: Discovers features from codebases, manages feature registries, and exports roadmaps. Analyzes React routes, Express endpoints, component structures, and generates CSV/Markdown roadmaps. Use this for feature discovery from code, roadmap generation, and feature registry management.
---

# Project Planner Skill

Discovers features from codebases, manages feature registries, and exports comprehensive roadmaps.

## When to Use This Skill

Invoke this skill when the user:
- **Code Feature Discovery**: Wants to discover what features exist in a codebase
- **Roadmap Generation**: Needs to create a feature roadmap from code analysis
- **Feature Registry**: Wants to track and manage features in CSV format
- **React Analysis**: Needs to analyze React Router routes and component structure
- **Express Analysis**: Wants to discover Express.js API endpoints and routes
- **Export Roadmaps**: Needs to export feature lists as CSV or Markdown

## Core Capabilities

### 1. Code Discovery
- **React Discovery**: Analyze React Router routes, components, hooks
- **Express Discovery**: Extract API endpoints, middleware, route handlers
- **Component Analysis**: Discover UI components and their props
- **Config Analysis**: Parse configuration files for feature flags

### 2. Feature Registry Management
- **CSV Registry**: Maintain features in CSV format with phases, priorities
- **Feature Tracking**: Track implementation status, categories, dependencies
- **Bulk Operations**: Import/export features, merge registries
- **Validation**: Ensure feature data consistency

### 3. Roadmap Export
- **Markdown Roadmaps**: Generate formatted markdown roadmaps
- **CSV Export**: Export to CSV for spreadsheet tools
- **Phase Organization**: Group features by development phases
- **Priority Sorting**: Sort by priority, status, or custom criteria

## Instructions

### Step 1: Determine Task Type

Ask the user what they need:
- **Discover features** from codebase
- **Export roadmap** from existing feature registry
- **Manage feature registry** (add, update, export features)

### Step 2: Code Discovery

#### Discover Features from React Codebase
```typescript
import { CodeDiscovery } from '{{INSTALL_DIR}}/project-planner';

const discovery = new CodeDiscovery();
const features = await discovery.discoverFromReact('/path/to/react/app', {
  includeRoutes: true,
  includeComponents: true,
  includeHooks: true
});

// Save to CSV
const registry = new CSVFeatureRegistry();
await registry.saveFeatures(features, 'features.csv');
```

#### Discover Features from Express Codebase
```typescript
import { CodeDiscovery } from '{{INSTALL_DIR}}/project-planner';

const discovery = new CodeDiscovery();
const features = await discovery.discoverFromExpress('/path/to/express/app', {
  includeRoutes: true,
  includeMiddleware: true,
  includeControllers: true
});
```

#### Analyze Any JavaScript/TypeScript Project
```typescript
import { CodeDiscovery } from '{{INSTALL_DIR}}/project-planner';

const discovery = new CodeDiscovery();
const features = await discovery.analyze('/path/to/project', {
  detectFramework: true,
  includeConfigs: true
});
```

### Step 3: Feature Registry Management

#### Load Features from CSV
```typescript
import { CSVFeatureRegistry } from '{{INSTALL_DIR}}/project-planner';

const registry = new CSVFeatureRegistry();
const features = await registry.loadFeatures('features.csv');
```

#### Add/Update Features
```typescript
registry.addFeature({
  id: 'F-123',
  name: 'User Authentication',
  category: 'Security',
  phase: 'Phase 1',
  priority: 'high',
  status: 'in-progress',
  description: 'Implement JWT-based authentication'
});

await registry.saveFeatures(features, 'features.csv');
```

#### Filter and Query Features
```typescript
// Get features by phase
const phase1Features = registry.getFeaturesByPhase('Phase 1');

// Get features by status
const inProgressFeatures = registry.getFeaturesByStatus('in-progress');

// Get high priority features
const criticalFeatures = registry.getFeaturesByPriority('high');
```

### Step 4: Export Roadmaps

#### Export to Markdown
```typescript
import { RoadmapExporter } from '{{INSTALL_DIR}}/project-planner';

const exporter = new RoadmapExporter();
const markdown = await exporter.exportToMarkdown(features, {
  groupBy: 'phase',
  includeStats: true,
  includeTimeline: true
});

await exporter.writeToFile(markdown, 'ROADMAP.md');
```

#### Export to CSV
```typescript
const csv = await exporter.exportToCSV(features, {
  includeMetadata: true,
  sortBy: 'priority'
});

await exporter.writeToFile(csv, 'roadmap.csv');
```

### Step 5: Complete Workflow Example

Here's a complete workflow for discovering features and creating a roadmap:

```typescript
import {
  CodeDiscovery,
  CSVFeatureRegistry,
  RoadmapExporter
} from '{{INSTALL_DIR}}/project-planner';

async function analyzeAndExportRoadmap(projectPath: string) {
  // 1. Discover features from code
  const discovery = new CodeDiscovery();
  const discoveredFeatures = await discovery.analyze(projectPath, {
    detectFramework: true,
    includeComponents: true,
    includeRoutes: true,
    includeAPIs: true
  });

  // 2. Save to CSV registry
  const registry = new CSVFeatureRegistry();
  await registry.saveFeatures(discoveredFeatures, 'features.csv');

  // 3. Export roadmap
  const exporter = new RoadmapExporter();
  const roadmap = await exporter.exportToMarkdown(discoveredFeatures, {
    groupBy: 'phase',
    sortBy: 'priority',
    includeStats: true
  });

  await exporter.writeToFile(roadmap, 'ROADMAP.md');

  return {
    totalFeatures: discoveredFeatures.length,
    roadmapPath: 'ROADMAP.md',
    registryPath: 'features.csv'
  };
}
```

## Common Workflows

### Workflow 1: Initial Code Analysis
```
1. Run CodeDiscovery on codebase
2. Save features to CSV registry
3. Export initial roadmap in Markdown
4. Review and categorize features
5. Update priorities and phases manually
```

### Workflow 2: Roadmap Update
```
1. Load existing feature registry from CSV
2. Run CodeDiscovery to find new features
3. Merge new features into registry
4. Re-export updated roadmap
5. Commit changes to version control
```

### Workflow 3: Multi-Repo Analysis
```
1. Discover features from multiple repositories
2. Merge into single registry
3. Deduplicate and categorize
4. Export consolidated roadmap
5. Share with team
```

## Output Formats

### CSV Registry Format
```csv
id,name,category,phase,priority,status,description,source,dependencies
F-1,User Login,Auth,Phase 1,high,implemented,JWT authentication,code/routes.ts,
F-2,Dashboard,UI,Phase 1,high,implemented,Main dashboard view,code/Dashboard.tsx,F-1
F-3,API Rate Limiting,Backend,Phase 2,medium,planned,Rate limit endpoints,code/middleware.ts,
```

### Markdown Roadmap Format
```markdown
# Product Roadmap

## Phase 1 - Core Features (5 features)
### ✅ Completed (3)
- **User Login** (Auth) - JWT authentication
- **Dashboard** (UI) - Main dashboard view
- **Profile** (UI) - User profile page

### 🚧 In Progress (2)
- **Settings** (UI) - User settings management
- **Notifications** (Features) - Real-time notifications

## Phase 2 - Enhanced Features (3 features)
### 📋 Planned (3)
- **API Rate Limiting** (Backend) - Rate limit endpoints
- **Advanced Search** (Features) - Full-text search
- **Export Data** (Features) - CSV/JSON export

## Statistics
- **Total Features**: 8
- **Completion Rate**: 37.5%
- **High Priority**: 3 features
```

## Integration with Other Skills

### With project-analyzer
1. **Discover features** from code (project-planner)
2. **Verify features** in production (project-analyzer)
3. **Create roadmap** with verified status

### With project-manager
1. **Discover features** from code (project-planner)
2. **Create GitHub issues** for unimplemented features (project-manager)
3. **Track progress** in registry

## Technical Details

- **Location**: `{{INSTALL_DIR}}/project-planner/`
- **Language**: TypeScript/Node.js
- **Dependencies**:
  - `@babel/parser` - Code parsing
  - `glob` - File pattern matching
  - `csv-parse` / `csv-stringify` - CSV handling
- **Performance**:
  - Code scan: ~500 files/second
  - Feature extraction: ~100 features/second
  - Registry operations: In-memory (very fast)

## Error Handling

If discovery fails:
1. **Parse errors**: Check code syntax, ensure valid JS/TS
2. **File not found**: Verify paths exist
3. **Framework detection failed**: Manually specify framework type
4. **CSV errors**: Check CSV format, validate headers
5. **Dependencies missing**: Run `npm install` in project-planner directory

## Tips for Best Results

- **Start with automatic discovery** to get initial feature list
- **Review and refine** feature names, categories, priorities
- **Keep registry in version control** to track changes over time
- **Re-run discovery periodically** to catch new features
- **Use consistent naming** for features across discovery runs
- **Link to code** by including file paths in feature metadata
- **Track dependencies** between features for better planning

## Examples

### Example 1: Analyze React App
**User**: "Discover all features in my React app"

**Response**:
```typescript
// I'll analyze your React application to discover features
const discovery = new CodeDiscovery();
const features = await discovery.discoverFromReact('/path/to/app', {
  includeRoutes: true,
  includeComponents: true
});

// Found 42 features:
// - 15 routes
// - 27 components
//
// Saved to features.csv
```

### Example 2: Generate Roadmap
**User**: "Create a roadmap from the feature registry"

**Response**:
```typescript
// Loading features from CSV...
const registry = new CSVFeatureRegistry();
const features = await registry.loadFeatures('features.csv');

// Exporting roadmap...
const exporter = new RoadmapExporter();
const roadmap = await exporter.exportToMarkdown(features, {
  groupBy: 'phase',
  sortBy: 'priority'
});

// Roadmap created: ROADMAP.md
// - 3 phases
// - 42 total features
// - 65% completion rate
```

### Example 3: Complete Discovery to Issues Workflow
**User**: "Analyze my code and create issues for missing features"

**Response**:
```
1. Discovering features from code...
   → Found 42 features in codebase

2. Discovering features from documentation...
   → Found 58 planned features

3. Comparing lists...
   → 16 features exist in docs but not in code

4. Creating GitHub issues... (project-manager skill)
   → Created 16 issues with "missing-feature" label

5. Roadmap updated: ROADMAP.md
```
