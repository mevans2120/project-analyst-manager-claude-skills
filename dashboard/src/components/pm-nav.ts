/**
 * Navigation component
 * Provides tab navigation between different dashboard views
 */

import { html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { BaseComponent } from './base-component';
import './pm-icon';

export type NavRoute = 'roadmap' | 'queue' | 'tests';

@customElement('pm-nav')
export class PMNav extends BaseComponent {
  @property({ type: String })
  activeRoute: NavRoute = 'roadmap';

  static styles = [
    BaseComponent.styles,
    css`
      .nav {
        background: var(--bg-secondary, #161b22);
        border-bottom: 1px solid var(--border-primary, #30363d);
        padding: 0 var(--spacing-lg, 24px);
      }

      .nav-container {
        max-width: 1400px;
        margin: 0 auto;
        display: flex;
        align-items: center;
        gap: var(--spacing-md, 16px);
      }

      .nav-brand {
        color: var(--link, #58a6ff);
        font-size: 18px;
        font-weight: 600;
        padding: var(--spacing-md, 16px) 0;
        margin-right: var(--spacing-lg, 24px);
      }

      .nav-tabs {
        display: flex;
        gap: var(--spacing-xs, 4px);
      }

      .nav-tab {
        display: flex;
        align-items: center;
        gap: var(--spacing-sm, 8px);
        padding: var(--spacing-md, 16px) var(--spacing-lg, 24px);
        color: var(--text-secondary, #8b949e);
        background: none;
        border: none;
        border-bottom: 2px solid transparent;
        cursor: pointer;
        font-size: 14px;
        font-weight: 500;
        transition: all 0.2s;
        text-decoration: none;
      }

      .nav-tab:hover {
        color: var(--text-primary, #c9d1d9);
        background: rgba(88, 166, 255, 0.05);
      }

      .nav-tab.active {
        color: var(--link, #58a6ff);
        border-bottom-color: var(--link, #58a6ff);
      }

      .nav-tab:focus {
        outline: 2px solid var(--link, #58a6ff);
        outline-offset: -2px;
      }

      @media (max-width: 768px) {
        .nav {
          padding: 0 var(--spacing-md, 16px);
        }

        .nav-brand {
          font-size: 16px;
          margin-right: var(--spacing-md, 16px);
        }

        .nav-tab {
          padding: var(--spacing-md, 16px) var(--spacing-md, 16px);
          font-size: 13px;
        }
      }
    `
  ];

  private handleNavClick(route: NavRoute): void {
    this.emit('navigate', { route });
  }

  render() {
    return html`
      <nav class="nav">
        <div class="nav-container">
          <div class="nav-brand">PM Dashboard</div>

          <div class="nav-tabs">
            <button
              class="nav-tab ${this.activeRoute === 'roadmap' ? 'active' : ''}"
              @click="${() => this.handleNavClick('roadmap')}"
              aria-label="View roadmap"
            >
              <pm-icon name="Map" size="sm"></pm-icon>
              Roadmap
            </button>

            <button
              class="nav-tab ${this.activeRoute === 'queue' ? 'active' : ''}"
              @click="${() => this.handleNavClick('queue')}"
              aria-label="View priority queue"
            >
              <pm-icon name="ListOrdered" size="sm"></pm-icon>
              Priority Queue
            </button>

            <button
              class="nav-tab ${this.activeRoute === 'tests' ? 'active' : ''}"
              @click="${() => this.handleNavClick('tests')}"
              aria-label="View test results"
            >
              <pm-icon name="FileCode" size="sm"></pm-icon>
              Tests
            </button>
          </div>
        </div>
      </nav>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-nav': PMNav;
  }
}
