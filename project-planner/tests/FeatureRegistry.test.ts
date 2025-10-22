/**
 * Tests for CSV Feature Registry
 */

import * as fs from 'fs';
import * as path from 'path';
import { CSVFeatureRegistry } from '../src/core/FeatureRegistry';
import { Feature } from '../src/types';

describe('CSVFeatureRegistry', () => {
  const testFilePath = path.join(__dirname, 'test-registry.csv');

  afterEach(() => {
    // Cleanup test file
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  });

  describe('initialization', () => {
    it('should create a new registry file when createIfMissing is true', () => {
      const registry = new CSVFeatureRegistry({
        filePath: testFilePath,
        createIfMissing: true
      });

      expect(fs.existsSync(testFilePath)).toBe(true);
      expect(registry.getAllFeatures()).toHaveLength(0);
    });

    it('should throw error when file does not exist and createIfMissing is false', () => {
      expect(() => {
        new CSVFeatureRegistry({
          filePath: testFilePath,
          createIfMissing: false
        });
      }).toThrow();
    });
  });

  describe('CRUD operations', () => {
    let registry: CSVFeatureRegistry;

    beforeEach(() => {
      registry = new CSVFeatureRegistry({
        filePath: testFilePath,
        createIfMissing: true,
        autoSave: false // Disable auto-save for tests
      });
    });

    it('should add a feature', () => {
      const feature = registry.addFeature({
        id: 'test-feature-1',
        name: 'Test Feature',
        description: 'A test feature',
        category: 'Testing',
        phase: 'Phase 1',
        priority: 'P0',
        status: 'planned',
        dependencies: [],
        blocks: [],
        value: 'Test value'
      });

      expect(feature.number).toBe(1);
      expect(feature.id).toBe('test-feature-1');
      expect(registry.getAllFeatures()).toHaveLength(1);
    });

    it('should auto-increment feature numbers', () => {
      registry.addFeature({
        id: 'feature-1',
        name: 'Feature 1',
        description: 'First',
        category: 'Test',
        phase: 'Phase 1',
        priority: 'P0',
        status: 'planned',
        dependencies: [],
        blocks: [],
        value: 'Value 1'
      });

      const feature2 = registry.addFeature({
        id: 'feature-2',
        name: 'Feature 2',
        description: 'Second',
        category: 'Test',
        phase: 'Phase 1',
        priority: 'P1',
        status: 'planned',
        dependencies: [],
        blocks: [],
        value: 'Value 2'
      });

      expect(feature2.number).toBe(2);
    });

    it('should get feature by ID', () => {
      registry.addFeature({
        id: 'get-test',
        name: 'Get Test',
        description: 'Test get',
        category: 'Test',
        phase: 'Phase 1',
        priority: 'P0',
        status: 'planned',
        dependencies: [],
        blocks: [],
        value: 'Value'
      });

      const feature = registry.getFeature('get-test');
      expect(feature).toBeDefined();
      expect(feature?.name).toBe('Get Test');
    });

    it('should return undefined for non-existent feature', () => {
      const feature = registry.getFeature('non-existent');
      expect(feature).toBeUndefined();
    });

    it('should update a feature', () => {
      registry.addFeature({
        id: 'update-test',
        name: 'Original Name',
        description: 'Original',
        category: 'Test',
        phase: 'Phase 1',
        priority: 'P0',
        status: 'planned',
        dependencies: [],
        blocks: [],
        value: 'Original'
      });

      const updated = registry.updateFeature('update-test', {
        name: 'Updated Name',
        status: 'in-progress'
      });

      expect(updated?.name).toBe('Updated Name');
      expect(updated?.status).toBe('in-progress');
      expect(updated?.id).toBe('update-test'); // ID should not change
    });

    it('should delete a feature', () => {
      registry.addFeature({
        id: 'delete-test',
        name: 'Delete Test',
        description: 'Will be deleted',
        category: 'Test',
        phase: 'Phase 1',
        priority: 'P0',
        status: 'planned',
        dependencies: [],
        blocks: [],
        value: 'Value'
      });

      expect(registry.getAllFeatures()).toHaveLength(1);

      const deleted = registry.deleteFeature('delete-test');
      expect(deleted).toBe(true);
      expect(registry.getAllFeatures()).toHaveLength(0);
    });

    it('should return false when deleting non-existent feature', () => {
      const deleted = registry.deleteFeature('non-existent');
      expect(deleted).toBe(false);
    });
  });

  describe('filtering', () => {
    let registry: CSVFeatureRegistry;

    beforeEach(() => {
      registry = new CSVFeatureRegistry({
        filePath: testFilePath,
        createIfMissing: true,
        autoSave: false
      });

      // Add test features
      registry.addFeature({
        id: 'f1',
        name: 'Feature 1',
        description: 'Test',
        category: 'Backend',
        phase: 'Phase 1',
        priority: 'P0',
        status: 'planned',
        dependencies: [],
        blocks: [],
        value: 'Value',
        tags: ['api']
      });

      registry.addFeature({
        id: 'f2',
        name: 'Feature 2',
        description: 'Test',
        category: 'Frontend',
        phase: 'Phase 1',
        priority: 'P1',
        status: 'in-progress',
        dependencies: [],
        blocks: [],
        value: 'Value',
        tags: ['ui']
      });

      registry.addFeature({
        id: 'f3',
        name: 'Feature 3',
        description: 'Test',
        category: 'Backend',
        phase: 'Phase 2',
        priority: 'P0',
        status: 'completed',
        dependencies: [],
        blocks: [],
        value: 'Value',
        tags: ['api', 'database']
      });
    });

    it('should filter by status', () => {
      const planned = registry.filterFeatures({ status: 'planned' });
      expect(planned).toHaveLength(1);
      expect(planned[0].id).toBe('f1');
    });

    it('should filter by priority', () => {
      const p0 = registry.filterFeatures({ priority: 'P0' });
      expect(p0).toHaveLength(2);
    });

    it('should filter by category', () => {
      const backend = registry.filterFeatures({ category: 'Backend' });
      expect(backend).toHaveLength(2);
    });

    it('should filter by tags', () => {
      const api = registry.filterFeatures({ tags: ['api'] });
      expect(api).toHaveLength(2);
    });

    it('should get features by status', () => {
      const completed = registry.getByStatus('completed');
      expect(completed).toHaveLength(1);
      expect(completed[0].id).toBe('f3');
    });
  });

  describe('dependencies', () => {
    let registry: CSVFeatureRegistry;

    beforeEach(() => {
      registry = new CSVFeatureRegistry({
        filePath: testFilePath,
        createIfMissing: true,
        autoSave: false
      });
    });

    it('should get dependency graph', () => {
      registry.addFeature({
        id: 'f1',
        name: 'Feature 1',
        description: 'Test',
        category: 'Test',
        phase: 'Phase 1',
        priority: 'P0',
        status: 'planned',
        dependencies: [],
        blocks: [],
        value: 'Value'
      });

      registry.addFeature({
        id: 'f2',
        name: 'Feature 2',
        description: 'Test',
        category: 'Test',
        phase: 'Phase 1',
        priority: 'P0',
        status: 'planned',
        dependencies: ['f1'],
        blocks: [],
        value: 'Value'
      });

      const graph = registry.getDependencyGraph();
      expect(graph.get('f1')).toEqual([]);
      expect(graph.get('f2')).toEqual(['f1']);
    });

    it('should detect circular dependencies', () => {
      registry.addFeature({
        id: 'f1',
        name: 'Feature 1',
        description: 'Test',
        category: 'Test',
        phase: 'Phase 1',
        priority: 'P0',
        status: 'planned',
        dependencies: ['f2'],
        blocks: [],
        value: 'Value'
      });

      registry.addFeature({
        id: 'f2',
        name: 'Feature 2',
        description: 'Test',
        category: 'Test',
        phase: 'Phase 1',
        priority: 'P0',
        status: 'planned',
        dependencies: ['f1'],
        blocks: [],
        value: 'Value'
      });

      expect(registry.hasCircularDependency('f1')).toBe(true);
      expect(registry.hasCircularDependency('f2')).toBe(true);
    });
  });

  describe('persistence', () => {
    it('should save and load registry', () => {
      // Create and populate registry
      const registry1 = new CSVFeatureRegistry({
        filePath: testFilePath,
        createIfMissing: true,
        autoSave: true
      });

      registry1.addFeature({
        id: 'persist-test',
        name: 'Persist Test',
        description: 'Test persistence',
        category: 'Test',
        phase: 'Phase 1',
        priority: 'P0',
        status: 'planned',
        dependencies: [],
        blocks: [],
        value: 'Value'
      });

      // Load registry from same file
      const registry2 = new CSVFeatureRegistry({
        filePath: testFilePath
      });

      const features = registry2.getAllFeatures();
      expect(features).toHaveLength(1);
      expect(features[0].id).toBe('persist-test');
      expect(features[0].name).toBe('Persist Test');
    });
  });
});
