/**
 * Action Button - Trigger Claude Code skills from dashboard
 * PM-26: Dashboard Actions → Skill Invocations
 */

import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseComponent } from './base-component';
import type { ActionType, ActionRequest } from '../types/actions';
import { createActionRequest, getActionDisplayName, getActionIcon } from '../types/actions';
import './pm-icon';

@customElement('pm-action-button')
export class PMActionButton extends BaseComponent {
  @property({ type: String })
  action: ActionType = 'analyze';

  @property({ type: Object })
  payload: Record<string, any> = {};

  @property({ type: Boolean })
  disabled = false;

  @state()
  private showInstructions = false;

  @state()
  private lastActionId: string | null = null;

  static styles = [
    BaseComponent.styles,
    css`
      :host {
        display: inline-block;
      }

      .action-button {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs, 4px);
        padding: 8px 16px;
        background: var(--link, #58a6ff);
        border: none;
        border-radius: var(--radius-md, 6px);
        color: #0d1117;
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .action-button:hover:not(:disabled) {
        background: #1f6feb;
        transform: translateY(-1px);
        box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

      .action-button:active:not(:disabled) {
        transform: translateY(0);
      }

      .action-button:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }

      .instructions {
        position: fixed;
        bottom: var(--spacing-lg, 24px);
        right: var(--spacing-lg, 24px);
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-primary, #30363d);
        border-radius: var(--radius-md, 6px);
        padding: var(--spacing-md, 16px);
        max-width: 400px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
        z-index: 1000;
        animation: slideIn 0.3s ease;
      }

      @keyframes slideIn {
        from {
          transform: translateX(100%);
          opacity: 0;
        }
        to {
          transform: translateX(0);
          opacity: 1;
        }
      }

      .instructions-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-sm, 8px);
      }

      .instructions-title {
        color: var(--success, #3fb950);
        font-size: 14px;
        font-weight: 600;
        display: flex;
        align-items: center;
        gap: var(--spacing-xs, 4px);
      }

      .close-button {
        background: none;
        border: none;
        color: var(--text-secondary, #8b949e);
        cursor: pointer;
        padding: 4px;
        display: flex;
        align-items: center;
      }

      .close-button:hover {
        color: var(--text-primary, #c9d1d9);
      }

      .instructions-content {
        color: var(--text-secondary, #8b949e);
        font-size: 13px;
        line-height: 1.6;
      }

      .instructions-content ol {
        margin: var(--spacing-sm, 8px) 0;
        padding-left: var(--spacing-lg, 24px);
      }

      .instructions-content li {
        margin: var(--spacing-xs, 4px) 0;
      }

      .instructions-content code {
        background: var(--bg-tertiary, #21262d);
        padding: 2px 6px;
        border-radius: var(--radius-sm, 4px);
        font-family: 'Consolas', 'Monaco', monospace;
        font-size: 12px;
      }
    `
  ];

  private handleClick(): void {
    if (this.disabled) return;

    // Create action request
    const actionRequest = createActionRequest(this.action, this.payload);
    this.lastActionId = actionRequest.id;

    // Download JSON file
    this.downloadActionFile(actionRequest);

    // Show instructions
    this.showInstructions = true;

    // Auto-hide after 10 seconds
    setTimeout(() => {
      this.showInstructions = false;
    }, 10000);

    // Dispatch event
    this.dispatchEvent(new CustomEvent('action-created', {
      detail: { actionRequest },
      bubbles: true,
      composed: true
    }));
  }

  private downloadActionFile(action: ActionRequest): void {
    const json = JSON.stringify(action, null, 2);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${action.id}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private closeInstructions(): void {
    this.showInstructions = false;
  }

  render() {
    const displayName = getActionDisplayName(this.action);
    const iconName = getActionIcon(this.action);

    return html`
      <button
        class="action-button"
        @click="${this.handleClick}"
        ?disabled="${this.disabled}"
        title="${displayName}"
      >
        <pm-icon name="${iconName}" size="sm"></pm-icon>
        ${displayName}
      </button>

      ${this.showInstructions ? html`
        <div class="instructions">
          <div class="instructions-header">
            <div class="instructions-title">
              <pm-icon name="CheckCircle2" size="sm"></pm-icon>
              Action File Downloaded
            </div>
            <button class="close-button" @click="${this.closeInstructions}">
              <pm-icon name="X" size="sm"></pm-icon>
            </button>
          </div>
          <div class="instructions-content">
            <p>The action file has been downloaded. To execute:</p>
            <ol>
              <li>Create <code>.dashboard-actions/</code> directory in your project root</li>
              <li>Move the downloaded <code>${this.lastActionId}.json</code> file there</li>
              <li>Claude Code will automatically detect and process it</li>
            </ol>
            <p style="margin-top: 8px; color: var(--text-tertiary, #7d8590);">
              The action will appear as "pending" until Claude Code picks it up.
            </p>
          </div>
        </div>
      ` : ''}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-action-button': PMActionButton;
  }
}
