/**
 * Loading indicator component
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseComponent } from './base-component';

export type LoadingSize = 'sm' | 'md' | 'lg';

@customElement('pm-loading')
export class PMLoading extends BaseComponent {
  @property({ type: String })
  message = '';

  @property({ type: String })
  size: LoadingSize = 'md';

  static styles = [
    BaseComponent.styles,
    css`
      :host {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: var(--spacing-md, 16px);
        padding: var(--spacing-xl, 32px);
      }

      .spinner {
        border-radius: 50%;
        border: 3px solid var(--border-primary, #30363d);
        border-top-color: var(--link, #58a6ff);
        animation: spin 0.8s linear infinite;
      }

      .spinner.sm {
        width: 20px;
        height: 20px;
        border-width: 2px;
      }

      .spinner.md {
        width: 32px;
        height: 32px;
      }

      .spinner.lg {
        width: 48px;
        height: 48px;
        border-width: 4px;
      }

      @keyframes spin {
        to { transform: rotate(360deg); }
      }

      .message {
        color: var(--text-secondary, #8b949e);
        font-size: 14px;
      }
    `
  ];

  render() {
    return html`
      <div class="spinner ${this.size}"></div>
      ${this.message ? html`<div class="message">${this.message}</div>` : ''}
      <slot></slot>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-loading': PMLoading;
  }
}
