/**
 * Project Manager - Main entry point
 * A write-operations skill that creates GitHub issues, organizes documentation, and generates reports
 */

export * from './types';
export * from './core/stateTracker';
export * from './core/issueCreator';
export * from './core/DashboardSync';
export * from './core/ScreenshotDocumenter';
export * from './utils/githubClient';
export * from './utils/labelManager';
export * from './formatters/reportGenerator';

import { TodoItem, ProjectManagerConfig, StateFile } from './types';
import { loadState, saveState, filterNewTodos } from './core/stateTracker';
import { createIssuesFromTodos, IssueCreationOptions } from './core/issueCreator';
import {
  generateDailyReport,
  saveReport,
  generateSummaryReport,
  formatDateForFilename
} from './formatters/reportGenerator';

/**
 * Main Project Manager class
 */
export class ProjectManager {
  private config: ProjectManagerConfig;
  private state: StateFile;

  constructor(config: ProjectManagerConfig) {
    this.config = config;
    this.state = loadState(config.stateFile);
  }

  /**
   * Process TODOs and create GitHub issues
   */
  async processTodos(
    todos: TodoItem[],
    options?: {
      checkDuplicates?: boolean;
      dryRun?: boolean;
    }
  ) {
    // Filter out already processed TODOs
    const newTodos = filterNewTodos(this.state, todos);

    if (newTodos.length === 0) {
      console.log('No new TODOs to process.');
      return {
        success: true,
        created: [],
        failed: [],
        skipped: [],
        totalProcessed: 0
      };
    }

    console.log(`Processing ${newTodos.length} new TODOs...`);

    // Create issues
    const issueOptions: IssueCreationOptions = {
      githubConfig: this.config.github,
      labelMapping: this.config.labels,
      checkDuplicates: options?.checkDuplicates ?? true,
      dryRun: options?.dryRun ?? false
    };

    const result = await createIssuesFromTodos(newTodos, this.state, issueOptions);

    // Save state
    saveState(this.config.stateFile, this.state);

    return result;
  }

  /**
   * Generate and save a daily report
   */
  generateReport(date?: string) {
    const reportDate = date || formatDateForFilename();

    // Get today's processed TODOs
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todaysTodos = this.state.processedTodos.filter(todo => {
      const processedDate = new Date(todo.processedAt);
      processedDate.setHours(0, 0, 0, 0);
      return processedDate.getTime() === today.getTime();
    });

    const created = todaysTodos.filter(t => t.status === 'created');
    const failed = todaysTodos.filter(t => t.status === 'failed');
    const skipped = todaysTodos.filter(t => t.status === 'skipped');

    // Generate report
    const report = generateDailyReport(reportDate, created, failed, skipped, this.state);

    // Save report
    const reportPath = saveReport(report, this.config.reporting.outputPath);

    console.log(`Report saved to: ${reportPath}`);

    return {
      report,
      reportPath
    };
  }

  /**
   * Generate summary report
   */
  generateSummary(daysBack: number = 7): string {
    return generateSummaryReport(this.state, daysBack);
  }

  /**
   * Get current state
   */
  getState(): StateFile {
    return this.state;
  }

  /**
   * Reload state from file
   */
  reloadState() {
    this.state = loadState(this.config.stateFile);
  }

  /**
   * Save current state
   */
  saveState() {
    saveState(this.config.stateFile, this.state);
  }

  /**
   * Check dashboard sync status
   */
  async checkDashboardSync(rootPath: string) {
    const { DashboardSync } = await import('./core/DashboardSync');
    const sync = new DashboardSync(rootPath);
    const report = await sync.generateReport();
    const formatted = sync.formatReport(report);

    console.log(formatted);

    return {
      report,
      formatted
    };
  }
}

/**
 * Load configuration from file
 */
export function loadConfig(configPath: string): ProjectManagerConfig {
  const fs = require('fs');

  if (!fs.existsSync(configPath)) {
    throw new Error(`Configuration file not found: ${configPath}`);
  }

  const content = fs.readFileSync(configPath, 'utf-8');
  const config = JSON.parse(content);

  // Validate required fields
  if (!config.github || !config.github.owner || !config.github.repo) {
    throw new Error('Configuration must include github.owner and github.repo');
  }

  // Set defaults
  return {
    github: {
      defaultLabels: ['auto-created'],
      ...config.github
    },
    stateFile: config.stateFile || '.project-state.json',
    reporting: {
      outputPath: 'docs/reports',
      schedule: 'daily',
      ...config.reporting
    },
    labels: {
      'TODO': ['feature', 'priority-medium'],
      'FIXME': ['bug', 'priority-high'],
      'BUG': ['bug', 'priority-high'],
      'HACK': ['tech-debt', 'priority-low'],
      'OPTIMIZE': ['enhancement', 'priority-low'],
      'REFACTOR': ['refactor', 'priority-medium'],
      'NOTE': ['documentation', 'priority-low'],
      'XXX': ['needs-review', 'priority-medium'],
      ...config.labels
    }
  };
}

/**
 * Factory function to create a Project Manager instance
 */
export default function createProjectManager(config: ProjectManagerConfig): ProjectManager {
  return new ProjectManager(config);
}
