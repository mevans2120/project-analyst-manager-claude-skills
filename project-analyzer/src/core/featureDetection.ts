/**
 * Feature implementation detection
 * Analyzes planning documents and verifies implementation in code
 */

import * as fs from 'fs';
import * as path from 'path';
import { TodoItem } from './patterns';

export interface PlanningDocument {
  path: string;
  title: string;
  features: Feature[];
  files: PlannedFile[];
}

export interface Feature {
  description: string;
  line: number;
  checked: boolean;
}

export interface PlannedFile {
  path: string;
  type: 'create' | 'modify';
  mentioned: boolean;
}

export interface ImplementationEvidence {
  filesFound: string[];
  codePatterns: CodeMatch[];
  testsFound: string[];
  usageDetected: ImportUsage[];
  lastModified?: Date;
}

export interface CodeMatch {
  file: string;
  line: number;
  snippet: string;
  confidence: number;
}

export interface ImportUsage {
  file: string;
  line: number;
  importStatement: string;
}

export interface FeatureDetection {
  feature: Feature;
  planDocument: string;
  status: 'implemented' | 'partial' | 'missing';
  confidence: number; // 0-100
  evidence: ImplementationEvidence;
  recommendation: string;
}

export interface ImplementationReport {
  planDocuments: PlanningDocument[];
  detections: FeatureDetection[];
  summary: {
    totalFeatures: number;
    implemented: number;
    partial: number;
    missing: number;
    avgConfidence: number;
  };
  byPlan: Map<string, {
    total: number;
    implemented: number;
    progress: number; // percentage
  }>;
}

/**
 * Parse a planning document to extract features and file references
 */
export function parsePlanningDocument(filePath: string): PlanningDocument | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');

    // Extract title (first # heading)
    const titleMatch = content.match(/^#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1] : path.basename(filePath, '.md');

    const features: Feature[] = [];
    const files: PlannedFile[] = [];

    // Extract checklist items (features)
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Match checklist items: - [ ] or - [x]
      const checklistMatch = line.match(/^[\s-]*\[([x\s])\]\s*(.+)$/i);
      if (checklistMatch) {
        const checked = checklistMatch[1].toLowerCase() === 'x';
        const description = checklistMatch[2].trim();

        // Filter out testing/verification items (reuse logic from scanner)
        if (!isVerificationItem(description)) {
          features.push({
            description,
            line: i + 1,
            checked
          });
        }
      }

      // Extract file paths mentioned in code blocks or specific sections
      const filePathMatch = line.match(/(?:File:|Path:|`)(\/[\w\/\-\.]+(?:\.tsx?|\.jsx?|\.css|\.json))/);
      if (filePathMatch) {
        files.push({
          path: filePathMatch[1],
          type: line.includes('NEW:') ? 'create' : 'modify',
          mentioned: true
        });
      }
    }

    return {
      path: filePath,
      title,
      features,
      files
    };
  } catch (error) {
    console.error(`Error parsing planning document: ${filePath}`, error);
    return null;
  }
}

/**
 * Check if a feature description is a verification/testing item
 */
function isVerificationItem(description: string): boolean {
  const lower = description.toLowerCase();

  const verificationPatterns = [
    /^run\s+/i,
    /^test\s+/i,
    /^verify\s+/i,
    /^check\s+/i,
    /^ensure\s+/i,
    /\bpass(es)?\b/i,
    /\bno\s+errors?\b/i,
    /lighthouse\s+score/i,
    /git\s+commit/i,
    /documentation\s+updated?/i
  ];

  return verificationPatterns.some(pattern => pattern.test(lower));
}

/**
 * Find all planning documents in a directory
 */
export function findPlanningDocuments(rootPath: string): string[] {
  const planFiles: string[] = [];

  function searchDirectory(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip node_modules, .git, etc.
        if (entry.name.startsWith('.') || entry.name === 'node_modules') {
          continue;
        }

        if (entry.isDirectory()) {
          searchDirectory(fullPath);
        } else if (entry.isFile() && entry.name.endsWith('_PLAN.md')) {
          planFiles.push(fullPath);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  searchDirectory(rootPath);
  return planFiles;
}

/**
 * Check if a file exists (handles both absolute and relative paths)
 */
export function checkFileExists(filePath: string, rootPath: string): boolean {
  // Try as absolute path first
  if (fs.existsSync(filePath)) {
    return true;
  }

  // Try relative to root
  const relativePath = path.join(rootPath, filePath);
  if (fs.existsSync(relativePath)) {
    return true;
  }

  // Try without leading slash
  const withoutLeadingSlash = filePath.replace(/^\//, '');
  const altPath = path.join(rootPath, withoutLeadingSlash);
  if (fs.existsSync(altPath)) {
    return true;
  }

  return false;
}

/**
 * Search for keywords in files
 */
export function searchForKeywords(
  keywords: string[],
  rootPath: string,
  excludeDirs: string[] = ['node_modules', '.git', 'dist', 'build', '.next']
): CodeMatch[] {
  const matches: CodeMatch[] = [];

  function searchInFile(filePath: string) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      for (const keyword of keywords) {
        const regex = new RegExp(keyword, 'gi');

        for (let i = 0; i < lines.length; i++) {
          if (regex.test(lines[i])) {
            matches.push({
              file: path.relative(rootPath, filePath),
              line: i + 1,
              snippet: lines[i].trim(),
              confidence: 50 // Base confidence for keyword match
            });
          }
        }
      }
    } catch (error) {
      // Ignore read errors
    }
  }

  function searchDirectory(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        // Skip excluded directories
        if (excludeDirs.includes(entry.name)) {
          continue;
        }

        if (entry.isDirectory()) {
          searchDirectory(fullPath);
        } else if (entry.isFile()) {
          // Only search code files
          if (/\.(tsx?|jsx?|css|scss)$/i.test(entry.name)) {
            searchInFile(fullPath);
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  searchDirectory(rootPath);
  return matches;
}

/**
 * Find imports of a component/module
 */
export function findImportUsage(
  componentName: string,
  rootPath: string
): ImportUsage[] {
  const imports: ImportUsage[] = [];

  function searchInFile(filePath: string) {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      const importPatterns = [
        new RegExp(`import\\s+.*${componentName}.*from`, 'i'),
        new RegExp(`from\\s+['"].*${componentName}`, 'i'),
        new RegExp(`require\\s*\\(\\s*['"].*${componentName}`, 'i')
      ];

      for (let i = 0; i < lines.length; i++) {
        const line = lines[i];

        for (const pattern of importPatterns) {
          if (pattern.test(line)) {
            imports.push({
              file: path.relative(rootPath, filePath),
              line: i + 1,
              importStatement: line.trim()
            });
            break;
          }
        }
      }
    } catch (error) {
      // Ignore read errors
    }
  }

  function searchDirectory(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }

        if (entry.isDirectory()) {
          searchDirectory(fullPath);
        } else if (entry.isFile() && /\.(tsx?|jsx?)$/i.test(entry.name)) {
          searchInFile(fullPath);
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  searchDirectory(rootPath);
  return imports;
}

/**
 * Find test files related to a component
 */
export function findTestFiles(
  componentName: string,
  rootPath: string
): string[] {
  const testFiles: string[] = [];

  function searchDirectory(dir: string) {
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });

      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);

        if (entry.name === 'node_modules' || entry.name.startsWith('.')) {
          continue;
        }

        if (entry.isDirectory()) {
          searchDirectory(fullPath);
        } else if (entry.isFile()) {
          // Check if it's a test file mentioning the component
          if (/(\.test\.|\.spec\.|__tests__)/.test(entry.name)) {
            if (entry.name.includes(componentName) ||
                entry.name.replace(/\.(test|spec)\.(tsx?|jsx?)$/, '') === componentName) {
              testFiles.push(path.relative(rootPath, fullPath));
            }
          }
        }
      }
    } catch (error) {
      // Ignore permission errors
    }
  }

  searchDirectory(rootPath);
  return testFiles;
}

/**
 * Extract keywords from a feature description
 */
export function extractKeywords(feature: string): string[] {
  // Remove common words and extract meaningful terms
  const commonWords = ['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'];

  const words = feature
    .toLowerCase()
    .replace(/[^\w\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 3 && !commonWords.includes(word));

  // Also extract camelCase/PascalCase variations
  const keywords: Set<string> = new Set(words);

  for (const word of words) {
    // Convert to PascalCase
    const pascalCase = word.charAt(0).toUpperCase() + word.slice(1);
    keywords.add(pascalCase);

    // Convert hyphen-case to camelCase
    if (word.includes('-')) {
      const camelCase = word.replace(/-([a-z])/g, (_, letter) => letter.toUpperCase());
      keywords.add(camelCase);
    }
  }

  return Array.from(keywords);
}

/**
 * Check if files contain specific implementation patterns
 */
export function checkImplementationPatterns(
  filesFound: string[],
  featureDescription: string,
  rootPath: string
): { foundPatterns: number; totalChecked: number } {
  let foundPatterns = 0;
  let totalChecked = 0;

  // Extract keywords from feature description for pattern matching
  const keywords = extractKeywords(featureDescription);

  for (const relativePath of filesFound.slice(0, 5)) { // Check max 5 files
    try {
      // Try to construct full path
      let fullPath = relativePath;
      if (!fs.existsSync(fullPath)) {
        fullPath = path.join(rootPath, relativePath.replace(/^\//, ''));
      }

      if (!fs.existsSync(fullPath)) {
        continue;
      }

      const content = fs.readFileSync(fullPath, 'utf-8').toLowerCase();
      totalChecked++;

      // Check if file contains relevant keywords
      for (const keyword of keywords.slice(0, 3)) { // Check top 3 keywords
        if (content.includes(keyword.toLowerCase())) {
          foundPatterns++;
          break; // Count each file once
        }
      }

      // Bonus: Check for specific implementation patterns based on file type
      if (fullPath.endsWith('.css') || fullPath.endsWith('.scss')) {
        // CSS files: look for keyframes, animations
        if (content.includes('@keyframes') || content.includes('animation:')) {
          foundPatterns++;
        }
      } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.jsx')) {
        // React files: look for className, component usage
        if (content.includes('classname=') || content.includes('animate-')) {
          foundPatterns++;
        }
      } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.js')) {
        // JS/TS files: look for function definitions, exports
        if (content.includes('export') || content.includes('function')) {
          foundPatterns++;
        }
      }
    } catch (error) {
      // Ignore read errors
      continue;
    }
  }

  return { foundPatterns, totalChecked };
}

/**
 * Calculate implementation confidence based on evidence
 */
export function calculateImplementationConfidence(
  evidence: ImplementationEvidence,
  featureDescription: string = '',
  rootPath: string = ''
): number {
  // Hard evidence (files exist, tests found, actually used) = implemented
  // Only use fuzzy code patterns if we have no hard evidence

  const hasFiles = evidence.filesFound.length > 0;
  const hasTests = evidence.testsFound.length > 0;
  const hasUsage = evidence.usageDetected.length > 0;

  // NEW: Check if files contain actual implementation patterns
  let patternBonus = 0;
  if (hasFiles && rootPath && featureDescription) {
    const { foundPatterns, totalChecked } = checkImplementationPatterns(
      evidence.filesFound,
      featureDescription,
      rootPath
    );
    if (totalChecked > 0) {
      // Add up to +10 bonus for finding patterns in files
      patternBonus = Math.round((foundPatterns / totalChecked) * 10);
    }
  }

  // Strategy 1: If we have files + usage OR files + tests = very confident
  if (hasFiles && (hasUsage || hasTests)) {
    let score = 80; // Base for files existing

    if (hasUsage) {
      score += Math.min(evidence.usageDetected.length * 5, 15); // +5 per usage, max +15
    }

    if (hasTests) {
      score += 10; // +10 for test coverage
    }

    // Add pattern bonus
    score += patternBonus;

    return Math.min(score, 100);
  }

  // Strategy 2: Files exist but no usage/tests = maybe implemented, maybe unused
  if (hasFiles) {
    const baseScore = 60; // Moderate confidence - files exist but aren't clearly used
    return Math.min(baseScore + patternBonus, 80); // Can get up to 80% with patterns
  }

  // Strategy 3: No files, but lots of usage/imports = likely different file name
  if (hasUsage) {
    return 50 + Math.min(evidence.usageDetected.length * 5, 20); // Up to 70%
  }

  // Strategy 4: Only fuzzy code pattern matches = low confidence
  if (evidence.codePatterns.length > 0) {
    const avgPatternConfidence = evidence.codePatterns.reduce((sum, p) => sum + p.confidence, 0) / evidence.codePatterns.length;
    return Math.min(Math.round(avgPatternConfidence * 0.8), 40); // Max 40% for keywords alone
  }

  // Strategy 5: No evidence at all
  return 0;
}

/**
 * Determine implementation status based on confidence
 *
 * New philosophy:
 * - Status = Does it exist? (binary)
 * - Confidence = How well implemented? (quality metric)
 */
export function determineStatus(confidence: number): 'implemented' | 'partial' | 'missing' {
  if (confidence >= 40) return 'implemented'; // Any real evidence = implemented
  if (confidence > 0) return 'partial';       // Only fuzzy matches = partial
  return 'missing';                           // No evidence = missing
}

/**
 * Generate recommendation based on detection results
 */
export function generateRecommendation(detection: FeatureDetection): string {
  const { status, confidence, evidence } = detection;

  if (status === 'implemented') {
    if (evidence.testsFound.length > 0) {
      return `✅ Appears implemented with test coverage (${confidence}% confidence)`;
    }
    return `✅ Appears implemented (${confidence}% confidence) - Consider adding tests`;
  }

  if (status === 'partial') {
    if (evidence.filesFound.length > 0) {
      return `⚠️  Partially implemented (${confidence}% confidence) - Files exist but usage unclear`;
    }
    return `⚠️  Partially implemented (${confidence}% confidence) - Some code patterns found`;
  }

  return `❌ No implementation detected (${confidence}% confidence) - Feature appears missing`;
}
