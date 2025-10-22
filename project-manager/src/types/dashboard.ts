/**
 * Dashboard data structure types
 */

export interface DashboardProject {
  name: string;
  code: string;
  status: string;
  phase: string;
}

export interface Feature {
  id: string;
  number?: number;
  name: string;
  category: string;
  phase: string;
  priority?: string;
  dependencies?: string[];
  value: string;
  progress?: number;
  notes?: string;
  blockers?: string[];
  shippedDate?: string;
}

export interface DashboardFeatures {
  shipped: Feature[];
  inProgress: Feature[];
  nextUp: Feature[];
  backlog: Feature[];
}

export interface DashboardStats {
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

export interface DashboardData {
  project: DashboardProject;
  current: Feature[];
  features: DashboardFeatures;
  priorityQueue: PriorityQueueItem[];
  stats: DashboardStats;
}

export interface FeatureStatus {
  id: string;
  name: string;
  exists: boolean;
  hasTests: boolean;
  hasImplementation: boolean;
  testsPassing?: boolean;
  confidence: 'high' | 'medium' | 'low';
  files?: string[];
}

export interface SyncReport {
  upToDate: boolean;
  missingFromDashboard: FeatureStatus[];
  falsePositives: FeatureStatus[];
  recommendedNextUp: Feature[];
  suggestions: string[];
}
