/**
 * Button component with multiple variants and states
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseComponent } from './base-component';

export type ButtonVariant = 'primary' | 'secondary' | 'success' | 'danger' | 'ghost';
export type ButtonSize = 'sm' | 'md' | 'lg';

@customElement('pm-button')
export class PMButton extends BaseComponent {
  @property({ type: String })
  label = '';

  @property({ type: String })
  variant: ButtonVariant = 'primary';

  @property({ type: String })
  size: ButtonSize = 'md';

  @property({ type: Boolean })
  disabled = false;

  @property({ type: Boolean })
  loading = false;

  @property({ type: String })
  href = '';

  static styles = [
    BaseComponent.styles,
    css`
      .btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-sm, 8px);
        font-family: var(--font-family);
        font-weight: 500;
        border: none;
        border-radius: var(--radius-md, 6px);
        cursor: pointer;
        transition: all 0.2s ease;
        text-decoration: none;
        white-space: nowrap;
      }

      .btn:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        pointer-events: none;
      }

      .btn.loading {
        position: relative;
        color: transparent;
      }

      .btn.loading::after {
        content: '';
        position: absolute;
        width: 16px;
        height: 16px;
        border: 2px solid currentColor;
        border-right-color: transparent;
        border-radius: 50%;
        animation: spin 0.6s linear infinite;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      /* Sizes */
      .btn.sm {
        font-size: 12px;
        padding: 6px 12px;
      }

      .btn.md {
        font-size: 13px;
        padding: 8px 16px;
      }

      .btn.lg {
        font-size: 14px;
        padding: 12px 20px;
      }

      /* Variants */
      .btn.primary {
        background: var(--link, #58a6ff);
        color: #0d1117;
      }

      .btn.primary:hover:not(:disabled) {
        background: var(--link-hover, #79c0ff);
      }

      .btn.secondary {
        background: var(--bg-tertiary, #21262d);
        color: var(--text-primary, #c9d1d9);
        border: 1px solid var(--border-primary, #30363d);
      }

      .btn.secondary:hover:not(:disabled) {
        background: var(--bg-secondary, #161b22);
        border-color: var(--link, #58a6ff);
      }

      .btn.success {
        background: var(--success, #3fb950);
        color: #0d1117;
      }

      .btn.success:hover:not(:disabled) {
        background: #4ac25c;
      }

      .btn.danger {
        background: var(--error, #f85149);
        color: #ffffff;
      }

      .btn.danger:hover:not(:disabled) {
        background: #ff6b63;
      }

      .btn.ghost {
        background: transparent;
        color: var(--link, #58a6ff);
      }

      .btn.ghost:hover:not(:disabled) {
        background: rgba(88, 166, 255, 0.1);
      }

      .btn-icon {
        display: inline-flex;
        align-items: center;
        justify-content: center;
      }
    `
  ];

  private handleClick(e: Event): void {
    if (this.disabled || this.loading) {
      e.preventDefault();
      return;
    }

    this.emit('click', { originalEvent: e });
  }

  render() {
    const classes = `btn ${this.variant} ${this.size} ${this.loading ? 'loading' : ''}`;

    const content = html`
      <span class="btn-icon">
        <slot name="icon"></slot>
      </span>
      <span>${this.label}</span>
      <slot></slot>
    `;

    if (this.href && !this.disabled && !this.loading) {
      return html`
        <a
          class="${classes}"
          href="${this.href}"
          @click="${this.handleClick}"
        >
          ${content}
        </a>
      `;
    }

    return html`
      <button
        class="${classes}"
        ?disabled="${this.disabled || this.loading}"
        @click="${this.handleClick}"
      >
        ${content}
      </button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-button': PMButton;
  }
}
