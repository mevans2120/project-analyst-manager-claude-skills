/**
 * Integration Workflow - Complete Planner → Analyzer → Manager
 * PM-16: Complete Integration Workflow
 *
 * End-to-end workflow from feature planning to production validation to issue tracking.
 * Orchestrates all skills to provide comprehensive project management automation.
 */

import { CSVFeatureRegistry } from '../../../project-planner/src/core/FeatureRegistry';
import { WebDiscovery } from '../../../project-planner/src/core/WebDiscovery';
import { CodeDiscovery } from '../../../project-planner/src/core/CodeDiscovery';
import { ProductionVerifier } from '../../../project-analyzer/src/core/ProductionVerifier';
import { DeploymentWorkflow } from '../../../project-analyzer/src/core/DeploymentWorkflow';
import { createIssuesFromTodos } from '../../../project-manager/src/core/IssueCreator';
import { ScreenshotDocumenter } from '../../../project-manager/src/core/ScreenshotDocumenter';
import type { Feature } from '../../../project-planner/src/types';
import type { TodoItem, StateFile, GithubConfig } from '../../../project-manager/src/types';

export interface WorkflowConfig {
  /** Path to feature registry CSV */
  registryPath: string;
  /** GitHub configuration for issue creation */
  github: GithubConfig;
  /** Base URL for web discovery */
  baseUrl?: string;
  /** Root path for code discovery */
  codePath?: string;
  /** State file path for issue tracking */
  stateFile: string;
  /** Enable screenshot capture */
  enableScreenshots?: boolean;
  /** Screenshot options */
  screenshotOptions?: any;
}

export interface WorkflowResult {
  /** Features discovered */
  discoveredFeatures: Feature[];
  /** Features verified */
  verifiedFeatures: any[];
  /** Issues created */
  issuesCreated: number;
  /** Deployment report */
  deploymentReport?: string;
  /** Execution time in ms */
  executionTime: number;
  /** Overall status */
  status: 'success' | 'partial' | 'failure';
  /** Summary message */
  summary: string;
}

export class IntegrationWorkflow {
  private config: WorkflowConfig;
  private registry: CSVFeatureRegistry;

  constructor(config: WorkflowConfig) {
    this.config = config;
    this.registry = new CSVFeatureRegistry({
      filePath: config.registryPath,
      createIfMissing: true
    });
  }

  /**
   * Run complete workflow: Discover → Verify → Create Issues
   */
  async runComplete(): Promise<WorkflowResult> {
    const startTime = Date.now();
    const discoveredFeatures: Feature[] = [];
    const verifiedFeatures: any[] = [];
    let issuesCreated = 0;
    let deploymentReport: string | undefined;
    let status: 'success' | 'partial' | 'failure' = 'success';

    try {
      console.log('Starting Integration Workflow...');

      // Step 1: Discovery (Planner)
      console.log('\n[1/4] Feature Discovery...');
      const features = await this.discoverFeatures();
      discoveredFeatures.push(...features);
      console.log(`✓ Discovered ${features.length} features`);

      // Step 2: Verification (Analyzer)
      console.log('\n[2/4] Production Verification...');
      const verification = await this.verifyFeatures(features);
      verifiedFeatures.push(...verification.results);
      console.log(`✓ Verified ${verification.results.length} features`);

      // Step 3: Deployment Assessment (Analyzer)
      if (this.config.baseUrl) {
        console.log('\n[3/4] Deployment Assessment...');
        const deployment = await this.assessDeployment(features);
        deploymentReport = deployment.report;
        console.log(`✓ Deployment readiness: ${deployment.readiness}`);
      } else {
        console.log('\n[3/4] Deployment Assessment... SKIPPED (no baseUrl)');
      }

      // Step 4: Issue Creation (Manager)
      console.log('\n[4/4] Creating Issues for Gaps...');
      const issues = await this.createIssuesForGaps(verification.gaps);
      issuesCreated = issues.created;
      console.log(`✓ Created ${issuesCreated} issues`);

      const executionTime = Date.now() - startTime;
      const summary = this.generateSummary(
        discoveredFeatures.length,
        verifiedFeatures.length,
        issuesCreated,
        executionTime
      );

      console.log('\n' + summary);

      return {
        discoveredFeatures,
        verifiedFeatures,
        issuesCreated,
        deploymentReport,
        executionTime,
        status,
        summary
      };

    } catch (error) {
      const executionTime = Date.now() - startTime;
      console.error('Workflow failed:', error);

      return {
        discoveredFeatures,
        verifiedFeatures,
        issuesCreated,
        deploymentReport,
        executionTime,
        status: 'failure',
        summary: `Workflow failed: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * Step 1: Discover features using Planner
   */
  private async discoverFeatures(): Promise<Feature[]> {
    const features: Feature[] = [];

    // Web discovery
    if (this.config.baseUrl) {
      const webDiscovery = new WebDiscovery();
      const result = await webDiscovery.discover(this.config.baseUrl);

      // Add discovered features to registry
      for (const discovered of result.discoveredFeatures) {
        const feature: Feature = {
          id: this.generateFeatureId(discovered.name),
          name: discovered.name,
          description: discovered.description,
          category: discovered.category || 'web',
          phase: 'discovered',
          status: 'planned',
          priority: 'medium',
          dependencies: []
        };

        this.registry.addFeature(feature);
        features.push(feature);
      }

      await webDiscovery.cleanup();
    }

    // Code discovery
    if (this.config.codePath) {
      const codeDiscovery = new CodeDiscovery(this.config.codePath);
      const codeFeatures = await codeDiscovery.discoverFromCode();

      for (const discovered of codeFeatures) {
        const feature: Feature = {
          id: this.generateFeatureId(discovered.name),
          name: discovered.name,
          description: discovered.description || '',
          category: discovered.category || 'code',
          phase: 'implemented',
          status: 'in-progress',
          priority: 'medium',
          dependencies: []
        };

        this.registry.addFeature(feature);
        features.push(feature);
      }
    }

    return features;
  }

  /**
   * Step 2: Verify features in production
   */
  private async verifyFeatures(features: Feature[]): Promise<{
    results: any[];
    gaps: TodoItem[];
  }> {
    const verifier = new ProductionVerifier();
    const results: any[] = [];
    const gaps: TodoItem[] = [];

    // Convert features to verification targets
    const targets = features
      .filter(f => f.status === 'completed' || f.status === 'in-progress')
      .map(f => ({
        featureId: f.id,
        featureName: f.name,
        productionUrl: `${this.config.baseUrl}/${this.featureIdToPath(f.id)}`,
        tier1: [{ url: `${this.config.baseUrl}/${this.featureIdToPath(f.id)}` }]
      }));

    if (targets.length > 0) {
      const verificationResults = await verifier.verifyMultiple(targets);
      results.push(...verificationResults);

      // Identify gaps (features that failed verification)
      for (const result of verificationResults) {
        if (result.overall !== 'pass') {
          gaps.push({
            file: 'production-verification',
            line: 0,
            type: 'BUG',
            priority: result.overall === 'fail' ? 'high' : 'medium',
            content: `Feature "${result.featureName}" failed production verification`,
            hash: `gap-${result.featureId}`,
            rawText: `BUG: Production verification failed for ${result.featureName}`
          });
        }
      }
    }

    return { results, gaps };
  }

  /**
   * Step 3: Assess deployment readiness
   */
  private async assessDeployment(features: Feature[]): Promise<{
    readiness: string;
    report: string;
  }> {
    const workflow = new DeploymentWorkflow();

    // Convert features to verification targets with staging URLs
    const targets = features
      .filter(f => f.status === 'completed')
      .map(f => ({
        featureId: f.id,
        featureName: f.name,
        productionUrl: `${this.config.baseUrl}/${this.featureIdToPath(f.id)}`,
        stagingUrl: `${this.config.baseUrl?.replace('production', 'staging')}/${this.featureIdToPath(f.id)}`,
        tier1: [{ url: `${this.config.baseUrl}/${this.featureIdToPath(f.id)}` }]
      }));

    if (targets.length === 0) {
      return {
        readiness: 'no-features',
        report: 'No features to verify for deployment'
      };
    }

    const deploymentReport = await workflow.compareEnvironments(targets);
    const formattedReport = workflow.formatReport(deploymentReport);

    await workflow.cleanup();

    return {
      readiness: deploymentReport.overallReadiness,
      report: formattedReport
    };
  }

  /**
   * Step 4: Create issues for gaps
   */
  private async createIssuesForGaps(gaps: TodoItem[]): Promise<{
    created: number;
    failed: number;
  }> {
    if (gaps.length === 0) {
      return { created: 0, failed: 0 };
    }

    // Load state
    const fs = require('fs');
    let state: StateFile = { processedTodos: [] };
    if (fs.existsSync(this.config.stateFile)) {
      state = JSON.parse(fs.readFileSync(this.config.stateFile, 'utf-8'));
    }

    // Create screenshot documenter if enabled
    let screenshotOptions = undefined;
    if (this.config.enableScreenshots) {
      screenshotOptions = {
        enabled: true,
        outputDir: './screenshots',
        captureCode: false,
        captureUI: true,
        baseUrl: this.config.baseUrl,
        ...this.config.screenshotOptions
      };
    }

    // Create issues
    const result = await createIssuesFromTodos(gaps, state, {
      githubConfig: this.config.github,
      screenshotOptions
    });

    // Save state
    fs.writeFileSync(this.config.stateFile, JSON.stringify(state, null, 2));

    return {
      created: result.created.length,
      failed: result.failed.length
    };
  }

  /**
   * Generate workflow summary
   */
  private generateSummary(
    discovered: number,
    verified: number,
    issues: number,
    time: number
  ): string {
    const lines: string[] = [];

    lines.push('═'.repeat(60));
    lines.push('Integration Workflow Complete');
    lines.push('═'.repeat(60));
    lines.push('');
    lines.push(`✓ Features Discovered: ${discovered}`);
    lines.push(`✓ Features Verified: ${verified}`);
    lines.push(`✓ Issues Created: ${issues}`);
    lines.push(`✓ Execution Time: ${(time / 1000).toFixed(2)}s`);
    lines.push('');
    lines.push('═'.repeat(60));

    return lines.join('\n');
  }

  /**
   * Generate feature ID from name
   */
  private generateFeatureId(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Convert feature ID to URL path
   */
  private featureIdToPath(id: string): string {
    return id.replace(/-/g, '/');
  }

  /**
   * Get feature registry
   */
  getRegistry(): CSVFeatureRegistry {
    return this.registry;
  }
}
