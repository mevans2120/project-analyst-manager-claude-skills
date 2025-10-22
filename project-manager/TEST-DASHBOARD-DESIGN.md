# PM-18: Test Status Dashboard Tab

**Status**: Planning
**Priority**: P2
**Dependencies**: manager-v10 (Manager v1.0)
**Phase**: Phase 3

## Overview

Add a new tab to the dashboard that displays real-time test suite health, showing every test with its last run time and pass/fail status.

## Goals

1. **Visibility**: See all tests across all packages at a glance
2. **Health Monitoring**: Quickly identify failing tests
3. **History**: Track when tests last ran successfully
4. **Trends**: Understand test suite stability over time

## Features

### Core Features

1. **Test List View**
   - Display all tests from all packages (shared, project-planner, project-analyzer, project-manager)
   - Show test name, suite name, file path
   - Display last run timestamp
   - Show pass/fail status with visual indicators (✅/❌)

2. **Test Summary Stats**
   - Total tests: X
   - Passing: Y (Z%)
   - Failing: N
   - Last full run: timestamp
   - Test coverage percentage (if available)

3. **Filtering & Sorting**
   - Filter by: status (passing/failing), package, test suite
   - Sort by: name, last run time, status
   - Search by test name

4. **Test Details**
   - Click test to see failure details
   - Stack trace for failures
   - Test execution time
   - Run history (last 10 runs)

### Data Structure

```typescript
interface TestRun {
  timestamp: string;
  totalTests: number;
  passed: number;
  failed: number;
  skipped: number;
  duration: number; // ms
  tests: TestResult[];
}

interface TestResult {
  name: string;
  suite: string;
  file: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number; // ms
  error?: {
    message: string;
    stack: string;
  };
}

interface TestStatus {
  testId: string; // unique identifier
  name: string;
  suite: string;
  package: string;
  file: string;
  lastRun: string; // ISO timestamp
  status: 'passed' | 'failed' | 'skipped' | 'not-run';
  duration: number;
  history: TestHistoryItem[];
}

interface TestHistoryItem {
  timestamp: string;
  status: 'passed' | 'failed' | 'skipped';
  duration: number;
  error?: string;
}
```

### Storage

Store test results in `.test-status/` directory:
- `.test-status/latest.json` - Most recent test run
- `.test-status/history/YYYY-MM-DD.json` - Daily test runs
- `.test-status/summary.json` - Aggregated stats

### Integration Points

1. **Jest Reporter**
   - Create custom Jest reporter to capture test results
   - Save results to `.test-status/` after each run
   - Update test history

2. **Dashboard Tab**
   - Add "Tests" tab to dashboard/index.html
   - Fetch data from `.test-status/latest.json`
   - Render test list with filtering/sorting

3. **CLI Command**
   ```bash
   npm run manage test-status
   ```
   - Display test status in terminal
   - Option to run tests and update status
   - Generate markdown report

## Implementation Plan

### Phase 1: Data Collection (1-2 hours)
1. Create custom Jest reporter
2. Define test status data structure
3. Save test results to `.test-status/` directory
4. Test with existing test suites

### Phase 2: Dashboard UI (2-3 hours)
1. Add "Tests" tab to dashboard
2. Create test list component
3. Add filtering and sorting
4. Display test details on click
5. Style with existing dashboard theme

### Phase 3: CLI & Reporting (1-2 hours)
1. Add `npm run manage test-status` command
2. Generate terminal-friendly test status
3. Create markdown report format
4. Add to CI/CD pipeline (optional)

### Phase 4: Enhancements (Future)
1. Test coverage visualization
2. Flaky test detection (tests that fail intermittently)
3. Performance trends (test duration over time)
4. Email/Slack notifications for failures
5. Integration with GitHub Actions

## Technical Decisions

### Why Jest Reporter?
- Jest is already our test framework
- Custom reporters are easy to write
- No additional dependencies needed
- Works with existing test setup

### Why File-Based Storage?
- Simple, no database needed
- Git-trackable (can see test history in commits)
- Easy to inspect and debug
- Fast read/write for small datasets

### Why Separate Tab?
- Keeps feature roadmap focused
- Test health is a different concern
- Can expand test features without cluttering main dashboard
- Easy to navigate between views

## Success Criteria

- [ ] All tests from all 4 packages visible
- [ ] Last run timestamp accurate
- [ ] Pass/fail status correct
- [ ] Filtering by package works
- [ ] Sorting by status works
- [ ] Test details show on click
- [ ] CLI command displays status
- [ ] Updates automatically after test runs

## Future Enhancements

1. **GitHub Actions Integration**
   - Display CI test results
   - Link to GitHub Actions run logs
   - Show test results from PRs

2. **Test Coverage**
   - Show code coverage percentage
   - Highlight uncovered files
   - Coverage trends over time

3. **Performance Monitoring**
   - Track slow tests (> 1000ms)
   - Show test duration trends
   - Suggest performance improvements

4. **Notifications**
   - Email on test failures
   - Slack integration
   - GitHub commit status checks

5. **Flaky Test Detection**
   - Identify tests that fail intermittently
   - Calculate failure rate
   - Suggest fixes or quarantine

## Notes

- This depends on manager-v10 because we need the basic infrastructure for tracking project state
- Keep it simple initially - focus on visibility first
- Can expand features based on usage patterns
- Consider adding to CI/CD pipeline once stable
