/**
 * Project Analyzer - Main entry point
 * A read-only skill that analyzes repositories to identify TODOs, specifications, and implementation gaps
 */

export * from './core/patterns';
export * from './core/scanner';
export * from './utils/fileTraversal';
export * from './formatters/outputFormatter';
export { ProductionVerifier } from './core/ProductionVerifier';
export { DeploymentWorkflow } from './core/DeploymentWorkflow';

import { scanTodos, processScanResults, ScanOptions, ScanResult } from './core/scanner';
import { formatOutput, FormatterOptions, OutputFormat } from './formatters/outputFormatter';

/**
 * Main analyzer class providing a high-level API
 */
export class ProjectAnalyzer {
  private rootPath: string;
  private options: Partial<ScanOptions>;

  constructor(rootPath: string, options: Partial<ScanOptions> = {}) {
    this.rootPath = rootPath;
    this.options = options;
  }

  /**
   * Scan the repository for TODOs
   */
  async scan(): Promise<ScanResult> {
    const result = await scanTodos({
      rootPath: this.rootPath,
      ...this.options
    });
    return processScanResults(result);
  }

  /**
   * Scan and format output in one step
   */
  async scanAndFormat(format: OutputFormat = 'json', formatOptions: Partial<FormatterOptions> = {}): Promise<string> {
    const result = await this.scan();
    return formatOutput(result, {
      format,
      ...formatOptions
    });
  }

  /**
   * Get only new TODOs compared to a previous scan
   */
  async getNewTodos(previousStatePath: string): Promise<ScanResult> {
    const { loadPreviousState, findNewTodos } = await import('./core/scanner');

    const result = await this.scan();
    const previousHashes = loadPreviousState(previousStatePath);
    const newTodos = findNewTodos(result.todos as any[], previousHashes);

    return {
      ...result,
      todos: newTodos,
      summary: {
        ...result.summary,
        totalTodos: newTodos.length
      }
    };
  }

  /**
   * Quick summary of TODOs without full details
   */
  async getSummary(): Promise<string> {
    const result = await this.scan();
    const { formatSummary } = await import('./formatters/outputFormatter');
    return formatSummary(result);
  }
}

// Export default analyzer factory
export default function createAnalyzer(rootPath: string, options?: Partial<ScanOptions>): ProjectAnalyzer {
  return new ProjectAnalyzer(rootPath, options);
}