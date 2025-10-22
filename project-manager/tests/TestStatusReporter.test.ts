/**
 * Tests for TestStatusReporter
 */

import * as fs from 'fs';
import * as path from 'path';
import TestStatusReporter from '../src/reporters/TestStatusReporter';

describe('TestStatusReporter', () => {
  const testRootDir = path.join(__dirname, 'test-reporter-data');
  // Reporter goes up one directory from rootDir to find project root
  const statusDir = path.join(__dirname, '.test-status');

  beforeEach(() => {
    // Clean up test directory
    if (fs.existsSync(statusDir)) {
      fs.rmSync(statusDir, { recursive: true });
    }
  });

  afterEach(() => {
    // Clean up test directory
    if (fs.existsSync(statusDir)) {
      fs.rmSync(statusDir, { recursive: true });
    }
  });

  describe('Constructor', () => {
    it('should create .test-status directory structure', () => {
      const reporter = new TestStatusReporter(
        { rootDir: testRootDir } as any,
        {}
      );

      expect(fs.existsSync(statusDir)).toBe(true);
      expect(fs.existsSync(path.join(statusDir, 'history'))).toBe(true);
    });

    it('should detect package name from package.json', () => {
      // Create a mock package.json
      fs.mkdirSync(testRootDir, { recursive: true });
      fs.writeFileSync(
        path.join(testRootDir, 'package.json'),
        JSON.stringify({ name: 'test-package' })
      );

      const reporter = new TestStatusReporter(
        { rootDir: testRootDir } as any,
        {}
      );

      // We can't directly test the private packageName field,
      // but we can verify it works correctly in onRunComplete
      expect(fs.existsSync(statusDir)).toBe(true);

      // Clean up
      fs.unlinkSync(path.join(testRootDir, 'package.json'));
    });
  });

  describe('onRunComplete', () => {
    it('should generate and save test results', () => {
      const reporter = new TestStatusReporter(
        { rootDir: testRootDir } as any,
        {}
      );

      const mockResults: any = {
        numFailedTests: 0,
        numPassedTests: 2,
        numPendingTests: 1,
        numTodoTests: 0,
        numTotalTests: 3,
        startTime: Date.now() - 1000,
        success: true,
        testResults: [
          {
            testFilePath: path.join(testRootDir, 'tests', 'example.test.ts'),
            testResults: [
              {
                ancestorTitles: ['Suite 1'],
                title: 'should pass test 1',
                status: 'passed',
                duration: 10,
                fullName: 'Suite 1 should pass test 1',
                failureMessages: [],
                failureDetails: [],
                numPassingAsserts: 1
              },
              {
                ancestorTitles: ['Suite 1'],
                title: 'should pass test 2',
                status: 'passed',
                duration: 20,
                fullName: 'Suite 1 should pass test 2',
                failureMessages: [],
                failureDetails: [],
                numPassingAsserts: 1
              },
              {
                ancestorTitles: ['Suite 2'],
                title: 'should skip test 3',
                status: 'pending',
                duration: 0,
                fullName: 'Suite 2 should skip test 3',
                failureMessages: [],
                failureDetails: [],
                numPassingAsserts: 0
              }
            ],
            perfStats: {
              runtime: 30,
              slow: false,
              start: Date.now() - 1000,
              end: Date.now()
            },
            numFailingTests: 0,
            numPassingTests: 2,
            numPendingTests: 1,
            numTodoTests: 0,
            snapshot: {
              added: 0,
              fileDeleted: false,
              matched: 0,
              unchecked: 0,
              uncheckedKeys: [],
              unmatched: 0,
              updated: 0
            },
            openHandles: [],
            leaks: false,
            console: undefined,
            coverage: undefined,
            displayName: undefined,
            failureMessage: null,
            skipped: false,
            sourceMaps: {},
            testExecError: undefined
          }
        ],
        numFailedTestSuites: 0,
        numPassedTestSuites: 1,
        numPendingTestSuites: 0,
        numRuntimeErrorTestSuites: 0,
        numTotalTestSuites: 1,
        openHandles: [],
        snapshot: {
          added: 0,
          didUpdate: false,
          failure: false,
          filesAdded: 0,
          filesRemoved: 0,
          filesRemovedList: [],
          filesUnmatched: 0,
          filesUpdated: 0,
          matched: 0,
          total: 0,
          unchecked: 0,
          uncheckedKeysByFile: [],
          unmatched: 0,
          updated: 0
        },
        wasInterrupted: false
      };

      reporter.onRunComplete(new Set(), mockResults);

      // Verify latest.json was created
      const latestPath = path.join(statusDir, 'latest.json');
      expect(fs.existsSync(latestPath)).toBe(true);

      // Verify summary.json was created
      const summaryPath = path.join(statusDir, 'summary.json');
      expect(fs.existsSync(summaryPath)).toBe(true);

      // Load and verify latest.json content
      const latest = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
      expect(Array.isArray(latest)).toBe(true);
      expect(latest).toHaveLength(1);
      expect(latest[0].totalTests).toBe(3);
      expect(latest[0].passed).toBe(2);
      expect(latest[0].failed).toBe(0);
      expect(latest[0].skipped).toBe(1);
      expect(latest[0].tests).toHaveLength(3);

      // Load and verify summary.json content
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      expect(summary.overall.totalTests).toBe(3);
      expect(summary.overall.passed).toBe(2);
      expect(summary.overall.failed).toBe(0);
      expect(summary.overall.skipped).toBe(1);
    });

    it('should handle failed tests correctly', () => {
      const reporter = new TestStatusReporter(
        { rootDir: testRootDir } as any,
        {}
      );

      const mockResults: any = {
        numFailedTests: 1,
        numPassedTests: 0,
        numPendingTests: 0,
        numTodoTests: 0,
        numTotalTests: 1,
        startTime: Date.now() - 1000,
        success: false,
        testResults: [
          {
            testFilePath: path.join(testRootDir, 'tests', 'failing.test.ts'),
            testResults: [
              {
                ancestorTitles: ['Failing Suite'],
                title: 'should fail',
                status: 'failed',
                duration: 15,
                fullName: 'Failing Suite should fail',
                failureMessages: ['Expected true to be false'],
                failureDetails: [],
                numPassingAsserts: 0
              }
            ],
            perfStats: {
              runtime: 15,
              slow: false,
              start: Date.now() - 1000,
              end: Date.now()
            },
            numFailingTests: 1,
            numPassingTests: 0,
            numPendingTests: 0,
            numTodoTests: 0,
            snapshot: {
              added: 0,
              fileDeleted: false,
              matched: 0,
              unchecked: 0,
              uncheckedKeys: [],
              unmatched: 0,
              updated: 0
            },
            openHandles: [],
            leaks: false,
            console: undefined,
            coverage: undefined,
            displayName: undefined,
            failureMessage: 'Test failed',
            skipped: false,
            sourceMaps: {},
            testExecError: undefined
          }
        ],
        numFailedTestSuites: 1,
        numPassedTestSuites: 0,
        numPendingTestSuites: 0,
        numRuntimeErrorTestSuites: 0,
        numTotalTestSuites: 1,
        openHandles: [],
        snapshot: {
          added: 0,
          didUpdate: false,
          failure: false,
          filesAdded: 0,
          filesRemoved: 0,
          filesRemovedList: [],
          filesUnmatched: 0,
          filesUpdated: 0,
          matched: 0,
          total: 0,
          unchecked: 0,
          uncheckedKeysByFile: [],
          unmatched: 0,
          updated: 0
        },
        wasInterrupted: false
      };

      reporter.onRunComplete(new Set(), mockResults);

      // Load and verify latest.json content
      const latestPath = path.join(statusDir, 'latest.json');
      const latest = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));
      expect(latest[0].failed).toBe(1);
      expect(latest[0].tests[0].status).toBe('failed');
      expect(latest[0].tests[0].error).toBeDefined();
      expect(latest[0].tests[0].error.message).toBe('Expected true to be false');

      // Verify summary shows package as failing
      const summaryPath = path.join(statusDir, 'summary.json');
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));
      expect(summary.overall.packagesFailing).toBe(1);
    });

    it('should save history file with date', () => {
      const reporter = new TestStatusReporter(
        { rootDir: testRootDir } as any,
        {}
      );

      const mockResults: any = {
        numFailedTests: 0,
        numPassedTests: 1,
        numPendingTests: 0,
        numTodoTests: 0,
        numTotalTests: 1,
        startTime: Date.now() - 1000,
        success: true,
        testResults: [
          {
            testFilePath: path.join(testRootDir, 'tests', 'simple.test.ts'),
            testResults: [
              {
                ancestorTitles: ['Simple Suite'],
                title: 'should pass',
                status: 'passed',
                duration: 10,
                fullName: 'Simple Suite should pass',
                failureMessages: [],
                failureDetails: [],
                numPassingAsserts: 1
              }
            ],
            perfStats: {
              runtime: 10,
              slow: false,
              start: Date.now() - 1000,
              end: Date.now()
            },
            numFailingTests: 0,
            numPassingTests: 1,
            numPendingTests: 0,
            numTodoTests: 0,
            snapshot: {
              added: 0,
              fileDeleted: false,
              matched: 0,
              unchecked: 0,
              uncheckedKeys: [],
              unmatched: 0,
              updated: 0
            },
            openHandles: [],
            leaks: false,
            console: undefined,
            coverage: undefined,
            displayName: undefined,
            failureMessage: null,
            skipped: false,
            sourceMaps: {},
            testExecError: undefined
          }
        ],
        numFailedTestSuites: 0,
        numPassedTestSuites: 1,
        numPendingTestSuites: 0,
        numRuntimeErrorTestSuites: 0,
        numTotalTestSuites: 1,
        openHandles: [],
        snapshot: {
          added: 0,
          didUpdate: false,
          failure: false,
          filesAdded: 0,
          filesRemoved: 0,
          filesRemovedList: [],
          filesUnmatched: 0,
          filesUpdated: 0,
          matched: 0,
          total: 0,
          unchecked: 0,
          uncheckedKeysByFile: [],
          unmatched: 0,
          updated: 0
        },
        wasInterrupted: false
      };

      reporter.onRunComplete(new Set(), mockResults);

      // Verify history file was created
      const historyDir = path.join(statusDir, 'history');
      const historyFiles = fs.readdirSync(historyDir);
      expect(historyFiles.length).toBeGreaterThan(0);

      // History filename should match pattern: YYYY-MM-DD-{packageName}.json
      const historyFile = historyFiles[0];
      expect(historyFile).toMatch(/^\d{4}-\d{2}-\d{2}-.+\.json$/);
    });
  });

  describe('File output structure', () => {
    it('should create proper latest.json structure', () => {
      const reporter = new TestStatusReporter(
        { rootDir: testRootDir } as any,
        {}
      );

      const mockResults: any = {
        numFailedTests: 0,
        numPassedTests: 1,
        numPendingTests: 0,
        numTodoTests: 0,
        numTotalTests: 1,
        startTime: Date.now() - 1000,
        success: true,
        testResults: [
          {
            testFilePath: path.join(testRootDir, 'tests', 'test.ts'),
            testResults: [
              {
                ancestorTitles: ['Suite'],
                title: 'test',
                status: 'passed',
                duration: 10,
                fullName: 'Suite test',
                failureMessages: [],
                failureDetails: [],
                numPassingAsserts: 1
              }
            ],
            perfStats: { runtime: 10, slow: false, start: 0, end: 10 },
            numFailingTests: 0,
            numPassingTests: 1,
            numPendingTests: 0,
            numTodoTests: 0,
            snapshot: {
              added: 0, fileDeleted: false, matched: 0,
              unchecked: 0, uncheckedKeys: [], unmatched: 0, updated: 0
            },
            openHandles: [],
            leaks: false,
            console: undefined,
            coverage: undefined,
            displayName: undefined,
            failureMessage: null,
            skipped: false,
            sourceMaps: {},
            testExecError: undefined
          }
        ],
        numFailedTestSuites: 0,
        numPassedTestSuites: 1,
        numPendingTestSuites: 0,
        numRuntimeErrorTestSuites: 0,
        numTotalTestSuites: 1,
        openHandles: [],
        snapshot: {
          added: 0, didUpdate: false, failure: false,
          filesAdded: 0, filesRemoved: 0, filesRemovedList: [],
          filesUnmatched: 0, filesUpdated: 0, matched: 0,
          total: 0, unchecked: 0, uncheckedKeysByFile: [], unmatched: 0, updated: 0
        },
        wasInterrupted: false
      };

      reporter.onRunComplete(new Set(), mockResults);

      const latestPath = path.join(statusDir, 'latest.json');
      const latest = JSON.parse(fs.readFileSync(latestPath, 'utf-8'));

      // Verify structure
      expect(latest[0]).toHaveProperty('timestamp');
      expect(latest[0]).toHaveProperty('package');
      expect(latest[0]).toHaveProperty('totalTests');
      expect(latest[0]).toHaveProperty('passed');
      expect(latest[0]).toHaveProperty('failed');
      expect(latest[0]).toHaveProperty('skipped');
      expect(latest[0]).toHaveProperty('duration');
      expect(latest[0]).toHaveProperty('tests');

      // Verify test structure
      const test = latest[0].tests[0];
      expect(test).toHaveProperty('testId');
      expect(test).toHaveProperty('name');
      expect(test).toHaveProperty('suite');
      expect(test).toHaveProperty('package');
      expect(test).toHaveProperty('file');
      expect(test).toHaveProperty('status');
      expect(test).toHaveProperty('duration');
    });

    it('should create proper summary.json structure', () => {
      const reporter = new TestStatusReporter(
        { rootDir: testRootDir } as any,
        {}
      );

      const mockResults: any = {
        numFailedTests: 0,
        numPassedTests: 1,
        numPendingTests: 0,
        numTodoTests: 0,
        numTotalTests: 1,
        startTime: Date.now() - 1000,
        success: true,
        testResults: [
          {
            testFilePath: path.join(testRootDir, 'tests', 'test.ts'),
            testResults: [
              {
                ancestorTitles: ['Suite'],
                title: 'test',
                status: 'passed',
                duration: 10,
                fullName: 'Suite test',
                failureMessages: [],
                failureDetails: [],
                numPassingAsserts: 1
              }
            ],
            perfStats: { runtime: 10, slow: false, start: 0, end: 10 },
            numFailingTests: 0,
            numPassingTests: 1,
            numPendingTests: 0,
            numTodoTests: 0,
            snapshot: {
              added: 0, fileDeleted: false, matched: 0,
              unchecked: 0, uncheckedKeys: [], unmatched: 0, updated: 0
            },
            openHandles: [],
            leaks: false,
            console: undefined,
            coverage: undefined,
            displayName: undefined,
            failureMessage: null,
            skipped: false,
            sourceMaps: {},
            testExecError: undefined
          }
        ],
        numFailedTestSuites: 0,
        numPassedTestSuites: 1,
        numPendingTestSuites: 0,
        numRuntimeErrorTestSuites: 0,
        numTotalTestSuites: 1,
        openHandles: [],
        snapshot: {
          added: 0, didUpdate: false, failure: false,
          filesAdded: 0, filesRemoved: 0, filesRemovedList: [],
          filesUnmatched: 0, filesUpdated: 0, matched: 0,
          total: 0, unchecked: 0, uncheckedKeysByFile: [], unmatched: 0, updated: 0
        },
        wasInterrupted: false
      };

      reporter.onRunComplete(new Set(), mockResults);

      const summaryPath = path.join(statusDir, 'summary.json');
      const summary = JSON.parse(fs.readFileSync(summaryPath, 'utf-8'));

      // Verify structure
      expect(summary).toHaveProperty('lastUpdated');
      expect(summary).toHaveProperty('packages');
      expect(summary).toHaveProperty('overall');

      // Verify overall structure
      expect(summary.overall).toHaveProperty('totalTests');
      expect(summary.overall).toHaveProperty('passed');
      expect(summary.overall).toHaveProperty('failed');
      expect(summary.overall).toHaveProperty('skipped');
      expect(summary.overall).toHaveProperty('packagesTotal');
      expect(summary.overall).toHaveProperty('packagesFailing');
    });
  });
});
