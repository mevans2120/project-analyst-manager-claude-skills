/**
 * Roadmap component
 * Displays the full product roadmap with filtering and search
 */

import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BaseComponent } from './base-component';
import type { Feature, RoadmapData } from '../types/roadmap';
import type { FilterGroup } from './pm-filter-bar';
import { RoadmapPersistence } from '../services/roadmap-persistence';
import { RoadmapExport, type ExportFormat } from '../services/roadmap-export';
import { FileWatcher } from '../services/file-watcher';
import './pm-stat-card';
import './pm-badge';
import './pm-search-input';
import './pm-filter-bar';
import './pm-feature-card';
import './pm-loading';
import './pm-error';
import './pm-icon';
import './pm-action-button';
import './pm-action-queue';
import './pm-skill-output';

@customElement('pm-roadmap')
export class PMRoadmap extends BaseComponent {
  @state()
  private roadmapData: RoadmapData | null = null;

  @state()
  private searchQuery = '';

  @state()
  private activeFilters: Record<string, string> = {};

  @state()
  private isDragging: boolean = false;

  @state()
  private isDropZoneActive: boolean = false;

  @state()
  private hasSavedChanges: boolean = false;

  @state()
  private originalData: RoadmapData | null = null;

  @state()
  private exportFormat: ExportFormat = 'json';

  @state()
  private currentActionId: string | null = null;

  private filterGroups: FilterGroup[] = [];
  private fileWatcher: FileWatcher | null = null;

  static styles = [
    BaseComponent.styles,
    css`
      .skip-link {
        position: absolute;
        top: -40px;
        left: 0;
        background: var(--link, #58a6ff);
        color: #0d1117;
        padding: 8px 16px;
        text-decoration: none;
        border-radius: var(--radius-md, 6px);
        font-weight: 600;
        z-index: 100;
        transition: top 0.2s;
      }

      .skip-link:focus {
        top: var(--spacing-md, 16px);
        left: var(--spacing-md, 16px);
        outline: 2px solid #0d1117;
        outline-offset: 2px;
      }

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
        gap: var(--spacing-xl, 32px);
        margin-bottom: 48px;
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
        gap: 16px;
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

      .drop-zone {
        position: relative;
        transition: all 0.3s ease;
      }

      .drop-zone.active {
        background: rgba(88, 166, 255, 0.05);
        border: 2px dashed var(--link, #58a6ff);
        border-radius: var(--radius-md, 6px);
        padding: var(--spacing-md, 16px);
      }

      .drop-zone.active .empty-state {
        border: 2px dashed var(--link, #58a6ff);
        border-radius: var(--radius-md, 6px);
        background: rgba(88, 166, 255, 0.1);
      }

      .drop-hint {
        display: none;
        text-align: center;
        padding: var(--spacing-lg, 24px);
        color: var(--link, #58a6ff);
        font-weight: 500;
      }

      .drop-zone.active .drop-hint {
        display: block;
      }

      .action-buttons {
        display: flex;
        gap: var(--spacing-sm, 8px);
        align-items: center;
      }

      .btn {
        display: inline-flex;
        align-items: center;
        gap: var(--spacing-xs, 4px);
        padding: 8px 16px;
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-primary, #30363d);
        border-radius: var(--radius-md, 6px);
        color: var(--text-primary, #c9d1d9);
        font-size: 14px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s ease;
      }

      .btn:hover {
        background: var(--bg-tertiary, #21262d);
        border-color: var(--link, #58a6ff);
      }

      .btn:active {
        transform: scale(0.98);
      }

      .btn-primary {
        background: var(--link, #58a6ff);
        color: #0d1117;
        border-color: var(--link, #58a6ff);
      }

      .btn-primary:hover {
        background: #1f6feb;
        border-color: #1f6feb;
      }

      .btn-danger {
        border-color: var(--error, #f85149);
        color: var(--error, #f85149);
      }

      .btn-danger:hover {
        background: rgba(248, 81, 73, 0.1);
        border-color: var(--error, #f85149);
      }

      .saved-indicator {
        display: flex;
        align-items: center;
        gap: var(--spacing-xs, 4px);
        color: var(--success, #3fb950);
        font-size: 12px;
        font-weight: 500;
      }

      .export-group {
        display: flex;
        gap: var(--spacing-xs, 4px);
        align-items: stretch;
      }

      .export-select {
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-primary, #30363d);
        border-right: none;
        border-radius: var(--radius-md, 6px) 0 0 var(--radius-md, 6px);
        color: var(--text-primary, #c9d1d9);
        font-size: 14px;
        padding: 8px 12px;
        cursor: pointer;
        outline: none;
        transition: all 0.2s ease;
      }

      .export-select:hover {
        background: var(--bg-tertiary, #21262d);
        border-color: var(--link, #58a6ff);
      }

      .export-select:focus {
        border-color: var(--link, #58a6ff);
        box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
      }

      .export-select option {
        background: var(--bg-secondary, #161b22);
        color: var(--text-primary, #c9d1d9);
      }

      .btn-export {
        border-radius: 0 var(--radius-md, 6px) var(--radius-md, 6px) 0;
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

  connectedCallback(): void {
    super.connectedCallback();
    console.log('[pm-roadmap] Component connected to DOM');
    // Always load data when component connects to DOM
    this.loadRoadmapData();

    // PM-25: Start watching data.js for changes
    this.startFileWatcher();
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    console.log('[pm-roadmap] Component disconnected from DOM');

    // PM-25: Stop watching files
    this.stopFileWatcher();
  }

  private async loadRoadmapData(): Promise<void> {
    await this.withLoading(async () => {
      // First, try to load from localStorage
      const savedState = RoadmapPersistence.load();

      if (savedState) {
        console.log('[pm-roadmap] Loading from saved state');
        this.roadmapData = savedState;
        this.hasSavedChanges = true;
      }

      // Always load original data from data.js (for reset functionality)
      console.log('[pm-roadmap] Fetching original data.js...');

      const response = await fetch('/data.js');

      if (!response.ok) {
        throw new Error(`Failed to fetch data.js: ${response.status} ${response.statusText}`);
      }

      const text = await response.text();
      console.log('[pm-roadmap] Fetched data.js, length:', text.length);

      // Execute the JavaScript file and extract productRoadmap
      // Wrap in IIFE to avoid const redeclaration errors
      const uniqueVar = `__productRoadmap_${Date.now()}`;
      const script = document.createElement('script');
      script.textContent = `(function() { ${text}; window.${uniqueVar} = productRoadmap; })();`;
      document.head.appendChild(script);

      const roadmapData = (window as any)[uniqueVar];
      delete (window as any)[uniqueVar];
      document.head.removeChild(script);

      console.log('[pm-roadmap] Parsed roadmap data:', roadmapData);

      if (!roadmapData || !roadmapData.features || !roadmapData.stats) {
        console.error('[pm-roadmap] Invalid roadmap data structure:', roadmapData);
        throw new Error('Invalid roadmap data structure');
      }

      // Store original data for reset
      this.originalData = {
        project: roadmapData.project,
        features: roadmapData.features,
        stats: roadmapData.stats
      };

      // If no saved state, use original data
      if (!savedState) {
        this.roadmapData = this.originalData;
      }

      console.log('[pm-roadmap] Set roadmapData, stats:', this.roadmapData.stats);

      // Build filter groups dynamically from data
      this.buildFilterGroups();
      console.log('[pm-roadmap] Built filter groups, ready to render');
    }, 'Failed to load roadmap data');
  }

  /**
   * PM-25: Start watching data.js for changes
   */
  private startFileWatcher(): void {
    if (this.fileWatcher) return; // Already watching

    this.fileWatcher = new FileWatcher();
    this.fileWatcher.watch(['/data.js']);

    this.fileWatcher.addEventListener('file-changed', ((e: CustomEvent) => {
      console.log('[pm-roadmap] File changed:', e.detail.file);
      console.log('[pm-roadmap] Auto-reloading roadmap data...');
      this.loadRoadmapData();
    }) as EventListener);

    console.log('[pm-roadmap] File watcher started for /data.js');
  }

  /**
   * PM-25: Stop watching files
   */
  private stopFileWatcher(): void {
    if (this.fileWatcher) {
      this.fileWatcher.stop();
      this.fileWatcher = null;
      console.log('[pm-roadmap] File watcher stopped');
    }
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

  private handleDragOver(e: DragEvent): void {
    e.preventDefault();
    e.dataTransfer!.dropEffect = 'move';
    this.isDropZoneActive = true;
  }

  private handleDragLeave(e: DragEvent): void {
    // Only deactivate if leaving the drop zone itself
    const relatedTarget = e.relatedTarget as HTMLElement;
    if (!relatedTarget || !(e.currentTarget as HTMLElement).contains(relatedTarget)) {
      this.isDropZoneActive = false;
    }
  }

  private handleDrop(e: DragEvent): void {
    e.preventDefault();
    this.isDropZoneActive = false;

    try {
      const featureData = e.dataTransfer!.getData('application/json');
      if (!featureData) return;

      const feature: Feature = JSON.parse(featureData);

      // Check if dependencies are met
      if (feature.dependencies && feature.dependencies.length > 0) {
        const shipped = this.roadmapData?.features.shipped || [];
        const unmetDeps = feature.dependencies.filter(depId =>
          !shipped.some(f => f.id === depId)
        );

        if (unmetDeps.length > 0) {
          alert(`Cannot move to Next Up. Dependencies not met: ${unmetDeps.join(', ')}`);
          return;
        }
      }

      // Move feature from backlog to nextUp
      if (this.roadmapData) {
        this.roadmapData.features.backlog = this.roadmapData.features.backlog.filter(f => f.id !== feature.id);
        this.roadmapData.features.nextUp.push(feature);

        // Save state and trigger re-render
        this.saveState();
        this.requestUpdate();

        console.log(`Moved feature ${feature.id} to Next Up`);
      }
    } catch (error) {
      console.error('Error handling drop:', error);
    }
  }

  private handleFeatureDrop(e: CustomEvent): void {
    if (!this.roadmapData) return;

    const { droppedFeature, targetFeature, position, section } = e.detail;

    // Validate dependencies if moving to Next Up
    if (section === 'nextUp' && droppedFeature.dependencies && droppedFeature.dependencies.length > 0) {
      const shipped = this.roadmapData.features.shipped || [];
      const unmetDeps = droppedFeature.dependencies.filter((depId: string) =>
        !shipped.some(f => f.id === depId)
      );

      if (unmetDeps.length > 0) {
        alert(`Cannot move to Next Up. Dependencies not met: ${unmetDeps.join(', ')}`);
        return;
      }
    }

    // Remove from all sections
    this.roadmapData.features.inProgress = this.roadmapData.features.inProgress.filter(f => f.id !== droppedFeature.id);
    this.roadmapData.features.nextUp = this.roadmapData.features.nextUp.filter(f => f.id !== droppedFeature.id);
    this.roadmapData.features.backlog = this.roadmapData.features.backlog.filter(f => f.id !== droppedFeature.id);
    this.roadmapData.features.shipped = this.roadmapData.features.shipped.filter(f => f.id !== droppedFeature.id);

    // Get target array
    let targetArray: Feature[];
    switch (section) {
      case 'inProgress':
        targetArray = this.roadmapData.features.inProgress;
        break;
      case 'nextUp':
        targetArray = this.roadmapData.features.nextUp;
        break;
      case 'backlog':
        targetArray = this.roadmapData.features.backlog;
        break;
      case 'shipped':
        targetArray = this.roadmapData.features.shipped;
        break;
      default:
        console.error('Unknown section:', section);
        return;
    }

    // Find target index
    const targetIndex = targetArray.findIndex(f => f.id === targetFeature.id);

    if (targetIndex === -1) {
      // Target not found, append to end
      targetArray.push(droppedFeature);
    } else {
      // Insert at the correct position
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
      targetArray.splice(insertIndex, 0, droppedFeature);
    }

    // Save state and trigger re-render
    this.saveState();
    this.requestUpdate();

    console.log(`Moved ${droppedFeature.id} ${position} ${targetFeature.id} in ${section}`);
  }

  private saveState(): void {
    if (!this.roadmapData) return;

    RoadmapPersistence.save(this.roadmapData);
    this.hasSavedChanges = true;
  }

  private handleExport(): void {
    if (!this.roadmapData) return;

    RoadmapExport.exportAsFile(this.roadmapData, this.exportFormat);
  }

  private handleExportFormatChange(e: Event): void {
    const select = e.target as HTMLSelectElement;
    this.exportFormat = select.value as ExportFormat;
  }

  private handleReset(): void {
    if (!confirm('Are you sure you want to reset to the original roadmap? All changes will be lost.')) {
      return;
    }

    RoadmapPersistence.clear();
    this.roadmapData = this.originalData;
    this.hasSavedChanges = false;
    this.requestUpdate();

    console.log('[pm-roadmap] Reset to original data');
  }

  private handleActionCreated(e: CustomEvent): void {
    const actionRequest = e.detail.actionRequest;
    this.currentActionId = actionRequest.id;
    console.log('[pm-roadmap] Action created:', actionRequest.id);
  }

  private renderSectionDivider(title: string, count: number, iconName: string, sectionId: string, alwaysShow: boolean = false): ReturnType<typeof html> {
    if (count === 0 && !alwaysShow) {
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

  private renderEmptySection(message: string): ReturnType<typeof html> {
    return html`
      <div class="empty-state" style="padding: var(--spacing-lg, 24px); text-align: center;">
        <pm-icon name="Inbox" size="md" style="opacity: 0.5;"></pm-icon>
        <p style="color: var(--text-tertiary, #7d8590); font-size: 14px; margin: var(--spacing-sm, 8px) 0 0 0;">${message}</p>
      </div>
    `;
  }

  private renderFeatureCards(features: Feature[], draggable: boolean = false, section: string = ''): ReturnType<typeof html> {
    if (!this.roadmapData) return html``;

    // Collect all features for dependency lookup
    const allFeatures = [
      ...this.roadmapData.features.shipped,
      ...this.roadmapData.features.inProgress,
      ...this.roadmapData.features.nextUp,
      ...this.roadmapData.features.backlog
    ];

    return features.map(feature => html`
      <pm-feature-card
        .feature="${feature}"
        ?draggable="${draggable}"
        .allFeatures="${allFeatures}"
        .section="${section}"
        @feature-drop="${this.handleFeatureDrop}"
      ></pm-feature-card>
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
      <a href="#main-content" class="skip-link">Skip to main content</a>
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

          <div class="action-buttons">
            <pm-action-button
              action="analyze"
              .payload=${{ repoPath: '.', options: { includeCompleted: false } }}
              @action-created="${this.handleActionCreated}"
            ></pm-action-button>
            ${this.hasSavedChanges ? html`
              <span class="saved-indicator">
                <pm-icon name="CheckCircle2" size="sm"></pm-icon>
                Changes saved
              </span>
            ` : ''}
            <div class="export-group">
              <select
                class="export-select"
                .value="${this.exportFormat}"
                @change="${this.handleExportFormatChange}"
                aria-label="Export format"
              >
                <option value="json">JSON</option>
                <option value="markdown">Markdown</option>
                <option value="html">HTML</option>
              </select>
              <button class="btn btn-primary btn-export" @click="${this.handleExport}">
                <pm-icon name="Download" size="sm"></pm-icon>
                Export
              </button>
            </div>
            <button class="btn btn-danger" @click="${this.handleReset}" ?disabled="${!this.hasSavedChanges}">
              <pm-icon name="RotateCcw" size="sm"></pm-icon>
              Reset
            </button>
          </div>
        </div>

        <!-- PM-27: Action Queue System -->
        <div style="margin-bottom: var(--spacing-xl, 32px);">
          <pm-action-queue></pm-action-queue>
        </div>

        <!-- PM-28: Real-Time Skill Output Display -->
        ${this.currentActionId ? html`
          <div style="margin-bottom: var(--spacing-xl, 32px);">
            <pm-skill-output .actionId="${this.currentActionId}"></pm-skill-output>
          </div>
        ` : ''}

        ${filteredInProgress.length === 0 && filteredNextUp.length === 0 && filteredBacklog.length === 0 && filteredShipped.length === 0 ? html`
          <div class="empty-state" id="main-content">
            <pm-icon name="Search" size="xl"></pm-icon>
            <p>No features match your filters</p>
          </div>
        ` : html`
          <div class="features-container" id="main-content">
            ${this.renderSectionDivider('In Progress', filteredInProgress.length, 'Loader2', 'section-in-progress')}
            ${this.renderFeatureCards(filteredInProgress, true, 'inProgress')}

            ${this.renderSectionDivider('Next Up', filteredNextUp.length, 'ArrowRight', 'section-next-up', true)}
            <div
              class="drop-zone ${this.isDropZoneActive ? 'active' : ''}"
              @dragover="${this.handleDragOver}"
              @dragleave="${this.handleDragLeave}"
              @drop="${this.handleDrop}"
            >
              ${filteredNextUp.length === 0 ? html`
                ${this.renderEmptySection('No features queued. Drag items from backlog to queue them!')}
                <div class="drop-hint">
                  <pm-icon name="ArrowDown" size="md"></pm-icon>
                  <p>Drop backlog items here to add to Next Up</p>
                </div>
              ` : this.renderFeatureCards(filteredNextUp, true, 'nextUp')}
            </div>

            ${this.renderSectionDivider('Backlog', filteredBacklog.length, 'Archive', 'section-backlog')}
            ${this.renderFeatureCards(filteredBacklog, true, 'backlog')}

            ${this.renderSectionDivider('Shipped', filteredShipped.length, 'CheckCircle2', 'section-shipped')}
            ${this.renderFeatureCards(filteredShipped, false, 'shipped')}
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
