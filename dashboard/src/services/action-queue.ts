/**
 * ActionQueue - Monitor and manage dashboard action requests
 * PM-27: Action Queue System
 *
 * Directory structure:
 *   .dashboard-actions/
 *     pending/     - Actions waiting to be processed
 *     processing/  - Actions currently being executed
 *     completed/   - Successfully completed actions
 *     failed/      - Failed actions with error details
 *
 * Usage:
 *   const queue = new ActionQueue();
 *   queue.start();
 *   queue.addEventListener('queue-changed', (e) => {
 *     console.log('Queue updated:', e.detail);
 *   });
 */

import type { ActionRequest, ActionStatus } from '../types/actions';
import { FileWatcher } from './file-watcher';

export interface QueueChangedEvent {
  actions: ActionRequest[];
  statusCounts: Record<ActionStatus, number>;
}

export class ActionQueue extends EventTarget {
  private fileWatcher: FileWatcher | null = null;
  private actions = new Map<string, ActionRequest>();
  private pollInterval = 2000; // 2 seconds
  private isRunning = false;

  /**
   * Start monitoring the action queue
   */
  start(): void {
    if (this.isRunning) return;

    this.isRunning = true;
    this.fileWatcher = new FileWatcher();
    this.fileWatcher.setPollInterval(this.pollInterval);

    // Watch all status directories
    this.fileWatcher.watch([
      '/.dashboard-actions/pending/',
      '/.dashboard-actions/processing/',
      '/.dashboard-actions/completed/',
      '/.dashboard-actions/failed/'
    ]);

    // Listen for file changes
    this.fileWatcher.addEventListener('file-changed', (() => {
      this.refreshQueue();
    }) as EventListener);

    // Initial load
    this.refreshQueue();
  }

  /**
   * Stop monitoring the action queue
   */
  stop(): void {
    if (this.fileWatcher) {
      this.fileWatcher.stop();
      this.fileWatcher = null;
    }
    this.isRunning = false;
  }

  /**
   * Refresh the queue by scanning all action files
   */
  private async refreshQueue(): Promise<void> {
    const statuses: ActionStatus[] = ['pending', 'processing', 'completed', 'failed'];
    const newActions = new Map<string, ActionRequest>();

    for (const status of statuses) {
      try {
        const actions = await this.loadActionsForStatus(status);
        actions.forEach(action => {
          newActions.set(action.id, action);
        });
      } catch (error) {
        console.error(`ActionQueue: Error loading ${status} actions:`, error);
      }
    }

    // Update internal state
    this.actions = newActions;

    // Dispatch change event
    this.dispatchQueueChanged();
  }

  /**
   * Load all action files for a given status
   */
  private async loadActionsForStatus(status: ActionStatus): Promise<ActionRequest[]> {
    const actions: ActionRequest[] = [];
    const dirPath = `/.dashboard-actions/${status}/`;

    try {
      // Fetch directory listing (this will fail if directory doesn't exist)
      // For now, we'll try to load known action files
      // In a real implementation, you'd use a directory listing API

      // Try to fetch a well-known index file that lists actions
      const indexResponse = await fetch(`${dirPath}index.json`, {
        cache: 'no-cache'
      });

      if (indexResponse.ok) {
        const actionIds: string[] = await indexResponse.json();

        for (const actionId of actionIds) {
          const actionResponse = await fetch(`${dirPath}${actionId}.json`, {
            cache: 'no-cache'
          });

          if (actionResponse.ok) {
            const action: ActionRequest = await actionResponse.json();
            action.status = status; // Ensure status matches directory
            actions.push(action);
          }
        }
      }
    } catch (error) {
      // Directory doesn't exist or index.json not found - this is normal
      // Just return empty array
    }

    return actions;
  }

  /**
   * Get all actions
   */
  getAllActions(): ActionRequest[] {
    return Array.from(this.actions.values()).sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });
  }

  /**
   * Get actions by status
   */
  getActionsByStatus(status: ActionStatus): ActionRequest[] {
    return this.getAllActions().filter(action => action.status === status);
  }

  /**
   * Get action counts by status
   */
  getStatusCounts(): Record<ActionStatus, number> {
    const counts: Record<ActionStatus, number> = {
      pending: 0,
      processing: 0,
      completed: 0,
      failed: 0
    };

    this.actions.forEach(action => {
      counts[action.status]++;
    });

    return counts;
  }

  /**
   * Cancel a pending action (moves it to a cancelled state)
   */
  async cancelAction(actionId: string): Promise<boolean> {
    const action = this.actions.get(actionId);
    if (!action || action.status !== 'pending') {
      return false;
    }

    try {
      // In a real implementation, you'd move the file or mark it as cancelled
      // For now, we'll just update the local state
      action.status = 'failed';
      if (!action.result) {
        action.result = { success: false, message: 'Cancelled by user' };
      }

      this.dispatchQueueChanged();
      return true;
    } catch (error) {
      console.error('ActionQueue: Error cancelling action:', error);
      return false;
    }
  }

  /**
   * Clear completed and failed actions
   */
  clearHistory(): void {
    const toKeep = new Map<string, ActionRequest>();

    this.actions.forEach(action => {
      if (action.status === 'pending' || action.status === 'processing') {
        toKeep.set(action.id, action);
      }
    });

    this.actions = toKeep;
    this.dispatchQueueChanged();
  }

  /**
   * Dispatch a queue-changed event
   */
  private dispatchQueueChanged(): void {
    const event = new CustomEvent<QueueChangedEvent>('queue-changed', {
      detail: {
        actions: this.getAllActions(),
        statusCounts: this.getStatusCounts()
      }
    });
    this.dispatchEvent(event);
  }

  /**
   * Set the polling interval (in milliseconds)
   */
  setPollInterval(interval: number): void {
    this.pollInterval = Math.max(500, interval);

    if (this.fileWatcher) {
      this.fileWatcher.setPollInterval(this.pollInterval);
    }
  }

  /**
   * Check if the queue is currently being monitored
   */
  isActive(): boolean {
    return this.isRunning;
  }
}
