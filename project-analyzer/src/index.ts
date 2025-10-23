/**
 * Project Analyzer - Main entry point
 * A read-only skill that analyzes repositories to identify TODOs, specifications, and implementation gaps
 * Now includes feature extraction from designs, moodboards, and websites
 */

export * from './core/patterns';
export * from './core/scanner';
export * from './utils/fileTraversal';
export * from './formatters/outputFormatter';
export { ProductionVerifier } from './core/ProductionVerifier';
export { DeploymentWorkflow } from './core/DeploymentWorkflow';

// Export new feature extraction capabilities
export * from './types/features';
export { DesignAnalyzer } from './core/DesignAnalyzer';
export { WebsiteAnalyzer } from './core/WebsiteAnalyzer';
export * from './formatters/featureFormatter';

import { scanTodos, processScanResults, ScanOptions, ScanResult } from './core/scanner';
import { formatOutput, FormatterOptions, OutputFormat } from './formatters/outputFormatter';
import { DesignAnalyzer } from './core/DesignAnalyzer';
import { WebsiteAnalyzer } from './core/WebsiteAnalyzer';
import {
  DesignAnalysisOptions,
  WebsiteAnalysisOptions,
  DesignContext,
  FeatureAnalysisResult,
  DetailedAnalysisResult,
  FeatureCSVOptions
} from './types/features';
import {
  formatFeaturesAsCSV,
  formatFeaturesAsMarkdown,
  formatFeaturesAsJSON,
  writeFeaturesToFile
} from './formatters/featureFormatter';

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

  /**
   * Extract features from design files and moodboards
   */
  async analyzeDesigns(
    options: DesignAnalysisOptions,
    context?: DesignContext
  ): Promise<DetailedAnalysisResult> {
    const analyzer = new DesignAnalyzer(options, context);
    return await analyzer.analyze();
  }

  /**
   * Extract features from websites
   */
  async analyzeWebsites(
    options: WebsiteAnalysisOptions,
    context?: DesignContext
  ): Promise<DetailedAnalysisResult> {
    const analyzer = new WebsiteAnalyzer(options, context);
    return await analyzer.analyze();
  }

  /**
   * Analyze designs and export to CSV
   */
  async analyzeDesignsToCSV(
    options: DesignAnalysisOptions,
    outputPath: string,
    csvOptions?: FeatureCSVOptions,
    context?: DesignContext
  ): Promise<string> {
    const result = await this.analyzeDesigns(options, context);
    const csv = formatFeaturesAsCSV(result, csvOptions);

    if (outputPath) {
      await writeFeaturesToFile(result, outputPath, 'csv', csvOptions);
    }

    return csv;
  }

  /**
   * Analyze websites and export to CSV
   */
  async analyzeWebsitesToCSV(
    options: WebsiteAnalysisOptions,
    outputPath: string,
    csvOptions?: FeatureCSVOptions,
    context?: DesignContext
  ): Promise<string> {
    const result = await this.analyzeWebsites(options, context);
    const csv = formatFeaturesAsCSV(result, csvOptions);

    if (outputPath) {
      await writeFeaturesToFile(result, outputPath, 'csv', csvOptions);
    }

    return csv;
  }

  /**
   * Combined analysis: designs + websites
   */
  async analyzeFull(
    designOptions?: DesignAnalysisOptions,
    websiteOptions?: WebsiteAnalysisOptions,
    context?: DesignContext
  ): Promise<DetailedAnalysisResult> {
    const features: any[] = [];
    const warnings: string[] = [];
    const recommendations: string[] = [];

    // Analyze designs if provided
    if (designOptions) {
      const designResult = await this.analyzeDesigns(designOptions, context);
      features.push(...designResult.features);
      if (designResult.warnings) warnings.push(...designResult.warnings);
      if (designResult.recommendations) recommendations.push(...designResult.recommendations);
    }

    // Analyze websites if provided
    if (websiteOptions) {
      const websiteResult = await this.analyzeWebsites(websiteOptions, context);
      features.push(...websiteResult.features);
      if (websiteResult.warnings) warnings.push(...websiteResult.warnings);
      if (websiteResult.recommendations) recommendations.push(...websiteResult.recommendations);
    }

    // Combine results
    const summary = this.calculateCombinedSummary(features);

    return {
      features,
      summary,
      metadata: {
        analyzedSources: [
          ...(designOptions?.designFiles || []),
          ...(designOptions?.moodboards || []),
          ...(designOptions?.wireframes || []),
          ...(designOptions?.screenshots || []),
          ...(websiteOptions?.urls || [])
        ],
        analysisDate: new Date().toISOString(),
        analysisDuration: 0,
        tool: 'ProjectAnalyzer',
        version: '2.0.0'
      },
      warnings: warnings.length > 0 ? warnings : undefined,
      recommendations: recommendations.length > 0 ? recommendations : undefined
    };
  }

  /**
   * Calculate combined summary from multiple sources
   */
  private calculateCombinedSummary(features: any[]): any {
    const byCategory: any = {};
    const bySource: any = {};
    const byPriority: Record<string, number> = { high: 0, medium: 0, low: 0, unassigned: 0 };
    let totalConfidence = 0;

    for (const feature of features) {
      byCategory[feature.category] = (byCategory[feature.category] || 0) + 1;
      bySource[feature.source] = (bySource[feature.source] || 0) + 1;

      const priority = feature.priority as string | undefined;
      if (priority === 'high' || priority === 'medium' || priority === 'low') {
        byPriority[priority] = (byPriority[priority] || 0) + 1;
      } else {
        byPriority.unassigned = (byPriority.unassigned || 0) + 1;
      }

      totalConfidence += feature.confidence;
    }

    return {
      totalFeatures: features.length,
      byCategory,
      bySource,
      byPriority,
      averageConfidence: features.length > 0 ? Math.round(totalConfidence / features.length) : 0
    };
  }
}

// Export default analyzer factory
export default function createAnalyzer(rootPath: string, options?: Partial<ScanOptions>): ProjectAnalyzer {
  return new ProjectAnalyzer(rootPath, options);
}