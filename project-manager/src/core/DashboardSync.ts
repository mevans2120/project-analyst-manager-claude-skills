/**
 * DashboardSync - Validate dashboard accuracy and recommend Next Up features
 *
 * Features:
 * - Compare dashboard data with actual codebase
 * - Detect completed features not marked as shipped
 * - Identify false positives (marked shipped but not complete)
 * - Recommend Next Up based on dependency graph
 * - Auto-generate sync reports
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  DashboardData,
  Feature,
  FeatureStatus,
  SyncReport
} from '../types/dashboard';

export class DashboardSync {
  private rootPath: string;
  private dashboardPath: string;

  constructor(rootPath: string) {
    this.rootPath = rootPath;
    this.dashboardPath = path.join(rootPath, 'dashboard', 'data.js');
  }

  /**
   * Read and parse dashboard data
   */
  async readDashboard(): Promise<DashboardData> {
    const content = fs.readFileSync(this.dashboardPath, 'utf-8');

    // Extract the productRoadmap object from the file
    // This is a bit hacky but works for our use case
    const match = content.match(/const productRoadmap = (\{[\s\S]*?\});/);
    if (!match) {
      throw new Error('Could not parse dashboard data');
    }

    // Use eval to parse the object (safe since we control the file)
    // In production, we'd use a proper JS parser
    const data = eval(`(${match[1]})`);
    return data;
  }

  /**
   * Check if a feature actually exists in the codebase
   */
  async checkFeatureExists(feature: Feature): Promise<FeatureStatus> {
    const status: FeatureStatus = {
      id: feature.id,
      name: feature.name,
      exists: false,
      hasTests: false,
      hasImplementation: false,
      confidence: 'low',
      files: []
    };

    // Determine where to look based on feature category
    const searchPaths = this.getSearchPaths(feature);

    for (const searchPath of searchPaths) {
      const fullPath = path.join(this.rootPath, searchPath);

      if (fs.existsSync(fullPath)) {
        status.exists = true;
        status.files!.push(searchPath);

        // Check for implementation files
        if (this.hasImplementationFiles(fullPath)) {
          status.hasImplementation = true;
        }

        // Check for test files
        if (this.hasTestFiles(fullPath)) {
          status.hasTests = true;
        }
      }
    }

    // Calculate confidence
    if (status.hasImplementation && status.hasTests) {
      status.confidence = 'high';
    } else if (status.hasImplementation || status.hasTests) {
      status.confidence = 'medium';
    }

    return status;
  }

  /**
   * Get search paths for a feature based on its category and ID
   */
  private getSearchPaths(feature: Feature): string[] {
    const paths: string[] = [];

    // Map feature IDs to likely file locations
    const featureMap: Record<string, string[]> = {
      // Shared library features
      'shared-webfetcher': ['shared/src/core/WebFetcher.ts'],
      'shared-playwright': ['shared/src/core/PlaywrightDriver.ts'],
      'shared-screenshot': ['shared/src/core/ScreenshotCapture.ts'],
      'shared-network': ['shared/src/core/NetworkMonitor.ts'],
      'shared-extractors': ['shared/src/core/FeatureExtractor.ts'],

      // Planner features
      'planner-registry': ['project-planner/src/core/FeatureRegistry.ts'],
      'planner-code-discovery': ['project-planner/src/core/CodeDiscovery.ts'],
      'planner-web-discovery': ['project-planner/src/core/WebDiscovery.ts'],
      'planner-roadmap-export': ['project-planner/src/formatters/RoadmapExport.ts'],

      // Analyzer features
      'analyzer-v10': ['project-analyzer/src/core/scanner.ts', 'project-analyzer/src/core/patterns.ts'],
      'analyzer-v15': ['project-analyzer/src/core/completionDetector.ts'],
      'analyzer-verification': ['project-analyzer/src/core/ProductionVerifier.ts'],

      // Manager features
      'manager-v10': ['project-manager/src/core/issueCreator.ts', 'project-manager/src/core/stateTracker.ts'],
      'manager-screenshots': ['project-manager/src/core/ScreenshotManager.ts']
    };

    if (featureMap[feature.id]) {
      paths.push(...featureMap[feature.id]);
    }

    // Also check based on category
    if (feature.category === 'Shared Library') {
      paths.push(`shared/src/core/${this.getClassNameFromId(feature.id)}.ts`);
    } else if (feature.category === 'Planner') {
      paths.push(`project-planner/src/core/${this.getClassNameFromId(feature.id)}.ts`);
    } else if (feature.category === 'Analyzer') {
      paths.push(`project-analyzer/src/core/${this.getClassNameFromId(feature.id)}.ts`);
    } else if (feature.category === 'Manager') {
      paths.push(`project-manager/src/core/${this.getClassNameFromId(feature.id)}.ts`);
    }

    return paths;
  }

  /**
   * Convert feature ID to class name
   * e.g., "shared-webfetcher" -> "WebFetcher"
   */
  private getClassNameFromId(id: string): string {
    return id
      .split('-')
      .slice(1) // Remove prefix (shared, planner, etc.)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  }

  /**
   * Check if directory has implementation files
   */
  private hasImplementationFiles(dirPath: string): boolean {
    if (!fs.existsSync(dirPath)) return false;

    const stat = fs.statSync(dirPath);
    if (stat.isFile()) {
      return dirPath.endsWith('.ts') || dirPath.endsWith('.js');
    }

    // Check for TypeScript or JavaScript files
    const files = fs.readdirSync(dirPath);
    return files.some(file =>
      (file.endsWith('.ts') || file.endsWith('.js')) &&
      !file.includes('.test.') &&
      !file.includes('.spec.')
    );
  }

  /**
   * Check if directory has test files
   */
  private hasTestFiles(dirPath: string): boolean {
    if (!fs.existsSync(dirPath)) return false;

    const stat = fs.statSync(dirPath);
    if (stat.isFile()) {
      // Check if corresponding test file exists
      const testPath = dirPath.replace(/\.(ts|js)$/, '.test.$1');
      return fs.existsSync(testPath);
    }

    // Check for test files in directory
    const testDir = path.join(path.dirname(dirPath), 'tests');
    if (fs.existsSync(testDir)) {
      const files = fs.readdirSync(testDir);
      return files.some(file =>
        file.includes('.test.') || file.includes('.spec.')
      );
    }

    return false;
  }

  /**
   * Generate sync report
   */
  async generateReport(): Promise<SyncReport> {
    const dashboard = await this.readDashboard();
    const report: SyncReport = {
      upToDate: true,
      missingFromDashboard: [],
      falsePositives: [],
      recommendedNextUp: [],
      suggestions: []
    };

    // Check all shipped features
    for (const feature of dashboard.features.shipped) {
      // Skip design/planning features (they don't have code)
      if (feature.category === 'Design' || feature.category === 'Planning') {
        continue;
      }

      const status = await this.checkFeatureExists(feature);

      // If marked as shipped but doesn't exist with high confidence
      if (status.confidence === 'low' || (!status.hasImplementation && !status.hasTests)) {
        report.falsePositives.push(status);
        report.upToDate = false;
      }
    }

    // Check in-progress features
    for (const feature of dashboard.features.inProgress) {
      const status = await this.checkFeatureExists(feature);

      // If in progress but actually complete
      if (status.confidence === 'high' && status.hasImplementation && status.hasTests) {
        report.missingFromDashboard.push(status);
        report.upToDate = false;
        report.suggestions.push(
          `✅ ${feature.name} appears complete - move to Shipped`
        );
      }
    }

    // Recommend Next Up based on dependencies
    report.recommendedNextUp = this.getRecommendedNextUp(dashboard);

    // Generate suggestions
    if (report.missingFromDashboard.length > 0) {
      report.suggestions.push(
        `📦 ${report.missingFromDashboard.length} completed feature(s) not marked as shipped`
      );
    }

    if (report.falsePositives.length > 0) {
      report.suggestions.push(
        `⚠️ ${report.falsePositives.length} shipped feature(s) appear incomplete`
      );
    }

    if (report.recommendedNextUp.length > 0) {
      report.suggestions.push(
        `🔜 ${report.recommendedNextUp.length} feature(s) ready to start (dependencies met)`
      );
    }

    if (report.upToDate) {
      report.suggestions.push('✅ Dashboard is up to date!');
    }

    return report;
  }

  /**
   * Recommend features for Next Up based on dependency graph
   */
  private getRecommendedNextUp(dashboard: DashboardData): Feature[] {
    const recommended: Feature[] = [];
    const shippedIds = new Set(dashboard.features.shipped.map(f => f.id));

    // Check backlog for features with met dependencies
    for (const feature of dashboard.features.backlog) {
      // Check if all dependencies are shipped
      const dependenciesMet = !feature.dependencies ||
        feature.dependencies.every(depId => shippedIds.has(depId));

      if (dependenciesMet) {
        recommended.push(feature);
      }
    }

    // Sort by priority (P0 > P1 > P2 > P3)
    recommended.sort((a, b) => {
      const priorityOrder = { P0: 0, P1: 1, P2: 2, P3: 3 };
      const aPriority = priorityOrder[a.priority as keyof typeof priorityOrder] ?? 999;
      const bPriority = priorityOrder[b.priority as keyof typeof priorityOrder] ?? 999;
      return aPriority - bPriority;
    });

    // Return top 3-5
    return recommended.slice(0, 5);
  }

  /**
   * Format report as markdown
   */
  formatReport(report: SyncReport): string {
    let output = '# Dashboard Sync Report\n\n';

    // Status
    if (report.upToDate) {
      output += '## ✅ Status: Up to Date\n\n';
    } else {
      output += '## ⚠️ Status: Updates Needed\n\n';
    }

    // Suggestions
    if (report.suggestions.length > 0) {
      output += '## 📋 Summary\n\n';
      report.suggestions.forEach(suggestion => {
        output += `- ${suggestion}\n`;
      });
      output += '\n';
    }

    // Missing from dashboard
    if (report.missingFromDashboard.length > 0) {
      output += '## ✅ Completed Features Not Marked as Shipped\n\n';
      output += '| Feature | Confidence | Has Tests | Has Implementation |\n';
      output += '|---------|-----------|-----------|-------------------|\n';
      report.missingFromDashboard.forEach(status => {
        output += `| ${status.name} | ${status.confidence} | ${status.hasTests ? '✅' : '❌'} | ${status.hasImplementation ? '✅' : '❌'} |\n`;
      });
      output += '\n';
    }

    // False positives
    if (report.falsePositives.length > 0) {
      output += '## ⚠️ Shipped Features That Appear Incomplete\n\n';
      output += '| Feature | Confidence | Has Tests | Has Implementation |\n';
      output += '|---------|-----------|-----------|-------------------|\n';
      report.falsePositives.forEach(status => {
        output += `| ${status.name} | ${status.confidence} | ${status.hasTests ? '✅' : '❌'} | ${status.hasImplementation ? '✅' : '❌'} |\n`;
      });
      output += '\n';
    }

    // Recommended Next Up
    if (report.recommendedNextUp.length > 0) {
      output += '## 🔜 Recommended for Next Up\n\n';
      output += 'These features have all dependencies met and are ready to start:\n\n';
      report.recommendedNextUp.forEach((feature, index) => {
        const deps = feature.dependencies && feature.dependencies.length > 0
          ? ` (depends on: ${feature.dependencies.join(', ')})`
          : ' (no dependencies)';
        output += `${index + 1}. **${feature.name}** - ${feature.priority}${deps}\n`;
        output += `   - ${feature.value}\n\n`;
      });
    }

    return output;
  }
}
