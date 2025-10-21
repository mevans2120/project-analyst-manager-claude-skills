# Project Planner - Technical Specification

**Version:** 1.0
**Date:** 2025-10-20
**Status:** Implementation Ready

---

## Overview

This document provides detailed technical specifications for implementing the Project Planner skill. For strategic context and design decisions, see [PROJECT-PLANNER-DESIGN.md](../PROJECT-PLANNER-DESIGN.md).

---

## Type Definitions

### Core Types

```typescript
/**
 * Feature status enum
 */
export type FeatureStatus = 'planned' | 'in-progress' | 'implemented' | 'deprecated';

/**
 * Feature priority enum (P0 = highest, P3 = lowest)
 */
export type Priority = 'P0' | 'P1' | 'P2' | 'P3';

/**
 * How the feature was added to the registry
 */
export type DetectedBy = 'manual' | 'auto-discovery' | 'analyzer' | 'import';

/**
 * Feature record structure (matches CSV schema)
 */
export interface Feature {
  id: string;
  name: string;
  description: string;
  status: FeatureStatus;
  priority: Priority;
  category: string;
  timeline: string;
  owner: string;
  parent_id: string;
  implementation_files: string; // Semicolon-separated
  implementation_confidence: number; // 0-100
  created_at: string; // ISO 8601
  updated_at: string; // ISO 8601
  detected_by: DetectedBy;
  notes: string;
}

/**
 * Feature signal detected during auto-discovery
 */
export interface FeatureSignal {
  type: 'route' | 'component' | 'api' | 'database' | 'config' | 'documentation' | 'test';
  file: string;
  name: string;
  confidence: number; // 0-100
  metadata: {
    framework?: string; // 'react', 'express', 'django', etc.
    pattern?: string; // The regex or AST pattern that matched
    context?: string; // Surrounding code context
    documentation?: string; // Related docs/comments
  };
}

/**
 * Clustered feature from multiple signals
 */
export interface FeatureCluster {
  primaryName: string;
  description: string;
  signals: FeatureSignal[];
  confidence: number;
  files: string[];
  suggestedCategory: string;
  suggestedPriority: Priority;
}

/**
 * Product metadata from planning session
 */
export interface ProductMetadata {
  elevatorPitch: string;
  productGoals: string[];
  targetAudience: string;
  projectType: string; // 'saas-web-app', 'ecommerce', 'mobile-app', 'api-backend'
}

/**
 * Registry statistics
 */
export interface RegistryStats {
  totalFeatures: number;
  byStatus: Record<FeatureStatus, number>;
  byPriority: Record<Priority, number>;
  byCategory: Record<string, number>;
  implementationRate: number; // Percentage
  averageConfidence: number;
}

/**
 * Gap analysis result
 */
export interface GapAnalysis {
  unimplemented: Feature[];
  inProgress: Feature[];
  implemented: Feature[];
  missingHighPriority: Feature[]; // P0/P1 not implemented
  stalledFeatures: Feature[]; // In-progress for >30 days
  recommendations: Recommendation[];
}

export interface Recommendation {
  type: 'start' | 'continue' | 'complete' | 'deprioritize';
  feature: Feature;
  reason: string;
  priority: number; // 1-10 (1 = highest)
}

/**
 * Implementation status from Analyzer
 */
export interface ImplementationStatus {
  featureId: string;
  implemented: boolean;
  confidence: number;
  evidence: {
    filesExist: boolean;
    codeMatches: number;
    relatedTodos: number;
    testCoverage: boolean;
  };
}
```

---

## API Design

### FeatureRegistry Class

```typescript
import { Feature, RegistryStats, FeatureStatus, Priority } from './types';

export class FeatureRegistry {
  private registryPath: string;
  private features: Map<string, Feature>;

  constructor(registryPath: string) {
    this.registryPath = registryPath;
    this.features = new Map();
  }

  /**
   * Load registry from CSV file
   */
  async load(): Promise<void>;

  /**
   * Save registry to CSV file
   */
  async save(): Promise<void>;

  /**
   * Add a new feature
   */
  async addFeature(feature: Omit<Feature, 'id' | 'created_at' | 'updated_at'>): Promise<Feature>;

  /**
   * Update an existing feature
   */
  async updateFeature(id: string, updates: Partial<Feature>): Promise<Feature>;

  /**
   * Get a single feature by ID
   */
  async getFeature(id: string): Promise<Feature | undefined>;

  /**
   * Get all features
   */
  async getAllFeatures(): Promise<Feature[]>;

  /**
   * Query features by status
   */
  async getByStatus(status: FeatureStatus): Promise<Feature[]>;

  /**
   * Query features by priority
   */
  async getByPriority(priority: Priority): Promise<Feature[]>;

  /**
   * Query features by category
   */
  async getByCategory(category: string): Promise<Feature[]>;

  /**
   * Get features not yet implemented
   */
  async getUnimplemented(): Promise<Feature[]>;

  /**
   * Get features in progress for more than N days
   */
  async getStalledFeatures(days: number = 30): Promise<Feature[]>;

  /**
   * Calculate registry statistics
   */
  async getStats(): Promise<RegistryStats>;

  /**
   * Generate a unique feature ID
   */
  private generateId(): string;

  /**
   * Validate feature data
   */
  private validate(feature: Partial<Feature>): boolean;
}
```

### DiscoveryEngine Class

```typescript
import { FeatureSignal, FeatureCluster, Feature } from './types';

export interface DiscoveryOptions {
  rootPath: string;
  frameworks?: string[]; // 'react', 'express', etc. (auto-detect if omitted)
  minConfidence?: number; // Minimum confidence to include (default: 50)
  excludePatterns?: string[]; // Gitignore-style patterns
  includePatterns?: string[]; // Only scan these patterns
}

export class DiscoveryEngine {
  private detectors: Map<string, FeatureDetector>;

  constructor() {
    // Register built-in detectors
    this.detectors = new Map();
    this.registerDetector('react', new ReactDetector());
    this.registerDetector('express', new ExpressDetector());
    this.registerDetector('config', new ConfigDetector());
    this.registerDetector('documentation', new DocumentationDetector());
  }

  /**
   * Scan codebase and detect feature signals
   */
  async scanCodebase(options: DiscoveryOptions): Promise<FeatureSignal[]>;

  /**
   * Cluster signals into logical features
   */
  async clusterSignals(signals: FeatureSignal[]): Promise<FeatureCluster[]>;

  /**
   * Convert clusters to Feature records
   */
  async clustersToFeatures(clusters: FeatureCluster[]): Promise<Feature[]>;

  /**
   * Full discovery pipeline
   */
  async discover(options: DiscoveryOptions): Promise<Feature[]>;

  /**
   * Register a custom detector
   */
  registerDetector(name: string, detector: FeatureDetector): void;

  /**
   * Auto-detect frameworks in the codebase
   */
  private async detectFrameworks(rootPath: string): Promise<string[]>;
}
```

### FeatureDetector Interface

```typescript
export interface FeatureDetector {
  /**
   * Detector name (e.g., 'react', 'express')
   */
  name: string;

  /**
   * File patterns to scan (e.g., ['**/*.tsx', '**/*.jsx'])
   */
  filePatterns: string[];

  /**
   * Detect feature signals from a file
   */
  detectSignals(filePath: string, content: string): Promise<FeatureSignal[]>;

  /**
   * Calculate confidence score for a signal
   */
  calculateConfidence(signal: FeatureSignal, context: DetectionContext): number;
}

export interface DetectionContext {
  hasTests: boolean;
  hasDocumentation: boolean;
  fileCount: number;
  relatedFiles: string[];
}
```

### PlanningEngine Class

```typescript
import { Feature, ProductMetadata } from './types';

export interface PlanningSession {
  metadata: ProductMetadata;
  features: Feature[];
}

export class PlanningEngine {
  /**
   * Interactive project initialization
   */
  async initializeProject(): Promise<PlanningSession>;

  /**
   * Generate feature suggestions based on project type
   */
  async suggestFeatures(projectType: string): Promise<Feature[]>;

  /**
   * Generate elevator pitch from README and code
   */
  async generateElevatorPitch(rootPath: string): Promise<string>;

  /**
   * Extract product goals from documentation
   */
  async extractProductGoals(docsPath: string): Promise<string[]>;

  /**
   * Create initial feature registry from planning session
   */
  async createRegistry(
    session: PlanningSession,
    outputPath: string
  ): Promise<FeatureRegistry>;

  /**
   * Interactive prompt helpers
   */
  private async promptElevatorPitch(): Promise<string>;
  private async promptProductGoals(): Promise<string[]>;
  private async promptTargetAudience(): Promise<string>;
  private async promptProjectType(): Promise<string>;
  private async promptFeatureSelection(suggestions: Feature[]): Promise<Feature[]>;
}
```

### GapAnalyzer Class

```typescript
import { Feature, GapAnalysis, Recommendation } from './types';

export class GapAnalyzer {
  /**
   * Analyze gaps between planned and implemented features
   */
  async analyzeGaps(registry: FeatureRegistry): Promise<GapAnalysis>;

  /**
   * Generate recommendations for next actions
   */
  async generateRecommendations(analysis: GapAnalysis): Promise<Recommendation[]>;

  /**
   * Calculate feature velocity (features completed per week)
   */
  async calculateVelocity(registry: FeatureRegistry, weeks: number): Promise<number>;

  /**
   * Predict completion date for in-progress features
   */
  async predictCompletion(feature: Feature, velocity: number): Promise<Date>;

  /**
   * Identify bottlenecks (categories with low completion rate)
   */
  async identifyBottlenecks(registry: FeatureRegistry): Promise<string[]>;
}
```

---

## CLI Implementation

### Command Structure

```typescript
import { Command } from 'commander';

const program = new Command();

program
  .name('planner')
  .description('Project planning and feature registry management')
  .version('1.0.0');

// Initialize new project
program
  .command('init [path]')
  .description('Initialize project planning interactively')
  .option('-t, --template <type>', 'Use template (saas-app, ecommerce, api-backend)')
  .action(async (path, options) => {
    // Implementation
  });

// Auto-discover features
program
  .command('discover [path]')
  .description('Auto-discover features from existing codebase')
  .option('-f, --frameworks <list>', 'Comma-separated framework list')
  .option('-m, --min-confidence <number>', 'Minimum confidence (0-100)', '50')
  .option('-o, --output <file>', 'Output CSV path', '.project-planner/features.csv')
  .action(async (path, options) => {
    // Implementation
  });

// Review discovered features
program
  .command('review')
  .description('Review and edit auto-discovered features')
  .option('-i, --input <file>', 'Input CSV path', '.project-planner/features.csv')
  .action(async (options) => {
    // Implementation
  });

// List features
program
  .command('list')
  .description('List features with optional filters')
  .option('-s, --status <status>', 'Filter by status')
  .option('-p, --priority <priority>', 'Filter by priority')
  .option('-c, --category <category>', 'Filter by category')
  .option('--format <format>', 'Output format (table, json, csv)', 'table')
  .action(async (options) => {
    // Implementation
  });

// Add feature manually
program
  .command('add')
  .description('Add a feature manually (interactive)')
  .option('-n, --name <name>', 'Feature name')
  .option('-d, --description <desc>', 'Feature description')
  .option('-p, --priority <priority>', 'Priority (P0-P3)')
  .option('-s, --status <status>', 'Status (planned, in-progress, implemented)')
  .action(async (options) => {
    // Implementation
  });

// Edit feature
program
  .command('edit <id>')
  .description('Edit an existing feature')
  .action(async (id) => {
    // Implementation
  });

// Remove feature
program
  .command('remove <id>')
  .description('Remove a feature from registry')
  .action(async (id) => {
    // Implementation
  });

// Export roadmap
program
  .command('export-roadmap')
  .description('Export feature roadmap')
  .option('-f, --format <format>', 'Output format (markdown, html, json)', 'markdown')
  .option('-o, --output <file>', 'Output file path')
  .action(async (options) => {
    // Implementation
  });

// Gap analysis
program
  .command('analyze-gaps')
  .description('Analyze implementation gaps')
  .option('-o, --output <file>', 'Output file path')
  .action(async (options) => {
    // Implementation
  });

// Generate elevator pitch
program
  .command('generate-pitch [path]')
  .description('Generate elevator pitch from code and docs')
  .action(async (path) => {
    // Implementation
  });

// Import from external tools
program
  .command('import <file>')
  .description('Import features from external tool (Jira, Linear, CSV)')
  .option('-t, --type <type>', 'Import type (jira, linear, csv)')
  .action(async (file, options) => {
    // Implementation
  });

// Sync with Analyzer/Manager
program
  .command('sync')
  .description('Sync feature registry with Analyzer and Manager')
  .action(async () => {
    // Implementation
  });

program.parse();
```

---

## Feature Detectors Implementation

### React Detector

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { parse } from '@babel/parser';
import traverse from '@babel/traverse';
import { FeatureSignal, FeatureDetector, DetectionContext } from '../types';

export class ReactDetector implements FeatureDetector {
  name = 'react';
  filePatterns = ['**/*.tsx', '**/*.jsx'];

  async detectSignals(filePath: string, content: string): Promise<FeatureSignal[]> {
    const signals: FeatureSignal[] = [];

    try {
      // Parse JSX/TSX with Babel
      const ast = parse(content, {
        sourceType: 'module',
        plugins: ['jsx', 'typescript'],
      });

      // Detect Route definitions
      traverse(ast, {
        JSXElement(path) {
          const openingElement = path.node.openingElement;
          const elementName = openingElement.name;

          // Check for Route components
          if (
            elementName.type === 'JSXIdentifier' &&
            elementName.name === 'Route'
          ) {
            const pathAttr = openingElement.attributes.find(
              (attr) =>
                attr.type === 'JSXAttribute' && attr.name.name === 'path'
            );
            const componentAttr = openingElement.attributes.find(
              (attr) =>
                attr.type === 'JSXAttribute' &&
                (attr.name.name === 'component' || attr.name.name === 'element')
            );

            if (pathAttr && componentAttr) {
              const routePath =
                pathAttr.value?.type === 'StringLiteral'
                  ? pathAttr.value.value
                  : '';
              const componentName =
                componentAttr.value?.type === 'JSXExpressionContainer'
                  ? this.extractComponentName(componentAttr.value)
                  : '';

              signals.push({
                type: 'route',
                file: filePath,
                name: this.routeToFeatureName(routePath, componentName),
                confidence: 70,
                metadata: {
                  framework: 'react',
                  pattern: `Route ${routePath}`,
                  context: componentName,
                },
              });
            }
          }

          // Check for major component definitions
          if (
            elementName.type === 'JSXIdentifier' &&
            this.isMajorComponent(elementName.name)
          ) {
            signals.push({
              type: 'component',
              file: filePath,
              name: this.componentToFeatureName(elementName.name),
              confidence: 60,
              metadata: {
                framework: 'react',
                pattern: `Component ${elementName.name}`,
              },
            });
          }
        },
      });
    } catch (error) {
      console.warn(`Failed to parse ${filePath}:`, error);
    }

    return signals;
  }

  calculateConfidence(signal: FeatureSignal, context: DetectionContext): number {
    let confidence = signal.confidence;

    // Boost confidence if tests exist
    if (context.hasTests) confidence += 15;

    // Boost if documented
    if (context.hasDocumentation) confidence += 10;

    // Boost if multiple related files
    if (context.fileCount > 1) confidence += 10;

    return Math.min(confidence, 100);
  }

  private routeToFeatureName(routePath: string, componentName: string): string {
    // Convert "/user-profile" → "User profile viewing"
    // Convert "/settings" → "Settings management"
    const cleaned = routePath.replace(/^\//, '').replace(/:[^\/]+/g, 'item');
    const words = cleaned.split(/[-_\/]/).filter(Boolean);
    const readable = words.map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

    return componentName ? `${readable} (${componentName})` : readable;
  }

  private componentToFeatureName(componentName: string): string {
    // Convert "ShoppingCart" → "Shopping cart"
    return componentName.replace(/([A-Z])/g, ' $1').trim();
  }

  private isMajorComponent(name: string): boolean {
    // Heuristic: Components with certain keywords are likely features
    const keywords = [
      'Dashboard',
      'Cart',
      'Checkout',
      'Profile',
      'Settings',
      'Payment',
      'Notification',
      'Admin',
      'Editor',
      'Form',
    ];
    return keywords.some((keyword) => name.includes(keyword));
  }

  private extractComponentName(node: any): string {
    // Extract component name from JSX expression
    if (node.expression.type === 'Identifier') {
      return node.expression.name;
    }
    return '';
  }
}
```

### Express Detector

```typescript
import * as fs from 'fs';
import { FeatureSignal, FeatureDetector, DetectionContext } from '../types';

export class ExpressDetector implements FeatureDetector {
  name = 'express';
  filePatterns = ['**/*.ts', '**/*.js'];

  async detectSignals(filePath: string, content: string): Promise<FeatureSignal[]> {
    const signals: FeatureSignal[] = [];

    // Regex patterns for Express routes
    const routePatterns = [
      /(?:app|router)\.(get|post|put|patch|delete)\s*\(\s*['"`]([^'"`]+)['"`]/g,
    ];

    for (const pattern of routePatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        const method = match[1];
        const route = match[2];

        signals.push({
          type: 'api',
          file: filePath,
          name: this.routeToFeatureName(method, route),
          confidence: 75,
          metadata: {
            framework: 'express',
            pattern: `${method.toUpperCase()} ${route}`,
          },
        });
      }
    }

    // Detect service classes
    const servicePattern = /class\s+(\w+Service)\s*\{/g;
    let match;
    while ((match = servicePattern.exec(content)) !== null) {
      const serviceName = match[1];
      signals.push({
        type: 'api',
        file: filePath,
        name: this.serviceToFeatureName(serviceName),
        confidence: 65,
        metadata: {
          framework: 'express',
          pattern: `Service ${serviceName}`,
        },
      });
    }

    return signals;
  }

  calculateConfidence(signal: FeatureSignal, context: DetectionContext): number {
    let confidence = signal.confidence;

    if (context.hasTests) confidence += 15;
    if (context.hasDocumentation) confidence += 10;
    if (context.fileCount > 2) confidence += 10;

    return Math.min(confidence, 100);
  }

  private routeToFeatureName(method: string, route: string): string {
    // POST /api/orders → "Order creation"
    // GET /api/users/:id → "User retrieval"
    const action = this.methodToAction(method);
    const resource = route.split('/').pop()?.replace(/:[^\/]+/g, '') || 'resource';
    const singular = resource.endsWith('s') ? resource.slice(0, -1) : resource;

    return `${singular.charAt(0).toUpperCase() + singular.slice(1)} ${action}`;
  }

  private methodToAction(method: string): string {
    const actionMap: Record<string, string> = {
      get: 'retrieval',
      post: 'creation',
      put: 'update',
      patch: 'update',
      delete: 'deletion',
    };
    return actionMap[method.toLowerCase()] || 'management';
  }

  private serviceToFeatureName(serviceName: string): string {
    // PaymentService → "Payment processing"
    return serviceName.replace(/Service$/, '').replace(/([A-Z])/g, ' $1').trim() + ' processing';
  }
}
```

### Config Detector

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { FeatureSignal, FeatureDetector, DetectionContext } from '../types';

export class ConfigDetector implements FeatureDetector {
  name = 'config';
  filePatterns = ['**/.env*', '**/config/**/*.{json,yaml,yml,js,ts}'];

  async detectSignals(filePath: string, content: string): Promise<FeatureSignal[]> {
    const signals: FeatureSignal[] = [];

    // Detect environment variables indicating integrations
    const envVarPatterns = [
      { pattern: /STRIPE_.*=/, name: 'Stripe payment integration' },
      { pattern: /AWS_.*=/, name: 'AWS cloud integration' },
      { pattern: /SENDGRID_.*=/, name: 'SendGrid email service' },
      { pattern: /GOOGLE_OAUTH_.*=/, name: 'Google OAuth login' },
      { pattern: /GITHUB_.*=/, name: 'GitHub integration' },
      { pattern: /REDIS_.*=/, name: 'Redis caching' },
      { pattern: /DATABASE_.*=/, name: 'Database connection' },
    ];

    for (const { pattern, name } of envVarPatterns) {
      if (pattern.test(content)) {
        signals.push({
          type: 'config',
          file: filePath,
          name,
          confidence: 80,
          metadata: {
            framework: 'config',
            pattern: pattern.toString(),
          },
        });
      }
    }

    // Detect feature flags
    const featureFlagPattern = /['"]?([a-zA-Z_]+)['"]?\s*:\s*(true|false)/g;
    let match;
    while ((match = featureFlagPattern.exec(content)) !== null) {
      const flagName = match[1];
      const flagValue = match[2];

      if (this.isFeatureFlag(flagName)) {
        signals.push({
          type: 'config',
          file: filePath,
          name: this.flagToFeatureName(flagName),
          confidence: flagValue === 'true' ? 70 : 50,
          metadata: {
            framework: 'config',
            pattern: `Feature flag ${flagName}`,
            context: `Enabled: ${flagValue}`,
          },
        });
      }
    }

    return signals;
  }

  calculateConfidence(signal: FeatureSignal, context: DetectionContext): number {
    return signal.confidence; // Config signals don't benefit much from context
  }

  private isFeatureFlag(name: string): boolean {
    const featureKeywords = [
      'enable',
      'disable',
      'feature',
      'toggle',
      'dark',
      'mode',
      'oauth',
      'export',
      'import',
    ];
    const lowerName = name.toLowerCase();
    return featureKeywords.some((keyword) => lowerName.includes(keyword));
  }

  private flagToFeatureName(flagName: string): string {
    // ENABLE_DARK_MODE → "Dark mode theme"
    return flagName
      .replace(/^(ENABLE|DISABLE|FEATURE)_/, '')
      .split('_')
      .map((w) => w.charAt(0) + w.slice(1).toLowerCase())
      .join(' ');
  }
}
```

---

## CSV Parser

```typescript
import * as fs from 'fs';
import Papa from 'papaparse';
import { Feature } from './types';

export class CSVParser {
  /**
   * Parse CSV file to Feature array
   */
  static async parse(filePath: string): Promise<Feature[]> {
    const content = fs.readFileSync(filePath, 'utf-8');

    return new Promise((resolve, reject) => {
      Papa.parse<Feature>(content, {
        header: true,
        dynamicTyping: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim(),
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn('CSV parsing warnings:', results.errors);
          }
          resolve(results.data);
        },
        error: (error) => {
          reject(new Error(`CSV parsing failed: ${error.message}`));
        },
      });
    });
  }

  /**
   * Convert Feature array to CSV string
   */
  static stringify(features: Feature[]): string {
    return Papa.unparse(features, {
      quotes: true, // Always quote fields (safer)
      header: true,
    });
  }

  /**
   * Save Feature array to CSV file
   */
  static async save(filePath: string, features: Feature[]): Promise<void> {
    const csv = this.stringify(features);
    fs.writeFileSync(filePath, csv, 'utf-8');
  }

  /**
   * Validate CSV structure
   */
  static validate(features: Feature[]): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    const requiredFields = [
      'id',
      'name',
      'description',
      'status',
      'priority',
      'created_at',
      'updated_at',
      'detected_by',
    ];

    for (let i = 0; i < features.length; i++) {
      const feature = features[i];

      // Check required fields
      for (const field of requiredFields) {
        if (!feature[field as keyof Feature]) {
          errors.push(`Row ${i + 1}: Missing required field "${field}"`);
        }
      }

      // Validate enums
      const validStatuses = ['planned', 'in-progress', 'implemented', 'deprecated'];
      if (!validStatuses.includes(feature.status)) {
        errors.push(`Row ${i + 1}: Invalid status "${feature.status}"`);
      }

      const validPriorities = ['P0', 'P1', 'P2', 'P3'];
      if (!validPriorities.includes(feature.priority)) {
        errors.push(`Row ${i + 1}: Invalid priority "${feature.priority}"`);
      }

      // Validate confidence range
      if (
        feature.implementation_confidence !== undefined &&
        (feature.implementation_confidence < 0 || feature.implementation_confidence > 100)
      ) {
        errors.push(
          `Row ${i + 1}: Confidence must be 0-100, got ${feature.implementation_confidence}`
        );
      }
    }

    return { valid: errors.length === 0, errors };
  }
}
```

---

## State Management

```typescript
import * as fs from 'fs';
import * as path from 'path';
import { ProductMetadata } from './types';

export interface PlannerState {
  lastUpdated: string;
  registryPath: string;
  projectMetadata: ProductMetadata;
  discoveryMetadata: {
    lastScan: string;
    filesScanned: number;
    featuresDiscovered: number;
    averageConfidence: number;
  };
  integration: {
    analyzerEnabled: boolean;
    managerEnabled: boolean;
    lastAnalyzerSync: string;
    lastManagerSync: string;
  };
}

export class StateManager {
  private statePath: string;
  private state: PlannerState | null = null;

  constructor(statePath: string = '.project-planner/state.json') {
    this.statePath = statePath;
  }

  /**
   * Load state from disk
   */
  async load(): Promise<PlannerState> {
    if (!fs.existsSync(this.statePath)) {
      this.state = this.createDefaultState();
      await this.save();
    } else {
      const content = fs.readFileSync(this.statePath, 'utf-8');
      this.state = JSON.parse(content);
    }
    return this.state!;
  }

  /**
   * Save state to disk
   */
  async save(): Promise<void> {
    if (!this.state) {
      throw new Error('State not loaded. Call load() first.');
    }

    this.state.lastUpdated = new Date().toISOString();

    const dir = path.dirname(this.statePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }

    fs.writeFileSync(this.statePath, JSON.stringify(this.state, null, 2));
  }

  /**
   * Update project metadata
   */
  async updateMetadata(metadata: Partial<ProductMetadata>): Promise<void> {
    if (!this.state) await this.load();
    this.state!.projectMetadata = { ...this.state!.projectMetadata, ...metadata };
    await this.save();
  }

  /**
   * Update discovery metadata
   */
  async updateDiscovery(updates: Partial<PlannerState['discoveryMetadata']>): Promise<void> {
    if (!this.state) await this.load();
    this.state!.discoveryMetadata = { ...this.state!.discoveryMetadata, ...updates };
    await this.save();
  }

  /**
   * Get current state
   */
  getState(): PlannerState {
    if (!this.state) {
      throw new Error('State not loaded. Call load() first.');
    }
    return this.state;
  }

  /**
   * Create default state
   */
  private createDefaultState(): PlannerState {
    return {
      lastUpdated: new Date().toISOString(),
      registryPath: '.project-planner/features.csv',
      projectMetadata: {
        elevatorPitch: '',
        productGoals: [],
        targetAudience: '',
        projectType: '',
      },
      discoveryMetadata: {
        lastScan: '',
        filesScanned: 0,
        featuresDiscovered: 0,
        averageConfidence: 0,
      },
      integration: {
        analyzerEnabled: false,
        managerEnabled: false,
        lastAnalyzerSync: '',
        lastManagerSync: '',
      },
    };
  }
}
```

---

## Testing Strategy

### Unit Tests

```typescript
// tests/registry.test.ts
describe('FeatureRegistry', () => {
  test('should add feature with auto-generated ID', async () => {
    const registry = new FeatureRegistry(':memory:');
    const feature = await registry.addFeature({
      name: 'User authentication',
      description: 'Allow users to log in',
      status: 'planned',
      priority: 'P0',
      // ... other fields
    });

    expect(feature.id).toBeDefined();
    expect(feature.created_at).toBeDefined();
  });

  test('should query features by status', async () => {
    const registry = new FeatureRegistry(':memory:');
    // ... add test features
    const planned = await registry.getByStatus('planned');
    expect(planned).toHaveLength(2);
  });
});

// tests/discovery.test.ts
describe('DiscoveryEngine', () => {
  test('should detect React routes', async () => {
    const engine = new DiscoveryEngine();
    const signals = await engine.scanCodebase({
      rootPath: './tests/fixtures/react-app',
      frameworks: ['react'],
    });

    expect(signals).toContainEqual(
      expect.objectContaining({
        type: 'route',
        name: expect.stringContaining('Dashboard'),
      })
    );
  });

  test('should cluster related signals', async () => {
    const signals = [
      { type: 'route', name: 'Login', file: 'auth/login.ts', confidence: 70 },
      { type: 'api', name: 'Login endpoint', file: 'api/auth.ts', confidence: 75 },
      { type: 'test', name: 'Login test', file: 'tests/auth.test.ts', confidence: 80 },
    ];

    const clusters = await engine.clusterSignals(signals);
    expect(clusters).toHaveLength(1);
    expect(clusters[0].primaryName).toContain('authentication');
  });
});
```

### Integration Tests

```typescript
// tests/integration.test.ts
describe('End-to-End Workflows', () => {
  test('Blue sky project initialization', async () => {
    // Simulate interactive prompts
    const session = await planningEngine.initializeProject();
    const registry = await planningEngine.createRegistry(session, './test-output/features.csv');

    expect(fs.existsSync('./test-output/features.csv')).toBe(true);
    const features = await registry.getAllFeatures();
    expect(features.length).toBeGreaterThan(0);
  });

  test('Reverse engineering existing codebase', async () => {
    const features = await discoveryEngine.discover({
      rootPath: './tests/fixtures/ecommerce-app',
      minConfidence: 70,
    });

    expect(features.length).toBeGreaterThan(5);
    expect(features.some((f) => f.name.includes('Cart'))).toBe(true);
  });

  test('Integration with Analyzer', async () => {
    // Create feature registry
    const registry = new FeatureRegistry('./test-output/features.csv');
    await registry.addFeature({
      name: 'User authentication',
      status: 'planned',
      // ...
    });

    // Simulate Analyzer detecting implementation
    const implementationStatus = await featureDetector.detectImplementation(
      registry.features[0],
      './tests/fixtures/app'
    );

    expect(implementationStatus.implemented).toBe(true);
    expect(implementationStatus.confidence).toBeGreaterThan(80);
  });
});
```

---

## Performance Considerations

### Codebase Scanning

- **Target**: Scan 1000 files/second
- **Strategy**: Parallel file processing with worker threads
- **Optimization**: Skip binary files, use streaming for large files

### CSV Operations

- **Challenge**: Large registries (500+ features)
- **Solution**: In-memory caching, lazy loading
- **Optimization**: Index by ID for O(1) lookups

### AST Parsing

- **Challenge**: Parsing large TypeScript/JSX files is slow
- **Solution**: Cache parsed ASTs, parse only changed files
- **Optimization**: Use faster parsers (SWC) if needed

---

## Security Considerations

1. **File Access**: Respect .gitignore, never scan sensitive files (.env with secrets)
2. **CSV Injection**: Sanitize user input in feature descriptions
3. **Path Traversal**: Validate all file paths before reading
4. **Secrets in Config**: Warn if detecting API keys in config files

---

## Future Enhancements

### Phase 2+

1. **AI-Powered Description Generation**: Use LLM to generate feature descriptions from code
2. **Visual Roadmap**: Generate interactive HTML timeline
3. **Jira/Linear Import**: Sync with external PM tools
4. **CI/CD Integration**: Auto-update status on deploy
5. **Slack Notifications**: Alert team when features are detected as complete

---

## Appendix

### Example Feature Templates

**SaaS Web App Template** (`templates/saas-app.csv`):
```csv
id,name,description,status,priority,category,timeline,owner,parent_id,implementation_files,implementation_confidence,created_at,updated_at,detected_by,notes
feat-saas-001,User authentication,"Allow users to sign up and log in with email/password. Support password reset via email.",planned,P0,Authentication,Q1 2025,Backend Team,,,0,2025-10-20T00:00:00Z,2025-10-20T00:00:00Z,manual,
feat-saas-002,User dashboard,"Provide a personalized dashboard showing user statistics and recent activity.",planned,P1,Core Features,Q1 2025,Frontend Team,,,0,2025-10-20T00:00:00Z,2025-10-20T00:00:00Z,manual,
feat-saas-003,Team collaboration,"Allow users to invite team members and collaborate on shared resources.",planned,P1,Collaboration,Q2 2025,Full Stack Team,,,0,2025-10-20T00:00:00Z,2025-10-20T00:00:00Z,manual,
feat-saas-004,Billing and subscriptions,"Integrate Stripe for subscription billing with multiple pricing tiers.",planned,P0,Payments,Q2 2025,Backend Team,,,0,2025-10-20T00:00:00Z,2025-10-20T00:00:00Z,manual,
```

**E-commerce Template** (`templates/ecommerce.csv`):
```csv
id,name,description,status,priority,category,timeline,owner,parent_id,implementation_files,implementation_confidence,created_at,updated_at,detected_by,notes
feat-ecom-001,Product catalog,"Display products with images, descriptions, prices, and search functionality.",planned,P0,Core Features,Q1 2025,Frontend Team,,,0,2025-10-20T00:00:00Z,2025-10-20T00:00:00Z,manual,
feat-ecom-002,Shopping cart,"Allow users to add products to cart, update quantities, and calculate totals.",planned,P0,Core Features,Q1 2025,Full Stack Team,,,0,2025-10-20T00:00:00Z,2025-10-20T00:00:00Z,manual,
feat-ecom-003,Checkout process,"Multi-step checkout with shipping address, payment, and order confirmation.",planned,P0,Core Features,Q1 2025,Full Stack Team,,,0,2025-10-20T00:00:00Z,2025-10-20T00:00:00Z,manual,
feat-ecom-004,Payment processing,"Integrate Stripe for credit card payments with support for refunds and webhooks.",planned,P0,Payments,Q1 2025,Backend Team,,,0,2025-10-20T00:00:00Z,2025-10-20T00:00:00Z,manual,
```

---

**Document Status**: ✅ Technical Spec Complete
**Version**: 1.0
**Last Updated**: 2025-10-20
