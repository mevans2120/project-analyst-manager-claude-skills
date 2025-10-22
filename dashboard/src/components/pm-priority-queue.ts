/**
 * Priority Queue component
 * Displays features in priority order with dependency information
 */

import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BaseComponent } from './base-component';
import type { Feature, RoadmapData } from '../types/roadmap';
import './pm-badge';
import './pm-icon';
import './pm-loading';
import './pm-error';

interface PriorityQueueItem {
  feature: string;
  reason: string;
  blockedBy: string[];
  blocking: string[];
}

interface EnrichedQueueItem extends PriorityQueueItem {
  featureData?: Feature;
  isReady: boolean;
  unmetDependencies: string[];
}

@customElement('pm-priority-queue')
export class PMPriorityQueue extends BaseComponent {
  @state()
  private roadmapData: RoadmapData | null = null;

  @state()
  private queueItems: EnrichedQueueItem[] = [];

  static styles = [
    BaseComponent.styles,
    css`
      .queue {
        padding: var(--spacing-lg, 24px);
        max-width: 1400px;
        margin: 0 auto;
      }

      .queue-header {
        margin-bottom: var(--spacing-xl, 32px);
      }

      .queue-title {
        color: var(--link, #58a6ff);
        font-size: 32px;
        margin: 0 0 var(--spacing-sm, 8px) 0;
      }

      .queue-subtitle {
        color: var(--text-secondary, #8b949e);
        font-size: 16px;
        margin: 0;
      }

      .queue-items {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-lg, 24px);
      }

      .queue-item {
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-primary, #30363d);
        border-radius: var(--radius-md, 6px);
        padding: var(--spacing-lg, 24px);
        transition: all 0.2s ease;
      }

      .queue-item.ready {
        border-color: var(--success, #3fb950);
        background: rgba(63, 185, 80, 0.05);
      }

      .queue-item.blocked {
        border-color: var(--error, #f85149);
        background: rgba(248, 81, 73, 0.05);
      }

      .queue-item:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .item-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--spacing-md, 16px);
        margin-bottom: var(--spacing-md, 16px);
      }

      .item-title {
        flex: 1;
      }

      .item-number {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        background: var(--bg-tertiary, #21262d);
        color: var(--text-secondary, #8b949e);
        font-size: 11px;
        font-weight: 600;
        padding: 4px 8px;
        border-radius: var(--radius-sm, 4px);
        margin-bottom: var(--spacing-xs, 4px);
      }

      .item-name {
        font-size: 18px;
        font-weight: 600;
        color: var(--text-primary, #c9d1d9);
        line-height: 1.3;
        margin: 0;
      }

      .status-badge {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs, 4px);
        padding: 6px 12px;
        border-radius: var(--radius-md, 6px);
        font-size: 12px;
        font-weight: 600;
        white-space: nowrap;
      }

      .status-badge.ready {
        background: var(--success, #3fb950);
        color: #0d1117;
      }

      .status-badge.blocked {
        background: var(--error, #f85149);
        color: #ffffff;
      }

      .item-reason {
        color: var(--text-secondary, #8b949e);
        font-size: 14px;
        line-height: 1.6;
        margin-bottom: var(--spacing-md, 16px);
        padding: var(--spacing-md, 16px);
        background: var(--bg-tertiary, #21262d);
        border-radius: var(--radius-sm, 4px);
        border-left: 3px solid var(--link, #58a6ff);
      }

      .dependencies-section {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md, 16px);
        padding-top: var(--spacing-md, 16px);
        border-top: 1px solid var(--border-primary, #30363d);
      }

      .dependency-group {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-sm, 8px);
      }

      .dependency-label {
        color: var(--text-tertiary, #6e7681);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        display: flex;
        align-items: center;
        gap: var(--spacing-xs, 4px);
      }

      .dependency-list {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs, 4px);
      }

      .dependency-tag {
        background: var(--bg-tertiary, #21262d);
        color: var(--text-secondary, #8b949e);
        font-size: 11px;
        padding: 4px 8px;
        border-radius: var(--radius-sm, 4px);
        font-family: var(--font-mono, monospace);
        border: 1px solid var(--border-primary, #30363d);
      }

      .dependency-tag.met {
        border-color: var(--success, #3fb950);
        color: var(--success, #3fb950);
      }

      .dependency-tag.unmet {
        border-color: var(--error, #f85149);
        color: var(--error, #f85149);
      }

      .empty-state {
        text-align: center;
        padding: var(--spacing-xl, 32px);
        color: var(--text-tertiary, #6e7681);
      }

      .empty-state pm-icon {
        margin-bottom: var(--spacing-md, 16px);
        opacity: 0.5;
      }

      @media (max-width: 768px) {
        .queue {
          padding: var(--spacing-md, 16px);
        }

        .queue-title {
          font-size: 24px;
        }

        .item-header {
          flex-direction: column;
        }
      }
    `
  ];

  connectedCallback(): void {
    super.connectedCallback();
    this.loadPriorityQueue();
  }

  private async loadPriorityQueue(): Promise<void> {
    await this.withLoading(async () => {
      const response = await fetch('/data.js');

      if (!response.ok) {
        throw new Error(`Failed to fetch data.js: ${response.status}`);
      }

      const text = await response.text();

      // Execute the JavaScript file and extract productRoadmap
      const uniqueVar = `__productRoadmap_${Date.now()}`;
      const script = document.createElement('script');
      script.textContent = `(function() { ${text}; window.${uniqueVar} = productRoadmap; })();`;
      document.head.appendChild(script);

      const roadmapData = (window as any)[uniqueVar];
      delete (window as any)[uniqueVar];
      document.head.removeChild(script);

      if (!roadmapData || !roadmapData.features || !roadmapData.priorityQueue) {
        throw new Error('Invalid roadmap data structure');
      }

      this.roadmapData = {
        project: roadmapData.project,
        features: roadmapData.features,
        stats: roadmapData.stats
      };

      // Enrich priority queue items with feature data
      this.queueItems = this.enrichQueueItems(roadmapData.priorityQueue);
    }, 'Failed to load priority queue');
  }

  private enrichQueueItems(queueItems: PriorityQueueItem[]): EnrichedQueueItem[] {
    if (!this.roadmapData) return [];

    const allFeatures = [
      ...this.roadmapData.features.shipped,
      ...this.roadmapData.features.inProgress,
      ...this.roadmapData.features.nextUp,
      ...this.roadmapData.features.backlog
    ];

    return queueItems.map(item => {
      const featureData = allFeatures.find(f => f.id === item.feature);

      // Check if dependencies are met
      const unmetDependencies = item.blockedBy.filter(depId =>
        !this.roadmapData!.features.shipped.some(f => f.id === depId)
      );

      return {
        ...item,
        featureData,
        isReady: unmetDependencies.length === 0,
        unmetDependencies
      };
    });
  }

  private renderQueueItem(item: EnrichedQueueItem): ReturnType<typeof html> {
    const { featureData, isReady, unmetDependencies, reason, blocking } = item;

    if (!featureData) {
      return html``;
    }

    return html`
      <div class="queue-item ${isReady ? 'ready' : 'blocked'}">
        <div class="item-header">
          <div class="item-title">
            ${featureData.number ? html`<div class="item-number">PM-${featureData.number}</div>` : ''}
            <h3 class="item-name">${featureData.name}</h3>
          </div>
          <div class="status-badge ${isReady ? 'ready' : 'blocked'}">
            <pm-icon name="${isReady ? 'CheckCircle2' : 'AlertCircle'}" size="sm"></pm-icon>
            ${isReady ? 'Ready to Start' : 'Blocked'}
          </div>
        </div>

        <div class="item-reason">${reason}</div>

        ${unmetDependencies.length > 0 || blocking.length > 0 ? html`
          <div class="dependencies-section">
            ${unmetDependencies.length > 0 ? html`
              <div class="dependency-group">
                <div class="dependency-label">
                  <pm-icon name="Lock" size="sm"></pm-icon>
                  Blocked by (${unmetDependencies.length})
                </div>
                <div class="dependency-list">
                  ${unmetDependencies.map(depId => {
                    const dep = this.findFeature(depId);
                    const displayText = dep && dep.number ? `PM-${dep.number}` : depId;
                    return html`<span class="dependency-tag unmet">${displayText}</span>`;
                  })}
                </div>
              </div>
            ` : ''}

            ${blocking.length > 0 ? html`
              <div class="dependency-group">
                <div class="dependency-label">
                  <pm-icon name="Zap" size="sm"></pm-icon>
                  Blocking (${blocking.length})
                </div>
                <div class="dependency-list">
                  ${blocking.map(blockId => {
                    const block = this.findFeature(blockId);
                    const displayText = block && block.number ? `PM-${block.number}` : blockId;
                    return html`<span class="dependency-tag">${displayText}</span>`;
                  })}
                </div>
              </div>
            ` : ''}
          </div>
        ` : ''}
      </div>
    `;
  }

  private findFeature(id: string): Feature | undefined {
    if (!this.roadmapData) return undefined;

    const allFeatures = [
      ...this.roadmapData.features.shipped,
      ...this.roadmapData.features.inProgress,
      ...this.roadmapData.features.nextUp,
      ...this.roadmapData.features.backlog
    ];

    return allFeatures.find(f => f.id === id);
  }

  render() {
    if (this.loadingState === 'loading') {
      return html`
        <div class="queue">
          <pm-loading message="Loading priority queue..." size="lg"></pm-loading>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="queue">
          <pm-error .errorState="${this.error}" dismissible @dismiss="${() => this.error = null}"></pm-error>
        </div>
      `;
    }

    if (!this.roadmapData || this.queueItems.length === 0) {
      return html`
        <div class="queue">
          <div class="empty-state">
            <pm-icon name="Inbox" size="xl"></pm-icon>
            <p>No priority queue items found</p>
          </div>
        </div>
      `;
    }

    const readyCount = this.queueItems.filter(item => item.isReady).length;
    const blockedCount = this.queueItems.filter(item => !item.isReady).length;

    return html`
      <div class="queue">
        <div class="queue-header">
          <h1 class="queue-title">Priority Queue</h1>
          <p class="queue-subtitle">
            ${readyCount} ready to start • ${blockedCount} blocked by dependencies
          </p>
        </div>

        <div class="queue-items">
          ${this.queueItems.map(item => this.renderQueueItem(item))}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-priority-queue': PMPriorityQueue;
  }
}
