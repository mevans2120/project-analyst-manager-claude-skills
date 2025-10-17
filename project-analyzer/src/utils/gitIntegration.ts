/**
 * Git integration utilities for completion detection
 */

import { execSync } from 'child_process';
import * as fs from 'fs';
import * as path from 'path';

export interface GitFileInfo {
  exists: boolean;
  lastModified: Date | null;
  commitCount: number;
  isTracked: boolean;
}

export interface GitRepoInfo {
  isGitRepo: boolean;
  currentBranch: string;
  hasRemote: boolean;
}

/**
 * Check if a directory is a git repository
 */
export function isGitRepository(dirPath: string): boolean {
  try {
    execSync('git rev-parse --git-dir', {
      cwd: dirPath,
      stdio: 'pipe'
    });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get git repository information
 */
export function getGitRepoInfo(repoPath: string): GitRepoInfo {
  if (!isGitRepository(repoPath)) {
    return {
      isGitRepo: false,
      currentBranch: '',
      hasRemote: false
    };
  }

  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: repoPath,
      encoding: 'utf-8'
    }).trim();

    const remotes = execSync('git remote', {
      cwd: repoPath,
      encoding: 'utf-8'
    }).trim();

    return {
      isGitRepo: true,
      currentBranch: branch,
      hasRemote: remotes.length > 0
    };
  } catch (error) {
    return {
      isGitRepo: true,
      currentBranch: '',
      hasRemote: false
    };
  }
}

/**
 * Get information about a file from git
 */
export function getGitFileInfo(
  repoPath: string,
  relativePath: string
): GitFileInfo {
  const defaultInfo: GitFileInfo = {
    exists: false,
    lastModified: null,
    commitCount: 0,
    isTracked: false
  };

  if (!isGitRepository(repoPath)) {
    return defaultInfo;
  }

  const fullPath = path.join(repoPath, relativePath);

  // Check if file exists
  if (!fs.existsSync(fullPath)) {
    return defaultInfo;
  }

  try {
    // Check if file is tracked
    execSync(`git ls-files --error-unmatch "${relativePath}"`, {
      cwd: repoPath,
      stdio: 'pipe'
    });

    // Get last modification date
    const lastModifiedStr = execSync(
      `git log -1 --format=%aI -- "${relativePath}"`,
      {
        cwd: repoPath,
        encoding: 'utf-8'
      }
    ).trim();

    // Get commit count
    const commitCountStr = execSync(
      `git log --oneline -- "${relativePath}" | wc -l`,
      {
        cwd: repoPath,
        encoding: 'utf-8'
      }
    ).trim();

    return {
      exists: true,
      lastModified: lastModifiedStr ? new Date(lastModifiedStr) : null,
      commitCount: parseInt(commitCountStr) || 0,
      isTracked: true
    };
  } catch (error) {
    // File exists but is not tracked
    return {
      exists: true,
      lastModified: null,
      commitCount: 0,
      isTracked: false
    };
  }
}

/**
 * Search git history for mentions of a keyword
 */
export function searchGitHistory(
  repoPath: string,
  searchTerm: string,
  maxResults: number = 10
): Array<{ commit: string; date: string; message: string }> {
  if (!isGitRepository(repoPath)) {
    return [];
  }

  try {
    const results = execSync(
      `git log --all --oneline --grep="${searchTerm}" -i --format="%h|%aI|%s" -n ${maxResults}`,
      {
        cwd: repoPath,
        encoding: 'utf-8'
      }
    ).trim();

    if (!results) {
      return [];
    }

    return results.split('\n').map(line => {
      const [commit, date, ...messageParts] = line.split('|');
      return {
        commit,
        date,
        message: messageParts.join('|')
      };
    });
  } catch (error) {
    return [];
  }
}

/**
 * Check if a feature/file pattern exists in the codebase
 */
export function checkFeatureExists(
  repoPath: string,
  featureName: string
): {
  exists: boolean;
  evidence: string[];
} {
  if (!isGitRepository(repoPath)) {
    return { exists: false, evidence: [] };
  }

  const evidence: string[] = [];

  try {
    // Search for files matching the feature name
    const filesResult = execSync(
      `git ls-files | grep -i "${featureName}" | head -5`,
      {
        cwd: repoPath,
        encoding: 'utf-8'
      }
    ).trim();

    if (filesResult) {
      evidence.push(`Files found: ${filesResult.split('\n').length}`);
    }

    // Search for commits mentioning the feature
    const commitsResult = execSync(
      `git log --all --oneline --grep="${featureName}" -i | wc -l`,
      {
        cwd: repoPath,
        encoding: 'utf-8'
      }
    ).trim();

    const commitCount = parseInt(commitsResult) || 0;
    if (commitCount > 0) {
      evidence.push(`Commits mentioning feature: ${commitCount}`);
    }

    // Search for code mentions
    try {
      const grepResult = execSync(
        `git grep -i "${featureName}" | wc -l`,
        {
          cwd: repoPath,
          encoding: 'utf-8'
        }
      ).trim();

      const mentions = parseInt(grepResult) || 0;
      if (mentions > 0) {
        evidence.push(`Code mentions: ${mentions}`);
      }
    } catch {
      // git grep might fail if no matches
    }

    return {
      exists: evidence.length > 0,
      evidence
    };
  } catch (error) {
    return { exists: false, evidence: [] };
  }
}

/**
 * Get files that haven't been modified in a long time
 */
export function getStaleFiles(
  repoPath: string,
  daysOld: number = 180
): string[] {
  if (!isGitRepository(repoPath)) {
    return [];
  }

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);
    const cutoffStr = cutoffDate.toISOString().split('T')[0];

    const result = execSync(
      `git log --all --name-only --before="${cutoffStr}" --format="%H" | grep -v "^$" | grep -v "^[0-9a-f]\\{40\\}$" | sort | uniq`,
      {
        cwd: repoPath,
        encoding: 'utf-8'
      }
    ).trim();

    return result ? result.split('\n') : [];
  } catch (error) {
    return [];
  }
}

/**
 * Extract keywords from TODO text for searching
 */
export function extractSearchKeywords(todoText: string): string[] {
  // Remove common TODO words
  let cleaned = todoText.toLowerCase()
    .replace(/\b(todo|fixme|bug|hack|note|implement|add|create|fix|update)\b/gi, '');

  // Extract meaningful words (longer than 3 characters)
  const words = cleaned.match(/\b[a-z]{4,}\b/gi) || [];

  // Get unique words
  return Array.from(new Set(words)).slice(0, 5);
}

/**
 * Enhanced completion detection using git history
 */
export function checkGitEvidence(
  repoPath: string,
  todoText: string,
  filePath: string
): {
  hasEvidence: boolean;
  confidence: number;
  evidence: string[];
} {
  const evidence: string[] = [];
  let confidence = 0;

  // Check if file has been modified recently
  const fileInfo = getGitFileInfo(repoPath, filePath);
  if (fileInfo.isTracked && fileInfo.lastModified) {
    const daysSinceModification =
      (Date.now() - fileInfo.lastModified.getTime()) / (1000 * 60 * 60 * 24);

    if (daysSinceModification > 90) {
      evidence.push(`File not modified in ${Math.round(daysSinceModification)} days`);
      confidence += 20;
    }
  }

  // Extract keywords and search git history
  const keywords = extractSearchKeywords(todoText);
  for (const keyword of keywords) {
    const commits = searchGitHistory(repoPath, keyword, 3);
    if (commits.length > 0) {
      evidence.push(`Found ${commits.length} commits mentioning "${keyword}"`);
      confidence += Math.min(commits.length * 15, 30);
    }

    // Check if feature exists in codebase
    const featureCheck = checkFeatureExists(repoPath, keyword);
    if (featureCheck.exists) {
      evidence.push(...featureCheck.evidence);
      confidence += 25;
    }
  }

  return {
    hasEvidence: evidence.length > 0,
    confidence: Math.min(confidence, 100),
    evidence
  };
}