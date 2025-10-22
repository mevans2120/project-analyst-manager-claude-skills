/**
 * CSV Feature Registry
 * Single source of truth for all product features
 *
 * This module provides CRUD operations for features stored in CSV format,
 * making it easy to track, plan, and manage product development.
 */

import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'csv-parse/sync';
import { stringify } from 'csv-stringify/sync';
import { Feature, FeatureRegistry, RegistryOptions } from '../types';

export class CSVFeatureRegistry {
  private filePath: string;
  private autoSave: boolean;
  private registry: FeatureRegistry;

  constructor(options: RegistryOptions) {
    this.filePath = options.filePath;
    this.autoSave = options.autoSave ?? true;

    // Initialize or load registry
    if (fs.existsSync(this.filePath)) {
      this.registry = this.load();
    } else if (options.createIfMissing) {
      this.registry = this.createEmpty();
      this.save();
    } else {
      throw new Error(`Registry file not found: ${this.filePath}`);
    }
  }

  /**
   * Create an empty registry
   */
  private createEmpty(): FeatureRegistry {
    return {
      project: {
        name: 'New Project',
        code: 'NP'
      },
      features: [],
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        totalFeatures: 0
      }
    };
  }

  /**
   * Load registry from CSV file
   */
  private load(): FeatureRegistry {
    const content = fs.readFileSync(this.filePath, 'utf-8');
    const records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    // First row should be project metadata (special format)
    const features: Feature[] = records
      .filter((record: any) => record.id && record.id !== 'PROJECT_META')
      .map((record: any) => ({
        id: record.id,
        number: parseInt(record.number, 10),
        name: record.name,
        description: record.description || '',
        category: record.category,
        phase: record.phase,
        priority: record.priority as Feature['priority'],
        status: record.status as Feature['status'],
        dependencies: record.dependencies ? record.dependencies.split(';') : [],
        blocks: record.blocks ? record.blocks.split(';') : [],
        value: record.value || '',
        startDate: record.startDate || undefined,
        completedDate: record.completedDate || undefined,
        notes: record.notes || undefined,
        tags: record.tags ? record.tags.split(';') : []
      }));

    // Try to find project metadata in the file
    const metaRecord = records.find((r: any) => r.id === 'PROJECT_META');
    const project = metaRecord ? {
      name: metaRecord.name || 'Unknown Project',
      code: metaRecord.code || 'UP',
      description: metaRecord.description
    } : {
      name: path.basename(this.filePath, '.csv'),
      code: 'UP'
    };

    return {
      project,
      features,
      metadata: {
        version: '1.0.0',
        lastUpdated: new Date().toISOString(),
        totalFeatures: features.length
      }
    };
  }

  /**
   * Save registry to CSV file
   */
  save(): void {
    // Prepare records for CSV
    const records = [
      // Project metadata row
      {
        id: 'PROJECT_META',
        number: '',
        name: this.registry.project.name,
        code: this.registry.project.code,
        description: this.registry.project.description || '',
        category: '',
        phase: '',
        priority: '',
        status: '',
        dependencies: '',
        blocks: '',
        value: '',
        startDate: '',
        completedDate: '',
        notes: '',
        tags: ''
      },
      // Feature rows
      ...this.registry.features.map(feature => ({
        id: feature.id,
        number: feature.number.toString(),
        name: feature.name,
        code: '',
        description: feature.description,
        category: feature.category,
        phase: feature.phase,
        priority: feature.priority,
        status: feature.status,
        dependencies: feature.dependencies.join(';'),
        blocks: feature.blocks.join(';'),
        value: feature.value,
        startDate: feature.startDate || '',
        completedDate: feature.completedDate || '',
        notes: feature.notes || '',
        tags: feature.tags?.join(';') || ''
      }))
    ];

    const csv = stringify(records, {
      header: true,
      columns: [
        'id', 'number', 'name', 'code', 'description', 'category', 'phase',
        'priority', 'status', 'dependencies', 'blocks', 'value',
        'startDate', 'completedDate', 'notes', 'tags'
      ]
    });

    fs.writeFileSync(this.filePath, csv, 'utf-8');
    this.registry.metadata.lastUpdated = new Date().toISOString();
  }

  /**
   * Add a new feature
   */
  addFeature(feature: Omit<Feature, 'number'>): Feature {
    // Auto-assign number
    const number = this.registry.features.length > 0
      ? Math.max(...this.registry.features.map(f => f.number)) + 1
      : 1;

    const newFeature: Feature = {
      ...feature,
      number
    };

    this.registry.features.push(newFeature);
    this.registry.metadata.totalFeatures++;

    if (this.autoSave) {
      this.save();
    }

    return newFeature;
  }

  /**
   * Get feature by ID
   */
  getFeature(id: string): Feature | undefined {
    return this.registry.features.find(f => f.id === id);
  }

  /**
   * Get all features
   */
  getAllFeatures(): Feature[] {
    return [...this.registry.features];
  }

  /**
   * Update a feature
   */
  updateFeature(id: string, updates: Partial<Feature>): Feature | undefined {
    const index = this.registry.features.findIndex(f => f.id === id);
    if (index === -1) return undefined;

    this.registry.features[index] = {
      ...this.registry.features[index],
      ...updates,
      id, // Preserve ID
      number: this.registry.features[index].number // Preserve number
    };

    if (this.autoSave) {
      this.save();
    }

    return this.registry.features[index];
  }

  /**
   * Delete a feature
   */
  deleteFeature(id: string): boolean {
    const index = this.registry.features.findIndex(f => f.id === id);
    if (index === -1) return false;

    this.registry.features.splice(index, 1);
    this.registry.metadata.totalFeatures--;

    if (this.autoSave) {
      this.save();
    }

    return true;
  }

  /**
   * Filter features by criteria
   */
  filterFeatures(criteria: {
    status?: Feature['status'];
    priority?: Feature['priority'];
    category?: string;
    phase?: string;
    tags?: string[];
  }): Feature[] {
    return this.registry.features.filter(feature => {
      if (criteria.status && feature.status !== criteria.status) return false;
      if (criteria.priority && feature.priority !== criteria.priority) return false;
      if (criteria.category && feature.category !== criteria.category) return false;
      if (criteria.phase && feature.phase !== criteria.phase) return false;
      if (criteria.tags && !criteria.tags.some(tag => feature.tags?.includes(tag))) return false;
      return true;
    });
  }

  /**
   * Get features by status
   */
  getByStatus(status: Feature['status']): Feature[] {
    return this.filterFeatures({ status });
  }

  /**
   * Get dependency graph
   */
  getDependencyGraph(): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    for (const feature of this.registry.features) {
      graph.set(feature.id, feature.dependencies);
    }
    return graph;
  }

  /**
   * Check if feature has circular dependencies
   */
  hasCircularDependency(featureId: string, visited = new Set<string>()): boolean {
    if (visited.has(featureId)) return true;

    const feature = this.getFeature(featureId);
    if (!feature) return false;

    visited.add(featureId);

    for (const depId of feature.dependencies) {
      if (this.hasCircularDependency(depId, new Set(visited))) {
        return true;
      }
    }

    return false;
  }

  /**
   * Initialize registry with project info
   */
  async init(options: { project: { name: string; code: string; description?: string } }): Promise<void> {
    this.registry.project = options.project;
    this.save();
  }

  /**
   * Get project info
   */
  getProjectInfo() {
    return { ...this.registry.project };
  }

  /**
   * Get registry metadata
   */
  getMetadata() {
    return { ...this.registry.metadata };
  }
}
