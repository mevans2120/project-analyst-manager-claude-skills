/**
 * Feature card component
 * Displays a feature with badges, metadata, and description
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseComponent } from './base-component';
import type { Feature } from '../types/roadmap';
import './pm-badge';
import './pm-icon';

@customElement('pm-feature-card')
export class PMFeatureCard extends BaseComponent {
  @property({ type: Object })
  feature: Feature | null = null;

  @property({ type: Boolean })
  draggable: boolean = false;

  static styles = [
    BaseComponent.styles,
    css`
      .feature-card {
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-primary, #30363d);
        border-radius: var(--radius-md, 6px);
        padding: 16px;
        padding-bottom: 20px;
        transition: all 0.2s ease;
        display: flex;
        flex-direction: column;
        gap: 12px;
        margin-bottom: 12px;
      }

      .feature-card:hover {
        border-color: var(--link, #58a6ff);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
      }

      .feature-card.draggable {
        cursor: grab;
      }

      .feature-card.draggable:active {
        cursor: grabbing;
      }

      .feature-card.dragging {
        opacity: 0.5;
        transform: scale(0.95);
      }

      .feature-header {
        display: flex;
        align-items: flex-start;
        justify-content: space-between;
        gap: var(--spacing-md, 16px);
      }

      .feature-title-section {
        flex: 1;
      }

      .feature-number {
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

      .feature-name {
        font-size: 15px;
        font-weight: 600;
        color: var(--text-primary, #c9d1d9);
        line-height: 1.3;
        margin: 0;
      }

      .feature-id {
        font-size: 10px;
        color: var(--text-tertiary, #6e7681);
        font-family: var(--font-mono, monospace);
        margin-top: 2px;
      }

      .feature-badges {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs, 4px);
        align-items: center;
      }

      .feature-value {
        color: var(--text-secondary, #8b949e);
        font-size: 13px;
        line-height: 1.5;
        flex: 1;
      }

      .feature-footer {
        display: flex;
        flex-wrap: wrap;
        gap: 12px;
        padding-top: 8px;
        border-top: 1px solid var(--border-primary, #30363d);
        font-size: 11px;
      }

      .feature-meta {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs, 4px);
        color: var(--text-tertiary, #6e7681);
      }

      .feature-meta pm-icon {
        opacity: 0.7;
      }

      .shipped-indicator {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs, 4px);
        color: var(--success, #3fb950);
        font-weight: 500;
      }

      .dependencies {
        display: flex;
        flex-wrap: wrap;
        gap: var(--spacing-xs, 4px);
        align-items: center;
      }

      .dependencies-label {
        color: var(--text-tertiary, #6e7681);
        font-size: 11px;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }

      .dependency-tag {
        background: var(--bg-tertiary, #21262d);
        color: var(--text-secondary, #8b949e);
        font-size: 11px;
        padding: 2px 6px;
        border-radius: var(--radius-sm, 4px);
        font-family: var(--font-mono, monospace);
      }
    `
  ];

  private getCategoryVariant(category: string): 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info' {
    const categoryMap: Record<string, 'primary' | 'success' | 'warning' | 'error' | 'neutral' | 'info'> = {
      'Dashboard': 'primary',
      'Planner': 'info',
      'Analyzer': 'success',
      'Manager': 'warning',
      'Shared Library': 'neutral',
      'Integration': 'error',
      'Design': 'info',
      'Planning': 'neutral'
    };
    return categoryMap[category] || 'neutral';
  }

  private getPriorityVariant(priority?: string): 'error' | 'warning' | 'neutral' {
    if (!priority) return 'neutral';
    if (priority === 'P0') return 'error';
    if (priority === 'P1') return 'warning';
    return 'neutral';
  }

  private handleDragStart(e: DragEvent): void {
    if (!this.feature) return;

    e.dataTransfer!.effectAllowed = 'move';
    e.dataTransfer!.setData('application/json', JSON.stringify(this.feature));

    // Add dragging class
    (e.currentTarget as HTMLElement).classList.add('dragging');

    // Emit drag start event
    this.emit('feature-drag-start', this.feature);
  }

  private handleDragEnd(e: DragEvent): void {
    // Remove dragging class
    (e.currentTarget as HTMLElement).classList.remove('dragging');

    // Emit drag end event
    this.emit('feature-drag-end', this.feature);
  }

  render() {
    if (!this.feature) {
      return html`<div class="feature-card">No feature data</div>`;
    }

    const { id, number, name, category, phase, priority, dependencies, value, shippedDate } = this.feature;
    const isShipped = !!shippedDate;

    return html`
      <div
        class="feature-card ${this.draggable ? 'draggable' : ''}"
        ?draggable="${this.draggable}"
        @dragstart="${this.draggable ? this.handleDragStart : null}"
        @dragend="${this.draggable ? this.handleDragEnd : null}"
      >
        <div class="feature-header">
          <div class="feature-title-section">
            ${number ? html`<div class="feature-number">PM-${number}</div>` : ''}
            <h3 class="feature-name">${name}</h3>
            <div class="feature-id">${id}</div>
          </div>
        </div>

        <div class="feature-badges">
          <pm-badge
            label="${category}"
            variant="${this.getCategoryVariant(category)}"
            size="sm"
          ></pm-badge>
          <pm-badge
            label="${phase}"
            variant="neutral"
            size="sm"
            outlined
          ></pm-badge>
          ${priority ? html`
            <pm-badge
              label="${priority}"
              variant="${this.getPriorityVariant(priority)}"
              size="sm"
            ></pm-badge>
          ` : ''}
          ${isShipped ? html`
            <pm-badge
              label="Shipped"
              variant="success"
              size="sm"
            ></pm-badge>
          ` : ''}
        </div>

        <div class="feature-value">${value}</div>

        ${dependencies && dependencies.length > 0 ? html`
          <div class="dependencies">
            <span class="dependencies-label">Depends on:</span>
            ${dependencies.map(dep => html`
              <span class="dependency-tag">${dep}</span>
            `)}
          </div>
        ` : ''}

        <div class="feature-footer">
          ${isShipped ? html`
            <div class="shipped-indicator">
              <pm-icon name="CheckCircle2" size="sm"></pm-icon>
              <span>Shipped ${shippedDate}</span>
            </div>
          ` : ''}
          <div class="feature-meta">
            <pm-icon name="Layers" size="sm"></pm-icon>
            <span>${phase}</span>
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-feature-card': PMFeatureCard;
  }
}
