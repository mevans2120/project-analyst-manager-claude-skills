#!/usr/bin/env node
/**
 * CLI for Project Manager
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { ProjectManager, loadConfig } from './index';
import { getStateStats } from './core/stateTracker';
import { formatDateForFilename } from './formatters/reportGenerator';
import { TodoItem } from './types';

const program = new Command();

program
  .name('project-manager')
  .description('Create GitHub issues from TODOs and generate reports')
  .version('1.0.0');

/**
 * Create issues command
 */
program
  .command('create-issues')
  .description('Create GitHub issues from analyzer output')
  .requiredOption('-i, --input <path>', 'Path to analyzer output JSON file')
  .option('-c, --config <path>', 'Path to configuration file', 'project-manager.config.json')
  .option('--dry-run', 'Run without creating actual issues', false)
  .option('--no-duplicates', 'Skip duplicate checking', false)
  .action(async (options) => {
    try {
      // Load configuration
      const config = loadConfig(options.config);
      const manager = new ProjectManager(config);

      // Load analyzer output
      if (!fs.existsSync(options.input)) {
        console.error(`Input file not found: ${options.input}`);
        process.exit(1);
      }

      const inputContent = fs.readFileSync(options.input, 'utf-8');
      const analyzerOutput = JSON.parse(inputContent);

      // Extract TODOs
      const todos: TodoItem[] = analyzerOutput.todos || [];

      if (todos.length === 0) {
        console.log('No TODOs found in input file.');
        process.exit(0);
      }

      console.log(`Found ${todos.length} TODOs in analyzer output.`);

      // Process TODOs
      const result = await manager.processTodos(todos, {
        checkDuplicates: options.duplicates,
        dryRun: options.dryRun
      });

      // Display results
      console.log('\n--- Results ---');
      console.log(`Total processed: ${result.totalProcessed}`);
      console.log(`Issues created: ${result.created.length}`);
      console.log(`Issues failed: ${result.failed.length}`);
      console.log(`Issues skipped: ${result.skipped.length}`);

      if (result.failed.length > 0) {
        console.log('\nFailed issues:');
        result.failed.forEach(todo => {
          console.log(`  - ${todo.content} (${todo.error})`);
        });
      }

      // Save state
      if (!options.dryRun) {
        manager.saveState();
        console.log(`\nState saved to: ${config.stateFile}`);
      }

      process.exit(result.success ? 0 : 1);
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

/**
 * Generate report command
 */
program
  .command('report')
  .description('Generate a daily report')
  .option('-c, --config <path>', 'Path to configuration file', 'project-manager.config.json')
  .option('-d, --date <date>', 'Report date (YYYY-MM-DD)', formatDateForFilename())
  .action(async (options) => {
    try {
      const config = loadConfig(options.config);
      const manager = new ProjectManager(config);

      const { reportPath } = manager.generateReport(options.date);

      console.log('Report generated successfully!');
      console.log(`Location: ${reportPath}`);
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

/**
 * Stats command
 */
program
  .command('stats')
  .description('Show state statistics')
  .option('-c, --config <path>', 'Path to configuration file', 'project-manager.config.json')
  .option('-d, --days <number>', 'Number of days to include', '7')
  .action(async (options) => {
    try {
      const config = loadConfig(options.config);
      const manager = new ProjectManager(config);

      const state = manager.getState();
      const stats = getStateStats(state, parseInt(options.days));

      console.log('\n--- Project Manager Statistics ---');
      console.log(`Period: Last ${options.days} days`);
      console.log(`\nTotal processed: ${stats.totalProcessed}`);
      console.log(`Issues created: ${stats.totalCreated}`);
      console.log(`Issues failed: ${stats.totalFailed}`);
      console.log(`Issues skipped: ${stats.totalSkipped}`);

      console.log('\nBy Priority:');
      console.log(`  High: ${stats.byPriority.high || 0}`);
      console.log(`  Medium: ${stats.byPriority.medium || 0}`);
      console.log(`  Low: ${stats.byPriority.low || 0}`);

      console.log('\nBy Type:');
      const sortedTypes = Object.entries(stats.byType).sort((a, b) => b[1] - a[1]);
      sortedTypes.forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`);
      });

      console.log(`\nRecent activity: ${stats.recentActivity.length} TODOs processed`);
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

/**
 * Run full workflow command
 * Note: This requires project-analyzer to be installed as a dependency
 * For now, use create-issues with analyzer JSON output
 */
/*
program
  .command('run')
  .description('Run full workflow: analyze + create issues + report')
  .requiredOption('-r, --repo-path <path>', 'Path to repository to analyze')
  .option('-c, --config <path>', 'Path to configuration file', 'project-manager.config.json')
  .option('--dry-run', 'Run without creating actual issues', false)
  .action(async (options) => {
    try {
      console.log('Starting full workflow...\n');
      console.log('Note: Run project-analyzer separately and use create-issues command with JSON output');
      process.exit(1);
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });
*/

/**
 * Summary command
 */
program
  .command('summary')
  .description('Generate summary report')
  .option('-c, --config <path>', 'Path to configuration file', 'project-manager.config.json')
  .option('-d, --days <number>', 'Number of days to include', '7')
  .option('-o, --output <path>', 'Output file path (optional)')
  .action(async (options) => {
    try {
      const config = loadConfig(options.config);
      const manager = new ProjectManager(config);

      const summary = manager.generateSummary(parseInt(options.days));

      if (options.output) {
        fs.writeFileSync(options.output, summary, 'utf-8');
        console.log(`Summary saved to: ${options.output}`);
      } else {
        console.log(summary);
      }
    } catch (error: any) {
      console.error('Error:', error.message);
      process.exit(1);
    }
  });

/**
 * Dashboard sync command
 */
program
  .command('check-dashboard')
  .description('Validate dashboard accuracy and recommend Next Up features')
  .option('-r, --root <path>', 'Root path of the project', process.cwd())
  .option('-o, --output <path>', 'Output file path (optional)')
  .option('--json', 'Output as JSON instead of markdown', false)
  .action(async (options) => {
    try {
      const rootPath = path.resolve(options.root);

      console.log(`🔍 Checking dashboard sync for: ${rootPath}\n`);

      // Import DashboardSync dynamically
      const { DashboardSync } = await import('./core/DashboardSync');

      // Create DashboardSync instance
      const sync = new DashboardSync(rootPath);

      // Generate report
      const report = await sync.generateReport();

      // Format output
      let output: string;
      if (options.json) {
        output = JSON.stringify(report, null, 2);
      } else {
        output = sync.formatReport(report);
      }

      // Write or print output
      if (options.output) {
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, output, 'utf-8');
        console.log(`✅ Dashboard sync report saved to: ${outputPath}`);
      } else {
        console.log(output);
      }

      // Exit with non-zero if dashboard is not up to date
      process.exit(report.upToDate ? 0 : 1);
    } catch (error: any) {
      console.error('Error:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

/**
 * Test status command
 */
program
  .command('test-status')
  .description('Display test suite health status')
  .option('-r, --root <path>', 'Root path of the project', process.cwd())
  .option('-o, --output <path>', 'Output markdown report to file (optional)')
  .option('-p, --package <name>', 'Show details for specific package (optional)')
  .option('--json', 'Output as JSON instead of formatted text', false)
  .action(async (options) => {
    try {
      const rootPath = path.resolve(options.root);
      const statusPath = path.join(rootPath, '.test-status', 'summary.json');

      // Check if test status data exists
      if (!fs.existsSync(statusPath)) {
        console.error('❌ No test status data found.');
        console.error(`   Run tests in any package to generate test data.`);
        console.error(`   Expected file: ${statusPath}`);
        process.exit(1);
      }

      // Load test status
      const statusContent = fs.readFileSync(statusPath, 'utf-8');
      const status = JSON.parse(statusContent);

      // Output JSON if requested
      if (options.json) {
        console.log(JSON.stringify(status, null, 2));
        process.exit(0);
      }

      // Format and display status
      const lastUpdated = new Date(status.lastUpdated);
      const timeAgo = getTimeAgo(lastUpdated);

      console.log('\n🧪 Test Suite Health Status\n');
      console.log(`Last updated: ${lastUpdated.toLocaleString()} (${timeAgo})`);
      console.log('─'.repeat(60));

      // Overall stats
      const overall = status.overall;
      const passRate = overall.totalTests > 0
        ? ((overall.passed / overall.totalTests) * 100).toFixed(1)
        : '0.0';

      console.log('\n📊 Overall Statistics:');
      console.log(`  Total Tests: ${overall.totalTests}`);
      console.log(`  ✅ Passed: ${overall.passed}`);
      console.log(`  ❌ Failed: ${overall.failed}`);
      console.log(`  ⏭️  Skipped: ${overall.skipped}`);
      console.log(`  📈 Pass Rate: ${passRate}%`);
      console.log(`  📦 Packages: ${overall.packagesTotal} (${overall.packagesFailing} failing)`);

      // Package details
      if (options.package) {
        // Show specific package
        const pkg = status.packages[options.package];
        if (!pkg) {
          console.error(`\n❌ Package '${options.package}' not found.`);
          console.error(`   Available packages: ${Object.keys(status.packages).join(', ')}`);
          process.exit(1);
        }

        console.log(`\n📦 Package: ${options.package}`);
        console.log('─'.repeat(60));
        displayPackageDetails(pkg, options.package);
      } else {
        // Show all packages
        console.log('\n📦 Package Details:');
        console.log('─'.repeat(60));

        const packages = Object.entries(status.packages);
        packages.forEach(([name, pkg]: [string, any]) => {
          displayPackageDetails(pkg, name);
        });
      }

      // Generate markdown report if requested
      if (options.output) {
        const report = generateTestStatusMarkdown(status);
        const outputPath = path.resolve(options.output);
        fs.writeFileSync(outputPath, report, 'utf-8');
        console.log(`\n✅ Test status report saved to: ${outputPath}`);
      }

      // Exit with error code if tests are failing
      process.exit(overall.failed > 0 ? 1 : 0);

    } catch (error: any) {
      console.error('❌ Error:', error.message);
      if (error.stack) {
        console.error(error.stack);
      }
      process.exit(1);
    }
  });

/**
 * Helper function to display package details
 */
function displayPackageDetails(pkg: any, name: string): void {
  const statusIcon = pkg.status === 'passing' ? '✅' : pkg.status === 'failing' ? '❌' : '⚠️';
  const lastRun = new Date(pkg.lastRun);
  const timeAgo = getTimeAgo(lastRun);
  const passRate = pkg.totalTests > 0
    ? ((pkg.passed / pkg.totalTests) * 100).toFixed(1)
    : '0.0';

  console.log(`\n  ${statusIcon} ${name}`);
  console.log(`     Last run: ${timeAgo}`);
  console.log(`     Tests: ${pkg.totalTests} | Passed: ${pkg.passed} | Failed: ${pkg.failed} | Skipped: ${pkg.skipped}`);
  console.log(`     Pass rate: ${passRate}% | Duration: ${pkg.duration}ms`);
}

/**
 * Helper function to get human-readable time ago
 */
function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
}

/**
 * Helper function to generate markdown report
 */
function generateTestStatusMarkdown(status: any): string {
  const lastUpdated = new Date(status.lastUpdated);
  const overall = status.overall;
  const passRate = overall.totalTests > 0
    ? ((overall.passed / overall.totalTests) * 100).toFixed(1)
    : '0.0';

  let md = `# Test Suite Health Status\n\n`;
  md += `**Last Updated**: ${lastUpdated.toLocaleString()}\n\n`;
  md += `## Overall Statistics\n\n`;
  md += `| Metric | Value |\n`;
  md += `|--------|-------|\n`;
  md += `| Total Tests | ${overall.totalTests} |\n`;
  md += `| ✅ Passed | ${overall.passed} |\n`;
  md += `| ❌ Failed | ${overall.failed} |\n`;
  md += `| ⏭️ Skipped | ${overall.skipped} |\n`;
  md += `| Pass Rate | ${passRate}% |\n`;
  md += `| Packages | ${overall.packagesTotal} |\n`;
  md += `| Failing Packages | ${overall.packagesFailing} |\n\n`;

  md += `## Package Details\n\n`;

  const packages = Object.entries(status.packages);
  packages.forEach(([name, pkg]: [string, any]) => {
    const statusIcon = pkg.status === 'passing' ? '✅' : pkg.status === 'failing' ? '❌' : '⚠️';
    const lastRun = new Date(pkg.lastRun);
    const pkgPassRate = pkg.totalTests > 0
      ? ((pkg.passed / pkg.totalTests) * 100).toFixed(1)
      : '0.0';

    md += `### ${statusIcon} ${name}\n\n`;
    md += `- **Status**: ${pkg.status}\n`;
    md += `- **Last Run**: ${lastRun.toLocaleString()}\n`;
    md += `- **Total Tests**: ${pkg.totalTests}\n`;
    md += `- **Passed**: ${pkg.passed}\n`;
    md += `- **Failed**: ${pkg.failed}\n`;
    md += `- **Skipped**: ${pkg.skipped}\n`;
    md += `- **Pass Rate**: ${pkgPassRate}%\n`;
    md += `- **Duration**: ${pkg.duration}ms\n\n`;
  });

  md += `---\n\n`;
  md += `*Generated by Project Manager Test Status Reporter*\n`;

  return md;
}

// Parse command line arguments
program.parse(process.argv);
