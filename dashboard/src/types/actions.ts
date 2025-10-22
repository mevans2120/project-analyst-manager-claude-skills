/**
 * Action types for Dashboard → Claude Skills communication
 * PM-26: Dashboard Actions → Skill Invocations
 */

export type ActionType =
  | 'analyze'
  | 'create-issues'
  | 'update-feature'
  | 'run-tests'
  | 'discover-web'
  | 'export-roadmap'
  | 'verify-production';

export type ActionStatus = 'pending' | 'processing' | 'completed' | 'failed';

export interface ActionResult {
  success: boolean;
  message?: string;
  data?: any;
}

export interface ActionRequest {
  id: string;
  type: ActionType;
  timestamp: string;
  status: ActionStatus;
  payload: Record<string, any>;
  result?: ActionResult;
}

/**
 * Specific payload types for each action
 */

export interface AnalyzePayload {
  repoPath: string;
  options?: {
    includeCompleted?: boolean;
    format?: 'json' | 'markdown' | 'csv';
  };
}

export interface CreateIssuesPayload {
  inputFile: string;
  dryRun?: boolean;
  config?: {
    owner: string;
    repo: string;
  };
}

export interface UpdateFeaturePayload {
  featureId: string;
  updates: {
    status?: 'in-progress' | 'completed' | 'blocked';
    progress?: number;
    notes?: string;
  };
}

export interface RunTestsPayload {
  package?: string;
  testPattern?: string;
}

export interface DiscoverWebPayload {
  url: string;
  withLogin?: boolean;
  outputFile?: string;
}

export interface ExportRoadmapPayload {
  format: 'markdown' | 'html' | 'json';
  outputFile?: string;
  groupBy?: 'phase' | 'category' | 'priority';
}

export interface VerifyProductionPayload {
  baseUrl: string;
  features?: string[]; // Feature IDs to verify, or all if not specified
  tier?: '1' | '2' | '3' | 'all';
  stagingUrl?: string; // For deployment comparison
}

/**
 * Helper function to create action requests
 */
export function createActionRequest(
  type: ActionType,
  payload: Record<string, any>
): ActionRequest {
  const timestamp = new Date().toISOString();
  const dateStr = timestamp.replace(/[:.]/g, '').slice(0, 15);

  return {
    id: `action_${dateStr}_${type}`,
    type,
    timestamp,
    status: 'pending',
    payload
  };
}

/**
 * Get action display name
 */
export function getActionDisplayName(type: ActionType): string {
  switch (type) {
    case 'analyze':
      return 'Analyze TODOs';
    case 'create-issues':
      return 'Create Issues';
    case 'update-feature':
      return 'Update Feature';
    case 'run-tests':
      return 'Run Tests';
    case 'discover-web':
      return 'Discover from Web';
    case 'export-roadmap':
      return 'Export Roadmap';
    case 'verify-production':
      return 'Verify Production';
    default:
      return type;
  }
}

/**
 * Get action icon name (using Lucide icon names)
 */
export function getActionIcon(type: ActionType): string {
  switch (type) {
    case 'analyze':
      return 'Search';
    case 'create-issues':
      return 'FileText';
    case 'update-feature':
      return 'Edit';
    case 'run-tests':
      return 'TestTube';
    case 'discover-web':
      return 'Globe';
    case 'export-roadmap':
      return 'Download';
    case 'verify-production':
      return 'CheckCircle2';
    default:
      return 'Play';
  }
}

/**
 * Get action description
 */
export function getActionDescription(type: ActionType): string {
  switch (type) {
    case 'analyze':
      return 'Scan repository for TODOs, FIXMEs, and tasks';
    case 'create-issues':
      return 'Create GitHub issues from analysis results';
    case 'update-feature':
      return 'Update feature status in roadmap';
    case 'run-tests':
      return 'Execute test suite and update dashboard';
    case 'discover-web':
      return 'Analyze website to discover features';
    case 'export-roadmap':
      return 'Export roadmap to file (Markdown, HTML, or JSON)';
    case 'verify-production':
      return 'Verify features work in production environment';
    default:
      return '';
  }
}
