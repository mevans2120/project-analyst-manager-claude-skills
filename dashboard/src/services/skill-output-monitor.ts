/**
 * SkillOutputMonitor - Stream skill execution output in real-time
 * PM-28: Real-Time Skill Output Display
 *
 * Output structure:
 *   .dashboard-actions/output/
 *     action_20251022_123456_analyze.log        - Streaming log output
 *     action_20251022_123456_analyze_progress.json  - Progress/status updates
 *
 * Usage:
 *   const monitor = new SkillOutputMonitor();
 *   monitor.watchAction('action_20251022_123456_analyze');
 *   monitor.addEventListener('output-update', (e) => {
 *     console.log('New output:', e.detail.lines);
 *   });
 */

import { FileWatcher } from './file-watcher';

export interface SkillProgress {
  current: number;
  total: number;
  message: string;
  percentage?: number;
}

export interface SkillOutputUpdate {
  actionId: string;
  lines: string[];
  progress?: SkillProgress;
  isComplete: boolean;
}

export class SkillOutputMonitor extends EventTarget {
  private fileWatcher: FileWatcher | null = null;
  private watchedActions = new Map<string, { logOffset: number; lastUpdate: number }>();
  private pollInterval = 1000; // 1 second for output updates
  private isRunning = false;

  /**
   * Start watching a specific action's output
   */
  watchAction(actionId: string): void {
    if (!this.watchedActions.has(actionId)) {
      this.watchedActions.set(actionId, {
        logOffset: 0,
        lastUpdate: Date.now()
      });
    }

    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * Stop watching a specific action
   */
  unwatchAction(actionId: string): void {
    this.watchedActions.delete(actionId);

    if (this.watchedActions.size === 0) {
      this.stop();
    }
  }

  /**
   * Stop watching all actions
   */
  stop(): void {
    if (this.fileWatcher) {
      this.fileWatcher.stop();
      this.fileWatcher = null;
    }
    this.isRunning = false;
  }

  /**
   * Start the monitoring loop
   */
  private start(): void {
    if (this.isRunning) return;

    this.isRunning = true;

    // Start file watcher
    this.fileWatcher = new FileWatcher();
    this.fileWatcher.setPollInterval(this.pollInterval);

    // Watch output directory
    this.fileWatcher.watch(['/.dashboard-actions/output/']);

    // Listen for file changes
    this.fileWatcher.addEventListener('file-changed', (() => {
      this.checkForUpdates();
    }) as EventListener);

    // Initial check
    this.checkForUpdates();
  }

  /**
   * Check all watched actions for output updates
   */
  private async checkForUpdates(): Promise<void> {
    for (const [actionId, state] of this.watchedActions) {
      try {
        // Load new log lines
        const newLines = await this.loadNewLogLines(actionId, state.logOffset);

        if (newLines.length > 0) {
          state.logOffset += newLines.length;
          state.lastUpdate = Date.now();
        }

        // Load progress info
        const progress = await this.loadProgress(actionId);

        // Dispatch update if we have new data
        if (newLines.length > 0 || progress) {
          this.dispatchOutputUpdate({
            actionId,
            lines: newLines,
            progress,
            isComplete: progress?.percentage === 100 || false
          });
        }
      } catch (error) {
        console.error(`SkillOutputMonitor: Error checking ${actionId}:`, error);
      }
    }
  }

  /**
   * Load new log lines since last offset
   */
  private async loadNewLogLines(actionId: string, offset: number): Promise<string[]> {
    try {
      const logPath = `/.dashboard-actions/output/${actionId}.log`;
      const response = await fetch(logPath, {
        cache: 'no-cache'
      });

      if (!response.ok) {
        return [];
      }

      const fullText = await response.text();
      const allLines = fullText.split('\n');

      // Return only new lines since offset
      return allLines.slice(offset).filter(line => line.trim().length > 0);
    } catch (error) {
      // File doesn't exist yet or other error
      return [];
    }
  }

  /**
   * Load progress information
   */
  private async loadProgress(actionId: string): Promise<SkillProgress | undefined> {
    try {
      const progressPath = `/.dashboard-actions/output/${actionId}_progress.json`;
      const response = await fetch(progressPath, {
        cache: 'no-cache'
      });

      if (!response.ok) {
        return undefined;
      }

      const progress: SkillProgress = await response.json();

      // Calculate percentage if not provided
      if (progress.total > 0 && !progress.percentage) {
        progress.percentage = Math.round((progress.current / progress.total) * 100);
      }

      return progress;
    } catch (error) {
      // Progress file doesn't exist or invalid JSON
      return undefined;
    }
  }

  /**
   * Get complete output for an action
   */
  async getCompleteOutput(actionId: string): Promise<string[]> {
    try {
      const logPath = `/.dashboard-actions/output/${actionId}.log`;
      const response = await fetch(logPath, {
        cache: 'no-cache'
      });

      if (!response.ok) {
        return [];
      }

      const fullText = await response.text();
      return fullText.split('\n').filter(line => line.trim().length > 0);
    } catch (error) {
      console.error('SkillOutputMonitor: Error loading complete output:', error);
      return [];
    }
  }

  /**
   * Dispatch an output-update event
   */
  private dispatchOutputUpdate(update: SkillOutputUpdate): void {
    const event = new CustomEvent<SkillOutputUpdate>('output-update', {
      detail: update
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
   * Check if monitoring is active
   */
  isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Get list of currently watched actions
   */
  getWatchedActions(): string[] {
    return Array.from(this.watchedActions.keys());
  }

  /**
   * Clear all watched actions
   */
  clearAll(): void {
    this.watchedActions.clear();
    this.stop();
  }
}
