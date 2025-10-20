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
 * Calculate implementation confidence based on evidence
 */
export function calculateImplementationConfidence(evidence: ImplementationEvidence): number {
  let score = 0;
  let weight = 0;

  // Files found (highest confidence)
  if (evidence.filesFound.length > 0) {
    score += 80 * evidence.filesFound.length;
    weight += evidence.filesFound.length;
  }

  // Tests found (very high confidence)
  if (evidence.testsFound.length > 0) {
    score += 90 * evidence.testsFound.length;
    weight += evidence.testsFound.length;
  }

  // Usage detected (high confidence)
  if (evidence.usageDetected.length > 0) {
    score += 70 * Math.min(evidence.usageDetected.length, 3); // Cap at 3 usages
    weight += Math.min(evidence.usageDetected.length, 3);
  }

  // Code patterns found (medium confidence)
  if (evidence.codePatterns.length > 0) {
    const avgPatternConfidence = evidence.codePatterns.reduce((sum, p) => sum + p.confidence, 0) / evidence.codePatterns.length;
    score += avgPatternConfidence * Math.min(evidence.codePatterns.length, 5);
    weight += Math.min(evidence.codePatterns.length, 5);
  }

  const confidence = weight > 0 ? Math.min(score / weight, 100) : 0;
  return Math.round(confidence);
}

/**
 * Determine implementation status based on confidence
 */
export function determineStatus(confidence: number): 'implemented' | 'partial' | 'missing' {
  if (confidence >= 70) return 'implemented';
  if (confidence >= 40) return 'partial';
  return 'missing';
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
