/**
 * Roadmap Persistence Service
 * Handles saving/loading roadmap state to localStorage
 */

import type { RoadmapData } from '../types/roadmap';

const STORAGE_KEY = 'pm-roadmap-state';
const VERSION_KEY = 'pm-roadmap-version';
const CURRENT_VERSION = '1.0';

export interface PersistedState {
  version: string;
  timestamp: number;
  data: RoadmapData;
}

export class RoadmapPersistence {
  /**
   * Save roadmap state to localStorage
   */
  static save(data: RoadmapData): void {
    try {
      const state: PersistedState = {
        version: CURRENT_VERSION,
        timestamp: Date.now(),
        data
      };

      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      localStorage.setItem(VERSION_KEY, CURRENT_VERSION);

      console.log('[RoadmapPersistence] Saved state to localStorage');
    } catch (error) {
      console.error('[RoadmapPersistence] Failed to save state:', error);
      // localStorage might be full or disabled
    }
  }

  /**
   * Load roadmap state from localStorage
   * Returns null if no saved state or version mismatch
   */
  static load(): RoadmapData | null {
    try {
      const storedVersion = localStorage.getItem(VERSION_KEY);
      const storedState = localStorage.getItem(STORAGE_KEY);

      if (!storedState || !storedVersion) {
        return null;
      }

      // Check version compatibility
      if (storedVersion !== CURRENT_VERSION) {
        console.warn('[RoadmapPersistence] Version mismatch, clearing old state');
        this.clear();
        return null;
      }

      const state: PersistedState = JSON.parse(storedState);

      console.log('[RoadmapPersistence] Loaded state from localStorage', {
        timestamp: new Date(state.timestamp).toLocaleString(),
        version: state.version
      });

      return state.data;
    } catch (error) {
      console.error('[RoadmapPersistence] Failed to load state:', error);
      return null;
    }
  }

  /**
   * Clear all saved state
   */
  static clear(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(VERSION_KEY);
      console.log('[RoadmapPersistence] Cleared saved state');
    } catch (error) {
      console.error('[RoadmapPersistence] Failed to clear state:', error);
    }
  }

  /**
   * Check if there is saved state
   */
  static hasSavedState(): boolean {
    return localStorage.getItem(STORAGE_KEY) !== null;
  }

  /**
   * Export current state as downloadable JSON file
   */
  static export(data: RoadmapData, filename: string = 'roadmap-export.json'): void {
    try {
      const state: PersistedState = {
        version: CURRENT_VERSION,
        timestamp: Date.now(),
        data
      };

      const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);

      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      link.click();

      URL.revokeObjectURL(url);

      console.log('[RoadmapPersistence] Exported state to file');
    } catch (error) {
      console.error('[RoadmapPersistence] Failed to export state:', error);
    }
  }

  /**
   * Import state from JSON file
   */
  static async import(file: File): Promise<RoadmapData | null> {
    try {
      const text = await file.text();
      const state: PersistedState = JSON.parse(text);

      // Validate structure
      if (!state.data || !state.version) {
        throw new Error('Invalid file format');
      }

      console.log('[RoadmapPersistence] Imported state from file');
      return state.data;
    } catch (error) {
      console.error('[RoadmapPersistence] Failed to import state:', error);
      return null;
    }
  }

  /**
   * Get timestamp of last save
   */
  static getLastSaveTime(): number | null {
    try {
      const storedState = localStorage.getItem(STORAGE_KEY);
      if (!storedState) return null;

      const state: PersistedState = JSON.parse(storedState);
      return state.timestamp;
    } catch (error) {
      return null;
    }
  }
}
