/**
 * Main feature detector - analyzes planning documents and verifies implementation
 */

import * as fs from 'fs';
import * as path from 'path';
import {
  PlanningDocument,
  Feature,
  FeatureDetection,
  ImplementationReport,
  ImplementationEvidence,
  parsePlanningDocument,
  findPlanningDocuments,
  checkFileExists,
  searchForKeywords,
  findImportUsage,
  findTestFiles,
  extractKeywords,
  calculateImplementationConfidence,
  determineStatus,
  generateRecommendation
} from './featureDetection';

export interface DetectionOptions {
  rootPath: string;
  planningPaths?: string[]; // Specific directories to search for plans
  minConfidence?: number; // Minimum confidence to report (default: 0)
  includeChecked?: boolean; // Include features already checked (default: false)
}

/**
 * Analyze a single feature for implementation evidence
 */
export async function detectFeatureImplementation(
  feature: Feature,
  planDocument: PlanningDocument,
  rootPath: string
): Promise<FeatureDetection> {
  const evidence: ImplementationEvidence = {
    filesFound: [],
    codePatterns: [],
    testsFound: [],
    usageDetected: [],
    lastModified: undefined
  };

  // 1. Check if planned files exist
  for (const plannedFile of planDocument.files) {
    if (checkFileExists(plannedFile.path, rootPath)) {
      evidence.filesFound.push(plannedFile.path);

      // Get last modified time
      try {
        const fullPath = fs.existsSync(plannedFile.path)
          ? plannedFile.path
          : path.join(rootPath, plannedFile.path.replace(/^\//, ''));

        if (fs.existsSync(fullPath)) {
          const stats = fs.statSync(fullPath);
          if (!evidence.lastModified || stats.mtime > evidence.lastModified) {
            evidence.lastModified = stats.mtime;
          }
        }
      } catch (error) {
        // Ignore stat errors
      }
    }
  }

  // 2. Extract keywords from feature description and search for them
  const keywords = extractKeywords(feature.description);
  if (keywords.length > 0) {
    evidence.codePatterns = searchForKeywords(keywords, rootPath);
  }

  // 3. If feature mentions a component name, look for imports
  const componentMatch = feature.description.match(/([A-Z][a-zA-Z0-9]+(?:Component|Loader|Image|Header)?)/);
  if (componentMatch) {
    const componentName = componentMatch[1];
    evidence.usageDetected = findImportUsage(componentName, rootPath);
    evidence.testsFound = findTestFiles(componentName, rootPath);
  }

  // 4. Calculate confidence and status
  const confidence = calculateImplementationConfidence(evidence, feature.description, rootPath);
  const status = determineStatus(confidence);

  // 5. Create detection result
  const detection: FeatureDetection = {
    feature,
    planDocument: planDocument.path,
    status,
    confidence,
    evidence,
    recommendation: ''
  };

  detection.recommendation = generateRecommendation(detection);

  return detection;
}

/**
 * Analyze all planning documents and detect feature implementation
 */
export async function analyzeImplementation(options: DetectionOptions): Promise<ImplementationReport> {
  const {
    rootPath,
    planningPaths = ['docs', 'memory-bank', '.'],
    minConfidence = 0,
    includeChecked = false
  } = options;

  // Find all planning documents
  const planFiles: string[] = [];
  for (const searchPath of planningPaths) {
    const fullPath = path.join(rootPath, searchPath);
    if (fs.existsSync(fullPath)) {
      planFiles.push(...findPlanningDocuments(fullPath));
    }
  }

  // Also check root directory
  planFiles.push(...findPlanningDocuments(rootPath));

  // Remove duplicates
  const uniquePlanFiles = Array.from(new Set(planFiles));

  console.log(`\n📋 Found ${uniquePlanFiles.length} planning documents`);

  // Parse all planning documents
  const planDocuments: PlanningDocument[] = [];
  for (const planFile of uniquePlanFiles) {
    const parsed = parsePlanningDocument(planFile);
    if (parsed && parsed.features.length > 0) {
      planDocuments.push(parsed);
    }
  }

  console.log(`📝 Parsed ${planDocuments.length} documents with features`);

  // Detect implementation for each feature
  const detections: FeatureDetection[] = [];
  let processedCount = 0;

  for (const planDoc of planDocuments) {
    console.log(`\n🔍 Analyzing: ${path.basename(planDoc.path)}`);

    for (const feature of planDoc.features) {
      // Skip checked features if requested
      if (!includeChecked && feature.checked) {
        continue;
      }

      const detection = await detectFeatureImplementation(feature, planDoc, rootPath);

      // Only include if meets minimum confidence
      if (detection.confidence >= minConfidence) {
        detections.push(detection);
      }

      processedCount++;

      // Progress indicator
      if (processedCount % 10 === 0) {
        console.log(`   Processed ${processedCount} features...`);
      }
    }
  }

  console.log(`\n✅ Analyzed ${processedCount} features total`);

  // Calculate summary statistics
  const summary = {
    totalFeatures: detections.length,
    implemented: detections.filter(d => d.status === 'implemented').length,
    partial: detections.filter(d => d.status === 'partial').length,
    missing: detections.filter(d => d.status === 'missing').length,
    avgConfidence: detections.length > 0
      ? Math.round(detections.reduce((sum, d) => sum + d.confidence, 0) / detections.length)
      : 0
  };

  // Group by planning document
  const byPlan = new Map<string, { total: number; implemented: number; progress: number }>();

  for (const detection of detections) {
    const planName = path.basename(detection.planDocument);
    const existing = byPlan.get(planName) || { total: 0, implemented: 0, progress: 0 };

    existing.total++;
    if (detection.status === 'implemented') {
      existing.implemented++;
    }
    existing.progress = Math.round((existing.implemented / existing.total) * 100);

    byPlan.set(planName, existing);
  }

  return {
    planDocuments,
    detections,
    summary,
    byPlan
  };
}

/**
 * Get top unimplemented features (sorted by plan progress)
 */
export function getTopUnimplementedFeatures(
  report: ImplementationReport,
  limit: number = 20
): FeatureDetection[] {
  return report.detections
    .filter(d => d.status !== 'implemented')
    .sort((a, b) => {
      // Sort by confidence (higher first) then by status
      if (a.status !== b.status) {
        const statusOrder: Record<string, number> = { partial: 0, missing: 1, implemented: 2 };
        return statusOrder[a.status] - statusOrder[b.status];
      }
      return b.confidence - a.confidence;
    })
    .slice(0, limit);
}

/**
 * Get implementation progress by plan
 */
export function getProgressByPlan(report: ImplementationReport): Array<{
  plan: string;
  total: number;
  implemented: number;
  partial: number;
  missing: number;
  progress: number;
}> {
  const planStats = new Map<string, {
    total: number;
    implemented: number;
    partial: number;
    missing: number;
  }>();

  for (const detection of report.detections) {
    const planName = path.basename(detection.planDocument);
    const stats = planStats.get(planName) || {
      total: 0,
      implemented: 0,
      partial: 0,
      missing: 0
    };

    stats.total++;
    if (detection.status === 'implemented') stats.implemented++;
    if (detection.status === 'partial') stats.partial++;
    if (detection.status === 'missing') stats.missing++;

    planStats.set(planName, stats);
  }

  return Array.from(planStats.entries())
    .map(([plan, stats]) => ({
      plan,
      ...stats,
      progress: Math.round((stats.implemented / stats.total) * 100)
    }))
    .sort((a, b) => b.progress - a.progress);
}
