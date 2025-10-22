/**
 * Deployment Workflow - Compare staging vs production
 * PM-11: Deployment Verification Workflow
 *
 * Provides deployment readiness checks by comparing staging and production environments.
 * Generates deployment reports and pre-deployment checklists.
 */

import { ProductionVerifier, VerificationTarget, VerificationResult, VerificationOptions } from './ProductionVerifier';

export interface DeploymentComparison {
  featureId: string;
  featureName: string;
  stagingResult: VerificationResult;
  productionResult: VerificationResult;
  differences: Difference[];
  deploymentReady: boolean;
  riskLevel: 'low' | 'medium' | 'high';
  recommendations: string[];
}

export interface Difference {
  category: 'tier1' | 'tier2' | 'tier3';
  type: 'new_pass' | 'new_fail' | 'status_change' | 'no_change';
  description: string;
  impact: 'positive' | 'negative' | 'neutral';
}

export interface DeploymentReport {
  timestamp: string;
  comparisons: DeploymentComparison[];
  overallReadiness: 'ready' | 'caution' | 'not_ready';
  summary: {
    totalFeatures: number;
    ready: number;
    caution: number;
    notReady: number;
    lowRisk: number;
    mediumRisk: number;
    highRisk: number;
  };
  recommendations: string[];
}

export class DeploymentWorkflow {
  private verifier: ProductionVerifier;

  constructor() {
    this.verifier = new ProductionVerifier();
  }

  /**
   * Compare staging and production environments
   */
  async compareEnvironments(
    targets: VerificationTarget[],
    options: VerificationOptions = {}
  ): Promise<DeploymentReport> {
    const comparisons: DeploymentComparison[] = [];

    for (const target of targets) {
      try {
        // Verify staging
        const stagingTarget = { ...target, productionUrl: target.stagingUrl || target.productionUrl };
        const stagingResult = await this.verifier.verify(stagingTarget, options);
        stagingResult.environment = 'staging';

        // Verify production
        const productionResult = await this.verifier.verify(target, options);

        // Compare results
        const comparison = this.compareResults(stagingResult, productionResult);
        comparisons.push(comparison);

      } catch (error) {
        console.error(`Failed to compare ${target.featureId}:`, error);
      }
    }

    // Generate overall report
    return this.generateDeploymentReport(comparisons);
  }

  /**
   * Compare staging and production results
   */
  private compareResults(
    stagingResult: VerificationResult,
    productionResult: VerificationResult
  ): DeploymentComparison {
    const differences: Difference[] = [];

    // Compare Tier 1
    const tier1Diff = this.compareTiers(
      stagingResult.tier1,
      productionResult.tier1,
      'tier1'
    );
    differences.push(...tier1Diff);

    // Compare Tier 2
    const tier2Diff = this.compareTiers(
      stagingResult.tier2,
      productionResult.tier2,
      'tier2'
    );
    differences.push(...tier2Diff);

    // Compare Tier 3
    const tier3Diff = this.compareTiers(
      stagingResult.tier3,
      productionResult.tier3,
      'tier3'
    );
    differences.push(...tier3Diff);

    // Assess deployment readiness
    const { deploymentReady, riskLevel, recommendations } = this.assessDeploymentReadiness(
      differences,
      stagingResult,
      productionResult
    );

    return {
      featureId: stagingResult.featureId,
      featureName: stagingResult.featureName,
      stagingResult,
      productionResult,
      differences,
      deploymentReady,
      riskLevel,
      recommendations
    };
  }

  /**
   * Compare tier results
   */
  private compareTiers(
    stagingTier: any,
    productionTier: any,
    category: 'tier1' | 'tier2' | 'tier3'
  ): Difference[] {
    const differences: Difference[] = [];

    // Status changed
    if (stagingTier.status !== productionTier.status) {
      const improved = (stagingTier.status === 'pass' && productionTier.status !== 'pass') ||
                      (stagingTier.status === 'partial' && productionTier.status === 'fail');

      differences.push({
        category,
        type: 'status_change',
        description: `Status changed from ${productionTier.status} to ${stagingTier.status}`,
        impact: improved ? 'positive' : 'negative'
      });
    }

    // New passes
    const newPasses = stagingTier.passed - productionTier.passed;
    if (newPasses > 0) {
      differences.push({
        category,
        type: 'new_pass',
        description: `${newPasses} new checks passing in staging`,
        impact: 'positive'
      });
    }

    // New failures
    const newFailures = stagingTier.failed - productionTier.failed;
    if (newFailures > 0) {
      differences.push({
        category,
        type: 'new_fail',
        description: `${newFailures} new checks failing in staging`,
        impact: 'negative'
      });
    }

    return differences;
  }

  /**
   * Assess deployment readiness
   */
  private assessDeploymentReadiness(
    differences: Difference[],
    stagingResult: VerificationResult,
    productionResult: VerificationResult
  ): {
    deploymentReady: boolean;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    let deploymentReady = true;
    let riskLevel: 'low' | 'medium' | 'high' = 'low';

    // Check if staging is worse than production
    const negativeDiffs = differences.filter(d => d.impact === 'negative');
    if (negativeDiffs.length > 0) {
      riskLevel = negativeDiffs.length > 2 ? 'high' : 'medium';
      deploymentReady = false;
      recommendations.push('Fix failing checks in staging before deploying');
    }

    // Check overall staging status
    if (stagingResult.overall === 'fail') {
      deploymentReady = false;
      riskLevel = 'high';
      recommendations.push('Staging verification failed - do not deploy');
    } else if (stagingResult.overall === 'partial') {
      riskLevel = riskLevel === 'high' ? 'high' : 'medium';
      recommendations.push('Some checks failing in staging - review before deploying');
    }

    // Check for regressions
    if (productionResult.overall === 'pass' && stagingResult.overall !== 'pass') {
      deploymentReady = false;
      riskLevel = 'high';
      recommendations.push('Regression detected - staging is worse than production');
    }

    // Positive feedback
    if (deploymentReady && differences.some(d => d.impact === 'positive')) {
      recommendations.push('Deployment will improve feature functionality');
    }

    if (deploymentReady && differences.length === 0) {
      recommendations.push('No changes detected - safe to deploy');
    }

    return { deploymentReady, riskLevel, recommendations };
  }

  /**
   * Generate deployment report
   */
  private generateDeploymentReport(comparisons: DeploymentComparison[]): DeploymentReport {
    const ready = comparisons.filter(c => c.deploymentReady).length;
    const caution = comparisons.filter(c => !c.deploymentReady && c.riskLevel === 'medium').length;
    const notReady = comparisons.filter(c => !c.deploymentReady && c.riskLevel === 'high').length;

    const lowRisk = comparisons.filter(c => c.riskLevel === 'low').length;
    const mediumRisk = comparisons.filter(c => c.riskLevel === 'medium').length;
    const highRisk = comparisons.filter(c => c.riskLevel === 'high').length;

    // Overall readiness
    let overallReadiness: 'ready' | 'caution' | 'not_ready';
    if (notReady > 0 || highRisk > 0) {
      overallReadiness = 'not_ready';
    } else if (caution > 0 || mediumRisk > 0) {
      overallReadiness = 'caution';
    } else {
      overallReadiness = 'ready';
    }

    // Collect all recommendations
    const allRecommendations = comparisons.flatMap(c => c.recommendations);
    const uniqueRecommendations = Array.from(new Set(allRecommendations));

    return {
      timestamp: new Date().toISOString(),
      comparisons,
      overallReadiness,
      summary: {
        totalFeatures: comparisons.length,
        ready,
        caution,
        notReady,
        lowRisk,
        mediumRisk,
        highRisk
      },
      recommendations: uniqueRecommendations
    };
  }

  /**
   * Format deployment report as markdown
   */
  formatReport(report: DeploymentReport): string {
    const lines: string[] = [];

    lines.push('# Deployment Readiness Report');
    lines.push('');
    lines.push(`**Generated**: ${report.timestamp}`);
    lines.push(`**Overall Status**: ${this.getStatusEmoji(report.overallReadiness)} ${report.overallReadiness.toUpperCase()}`);
    lines.push('');

    // Summary
    lines.push('## Summary');
    lines.push('');
    lines.push(`- ✅ Ready to Deploy: ${report.summary.ready}`);
    lines.push(`- ⚠️  Deploy with Caution: ${report.summary.caution}`);
    lines.push(`- ❌ Not Ready: ${report.summary.notReady}`);
    lines.push(`- **Total Features**: ${report.summary.totalFeatures}`);
    lines.push('');
    lines.push('### Risk Assessment');
    lines.push(`- 🟢 Low Risk: ${report.summary.lowRisk}`);
    lines.push(`- 🟡 Medium Risk: ${report.summary.mediumRisk}`);
    lines.push(`- 🔴 High Risk: ${report.summary.highRisk}`);
    lines.push('');

    // Recommendations
    if (report.recommendations.length > 0) {
      lines.push('## Recommendations');
      lines.push('');
      for (const rec of report.recommendations) {
        lines.push(`- ${rec}`);
      }
      lines.push('');
    }

    // Individual feature comparisons
    lines.push('## Feature Comparisons');
    lines.push('');

    for (const comparison of report.comparisons) {
      const statusIcon = comparison.deploymentReady ? '✅' : '❌';
      const riskIcon = this.getRiskEmoji(comparison.riskLevel);

      lines.push(`### ${statusIcon} ${comparison.featureName}`);
      lines.push('');
      lines.push(`**Feature ID**: ${comparison.featureId}`);
      lines.push(`**Deployment Ready**: ${comparison.deploymentReady ? 'Yes' : 'No'}`);
      lines.push(`**Risk Level**: ${riskIcon} ${comparison.riskLevel.toUpperCase()}`);
      lines.push('');

      // Environment comparison table
      lines.push('| Environment | Tier 1 | Tier 2 | Tier 3 | Overall |');
      lines.push('| --- | --- | --- | --- | --- |');

      const stagingRow = [
        'Staging',
        `${comparison.stagingResult.tier1.passed}/${comparison.stagingResult.tier1.total}`,
        `${comparison.stagingResult.tier2.passed}/${comparison.stagingResult.tier2.total}`,
        `${comparison.stagingResult.tier3.passed}/${comparison.stagingResult.tier3.total}`,
        comparison.stagingResult.overall
      ].join(' | ');

      const productionRow = [
        'Production',
        `${comparison.productionResult.tier1.passed}/${comparison.productionResult.tier1.total}`,
        `${comparison.productionResult.tier2.passed}/${comparison.productionResult.tier2.total}`,
        `${comparison.productionResult.tier3.passed}/${comparison.productionResult.tier3.total}`,
        comparison.productionResult.overall
      ].join(' | ');

      lines.push(`| ${stagingRow} |`);
      lines.push(`| ${productionRow} |`);
      lines.push('');

      // Differences
      if (comparison.differences.length > 0) {
        lines.push('**Changes:**');
        for (const diff of comparison.differences) {
          const impactIcon = diff.impact === 'positive' ? '⬆️' : diff.impact === 'negative' ? '⬇️' : '➡️';
          lines.push(`- ${impactIcon} ${diff.description}`);
        }
        lines.push('');
      }

      // Recommendations for this feature
      if (comparison.recommendations.length > 0) {
        lines.push('**Recommendations:**');
        for (const rec of comparison.recommendations) {
          lines.push(`- ${rec}`);
        }
        lines.push('');
      }

      lines.push('---');
      lines.push('');
    }

    return lines.join('\n');
  }

  /**
   * Get status emoji
   */
  private getStatusEmoji(status: 'ready' | 'caution' | 'not_ready'): string {
    switch (status) {
      case 'ready': return '✅';
      case 'caution': return '⚠️';
      case 'not_ready': return '❌';
    }
  }

  /**
   * Get risk emoji
   */
  private getRiskEmoji(risk: 'low' | 'medium' | 'high'): string {
    switch (risk) {
      case 'low': return '🟢';
      case 'medium': return '🟡';
      case 'high': return '🔴';
    }
  }

  /**
   * Cleanup
   */
  async cleanup(): Promise<void> {
    // ProductionVerifier cleanup is handled internally
  }
}
