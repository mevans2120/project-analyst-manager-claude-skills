/**
 * Tests for DashboardSync
 */

import * as fs from 'fs';
import * as path from 'path';
import { DashboardSync } from '../src/core/DashboardSync';
import { Feature, DashboardData } from '../src/types/dashboard';

describe('DashboardSync', () => {
  const testDir = path.join(__dirname, 'test-dashboard');
  const dashboardDir = path.join(testDir, 'dashboard');
  const dashboardPath = path.join(dashboardDir, 'data.js');

  // Use real dashboard data from the actual project
  const mockDashboardData: DashboardData = {
    project: {
      name: 'Project Management Suite',
      code: 'PM',
      status: 'active',
      phase: 'Phase 0 Complete'
    },
    current: [],
    features: {
      shipped: [
        {
          id: 'shared-webfetcher',
          number: 1,
          name: 'WebFetcher - Static HTML Analysis',
          category: 'Shared Library',
          phase: 'Phase 0',
          value: 'Foundation for all web viewing',
          shippedDate: '2025-10-22'
        },
        {
          id: 'planner-registry',
          number: 3,
          name: 'CSV Feature Registry',
          category: 'Planner',
          phase: 'Phase 1',
          value: 'Single source of truth for features',
          shippedDate: '2025-10-22'
        },
        {
          id: 'analyzer-v10',
          name: 'Analyzer v1.0 - TODO Scanner',
          category: 'Analyzer',
          phase: 'Phase 2',
          value: 'Scans 20+ file types for TODOs',
          shippedDate: '2025-10-17'
        }
      ],
      inProgress: [],
      nextUp: [],
      backlog: [
        {
          id: 'planner-web-discovery',
          number: 8,
          name: 'Web-Based Feature Discovery',
          category: 'Planner',
          phase: 'Phase 1',
          priority: 'P1',
          dependencies: ['shared-extractors', 'planner-registry'],
          value: 'Discover features by analyzing live websites'
        },
        {
          id: 'analyzer-verification',
          number: 10,
          name: 'Production Verification (3-tier)',
          category: 'Analyzer',
          phase: 'Phase 2',
          priority: 'P1',
          dependencies: ['shared-extractors'],
          value: 'Verify features work in production'
        },
        {
          id: 'manager-screenshots',
          number: 12,
          name: 'Screenshot Documentation for Issues',
          category: 'Manager',
          phase: 'Phase 3',
          priority: 'P2',
          dependencies: ['shared-screenshot'],
          value: 'Attach visual evidence to GitHub issues'
        }
      ]
    },
    priorityQueue: [],
    stats: {
      shipped: 3,
      inProgress: 0,
      nextUp: 0,
      backlog: 3,
      total: 6
    }
  };

  beforeEach(() => {
    // Reset mock dashboard data to avoid mutation across tests
    mockDashboardData.features.shipped = [
      {
        id: 'shared-webfetcher',
        number: 1,
        name: 'WebFetcher - Static HTML Analysis',
        category: 'Shared Library',
        phase: 'Phase 0',
        value: 'Foundation for all web viewing',
        shippedDate: '2025-10-22'
      },
      {
        id: 'planner-registry',
        number: 3,
        name: 'CSV Feature Registry',
        category: 'Planner',
        phase: 'Phase 1',
        value: 'Single source of truth for features',
        shippedDate: '2025-10-22'
      },
      {
        id: 'analyzer-v10',
        name: 'Analyzer v1.0 - TODO Scanner',
        category: 'Analyzer',
        phase: 'Phase 2',
        value: 'Scans 20+ file types for TODOs',
        shippedDate: '2025-10-17'
      }
    ];

    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }

    // Create test directory structure
    fs.mkdirSync(testDir, { recursive: true });
    fs.mkdirSync(dashboardDir, { recursive: true });

    // Write mock dashboard data
    const dashboardContent = `const productRoadmap = ${JSON.stringify(mockDashboardData, null, 2)};`;
    fs.writeFileSync(dashboardPath, dashboardContent);
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(testDir)) {
      fs.rmSync(testDir, { recursive: true });
    }
  });

  describe('readDashboard', () => {
    it('should read and parse dashboard data', async () => {
      const sync = new DashboardSync(testDir);
      const data = await sync.readDashboard();

      expect(data.project.name).toBe('Project Management Suite');
      expect(data.features.shipped).toHaveLength(3);
      expect(data.features.backlog).toHaveLength(3);
    });

    it('should throw error if dashboard file does not exist', async () => {
      fs.unlinkSync(dashboardPath);
      const sync = new DashboardSync(testDir);

      await expect(sync.readDashboard()).rejects.toThrow();
    });
  });

  describe('checkFeatureExists', () => {
    it('should return low confidence when feature files do not exist', async () => {
      const sync = new DashboardSync(testDir);
      const feature: Feature = {
        id: 'shared-webfetcher',
        name: 'WebFetcher - Static HTML Analysis',
        category: 'Shared Library',
        phase: 'Phase 0',
        value: 'Test feature'
      };

      const status = await sync.checkFeatureExists(feature);

      expect(status.exists).toBe(false);
      expect(status.hasImplementation).toBe(false);
      expect(status.hasTests).toBe(false);
      expect(status.confidence).toBe('low');
    });

    it('should return medium confidence when feature has implementation but no tests', async () => {
      // Create implementation file for WebFetcher
      const implDir = path.join(testDir, 'shared', 'src', 'core');
      fs.mkdirSync(implDir, { recursive: true });
      fs.writeFileSync(path.join(implDir, 'WebFetcher.ts'), 'export class WebFetcher {}');

      const sync = new DashboardSync(testDir);
      const feature: Feature = {
        id: 'shared-webfetcher',
        name: 'WebFetcher - Static HTML Analysis',
        category: 'Shared Library',
        phase: 'Phase 0',
        value: 'Test feature'
      };

      const status = await sync.checkFeatureExists(feature);

      expect(status.exists).toBe(true);
      expect(status.hasImplementation).toBe(true);
      expect(status.hasTests).toBe(false);
      expect(status.confidence).toBe('medium');
    });

    it('should return high confidence when feature has both implementation and tests', async () => {
      // Create implementation file for WebFetcher
      const implDir = path.join(testDir, 'shared', 'src', 'core');
      fs.mkdirSync(implDir, { recursive: true });
      fs.writeFileSync(path.join(implDir, 'WebFetcher.ts'), 'export class WebFetcher {}');

      // Create test file in the SAME directory (the code checks this first)
      fs.writeFileSync(path.join(implDir, 'WebFetcher.test.ts'), 'test suite');

      const sync = new DashboardSync(testDir);
      const feature: Feature = {
        id: 'shared-webfetcher',
        name: 'WebFetcher - Static HTML Analysis',
        category: 'Shared Library',
        phase: 'Phase 0',
        value: 'Test feature'
      };

      const status = await sync.checkFeatureExists(feature);

      expect(status.exists).toBe(true);
      expect(status.hasImplementation).toBe(true);
      expect(status.hasTests).toBe(true);
      expect(status.confidence).toBe('high');
    });
  });

  describe('generateReport', () => {
    it('should generate report with no issues when all shipped features exist', async () => {
      // Create implementation files for shipped features
      const sharedDir = path.join(testDir, 'shared', 'src', 'core');
      fs.mkdirSync(sharedDir, { recursive: true });
      fs.writeFileSync(path.join(sharedDir, 'WebFetcher.ts'), 'export class WebFetcher {}');

      const plannerDir = path.join(testDir, 'project-planner', 'src', 'core');
      fs.mkdirSync(plannerDir, { recursive: true });
      fs.writeFileSync(path.join(plannerDir, 'FeatureRegistry.ts'), 'export class FeatureRegistry {}');

      const analyzerDir = path.join(testDir, 'project-analyzer', 'src', 'core');
      fs.mkdirSync(analyzerDir, { recursive: true });
      fs.writeFileSync(path.join(analyzerDir, 'scanner.ts'), 'export function scanTodos() {}');
      fs.writeFileSync(path.join(analyzerDir, 'patterns.ts'), 'export const patterns = []');

      const sync = new DashboardSync(testDir);
      const report = await sync.generateReport();

      expect(report.upToDate).toBe(true);
      expect(report.falsePositives).toHaveLength(0);
      expect(report.missingFromDashboard).toHaveLength(0);
    });

    it('should detect false positives when shipped features do not exist', async () => {
      const sync = new DashboardSync(testDir);
      const report = await sync.generateReport();

      expect(report.upToDate).toBe(false);
      expect(report.falsePositives.length).toBeGreaterThan(0);
    });

    it('should skip completed features detection when no inProgress features', async () => {
      // We have no in-progress features in our mock data, so this test
      // just ensures the report still works correctly
      const sync = new DashboardSync(testDir);
      const report = await sync.generateReport();

      // Should detect false positives for missing files
      expect(report.falsePositives.length).toBeGreaterThan(0);
    });

    it('should recommend features for Next Up based on dependencies', async () => {
      // In our mock dashboard:
      // - planner-web-discovery depends on: shared-extractors, planner-registry
      // - analyzer-verification depends on: shared-extractors
      // - manager-screenshots depends on: shared-screenshot
      // Only planner-registry is shipped, so no features should be fully ready

      const sync = new DashboardSync(testDir);
      const report = await sync.generateReport();

      // None of the backlog features should be recommended since dependencies aren't met
      expect(report.recommendedNextUp).toHaveLength(0);
    });

    it('should recommend features when dependencies are met', async () => {
      // Let's add shared-extractors to shipped so analyzer-verification becomes ready
      mockDashboardData.features.shipped.push({
        id: 'shared-extractors',
        number: 6,
        name: 'Feature Extractors Suite',
        category: 'Shared Library',
        phase: 'Phase 0',
        value: 'Complete extraction suite',
        shippedDate: '2025-10-22'
      });

      // Re-write the dashboard file
      const dashboardContent = `const productRoadmap = ${JSON.stringify(mockDashboardData, null, 2)};`;
      fs.writeFileSync(dashboardPath, dashboardContent);

      const sync = new DashboardSync(testDir);
      const report = await sync.generateReport();

      // Now analyzer-verification should be recommended (depends only on shared-extractors)
      const analyzerVerification = report.recommendedNextUp.find(f => f.id === 'analyzer-verification');
      expect(analyzerVerification).toBeDefined();

      // planner-web-discovery still depends on both shared-extractors AND planner-registry
      // Since both are now shipped, it should also be recommended
      const webDiscovery = report.recommendedNextUp.find(f => f.id === 'planner-web-discovery');
      expect(webDiscovery).toBeDefined();
    });
  });

  describe('formatReport', () => {
    it('should format report as markdown', async () => {
      const sync = new DashboardSync(testDir);
      const report = await sync.generateReport();
      const formatted = sync.formatReport(report);

      expect(formatted).toContain('# Dashboard Sync Report');
      expect(formatted).toContain('## 📋 Summary');
      // May or may not have recommendations depending on dependencies
    });

    it('should show up to date status when dashboard is accurate', async () => {
      // Create all files to make dashboard accurate
      const sharedDir = path.join(testDir, 'shared', 'src', 'core');
      fs.mkdirSync(sharedDir, { recursive: true });
      fs.writeFileSync(path.join(sharedDir, 'WebFetcher.ts'), 'export class WebFetcher {}');

      const plannerDir = path.join(testDir, 'project-planner', 'src', 'core');
      fs.mkdirSync(plannerDir, { recursive: true });
      fs.writeFileSync(path.join(plannerDir, 'FeatureRegistry.ts'), 'export class FeatureRegistry {}');

      const analyzerDir = path.join(testDir, 'project-analyzer', 'src', 'core');
      fs.mkdirSync(analyzerDir, { recursive: true });
      fs.writeFileSync(path.join(analyzerDir, 'scanner.ts'), 'export function scanTodos() {}');
      fs.writeFileSync(path.join(analyzerDir, 'patterns.ts'), 'export const patterns = []');

      const sync = new DashboardSync(testDir);
      const report = await sync.generateReport();
      const formatted = sync.formatReport(report);

      expect(formatted).toContain('✅ Status: Up to Date');
      expect(formatted).toContain('✅ Dashboard is up to date!');
    });

    it('should show warnings when dashboard has issues', async () => {
      const sync = new DashboardSync(testDir);
      const report = await sync.generateReport();
      const formatted = sync.formatReport(report);

      expect(formatted).toContain('⚠️ Status: Updates Needed');
      expect(formatted).toContain('shipped feature(s) appear incomplete');
    });
  });
});
