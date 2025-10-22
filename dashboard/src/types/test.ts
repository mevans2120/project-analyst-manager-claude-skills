/**
 * TypeScript types for test status data
 * Matches the structure from .test-status/latest.json and summary.json
 */

export interface TestResult {
  testId: string;
  name: string;
  suite: string;
  package: string;
  file: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}

export interface PackageTestRun {
  timestamp: string;
  package: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: TestResult[];
}

export interface PackageSummary {
  lastRun: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  status: 'passing' | 'failing' | 'unknown';
}

export interface TestSummary {
  lastUpdated: string;
  packages: Record<string, PackageSummary>;
  overall: {
    totalTests: number;
    passed: number;
    failed: number;
    skipped: number;
    packagesTotal: number;
    packagesFailing: number;
  };
}

export type TestStatus = 'passed' | 'failed' | 'skipped' | 'all';
