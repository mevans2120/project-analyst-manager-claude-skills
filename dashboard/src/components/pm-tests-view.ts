/**
 * Tests view component
 * Displays test results with filtering and statistics
 */

import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BaseComponent } from './base-component';
import type { PackageTestRun, TestSummary, TestResult, TestStatus } from '../types/test';
import './pm-stat-card';
import './pm-badge';
import './pm-search-input';
import './pm-test-card';
import './pm-loading';
import './pm-error';
import './pm-icon';

@customElement('pm-tests-view')
export class PMTestsView extends BaseComponent {
  @state()
  private testData: PackageTestRun[] = [];

  @state()
  private summary: TestSummary | null = null;

  @state()
  private searchQuery = '';

  @state()
  private statusFilter: TestStatus = 'all';

  @state()
  private packageFilter = 'all';

  static styles = [
    BaseComponent.styles,
    css`
      .tests-view {
        padding: var(--spacing-lg, 24px);
        max-width: 1400px;
        margin: 0 auto;
      }

      .tests-header {
        margin-bottom: var(--spacing-xl, 32px);
      }

      .tests-title {
        color: var(--link, #58a6ff);
        font-size: 32px;
        margin: 0 0 var(--spacing-sm, 8px) 0;
      }

      .tests-subtitle {
        color: var(--text-secondary, #8b949e);
        font-size: 16px;
        margin: 0;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-xl, 32px);
        margin-bottom: 48px;
      }

      .controls {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md, 16px);
        margin-bottom: var(--spacing-xl, 32px);
      }

      .filter-bar {
        background: var(--bg-secondary, #161b22);
        padding: var(--spacing-lg, 24px);
        border-radius: var(--radius-md, 6px);
        border: 1px solid var(--border-primary, #30363d);
        display: flex;
        gap: var(--spacing-md, 16px);
        flex-wrap: wrap;
        align-items: center;
      }

      .filter-group {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm, 8px);
      }

      .filter-label {
        color: var(--text-secondary, #8b949e);
        font-size: 14px;
        font-weight: 500;
      }

      select {
        background: var(--bg-primary, #0d1117);
        color: var(--text-primary, #c9d1d9);
        border: 1px solid var(--border-primary, #30363d);
        padding: 8px 12px;
        border-radius: var(--radius-md, 6px);
        font-size: 14px;
        cursor: pointer;
      }

      select:focus {
        outline: 2px solid var(--link, #58a6ff);
        outline-offset: 2px;
      }

      .tests-container {
        display: flex;
        flex-direction: column;
        gap: 8px;
      }

      .suite-group {
        margin-bottom: var(--spacing-lg, 24px);
      }

      .suite-header {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm, 8px);
        margin-bottom: var(--spacing-md, 16px);
        padding-bottom: var(--spacing-sm, 8px);
        border-bottom: 1px solid var(--border-primary, #30363d);
      }

      .suite-name {
        color: var(--text-primary, #c9d1d9);
        font-size: 16px;
        font-weight: 600;
        margin: 0;
      }

      .suite-count {
        background: var(--bg-tertiary, #21262d);
        color: var(--text-secondary, #8b949e);
        font-size: 12px;
        padding: 2px 8px;
        border-radius: var(--radius-sm, 4px);
      }

      .empty-state {
        text-align: center;
        padding: var(--spacing-xl, 32px);
        color: var(--text-tertiary, #7d8590);
      }

      @media (max-width: 768px) {
        .tests-view {
          padding: var(--spacing-md, 16px);
        }

        .tests-title {
          font-size: 24px;
        }
      }
    `
  ];

  protected onMount(): void {
    this.loadTestData();
  }

  private async loadTestData(): Promise<void> {
    await this.withLoading(async () => {
      // Load both latest.json and summary.json
      const [latestResponse, summaryResponse] = await Promise.all([
        fetch('/.test-status/latest.json'),
        fetch('/.test-status/summary.json')
      ]);

      if (!latestResponse.ok || !summaryResponse.ok) {
        throw new Error('Failed to load test data');
      }

      this.testData = await latestResponse.json();
      this.summary = await summaryResponse.json();
    }, 'Failed to load test results');
  }

  private handleSearch(e: CustomEvent): void {
    this.searchQuery = e.detail.value.toLowerCase();
  }

  private filterTests(tests: TestResult[]): TestResult[] {
    return tests.filter(test => {
      // Search filter
      if (this.searchQuery) {
        const searchableText = `${test.name} ${test.suite} ${test.file}`.toLowerCase();
        if (!searchableText.includes(this.searchQuery)) {
          return false;
        }
      }

      // Status filter
      if (this.statusFilter !== 'all' && test.status !== this.statusFilter) {
        return false;
      }

      // Package filter
      if (this.packageFilter !== 'all' && test.package !== this.packageFilter) {
        return false;
      }

      return true;
    });
  }

  private groupTestsBySuite(tests: TestResult[]): Map<string, TestResult[]> {
    const grouped = new Map<string, TestResult[]>();

    for (const test of tests) {
      if (!grouped.has(test.suite)) {
        grouped.set(test.suite, []);
      }
      grouped.get(test.suite)!.push(test);
    }

    return grouped;
  }

  render() {
    if (this.loadingState === 'loading') {
      return html`
        <div class="tests-view">
          <pm-loading message="Loading test results..." size="lg"></pm-loading>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="tests-view">
          <pm-error .errorState="${this.error}" dismissible @dismiss="${() => this.error = null}"></pm-error>
        </div>
      `;
    }

    if (!this.summary || !this.testData.length) {
      return html`<div class="tests-view">No test data available</div>`;
    }

    // Get all tests from all packages
    const allTests = this.testData.flatMap(pkg => pkg.tests);
    const filteredTests = this.filterTests(allTests);
    const groupedTests = this.groupTestsBySuite(filteredTests);

    // Get unique packages for filter
    const packages = [...new Set(this.testData.map(pkg => pkg.package))];

    return html`
      <div class="tests-view">
        <div class="tests-header">
          <h1 class="tests-title">Test Results</h1>
          <p class="tests-subtitle">Last updated: ${new Date(this.summary.lastUpdated).toLocaleString()}</p>
        </div>

        <div class="stats-grid">
          <pm-stat-card
            label="Total Tests"
            value="${this.summary.overall.totalTests}"
            status="neutral"
          >
            <pm-icon slot="icon" name="FileCode" size="lg" color="var(--link, #58a6ff)"></pm-icon>
          </pm-stat-card>

          <pm-stat-card
            label="Passed"
            value="${this.summary.overall.passed}"
            status="success"
          >
            <pm-icon slot="icon" name="CheckCircle2" size="lg" color="var(--success, #3fb950)"></pm-icon>
          </pm-stat-card>

          <pm-stat-card
            label="Failed"
            value="${this.summary.overall.failed}"
            status="${this.summary.overall.failed > 0 ? 'error' : 'neutral'}"
          >
            <pm-icon slot="icon" name="XCircle" size="lg" color="${this.summary.overall.failed > 0 ? 'var(--error, #f85149)' : 'var(--text-secondary, #8b949e)'}"></pm-icon>
          </pm-stat-card>

          <pm-stat-card
            label="Skipped"
            value="${this.summary.overall.skipped}"
            status="neutral"
          >
            <pm-icon slot="icon" name="MinusCircle" size="lg" color="var(--text-secondary, #8b949e)"></pm-icon>
          </pm-stat-card>
        </div>

        <div class="controls">
          <pm-search-input
            placeholder="Search tests..."
            label="Search tests"
            @search="${this.handleSearch}"
          ></pm-search-input>

          <div class="filter-bar">
            <div class="filter-group">
              <label class="filter-label" for="status-filter">Status:</label>
              <select
                id="status-filter"
                @change="${(e: Event) => this.statusFilter = (e.target as HTMLSelectElement).value as TestStatus}"
              >
                <option value="all">All</option>
                <option value="passed">Passed</option>
                <option value="failed">Failed</option>
                <option value="skipped">Skipped</option>
              </select>
            </div>

            ${packages.length > 1 ? html`
              <div class="filter-group">
                <label class="filter-label" for="package-filter">Package:</label>
                <select
                  id="package-filter"
                  @change="${(e: Event) => this.packageFilter = (e.target as HTMLSelectElement).value}"
                >
                  <option value="all">All</option>
                  ${packages.map(pkg => html`
                    <option value="${pkg}">${pkg}</option>
                  `)}
                </select>
              </div>
            ` : ''}
          </div>
        </div>

        ${filteredTests.length === 0 ? html`
          <div class="empty-state">
            <pm-icon name="Search" size="xl"></pm-icon>
            <p>No tests match your filters</p>
          </div>
        ` : html`
          <div class="tests-container">
            ${Array.from(groupedTests.entries()).map(([suite, tests]) => html`
              <div class="suite-group">
                <div class="suite-header">
                  <pm-icon name="Folder" size="sm" color="var(--link, #58a6ff)"></pm-icon>
                  <h2 class="suite-name">${suite}</h2>
                  <span class="suite-count">${tests.length}</span>
                </div>
                ${tests.map(test => html`
                  <pm-test-card .test="${test}"></pm-test-card>
                `)}
              </div>
            `)}
          </div>
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-tests-view': PMTestsView;
  }
}
