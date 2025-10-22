/**
 * Custom Jest Reporter for Test Status Dashboard
 * Captures test results and saves them to .test-status/ directory
 */

import * as fs from 'fs';
import * as path from 'path';
import type {
  AggregatedResult,
  TestResult,
  AssertionResult,
} from '@jest/test-result';
import type { Reporter, ReporterOnStartOptions } from '@jest/reporters';

interface TestStatusResult {
  testId: string;
  name: string;
  suite: string;
  package: string;
  file: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: {
    message: string;
    stack?: string;
  };
}

interface TestRunSummary {
  timestamp: string;
  package: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: TestStatusResult[];
}

export default class TestStatusReporter implements Reporter {
  private rootDir: string;
  private statusDir: string;
  private packageName: string;

  constructor(globalConfig: any, options: any) {
    // Get the root directory (project root, not project-manager)
    this.rootDir = globalConfig.rootDir || process.cwd();

    // Determine package name from rootDir
    this.packageName = this.getPackageName(this.rootDir);

    // Use a shared .test-status directory at the project root
    const projectRoot = path.resolve(this.rootDir, '..');
    this.statusDir = path.join(projectRoot, '.test-status');

    // Ensure status directory exists
    this.ensureDirectories();
  }

  private getPackageName(dir: string): string {
    const basename = path.basename(dir);
    // Map directory names to package names
    const packageMap: Record<string, string> = {
      'project-manager': 'manager',
      'project-analyzer': 'analyzer',
      'project-planner': 'planner',
      'shared': 'shared'
    };
    return packageMap[basename] || basename;
  }

  private ensureDirectories(): void {
    if (!fs.existsSync(this.statusDir)) {
      fs.mkdirSync(this.statusDir, { recursive: true });
    }

    const historyDir = path.join(this.statusDir, 'history');
    if (!fs.existsSync(historyDir)) {
      fs.mkdirSync(historyDir, { recursive: true });
    }
  }

  onRunStart(results: AggregatedResult, options: ReporterOnStartOptions): void {
    // Optional: Could log when test run starts
  }

  onRunComplete(contexts: any, results: AggregatedResult): void {
    const summary = this.generateSummary(results);

    // Save to latest.json
    this.saveLatest(summary);

    // Save to history
    this.saveHistory(summary);

    // Update summary.json with aggregated stats
    this.updateSummary(summary);
  }

  private generateSummary(results: AggregatedResult): TestRunSummary {
    const tests: TestStatusResult[] = [];

    results.testResults.forEach((testResult: TestResult) => {
      const suite = this.getSuiteName(testResult.testFilePath);
      const file = path.relative(this.rootDir, testResult.testFilePath);

      testResult.testResults.forEach((assertionResult: AssertionResult) => {
        const testId = this.generateTestId(file, assertionResult.fullName);

        tests.push({
          testId,
          name: assertionResult.title,
          suite,
          package: this.packageName,
          file,
          status: assertionResult.status === 'passed' ? 'passed' :
                  assertionResult.status === 'failed' ? 'failed' : 'skipped',
          duration: assertionResult.duration || 0,
          error: assertionResult.failureMessages.length > 0 ? {
            message: assertionResult.failureMessages[0],
            stack: assertionResult.failureMessages.join('\n')
          } : undefined
        });
      });
    });

    return {
      timestamp: new Date().toISOString(),
      package: this.packageName,
      totalTests: results.numTotalTests,
      passed: results.numPassedTests,
      failed: results.numFailedTests,
      skipped: results.numPendingTests,
      duration: Date.now() - results.startTime,
      tests
    };
  }

  private getSuiteName(filePath: string): string {
    const relativePath = path.relative(this.rootDir, filePath);
    const parts = relativePath.split(path.sep);

    // Extract suite name from path (e.g., "tests/DashboardSync.test.ts" -> "DashboardSync")
    const filename = parts[parts.length - 1];
    return filename.replace(/\.(test|spec)\.(ts|js)$/, '');
  }

  private generateTestId(file: string, testName: string): string {
    // Create a unique ID from package, file, and test name
    return `${this.packageName}:${file}:${testName}`.replace(/[^a-zA-Z0-9:/-]/g, '_');
  }

  private saveLatest(summary: TestRunSummary): void {
    // Load existing latest.json to merge with new results
    const latestPath = path.join(this.statusDir, 'latest.json');
    let allResults: TestRunSummary[] = [];

    if (fs.existsSync(latestPath)) {
      try {
        const content = fs.readFileSync(latestPath, 'utf-8');
        const existing = JSON.parse(content);

        // If existing is an array, use it; otherwise wrap single result
        allResults = Array.isArray(existing) ? existing : [existing];

        // Remove old results from the same package
        allResults = allResults.filter(r => r.package !== this.packageName);
      } catch (error) {
        // If parse fails, start fresh
        allResults = [];
      }
    }

    // Add new results
    allResults.push(summary);

    fs.writeFileSync(latestPath, JSON.stringify(allResults, null, 2));
  }

  private saveHistory(summary: TestRunSummary): void {
    const date = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const historyPath = path.join(this.statusDir, 'history', `${date}-${this.packageName}.json`);

    // Append to daily history file
    let history: TestRunSummary[] = [];
    if (fs.existsSync(historyPath)) {
      try {
        const content = fs.readFileSync(historyPath, 'utf-8');
        history = JSON.parse(content);
      } catch (error) {
        history = [];
      }
    }

    history.push(summary);
    fs.writeFileSync(historyPath, JSON.stringify(history, null, 2));
  }

  private updateSummary(summary: TestRunSummary): void {
    const summaryPath = path.join(this.statusDir, 'summary.json');

    // Load existing summary
    let allSummary: any = {
      lastUpdated: new Date().toISOString(),
      packages: {}
    };

    if (fs.existsSync(summaryPath)) {
      try {
        const content = fs.readFileSync(summaryPath, 'utf-8');
        allSummary = JSON.parse(content);
      } catch (error) {
        // Use default
      }
    }

    // Update package summary
    allSummary.packages[this.packageName] = {
      lastRun: summary.timestamp,
      totalTests: summary.totalTests,
      passed: summary.passed,
      failed: summary.failed,
      skipped: summary.skipped,
      duration: summary.duration,
      status: summary.failed > 0 ? 'failing' : 'passing'
    };

    // Calculate overall stats
    const packages = Object.values(allSummary.packages) as any[];
    allSummary.overall = {
      totalTests: packages.reduce((sum, p) => sum + p.totalTests, 0),
      passed: packages.reduce((sum, p) => sum + p.passed, 0),
      failed: packages.reduce((sum, p) => sum + p.failed, 0),
      skipped: packages.reduce((sum, p) => sum + p.skipped, 0),
      packagesTotal: packages.length,
      packagesFailing: packages.filter(p => p.status === 'failing').length
    };

    allSummary.lastUpdated = new Date().toISOString();

    fs.writeFileSync(summaryPath, JSON.stringify(allSummary, null, 2));
  }

  getLastError(): Error | undefined {
    return undefined;
  }
}
