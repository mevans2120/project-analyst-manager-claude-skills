# Project Planner Skill

**Status**: ✅ Production Ready
**Version**: 1.0.0
**Tests**: 17/17 passing

## Overview

Project Planner helps plan features by discovering them from code and web sources. The first component is the CSV Feature Registry - a single source of truth for all product features.

## Features

### CSV Feature Registry (PM-3)

Single source of truth for product features:

- ✅ Create, read, update, delete features
- ✅ CSV storage for easy editing and version control
- ✅ Auto-incrementing feature numbers
- ✅ Dependency tracking between features
- ✅ Circular dependency detection
- ✅ Feature filtering by status, priority, category, tags
- ✅ Persistence with auto-save
- ✅ Project metadata management

## Installation

```bash
npm install
```

## Usage

### Create a New Registry

```typescript
import { CSVFeatureRegistry } from 'project-planner';

const registry = new CSVFeatureRegistry({
  filePath: './features.csv',
  createIfMissing: true,
  autoSave: true
});
```

### Add Features

```typescript
const feature = registry.addFeature({
  id: 'user-auth',
  name: 'User Authentication',
  description: 'Login and signup functionality',
  category: 'Backend',
  phase: 'Phase 1',
  priority: 'P0',
  status: 'planned',
  dependencies: [],
  blocks: ['user-profile', 'user-settings'],
  value: 'Enables user-specific features',
  tags: ['security', 'api']
});

console.log(feature.number); // Auto-assigned: 1
```

### Query Features

```typescript
// Get by ID
const feature = registry.getFeature('user-auth');

// Get all features
const all = registry.getAllFeatures();

// Filter by criteria
const inProgress = registry.filterFeatures({ status: 'in-progress' });
const p0Features = registry.filterFeatures({ priority: 'P0' });
const backend = registry.filterFeatures({ category: 'Backend' });
const withTags = registry.filterFeatures({ tags: ['api'] });

// Get by status
const completed = registry.getByStatus('completed');
```

### Update and Delete

```typescript
// Update feature
registry.updateFeature('user-auth', {
  status: 'in-progress',
  startDate: '2025-10-22'
});

// Delete feature
registry.deleteFeature('user-auth');
```

### Dependency Management

```typescript
// Get dependency graph
const graph = registry.getDependencyGraph();
console.log(graph.get('feature-id')); // ['dependency-1', 'dependency-2']

// Check for circular dependencies
const hasCircular = registry.hasCircularDependency('feature-id');
if (hasCircular) {
  console.error('Circular dependency detected!');
}
```

## CSV Format

The registry uses a simple CSV format:

```csv
id,number,name,code,description,category,phase,priority,status,dependencies,blocks,value,startDate,completedDate,notes,tags
PROJECT_META,,My Project,MP,Project description,,,,,,,,,,
feature-1,1,User Auth,,Login system,Backend,Phase 1,P0,in-progress,,feature-2;feature-3,Enable user features,2025-10-22,,,security;api
feature-2,2,User Profile,,Profile page,Frontend,Phase 1,P1,planned,feature-1,,Show user info,,,Nice to have,ui;user
```

## Feature Status Values

- `planned`: Not started yet
- `in-progress`: Currently being built
- `completed`: Finished and shipped
- `blocked`: Cannot proceed due to blockers

## Priority Levels

- `P0`: Critical - must have
- `P1`: High priority
- `P2`: Medium priority
- `P3`: Low priority / nice-to-have

## Testing

```bash
npm test
```

All 17 tests passing:
- ✅ Registry initialization
- ✅ Create/read/update/delete operations
- ✅ Auto-incrementing numbers
- ✅ Feature filtering
- ✅ Dependency graph generation
- ✅ Circular dependency detection
- ✅ CSV persistence

## Next Features

Coming soon to Project Planner:
- **Code-Based Discovery** (PM-7): Discover features from React routes, API endpoints
- **Web-Based Discovery** (PM-8): Analyze competitor websites for feature ideas
- **Roadmap Export** (PM-9): Generate visual roadmaps in Markdown/HTML

## License

MIT
