/**
 * Types for Project Planner
 */

export interface Feature {
  /** Unique identifier */
  id: string;
  /** Feature number (PM-1, PM-2, etc.) */
  number: number;
  /** Human-readable name */
  name: string;
  /** Feature description */
  description: string;
  /** Category/component */
  category: string;
  /** Development phase */
  phase: string;
  /** Priority (P0, P1, P2) */
  priority: 'P0' | 'P1' | 'P2' | 'P3';
  /** Current status */
  status: 'planned' | 'in-progress' | 'completed' | 'blocked';
  /** Dependencies (array of feature IDs) */
  dependencies: string[];
  /** Features this blocks */
  blocks: string[];
  /** Value proposition */
  value: string;
  /** Start date */
  startDate?: string;
  /** Completion date */
  completedDate?: string;
  /** Notes */
  notes?: string;
  /** Tags for filtering */
  tags?: string[];
}

export interface FeatureRegistry {
  /** Project metadata */
  project: {
    name: string;
    code: string;
    description?: string;
  };
  /** All features */
  features: Feature[];
  /** Registry metadata */
  metadata: {
    version: string;
    lastUpdated: string;
    totalFeatures: number;
  };
}

export interface RegistryOptions {
  /** Path to CSV file */
  filePath: string;
  /** Auto-save on changes */
  autoSave?: boolean;
  /** Create file if doesn't exist */
  createIfMissing?: boolean;
}
