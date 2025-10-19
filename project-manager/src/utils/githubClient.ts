/**
 * GitHub API client wrapper
 */

import { Octokit } from '@octokit/rest';
import { IssueCreateRequest, IssueCreateResponse, GithubConfig } from '../types';

export class GitHubClient {
  private octokit: Octokit;
  private owner: string;
  private repo: string;

  constructor(config: GithubConfig) {
    const token = config.token || process.env.GITHUB_TOKEN;

    if (!token) {
      throw new Error(
        'GitHub token not found. Please set GITHUB_TOKEN environment variable or provide token in config.'
      );
    }

    this.octokit = new Octokit({ auth: token });
    this.owner = config.owner;
    this.repo = config.repo;
  }

  /**
   * Create a GitHub issue
   */
  async createIssue(request: IssueCreateRequest): Promise<IssueCreateResponse> {
    try {
      const response = await this.octokit.issues.create({
        owner: this.owner,
        repo: this.repo,
        title: request.title,
        body: request.body,
        labels: request.labels,
        assignees: request.assignees,
        milestone: request.milestone
      });

      return {
        number: response.data.number,
        html_url: response.data.html_url,
        title: response.data.title,
        state: response.data.state
      };
    } catch (error: any) {
      throw new Error(`Failed to create issue: ${error.message}`);
    }
  }

  /**
   * Check if an issue with the same title already exists
   */
  async issueExists(title: string): Promise<{ exists: boolean; issueNumber?: number; url?: string }> {
    try {
      const response = await this.octokit.issues.listForRepo({
        owner: this.owner,
        repo: this.repo,
        state: 'all',
        per_page: 100
      });

      const existingIssue = response.data.find(issue => issue.title === title);

      if (existingIssue) {
        return {
          exists: true,
          issueNumber: existingIssue.number,
          url: existingIssue.html_url
        };
      }

      return { exists: false };
    } catch (error: any) {
      console.warn(`Could not check for existing issues: ${error.message}`);
      return { exists: false };
    }
  }

  /**
   * Get repository information
   */
  async getRepoInfo(): Promise<{ name: string; fullName: string; description: string }> {
    try {
      const response = await this.octokit.repos.get({
        owner: this.owner,
        repo: this.repo
      });

      return {
        name: response.data.name,
        fullName: response.data.full_name,
        description: response.data.description || ''
      };
    } catch (error: any) {
      throw new Error(`Failed to get repo info: ${error.message}`);
    }
  }

  /**
   * List all labels in the repository
   */
  async listLabels(): Promise<string[]> {
    try {
      const response = await this.octokit.issues.listLabelsForRepo({
        owner: this.owner,
        repo: this.repo,
        per_page: 100
      });

      return response.data.map(label => label.name);
    } catch (error: any) {
      console.warn(`Could not list labels: ${error.message}`);
      return [];
    }
  }

  /**
   * Create a label if it doesn't exist
   */
  async createLabel(name: string, color: string = 'ededed', description?: string): Promise<void> {
    try {
      await this.octokit.issues.createLabel({
        owner: this.owner,
        repo: this.repo,
        name,
        color,
        description
      });
    } catch (error: any) {
      // Ignore if label already exists
      if (!error.message.includes('already_exists')) {
        console.warn(`Could not create label "${name}": ${error.message}`);
      }
    }
  }

  /**
   * Ensure all required labels exist in the repository
   */
  async ensureLabels(labels: string[]): Promise<void> {
    const existingLabels = await this.listLabels();
    const existingSet = new Set(existingLabels.map(l => l.toLowerCase()));

    const labelColors: Record<string, string> = {
      'priority-high': 'd73a4a',
      'priority-medium': 'fbca04',
      'priority-low': '0e8a16',
      'bug': 'd73a4a',
      'feature': '0075ca',
      'enhancement': 'a2eeef',
      'tech-debt': 'f9d0c4',
      'refactor': 'bfdadc',
      'documentation': '0075ca',
      'task': '7057ff',
      'action-item': 'e99695',
      'auto-created': 'bfd4f2',
      'from-todo': 'd4c5f9',
      'from-spec': 'c2e0c6',
      'from-gap': 'fef2c0',
      'from-markdown': 'f3ccff',
      'from-code': 'c5def5'
    };

    for (const label of labels) {
      if (!existingSet.has(label.toLowerCase())) {
        const color = labelColors[label] || 'ededed';
        await this.createLabel(label, color);
      }
    }
  }

  /**
   * Add labels to an existing issue
   */
  async addLabelsToIssue(issueNumber: number, labels: string[]): Promise<void> {
    try {
      await this.octokit.issues.addLabels({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        labels
      });
    } catch (error: any) {
      throw new Error(`Failed to add labels to issue #${issueNumber}: ${error.message}`);
    }
  }

  /**
   * Update an issue
   */
  async updateIssue(
    issueNumber: number,
    updates: { title?: string; body?: string; state?: 'open' | 'closed'; labels?: string[] }
  ): Promise<void> {
    try {
      await this.octokit.issues.update({
        owner: this.owner,
        repo: this.repo,
        issue_number: issueNumber,
        ...updates
      });
    } catch (error: any) {
      throw new Error(`Failed to update issue #${issueNumber}: ${error.message}`);
    }
  }
}

/**
 * Format issue title with optional prefix
 */
export function formatIssueTitle(content: string, prefix?: string, maxLength: number = 80): string {
  let title = content.trim();

  // Add prefix if provided
  if (prefix) {
    title = `${prefix} ${title}`;
  }

  // Truncate if too long
  if (title.length > maxLength) {
    title = title.substring(0, maxLength - 3) + '...';
  }

  return title;
}

/**
 * Format issue body with TODO details
 */
export function formatIssueBody(
  content: string,
  file: string,
  line: number,
  type: string,
  priority: string,
  rawText?: string
): string {
  const body: string[] = [];

  // Main content
  body.push(content);
  body.push('');

  // Metadata section
  body.push('---');
  body.push('');
  body.push('**Source Information:**');
  body.push(`- File: \`${file}\``);
  body.push(`- Line: ${line}`);
  body.push(`- Type: ${type}`);
  body.push(`- Priority: ${priority}`);
  body.push('');

  // Raw text if available
  if (rawText) {
    body.push('**Original TODO:**');
    body.push('```');
    body.push(rawText);
    body.push('```');
    body.push('');
  }

  // Footer
  body.push('---');
  body.push('');
  body.push('_This issue was automatically created by Project Manager from a TODO comment._');

  return body.join('\n');
}
