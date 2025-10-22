/**
 * Type definitions for test status and results
 */

export interface TestError {
  message: string;
  stack?: string;
}

export type TestStatus = 'passed' | 'failed' | 'skipped';

export interface TestResult {
  testId: string;
  name: string;
  suite: string;
  package: string;
  file: string;
  status: TestStatus;
  duration: number;
  error?: TestError;
}

export interface TestRunSummary {
  timestamp: string;
  package: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  tests: TestResult[];
}

export interface PackageTestStatus {
  lastRun: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number;
  status: 'passing' | 'failing';
}

export interface OverallTestStatus {
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  packagesTotal: number;
  packagesFailing: number;
}

export interface TestSummary {
  lastUpdated: string;
  packages: Record<string, PackageTestStatus>;
  overall: OverallTestStatus;
}

export interface TestFilter {
  package?: string;
  status?: TestStatus;
  searchTerm?: string;
}

export interface TestStats {
  label: string;
  value: number;
  status: 'success' | 'error' | 'warning' | 'neutral';
}
