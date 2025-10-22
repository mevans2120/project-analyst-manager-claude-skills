/**
 * Roadmap component
 * Displays the full product roadmap with filtering and search
 */

import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BaseComponent } from './base-component';
import type { Feature, RoadmapData } from '../types/roadmap';
import type { FilterGroup } from './pm-filter-bar';
import './pm-stat-card';
import './pm-badge';
import './pm-search-input';
import './pm-filter-bar';
import './pm-feature-card';
import './pm-loading';
import './pm-error';
import './pm-icon';

@customElement('pm-roadmap')
export class PMRoadmap extends BaseComponent {
  @state()
  private roadmapData: RoadmapData | null = null;

  @state()
  private searchQuery = '';

  @state()
  private activeFilters: Record<string, string> = {};

  private filterGroups: FilterGroup[] = [];

  static styles = [
    BaseComponent.styles,
    css`
      .roadmap {
        padding: var(--spacing-lg, 24px);
        max-width: 1400px;
        margin: 0 auto;
      }

      .roadmap-header {
        margin-bottom: var(--spacing-xl, 32px);
      }

      .roadmap-title {
        color: var(--link, #58a6ff);
        font-size: 32px;
        margin: 0 0 var(--spacing-sm, 8px) 0;
      }

      .roadmap-subtitle {
        color: var(--text-secondary, #8b949e);
        font-size: 16px;
        margin: 0 0 var(--spacing-sm, 8px) 0;
      }

      .roadmap-version {
        color: var(--text-tertiary, #6e7681);
        font-size: 12px;
        margin: 0 0 var(--spacing-lg, 24px) 0;
        font-style: italic;
      }

      .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: var(--spacing-lg, 24px);
        margin-bottom: var(--spacing-xl, 32px);
        grid-auto-rows: 1fr;
      }

      .stats-grid pm-stat-card {
        cursor: pointer;
      }

      .controls {
        display: flex;
        flex-direction: column;
        gap: var(--spacing-md, 16px);
        margin-bottom: var(--spacing-xl, 32px);
      }

      .features-container {
        display: grid;
        grid-template-columns: 1fr;
        gap: var(--spacing-lg, 24px);
        width: 100%;
      }

      .section-divider {
        grid-column: 1 / -1;
        display: flex;
        align-items: center;
        gap: var(--spacing-md, 16px);
        margin-top: var(--spacing-xl, 32px);
        margin-bottom: var(--spacing-lg, 24px);
        padding-bottom: var(--spacing-md, 16px);
        border-bottom: 2px solid var(--border-primary, #30363d);
        scroll-margin-top: var(--spacing-xl, 32px);
      }

      .section-divider:first-child {
        margin-top: 0;
      }

      .section-title {
        color: var(--text-primary, #c9d1d9);
        font-size: 24px;
        margin: 0;
        display: flex;
        align-items: center;
        gap: var(--spacing-sm, 8px);
      }

      .section-count {
        background: var(--bg-tertiary, #21262d);
        color: var(--text-secondary, #8b949e);
        font-size: 14px;
        font-weight: 600;
        padding: 4px 10px;
        border-radius: var(--radius-md, 6px);
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
        .roadmap {
          padding: var(--spacing-md, 16px);
        }

        .roadmap-title {
          font-size: 24px;
        }

        .features-container {
          max-width: 100%;
        }
      }
    `
  ];

  protected onMount(): void {
    this.loadRoadmapData();
  }

  private async loadRoadmapData(): Promise<void> {
    await this.withLoading(async () => {
      console.log('[pm-roadmap] Fetching data.js...');
      const response = await fetch('/data.js');
      const text = await response.text();
      console.log('[pm-roadmap] Fetched data.js, length:', text.length);

      // Execute the JavaScript file and extract productRoadmap
      // We need to execute the whole file including the stats calculation
      const script = document.createElement('script');
      script.textContent = text + '\nwindow.__productRoadmap = productRoadmap;';
      document.head.appendChild(script);

      const roadmapData = (window as any).__productRoadmap;
      delete (window as any).__productRoadmap;
      document.head.removeChild(script);

      console.log('[pm-roadmap] Parsed roadmap data:', roadmapData);

      if (!roadmapData || !roadmapData.features || !roadmapData.stats) {
        console.error('[pm-roadmap] Invalid roadmap data structure');
        throw new Error('Invalid roadmap data structure');
      }

      this.roadmapData = {
        project: roadmapData.project,
        features: roadmapData.features,
        stats: roadmapData.stats
      };
      console.log('[pm-roadmap] Set roadmapData, stats:', this.roadmapData.stats);

      // Build filter groups dynamically from data
      this.buildFilterGroups();
      console.log('[pm-roadmap] Built filter groups, ready to render');
    }, 'Failed to load roadmap data');
  }

  private buildFilterGroups(): void {
    if (!this.roadmapData) return;

    const allFeatures = [
      ...this.roadmapData.features.shipped,
      ...this.roadmapData.features.inProgress,
      ...this.roadmapData.features.nextUp,
      ...this.roadmapData.features.backlog
    ];

    // Get unique categories
    const categories = [...new Set(allFeatures.map(f => f.category))];

    // Get unique phases
    const phases = [...new Set(allFeatures.map(f => f.phase))];

    // Get unique priorities
    const priorities = [...new Set(
      allFeatures.map(f => f.priority).filter(Boolean)
    )] as string[];

    this.filterGroups = [
      {
        label: 'Category',
        key: 'category',
        options: categories.map(c => ({ label: c, value: c.toLowerCase() }))
      },
      {
        label: 'Phase',
        key: 'phase',
        options: phases.map(p => ({ label: p, value: p.toLowerCase() }))
      }
    ];

    if (priorities.length > 0) {
      this.filterGroups.push({
        label: 'Priority',
        key: 'priority',
        options: priorities.map(p => ({ label: p, value: p.toLowerCase() }))
      });
    }
  }

  private handleSearch(e: CustomEvent): void {
    this.searchQuery = e.detail.value.toLowerCase();
  }

  private handleFilterChange(e: CustomEvent): void {
    this.activeFilters = e.detail.filters;
  }

  private filterFeatures(features: Feature[]): Feature[] {
    return features.filter(feature => {
      // Search filter
      if (this.searchQuery) {
        const searchableText = `${feature.name} ${feature.category} ${feature.value} ${feature.id}`.toLowerCase();
        if (!searchableText.includes(this.searchQuery)) {
          return false;
        }
      }

      // Category filter
      if (this.activeFilters.category) {
        if (feature.category.toLowerCase() !== this.activeFilters.category) {
          return false;
        }
      }

      // Phase filter
      if (this.activeFilters.phase) {
        if (feature.phase.toLowerCase() !== this.activeFilters.phase) {
          return false;
        }
      }

      // Priority filter
      if (this.activeFilters.priority) {
        if (!feature.priority || feature.priority.toLowerCase() !== this.activeFilters.priority) {
          return false;
        }
      }

      return true;
    });
  }

  private scrollToSection(sectionId: string): void {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }

  private renderSectionDivider(title: string, count: number, iconName: string, sectionId: string): ReturnType<typeof html> {
    if (count === 0) {
      return html``;
    }

    return html`
      <div class="section-divider" id="${sectionId}">
        <h2 class="section-title">
          <pm-icon name="${iconName}" size="md" color="var(--link, #58a6ff)"></pm-icon>
          ${title}
        </h2>
        <span class="section-count">${count}</span>
      </div>
    `;
  }

  private renderFeatureCards(features: Feature[]): ReturnType<typeof html> {
    return features.map(feature => html`
      <pm-feature-card .feature="${feature}"></pm-feature-card>
    `);
  }

  render() {
    if (this.loadingState === 'loading') {
      return html`
        <div class="roadmap">
          <pm-loading message="Loading roadmap data..." size="lg"></pm-loading>
        </div>
      `;
    }

    if (this.error) {
      return html`
        <div class="roadmap">
          <pm-error .errorState="${this.error}" dismissible @dismiss="${() => this.error = null}"></pm-error>
        </div>
      `;
    }

    if (!this.roadmapData) {
      return html`<div class="roadmap">No data available</div>`;
    }

    const { project, features, stats } = this.roadmapData;

    // Filter features for each section
    const filteredInProgress = this.filterFeatures(features.inProgress);
    const filteredNextUp = this.filterFeatures(features.nextUp);
    const filteredBacklog = this.filterFeatures(features.backlog);
    const filteredShipped = this.filterFeatures(features.shipped);

    return html`
      <div class="roadmap">
        <div class="roadmap-header">
          <h1 class="roadmap-title">${project.name}</h1>
          <p class="roadmap-subtitle">${project.status}</p>
          <p class="roadmap-version">Single Grid Layout v2</p>
        </div>

        <div class="stats-grid">
          <pm-stat-card
            label="In Progress"
            value="${stats.inProgress}"
            status="warning"
            @click="${() => this.scrollToSection('section-in-progress')}"
          >
            <pm-icon slot="icon" name="Loader2" size="lg" color="var(--warning, #d29922)"></pm-icon>
          </pm-stat-card>

          <pm-stat-card
            label="Next Up"
            value="${stats.nextUp}"
            status="neutral"
            @click="${() => this.scrollToSection('section-next-up')}"
          >
            <pm-icon slot="icon" name="ArrowRight" size="lg" color="var(--link, #58a6ff)"></pm-icon>
          </pm-stat-card>

          <pm-stat-card
            label="Backlog"
            value="${stats.backlog}"
            status="neutral"
            @click="${() => this.scrollToSection('section-backlog')}"
          >
            <pm-icon slot="icon" name="Archive" size="lg" color="var(--text-secondary, #8b949e)"></pm-icon>
          </pm-stat-card>

          <pm-stat-card
            label="Shipped"
            value="${stats.shipped}"
            status="success"
            @click="${() => this.scrollToSection('section-shipped')}"
          >
            <pm-icon slot="icon" name="CheckCircle2" size="lg" color="var(--success, #3fb950)"></pm-icon>
          </pm-stat-card>
        </div>

        <div class="controls">
          <pm-search-input
            placeholder="Search features..."
            @search="${this.handleSearch}"
          ></pm-search-input>

          <pm-filter-bar
            .filterGroups="${this.filterGroups}"
            @filter-change="${this.handleFilterChange}"
          ></pm-filter-bar>
        </div>

        ${filteredInProgress.length === 0 && filteredNextUp.length === 0 && filteredBacklog.length === 0 && filteredShipped.length === 0 ? html`
          <div class="empty-state">
            <pm-icon name="Search" size="xl"></pm-icon>
            <p>No features match your filters</p>
          </div>
        ` : html`
          <div class="features-container">
            ${this.renderSectionDivider('In Progress', filteredInProgress.length, 'Loader2', 'section-in-progress')}
            ${this.renderFeatureCards(filteredInProgress)}

            ${this.renderSectionDivider('Next Up', filteredNextUp.length, 'ArrowRight', 'section-next-up')}
            ${this.renderFeatureCards(filteredNextUp)}

            ${this.renderSectionDivider('Backlog', filteredBacklog.length, 'Archive', 'section-backlog')}
            ${this.renderFeatureCards(filteredBacklog)}

            ${this.renderSectionDivider('Shipped', filteredShipped.length, 'CheckCircle2', 'section-shipped')}
            ${this.renderFeatureCards(filteredShipped)}
          </div>
        `}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-roadmap': PMRoadmap;
  }
}
