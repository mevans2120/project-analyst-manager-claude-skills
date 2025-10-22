/**
 * Issue creator - orchestrates the creation of GitHub issues from TODOs
 */

import { TodoItem, ProcessedTodo, GithubConfig, LabelMapping, StateFile } from '../types';
import { GitHubClient, formatIssueTitle, formatIssueBody } from '../utils/githubClient';
import { determineLabels } from '../utils/labelManager';
import { generateTodoHash, addProcessedTodo } from './stateTracker';
import { ScreenshotDocumenter, ScreenshotOptions } from './ScreenshotDocumenter';

export interface IssueCreationOptions {
  githubConfig: GithubConfig;
  labelMapping?: LabelMapping;
  checkDuplicates?: boolean;
  dryRun?: boolean;
  /** Optional screenshot documenter for visual evidence */
  screenshotOptions?: ScreenshotOptions;
}

export interface IssueCreationResult {
  success: boolean;
  created: ProcessedTodo[];
  failed: ProcessedTodo[];
  skipped: ProcessedTodo[];
  totalProcessed: number;
}

/**
 * Create GitHub issues from TODOs
 */
export async function createIssuesFromTodos(
  todos: TodoItem[],
  state: StateFile,
  options: IssueCreationOptions
): Promise<IssueCreationResult> {
  const {
    githubConfig,
    labelMapping,
    checkDuplicates = true,
    dryRun = false,
    screenshotOptions
  } = options;

  const created: ProcessedTodo[] = [];
  const failed: ProcessedTodo[] = [];
  const skipped: ProcessedTodo[] = [];

  // Initialize screenshot documenter if enabled
  let screenshotDocumenter: ScreenshotDocumenter | null = null;
  if (screenshotOptions?.enabled) {
    screenshotDocumenter = new ScreenshotDocumenter(screenshotOptions);
  }

  // Initialize GitHub client (unless dry run)
  let client: GitHubClient | null = null;
  if (!dryRun) {
    try {
      client = new GitHubClient(githubConfig);
    } catch (error: any) {
      console.error('Failed to initialize GitHub client:', error.message);
      throw error;
    }
  }

  // Collect all labels that will be used
  const allLabels = new Set<string>(githubConfig.defaultLabels || []);

  for (const todo of todos) {
    const { labels } = determineLabels(todo, labelMapping, githubConfig.defaultLabels);
    labels.forEach(label => allLabels.add(label));
  }

  // Ensure all labels exist in the repository
  if (client && !dryRun) {
    try {
      await client.ensureLabels(Array.from(allLabels));
    } catch (error: any) {
      console.warn('Could not ensure labels exist:', error.message);
    }
  }

  // Process each TODO
  for (const todo of todos) {
    try {
      const hash = todo.hash || generateTodoHash(todo);

      // Determine labels
      const { labels } = determineLabels(todo, labelMapping, githubConfig.defaultLabels);

      // Format issue title and body
      const title = formatIssueTitle(
        todo.content,
        githubConfig.issueTitlePrefix
      );

      let body = formatIssueBody(
        todo.content,
        todo.file,
        todo.line,
        todo.type,
        todo.priority,
        todo.rawText
      );

      // Capture screenshots if enabled
      if (screenshotDocumenter) {
        try {
          const screenshotResult = await screenshotDocumenter.captureForTodo(todo);
          if (screenshotResult.success && screenshotResult.screenshots.length > 0) {
            const screenshotsMarkdown = screenshotDocumenter.formatScreenshotsForIssue(
              screenshotResult.screenshots
            );
            body += screenshotsMarkdown;
          }
        } catch (error: any) {
          console.warn(`Failed to capture screenshots for ${todo.file}:${todo.line}:`, error.message);
          // Continue with issue creation even if screenshots fail
        }
      }

      // Check for duplicates if enabled
      if (checkDuplicates && client && !dryRun) {
        const existing = await client.issueExists(title);
        if (existing.exists) {
          console.log(`Skipping duplicate issue: ${title}`);
          addProcessedTodo(state, todo, existing.url, existing.issueNumber, 'skipped');
          skipped.push(state.processedTodos[state.processedTodos.length - 1]);
          continue;
        }
      }

      // Create issue (or simulate in dry run)
      if (dryRun) {
        console.log(`[DRY RUN] Would create issue: ${title}`);
        console.log(`  Labels: ${labels.join(', ')}`);
        console.log(`  File: ${todo.file}:${todo.line}`);

        addProcessedTodo(
          state,
          todo,
          'https://github.com/dry-run/issue/1',
          1,
          'created'
        );
        created.push(state.processedTodos[state.processedTodos.length - 1]);
      } else if (client) {
        const response = await client.createIssue({
          title,
          body,
          labels
        });

        console.log(`Created issue #${response.number}: ${title}`);

        addProcessedTodo(
          state,
          todo,
          response.html_url,
          response.number,
          'created'
        );
        created.push(state.processedTodos[state.processedTodos.length - 1]);
      }
    } catch (error: any) {
      console.error(`Failed to create issue for TODO: ${todo.content}`, error.message);

      addProcessedTodo(
        state,
        todo,
        undefined,
        undefined,
        'failed',
        error.message
      );
      failed.push(state.processedTodos[state.processedTodos.length - 1]);
    }
  }

  // Clean up screenshot documenter resources
  if (screenshotDocumenter) {
    try {
      await screenshotDocumenter.cleanup();
    } catch (error: any) {
      console.warn('Failed to cleanup screenshot documenter:', error.message);
    }
  }

  return {
    success: failed.length === 0,
    created,
    failed,
    skipped,
    totalProcessed: todos.length
  };
}

/**
 * Create a single issue from a TODO
 */
export async function createSingleIssue(
  todo: TodoItem,
  githubConfig: GithubConfig,
  labelMapping?: LabelMapping
): Promise<{ success: boolean; issueUrl?: string; issueNumber?: number; error?: string }> {
  try {
    const client = new GitHubClient(githubConfig);

    // Determine labels
    const { labels } = determineLabels(todo, labelMapping, githubConfig.defaultLabels);

    // Ensure labels exist
    await client.ensureLabels(labels);

    // Format issue
    const title = formatIssueTitle(todo.content, githubConfig.issueTitlePrefix);
    const body = formatIssueBody(
      todo.content,
      todo.file,
      todo.line,
      todo.type,
      todo.priority,
      todo.rawText
    );

    // Create issue
    const response = await client.createIssue({ title, body, labels });

    return {
      success: true,
      issueUrl: response.html_url,
      issueNumber: response.number
    };
  } catch (error: any) {
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Batch create issues with rate limiting
 */
export async function batchCreateIssues(
  todos: TodoItem[],
  state: StateFile,
  options: IssueCreationOptions,
  batchSize: number = 10,
  delayMs: number = 1000
): Promise<IssueCreationResult> {
  const results: IssueCreationResult = {
    success: true,
    created: [],
    failed: [],
    skipped: [],
    totalProcessed: 0
  };

  // Process in batches
  for (let i = 0; i < todos.length; i += batchSize) {
    const batch = todos.slice(i, i + batchSize);

    const batchResult = await createIssuesFromTodos(batch, state, options);

    // Aggregate results
    results.created.push(...batchResult.created);
    results.failed.push(...batchResult.failed);
    results.skipped.push(...batchResult.skipped);
    results.totalProcessed += batchResult.totalProcessed;

    if (!batchResult.success) {
      results.success = false;
    }

    // Delay between batches (except for last batch)
    if (i + batchSize < todos.length) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }

  return results;
}
