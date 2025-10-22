/**
 * Statistics card component
 * Displays a numeric value with label and status indicator
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseComponent } from './base-component';

export type StatStatus = 'success' | 'warning' | 'error' | 'neutral';

@customElement('pm-stat-card')
export class PMStatCard extends BaseComponent {
  @property({ type: String })
  label = '';

  @property({ type: Number })
  value = 0;

  @property({ type: String })
  status: StatStatus = 'neutral';

  @property({ type: String })
  subtitle = '';

  @property({ type: String })
  ariaLabel = '';

  private handleKeyDown(e: KeyboardEvent): void {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      (e.target as HTMLElement).click();
    }
  }

  static styles = [
    BaseComponent.styles,
    css`
      .stat-card {
        background: var(--bg-secondary, #161b22);
        padding: var(--spacing-lg, 24px);
        border-radius: var(--radius-md, 6px);
        border: 1px solid var(--border-primary, #30363d);
        text-align: center;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        height: 100%;
        cursor: pointer;
      }

      .stat-card:hover {
        border-color: var(--link, #58a6ff);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .stat-card:focus {
        outline: 2px solid var(--link, #58a6ff);
        outline-offset: 2px;
        border-color: var(--link, #58a6ff);
      }

      .stat-card:focus:not(:focus-visible) {
        outline: none;
      }

      .stat-card:focus-visible {
        outline: 2px solid var(--link, #58a6ff);
        outline-offset: 2px;
      }

      .stat-icon {
        margin-bottom: var(--spacing-sm, 8px);
        display: flex;
        justify-content: center;
        align-items: center;
      }

      .stat-number {
        font-size: 36px;
        font-weight: bold;
        margin-bottom: var(--spacing-xs, 4px);
        line-height: 1;
      }

      .stat-number.success {
        color: var(--success, #3fb950);
      }

      .stat-number.warning {
        color: var(--warning, #d29922);
      }

      .stat-number.error {
        color: var(--error, #f85149);
      }

      .stat-number.neutral {
        color: var(--link, #58a6ff);
      }

      .stat-label {
        color: var(--text-secondary, #8b949e);
        font-size: 14px;
        font-weight: 500;
        margin-bottom: var(--spacing-xs, 4px);
      }

      .stat-subtitle {
        color: var(--text-tertiary, #6e7681);
        font-size: 12px;
      }

      @media (max-width: 768px) {
        .stat-card {
          padding: var(--spacing-md, 16px);
        }

        .stat-number {
          font-size: 28px;
        }
      }
    `
  ];

  render() {
    const ariaLabelText = this.ariaLabel || `View ${this.label} section: ${this.value} items`;

    return html`
      <div
        class="stat-card"
        role="button"
        tabindex="0"
        aria-label="${ariaLabelText}"
        @keydown="${this.handleKeyDown}"
      >
        <div class="stat-icon">
          <slot name="icon"></slot>
        </div>
        <div class="stat-number ${this.status}">${this.value}</div>
        <div class="stat-label">${this.label}</div>
        ${this.subtitle ? html`<div class="stat-subtitle">${this.subtitle}</div>` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-stat-card': PMStatCard;
  }
}
