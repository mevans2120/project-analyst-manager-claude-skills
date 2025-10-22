/**
 * Tests for RoadmapExporter
 * PM-56: Roadmap Export (Markdown/HTML/JSON)
 */

import { RoadmapExporter } from '../src/core/RoadmapExporter';
import { CSVFeatureRegistry } from '../src/core/FeatureRegistry';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type { Feature } from '../src/types';

describe('RoadmapExporter', () => {
  let tempDir: string;
  let registryPath: string;
  let registry: CSVFeatureRegistry;
  let exporter: RoadmapExporter;

  const sampleFeatures: Feature[] = [
    {
      id: 'test-feature-1',
      number: 1,
      name: 'User Login',
      description: 'Email/password authentication',
      category: 'Auth',
      phase: 'Phase 1',
      priority: 'P0',
      status: 'completed',
      dependencies: [],
      blocks: ['test-feature-3'],
      value: 'Core authentication feature'
    },
    {
      id: 'test-feature-2',
      number: 2,
      name: 'Dashboard',
      description: 'Main dashboard view',
      category: 'UI',
      phase: 'Phase 1',
      priority: 'P1',
      status: 'in-progress',
      dependencies: ['test-feature-1'],
      blocks: [],
      value: 'Central user interface'
    },
    {
      id: 'test-feature-3',
      number: 3,
      name: 'User Profile',
      description: 'View and edit user profile',
      category: 'User',
      phase: 'Phase 1',
      priority: 'P1',
      status: 'planned',
      dependencies: ['test-feature-1'],
      blocks: [],
      value: 'User account management'
    },
    {
      id: 'test-feature-4',
      number: 4,
      name: 'Analytics',
      description: 'Usage analytics and reporting',
      category: 'Analytics',
      phase: 'Phase 2',
      priority: 'P2',
      status: 'planned',
      dependencies: ['test-feature-2'],
      blocks: [],
      value: 'Business insights'
    },
    {
      id: 'test-feature-5',
      number: 5,
      name: 'Notifications',
      description: 'Real-time notifications',
      category: 'Communication',
      phase: 'Phase 2',
      priority: 'P1',
      status: 'blocked',
      dependencies: ['test-feature-2'],
      blocks: [],
      value: 'User engagement'
    }
  ];

  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'roadmap-exporter-test-'));
    registryPath = path.join(tempDir, 'features.csv');

    // Create registry with sample features
    registry = new CSVFeatureRegistry({
      filePath: registryPath,
      createIfMissing: true
    });

    await registry.init({ project: { name: 'Test Project', code: 'TEST' } });

    // Add sample features
    for (const feature of sampleFeatures) {
      await registry.addFeature(feature);
    }

    exporter = new RoadmapExporter(registryPath);
  });

  afterEach(async () => {
    try {
      await fs.rm(tempDir, { recursive: true, force: true });
    } catch (e) {
      // Ignore cleanup errors
    }
  });

  describe('initialization', () => {
    it('should create exporter with registry path', () => {
      expect(exporter).toBeInstanceOf(RoadmapExporter);
    });
  });

  describe('export - Markdown format', () => {
    it('should export roadmap as Markdown', () => {
      const markdown = exporter.export('markdown');

      expect(markdown).toBeDefined();
      expect(typeof markdown).toBe('string');
      expect(markdown).toContain('# Test Project - Product Roadmap');
      expect(markdown).toContain('## Progress Overview');
    });

    it('should include progress stats in Markdown', () => {
      const markdown = exporter.export('markdown');

      expect(markdown).toContain('**Total Features**');
      expect(markdown).toContain('**Completed**');
      expect(markdown).toContain('**In Progress**');
      expect(markdown).toContain('**Planned**');
    });

    it('should include progress bar in Markdown', () => {
      const markdown = exporter.export('markdown');

      expect(markdown).toContain('**Progress**:');
      expect(markdown).toMatch(/█+░+/); // Progress bar characters
      expect(markdown).toMatch(/\d+%/); // Percentage
    });

    it('should group features by status', () => {
      const markdown = exporter.export('markdown');

      expect(markdown).toContain('## 🚧 In Progress');
      expect(markdown).toContain('## 📋 Planned');
    });

    it('should include feature details', () => {
      const markdown = exporter.export('markdown');

      expect(markdown).toContain('Dashboard (TEST-2)');
      expect(markdown).toContain('Main dashboard view');
      expect(markdown).toContain('**Category**: UI');
      expect(markdown).toContain('**Phase**: Phase 1');
      expect(markdown).toContain('**Priority**: P1');
    });

    it('should include feature values', () => {
      const markdown = exporter.export('markdown');

      expect(markdown).toContain('**Value**: Central user interface');
      expect(markdown).toContain('**Value**: User account management');
    });

    it('should include dependencies', () => {
      const markdown = exporter.export('markdown');

      expect(markdown).toContain('**Dependencies**: test-feature-1');
    });

    it('should include completed features when option is true', () => {
      const markdown = exporter.export('markdown', { includeCompleted: true });

      expect(markdown).toContain('## ✅ Completed');
      expect(markdown).toContain('User Login (TEST-1)');
    });

    it('should exclude completed features by default', () => {
      const markdown = exporter.export('markdown');

      expect(markdown).not.toContain('## ✅ Completed');
    });

    it('should include blocked features when option is true', () => {
      const markdown = exporter.export('markdown', { includeBlocked: true });

      expect(markdown).toContain('## 🚫 Blocked');
      expect(markdown).toContain('Notifications (TEST-5)');
    });

    it('should exclude blocked features by default', () => {
      const markdown = exporter.export('markdown');

      expect(markdown).not.toContain('## 🚫 Blocked');
    });

    it('should include dependency graph when option is true', () => {
      const markdown = exporter.export('markdown', {
        includeDependencies: true,
        includeCompleted: true
      });

      expect(markdown).toContain('## Dependencies');
      expect(markdown).toContain('**Depends on**:');
      expect(markdown).toContain('**Blocks**:');
    });
  });

  describe('export - HTML format', () => {
    it('should export roadmap as HTML', () => {
      const html = exporter.export('html');

      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('<html');
      expect(html).toContain('</html>');
    });

    it('should include project name in HTML', () => {
      const html = exporter.export('html');

      expect(html).toContain('<title>Test Project - Product Roadmap</title>');
      expect(html).toContain('<h1>Test Project</h1>');
    });

    it('should include responsive meta tag', () => {
      const html = exporter.export('html');

      expect(html).toContain('viewport');
      expect(html).toContain('width=device-width');
    });

    it('should include dark theme styling', () => {
      const html = exporter.export('html');

      expect(html).toContain('<style>');
      expect(html).toContain('background:');
      expect(html).toContain('#0d1117'); // Dark background
      expect(html).toContain('#c9d1d9'); // Light text
    });

    it('should include stats cards in HTML', () => {
      const html = exporter.export('html');

      expect(html).toContain('stat-value');
      expect(html).toContain('stat-label');
      expect(html).toContain('Total Features');
      expect(html).toContain('Completed');
      expect(html).toContain('In Progress');
      expect(html).toContain('Planned');
    });

    it('should include progress bar in HTML', () => {
      const html = exporter.export('html');

      expect(html).toContain('progress-bar');
      expect(html).toContain('progress-fill');
      expect(html).toMatch(/width:\s*\d+%/); // Progress percentage
    });

    it('should include feature cards in HTML', () => {
      const html = exporter.export('html');

      expect(html).toContain('feature-card');
      expect(html).toContain('feature-title');
      expect(html).toContain('feature-description');
      expect(html).toContain('Dashboard (TEST-2)');
    });

    it('should include feature badges in HTML', () => {
      const html = exporter.export('html');

      expect(html).toContain('badge badge-category');
      expect(html).toContain('badge badge-phase');
      expect(html).toContain('badge badge-priority');
    });

    it('should include feature values in HTML', () => {
      const html = exporter.export('html');

      expect(html).toContain('feature-value');
      expect(html).toContain('💎');
      expect(html).toContain('Central user interface');
    });

    it('should include dependencies in HTML', () => {
      const html = exporter.export('html');

      expect(html).toContain('dependencies');
      expect(html).toContain('<strong>Dependencies:</strong>');
      expect(html).toContain('test-feature-1');
    });

    it('should include emoji section headers', () => {
      const html = exporter.export('html');

      expect(html).toContain('🚧 In Progress');
      expect(html).toContain('📋 Planned');
    });
  });

  describe('export - JSON format', () => {
    it('should export roadmap as JSON', () => {
      const json = exporter.export('json');

      expect(json).toBeDefined();
      expect(typeof json).toBe('string');

      const parsed = JSON.parse(json);
      expect(parsed).toBeDefined();
    });

    it('should include project metadata in JSON', () => {
      const json = exporter.export('json');
      const parsed = JSON.parse(json);

      expect(parsed.project).toBeDefined();
      expect(parsed.project.name).toBe('Test Project');
      expect(parsed.project.code).toBe('TEST');
    });

    it('should include features grouped by status in JSON', () => {
      const json = exporter.export('json');
      const parsed = JSON.parse(json);

      expect(parsed.features).toBeDefined();
      expect(parsed.features.planned).toBeDefined();
      expect(parsed.features.inProgress).toBeDefined();
      expect(parsed.features.completed).toBeDefined();
      expect(parsed.features.blocked).toBeDefined();

      expect(Array.isArray(parsed.features.planned)).toBe(true);
      expect(Array.isArray(parsed.features.inProgress)).toBe(true);
    });

    it('should include stats in JSON', () => {
      const json = exporter.export('json');
      const parsed = JSON.parse(json);

      expect(parsed.stats).toBeDefined();
      expect(parsed.stats.total).toBe(5);
      expect(parsed.stats.completed).toBe(1);
      expect(parsed.stats.inProgress).toBe(1);
      expect(parsed.stats.planned).toBe(2);
      expect(parsed.stats.blocked).toBe(1);
      expect(parsed.stats.completionPercentage).toBe(20); // 1/5 = 20%
    });

    it('should include dependency chains in JSON', () => {
      const json = exporter.export('json');
      const parsed = JSON.parse(json);

      expect(parsed.dependencyChains).toBeDefined();
      expect(Array.isArray(parsed.dependencyChains)).toBe(true);
      expect(parsed.dependencyChains.length).toBe(5);

      const loginFeature = parsed.dependencyChains.find((c: any) => c.feature === 'test-feature-1');
      expect(loginFeature).toBeDefined();
      expect(loginFeature.dependencies).toEqual([]);
      expect(loginFeature.blocks).toContain('test-feature-3');
    });
  });

  describe('groupBy option', () => {
    it('should group features by phase', () => {
      const markdown = exporter.export('markdown', { groupBy: 'phase' });

      expect(markdown).toContain('### Phase 1');
      expect(markdown).toContain('### Phase 2');
    });

    it('should group features by category', () => {
      const markdown = exporter.export('markdown', {
        groupBy: 'category',
        includeCompleted: true,
        includeBlocked: true
      });

      expect(markdown).toContain('### Auth');
      expect(markdown).toContain('### UI');
      expect(markdown).toContain('### User');
    });

    it('should group features by priority', () => {
      const markdown = exporter.export('markdown', {
        groupBy: 'priority',
        includeCompleted: true,
        includeBlocked: true
      });

      expect(markdown).toContain('### P0');
      expect(markdown).toContain('### P1');
      expect(markdown).toContain('### P2');
    });

    it('should group features by status', () => {
      const markdown = exporter.export('markdown', {
        groupBy: 'status',
        includeCompleted: true,
        includeBlocked: true
      });

      expect(markdown).toContain('### in-progress');
      expect(markdown).toContain('### planned');
      expect(markdown).toContain('### completed');
      expect(markdown).toContain('### blocked');
    });
  });

  describe('exportToFile', () => {
    it('should export Markdown to file', async () => {
      const outputPath = path.join(tempDir, 'roadmap.md');

      await exporter.exportToFile('markdown', outputPath);

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('# Test Project - Product Roadmap');
    });

    it('should export HTML to file', async () => {
      const outputPath = path.join(tempDir, 'roadmap.html');

      await exporter.exportToFile('html', outputPath);

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('Test Project');
    });

    it('should export JSON to file', async () => {
      const outputPath = path.join(tempDir, 'roadmap.json');

      await exporter.exportToFile('json', outputPath);

      const content = await fs.readFile(outputPath, 'utf-8');
      const parsed = JSON.parse(content);
      expect(parsed.project.name).toBe('Test Project');
    });

    it('should create output directory if it does not exist', async () => {
      const outputPath = path.join(tempDir, 'nested', 'deep', 'roadmap.md');

      await exporter.exportToFile('markdown', outputPath);

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toBeDefined();
    });

    it('should pass options to export', async () => {
      const outputPath = path.join(tempDir, 'roadmap.md');

      await exporter.exportToFile('markdown', outputPath, {
        includeCompleted: true,
        groupBy: 'phase'
      });

      const content = await fs.readFile(outputPath, 'utf-8');
      expect(content).toContain('## ✅ Completed');
      expect(content).toContain('### Phase 1');
    });
  });

  describe('progress calculation', () => {
    it('should calculate completion percentage correctly', () => {
      const json = exporter.export('json');
      const parsed = JSON.parse(json);

      // 1 completed out of 5 total = 20%
      expect(parsed.stats.completionPercentage).toBe(20);
    });

    it('should show 100% when all features are completed', async () => {
      // Update all features to completed
      const features = registry.getAllFeatures();
      for (const feature of features) {
        await registry.updateFeature(feature.id, { status: 'completed' });
      }

      const newExporter = new RoadmapExporter(registryPath);
      const json = newExporter.export('json');
      const parsed = JSON.parse(json);

      expect(parsed.stats.completionPercentage).toBe(100);
    });

    it('should show 0% when no features are completed', async () => {
      // Update all features to planned
      const features = registry.getAllFeatures();
      for (const feature of features) {
        await registry.updateFeature(feature.id, { status: 'planned' });
      }

      const newExporter = new RoadmapExporter(registryPath);
      const json = newExporter.export('json');
      const parsed = JSON.parse(json);

      expect(parsed.stats.completionPercentage).toBe(0);
    });

    it('should handle empty registry', async () => {
      // Create empty registry
      const emptyRegistryPath = path.join(tempDir, 'empty-features.csv');
      const emptyRegistry = new CSVFeatureRegistry({
        filePath: emptyRegistryPath,
        createIfMissing: true
      });
      await emptyRegistry.init({ project: { name: 'Empty Project', code: 'EMPTY' } });

      const emptyExporter = new RoadmapExporter(emptyRegistryPath);
      const json = emptyExporter.export('json');
      const parsed = JSON.parse(json);

      expect(parsed.stats.total).toBe(0);
      expect(parsed.stats.completionPercentage).toBe(0);
    });
  });

  describe('error handling', () => {
    it('should throw error for unknown export format', () => {
      expect(() => {
        exporter.export('xml' as any);
      }).toThrow('Unknown export format: xml');
    });

    it('should handle missing registry file gracefully', () => {
      expect(() => {
        new RoadmapExporter('/nonexistent/path.csv');
      }).toThrow('Registry file not found: /nonexistent/path.csv');
    });
  });

  describe('edge cases', () => {
    it('should handle features with no dependencies', () => {
      const markdown = exporter.export('markdown', { includeDependencies: true });

      // Feature 1 has no dependencies but blocks feature 3
      expect(markdown).toContain('test-feature-1');
    });

    it('should handle features with no blocks', () => {
      const markdown = exporter.export('markdown', { includeDependencies: true });

      // Most features have no blocks
      const blockCount = (markdown.match(/\*\*Blocks\*\*/g) || []).length;
      expect(blockCount).toBeLessThanOrEqual(5);
    });

    it('should handle features with no value field', async () => {
      // Add feature with empty value
      await registry.addFeature({
        id: 'test-no-value',
        name: 'No Value Feature',
        description: 'Feature without value',
        category: 'Test',
        phase: 'Phase 1',
        priority: 'P2',
        status: 'planned',
        dependencies: [],
        blocks: [],
        value: ''
      });

      const newExporter = new RoadmapExporter(registryPath);
      const markdown = newExporter.export('markdown');

      expect(markdown).toContain('No Value Feature');
      // Should not crash or show undefined
      expect(markdown).not.toContain('undefined');
    });

    it('should handle features with empty dependencies array', () => {
      const json = exporter.export('json', { includeCompleted: true });
      const parsed = JSON.parse(json);

      // Feature-1 (completed) has no dependencies
      const featureWithNoDeps = parsed.features.completed.find(
        (f: any) => f.dependencies.length === 0
      );

      expect(featureWithNoDeps).toBeDefined();
    });

    it('should handle project with no description', () => {
      const markdown = exporter.export('markdown');

      // Should not show undefined or crash
      expect(markdown).not.toContain('undefined');
      expect(markdown).toContain('# Test Project - Product Roadmap');
    });
  });

  describe('formatting consistency', () => {
    it('should use consistent heading levels in Markdown', () => {
      const markdown = exporter.export('markdown');

      expect(markdown).toContain('# Test Project'); // H1
      expect(markdown).toContain('## Progress Overview'); // H2
      expect(markdown).toContain('## 🚧 In Progress'); // H2
      expect(markdown).toContain('#### Dashboard'); // H4 for features
    });

    it('should use consistent badge styling in HTML', () => {
      const html = exporter.export('html');

      // All badges should have badge class
      const badgeCount = (html.match(/class="badge/g) || []).length;
      expect(badgeCount).toBeGreaterThan(0);

      // Should have specific badge types
      expect(html).toContain('badge badge-category');
      expect(html).toContain('badge badge-phase');
      expect(html).toContain('badge badge-priority');
    });

    it('should format numbers consistently', () => {
      const json = exporter.export('json');
      const parsed = JSON.parse(json);

      // All feature numbers should be integers
      parsed.features.planned.forEach((f: Feature) => {
        expect(Number.isInteger(f.number)).toBe(true);
      });

      // Stats should be integers
      expect(Number.isInteger(parsed.stats.total)).toBe(true);
      expect(Number.isInteger(parsed.stats.completed)).toBe(true);
      expect(Number.isInteger(parsed.stats.completionPercentage)).toBe(true);
    });
  });
});
