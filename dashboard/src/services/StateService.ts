/**
 * Reactive state management service
 * Implements Observer pattern for global state management
 */

type StateChangeCallback<T> = (newState: T, oldState: T) => void;

export class StateService<T = any> {
  private state: T;
  private listeners: Set<StateChangeCallback<T>> = new Set();

  constructor(initialState: T) {
    this.state = initialState;
  }

  /**
   * Get current state
   */
  getState(): T {
    return this.state;
  }

  /**
   * Update state and notify listeners
   */
  setState(newState: Partial<T> | T): void {
    const oldState = this.state;
    this.state = typeof newState === 'object' && newState !== null
      ? { ...this.state, ...newState }
      : newState;

    this.notifyListeners(this.state, oldState);
  }

  /**
   * Subscribe to state changes
   * Returns unsubscribe function
   */
  subscribe(callback: StateChangeCallback<T>): () => void {
    this.listeners.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  /**
   * Notify all listeners of state change
   */
  private notifyListeners(newState: T, oldState: T): void {
    this.listeners.forEach(callback => {
      try {
        callback(newState, oldState);
      } catch (error) {
        console.error('Error in state listener:', error);
      }
    });
  }

  /**
   * Clear all listeners
   */
  clearListeners(): void {
    this.listeners.clear();
  }

  /**
   * Get listener count
   */
  getListenerCount(): number {
    return this.listeners.size;
  }
}

/**
 * Create a state service with type inference
 */
export function createState<T>(initialState: T): StateService<T> {
  return new StateService(initialState);
}
