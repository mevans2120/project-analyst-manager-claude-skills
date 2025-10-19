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

// Parse command line arguments
program.parse(process.argv);
