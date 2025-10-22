/**
 * Skill Output Display - Stream skill execution output in real-time
 * PM-28: Real-Time Skill Output Display
 */

import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseComponent } from './base-component';
import { SkillOutputMonitor, type SkillOutputUpdate } from '../services/skill-output-monitor';
import './pm-icon';

@customElement('pm-skill-output')
export class PMSkillOutput extends BaseComponent {
  @property({ type: String })
  actionId: string = '';

  @property({ type: Boolean })
  autoScroll = true;

  @state()
  private outputLines: string[] = [];

  @state()
  private progress: {
    current: number;
    total: number;
    message: string;
    percentage?: number;
  } | null = null;

  @state()
  private isComplete = false;

  @state()
  private isExpanded = true;

  private outputMonitor: SkillOutputMonitor | null = null;
  private outputContainerRef: HTMLElement | null = null;

  static styles = [
    BaseComponent.styles,
    css`
      :host {
        display: block;
      }

      .output-container {
        background: var(--bg-secondary, #161b22);
        border: 1px solid var(--border-primary, #30363d);
        border-radius: var(--radius-md, 6px);
      }

      .output-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: var(--spacing-md, 16px);
        border-bottom: 1px solid var(--border-primary, #30363d);
        cursor: pointer;
        user-select: none;
      }

      .output-header:hover {
        background: var(--bg-tertiary, #21262d);
      }

      .header-left {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm, 8px);
      }

      .output-title {
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary, #c9d1d9);
      }

      .status-indicator {
        display: inline-flex;
        align-items: center;
        gap: 4px;
        padding: 4px 8px;
        background: var(--bg-tertiary, #21262d);
        border-radius: var(--radius-sm, 4px);
        font-size: 12px;
        color: var(--text-secondary, #8b949e);
      }

      .status-indicator.running {
        color: var(--info, #58a6ff);
      }

      .status-indicator.complete {
        color: var(--success, #3fb950);
      }

      .expand-icon {
        transition: transform 0.2s ease;
      }

      .expand-icon.expanded {
        transform: rotate(180deg);
      }

      .progress-bar-container {
        padding: var(--spacing-md, 16px);
        border-bottom: 1px solid var(--border-primary, #30363d);
      }

      .progress-message {
        font-size: 13px;
        color: var(--text-secondary, #8b949e);
        margin-bottom: var(--spacing-sm, 8px);
      }

      .progress-bar {
        width: 100%;
        height: 8px;
        background: var(--bg-tertiary, #21262d);
        border-radius: var(--radius-sm, 4px);
        overflow: hidden;
      }

      .progress-fill {
        height: 100%;
        background: linear-gradient(90deg, var(--info, #58a6ff), var(--success, #3fb950));
        transition: width 0.3s ease;
        border-radius: var(--radius-sm, 4px);
      }

      .progress-text {
        display: flex;
        justify-content: space-between;
        margin-top: 4px;
        font-size: 11px;
        color: var(--text-tertiary, #7d8590);
      }

      .output-content {
        max-height: 0;
        overflow: hidden;
        transition: max-height 0.3s ease;
      }

      .output-content.expanded {
        max-height: 500px;
        overflow-y: auto;
      }

      .terminal {
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 13px;
        line-height: 1.5;
        padding: var(--spacing-md, 16px);
        background: #0d1117;
        color: #c9d1d9;
      }

      .log-line {
        margin: 0;
        padding: 2px 0;
        word-wrap: break-word;
      }

      .log-line.error {
        color: var(--danger, #f85149);
      }

      .log-line.warning {
        color: var(--warning, #d29922);
      }

      .log-line.success {
        color: var(--success, #3fb950);
      }

      .log-line.info {
        color: var(--info, #58a6ff);
      }

      .empty-state {
        text-align: center;
        padding: var(--spacing-xl, 32px);
        color: var(--text-secondary, #8b949e);
      }

      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }

      .pulse {
        animation: pulse 2s ease-in-out infinite;
      }
    `
  ];

  connectedCallback(): void {
    super.connectedCallback();
    if (this.actionId) {
      this.startMonitoring();
    }
  }

  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.stopMonitoring();
  }

  updated(changedProperties: Map<string, unknown>): void {
    super.updated(changedProperties);

    if (changedProperties.has('actionId')) {
      this.stopMonitoring();
      if (this.actionId) {
        this.startMonitoring();
      }
    }

    // Auto-scroll to bottom
    if (this.autoScroll && this.outputContainerRef) {
      this.outputContainerRef.scrollTop = this.outputContainerRef.scrollHeight;
    }
  }

  private startMonitoring(): void {
    this.outputMonitor = new SkillOutputMonitor();
    this.outputMonitor.addEventListener('output-update', ((e: CustomEvent<SkillOutputUpdate>) => {
      if (e.detail.actionId === this.actionId) {
        // Append new lines
        if (e.detail.lines.length > 0) {
          this.outputLines = [...this.outputLines, ...e.detail.lines];
        }

        // Update progress
        if (e.detail.progress) {
          this.progress = e.detail.progress;
        }

        // Update completion status
        this.isComplete = e.detail.isComplete;

        // Stop monitoring if complete
        if (this.isComplete && this.outputMonitor) {
          this.outputMonitor.unwatchAction(this.actionId);
        }
      }
    }) as EventListener);

    this.outputMonitor.watchAction(this.actionId);
  }

  private stopMonitoring(): void {
    if (this.outputMonitor) {
      this.outputMonitor.stop();
      this.outputMonitor = null;
    }
  }

  private toggleExpanded(): void {
    this.isExpanded = !this.isExpanded;
  }

  private getLogLineClass(line: string): string {
    const lowerLine = line.toLowerCase();

    if (lowerLine.includes('error') || lowerLine.includes('fail')) {
      return 'error';
    }
    if (lowerLine.includes('warn')) {
      return 'warning';
    }
    if (lowerLine.includes('success') || lowerLine.includes('complete')) {
      return 'success';
    }
    if (lowerLine.includes('info') || lowerLine.includes('start')) {
      return 'info';
    }

    return '';
  }

  render() {
    const hasOutput = this.outputLines.length > 0;

    return html`
      <div class="output-container">
        <div class="output-header" @click="${this.toggleExpanded}">
          <div class="header-left">
            <pm-icon name="Terminal" size="md"></pm-icon>
            <span class="output-title">Skill Output</span>
            <div class="status-indicator ${this.isComplete ? 'complete' : 'running'}">
              <pm-icon
                name="${this.isComplete ? 'CheckCircle2' : 'Activity'}"
                size="sm"
                class="${this.isComplete ? '' : 'pulse'}"
              ></pm-icon>
              ${this.isComplete ? 'Complete' : 'Running'}
            </div>
          </div>
          <pm-icon
            name="ChevronDown"
            size="md"
            class="expand-icon ${this.isExpanded ? 'expanded' : ''}"
          ></pm-icon>
        </div>

        ${this.progress ? html`
          <div class="progress-bar-container">
            <div class="progress-message">${this.progress.message}</div>
            <div class="progress-bar">
              <div
                class="progress-fill"
                style="width: ${this.progress.percentage || 0}%"
              ></div>
            </div>
            <div class="progress-text">
              <span>${this.progress.current} / ${this.progress.total}</span>
              <span>${this.progress.percentage || 0}%</span>
            </div>
          </div>
        ` : ''}

        <div class="output-content ${this.isExpanded ? 'expanded' : ''}">
          ${hasOutput ? html`
            <div
              class="terminal"
              ${(el: Element) => { this.outputContainerRef = el as HTMLElement; }}
            >
              ${this.outputLines.map(line => html`
                <pre class="log-line ${this.getLogLineClass(line)}">${line}</pre>
              `)}
            </div>
          ` : html`
            <div class="empty-state">
              <pm-icon name="FileText" size="lg"></pm-icon>
              <p>Waiting for output...</p>
            </div>
          `}
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-skill-output': PMSkillOutput;
  }
}
