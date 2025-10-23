/**
 * Type definitions for roadmap and feature data
 */

export interface ProjectInfo {
  name: string;
  code: string;
  status: string;
  phase: string;
}

export type TShirtSize = 'XS' | 'S' | 'M' | 'L' | 'XL';

export interface Feature {
  id: string;
  number?: number;
  name: string;
  category: string;
  phase: string;
  priority?: 'P0' | 'P1' | 'P2' | 'P3';
  size?: TShirtSize;
  tokenEstimate?: number;
  dependencies?: string[];
  value: string;
  shippedDate?: string;
}

export interface RoadmapStats {
  shipped: number;
  inProgress: number;
  nextUp: number;
  backlog: number;
  total: number;
}

export interface PriorityQueueItem {
  feature: string;
  reason: string;
  blockedBy: string[];
  blocking: string[];
}

export interface RoadmapData {
  project: ProjectInfo;
  current: Feature[];
  features: {
    shipped: Feature[];
    inProgress: Feature[];
    nextUp: Feature[];
    backlog: Feature[];
  };
  priorityQueue: PriorityQueueItem[];
  stats: RoadmapStats;
}

export type FeatureCategory =
  | 'Analyzer'
  | 'Manager'
  | 'Planner'
  | 'Shared Library'
  | 'Dashboard'
  | 'Integration'
  | 'Design'
  | 'Planning';

export type FeatureStatus = 'shipped' | 'inProgress' | 'nextUp' | 'backlog';

export type FeaturePriority = 'P0' | 'P1' | 'P2' | 'P3';

export interface FeatureFilter {
  category?: FeatureCategory;
  phase?: string;
  priority?: FeaturePriority;
  status?: FeatureStatus;
  searchTerm?: string;
}
