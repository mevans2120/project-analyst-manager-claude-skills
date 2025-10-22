/**
 * Error display component
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseComponent } from './base-component';
import type { ErrorState } from '../types/common';

@customElement('pm-error')
export class PMError extends BaseComponent {
  @property({ type: String })
  message = '';

  @property({ type: Object })
  errorState: ErrorState | null = null;

  @property({ type: Boolean })
  dismissible = false;

  static styles = [
    BaseComponent.styles,
    css`
      .error-container {
        background: rgba(248, 81, 73, 0.1);
        border: 1px solid var(--error, #f85149);
        border-radius: var(--radius-md, 6px);
        padding: var(--spacing-md, 16px);
        color: var(--error, #f85149);
      }

      .error-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--spacing-md, 16px);
      }

      .error-content {
        flex: 1;
      }

      .error-message {
        font-weight: 500;
        margin-bottom: var(--spacing-sm, 8px);
        display: flex;
        align-items: center;
        gap: var(--spacing-sm, 8px);
      }

      .error-icon {
        font-size: 20px;
      }

      .error-details {
        font-size: 13px;
        opacity: 0.8;
        font-family: var(--font-mono, monospace);
        background: rgba(0, 0, 0, 0.2);
        padding: var(--spacing-sm, 8px);
        border-radius: var(--radius-sm, 4px);
        margin-top: var(--spacing-sm, 8px);
        overflow-x: auto;
        max-height: 200px;
        overflow-y: auto;
      }

      .dismiss-btn {
        background: none;
        border: none;
        color: var(--error, #f85149);
        cursor: pointer;
        padding: 4px;
        opacity: 0.7;
        transition: opacity 0.2s;
        font-size: 18px;
        line-height: 1;
      }

      .dismiss-btn:hover {
        opacity: 1;
      }
    `
  ];

  private handleDismiss(): void {
    this.emit('dismiss');
  }

  render() {
    const displayMessage = this.errorState?.message || this.message;
    const details = this.errorState?.details;

    if (!displayMessage) {
      return html`<slot></slot>`;
    }

    return html`
      <div class="error-container">
        <div class="error-header">
          <div class="error-content">
            <div class="error-message">
              <span class="error-icon">❌</span>
              <span>${displayMessage}</span>
            </div>
            ${details ? html`
              <div class="error-details">
                ${typeof details === 'string'
                  ? details
                  : JSON.stringify(details, null, 2)}
              </div>
            ` : ''}
            <slot></slot>
          </div>
          ${this.dismissible ? html`
            <button
              class="dismiss-btn"
              @click="${this.handleDismiss}"
              title="Dismiss"
            >
              ×
            </button>
          ` : ''}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-error': PMError;
  }
}
