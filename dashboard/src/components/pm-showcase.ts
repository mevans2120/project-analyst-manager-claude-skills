/**
 * Component showcase - demonstrates all UI components
 */

import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BaseComponent } from './base-component';
import './pm-stat-card';
import './pm-badge';
import './pm-button';
import './pm-loading';
import './pm-error';
import './pm-search-input';
import './pm-filter-bar';
import './pm-icon';
import type { FilterGroup } from './pm-filter-bar';

@customElement('pm-showcase')
export class PMShowcase extends BaseComponent {
  @state()
  private showLoading = false;

  @state()
  private showError = false;

  @state()
  private searchValue = '';

  @state()
  private filterValues: Record<string, string> = {};

  private filterGroups: FilterGroup[] = [
    {
      label: 'Category',
      key: 'category',
      options: [
        { label: 'Dashboard', value: 'dashboard' },
        { label: 'Planner', value: 'planner' },
        { label: 'Analyzer', value: 'analyzer' },
      ],
    },
    {
      label: 'Priority',
      key: 'priority',
      options: [
        { label: 'P0', value: 'p0' },
        { label: 'P1', value: 'p1' },
        { label: 'P2', value: 'p2' },
      ],
    },
  ];

  static styles = [
    BaseComponent.styles,
    css`
      .showcase {
        padding: var(--spacing-lg, 24px);
        max-width: 1200px;
        margin: 0 auto;
      }

      .section {
        margin-bottom: var(--spacing-xl, 32px);
      }

      .section-title {
        color: var(--link, #58a6ff);
        font-size: 24px;
        margin-bottom: var(--spacing-md, 16px);
        border-bottom: 1px solid var(--border-primary, #30363d);
        padding-bottom: var(--spacing-sm, 8px);
      }

      .section-subtitle {
        color: var(--text-secondary, #8b949e);
        font-size: 14px;
        margin-bottom: var(--spacing-lg, 24px);
      }

      .grid {
        display: grid;
        gap: var(--spacing-md, 16px);
      }

      .grid-2 {
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        grid-auto-rows: 1fr;
      }

      .grid-3 {
        grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      }

      .demo-box {
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-primary, #30363d);
        border-radius: var(--radius-md, 6px);
        padding: var(--spacing-lg, 24px);
      }

      .button-group {
        display: flex;
        gap: var(--spacing-sm, 8px);
        flex-wrap: wrap;
      }

      .badge-group {
        display: flex;
        gap: var(--spacing-sm, 8px);
        flex-wrap: wrap;
        align-items: center;
      }

      .output {
        margin-top: var(--spacing-md, 16px);
        padding: var(--spacing-md, 16px);
        background: var(--bg-primary, #0d1117);
        border: 1px solid var(--border-primary, #30363d);
        border-radius: var(--radius-sm, 4px);
        font-family: var(--font-mono, monospace);
        font-size: 12px;
        color: var(--text-secondary, #8b949e);
      }
    `
  ];

  private handleAsyncAction(): void {
    this.showLoading = true;
    this.showError = false;

    setTimeout(() => {
      this.showLoading = false;
      if (Math.random() > 0.5) {
        this.showError = true;
      }
    }, 2000);
  }

  private handleSearch(e: CustomEvent): void {
    this.searchValue = e.detail.value;
  }

  private handleFilter(e: CustomEvent): void {
    this.filterValues = e.detail.filters;
  }

  render() {
    return html`
      <div class="showcase">
        <h1 style="color: var(--link, #58a6ff); margin-bottom: var(--spacing-lg, 24px);">
          Component Library Showcase
        </h1>

        <!-- Stat Cards -->
        <div class="section">
          <h2 class="section-title">Stat Cards</h2>
          <p class="section-subtitle">Display key metrics with status indicators</p>
          <div class="grid grid-2">
            <pm-stat-card
              label="Total Features"
              value="17"
              status="neutral"
            >
              <pm-icon slot="icon" name="BarChart3" size="lg" color="var(--link, #58a6ff)"></pm-icon>
            </pm-stat-card>
            <pm-stat-card
              label="Tests Passing"
              value="60"
              status="success"
              subtitle="100% pass rate"
            >
              <pm-icon slot="icon" name="CheckCircle2" size="lg" color="var(--success, #3fb950)"></pm-icon>
            </pm-stat-card>
            <pm-stat-card
              label="Failing Tests"
              value="0"
              status="error"
            >
              <pm-icon slot="icon" name="XCircle" size="lg" color="var(--error, #f85149)"></pm-icon>
            </pm-stat-card>
            <pm-stat-card
              label="In Progress"
              value="3"
              status="warning"
            >
              <pm-icon slot="icon" name="RefreshCw" size="lg" color="var(--warning, #d29922)"></pm-icon>
            </pm-stat-card>
          </div>
        </div>

        <!-- Badges -->
        <div class="section">
          <h2 class="section-title">Badges</h2>
          <p class="section-subtitle">Status, priority, and category indicators</p>
          <div class="demo-box">
            <h3 style="color: var(--text-primary, #c9d1d9); margin-bottom: var(--spacing-md, 16px);">Filled Variants</h3>
            <div class="badge-group">
              <pm-badge label="Primary" variant="primary"></pm-badge>
              <pm-badge label="Success" variant="success"></pm-badge>
              <pm-badge label="Warning" variant="warning"></pm-badge>
              <pm-badge label="Error" variant="error"></pm-badge>
              <pm-badge label="Neutral" variant="neutral"></pm-badge>
              <pm-badge label="Info" variant="info"></pm-badge>
            </div>

            <h3 style="color: var(--text-primary, #c9d1d9); margin: var(--spacing-lg, 24px) 0 var(--spacing-md, 16px);">Outlined Variants</h3>
            <div class="badge-group">
              <pm-badge label="Primary" variant="primary" outlined></pm-badge>
              <pm-badge label="Success" variant="success" outlined></pm-badge>
              <pm-badge label="Warning" variant="warning" outlined></pm-badge>
              <pm-badge label="Error" variant="error" outlined></pm-badge>
            </div>

            <h3 style="color: var(--text-primary, #c9d1d9); margin: var(--spacing-lg, 24px) 0 var(--spacing-md, 16px);">Sizes</h3>
            <div class="badge-group">
              <pm-badge label="Small" size="sm"></pm-badge>
              <pm-badge label="Medium" size="md"></pm-badge>
              <pm-badge label="Large" size="lg"></pm-badge>
            </div>
          </div>
        </div>

        <!-- Buttons -->
        <div class="section">
          <h2 class="section-title">Buttons</h2>
          <p class="section-subtitle">Interactive buttons with multiple variants and states</p>
          <div class="demo-box">
            <h3 style="color: var(--text-primary, #c9d1d9); margin-bottom: var(--spacing-md, 16px);">Variants</h3>
            <div class="button-group">
              <pm-button label="Primary" variant="primary"></pm-button>
              <pm-button label="Secondary" variant="secondary"></pm-button>
              <pm-button label="Success" variant="success"></pm-button>
              <pm-button label="Danger" variant="danger"></pm-button>
              <pm-button label="Ghost" variant="ghost"></pm-button>
            </div>

            <h3 style="color: var(--text-primary, #c9d1d9); margin: var(--spacing-lg, 24px) 0 var(--spacing-md, 16px);">With Icons</h3>
            <div class="button-group">
              <pm-button label="Search">
                <pm-icon slot="icon" name="Search" size="sm"></pm-icon>
              </pm-button>
              <pm-button label="Settings" variant="secondary">
                <pm-icon slot="icon" name="Settings" size="sm"></pm-icon>
              </pm-button>
              <pm-button label="Delete" variant="danger">
                <pm-icon slot="icon" name="Trash2" size="sm"></pm-icon>
              </pm-button>
            </div>

            <h3 style="color: var(--text-primary, #c9d1d9); margin: var(--spacing-lg, 24px) 0 var(--spacing-md, 16px);">States</h3>
            <div class="button-group">
              <pm-button label="Disabled" disabled></pm-button>
              <pm-button label="Loading" loading></pm-button>
              <pm-button
                label="Async Action"
                variant="success"
                ?loading="${this.showLoading}"
                @click="${this.handleAsyncAction}"
              ></pm-button>
            </div>
          </div>
        </div>

        <!-- Loading & Error -->
        <div class="section">
          <h2 class="section-title">Loading & Error States</h2>
          <p class="section-subtitle">Feedback components for async operations</p>
          <div class="grid grid-2">
            <div class="demo-box">
              <h3 style="color: var(--text-primary, #c9d1d9); margin-bottom: var(--spacing-md, 16px);">Loading</h3>
              ${this.showLoading ? html`
                <pm-loading message="Processing..."></pm-loading>
              ` : html`
                <pm-loading size="sm" message="Small spinner"></pm-loading>
                <div style="margin: var(--spacing-md, 16px) 0;">
                  <pm-loading size="md" message="Medium spinner"></pm-loading>
                </div>
                <pm-loading size="lg" message="Large spinner"></pm-loading>
              `}
            </div>

            <div class="demo-box">
              <h3 style="color: var(--text-primary, #c9d1d9); margin-bottom: var(--spacing-md, 16px);">Error</h3>
              ${this.showError ? html`
                <pm-error
                  message="Operation failed! Random error occurred."
                  dismissible
                  @dismiss="${() => { this.showError = false; }}"
                ></pm-error>
              ` : html`
                <pm-error message="This is a basic error message"></pm-error>
                <div style="margin-top: var(--spacing-md, 16px);">
                  <pm-error
                    .errorState="${{
                      message: 'Detailed error with stack trace',
                      details: { code: 'E500', timestamp: new Date().toISOString() }
                    }}"
                    dismissible
                  ></pm-error>
                </div>
              `}
            </div>
          </div>
        </div>

        <!-- Search Input -->
        <div class="section">
          <h2 class="section-title">Search Input</h2>
          <p class="section-subtitle">Debounced search with clear button</p>
          <div class="demo-box">
            <pm-search-input
              placeholder="Search components..."
              @search="${this.handleSearch}"
            ></pm-search-input>
            ${this.searchValue ? html`
              <div class="output">
                Search value: "${this.searchValue}"
              </div>
            ` : ''}
          </div>
        </div>

        <!-- Filter Bar -->
        <div class="section">
          <h2 class="section-title">Filter Bar</h2>
          <p class="section-subtitle">Multi-select filter controls</p>
          <pm-filter-bar
            .filterGroups="${this.filterGroups}"
            @filter-change="${this.handleFilter}"
          ></pm-filter-bar>
          ${Object.keys(this.filterValues).length > 0 ? html`
            <div class="output" style="margin-top: var(--spacing-md, 16px);">
              Active filters: ${JSON.stringify(this.filterValues, null, 2)}
            </div>
          ` : ''}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-showcase': PMShowcase;
  }
}
