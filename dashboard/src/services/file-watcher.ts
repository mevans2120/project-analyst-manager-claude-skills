/**
 * FileWatcher - Auto-reload dashboard state when files change
 * PM-25: File System Watcher for Auto-Sync
 *
 * Usage:
 *   const watcher = new FileWatcher();
 *   watcher.watch(['/data.js', '/.test-status/summary.json']);
 *   watcher.addEventListener('file-changed', (e) => {
 *     console.log('File changed:', e.detail.file);
 *   });
 */

export interface FileChangedEvent {
  file: string;
  lastModified: number;
}

export class FileWatcher extends EventTarget {
  private watchedFiles = new Map<string, number>();
  private pollInterval = 1000; // 1 second
  private intervalId: number | null = null;
  private isRunning = false;

  /**
   * Start watching files for changes
   * @param files - Array of file paths to watch (relative to app root)
   */
  watch(files: string[]) {
    files.forEach(file => {
      if (!this.watchedFiles.has(file)) {
        this.watchedFiles.set(file, Date.now());
      }
    });

    if (!this.isRunning) {
      this.start();
    }
  }

  /**
   * Stop watching a specific file
   * @param file - File path to stop watching
   */
  unwatch(file: string) {
    this.watchedFiles.delete(file);

    if (this.watchedFiles.size === 0) {
      this.stop();
    }
  }

  /**
   * Stop watching all files
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      this.isRunning = false;
    }
  }

  /**
   * Start the polling loop
   */
  private start() {
    if (this.isRunning) return;

    this.isRunning = true;

    this.intervalId = window.setInterval(async () => {
      await this.checkFiles();
    }, this.pollInterval);
  }

  /**
   * Check all watched files for modifications
   */
  private async checkFiles() {
    for (const [file, lastModified] of this.watchedFiles) {
      try {
        const response = await fetch(file, {
          method: 'HEAD',
          cache: 'no-cache'
        });

        if (!response.ok) {
          console.warn(`FileWatcher: Failed to check ${file}:`, response.statusText);
          continue;
        }

        const lastModifiedHeader = response.headers.get('Last-Modified');
        if (!lastModifiedHeader) {
          // If no Last-Modified header, try using ETag or fall back to always refreshing
          const etag = response.headers.get('ETag');
          if (etag) {
            // Use ETag as a simple change detector
            const stored = this.watchedFiles.get(file);
            if (stored !== etag.hashCode()) {
              this.watchedFiles.set(file, etag.hashCode());
              this.dispatchFileChanged(file, Date.now());
            }
          }
          continue;
        }

        const newModified = new Date(lastModifiedHeader).getTime();

        if (newModified > lastModified) {
          this.watchedFiles.set(file, newModified);
          this.dispatchFileChanged(file, newModified);
        }
      } catch (error) {
        console.error(`FileWatcher: Error checking ${file}:`, error);
      }
    }
  }

  /**
   * Dispatch a file-changed event
   */
  private dispatchFileChanged(file: string, lastModified: number) {
    const event = new CustomEvent<FileChangedEvent>('file-changed', {
      detail: { file, lastModified }
    });
    this.dispatchEvent(event);
  }

  /**
   * Get the list of currently watched files
   */
  getWatchedFiles(): string[] {
    return Array.from(this.watchedFiles.keys());
  }

  /**
   * Set the polling interval (in milliseconds)
   * @param interval - Polling interval in ms (minimum 500ms)
   */
  setPollInterval(interval: number) {
    if (interval < 500) {
      console.warn('FileWatcher: Minimum poll interval is 500ms');
      interval = 500;
    }

    this.pollInterval = interval;

    // Restart if currently running
    if (this.isRunning) {
      this.stop();
      this.start();
    }
  }
}

// Helper: Simple hash code for strings (for ETag comparison)
declare global {
  interface String {
    hashCode(): number;
  }
}

String.prototype.hashCode = function(): number {
  let hash = 0;
  for (let i = 0; i < this.length; i++) {
    const char = this.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
};
