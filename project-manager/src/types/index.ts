/**
 * Type definitions for Project Manager
 */

/**
 * Configuration for Project Manager
 */
export interface ProjectManagerConfig {
  github: GithubConfig;
  stateFile: string;
  reporting: ReportingConfig;
  labels: LabelMapping;
}

export interface GithubConfig {
  owner: string;
  repo: string;
  token?: string;
  defaultLabels: string[];
  issueTitlePrefix?: string;
}

export interface ReportingConfig {
  outputPath: string;
  schedule: 'daily' | 'weekly';
}

export interface LabelMapping {
  [todoType: string]: string[];
}

/**
 * TODO item from Project Analyzer
 */
export interface TodoItem {
  type: string;
  content: string;
  file: string;
  line: number;
  priority: 'high' | 'medium' | 'low';
  category: string;
  rawText: string;
  id?: string;
  hash?: string;
}

/**
 * Processed TODO with tracking metadata
 */
export interface ProcessedTodo {
  hash: string;
  content: string;
  file: string;
  line: number;
  type: string;
  priority: string;
  processedAt: string;
  issueUrl?: string;
  issueNumber?: number;
  status: 'pending' | 'created' | 'failed' | 'skipped';
  error?: string;
}

/**
 * State file structure
 */
export interface StateFile {
  lastUpdated: string;
  processedTodos: ProcessedTodo[];
  metadata: {
    totalProcessed: number;
    totalIssuesCreated: number;
    lastReportDate?: string;
  };
}

/**
 * GitHub issue creation request
 */
export interface IssueCreateRequest {
  title: string;
  body: string;
  labels: string[];
  assignees?: string[];
  milestone?: number;
}

/**
 * GitHub issue response
 */
export interface IssueCreateResponse {
  number: number;
  html_url: string;
  title: string;
  state: string;
}

/**
 * Report data structure
 */
export interface ReportData {
  date: string;
  summary: ReportSummary;
  newIssues: ProcessedTodo[];
  failedIssues: ProcessedTodo[];
  skippedIssues: ProcessedTodo[];
}

export interface ReportSummary {
  totalTodosProcessed: number;
  issuesCreated: number;
  issuesFailed: number;
  issuesSkipped: number;
  byPriority: Record<string, number>;
  byType: Record<string, number>;
}

/**
 * Label determination result
 */
export interface LabelResult {
  labels: string[];
  priority: 'high' | 'medium' | 'low';
}

/**
 * Analysis result from Project Analyzer
 */
export interface AnalysisResult {
  todos: TodoItem[];
  summary: {
    totalTodos: number;
    byPriority: Record<string, number>;
    byType: Record<string, number>;
    byFile: Record<string, number>;
    filesScanned: number;
    scanDuration: number;
  };
  scanDate: string;
  rootPath: string;
}
