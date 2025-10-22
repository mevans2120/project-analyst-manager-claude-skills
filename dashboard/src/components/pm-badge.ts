/**
 * Badge component for status, priority, and category indicators
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseComponent } from './base-component';

export type BadgeVariant = 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info';
export type BadgeSize = 'sm' | 'md' | 'lg';

@customElement('pm-badge')
export class PMBadge extends BaseComponent {
  @property({ type: String })
  label = '';

  @property({ type: String })
  variant: BadgeVariant = 'neutral';

  @property({ type: String })
  size: BadgeSize = 'md';

  @property({ type: Boolean })
  outlined = false;

  static styles = [
    BaseComponent.styles,
    css`
      .badge {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        font-weight: 600;
        border-radius: var(--radius-sm, 4px);
        white-space: nowrap;
        transition: all 0.2s ease;
      }

      /* Sizes */
      .badge.sm {
        font-size: 11px;
        padding: 2px 6px;
      }

      .badge.md {
        font-size: 12px;
        padding: 4px 8px;
      }

      .badge.lg {
        font-size: 13px;
        padding: 6px 12px;
      }

      /* Filled variants */
      .badge.primary {
        background: var(--link, #58a6ff);
        color: #0d1117;
      }

      .badge.success {
        background: var(--success, #3fb950);
        color: #0d1117;
      }

      .badge.warning {
        background: var(--warning, #d29922);
        color: #0d1117;
      }

      .badge.error {
        background: var(--error, #f85149);
        color: #ffffff;
      }

      .badge.neutral {
        background: var(--bg-tertiary, #21262d);
        color: var(--text-secondary, #8b949e);
      }

      .badge.info {
        background: var(--purple, #bc8cff);
        color: #0d1117;
      }

      /* Outlined variants */
      .badge.outlined {
        background: transparent;
        border: 1px solid currentColor;
      }

      .badge.outlined.primary {
        color: var(--link, #58a6ff);
      }

      .badge.outlined.success {
        color: var(--success, #3fb950);
      }

      .badge.outlined.warning {
        color: var(--warning, #d29922);
      }

      .badge.outlined.error {
        color: var(--error, #f85149);
      }

      .badge.outlined.neutral {
        color: var(--text-secondary, #8b949e);
      }

      .badge.outlined.info {
        color: var(--purple, #bc8cff);
      }
    `
  ];

  render() {
    const classes = `badge ${this.variant} ${this.size} ${this.outlined ? 'outlined' : ''}`;

    return html`
      <span class="${classes}">
        ${this.label}
      </span>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-badge': PMBadge;
  }
}
