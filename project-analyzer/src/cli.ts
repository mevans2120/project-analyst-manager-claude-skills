#!/usr/bin/env node

/**
 * Command-line interface for the Project Analyzer
 */

import { Command } from 'commander';
import * as fs from 'fs';
import * as path from 'path';
import { scanTodos, processScanResults, loadPreviousState, findNewTodos, saveState } from './core/scanner';
import { formatOutput, writeOutput, generateReportFilename, OutputFormat } from './formatters/outputFormatter';

const program = new Command();

/**
 * Get the default output directory for a project
 */
function getProjectAnalyzerDir(rootPath: string): string {
  return path.join(rootPath, '.project-analyzer');
}

/**
 * Get the default scans directory for a project
 */
function getProjectScansDir(rootPath: string): string {
  return path.join(getProjectAnalyzerDir(rootPath), 'scans');
}

/**
 * Ensure project analyzer directory exists
 */
function ensureProjectDirExists(rootPath: string): void {
  const analyzerDir = getProjectAnalyzerDir(rootPath);
  const scansDir = getProjectScansDir(rootPath);

  if (!fs.existsSync(analyzerDir)) {
    fs.mkdirSync(analyzerDir, { recursive: true });
  }
  if (!fs.existsSync(scansDir)) {
    fs.mkdirSync(scansDir, { recursive: true });
  }
}

/**
 * Generate default output path for a scan
 */
function getDefaultOutputPath(rootPath: string, format: string): string {
  const scansDir = getProjectScansDir(rootPath);
  const timestamp = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
  const extension = format === 'json' ? 'json' : format === 'csv' ? 'csv' : 'md';
  return path.join(scansDir, `scan-${timestamp}.${extension}`);
}

program
  .name('project-analyzer')
  .description('Analyze repositories to identify TODOs, specifications, and implementation gaps')
  .version('1.0.0');

// Main scan command
program
  .command('scan [path]')
  .description('Scan a repository for TODO items')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (json, markdown, github, csv, summary)', 'markdown')
  .option('-g, --group-by <grouping>', 'Group results by (file, priority, type, none)', 'file')
  .option('--include <patterns...>', 'Include file patterns (glob)')
  .option('--exclude <patterns...>', 'Exclude file patterns (glob)')
  .option('--no-gitignore', 'Don\'t use .gitignore')
  .option('--include-completed', 'Include completed tasks')
  .option('--exclude-archives', 'Exclude TODOs from archive directories')
  .option('--compact', 'Compact JSON output')
  .option('--state-file <path>', 'Path to state file for tracking processed TODOs')
  .option('--only-new', 'Only show new TODOs not in state file')
  .action(async (pathArg, options) => {
    const rootPath = path.resolve(pathArg || process.cwd());

    console.log(`🔍 Scanning repository: ${rootPath}`);
    console.log(`📝 Output format: ${options.format}`);

    try {
      // Check if path exists
      if (!fs.existsSync(rootPath)) {
        console.error(`❌ Error: Path does not exist: ${rootPath}`);
        process.exit(1);
      }

      // Ensure project analyzer directory exists
      ensureProjectDirExists(rootPath);

      // Perform scan
      const result = await scanTodos({
        rootPath,
        includePatterns: options.include,
        excludePatterns: options.exclude,
        useGitignore: options.gitignore !== false,
        includeCompleted: options.includeCompleted,
        excludeArchives: options.excludeArchives,
        groupByFile: options.groupBy === 'file'
      });

      // Process results to add IDs and hashes
      const processedResult = processScanResults(result);

      // Handle state file and new TODOs filtering
      const statePath = options.stateFile || path.join(getProjectAnalyzerDir(rootPath), 'state.json');

      if (options.stateFile || options.onlyNew) {
        const previousHashes = loadPreviousState(statePath);

        if (options.onlyNew) {
          const newTodos = findNewTodos(processedResult.todos, previousHashes);
          processedResult.todos = newTodos;
          processedResult.summary.totalTodos = newTodos.length;
          console.log(`🆕 Found ${newTodos.length} new TODO(s)`);
        }
      }

      // Always save state to track processed TODOs
      saveState(statePath, processedResult.todos);

      // Format output
      const formatted = formatOutput(processedResult, {
        format: options.format as OutputFormat,
        groupBy: options.groupBy,
        compact: options.compact
      });

      // Determine output path
      const outputPath = options.output || getDefaultOutputPath(rootPath, options.format);

      // Write output
      writeOutput(formatted, outputPath);
      console.log(`✅ Output written to: ${outputPath}`);
      console.log(`💾 State saved to: ${statePath}`);

      // Print summary to console
      console.log('\n📊 Scan Complete:');
      console.log(`   Total TODOs: ${processedResult.summary.totalTodos}`);
      console.log(`   Files scanned: ${processedResult.summary.filesScanned}`);
      console.log(`   Duration: ${processedResult.summary.scanDuration}ms`);

    } catch (error) {
      console.error('❌ Error during scan:', error);
      process.exit(1);
    }
  });

// Stats command
program
  .command('stats [path]')
  .description('Show repository statistics')
  .action(async (pathArg) => {
    const rootPath = path.resolve(pathArg || process.cwd());

    console.log(`📊 Analyzing repository: ${rootPath}`);

    try {
      const { getRepositoryStats } = await import('./utils/fileTraversal');
      const stats = await getRepositoryStats(rootPath);

      console.log('\n📈 Repository Statistics:');
      console.log(`   Total files: ${stats.totalFiles}`);
      console.log(`   Total lines: ${stats.totalLines.toLocaleString()}`);
      console.log('\n   Files by extension:');

      const sortedExtensions = Object.entries(stats.filesByExtension)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);

      for (const [ext, count] of sortedExtensions) {
        console.log(`     .${ext}: ${count}`);
      }

      console.log('\n   Largest files:');
      for (const file of stats.largestFiles.slice(0, 5)) {
        const size = (file.size / 1024).toFixed(2);
        console.log(`     ${file.relativePath} (${size} KB)`);
      }

    } catch (error) {
      console.error('❌ Error getting stats:', error);
      process.exit(1);
    }
  });

// Cleanup command - analyze completion status
program
  .command('cleanup [path]')
  .description('Analyze TODOs for completion and generate cleanup report')
  .option('-o, --output <path>', 'Output file path')
  .option('-f, --format <format>', 'Output format (json, markdown, summary)', 'markdown')
  .option('--min-confidence <number>', 'Minimum confidence level (0-100)', '70')
  .option('--exclude-archives', 'Exclude TODOs from archive directories')
  .option('--use-git', 'Use git history for enhanced detection', false)
  .action(async (pathArg, options) => {
    const rootPath = path.resolve(pathArg || process.cwd());

    console.log(`🧹 Analyzing TODOs for completion: ${rootPath}`);

    try {
      // Import completion modules
      const { analyzeCompletions, getTopCleanupCandidates } = await import('./core/completionDetector');
      const { formatCompletionReportAsMarkdown, formatCompletionSummary, formatCompletionReportAsJSON, formatCleanupCandidates } = await import('./formatters/completionFormatter');

      // Perform scan
      const result = await scanTodos({
        rootPath,
        excludeArchives: options.excludeArchives
      });

      // Analyze completions
      console.log('🔍 Analyzing completion indicators...');
      const completionReport = analyzeCompletions(result.todos, rootPath);

      // Get top cleanup candidates
      const topCandidates = getTopCleanupCandidates(completionReport, 10);

      // Format output
      let formatted: string;
      switch (options.format) {
        case 'json':
          formatted = formatCompletionReportAsJSON(completionReport);
          break;
        case 'summary':
          formatted = formatCompletionSummary(completionReport);
          break;
        default:
          formatted = formatCompletionReportAsMarkdown(completionReport);
          formatted += '\n' + formatCleanupCandidates(topCandidates);
      }

      // Write or print output
      if (options.output) {
        writeOutput(formatted, options.output);
      } else {
        console.log('\n' + formatted);
      }

      // Print summary to console
      const stats = completionReport;
      console.log('\n📊 Cleanup Analysis Complete:');
      console.log(`   Total TODOs analyzed: ${stats.totalTodos}`);
      console.log(`   Likely completed: ${stats.likelyCompleted}`);
      console.log(`   Probably completed: ${stats.probablyCompleted}`);
      console.log(`   Possibly completed: ${stats.possiblyCompleted}`);
      console.log(`   Active tasks: ${stats.activeCount}`);
      console.log(`   Potential cleanup: ${stats.likelyCompleted + stats.probablyCompleted} TODOs`);

    } catch (error) {
      console.error('❌ Error during cleanup analysis:', error);
      process.exit(1);
    }
  });

// Watch command (placeholder for future implementation)
program
  .command('watch [path]')
  .description('Watch repository for TODO changes (coming soon)')
  .action(() => {
    console.log('⏰ Watch mode coming in Phase 2!');
  });

// Generate report command
program
  .command('report [path]')
  .description('Generate a comprehensive report')
  .option('-o, --output-dir <dir>', 'Output directory for reports', './reports')
  .option('--exclude-archives', 'Exclude TODOs from archive directories')
  .action(async (pathArg, options) => {
    const rootPath = path.resolve(pathArg || process.cwd());
    const outputDir = path.resolve(options.outputDir);

    console.log(`📊 Generating comprehensive report for: ${rootPath}`);

    try {
      // Ensure output directory exists
      if (!fs.existsSync(outputDir)) {
        fs.mkdirSync(outputDir, { recursive: true });
      }

      // Perform scan
      const result = await scanTodos({
        rootPath,
        excludeArchives: options.excludeArchives
      });
      const processedResult = processScanResults(result);

      // Generate multiple formats
      const formats: OutputFormat[] = ['markdown', 'json', 'csv'];

      for (const format of formats) {
        const filename = generateReportFilename(format);
        const outputPath = path.join(outputDir, filename);
        const formatted = formatOutput(processedResult, { format, groupBy: 'priority' });
        writeOutput(formatted, outputPath);
      }

      console.log(`✅ Reports generated in: ${outputDir}`);

    } catch (error) {
      console.error('❌ Error generating report:', error);
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}