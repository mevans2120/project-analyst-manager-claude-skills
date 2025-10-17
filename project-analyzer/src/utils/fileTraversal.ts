/**
 * File traversal utility for walking through repository directories
 */

import * as fs from 'fs';
import * as path from 'path';
import { glob } from 'glob';
import ignore from 'ignore';
import { shouldScanFile } from '../core/patterns';

export interface TraversalOptions {
  rootPath: string;
  includePatterns?: string[];
  excludePatterns?: string[];
  useGitignore?: boolean;
  maxDepth?: number;
  followSymlinks?: boolean;
}

export interface FileInfo {
  path: string;
  relativePath: string;
  size: number;
  extension: string;
}

/**
 * Load gitignore patterns from a .gitignore file
 */
function loadGitignore(rootPath: string): ReturnType<typeof ignore> {
  const ig = ignore();
  const gitignorePath = path.join(rootPath, '.gitignore');

  if (fs.existsSync(gitignorePath)) {
    const gitignoreContent = fs.readFileSync(gitignorePath, 'utf-8');
    ig.add(gitignoreContent);
  }

  // Always ignore these common patterns
  ig.add([
    'node_modules/',
    '.git/',
    'dist/',
    'build/',
    'coverage/',
    '.env',
    '.env.local',
    '*.log',
    '.DS_Store',
    'Thumbs.db',
    '*.pyc',
    '__pycache__/',
    '.vscode/',
    '.idea/',
    '*.iml',
    'vendor/',
    'target/',
    '*.class',
    '*.jar',
    '*.war',
    '*.ear'
  ]);

  return ig;
}

/**
 * Check if a path should be ignored
 */
function shouldIgnore(filePath: string, ig: ReturnType<typeof ignore>, rootPath: string): boolean {
  const relativePath = path.relative(rootPath, filePath);
  return ig.ignores(relativePath);
}

/**
 * Get all files in a directory that match the criteria
 */
export async function traverseFiles(options: TraversalOptions): Promise<FileInfo[]> {
  const {
    rootPath,
    includePatterns = ['**/*'],
    excludePatterns = [],
    useGitignore = true,
    maxDepth = 10,
    followSymlinks = false
  } = options;

  // Ensure root path exists
  if (!fs.existsSync(rootPath)) {
    throw new Error(`Root path does not exist: ${rootPath}`);
  }

  // Initialize gitignore
  const ig = useGitignore ? loadGitignore(rootPath) : ignore();

  // Add exclude patterns to ignore
  if (excludePatterns.length > 0) {
    ig.add(excludePatterns);
  }

  const files: FileInfo[] = [];

  // Use glob to find files matching include patterns
  for (const pattern of includePatterns) {
    const globOptions = {
      cwd: rootPath,
      absolute: true,
      nodir: true,
      follow: followSymlinks,
      maxDepth,
      dot: true // Include dotfiles
    };

    try {
      const matches = await glob(pattern, globOptions);

      for (const filePath of matches) {
        // Check if file should be ignored
        if (shouldIgnore(filePath, ig, rootPath)) {
          continue;
        }

        // Check if file extension is scannable
        if (!shouldScanFile(filePath)) {
          continue;
        }

        // Get file stats
        try {
          const stats = fs.statSync(filePath);
          if (!stats.isFile()) {
            continue;
          }

          files.push({
            path: filePath,
            relativePath: path.relative(rootPath, filePath),
            size: stats.size,
            extension: path.extname(filePath).slice(1).toLowerCase()
          });
        } catch (error) {
          // Skip files we can't read
          console.warn(`Unable to read file: ${filePath}`);
        }
      }
    } catch (error) {
      console.error(`Error processing pattern ${pattern}:`, error);
    }
  }

  // Remove duplicates (in case patterns overlap)
  const uniqueFiles = Array.from(
    new Map(files.map(file => [file.path, file])).values()
  );

  // Sort by relative path for consistent output
  uniqueFiles.sort((a, b) => a.relativePath.localeCompare(b.relativePath));

  return uniqueFiles;
}

/**
 * Count total lines in a file
 */
export function countFileLines(filePath: string): number {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return content.split('\n').length;
  } catch (error) {
    return 0;
  }
}

/**
 * Read file content safely with size limit
 */
export function readFileSafely(filePath: string, maxSize: number = 10 * 1024 * 1024): string | null {
  try {
    const stats = fs.statSync(filePath);

    // Skip files larger than maxSize (default 10MB)
    if (stats.size > maxSize) {
      console.warn(`File too large, skipping: ${filePath} (${stats.size} bytes)`);
      return null;
    }

    return fs.readFileSync(filePath, 'utf-8');
  } catch (error) {
    console.error(`Error reading file ${filePath}:`, error);
    return null;
  }
}

/**
 * Get repository statistics
 */
export async function getRepositoryStats(rootPath: string): Promise<{
  totalFiles: number;
  totalLines: number;
  filesByExtension: Record<string, number>;
  largestFiles: FileInfo[];
}> {
  const files = await traverseFiles({ rootPath });

  let totalLines = 0;
  const filesByExtension: Record<string, number> = {};

  for (const file of files) {
    // Count lines
    totalLines += countFileLines(file.path);

    // Count by extension
    const ext = file.extension || 'no-extension';
    filesByExtension[ext] = (filesByExtension[ext] || 0) + 1;
  }

  // Get largest files
  const largestFiles = [...files]
    .sort((a, b) => b.size - a.size)
    .slice(0, 10);

  return {
    totalFiles: files.length,
    totalLines,
    filesByExtension,
    largestFiles
  };
}