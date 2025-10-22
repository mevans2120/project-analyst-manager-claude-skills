/**
 * Test card component
 * Displays an individual test result with status, duration, and metadata
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseComponent } from './base-component';
import type { TestResult } from '../types/test';
import './pm-badge';
import './pm-icon';

@customElement('pm-test-card')
export class PMTestCard extends BaseComponent {
  @property({ type: Object })
  test: TestResult | null = null;

  static styles = [
    BaseComponent.styles,
    css`
      .test-card {
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-primary, #30363d);
        border-radius: var(--radius-md, 6px);
        padding: 12px 16px;
        transition: all 0.2s ease;
        display: flex;
        align-items: center;
        gap: 12px;
      }

      .test-card:hover {
        border-color: var(--link, #58a6ff);
        background: var(--bg-tertiary, #1c2128);
      }

      .test-card.failed {
        border-color: var(--error, #f85149);
      }

      .test-card.skipped {
        opacity: 0.6;
      }

      .test-icon {
        flex-shrink: 0;
      }

      .test-content {
        flex: 1;
        min-width: 0;
      }

      .test-name {
        font-size: 13px;
        font-weight: 500;
        color: var(--text-primary, #c9d1d9);
        margin: 0 0 4px 0;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .test-meta {
        display: flex;
        gap: 8px;
        align-items: center;
        flex-wrap: wrap;
      }

      .test-suite,
      .test-file {
        font-size: 11px;
        color: var(--text-tertiary, #7d8590);
        font-family: var(--font-mono, monospace);
      }

      .test-duration {
        font-size: 11px;
        color: var(--text-secondary, #8b949e);
        margin-left: auto;
        flex-shrink: 0;
      }

      .test-error {
        margin-top: 8px;
        padding: 8px;
        background: var(--bg-primary, #0d1117);
        border-left: 2px solid var(--error, #f85149);
        font-size: 11px;
        font-family: var(--font-mono, monospace);
        color: var(--error, #f85149);
        white-space: pre-wrap;
        word-break: break-word;
      }
    `
  ];

  private getStatusIcon(status: string): string {
    switch (status) {
      case 'passed':
        return 'CheckCircle2';
      case 'failed':
        return 'XCircle';
      case 'skipped':
        return 'MinusCircle';
      default:
        return 'Circle';
    }
  }

  private getStatusColor(status: string): string {
    switch (status) {
      case 'passed':
        return 'var(--success, #3fb950)';
      case 'failed':
        return 'var(--error, #f85149)';
      case 'skipped':
        return 'var(--text-secondary, #8b949e)';
      default:
        return 'var(--text-secondary, #8b949e)';
    }
  }

  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  }

  render() {
    if (!this.test) {
      return html`<div class="test-card">No test data</div>`;
    }

    const { name, suite, file, status, duration, error } = this.test;
    const iconName = this.getStatusIcon(status);
    const iconColor = this.getStatusColor(status);

    return html`
      <div class="test-card ${status}">
        <div class="test-icon">
          <pm-icon name="${iconName}" size="sm" color="${iconColor}"></pm-icon>
        </div>
        <div class="test-content">
          <div class="test-name" title="${name}">${name}</div>
          <div class="test-meta">
            <span class="test-suite">${suite}</span>
            <span class="test-file" title="${file}">${file.split('/').pop()}</span>
          </div>
          ${error ? html`<div class="test-error">${error}</div>` : ''}
        </div>
        <div class="test-duration">${this.formatDuration(duration)}</div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-test-card': PMTestCard;
  }
}
