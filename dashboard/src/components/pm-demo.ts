/**
 * Demo component to showcase base component functionality
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseComponent } from './base-component';

@customElement('pm-demo')
export class PMDemo extends BaseComponent {
  @property({ type: String })
  message = 'Hello from Lit!';

  @property({ type: Number })
  count = 0;

  static styles = [
    BaseComponent.styles,
    css`
      :host {
        display: block;
        padding: var(--spacing-lg, 24px);
      }

      .demo-card {
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-primary, #30363d);
        border-radius: var(--radius-md, 6px);
        padding: var(--spacing-lg, 24px);
        max-width: 600px;
      }

      h2 {
        color: var(--link, #58a6ff);
        margin-bottom: var(--spacing-md, 16px);
      }

      .controls {
        display: flex;
        gap: var(--spacing-sm, 8px);
        margin-top: var(--spacing-md, 16px);
      }

      button {
        background: var(--link, #58a6ff);
        color: white;
        border: none;
        padding: 8px 16px;
        border-radius: var(--radius-sm, 4px);
        cursor: pointer;
        font-size: 14px;
        transition: all 0.2s;
      }

      button:hover {
        background: var(--link-hover, #79c0ff);
      }

      button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .count {
        font-size: 48px;
        font-weight: bold;
        text-align: center;
        margin: var(--spacing-lg, 24px) 0;
        color: var(--success, #3fb950);
      }

      .info {
        color: var(--text-secondary, #8b949e);
        font-size: 14px;
        margin-top: var(--spacing-md, 16px);
      }
    `
  ];

  protected onMount(): void {
    console.log('Demo component mounted!');
  }

  protected onUnmount(): void {
    console.log('Demo component unmounted!');
  }

  private handleIncrement(): void {
    this.count++;
    this.emit('count-changed', { count: this.count });
  }

  private handleDecrement(): void {
    this.count--;
    this.emit('count-changed', { count: this.count });
  }

  private async handleAsyncAction(): Promise<void> {
    await this.withLoading(async () => {
      // Simulate async operation
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Randomly succeed or fail to demonstrate error handling
      if (Math.random() > 0.5) {
        this.count += 10;
        return true;
      } else {
        throw new Error('Random failure to demonstrate error handling');
      }
    }, 'Async operation failed');
  }

  render() {
    if (this.hasError) {
      return html`
        <div class="demo-card">
          <div class="error">
            <div class="error-message">❌ ${this.error!.message}</div>
            ${this.error!.details ? html`
              <div class="error-details">${JSON.stringify(this.error!.details, null, 2)}</div>
            ` : ''}
          </div>
          <button @click=${this.clearError}>Clear Error</button>
        </div>
      `;
    }

    return html`
      <div class="demo-card">
        <h2>${this.message}</h2>

        ${this.isLoading ? html`
          <div class="loading">⏳ Loading...</div>
        ` : html`
          <div class="count">${this.count}</div>

          <div class="controls">
            <button @click=${this.handleDecrement} ?disabled=${this.isLoading}>
              - Decrement
            </button>
            <button @click=${this.handleIncrement} ?disabled=${this.isLoading}>
              + Increment
            </button>
            <button @click=${this.handleAsyncAction} ?disabled=${this.isLoading}>
              🎲 Async Action
            </button>
          </div>

          <div class="info">
            Component mounted: ${this.getTimeAgo(new Date(this.mountedAt))}
          </div>
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-demo': PMDemo;
  }
}
