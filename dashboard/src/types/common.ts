/**
 * Common type definitions shared across the application
 */

export type ThemeMode = 'dark' | 'light';

export type LoadingState = 'idle' | 'loading' | 'success' | 'error';

export interface ErrorState {
  message: string;
  code?: string;
  details?: any;
}

export interface BaseComponentProps {
  loading?: boolean;
  error?: ErrorState;
}

export interface FileWatchConfig {
  files: string[];
  pollInterval?: number;
  enabled?: boolean;
}

export interface NavigationItem {
  path: string;
  label: string;
  icon?: string;
}

export interface NotificationConfig {
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration?: number;
  dismissible?: boolean;
}

export type SortDirection = 'asc' | 'desc';

export interface SortConfig<T = string> {
  field: T;
  direction: SortDirection;
}

export interface PaginationConfig {
  page: number;
  pageSize: number;
  total: number;
}
