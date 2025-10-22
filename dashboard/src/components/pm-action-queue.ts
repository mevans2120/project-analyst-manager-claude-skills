/**
 * Action Queue - Display and manage dashboard action requests
 * PM-27: Action Queue System
 */

import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BaseComponent } from './base-component';
import { ActionQueue, type QueueChangedEvent } from '../services/action-queue';
import type { ActionRequest, ActionStatus } from '../types/actions';
import { getActionDisplayName, getActionIcon } from '../types/actions';
import './pm-icon';
import './pm-badge';

@customElement('pm-action-queue')
export class PMActionQueue extends BaseComponent {
  @state()
  private actions: ActionRequest[] = [];

  @state()
  private statusCounts: Record<ActionStatus, number> = {
    pending: 0,
    processing: 0,
    completed: 0,
    failed: 0
  };

  @state()
  private selectedStatus: ActionStatus | 'all' = 'all';

  @state()
  private isExpanded = false;

  private actionQueue: ActionQueue | null = null;

  static styles = [
    BaseComponent.styles,
    css`
      :host {
        display: block;
      }

      .queue-container {
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-primary, #30363d);
        border-radius: var(--radius-md, 6px);
      }

      .queue-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md, 16px);
        border-bottom: 1px solid var(--border-primary, #30363d);
        cursor: pointer;
        user-select: none;
      }

      .queue-header:hover {
        background: var(--bg-tertiary, #21262d);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm, 8px);
      }

      .queue-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary, #c9d1d9);
      }

      .status-counts {
        display: flex;
        gap: var(--spacing-sm, 8px);
      }

      .expand-icon {
        transition: transform 0.2s ease;
      }

      .expand-icon.expanded {
        transform: rotate(180deg);
      }

      .queue-content {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
      }

      .queue-content.expanded {
        max-height: 600px;
        overflow-y: auto;
      }

      .filter-bar {
        display: flex;
        gap: var(--spacing-xs, 4px);
        padding: var(--spacing-md, 16px);
        border-bottom: 1px solid var(--border-primary, #30363d);
      }

      .filter-button {
        padding: 6px 12px;
        background: var(--bg-tertiary, #21262d);
        border: 1px solid var(--border-primary, #30363d);
        border-radius: var(--radius-sm, 4px);
        color: var(--text-secondary, #8b949e);
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .filter-button:hover {
        background: var(--bg-hover, #2d333b);
        color: var(--text-primary, #c9d1d9);
      }

      .filter-button.active {
        background: var(--link, #58a6ff);
        color: #0d1117;
        border-color: var(--link, #58a6ff);
      }

      .actions-list {
        padding: var(--spacing-md, 16px);
      }

      .action-item {
        display: flex;
        align-items: center;
        gap: var(--spacing-md, 16px);
        padding: var(--spacing-md, 16px);
        background: var(--bg-tertiary, #21262d);
        border: 1px solid var(--border-primary, #30363d);
        border-radius: var(--radius-md, 6px);
        margin-bottom: var(--spacing-sm, 8px);
      }

      .action-icon {
        flex-shrink: 0;
      }

      .action-details {
        flex: 1;
        min-width: 0;
      }

      .action-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary, #c9d1d9);
        margin-bottom: 4px;
      }

      .action-meta {
        font-size: 12px;
        color: var(--text-secondary, #8b949e);
      }

      .action-actions {
        display: flex;
        gap: var(--spacing-xs, 4px);
      }

      .action-button {
        padding: 4px 8px;
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-primary, #30363d);
        border-radius: var(--radius-sm, 4px);
        color: var(--text-secondary, #8b949e);
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .action-button:hover {
        background: var(--bg-hover, #2d333b);
        color: var(--text-primary, #c9d1d9);
      }

      .action-button.danger:hover {
        background: var(--danger, #f85149);
        color: white;
        border-color: var(--danger, #f85149);
      }

      .empty-state {
        text-align: center;
        padding: var(--spacing-xl, 32px);
        color: var(--text-secondary, #8b949e);
      }

      .clear-button {
        padding: 6px 12px;
        background: var(--bg-tertiary, #21262d);
        border: 1px solid var(--border-primary, #30363d);
        border-radius: var(--radius-sm, 4px);
        color: var(--text-secondary, #8b949e);
        font-size: 13px;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .clear-button:hover {
        background: var(--danger, #f85149);
        color: white;
        border-color: var(--danger, #f85149);
      }
    `
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this.startQueue();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopQueue();
  }

  private startQueue(): void {
    this.actionQueue = new ActionQueue();
    this.actionQueue.addEventListener('queue-changed', ((e: CustomEvent<QueueChangedEvent>) => {
      this.actions = e.detail.actions;
      this.statusCounts = e.detail.statusCounts;
    }) as EventListener);
    this.actionQueue.start();
  }

  private stopQueue(): void {
    if (this.actionQueue) {
      this.actionQueue.stop();
      this.actionQueue = null;
    }
  }

  private toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  private setFilter(status: ActionStatus | 'all'): void {
    this.selectedStatus = status;
  }

  private async cancelAction(actionId: string): Promise<void> {
    if (this.actionQueue) {
      await this.actionQueue.cancelAction(actionId);
    }
  }

  private clearHistory(): void {
    if (this.actionQueue) {
      this.actionQueue.clearHistory();
    }
  }

  private getFilteredActions(): ActionRequest[] {
    if (this.selectedStatus === 'all') {
      return this.actions;
    }
    return this.actions.filter(action => action.status === this.selectedStatus);
  }

  private formatTimestamp(timestamp: string): string {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);

    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }

  render() {
    const filteredActions = this.getFilteredActions();
    const hasHistory = this.statusCounts.completed > 0 || this.statusCounts.failed > 0;

    return html`
      <div class="queue-container">
        <div class="queue-header" @click="${this.toggleExpanded}">
          <div class="header-left">
            <pm-icon name="Activity" size="md"></pm-icon>
            <span class="queue-title">Action Queue</span>
            <div class="status-counts">
              ${this.statusCounts.pending > 0 ? html`
                <pm-badge variant="warning" size="sm">
                  ${this.statusCounts.pending} pending
                </pm-badge>
              ` : ''}
              ${this.statusCounts.processing > 0 ? html`
                <pm-badge variant="info" size="sm">
                  ${this.statusCounts.processing} running
                </pm-badge>
              ` : ''}
            </div>
          </div>
          <pm-icon
            name="ChevronDown"
            size="md"
            class="expand-icon ${this.isExpanded ? 'expanded' : ''}"
          ></pm-icon>
        </div>

        <div class="queue-content ${this.isExpanded ? 'expanded' : ''}">
          <div class="filter-bar">
            <button
              class="filter-button ${this.selectedStatus === 'all' ? 'active' : ''}"
              @click="${() => this.setFilter('all')}"
            >
              All (${this.actions.length})
            </button>
            <button
              class="filter-button ${this.selectedStatus === 'pending' ? 'active' : ''}"
              @click="${() => this.setFilter('pending')}"
            >
              Pending (${this.statusCounts.pending})
            </button>
            <button
              class="filter-button ${this.selectedStatus === 'processing' ? 'active' : ''}"
              @click="${() => this.setFilter('processing')}"
            >
              Running (${this.statusCounts.processing})
            </button>
            <button
              class="filter-button ${this.selectedStatus === 'completed' ? 'active' : ''}"
              @click="${() => this.setFilter('completed')}"
            >
              Completed (${this.statusCounts.completed})
            </button>
            <button
              class="filter-button ${this.selectedStatus === 'failed' ? 'active' : ''}"
              @click="${() => this.setFilter('failed')}"
            >
              Failed (${this.statusCounts.failed})
            </button>
            ${hasHistory ? html`
              <button
                class="clear-button"
                @click="${this.clearHistory}"
                title="Clear completed and failed actions"
              >
                Clear History
              </button>
            ` : ''}
          </div>

          <div class="actions-list">
            ${filteredActions.length === 0 ? html`
              <div class="empty-state">
                <pm-icon name="Inbox" size="lg"></pm-icon>
                <p>No actions ${this.selectedStatus !== 'all' ? this.selectedStatus : ''}</p>
              </div>
            ` : filteredActions.map(action => html`
              <div class="action-item">
                <div class="action-icon">
                  <pm-icon name="${getActionIcon(action.type)}" size="md"></pm-icon>
                </div>
                <div class="action-details">
                  <div class="action-name">
                    ${getActionDisplayName(action.type)}
                  </div>
                  <div class="action-meta">
                    ${this.formatTimestamp(action.timestamp)} • ${action.id}
                    ${action.result?.message ? html` • ${action.result.message}` : ''}
                  </div>
                </div>
                <pm-badge variant="${
                  action.status === 'completed' ? 'success' :
                  action.status === 'failed' ? 'danger' :
                  action.status === 'processing' ? 'info' :
                  'warning'
                }" size="sm">
                  ${action.status}
                </pm-badge>
                <div class="action-actions">
                  ${action.status === 'pending' ? html`
                    <button
                      class="action-button danger"
                      @click="${() => this.cancelAction(action.id)}"
                      title="Cancel action"
                    >
                      Cancel
                    </button>
                  ` : ''}
                </div>
              </div>
            `)}
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-action-queue': PMActionQueue;
  }
}
