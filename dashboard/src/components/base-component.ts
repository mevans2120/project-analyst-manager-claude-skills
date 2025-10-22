/**
 * Base component class for all dashboard components
 * Provides common functionality, error handling, and lifecycle management
 */

import { LitElement, PropertyValues, css } from 'lit';
import { property, state } from 'lit/decorators.js';
import type { ErrorState, LoadingState } from '@types/common';

export class BaseComponent extends LitElement {
  /**
   * Global styles shared across all components
   */
  static styles = css`
    :host {
      display: block;
      color: var(--text-primary, #c9d1d9);
      font-family: var(--font-family, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif);
    }

    .loading {
      display: flex;
      align-items: center;
      justify-content: center;
      padding: var(--spacing-xl, 32px);
      color: var(--text-secondary, #8b949e);
    }

    .error {
      background: rgba(248, 81, 73, 0.1);
      border: 1px solid var(--error, #f85149);
      border-radius: var(--radius-md, 6px);
      padding: var(--spacing-md, 16px);
      color: var(--error, #f85149);
      margin: var(--spacing-md, 16px) 0;
    }

    .error-message {
      font-weight: 500;
      margin-bottom: var(--spacing-sm, 8px);
    }

    .error-details {
      font-size: 13px;
      opacity: 0.8;
      font-family: var(--font-mono, monospace);
    }

    .hidden {
      display: none;
    }
  `;

  /**
   * Loading state
   */
  @property({ type: String })
  loadingState: LoadingState = 'idle';

  /**
   * Error state
   */
  @state()
  protected error: ErrorState | null = null;

  /**
   * Component mounted timestamp
   */
  @state()
  protected mountedAt: number = 0;

  /**
   * Lifecycle: Component connected to DOM
   */
  connectedCallback(): void {
    super.connectedCallback();
    this.mountedAt = Date.now();
    this.onMount();
  }

  /**
   * Lifecycle: Component disconnected from DOM
   */
  disconnectedCallback(): void {
    super.disconnectedCallback();
    this.onUnmount();
  }

  /**
   * Lifecycle: Properties changed
   */
  updated(changedProperties: PropertyValues): void {
    super.updated(changedProperties);
    this.onUpdate(changedProperties);
  }

  /**
   * Hook: Called when component mounts
   * Override in child components for initialization logic
   */
  protected onMount(): void {
    // Override in child components
  }

  /**
   * Hook: Called when component unmounts
   * Override in child components for cleanup logic
   */
  protected onUnmount(): void {
    // Override in child components
  }

  /**
   * Hook: Called when properties update
   * Override in child components for update logic
   */
  protected onUpdate(_changedProperties: PropertyValues): void {
    // Override in child components
  }

  /**
   * Handle errors gracefully
   */
  protected handleError(error: Error | string, details?: any): void {
    const errorState: ErrorState = {
      message: typeof error === 'string' ? error : error.message,
      details: details || (typeof error === 'object' ? error : undefined),
    };

    this.error = errorState;
    this.loadingState = 'error';

    // Log to console in development
    if (import.meta.env.DEV) {
      console.error('Component error:', errorState);
    }

    // Dispatch error event for parent components
    this.dispatchEvent(
      new CustomEvent('component-error', {
        detail: errorState,
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Clear error state
   */
  protected clearError(): void {
    this.error = null;
    if (this.loadingState === 'error') {
      this.loadingState = 'idle';
    }
  }

  /**
   * Set loading state
   */
  protected setLoading(loading: boolean): void {
    this.loadingState = loading ? 'loading' : 'idle';
  }

  /**
   * Set success state
   */
  protected setSuccess(): void {
    this.loadingState = 'success';
    this.clearError();
  }

  /**
   * Check if component is loading
   */
  protected get isLoading(): boolean {
    return this.loadingState === 'loading';
  }

  /**
   * Check if component has error
   */
  protected get hasError(): boolean {
    return this.error !== null;
  }

  /**
   * Emit custom event
   */
  protected emit<T = any>(eventName: string, detail?: T): void {
    this.dispatchEvent(
      new CustomEvent(eventName, {
        detail,
        bubbles: true,
        composed: true,
      })
    );
  }

  /**
   * Safe async operation wrapper
   * Automatically handles loading states and errors
   */
  protected async withLoading<T>(
    operation: () => Promise<T>,
    errorMessage?: string
  ): Promise<T | null> {
    this.setLoading(true);
    this.clearError();

    try {
      const result = await operation();
      this.setSuccess();
      return result;
    } catch (error) {
      this.handleError(
        errorMessage || (error instanceof Error ? error : new Error('Operation failed')),
        error
      );
      return null;
    }
  }

  /**
   * Debounce helper
   */
  protected debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: ReturnType<typeof setTimeout>;

    return (...args: Parameters<T>) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func.apply(this, args), wait);
    };
  }

  /**
   * Format date for display
   */
  protected formatDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString();
  }

  /**
   * Get time ago string
   */
  protected getTimeAgo(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
}
