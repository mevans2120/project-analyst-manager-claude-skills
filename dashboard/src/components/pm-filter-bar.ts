/**
 * Filter bar component with multiple select dropdowns
 */

import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseComponent } from './base-component';

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  label: string;
  key: string;
  options: FilterOption[];
}

@customElement('pm-filter-bar')
export class PMFilterBar extends BaseComponent {
  @property({ type: Array })
  filterGroups: FilterGroup[] = [];

  @state()
  private selectedFilters: Record<string, string> = {};

  static styles = [
    BaseComponent.styles,
    css`
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
        white-space: nowrap;
      }

      select {
        background: var(--bg-primary, #0d1117);
        color: var(--text-primary, #c9d1d9);
        border: 1px solid var(--border-primary, #30363d);
        padding: 8px 12px;
        border-radius: var(--radius-md, 6px);
        font-size: 14px;
        font-family: var(--font-family);
        cursor: pointer;
        transition: all 0.2s;
        min-width: 150px;
      }

      select:focus {
        outline: none;
        border-color: var(--link, #58a6ff);
        box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
      }

      select:hover {
        border-color: var(--link, #58a6ff);
      }

      .clear-btn {
        background: var(--bg-tertiary, #21262d);
        color: var(--text-secondary, #8b949e);
        border: 1px solid var(--border-primary, #30363d);
        padding: 8px 16px;
        border-radius: var(--radius-md, 6px);
        font-size: 14px;
        cursor: pointer;
        transition: all 0.2s;
        margin-left: auto;
      }

      .clear-btn:hover {
        border-color: var(--link, #58a6ff);
        color: var(--link, #58a6ff);
      }

      @media (max-width: 768px) {
        .filter-bar {
          flex-direction: column;
          align-items: stretch;
        }

        .filter-group {
          width: 100%;
        }

        select {
          width: 100%;
        }

        .clear-btn {
          margin-left: 0;
          width: 100%;
        }
      }
    `
  ];

  private handleFilterChange(key: string, value: string): void {
    this.selectedFilters = {
      ...this.selectedFilters,
      [key]: value,
    };

    this.emit('filter-change', {
      filters: this.selectedFilters,
    });
  }

  private handleClearFilters(): void {
    this.selectedFilters = {};
    this.emit('filter-clear');
    this.emit('filter-change', { filters: {} });
    this.requestUpdate();
  }

  private hasActiveFilters(): boolean {
    return Object.values(this.selectedFilters).some(value => value !== 'all' && value !== '');
  }

  render() {
    return html`
      <div class="filter-bar">
        ${this.filterGroups.map(group => html`
          <div class="filter-group">
            <label class="filter-label">${group.label}:</label>
            <select
              @change="${(e: Event) => {
                const target = e.target as HTMLSelectElement;
                this.handleFilterChange(group.key, target.value);
              }}"
              .value="${this.selectedFilters[group.key] || 'all'}"
            >
              <option value="all">All</option>
              ${group.options.map(option => html`
                <option value="${option.value}">${option.label}</option>
              `)}
            </select>
          </div>
        `)}

        ${this.hasActiveFilters() ? html`
          <button
            class="clear-btn"
            @click="${this.handleClearFilters}"
          >
            Clear Filters
          </button>
        ` : ''}

        <slot></slot>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-filter-bar': PMFilterBar;
  }
}
