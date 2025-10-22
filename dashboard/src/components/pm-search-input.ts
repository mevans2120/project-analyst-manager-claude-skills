/**
 * Search input component with debouncing
 */

import { html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { BaseComponent } from './base-component';
import './pm-icon';

@customElement('pm-search-input')
export class PMSearchInput extends BaseComponent {
  @property({ type: String })
  placeholder = 'Search...';

  @property({ type: String })
  label = 'Search';

  @property({ type: Number })
  debounceMs = 300;

  @property({ type: String })
  value = '';

  @state()
  private internalValue = '';

  private debouncedSearch: ((...args: any[]) => void) | null = null;

  connectedCallback(): void {
    super.connectedCallback();
    this.debouncedSearch = this.debounce((value: string) => {
      this.emit('search', { value });
    }, this.debounceMs);
  }

  static styles = [
    BaseComponent.styles,
    css`
      .search-container {
        position: relative;
        display: flex;
        align-items: center;
      }

      .search-input {
        width: 100%;
        background: var(--bg-primary, #0d1117);
        color: var(--text-primary, #c9d1d9);
        border: 1px solid var(--border-primary, #30363d);
        padding: 8px 12px 8px 36px;
        border-radius: var(--radius-md, 6px);
        font-size: 14px;
        font-family: var(--font-family);
        transition: all 0.2s;
      }

      .search-input:focus {
        outline: none;
        border-color: var(--link, #58a6ff);
        box-shadow: 0 0 0 3px rgba(88, 166, 255, 0.1);
      }

      .search-input::placeholder {
        color: var(--text-tertiary, #6e7681);
      }

      .search-icon {
        position: absolute;
        left: 12px;
        color: var(--text-secondary, #8b949e);
        pointer-events: none;
      }

      .clear-btn {
        position: absolute;
        right: 8px;
        background: none;
        border: none;
        color: var(--text-secondary, #8b949e);
        cursor: pointer;
        padding: 4px;
        opacity: 0.7;
        transition: opacity 0.2s;
        font-size: 16px;
        border-radius: var(--radius-sm, 4px);
      }

      .clear-btn:hover {
        opacity: 1;
      }

      .clear-btn:focus {
        outline: 2px solid var(--link, #58a6ff);
        outline-offset: 2px;
        opacity: 1;
      }

      .clear-btn:focus:not(:focus-visible) {
        outline: none;
      }

      .clear-btn:focus-visible {
        outline: 2px solid var(--link, #58a6ff);
        outline-offset: 2px;
      }
    `
  ];

  private handleInput(e: Event): void {
    const input = e.target as HTMLInputElement;
    this.internalValue = input.value;
    this.value = input.value;

    if (this.debouncedSearch) {
      this.debouncedSearch(input.value);
    }
  }

  private handleClear(): void {
    this.internalValue = '';
    this.value = '';
    this.emit('search', { value: '' });
    this.emit('clear');

    // Focus the input after clearing
    const input = this.shadowRoot?.querySelector('input');
    input?.focus();
  }

  render() {
    return html`
      <div class="search-container">
        <span class="search-icon">
          <pm-icon name="Search" size="sm" color="var(--text-secondary, #8b949e)"></pm-icon>
        </span>
        <input
          class="search-input"
          type="text"
          .value="${this.internalValue}"
          placeholder="${this.placeholder}"
          aria-label="${this.label}"
          @input="${this.handleInput}"
        />
        ${this.internalValue ? html`
          <button
            class="clear-btn"
            @click="${this.handleClear}"
            aria-label="Clear search"
            title="Clear search"
          >
            ×
          </button>
        ` : ''}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'pm-search-input': PMSearchInput;
  }
}
