/**
 * Main app component
 * Handles routing and navigation between views
 */

import { html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { BaseComponent } from './base-component';
import type { NavRoute } from './pm-nav';
import './pm-nav';
import './pm-roadmap';
import './pm-tests-view';

@customElement('pm-app')
export class PMApp extends BaseComponent {
  @state()
  private currentRoute: NavRoute = 'roadmap';

  connectedCallback(): void {
    super.connectedCallback();

    // Read initial route from URL hash
    this.currentRoute = this.getRouteFromHash();

    // Listen for hash changes
    window.addEventListener('hashchange', () => {
      this.currentRoute = this.getRouteFromHash();
    });
  }

  private getRouteFromHash(): NavRoute {
    const hash = window.location.hash.slice(1); // Remove #
    // Support both #tests and #/tests formats
    if (hash === 'tests' || hash === '/tests') return 'tests';
    return 'roadmap'; // Default to roadmap (empty hash, #, or #/)
  }

  private handleNavigate(e: CustomEvent): void {
    const { route } = e.detail;

    if (route === 'roadmap') {
      // Remove hash completely for roadmap - use pushState to avoid page reload
      history.pushState(null, '', window.location.pathname);
      // Manually trigger route change since hashchange won't fire
      this.currentRoute = 'roadmap';
      // Force a re-render to ensure the component updates
      this.requestUpdate();
    } else {
      // Use hash for other routes
      window.location.hash = route;
    }
  }

  static styles = [
    BaseComponent.styles,
    css`
      :host {
        display: block;
        min-height: 100vh;
        background: var(--bg-primary, #0d1117);
      }

      .view-container {
        min-height: calc(100vh - 57px);
      }
    `
  ];

  render() {
    return html`
      <pm-nav
        activeRoute="${this.currentRoute}"
        @navigate="${this.handleNavigate}"
      ></pm-nav>

      <div class="view-container">
        ${this.currentRoute === 'roadmap'
          ? html`<pm-roadmap></pm-roadmap>`
          : html`<pm-tests-view></pm-tests-view>`
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-app': PMApp;
  }
}
