/**
 * Type definitions for dashboard actions and skill communication
 */

export type ActionType =
  | 'analyze'
  | 'create-issues'
  | 'update-feature'
  | 'run-tests'
  | 'discover-web'
  | 'verify-production'
  | 'generate-report';

export type ActionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ActionResult {
  success: boolean;
  message?: string;
  data?: any;
  error?: string;
}

export interface DashboardAction {
  id: string;
  type: ActionType;
  timestamp: string;
  status: ActionStatus;
  payload: ActionPayload;
  result?: ActionResult;
}

// Action-specific payloads

export interface AnalyzePayload {
  repoPath: string;
  options?: {
    includeCompleted?: boolean;
    outputFormat?: 'json' | 'markdown' | 'csv';
  };
}

export interface CreateIssuesPayload {
  inputFile: string;
  dryRun?: boolean;
  labels?: string[];
}

export interface UpdateFeaturePayload {
  featureId: string;
  updates: Partial<{
    name: string;
    status: string;
    priority: string;
    phase: string;
    value: string;
  }>;
}

export interface RunTestsPayload {
  package?: string;
  watch?: boolean;
  coverage?: boolean;
}

export interface DiscoverWebPayload {
  url: string;
  depth?: number;
  includeScreenshots?: boolean;
}

export interface VerifyProductionPayload {
  featureId: string;
  productionUrl: string;
  stagingUrl?: string;
}

export interface GenerateReportPayload {
  type: 'daily' | 'weekly' | 'monthly';
  format: 'markdown' | 'html';
  outputPath?: string;
}

export type ActionPayload =
  | AnalyzePayload
  | CreateIssuesPayload
  | UpdateFeaturePayload
  | RunTestsPayload
  | DiscoverWebPayload
  | VerifyProductionPayload
  | GenerateReportPayload;

// Skill output types

export type SkillName = 'project-analyzer' | 'project-manager' | 'project-planner';

export interface SkillProgress {
  current: number;
  total: number;
  message: string;
  percentage?: number;
}

export interface SkillOutput {
  skillName: SkillName;
  startTime: string;
  endTime?: string;
  status: 'running' | 'completed' | 'failed';
  progress?: SkillProgress;
  output: {
    logs: string[];
    results: any;
  };
  error?: string;
}
